# infra/environments/production/main.tf
terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.30"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

locals {
  env    = "prod"
  app    = "dispatch"
  prefix = "${local.env}-${local.app}"

  common_labels = {
    environment = local.env
    application = local.app
    managed_by  = "terraform"
    cost_center = "engineering"
  }
}

# ============================================================================
# Enable required APIs
# ============================================================================

module "apis" {
  source = "../../modules/apis"

  project_id = var.project_id
  apis = [
    "compute.googleapis.com",
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "container.googleapis.com",
    "bigquery.googleapis.com",
    "aiplatform.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "vpcaccess.googleapis.com",
    "servicenetworking.googleapis.com",
    "cloudscheduler.googleapis.com",
    "cloudtasks.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudtrace.googleapis.com",
    "billingbudgets.googleapis.com",
    "artifactregistry.googleapis.com",
    "firebase.googleapis.com",
    "fcm.googleapis.com",
  ]
}

# ============================================================================
# Networking
# ============================================================================

module "networking" {
  source = "../../modules/networking"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix
  labels     = local.common_labels

  vpc_cidr              = "10.10.0.0/16"
  subnet_cidr           = "10.10.1.0/24"
  serverless_cidr       = "10.10.2.0/28"
  enable_cloud_nat      = true
  enable_private_google = true

  depends_on = [module.apis]
}

# ============================================================================
# Service accounts (per service, least privilege)
# ============================================================================

module "iam" {
  source = "../../modules/iam"

  project_id = var.project_id
  prefix     = local.prefix

  service_accounts = {
    api = {
      account_id   = "${local.prefix}-api"
      display_name = "Dispatch API"
    }
    vendor_portal = {
      account_id   = "${local.prefix}-vendor-portal"
      display_name = "Vendor Portal (Next.js)"
    }
    customer_pwa = {
      account_id   = "${local.prefix}-customer-pwa"
      display_name = "Customer PWA (Next.js)"
    }
    worker = {
      account_id   = "${local.prefix}-worker"
      display_name = "Background Workers (BullMQ)"
    }
    gemma = {
      account_id   = "${local.prefix}-gemma"
      display_name = "Gemma Serving (GKE)"
    }
    ai_client = {
      account_id   = "${local.prefix}-ai-client"
      display_name = "AI Client (Vertex + Gemini)"
    }
  }

  depends_on = [module.apis]
}

# ============================================================================
# Cloud SQL Postgres 16 with PostGIS
# ============================================================================

module "cloud_sql" {
  source = "../../modules/cloud-sql"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix
  labels     = local.common_labels

  vpc_network_id        = module.networking.vpc_id
  private_service_range = module.networking.private_service_range

  instance_name                  = "${local.prefix}-postgres"
  database_version               = "POSTGRES_16"
  tier                           = "db-custom-4-16384" # 4 vCPU, 16GB
  disk_size_gb                   = 100
  disk_autoresize                = true
  availability_type              = "REGIONAL" # HA
  backup_enabled                 = true
  point_in_time_recovery_enabled = true
  deletion_protection            = true

  database_flags = [
    { name = "cloudsql.enable_pg_cron", value = "on" },
    { name = "max_connections", value = "200" },
    { name = "shared_buffers", value = "4GB" },
    { name = "work_mem", value = "16MB" },
    { name = "maintenance_work_mem", value = "512MB" },
    { name = "effective_cache_size", value = "12GB" },
    { name = "log_min_duration_statement", value = "500" },
    { name = "pg_stat_statements.track", value = "all" },
  ]

  database_name = "dispatch"
  db_user       = "dispatch_app"

  read_replica_enabled = true
  read_replica_tier    = "db-custom-2-8192"
  read_replica_region  = var.region

  depends_on = [module.networking]
}

# Run PostGIS + pgcrypto extensions after DB is up
resource "null_resource" "db_extensions" {
  triggers = {
    instance_id = module.cloud_sql.instance_id
  }

  provisioner "local-exec" {
    command = <<-EOT
      gcloud sql connect ${module.cloud_sql.instance_name} --user=${module.cloud_sql.db_user} --database=${module.cloud_sql.database_name} <<'SQL'
        CREATE EXTENSION IF NOT EXISTS postgis;
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        CREATE EXTENSION IF NOT EXISTS citext;
        CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
      SQL
    EOT
  }
}

