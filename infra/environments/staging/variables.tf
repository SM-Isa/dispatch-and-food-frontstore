# infra/environments/staging/variables.tf
variable "project_id" {
  type        = string
  description = "GCP Project ID for Dispatch Staging"
}

variable "billing_account_id" {
  type        = string
  description = "GCP Billing Account ID for budget alerts"
}

variable "region" {
  type        = string
  default     = "europe-west1"
  description = "GCP Primary Region"
}

variable "api_image_tag" {
  type        = string
  default     = "v0.1.0"
  description = "Container image tag for Dispatch API and Worker"
}

variable "vendor_portal_image_tag" {
  type        = string
  default     = "v0.1.0"
  description = "Container image tag for Next.js Vendor Portal"
}

variable "customer_pwa_image_tag" {
  type        = string
  default     = "v0.1.0"
  description = "Container image tag for Next.js Customer PWA"
}

variable "gemma_image" {
  type        = string
  description = "Container image for Gemma fine-tuned serving on GKE"
}

variable "gemma_endpoint_url" {
  type        = string
  default     = "http://gemma-serving.gemma.svc.cluster.local:8080"
  description = "Internal Kubernetes Service URL for Gemma"
}

variable "alert_notification_channels" {
  type        = list(string)
  default     = []
  description = "Cloud Monitoring notification channel resource IDs"
}
