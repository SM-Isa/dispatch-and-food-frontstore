# infra/bootstrap/main.tf
terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = "europe-west1"
}

variable "project_id" {
  type        = string
  description = "GCP project ID for Dispatch"
}

variable "state_bucket_name" {
  type        = string
  default     = "dispatch-tfstate"
  description = "Suffix for the Terraform remote state bucket"
}

# State bucket
resource "google_storage_bucket" "tfstate" {
  name                        = "${var.project_id}-${var.state_bucket_name}"
  location                    = "EU"
  uniform_bucket_level_access = true
  versioning {
    enabled = true
  }
  lifecycle_rule {
    condition {
      num_newer_versions = 10
    }
    action {
      type = "Delete"
    }
  }
}

# Terraform service account
resource "google_service_account" "terraform" {
  account_id   = "terraform-runner"
  display_name = "Terraform Runner"
}

# Grant it project owner for bootstrap and deployment automation
resource "google_project_iam_member" "terraform_owner" {
  project = var.project_id
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

output "terraform_sa_email" {
  value       = google_service_account.terraform.email
  description = "Service Account email for Terraform operations"
}

output "state_bucket" {
  value       = google_storage_bucket.tfstate.name
  description = "GCS bucket name storing Terraform remote state"
}
