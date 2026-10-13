# infra/environments/production/outputs.tf
output "vpc_id" {
  value       = module.networking.vpc_id
  description = "VPC Network ID"
}

output "cloud_sql_instance_name" {
  value       = module.cloud_sql.instance_name
  description = "Primary Cloud SQL instance name"
}

output "cloud_sql_private_ip" {
  value       = module.cloud_sql.private_ip
  description = "Primary Cloud SQL private IP"
}

output "redis_host" {
  value       = module.redis.host
  description = "Memorystore Redis primary host"
}

output "api_service_url" {
  value       = module.cloud_run_api.service_url
  description = "Cloud Run Dispatch API URL"
}

output "vendor_portal_service_url" {
  value       = module.cloud_run_vendor_portal.service_url
  description = "Cloud Run Vendor Portal URL"
}

output "customer_pwa_service_url" {
  value       = module.cloud_run_customer_pwa.service_url
  description = "Cloud Run Customer PWA URL"
}

output "gke_cluster_name" {
  value       = module.gke.cluster_name
  description = "GKE Autopilot cluster name"
}

output "bigquery_datasets" {
  value       = module.bigquery.dataset_ids
  description = "BigQuery dataset IDs"
}

output "vertex_ai_endpoints" {
  value       = module.vertex_ai.endpoint_names
  description = "Vertex AI endpoint resource names"
}
