# infra/environments/staging/terraform.tfvars
project_id         = "dispatch-stg"
billing_account_id = "01A2B3-C4D5E6-F7G8H9"
region             = "europe-west1"

api_image_tag           = "v0.1.0"
vendor_portal_image_tag = "v0.1.0"
customer_pwa_image_tag  = "v0.1.0"

gemma_image        = "europe-west1-docker.pkg.dev/dispatch-stg/dispatch-containers/gemma-ng-dishes:v3"
gemma_endpoint_url = "http://gemma-serving.gemma.svc.cluster.local:8080"

alert_notification_channels = []
