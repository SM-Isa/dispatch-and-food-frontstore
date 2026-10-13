# infra/modules/observability/main.tf
variable "project_id" { type = string }
variable "region"     { type = string }
variable "prefix"     { type = string }

variable "log_bucket_name"    { type = string }
variable "log_retention_days" { type = number default = 90 }
variable "log_export_bigquery_dataset" { type = string default = null }

variable "uptime_checks" {
  type = map(object({
    display_name = string
    host         = string
    path         = string
  }))
  default = {}
}

variable "alert_policies" {
  type = map(object({
    display_name  = string
    metric        = optional(string)
    threshold     = number
    resource_type = optional(string, "cloud_run_revision")
    duration      = optional(string, "300s")
    filter        = optional(string)
  }))
  default = {}
}

variable "notification_channels" { type = list(string) default = [] }

resource "google_logging_project_bucket_config" "log_bucket" {
  project        = var.project_id
  location       = "global"
  bucket_id      = var.log_bucket_name
  retention_days = var.log_retention_days
}

resource "google_logging_project_sink" "to_bigquery" {
  count       = var.log_export_bigquery_dataset != null ? 1 : 0
  name        = "${var.prefix}-logs-to-bigquery"
  project     = var.project_id
  destination = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${var.log_export_bigquery_dataset}"
  filter      = "resource.type=\"cloud_run_revision\""

  bigquery_options {
    use_partitioned_tables = true
  }

  unique_writer_identity = true
}

resource "google_monitoring_uptime_check_config" "checks" {
  for_each     = var.uptime_checks
  project      = var.project_id
  display_name = each.value.display_name
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = each.value.path
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = each.value.host
    }
  }
}

resource "google_monitoring_alert_policy" "policies" {
  for_each     = var.alert_policies
  project      = var.project_id
  display_name = each.value.display_name
  combiner     = "OR"

  conditions {
    display_name = each.value.display_name
    condition_threshold {
      filter          = coalesce(each.value.filter, "metric.type=\"${each.value.metric}\" resource.type=\"${each.value.resource_type}\"")
      duration        = coalesce(each.value.duration, "300s")
      comparison      = "COMPARISON_GT"
      threshold_value = each.value.threshold
      trigger {
        count = 1
      }
    }
  }

  notification_channels = var.notification_channels

  alert_strategy {
    auto_close = "1800s"
  }
}