# ============================================================================
# Memorystore Redis
# ============================================================================

module "redis" {
  source = "../../modules/memorystore"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix
  labels     = local.common_labels

  vpc_network_id        = module.networking.vpc_id
  private_service_range = module.networking.private_service_range

  tier                    = "STANDARD_HA"
  memory_size_gb          = 5
  redis_version           = "REDIS_7_0"
  auth_enabled            = true
  transit_encryption_mode = "SERVER_AUTHENTICATION"

  depends_on = [module.networking]
}

# ============================================================================
# GCS buckets (media, backups, models, logs)
# ============================================================================

module "storage" {
  source = "../../modules/storage"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix
  labels     = local.common_labels

  buckets = {
    media = {
      name                        = "${local.prefix}-media"
      location                    = "EU"
      storage_class               = "STANDARD"
      versioning                  = true
      lifecycle_delete_after_days = 365
      public_read                 = false
    }
    menu_images = {
      name                        = "${local.prefix}-menu-images"
      location                    = "EU"
      storage_class               = "STANDARD"
      versioning                  = false
      lifecycle_delete_after_days = 90
      public_read                 = false
    }
    backups = {
      name                        = "${local.prefix}-backups"
      location                    = "EU"
      storage_class               = "NEARLINE"
      versioning                  = true
      lifecycle_delete_after_days = 90
      public_read                 = false
    }
    model_artifacts = {
      name                        = "${local.prefix}-model-artifacts"
      location                    = "EU"
      storage_class               = "STANDARD"
      versioning                  = true
      lifecycle_delete_after_days = 0
      public_read                 = false
    }
    cloud_build_logs = {
      name                        = "${local.prefix}-build-logs"
      location                    = "EU"
      storage_class               = "STANDARD"
      versioning                  = false
      lifecycle_delete_after_days = 30
      public_read                 = false
    }
  }

  depends_on = [module.apis]
}

# ============================================================================
# Secret Manager
# ============================================================================

module "secrets" {
  source = "../../modules/secrets"

  project_id = var.project_id
  prefix     = local.prefix

  secret_names = [
    "database-url",
    "database-url-replica",
    "redis-url",
    "jwt-access-secret",
    "jwt-refresh-secret",
    "monnify-api-key",
    "monnify-secret-key",
    "monnify-webhook-secret",
    "korapay-public-key",
    "korapay-secret-key",
    "korapay-webhook-secret",
    "whatsapp-app-secret",
    "whatsapp-access-token",
    "termii-api-key",
    "google-maps-api-key",
    "fcm-service-account",
    "sentry-dsn",
  ]

  depends_on = [module.apis]
}

# ============================================================================
# Cloud Run services
# ============================================================================

module "cloud_run_api" {
  source = "../../modules/cloud-run"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix
  labels     = local.common_labels

  service_name          = "${local.prefix}-api"
  image                 = "europe-west1-docker.pkg.dev/${var.project_id}/${local.prefix}-containers/api:${var.api_image_tag}"
  service_account_email = module.iam.service_accounts.api.email

  cpu           = "2000m"
  memory        = "2Gi"
  min_instances = 2
  max_instances = 50
  concurrency   = 80
  timeout       = "60s"

  vpc_connector_id = module.networking.serverless_connector_id

  env_vars = {
    NODE_ENV             = "production"
    GCP_PROJECT_ID       = var.project_id
    BIGQUERY_DATASET_RAW = "${local.prefix}_raw"
    VERTEX_REGION        = var.region
    GCS_MEDIA_BUCKET     = module.storage.bucket_names.media
    GCS_MENU_BUCKET      = module.storage.bucket_names.menu_images
    GEMMA_ENDPOINT_URL   = var.gemma_endpoint_url
    ALLOWED_ORIGINS      = "https://app.dispatch.ng,https://vendor.dispatch.ng"
  }

