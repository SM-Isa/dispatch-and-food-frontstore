# infra/modules/iam/main.tf
variable "project_id" { type = string }
variable "prefix"     { type = string }
variable "service_accounts" {
  type = map(object({
    account_id   = string
    display_name = string
  }))
}

resource "google_service_account" "sas" {
  for_each     = var.service_accounts
  project      = var.project_id
  account_id   = each.value.account_id
  display_name = each.value.display_name
}

# API SA: Cloud SQL Client, Redis Editor, Secret Manager Accessor, Storage Object Admin, Logs Writer
resource "google_project_iam_member" "api_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/redis.editor",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectAdmin",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/cloudtrace.agent",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.sas["api"].email}"
}

resource "google_project_iam_member" "worker_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/redis.editor",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectAdmin",
    "roles/logging.logWriter",
    "roles/cloudtasks.enqueuer",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.sas["worker"].email}"
}

resource "google_project_iam_member" "ai_client_roles" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/bigquery.dataViewer",
    "roles/bigquery.jobUser",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectViewer",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.sas["ai_client"].email}"
}

# Portals: minimal — secret access
resource "google_project_iam_member" "portal_roles" {
  for_each = toset(["vendor_portal", "customer_pwa"])
  project  = var.project_id
  role     = "roles/secretmanager.secretAccessor"
  member   = "serviceAccount:${google_service_account.sas[each.value].email}"
}

# Gemma SA: read models from GCS, logging, metrics
resource "google_project_iam_member" "gemma_roles" {
  for_each = toset([
    "roles/storage.objectViewer",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.sas["gemma"].email}"
}

output "service_accounts" {
  value = { for k, v in google_service_account.sas : k => { email = v.email, id = v.id } }
}
