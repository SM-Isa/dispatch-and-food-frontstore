# infra/environments/staging/backend.tf
terraform {
  backend "gcs" {
    bucket = "dispatch-stg-tfstate"
    prefix = "env/staging"
  }
}