  secret_env_vars = {
    DATABASE_URL           = "database-url"
    DATABASE_REPLICA_URL   = "database-url-replica"
    REDIS_URL              = "redis-url"
    JWT_ACCESS_SECRET      = "jwt-access-secret"
    JWT_REFRESH_SECRET     = "jwt-refresh-secret"
    MONNIFY_API_KEY        = "monnify-api-key"
    MONNIFY_SECRET_KEY     = "monnify-secret-key"
    MONNIFY_WEBHOOK_SECRET = "monnify-webhook-secret"
    KORAPAY_PUBLIC_KEY     = "korapay-public-key"
    KORAPAY_SECRET_KEY     = "korapay-secret-key"
    KORAPAY_WEBHOOK_SECRET = "korapay-webhook-secret"
    WHATSAPP_APP_SECRET    = "whatsapp-app-secret"
    WHATSAPP_ACCESS_TOKEN  = "whatsapp-access-token"
    TERMII_API_KEY         = "termii-api-key"
    GOOGLE_MAPS_API_KEY    = "google-maps-api-key"
    SENTRY_DSN             = "sentry-dsn"
  }

  allow_unauth = true

  depends_on = [
    module.cloud_sql,
    module.redis,
    module.secrets,
    module.iam,
    module.storage,
  ]
}

module "cloud_run_vendor_portal" {
  source = "../../modules/cloud-run"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix
  labels     = local.common_labels

  service_name          = "${local.prefix}-vendor-portal"
  image                 = "europe-west1-docker.pkg.dev/${var.project_id}/${local.prefix}-containers/vendor-portal:${var.vendor_portal_image_tag}"
  service_account_email = module.iam.service_accounts.vendor_portal.email

  cpu           = "1000m"
  memory        = "1Gi"
  min_instances = 1
  max_instances = 20
  concurrency   = 100
  timeout       = "30s"

  vpc_connector_id = module.networking.serverless_connector_id

  env_vars = {
    NODE_ENV            = "production"
    NEXT_PUBLIC_API_URL = "https://api.dispatch.ng"
    NEXT_PUBLIC_APP_URL = "https://vendor.dispatch.ng"
  }

  secret_env_vars = {
    NEXTAUTH_SECRET = "jwt-access-secret"
  }

  allow_unauth = true
}

module "cloud_run_customer_pwa" {
  source = "../../modules/cloud-run"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix
  labels     = local.common_labels

  service_name          = "${local.prefix}-customer-pwa"
  image                 = "europe-west1-docker.pkg.dev/${var.project_id}/${local.prefix}-containers/customer-pwa:${var.customer_pwa_image_tag}"
  service_account_email = module.iam.service_accounts.customer_pwa.email

  cpu           = "1000m"
  memory        = "1Gi"
  min_instances = 1
  max_instances = 30
  concurrency   = 100
  timeout       = "30s"

  env_vars = {
    NODE_ENV            = "production"
    NEXT_PUBLIC_API_URL = "https://api.dispatch.ng"
    NEXT_PUBLIC_APP_URL = "https://app.dispatch.ng"
  }

  allow_unauth = true
}

module "cloud_run_worker" {
  source = "../../modules/cloud-run"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix
  labels     = local.common_labels

  service_name          = "${local.prefix}-worker"
  image                 = "europe-west1-docker.pkg.dev/${var.project_id}/${local.prefix}-containers/worker:${var.api_image_tag}"
  service_account_email = module.iam.service_accounts.worker.email

  cpu           = "1000m"
  memory        = "1Gi"
  min_instances = 1
  max_instances = 10
  concurrency   = 1 # serial queue processing
  timeout       = "1800s"

  vpc_connector_id = module.networking.serverless_connector_id

  env_vars = {
    NODE_ENV       = "production"
    GCP_PROJECT_ID = var.project_id
  }

  secret_env_vars = {
    DATABASE_URL          = "database-url"
    REDIS_URL             = "redis-url"
    MONNIFY_API_KEY       = "monnify-api-key"
    MONNIFY_SECRET_KEY    = "monnify-secret-key"
    WHATSAPP_ACCESS_TOKEN = "whatsapp-access-token"
    TERMII_API_KEY        = "termii-api-key"
  }

  allow_unauth = false
}

# ============================================================================
# GKE Autopilot — Gemma serving
# ============================================================================

module "gke" {
  source = "../../modules/gke-autopilot"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix
  labels     = local.common_labels

  cluster_name = "${local.prefix}-gke"
  vpc_id       = module.networking.vpc_id
  subnet_id    = module.networking.subnet_id

  release_channel         = "REGULAR"
  master_ipv4_cidr_block  = "172.16.0.0/28"
  enable_private_nodes    = true
  enable_private_endpoint = false

