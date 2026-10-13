# infra/modules/vertex-ai/main.tf
variable "project_id" { type = string }
variable "region"     { type = string }
variable "prefix"     { type = string }

variable "endpoints" {
  type = map(object({
    name         = string
    description  = string
    machine_type = string
    min_replicas = number
    max_replicas = number
  }))
}

variable "invoker_service_accounts" { type = list(string) default = [] }

# Model Registry + Endpoint shell per model
resource "google_vertex_ai_endpoint" "endpoints" {
  for_each = var.endpoints

  name         = each.value.name
  display_name = each.value.name
  description  = each.value.description
  location     = var.region
  project      = var.project_id

  dedicated_endpoint_enabled = false

  labels = {
    environment = "prod"
    managed_by  = "terraform"
  }
}

# IAM: allow specific SAs to invoke each endpoint
resource "google_vertex_ai_endpoint_iam_member" "invokers" {
  for_each = {
    for pair in setproduct(keys(var.endpoints), var.invoker_service_accounts) :
    "${pair[0]}__${pair[1]}" => { endpoint = pair[0], sa = pair[1] }
  }

  project  = var.project_id
  location = var.region
  endpoint = google_vertex_ai_endpoint.endpoints[each.value.endpoint].name
  role     = "roles/aiplatform.user"
  member   = "serviceAccount:${each.value.sa}"
}

output "endpoint_names" {
  value = { for k, v in google_vertex_ai_endpoint.endpoints : k => v.name }
}
