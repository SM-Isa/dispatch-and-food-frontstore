# infra/environments/production/backend.tf
terraform {
  backend "gcs" {
    bucket = "dispatch-prod-tfstate"
    prefix = "env/production"
  }
}
