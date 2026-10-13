# infra/modules/cloud-sql/main.tf
variable "project_id"             { type = string }
variable "region"                 { type = string }
variable "prefix"                 { type = string }
variable "labels"                 { type = map(string) }
variable "vpc_network_id"         { type = string }
variable "private_service_range"  { type = string }
variable "instance_name"          { type = string }
variable "database_version"       { type = string default = "POSTGRES_16" }
variable "tier"                   { type = string }
variable "disk_size_gb"           { type = number }
variable "disk_autoresize"        { type = bool   default = true }
variable "availability_type"      { type = string default = "REGIONAL" }
variable "backup_enabled"         { type = bool   default = true }
variable "point_in_time_recovery_enabled" { type = bool default = true }
variable "deletion_protection"    { type = bool   default = true }
variable "database_flags"         { type = list(object({ name = string, value = string })) default = [] }
variable "database_name"          { type = string }
variable "db_user"                { type = string }
variable "read_replica_enabled"   { type = bool   default = false }
variable "read_replica_tier"      { type = string default = "db-custom-2-8192" }
variable "read_replica_region"    { type = string default = null }

resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "google_sql_database_instance" "primary" {
  name             = var.instance_name
  project          = var.project_id
  region           = var.region
  database_version = var.database_version
  deletion_protection = var.deletion_protection

  settings {
    tier              = var.tier
    availability_type = var.availability_type
    disk_size         = var.disk_size_gb
    disk_autoresize   = var.disk_autoresize
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled                        = var.backup_enabled
      point_in_time_recovery_enabled = var.point_in_time_recovery_enabled
      start_time                     = "02:00"
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
      }
    }

    ip_configuration {
      ipv4_enabled       = false
      private_network    = var.vpc_network_id
      allocated_ip_range = var.private_service_range
    }

    dynamic "database_flags" {
      for_each = var.database_flags
      content {
        name  = database_flags.value.name
        value = database_flags.value.value
      }
    }

    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = false
    }

    user_labels = var.labels
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      settings[0].disk_size,  # allow autoresize; don't fight it
    ]
  }
}

resource "google_sql_database" "db" {
  name     = var.database_name
  instance = google_sql_database_instance.primary.name
  project  = var.project_id
}

resource "google_sql_user" "app" {
  name     = var.db_user
  instance = google_sql_database_instance.primary.name
  password = random_password.db_password.result
  project  = var.project_id
}

resource "google_sql_database_instance" "replica" {
  count                = var.read_replica_enabled ? 1 : 0
  name                 = "${var.instance_name}-replica"
  project              = var.project_id
  region               = var.read_replica_region != null ? var.read_replica_region : var.region
  database_version     = var.database_version
  master_instance_name = google_sql_database_instance.primary.name

  replica_configuration {
    failover_target = false
  }

  settings {
    tier              = var.read_replica_tier
    availability_type = "ZONAL"
    disk_autoresize   = true
    disk_type         = "PD_SSD"

    ip_configuration {
      ipv4_enabled       = false
      private_network    = var.vpc_network_id
      allocated_ip_range = var.private_service_range
    }

    user_labels = var.labels
  }
}

output "instance_id"     { value = google_sql_database_instance.primary.id }
output "instance_name"   { value = google_sql_database_instance.primary.name }
output "connection_name" { value = google_sql_database_instance.primary.connection_name }
output "db_user"         { value = google_sql_user.app.name }
output "db_password"     { value = random_password.db_password.result, sensitive = true }
output "private_ip"      { value = google_sql_database_instance.primary.private_ip_address }
output "database_name"   { value = google_sql_database.db.name }
output "replica_private_ip" {
  value = var.read_replica_enabled ? google_sql_database_instance.replica[0].private_ip_address : null
}
