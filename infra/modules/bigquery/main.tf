# infra/modules/bigquery/main.tf
variable "project_id" { type = string }
variable "region"     { type = string }
variable "prefix"     { type = string }
variable "labels"     { type = map(string) }

variable "datasets" {
  type = map(object({
    name        = string
    description = string
    location    = string
    tables      = list(string)
  }))
}

variable "writer_service_accounts" { type = list(string) default = [] }
variable "reader_service_accounts" { type = list(string) default = [] }

resource "google_bigquery_dataset" "datasets" {
  for_each = var.datasets

  dataset_id    = each.value.name
  friendly_name = each.value.name
  description   = each.value.description
  location      = each.value.location
  project       = var.project_id

  default_table_expiration_ms = null

  labels = var.labels
}

# Writer IAM - Dataset Data Editor
resource "google_bigquery_dataset_iam_member" "writers" {
  for_each = {
    for pair in setproduct(keys(var.datasets), var.writer_service_accounts) :
    "${pair[0]}__${pair[1]}" => { dataset = pair[0], sa = pair[1] }
  }
  project    = var.project_id
  dataset_id = google_bigquery_dataset.datasets[each.value.dataset].dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${each.value.sa}"
}

# Writer IAM - Project Job User (required to execute BigQuery insert/load jobs)
resource "google_project_iam_member" "writers_job_user" {
  for_each = toset(var.writer_service_accounts)
  project  = var.project_id
  role     = "roles/bigquery.jobUser"
  member   = "serviceAccount:${each.value}"
}

# Reader IAM - Dataset Data Viewer
resource "google_bigquery_dataset_iam_member" "readers" {
  for_each = {
    for pair in setproduct(keys(var.datasets), var.reader_service_accounts) :
    "${pair[0]}__${pair[1]}" => { dataset = pair[0], sa = pair[1] }
  }
  project    = var.project_id
  dataset_id = google_bigquery_dataset.datasets[each.value.dataset].dataset_id
  role       = "roles/bigquery.dataViewer"
  member     = "serviceAccount:${each.value.sa}"
}

output "dataset_ids" {
  value = { for k, v in google_bigquery_dataset.datasets : k => v.dataset_id }
}
