# infra/modules/secrets/main.tf
variable "project_id"   { type = string }
variable "prefix"       { type = string }
variable "secret_names" { type = list(string) }

resource "google_secret_manager_secret" "secrets" {
  for_each  = toset(var.secret_names)
  secret_id = "${var.prefix}-${each.value}"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    environment = "prod"
    managed_by  = "terraform"
  }
}

# Note: Secret shells are provisioned by Terraform; secret values are added via CI/CD / gcloud:
#   echo -n "value" | gcloud secrets versions add <secret-id> --data-file=-
# This ensures zero secret leakage in Terraform remote state files.

output "secret_ids" {
  value = { for k, v in google_secret_manager_secret.secrets : k => v.secret_id }
}
