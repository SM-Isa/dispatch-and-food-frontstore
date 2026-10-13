# infra/modules/apis/main.tf
variable "project_id" {
  type        = string
  description = "GCP Project ID"
}

variable "apis" {
  type        = list(string)
  description = "List of GCP APIs to enable"
}

resource "google_project_service" "enabled_apis" {
  for_each                   = toset(var.apis)
  project                    = var.project_id
  service                    = each.value
  disable_dependent_services = false
  disable_on_destroy         = false
}

output "enabled_services" {
  value       = [for s in google_project_service.enabled_apis : s.service]
  description = "List of enabled API services"
}