  depends_on = [module.networking]
}

# Deploy Gemma to GKE via Helm
resource "null_resource" "deploy_gemma" {
  triggers = {
    cluster_endpoint = module.gke.cluster_endpoint
    gemma_image      = var.gemma_image
  }

  provisioner "local-exec" {
    command = <<-EOT
      gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region} --project ${var.project_id}
      helm upgrade --install gemma-serving ./charts/gemma-serving \
        --namespace gemma \
        --create-namespace \
        --set image.repository=${var.gemma_image} \
        --set serviceAccount.annotations."iam\.gke\.io/gcp-service-account"=${module.iam.service_accounts.gemma.email} \
        --set resources.requests.cpu=2 \
        --set resources.requests.memory=4Gi \
        --set autoscaling.minReplicas=1 \
        --set autoscaling.maxReplicas=4
    EOT
  }

  depends_on = [module.gke, module.iam]
}

# ============================================================================
# BigQuery
# ============================================================================

module "bigquery" {
  source = "../../modules/bigquery"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix
  labels     = local.common_labels

  datasets = {
    raw = {
      name        = "${local.prefix}_raw"
      description = "Raw event streams from Postgres CDC and app events"
      location    = "EU"
      tables      = ["events", "orders_snapshot", "rider_telemetry", "weather_hourly"]
    }
    features = {
      name        = "${local.prefix}_features"
      description = "Feature tables for Vertex AI training"
      location    = "EU"
      tables      = ["demand_features", "fraud_user_features", "rider_match_features"]
    }
    models = {
      name        = "${local.prefix}_models"
      description = "Model outputs, eval results, drift metrics"
      location    = "EU"
      tables      = ["demand_eval", "fraud_eval", "model_predictions", "model_drift"]
    }
    analytics = {
      name        = "${local.prefix}_analytics"
      description = "BI dashboards and ops metrics"
      location    = "EU"
      tables      = ["order_metrics_daily", "dispatch_metrics_daily", "unit_economics_daily"]
    }
  }

  writer_service_accounts = [
    module.iam.service_accounts.api.email,
    module.iam.service_accounts.worker.email,
  ]

  reader_service_accounts = [
    module.iam.service_accounts.ai_client.email,
  ]

  depends_on = [module.apis, module.iam]
}

# ============================================================================
# Vertex AI endpoints
# ============================================================================

module "vertex_ai" {
  source = "../../modules/vertex-ai"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix

  endpoints = {
    demand_forecast = {
      name         = "${local.prefix}-demand-forecast"
      description  = "XGBoost demand forecasting per cluster"
      machine_type = "n1-standard-2"
      min_replicas = 1
      max_replicas = 4
    }
    fraud_score = {
      name         = "${local.prefix}-fraud-score"
      description  = "XGBoost fraud classifier"
      machine_type = "n1-standard-4"
      min_replicas = 2
      max_replicas = 6
    }
    rider_match = {
      name         = "${local.prefix}-rider-match"
      description  = "Logistic regression rider match quality"
      machine_type = "n1-standard-1"
      min_replicas = 1
      max_replicas = 2
    }
  }

  invoker_service_accounts = [
    module.iam.service_accounts.ai_client.email,
  ]

  depends_on = [module.apis, module.iam]
}

# Grant ai_client access to Gemini on Vertex AI
resource "google_project_iam_member" "ai_client_vertex_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${module.iam.service_accounts.ai_client.email}"
}

# ============================================================================
# Observability
# ============================================================================

module "observability" {
  source = "../../modules/observability"

  project_id = var.project_id
  region     = var.region
  prefix     = local.prefix

  log_bucket_name             = "${local.prefix}-logs"
  log_retention_days          = 90
  log_export_bigquery_dataset = module.bigquery.dataset_ids.models

  uptime_checks = {
    api_health = {
      display_name = "API Health"
      host         = "api.dispatch.ng"
      path         = "/health"
    }
    vendor_portal = {
      display_name = "Vendor Portal"
      host         = "vendor.dispatch.ng"
      path         = "/"
    }
  }

