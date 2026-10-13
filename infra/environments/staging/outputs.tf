# infra/environments/staging/outputs.tf
output "vpc_id" {
  value       = module.networking.vpc_id
  description = "VPC Network ID"
}

output "cloud_sql_instance_name" {
  value       = module.cloud_sql.instance_name
  description = "Staging Cloud SQL instance name"
}

output "cloud_sql_private_ip" {
  value       = module.cloud_sql.private_ip
  description = "Staging Cloud SQL private IP"
}

output "redis_host" {
  value       = module.redis.host
  description = "Staging Redis host"
}

output "api_service_url" {
  value       = module.cloud_run_api.service_url
  description = "Staging Cloud Run API URL"
}
