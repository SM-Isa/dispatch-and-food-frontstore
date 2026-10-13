# infra/modules/storage/main.tf
variable "project_id" { type = string }
variable "region"     { type = string }
variable "prefix"     { type = string }
variable "labels"     { type = map(string) }

variable "buckets" {
  type = map(object({
    name                        = string
    location                    = string
    storage_class               = string
    versioning                  = bool
    lifecycle_delete_after_days = number
    public_read                 = bool
  }))
}

resource "google_storage_bucket" "buckets" {
  for_each = var.buckets

  name          = each.value.name
  location      = each.value.location
  storage_class = each.value.storage_class
  project       = var.project_id
  labels        = var.labels

  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = each.value.versioning
  }

  dynamic "lifecycle_rule" {
    for_each = each.value.lifecycle_delete_after_days > 0 ? [1] : []
    content {
      condition {
        age = each.value.lifecycle_delete_after_days
      }
      action {
        type = "Delete"
      }
    }
  }

  dynamic "lifecycle_rule" {
    for_each = each.value.versioning ? [1] : []
    content {
      condition {
        num_newer_versions = 5
      }
      action {
        type = "Delete"
      }
    }
  }

  cors {
    origin          = ["https://app.dispatch.ng", "https://vendor.dispatch.ng"]
    method          = ["GET", "HEAD", "PUT", "POST"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }
}

resource "google_storage_bucket_iam_member" "public_read" {
  for_each = { for k, v in var.buckets : k => v if v.public_read }
  bucket   = google_storage_bucket.buckets[each.key].name
  role     = "roles/storage.objectViewer"
  member   = "allUsers"
}

output "bucket_names" {
  value = { for k, v in google_storage_bucket.buckets : k => v.name }
}