  alert_policies = {
    api_error_rate = {
      display_name  = "API 5xx Error Rate > 1%"
      metric        = "run.googleapis.com/request_count"
      threshold     = 0.01
      resource_type = "cloud_run_revision"
    }
    sql_cpu = {
      display_name  = "Cloud SQL CPU > 80%"
      metric        = "cloudsql.googleapis.com/database/cpu/utilization"
      threshold     = 0.80
      resource_type = "cloudsql_database"
    }
    sql_connections = {
      display_name  = "Cloud SQL Connections > 180"
      metric        = "cloudsql.googleapis.com/database/network/connections"
      threshold     = 180
      resource_type = "cloudsql_database"
      duration      = "120s"
    }
    redis_memory = {
      display_name  = "Redis memory > 80%"
      metric        = "redis.googleapis.com/stats/memory/usage_ratio"
      threshold     = 0.80
      resource_type = "redis_instance"
    }
    ledger_discrepancy = {
      display_name = "Ledger reconciliation discrepancy"
      filter       = "metric.type=\"logging.googleapis.com/user/ledger_discrepancy\""
      threshold    = 0
    }
    payment_webhook_stalled = {
      display_name = "Payment Webhook Processing Stalled"
      filter       = "metric.type=\"logging.googleapis.com/user/unprocessed_webhooks\""
      threshold    = 50
    }
  }

  notification_channels = var.alert_notification_channels
}

# ============================================================================
# Cost controls
# ============================================================================

module "cost_controls" {
  source = "../../modules/cost-controls"

  project_id      = var.project_id
  billing_account = var.billing_account_id

  budgets = {
    monthly_total = {
      display_name    = "Dispatch Production Monthly"
      amount_usd      = 25000
      threshold_rules = [0.5, 0.8, 1.0]
    }
    vertex_ai = {
      display_name    = "Vertex AI Only"
      amount_usd      = 5000
      threshold_rules = [0.7, 0.9, 1.0]
      filters = {
        services = ["services/aiplatform.googleapis.com"]
      }
    }
    bigquery = {
      display_name    = "BigQuery Only"
      amount_usd      = 1500
      threshold_rules = [0.7, 0.9, 1.0]
      filters = {
        services = ["services/bigquery.googleapis.com"]
      }
    }
  }

  notification_channels = var.alert_notification_channels
}

# ============================================================================
# Cloud Scheduler — periodic jobs
# ============================================================================

resource "google_cloud_scheduler_job" "reconciliation_nightly" {
  name        = "${local.prefix}-reconciliation-nightly"
  description = "Run ledger reconciliation"
  schedule    = "0 2 * * *"
  time_zone   = "Africa/Lagos"
  region      = var.region

  http_target {
    http_method = "POST"
    uri         = "${module.cloud_run_api.service_url}/internal/jobs/reconciliation"
    headers = {
      "Content-Type" = "application/json"
    }
    oidc_token {
      service_account_email = module.iam.service_accounts.worker.email
    }
  }
}

resource "google_cloud_scheduler_job" "vendor_payout_batch" {
  name        = "${local.prefix}-vendor-payout-batch"
  description = "Daily vendor payout batch"
  schedule    = "0 3 * * *"
  time_zone   = "Africa/Lagos"
  region      = var.region

  http_target {
    http_method = "POST"
    uri         = "${module.cloud_run_api.service_url}/internal/jobs/vendor-payouts"
    oidc_token {
      service_account_email = module.iam.service_accounts.worker.email
    }
  }
}

resource "google_cloud_scheduler_job" "forecast_refresh" {
  name        = "${local.prefix}-forecast-refresh"
  description = "Refresh demand forecast every 15 min"
  schedule    = "*/15 * * * *"
  time_zone   = "Africa/Lagos"
  region      = var.region

  http_target {
    http_method = "POST"
    uri         = "${module.cloud_run_api.service_url}/internal/jobs/refresh-forecast"
    oidc_token {
      service_account_email = module.iam.service_accounts.worker.email
    }
  }
}

resource "google_cloud_scheduler_job" "gemma_retrain_weekly" {
  name        = "${local.prefix}-gemma-retrain"
  description = "Weekly Gemma fine-tune"
  schedule    = "0 2 * * 0"
  time_zone   = "Africa/Lagos"
  region      = var.region

  http_target {
    http_method = "POST"
    uri         = "${module.cloud_run_api.service_url}/internal/jobs/gemma-retrain"
    oidc_token {
      service_account_email = module.iam.service_accounts.ai_client.email
    }
  }
}
