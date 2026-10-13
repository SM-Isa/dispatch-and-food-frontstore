# infra/environments/staging/main.tf
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
  env    = "stg"
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

  vpc_cidr              = "10.20.0.0/16"
  subnet_cidr           = "10.20.1.0/24"
  serverless_cidr       = "10.20.2.0/28"
  enable_cloud_nat      = true
  enable_private_google = true

  depends_on = [module.apis]
}

# ============================================================================
# Service accounts
# ============================================================================

module "iam" {
  source = "../../modules/iam"

  project_id = var.project_id
  prefix     = local.prefix

  service_accounts = {
    api = {
      account_id   = "${local.prefix}-api"
      display_name = "Dispatch API (Staging)"
    }
    vendor_portal = {
      account_id   = "${local.prefix}-vendor-portal"
      display_name = "Vendor Portal (Staging)"
    }
    customer_pwa = {
      account_id   = "${local.prefix}-customer-pwa"
      display_name = "Customer PWA (Staging)"
    }
    worker = {
      account_id   = "${local.prefix}-worker"
      display_name = "Background Workers (Staging)"
    }
    gemma = {
      account_id   = "${local.prefix}-gemma"
      display_name = "Gemma Serving (Staging)"
    }
    ai_client = {
      account_id   = "${local.prefix}-ai-client"
      display_name = "AI Client (Staging)"
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
  tier                           = "db-custom-2-8192" # Right-sized for staging
  disk_size_gb                   = 20
  disk_autoresize                = true
  availability_type              = "ZONAL" # Single-zone for staging
  backup_enabled                 = true
  point_in_time_recovery_enabled = false
  deletion_protection            = false

  database_flags = [
    { name = "max_connections", value = "100" },
    { name = "shared_buffers", value = "2GB" },
  ]

  database_name = "dispatch"
  db_user       = "dispatch_app"

  read_replica_enabled = false

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

  tier                    = "BASIC" # Single node for staging
  memory_size_gb          = 1
  redis_version           = "REDIS_7_0"
  auth_enabled            = true
  transit_encryption_mode = "SERVER_AUTHENTICATION"

  depends_on = [module.networking]
}

# ============================================================================
# GCS buckets
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
      versioning                  = false
      lifecycle_delete_after_days = 60
      public_read                 = false
    }
    menu_images = {
      name                        = "${local.prefix}-menu-images"
      location                    = "EU"
      storage_class               = "STANDARD"
      versioning                  = false
      lifecycle_delete_after_days = 30
      public_read                 = false
    }
    backups = {
      name                        = "${local.prefix}-backups"
      location                    = "EU"
      storage_class               = "STANDARD"
      versioning                  = false
      lifecycle_delete_after_days = 30
      public_read                 = false
    }
    model_artifacts = {
      name                        = "${local.prefix}-model-artifacts"
      location                    = "EU"
      storage_class               = "STANDARD"
      versioning                  = false
      lifecycle_delete_after_days = 0
      public_read                 = false
    }
    cloud_build_logs = {
      name                        = "${local.prefix}-build-logs"
      location                    = "EU"
      storage_class               = "STANDARD"
      versioning                  = false
      lifecycle_delete_after_days = 14
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

  cpu           = "1000m"
  memory        = "1Gi"
  min_instances = 1
  max_instances = 5
  concurrency   = 80
  timeout       = "60s"

  vpc_connector_id = module.networking.serverless_connector_id

  env_vars = {
    NODE_ENV             = "staging"
    GCP_PROJECT_ID       = var.project_id
    BIGQUERY_DATASET_RAW = "${local.prefix}_raw"
    VERTEX_REGION        = var.region
    GCS_MEDIA_BUCKET     = module.storage.bucket_names.media
    GCS_MENU_BUCKET      = module.storage.bucket_names.menu_images
  }

  secret_env_vars = {
    DATABASE_URL       = "database-url"
    REDIS_URL          = "redis-url"
    JWT_ACCESS_SECRET  = "jwt-access-secret"
    JWT_REFRESH_SECRET = "jwt-refresh-secret"
    MONNIFY_API_KEY    = "monnify-api-key"
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
  min_instances = 0
  max_instances = 5
  concurrency   = 80
  timeout       = "30s"

  vpc_connector_id = module.networking.serverless_connector_id

  env_vars = {
    NODE_ENV = "staging"
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
  min_instances = 0
  max_instances = 5
  concurrency   = 80
  timeout       = "30s"

  env_vars = {
    NODE_ENV = "staging"
  }

  allow_unauth = true
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
      description = "Raw staging event streams"
      location    = "EU"
      tables      = ["events"]
    }
  }

  writer_service_accounts = [
    module.iam.service_accounts.api.email,
  ]

  depends_on = [module.apis, module.iam]
}
