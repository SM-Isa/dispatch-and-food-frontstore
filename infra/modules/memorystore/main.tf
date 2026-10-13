# infra/modules/memorystore/main.tf
variable "project_id"             { type = string }
variable "region"                 { type = string }
variable "prefix"                 { type = string }
variable "labels"                 { type = map(string) }
variable "vpc_network_id"         { type = string }
variable "private_service_range"  { type = string }
variable "tier"                   { type = string default = "STANDARD_HA" }
variable "memory_size_gb"         { type = number default = 5 }
variable "redis_version"          { type = string default = "REDIS_7_0" }
variable "auth_enabled"           { type = bool   default = true }
variable "transit_encryption_mode" { type = string default = "SERVER_AUTHENTICATION" }

resource "google_redis_instance" "cache" {
  name               = "${var.prefix}-redis"
  project            = var.project_id
  region             = var.region
  tier               = var.tier
  memory_size_gb     = var.memory_size_gb
  redis_version      = var.redis_version
  auth_enabled       = var.auth_enabled
  transit_encryption_mode = var.transit_encryption_mode

  authorized_network      = var.vpc_network_id
  connect_mode            = "PRIVATE_SERVICE_ACCESS"
  reserved_ip_range       = var.private_service_range

  redis_configs = {
    maxmemory-policy       = "allkeys-lru"
    notify-keyspace-events = "Ex" # for BullMQ / expiring key events
  }

  labels = var.labels

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 3
        minutes = 0
      }
    }
  }
}

output "host" { value = google_redis_instance.cache.host }
output "port" { value = google_redis_instance.cache.port }
output "auth_string" {
  value     = google_redis_instance.cache.auth_string
  sensitive = true
}
