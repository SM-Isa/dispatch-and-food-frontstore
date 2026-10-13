# infra/modules/networking/main.tf
variable "project_id" { type = string }
variable "region"     { type = string }
variable "prefix"     { type = string }
variable "labels"     { type = map(string) }
variable "vpc_cidr"             { type = string }
variable "subnet_cidr"          { type = string }
variable "serverless_cidr"      { type = string }
variable "enable_cloud_nat"     { type = bool   default = true }
variable "enable_private_google" { type = bool  default = true }

resource "google_compute_network" "vpc" {
  name                    = "${var.prefix}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  project                 = var.project_id
}

resource "google_compute_subnetwork" "main" {
  name                     = "${var.prefix}-subnet"
  ip_cidr_range            = var.subnet_cidr
  region                   = var.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = var.enable_private_google
  project                  = var.project_id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.20.0.0/16"
  }
  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.30.0.0/20"
  }
}

resource "google_compute_global_address" "private_service_range" {
  name          = "${var.prefix}-private-service-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
  project       = var.project_id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_service_range.name]
}

resource "google_compute_router" "router" {
  count   = var.enable_cloud_nat ? 1 : 0
  name    = "${var.prefix}-router"
  region  = var.region
  network = google_compute_network.vpc.id
  project = var.project_id
}

resource "google_compute_router_nat" "nat" {
  count                              = var.enable_cloud_nat ? 1 : 0
  name                               = "${var.prefix}-nat"
  router                             = google_compute_router.router[0].name
  region                             = var.region
  project                            = var.project_id
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

resource "google_vpc_access_connector" "serverless" {
  name          = "${var.prefix}-serverless"
  project       = var.project_id
  region        = var.region
  ip_cidr_range = var.serverless_cidr
  network       = google_compute_network.vpc.name
  min_instances = 2
  max_instances = 10
  machine_type  = "e2-micro"
}

output "vpc_id"                { value = google_compute_network.vpc.id }
output "subnet_id"             { value = google_compute_subnetwork.main.id }
output "private_service_range" { value = google_compute_global_address.private_service_range.name }
output "serverless_connector_id" { value = google_vpc_access_connector.serverless.id }
