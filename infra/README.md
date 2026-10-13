# Infrastructure-as-Code (Terraform for GCP)

This directory contains the production Infrastructure-as-Code (IaC) powering the **Dispatch Rider Aggregator & Food Vendor Storefront** platform on Google Cloud Platform, designed to maximize the $350K Google for Startups Cloud Program (AI Track) facility.

## 1. Directory Structure

```
infra/
├── bootstrap/                     # Run once per GCP project: creates GCS state bucket & Terraform runner SA
│   ├── main.tf
│   └── terraform.tfvars
│
├── modules/                       # Reusable infrastructure components
│   ├── apis/                      # Enables all necessary GCP APIs
│   ├── networking/                # Custom VPC, private subnet, Cloud NAT, Serverless VPC Access connector
│   ├── cloud-sql/                 # Cloud SQL Postgres 16 HA, PostGIS, read replica, insights
│   ├── memorystore/               # Memorystore Redis 7.0 HA with AUTH and transit encryption
│   ├── cloud-run/                 # Cloud Run v2 services with auto-scaling and private VPC egress
│   ├── gke-autopilot/             # GKE Autopilot cluster for Gemma model serving
│   ├── bigquery/                  # BigQuery raw CDC, features, and telemetry datasets
│   ├── vertex-ai/                 # Vertex AI prediction endpoints (demand, fraud, rider match)
│   ├── storage/                   # GCS buckets for media, menu images, backups, model artifacts
│   ├── secrets/                   # Secret Manager secret shells
│   ├── observability/             # Cloud Logging sinks, Monitoring alert policies, uptime checks
│   ├── iam/                       # Least-privilege per-service Service Accounts
│   └── cost-controls/             # Cloud Billing budgets ($25k, $5k Vertex AI, $1.5k BigQuery)
│
└── environments/
    ├── staging/                   # Staging environment (zonal DB, basic Redis, auto-applied on main merge)
    └── production/                # Production environment (regional HA DB, HA Redis, manual GitHub approval)
```

## 2. Bootstrapping (Run Once)

Before running environment templates, provision the Terraform state bucket and runner Service Account:

```bash
cd infra/bootstrap
terraform init
terraform apply -var="project_id=dispatch-prod"
```

## 3. Deployment Workflow

### Staging
```bash
cd infra/environments/staging
terraform init
terraform plan
terraform apply
```

### Production
```bash
cd infra/environments/production
terraform init
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
```

## 4. Secret Values Workflow

To preserve zero secret leakage in remote state files, Terraform provisions only the **Secret Shells** in Secret Manager. Actual cryptographic keys and tokens are populated via CI/CD or `gcloud`:

```bash
# Example: Injecting Monnify secret key
echo -n "sk_live_abc123..." | gcloud secrets versions add prod-dispatch-monnify-secret-key --data-file=-
```

Cloud Run revisions automatically mount the latest version of Secret Manager references on startup.
