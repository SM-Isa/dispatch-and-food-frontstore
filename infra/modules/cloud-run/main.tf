# infra/modules/cloud-run/main.tf
variable "project_id"            { type = string }
variable "region"                { type = string }
variable "prefix"                { type = string }
variable "labels"                { type = map(string) }
variable "service_name"          { type = string }
variable "image"                 { type = string }
variable "service_account_email" { type = string }
variable "cpu"                   { type = string default = "1000m" }
variable "memory"                { type = string default = "1Gi" }
variable "min_instances"         { type = number default = 1 }
variable "max_instances"         { type = number default = 10 }
variable "concurrency"           { type = number default = 80 }
variable "timeout"               { type = string default = "60s" }
variable "vpc_connector_id"      { type = string default = null }
variable "env_vars"              { type = map(string) default = {} }
variable "secret_env_vars"       { type = map(string) default = {} }
variable "allow_unauth"          { type = bool   default = false }

resource "google_cloud_run_v2_service" "service" {
  name     = var.service_name
  project  = var.project_id
  region   = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = var.service_account_email
    timeout         = var.timeout

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    max_instance_request_concurrency = var.concurrency

    containers {
      image = var.image

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.secret_env_vars
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        timeout_seconds       = 3
        failure_threshold     = 10
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        period_seconds    = 30
        timeout_seconds   = 5
        failure_threshold = 3
      }
    }

    dynamic "vpc_access" {
      for_each = var.vpc_connector_id != null ? [1] : []
      content {
        connector = var.vpc_connector_id
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    labels = var.labels
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image, # CI/CD updates this on deploy
    ]
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  count    = var.allow_unauth ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "service_url"  { value = google_cloud_run_v2_service.service.uri }
output "service_name" { value = google_cloud_run_v2_service.service.name }
