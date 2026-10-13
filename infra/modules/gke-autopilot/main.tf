# infra/modules/gke-autopilot/main.tf
variable "project_id"              { type = string }
variable "region"                  { type = string }
variable "prefix"                  { type = string }
variable "labels"                  { type = map(string) }
variable "cluster_name"            { type = string }
variable "vpc_id"                  { type = string }
variable "subnet_id"               { type = string }
variable "release_channel"         { type = string default = "REGULAR" }
variable "master_ipv4_cidr_block"  { type = string default = "172.16.0.0/28" }
variable "enable_private_nodes"    { type = bool   default = true }
variable "enable_private_endpoint" { type = bool   default = false }

resource "google_container_cluster" "cluster" {
  name     = var.cluster_name
  project  = var.project_id
  location = var.region

  enable_autopilot = true

  network    = var.vpc_id
  subnetwork = var.subnet_id

  release_channel {
    channel = var.release_channel
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  private_cluster_config {
    enable_private_nodes    = var.enable_private_nodes
    enable_private_endpoint = var.enable_private_endpoint
    master_ipv4_cidr_block  = var.master_ipv4_cidr_block
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "allow-all-webhook" # tighten in Phase 2 to ops IP CIDRs
    }
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }

  resource_labels = var.labels

  deletion_protection = true
}

output "cluster_name"     { value = google_container_cluster.cluster.name }
output "cluster_endpoint" { value = google_container_cluster.cluster.endpoint }
output "cluster_ca_cert"  { value = google_container_cluster.cluster.master_auth[0].cluster_ca_certificate, sensitive = true }
