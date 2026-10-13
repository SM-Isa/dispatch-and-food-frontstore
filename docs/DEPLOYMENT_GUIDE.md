# ARTIFACT 25: Production Infrastructure Deployment Guide & Operational Runbook

**Document Version:** 1.0.0  
**Effective Date:** Day 1 of Launch Sprint  
**Target Audience:** Founding Engineer, DevOps Lead, Infrastructure Engineer  
**Classification:** Internal Confidential / Operational Runbook  

---

## Executive Summary & Runbook Scope

This is not an architectural design document. It is the **literal, step-by-step operational runbook** for taking the Dispatch Rider Aggregator & Food Vendor Storefront from zero to a live, production-grade cloud deployment on Google Cloud Platform (GCP).

Every command listed in this document is executable. Every decision gate specifies the exact binary evaluation criteria. Every failure mode links directly to its root cause and remediation procedure.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Day 1 Deployment Timeline                                │
├────────────────────────────┬────────────────────────────┬──────────────────────────────┤
│    Morning (09:00–12:00)   │   Afternoon (13:00–17:00)  │     Evening (17:00–19:00)    │
│ • Local tool verification  │ • GCP project & IAM setup  │ • Custom domain DNS mapping  │
│ • Docker Postgres & Redis  │ • Terraform infrastructure │ • Webhook endpoint wiring    │
│ • Database DDL & seed      │ • Secret Manager injection │ • Automated smoke test suite │
│ • Local test suite pass    │ • Cloud Run & GKE deploy   │ • "Production Live" sign-off │
└────────────────────────────┴────────────────────────────┴──────────────────────────────┘
```

---

## 25.1 Prerequisites

Before executing a single command in this guide, all external dependencies, accounts, domain registrations, and tooling must be verified.

### 1. External Accounts & Merchant Rails
- [ ] **Google Cloud Platform:** Corporate billing account active with valid credit card or credit line.
- [ ] **GitHub Organization:** `dispatch-ng` organization created with team RBAC permissions.
- [ ] **Domain Registrar:** `dispatch.ng` domain registered and active.
- [ ] **DNS Provider:** Cloudflare account managing `dispatch.ng` nameservers (`ns1.cloudflare.com`, etc.).
- [ ] **Monnify:** Approved live merchant account (live contract code, API keys, and webhook secret).
- [ ] **Korapay:** Approved live merchant account (public key, secret key, webhook secret).
- [ ] **Meta Business Manager:** Verified business account with WhatsApp Business API phone number.
- [ ] **Termii:** Funded enterprise account for transactional SMS delivery (+234 routing).
- [ ] **Google Maps Platform:** Project billing linked, Geocoding, Places, and Routes APIs enabled.
- [ ] **MyCoverGenius:** Active API credentials for motorcycle rider delivery insurance policies.
- [ ] **Firebase:** Production project configured for Google Cloud Messaging (FCM push notifications).
- [ ] **Sentry:** Production project DSN for backend and web application exception logging.
- [ ] **Slack:** Workspace created with `#alerts`, `#incidents`, and `#war-room` webhooks.
- [ ] **PagerDuty:** Service integration configured for SRE on-call escalation.

### 2. Required CLI Tool Versions
Verify your local workstation against the strict version matrix:

| Tool | Required Version | Verification Command | Expected Output Regex |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 20.11.0` | `node --version` | `v20\.\d+\.\d+` |
| **pnpm** | `>= 9.0.0` | `pnpm --version` | `9\.\d+\.\d+` |
| **Docker** | `>= 24.0.0` | `docker --version` | `Docker version 2[4-9]\.` |
| **gcloud** | `>= 460.0.0` | `gcloud --version` | `Google Cloud SDK 4[6-9]\d` |
| **Terraform** | `>= 1.7.0` | `terraform --version` | `Terraform v1\.[7-9]\.` |
| **kubectl** | `>= 1.28.0` | `kubectl version --client` | `Client Version: v1\.2[8-9]` |
| **helm** | `>= 3.14.0` | `helm version --short` | `v3\.1[4-9]` |
| **psql** | `>= 15.0` | `psql --version` | `psql \(PostgreSQL\) 1[5-6]` |
| **redis-cli**| `>= 7.0` | `redis-cli --version` | `redis-cli 7\.` |
| **gh CLI** | `>= 2.40.0` | `gh --version` | `gh version 2\.` |

### 3. Access & IAM Credentials
Ensure the executing engineer holds:
* GCP: `roles/owner` on `dispatch-prod` and `dispatch-stg`.
* GitHub: Administrator access on `dispatch-ng/dispatch`.
* Cloudflare: DNS Administrator permissions for `dispatch.ng`.
* Monnify & Korapay: Portal administrator access.

---

## 25.2 Local Development Setup (30-Minute Walkthrough)

Target: Take a new engineer from fresh repository clone to running services in under 30 minutes.

### Step 1: Install System Dependencies (10 Minutes)
On macOS (Homebrew):
```bash
brew install node@20 pnpm docker gcloud terraform kubectl helm gh postgresql@15 redis
brew install --cask docker
```

On Linux (Ubuntu 22.04 LTS):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql-client redis-tools
npm install -g pnpm@9
```

### Step 2: Clone and Install Monorepo Packages (5 Minutes)
```bash
git clone git@github.com:dispatch-ng/dispatch.git
cd dispatch
pnpm install
```

### Step 3: Local Environment Configuration (2 Minutes)
Copy the example environment configuration into the API package:
```bash
cp apps/api/.env.example apps/api/.env
```

Generate local cryptographic keys for JWT signing and TOTP encryption:
```bash
# 1. Generate ES256 EC keypair for JWT authentication
openssl ecparam -genkey -name prime256v1 -noout -out /tmp/jwt-local-priv.pem
openssl ec -in /tmp/jwt-local-priv.pem -pubout -out /tmp/jwt-local-pub.pem

# 2. Extract Base64 strings for .env
JWT_PRIV_B64=$(base64 -i /tmp/jwt-local-priv.pem | tr -d '\n')
JWT_PUB_B64=$(base64 -i /tmp/jwt-local-pub.pem | tr -d '\n')
TOTP_KEY=$(openssl rand -base64 32)

# 3. Inject into apps/api/.env
echo "JWT_ACCESS_PRIVATE_KEY=${JWT_PRIV_B64}" >> apps/api/.env
echo "JWT_ACCESS_PUBLIC_KEY=${JWT_PUB_B64}" >> apps/api/.env
echo "TOTP_ENCRYPTION_KEY=${TOTP_KEY}" >> apps/api/.env

rm -f /tmp/jwt-local-priv.pem /tmp/jwt-local-pub.pem
```

### Step 4: Boot Local PostGIS & Redis (5 Minutes)
```bash
docker compose -f docker-compose.dev.yml up -d
```
Verify container health:
```bash
docker compose -f docker-compose.dev.yml ps
```
*Expected: Both `postgres` (PostGIS 16) and `redis` report `Up (healthy)`.*

### Step 5: Database Migration & Seeding (3 Minutes)
```bash
cd apps/api
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed
```
The seed generates:
- 7 system singleton wallets (CUSTOMER_ESCROW, PLATFORM, RIDER_POOL, BANK_SETTLEMENT, etc.)
- 1 platform admin user (+2348000000001)
- 2 sample vendors in Tanke and GRA
- 2 verified test motorcycle riders

### Step 6: Start Application Services (3 Minutes)
```bash
cd ../..
pnpm turbo dev
```
Ports exposed:
- `http://localhost:8080/api` — NestJS API Service & Swagger (`/api/docs`)
- `http://localhost:3000` — Next.js Customer Storefront PWA
- `http://localhost:3001` — Next.js Vendor Management Portal

### Step 7: Verify Smoke Test Suite (2 Minutes)
```bash
# Run unit and E2E integration test suites
pnpm test:e2e
```
*Expected output:*
```text
PASS src/modules/auth/auth.e2e-spec.ts
PASS src/modules/dispatch/dispatch-lock.e2e-spec.ts
PASS src/modules/ledger/ledger.e2e-spec.ts
Tests: 18 passed, 18 total
```

---

## 25.3 GCP Bootstrap (Pre-Terraform Setup)

Before Terraform can provision cloud infrastructure, the project shell, billing linkage, APIs, service accounts, and state bucket must be established manually.

### Step 1: Create GCP Projects
```bash
gcloud projects create dispatch-prod --name="Dispatch Production"
gcloud projects create dispatch-stg --name="Dispatch Staging"
```

### Step 2: Link Billing Accounts
```bash
BILLING_ACCOUNT_ID="01A2B3-C4D5E6-F7G8H9" # Replace with actual corporate billing ID
gcloud billing projects link dispatch-prod --billing-account=${BILLING_ACCOUNT_ID}
gcloud billing projects link dispatch-stg --billing-account=${BILLING_ACCOUNT_ID}
```

### Step 3: Enable Core GCP APIs
Execute on `dispatch-prod`:
```bash
gcloud config set project dispatch-prod

gcloud services enable \
  compute.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  container.googleapis.com \
  bigquery.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  servicenetworking.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudtasks.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  cloudtrace.googleapis.com \
  billingbudgets.googleapis.com \
  artifactregistry.googleapis.com \
  firebase.googleapis.com \
  fcm.googleapis.com \
  cloudkms.googleapis.com
```

### Step 4: Create Terraform Service Account
```bash
gcloud iam service-accounts create terraform-runner \
  --display-name="Terraform Infrastructure Automation"

gcloud projects add-iam-policy-binding dispatch-prod \
  --member="serviceAccount:terraform-runner@dispatch-prod.iam.gserviceaccount.com" \
  --role="roles/owner"

gcloud iam service-accounts keys create ~/terraform-runner-key.json \
  --iam-account=terraform-runner@dispatch-prod.iam.gserviceaccount.com
```

### Step 5: Provision Remote Terraform State Bucket
```bash
gcloud storage buckets create gs://dispatch-prod-tfstate \
  --location=EU \
  --uniform-bucket-level-access

gcloud storage buckets update gs://dispatch-prod-tfstate --versioning

gcloud storage buckets add-iam-policy-binding gs://dispatch-prod-tfstate \
  --member="serviceAccount:terraform-runner@dispatch-prod.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### Step 6: Configure Terraform Backend & Variables
In `infra/environments/production/backend.tf`:
```hcl
terraform {
  backend "gcs" {
    bucket = "dispatch-prod-tfstate"
    prefix = "env/production"
  }
}
```

In `infra/environments/production/terraform.tfvars`:
```hcl
project_id          = "dispatch-prod"
billing_account_id  = "01A2B3-C4D5E6-F7G8H9"
region              = "europe-west1"

api_image_tag            = "v0.1.0"
vendor_portal_image_tag  = "v0.1.0"
customer_pwa_image_tag   = "v0.1.0"

gemma_image         = "europe-west1-docker.pkg.dev/dispatch-prod/dispatch-containers/gemma-ng-dishes:v3"
gemma_endpoint_url  = "http://gemma-serving.gemma.svc.cluster.local:8080"
```

### Step 7: Execute First Terraform Apply (15–20 Minutes)
```bash
cd infra/environments/production
export GOOGLE_APPLICATION_CREDENTIALS=~/terraform-runner-key.json

terraform init
terraform plan -out=tfplan
terraform apply tfplan
```
*Expected completion output:*
```text
Apply complete! Resources: 74 added, 0 changed, 0 destroyed.

Outputs:
api_service_url = "https://prod-dispatch-api-xxxxx-ew.a.run.app"
cloud_sql_connection_name = "dispatch-prod:europe-west1:prod-dispatch-postgres"
cloud_sql_private_ip = "10.10.0.5"
redis_host = "10.10.2.3"
redis_port = 6379
```

---

## 25.4 Secret Population Runbook

Terraform creates the secret placeholders in Google Secret Manager; this section populates their production values.

### Setting Secrets via CLI Standard
Always append `--data-file=-` with `echo -n` to prevent trailing newline corruption:
```bash
echo -n "RAW_SECRET_STRING" | gcloud secrets versions add SECRET_NAME --data-file=-
```

### Complete Secret Inventory & Configuration

```bash
# 1. Database Connection String
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9')
gcloud sql users set-password dispatch_app \
  --instance=prod-dispatch-postgres \
  --password="$DB_PASS"

SQL_IP=$(terraform output -raw cloud_sql_private_ip)
echo -n "postgresql://dispatch_app:${DB_PASS}@${SQL_IP}:5432/dispatch" | \
  gcloud secrets versions add prod-dispatch-database-url --data-file=-

# 2. Redis Cache Connection String
REDIS_HOST=$(terraform output -raw redis_host)
REDIS_AUTH=$(terraform output -raw redis_auth_string)
echo -n "redis://:${REDIS_AUTH}@${REDIS_HOST}:6379" | \
  gcloud secrets versions add prod-dispatch-redis-url --data-file=-

# 3. JWT ES256 Production Keypair
openssl ecparam -genkey -name prime256v1 -noout -out /tmp/prod-jwt-priv.pem
openssl ec -in /tmp/prod-jwt-priv.pem -pubout -out /tmp/prod-jwt-pub.pem
PRIV_B64=$(base64 -i /tmp/prod-jwt-priv.pem | tr -d '\n')
PUB_B64=$(base64 -i /tmp/prod-jwt-pub.pem | tr -d '\n')

echo -n "${PRIV_B64}:::${PUB_B64}" | \
  gcloud secrets versions add prod-dispatch-jwt-access-secret --data-file=-
shred -u /tmp/prod-jwt-priv.pem /tmp/prod-jwt-pub.pem

# 4. JWT Refresh Token Secret
openssl rand -base64 48 | \
  gcloud secrets versions add prod-dispatch-jwt-refresh-secret --data-file=-

# 5. Monnify Credentials
echo -n "MK_PROD_LIVE_KEY_HERE" | gcloud secrets versions add prod-dispatch-monnify-api-key --data-file=-
echo -n "LIVE_SECRET_KEY_HERE" | gcloud secrets versions add prod-dispatch-monnify-secret-key --data-file=-
echo -n "LIVE_WEBHOOK_SECRET_HERE" | gcloud secrets versions add prod-dispatch-monnify-webhook-secret --data-file=-

# 6. Korapay Credentials
echo -n "pk_live_korapay_here" | gcloud secrets versions add prod-dispatch-korapay-public-key --data-file=-
echo -n "sk_live_korapay_here" | gcloud secrets versions add prod-dispatch-korapay-secret-key --data-file=-
echo -n "korapay_webhook_secret_here" | gcloud secrets versions add prod-dispatch-korapay-webhook-secret --data-file=-

# 7. Meta WhatsApp Cloud API
echo -n "meta_app_secret_here" | gcloud secrets versions add prod-dispatch-whatsapp-app-secret --data-file=-
echo -n "meta_system_user_permanent_token" | gcloud secrets versions add prod-dispatch-whatsapp-access-token --data-file=-

# 8. Termii SMS Gateway
echo -n "termii_live_api_key" | gcloud secrets versions add prod-dispatch-termii-api-key --data-file=-

# 9. Google Maps API Key
echo -n "AIzaSy_RESTRICTED_MAPS_KEY" | gcloud secrets versions add prod-dispatch-google-maps-api-key --data-file=-

# 10. Firebase FCM Service Account
cat /path/to/firebase-adminsdk.json | \
  gcloud secrets versions add prod-dispatch-fcm-service-account --data-file=-

# 11. Sentry DSN
echo -n "https://public@sentry.io/project-id" | gcloud secrets versions add prod-dispatch-sentry-dsn --data-file=-

# 12. TOTP Encryption Key
openssl rand -base64 32 | \
  gcloud secrets versions add prod-dispatch-totp-encryption-key --data-file=-
```

### Verify Secret Availability
```bash
gcloud secrets list --filter="name:prod-dispatch"
```
*Expected: 17 secrets returned, all showing at least one ENABLED version.*

---

## 25.5 First Deployment Runbook (Numbered Steps, ~3 Hours)

### Phase 1: Build & Push Production Containers (45 Minutes)
Configure Docker authentication against Google Artifact Registry:
```bash
gcloud auth configure-docker europe-west1-docker.pkg.dev
```

Build and push all container images for `linux/amd64`:
```bash
REGISTRY="europe-west1-docker.pkg.dev/dispatch-prod/dispatch-containers"

# 1. API Service
docker build --platform=linux/amd64 -t ${REGISTRY}/api:v0.1.0 -f apps/api/Dockerfile.prod apps/api
docker push ${REGISTRY}/api:v0.1.0

# 2. Worker Service (BullMQ)
docker build --platform=linux/amd64 -t ${REGISTRY}/worker:v0.1.0 -f apps/worker/Dockerfile.prod apps/worker
docker push ${REGISTRY}/worker:v0.1.0

# 3. Vendor Portal (Next.js)
docker build --platform=linux/amd64 -t ${REGISTRY}/vendor-portal:v0.1.0 -f apps/vendor-portal/Dockerfile.prod apps/vendor-portal
docker push ${REGISTRY}/vendor-portal:v0.1.0

# 4. Customer PWA (Next.js)
docker build --platform=linux/amd64 -t ${REGISTRY}/customer-pwa:v0.1.0 -f apps/customer-pwa/Dockerfile.prod apps/customer-pwa
docker push ${REGISTRY}/customer-pwa:v0.1.0
```

### Phase 2: Database Initialization & Migrations (15 Minutes)
Connect via Cloud SQL Auth Proxy to securely execute migration DDL:
```bash
# Start proxy in background
cloud-sql-proxy dispatch-prod:europe-west1:prod-dispatch-postgres --port=5433 &
PROXY_PID=$!
sleep 3

# Execute Prisma migration deploy against Cloud SQL
export DATABASE_URL="postgresql://dispatch_app:${DB_PASS}@127.0.0.1:5433/dispatch?schema=public"

cd apps/api
pnpm prisma migrate deploy
pnpm prisma db seed

# Verify table counts and singleton wallets
psql "${DATABASE_URL}" -c "SELECT COUNT(*) FROM wallets WHERE owner_id IS NULL;"
# Expected: 7 system wallets

kill $PROXY_PID
```

### Phase 3: Deploy Cloud Run Workloads (30 Minutes)
Deploy the API service with private VPC connector egress:
```bash
gcloud run deploy prod-dispatch-api \
  --image=europe-west1-docker.pkg.dev/dispatch-prod/dispatch-containers/api:v0.1.0 \
  --region=europe-west1 \
  --platform=managed \
  --no-allow-unauthenticated \
  --service-account=prod-dispatch-api@dispatch-prod.iam.gserviceaccount.com \
  --vpc-connector=prod-dispatch-serverless \
  --vpc-egress=private-ranges-only \
  --min-instances=2 \
  --max-instances=50 \
  --cpu=2 \
  --memory=2Gi \
  --concurrency=80 \
  --timeout=60s \
  --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=dispatch-prod,VERTEX_REGION=europe-west1,GCS_MEDIA_BUCKET=prod-dispatch-media,GCS_MENU_BUCKET=prod-dispatch-menu-images,GEMMA_ENDPOINT_URL=http://gemma-serving.gemma.svc.cluster.local:8080,ALLOWED_ORIGINS=https://app.dispatch.ng,https://vendor.dispatch.ng,PAYMENT_GATEWAY_PROVIDER=monnify,NOTIFICATION_SMS_PROVIDER=termii,PAYOUT_GATEWAY_PROVIDER=monnify,AI_PROVIDER=vertex" \
  --set-secrets="DATABASE_URL=prod-dispatch-database-url:latest,REDIS_URL=prod-dispatch-redis-url:latest,JWT_ACCESS_SECRET=prod-dispatch-jwt-access-secret:latest,JWT_REFRESH_SECRET=prod-dispatch-jwt-refresh-secret:latest,MONNIFY_API_KEY=prod-dispatch-monnify-api-key:latest,MONNIFY_SECRET_KEY=prod-dispatch-monnify-secret-key:latest,MONNIFY_WEBHOOK_SECRET=prod-dispatch-monnify-webhook-secret:latest,KORAPAY_PUBLIC_KEY=prod-dispatch-korapay-public-key:latest,KORAPAY_SECRET_KEY=prod-dispatch-korapay-secret-key:latest,KORAPAY_WEBHOOK_SECRET=prod-dispatch-korapay-webhook-secret:latest,WHATSAPP_APP_SECRET=prod-dispatch-whatsapp-app-secret:latest,WHATSAPP_ACCESS_TOKEN=prod-dispatch-whatsapp-access-token:latest,TERMII_API_KEY=prod-dispatch-termii-api-key:latest,GOOGLE_MAPS_API_KEY=prod-dispatch-google-maps-api-key:latest,SENTRY_DSN=prod-dispatch-sentry-dsn:latest,TOTP_ENCRYPTION_KEY=prod-dispatch-totp-encryption-key:latest"

# Grant public ingress to load balancer (Application layer enforces JWT)
gcloud run services add-iam-policy-binding prod-dispatch-api \
  --region=europe-west1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

Deploy the background worker service:
```bash
gcloud run deploy prod-dispatch-worker \
  --image=europe-west1-docker.pkg.dev/dispatch-prod/dispatch-containers/worker:v0.1.0 \
  --region=europe-west1 \
  --service-account=prod-dispatch-worker@dispatch-prod.iam.gserviceaccount.com \
  --vpc-connector=prod-dispatch-serverless \
  --no-allow-unauthenticated \
  --min-instances=1 \
  --max-instances=10 \
  --cpu=1 \
  --memory=1Gi \
  --concurrency=1 \
  --timeout=1800s \
  --set-secrets="DATABASE_URL=prod-dispatch-database-url:latest,REDIS_URL=prod-dispatch-redis-url:latest,MONNIFY_API_KEY=prod-dispatch-monnify-api-key:latest,MONNIFY_SECRET_KEY=prod-dispatch-monnify-secret-key:latest,WHATSAPP_ACCESS_TOKEN=prod-dispatch-whatsapp-access-token:latest,TERMII_API_KEY=prod-dispatch-termii-api-key:latest"
```

Deploy frontends (Customer PWA and Vendor Portal):
```bash
gcloud run deploy prod-dispatch-customer-pwa \
  --image=europe-west1-docker.pkg.dev/dispatch-prod/dispatch-containers/customer-pwa:v0.1.0 \
  --region=europe-west1 \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=20 \
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_URL=https://api.dispatch.ng"

gcloud run deploy prod-dispatch-vendor-portal \
  --image=europe-west1-docker.pkg.dev/dispatch-prod/dispatch-containers/vendor-portal:v0.1.0 \
  --region=europe-west1 \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_URL=https://api.dispatch.ng"
```

### Phase 4: Deploy Gemma 2B to GKE Autopilot (30 Minutes)
```bash
gcloud container clusters get-credentials prod-dispatch-gke --region=europe-west1

kubectl create namespace gemma
kubectl create serviceaccount gemma-serving -n gemma

kubectl annotate serviceaccount gemma-serving -n gemma \
  iam.gke.io/gcp-service-account=prod-dispatch-gemma@dispatch-prod.iam.gserviceaccount.com

gcloud iam service-accounts add-iam-policy-binding \
  prod-dispatch-gemma@dispatch-prod.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:dispatch-prod.svc.id.goog[gemma/gemma-serving]"

helm install gemma-serving ./infra/helm/gemma-serving \
  --namespace gemma \
  --set image.repository=europe-west1-docker.pkg.dev/dispatch-prod/dispatch-containers/gemma-ng-dishes \
  --set image.tag=v3 \
  --set serviceAccount.name=gemma-serving \
  --set resources.requests.cpu=2 \
  --set resources.requests.memory=4Gi \
  --set autoscaling.minReplicas=1 \
  --set autoscaling.maxReplicas=4
```

### Phase 5: Custom Domain & DNS Mapping (15 Minutes)
Map Cloud Run services to regional endpoints:
```bash
gcloud beta run domain-mappings create --service=prod-dispatch-api --domain=api.dispatch.ng --region=europe-west1
gcloud beta run domain-mappings create --service=prod-dispatch-vendor-portal --domain=vendor.dispatch.ng --region=europe-west1
gcloud beta run domain-mappings create --service=prod-dispatch-customer-pwa --domain=app.dispatch.ng --region=europe-west1
```

Retrieve DNS resource target records:
```bash
gcloud beta run domain-mappings describe --domain=api.dispatch.ng --region=europe-west1 --format="value(status.resourceRecords[0].rrdata)"
```
In Cloudflare:
- Add CNAME for `api.dispatch.ng` $\rightarrow$ `ghs.googlehosted.com` (DNS only / grey-clouded for initial cert issuance).
- Add CNAME for `vendor.dispatch.ng` $\rightarrow$ `ghs.googlehosted.com`.
- Add CNAME for `app.dispatch.ng` $\rightarrow$ `ghs.googlehosted.com`.

### Phase 6: Webhook Wiring (15 Minutes)
1. **Monnify:** Log in to `app.monnify.com` $\rightarrow$ Settings $\rightarrow$ Webhooks. Set URL to `https://api.dispatch.ng/webhooks/monnify`.
2. **Korapay:** Log in to Korapay dashboard $\rightarrow$ Developer Tools $\rightarrow$ Webhooks. Set URL to `https://api.dispatch.ng/webhooks/korapay`.
3. **WhatsApp:** In Meta App Dashboard $\rightarrow$ WhatsApp $\rightarrow$ Configuration. Set Callback URL to `https://api.dispatch.ng/webhooks/whatsapp`.

### Phase 7: Trigger Cloud Scheduler Baseline Test (5 Minutes)
```bash
gcloud scheduler jobs run prod-dispatch-reconciliation-nightly --location=europe-west1
gcloud run services logs read prod-dispatch-api --region=europe-west1 --limit=15
```
*Expected output: `Ledger reconciliation complete: 0 variances detected.`*

---

## 25.6 Post-Deployment Verification (Smoke Test Suite)

Create and execute the automated post-deployment validation suite:

```bash
#!/usr/bin/env bash
# scripts/smoke-test.sh
set -euo pipefail

API_URL="${API_URL:-https://api.dispatch.ng}"
FAIL=0

check() {
  local name=$1
  local cmd=$2
  local expected=$3

  echo -n "  Testing $name... "
  RESULT=$(eval "$cmd" 2>/dev/null || echo "FAILED")

  if echo "$RESULT" | grep -q "$expected"; then
    echo "✅ PASS"
  else
    echo "❌ FAIL (Expected: '$expected', Got: '$RESULT')"
    FAIL=$((FAIL + 1))
  fi
}

echo "=========================================================="
echo "Dispatch Production Smoke Test Suite"
echo "Target Endpoint: $API_URL"
echo "=========================================================="

echo "[1. Health & Liveness]"
check "API Root Health" "curl -sf $API_URL/health" '"status":"ok"'
check "PostGIS Connectivity" "curl -sf $API_URL/health" '"database":"ok"'
check "Redis Connectivity" "curl -sf $API_URL/health" '"redis":"ok"'

echo ""
echo "[2. Public Storefront Endpoints]"
check "Vendors Catalog" "curl -sf $API_URL/api/vendors?limit=1" '"data"'

echo ""
echo "[3. Security & Anti-Brute-Force]"
OTP_RESP=$(curl -sf -X POST "$API_URL/api/auth/otp/request" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+2348011112222","purpose":"LOGIN"}' || echo "FAILED")
check "OTP Delivery Initiation" "echo '$OTP_RESP'" '"otpId"'

echo ""
echo "[4. Webhook Security Verification]"
check "Monnify Rejects Tampered HMAC" \
  "curl -s -o /dev/null -w '%{http_code}' -X POST $API_URL/api/webhooks/monnify -H 'monnify-signature: forged_signature' -d '{\"amount\":5000}'" \
  "401"

echo "=========================================================="
if [ $FAIL -eq 0 ]; then
  echo "All production smoke tests passed! System is operational. ✅"
  exit 0
else
  echo "$FAIL smoke test(s) failed. Check logs immediately. ❌"
  exit 1
fi
```

### Manual Operational Checklist
- [ ] API responds with HTTP 200 on `https://api.dispatch.ng/health`.
- [ ] Vendor portal renders at `https://vendor.dispatch.ng`.
- [ ] Customer PWA renders at `https://app.dispatch.ng`.
- [ ] Requesting an OTP initiates an SMS and registers a record in `otp_codes`.
- [ ] Database ledger queries confirm zero imbalance:
  ```sql
  SELECT SUM(CASE direction WHEN 'CREDIT' THEN amount ELSE -amount END) FROM ledger_entries;
  -- Returns: 0.00
  ```

---

## 25.7 Migrations Policy & Zero-Downtime Workflows

### Golden Rules of Database Migrations
1. **Forward-Only:** No destructive down-migrations in production. Revert by issuing a forward migration.
2. **Decoupled Deployment:** Database migrations are applied *before* the application code revision is routed traffic.
3. **Immutability:** Never alter a committed migration file. If schema requirements change, create a subsequent migration.
4. **Data vs. Schema Separation:** Structural DDL and backfill data updates must reside in distinct migration scripts.

### Zero-Downtime 3-Step Schema Evolution Pattern
When adding a non-nullable column or renaming a field:

```text
Step 1 (Deploy 1): Add column as NULLABLE in PostgreSQL DDL
                   ALTER TABLE vendors ADD COLUMN commission_bps INT;

Step 2 (Deploy 2): Run background backfill task to populate existing rows
                   UPDATE vendors SET commission_bps = 1500 WHERE commission_bps IS NULL;

Step 3 (Deploy 3): Enforce NOT NULL constraint and application requirement
                   ALTER TABLE vendors ALTER COLUMN commission_bps SET NOT NULL;
```

---

## 25.8 Rollback Procedures

Every tier of the infrastructure has a deterministic rollback protocol:

### 1. Cloud Run Instant Traffic Rollback
When an application regression is identified post-deploy:
```bash
# Identify previous stable revision tag
gcloud run revisions list --service=prod-dispatch-api --region=europe-west1

# Re-route 100% of incoming production traffic to prior revision
gcloud run services update-traffic prod-dispatch-api \
  --region=europe-west1 \
  --to-revisions=prod-dispatch-api-00001-abc=100
```
*Time to execute: 30 seconds. Production downtime: 0 ms.*

### 2. Terraform Infrastructure Rollback
```bash
cd infra/environments/production
git log -n 5 --oneline
git revert <faulty_commit_hash>
terraform plan -out=tfplan
terraform apply tfplan
```

### 3. Point-in-Time Database Recovery (PITR)
If severe data corruption occurs, Cloud SQL provides 7-day granular transaction logs:
```bash
# Clone production database to a point-in-time snapshot prior to corruption
gcloud sql instances clone prod-dispatch-postgres prod-dispatch-postgres-restore \
  --point-in-time="2026-10-15T14:30:00Z"

# Verify ledger zero-sum balance on restored instance, then switch DATABASE_URL secret
```

### 4. Vertex AI & Gemma Model Rollback
```bash
gcloud ai endpoints undeploy-model ENDPOINT_ID \
  --deployed-model-id=FAILED_MODEL_ID \
  --region=europe-west1

gcloud ai endpoints deploy-model ENDPOINT_ID \
  --model=PREVIOUS_STABLE_MODEL_ID \
  --display-name="production-stable" \
  --region=europe-west1
```

---

## 25.9 Environment Variable Master Reference

### API Service (`apps/api`)
| Variable | Injection Type | Example / Format | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Plain | `production` | Node runtime profile |
| `PORT` | Managed | `8080` | Cloud Run ingress port |
| `DATABASE_URL` | Secret | `postgresql://user:pass@10.10.0.5:5432/dispatch` | Master PostGIS connection pool |
| `REDIS_URL` | Secret | `redis://:auth@10.10.2.3:6379` | Geospatial and cache store |
| `JWT_ACCESS_SECRET`| Secret | `ES256_PRIV_B64:::ES256_PUB_B64` | Asymmetric user authentication |
| `JWT_REFRESH_SECRET`| Secret| `48-byte random string` | Rotation refresh token verification |
| `MONNIFY_API_KEY` | Secret | `MK_PROD_...` | BaaS dynamic virtual account creation |
| `MONNIFY_WEBHOOK_SECRET` | Secret | `live_secret_string` | HMAC-SHA512 webhook signature verification |
| `KORAPAY_SECRET_KEY` | Secret | `sk_live_...` | Secondary payment gateway rail |
| `WHATSAPP_ACCESS_TOKEN`| Secret | `EAA...` | Meta Cloud API conversational bot |
| `TERMII_API_KEY` | Secret | `termii_live_key` | Nigerian SMS OTP delivery |
| `GEMMA_ENDPOINT_URL` | Plain | `http://gemma-serving.gemma.svc...` | Internal GKE dish extraction endpoint |
| `ALLOWED_ORIGINS`| Plain | `https://app.dispatch.ng,https://vendor.dispatch.ng`| CORS whitelist |

---

## 25.10 Troubleshooting: The 20 Operational Failures

### 1. Cloud Run Cannot Connect to Cloud SQL
- **Symptom:** API logs output `connect ETIMEDOUT 10.10.0.5:5432` or `Connection refused`.
- **Root Cause:** Serverless VPC Access connector not attached to Cloud Run service, or incorrect VPC subnet route.
- **Fix:**
  ```bash
  gcloud run services update prod-dispatch-api \
    --region=europe-west1 \
    --vpc-connector=prod-dispatch-serverless \
    --vpc-egress=private-ranges-only
  ```

### 2. Secret Manager Permission Denied
- **Symptom:** Startup fails with `PermissionDenied: Permission 'secretmanager.versions.access' denied`.
- **Root Cause:** Cloud Run service account lacks `roles/secretmanager.secretAccessor`.
- **Fix:**
  ```bash
  gcloud projects add-iam-policy-binding dispatch-prod \
    --member="serviceAccount:prod-dispatch-api@dispatch-prod.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
  ```

### 3. PostgreSQL Maximum Connection Saturation
- **Symptom:** Logs show `FATAL: remaining connection slots are reserved for non-replication superuser connections`.
- **Root Cause:** Cloud Run autoscaled to 50 instances, each with default pool size 25 (1,250 connections vs 200 limit).
- **Fix:** Update `DATABASE_URL` query parameter to `connection_limit=4` and configure Cloud Run `--max-instances=30`.

### 4. Redis Memory Eviction (`OOM command not allowed`)
- **Symptom:** Redis writes fail with `OOM command not allowed when used memory > 'maxmemory'`.
- **Root Cause:** Expired geospatial heartbeat keys not evicted under `noeviction` policy.
- **Fix:**
  ```bash
  gcloud redis instances update prod-dispatch-redis \
    --region=europe-west1 \
    --update-redis-config maxmemory-policy=volatile-lru
  ```

### 5. Webhook HMAC Rejection (`HTTP 401 Unauthorized`)
- **Symptom:** Valid Monnify/Korapay webhooks fail verification in production.
- **Root Cause:** NestJS default body parser consumed JSON stream before raw buffer was saved for HMAC verification.
- **Fix:** Ensure `json({ verify: (req, res, buf) => { req.rawBody = buf; } })` is active in `main.ts`.

### 6. WhatsApp Webhook Token Mismatch
- **Symptom:** Meta webhook subscription fails challenge verification.
- **Root Cause:** Value in Secret Manager does not match Meta App configuration.
- **Fix:** Align `WHATSAPP_VERIFY_TOKEN` across Meta App Dashboard and Secret Manager.

### 7. CORS Preflight Failure on Next.js Storefront
- **Symptom:** Browser reports `No 'Access-Control-Allow-Origin' header present`.
- **Root Cause:** API environment variable `ALLOWED_ORIGINS` missing scheme or trailing slash mismatch.
- **Fix:** Ensure `ALLOWED_ORIGINS` is set to `https://app.dispatch.ng,https://vendor.dispatch.ng` without trailing slashes.

### 8. Termii Nigerian SMS Routing Rejections
- **Symptom:** OTP SMS not delivered to MTN/Airtel numbers on DND (Do-Not-Disturb).
- **Root Cause:** Routing channel set to `generic` instead of `dnd` or `whatsapp`.
- **Fix:** Set Termii channel parameter to `dnd` in `termii.service.ts`.

### 9. Cloud Scheduler Job Authorization Failure (HTTP 403)
- **Symptom:** Scheduled reconciliation fails with `PERMISSION_DENIED`.
- **Root Cause:** Cloud Scheduler service account lacks `roles/run.invoker` on `prod-dispatch-api`.
- **Fix:**
  ```bash
  gcloud run services add-iam-policy-binding prod-dispatch-api \
    --region=europe-west1 \
    --member="serviceAccount:prod-dispatch-worker@dispatch-prod.iam.gserviceaccount.com" \
    --role="roles/run.invoker"
  ```

### 10. Gemma Serving Pod OOMKilled on GKE
- **Symptom:** `kubectl get pods -n gemma` displays status `OOMKilled`.
- **Root Cause:** Gemma 2B model weights require 3.8 GB minimum RAM during peak inference.
- **Fix:** Update Helm values: `resources.requests.memory: 6Gi`, `resources.limits.memory: 8Gi`.

### 11. Stale Terraform State Lock
- **Symptom:** `Error: Error acquiring the state lock`.
- **Root Cause:** Interrupted Terraform apply left GCS lock file active.
- **Fix:** Extract lock Info ID and execute `terraform force-unlock <LOCK_ID>`.

### 12. Artifact Registry Docker Image Pull Denial
- **Symptom:** Cloud Run revision logs `Image failed to pull`.
- **Root Cause:** Cloud Run service account lacks `roles/artifactregistry.reader`.
- **Fix:** Grant `roles/artifactregistry.reader` to Cloud Run service account.

### 13. SSL Certificate Provisioning Timeout
- **Symptom:** Cloud Run custom domain status stuck in `CertificateProvisioning`.
- **Root Cause:** Cloudflare proxy (orange cloud) active during Let's Encrypt / Google challenge.
- **Fix:** Temporarily set Cloudflare DNS records to "DNS Only" (grey cloud) until status is `Ready`.

### 14. Cold-Start Latency Spike on Order Checkout
- **Symptom:** P95 response latency exceeds 4,000 ms during traffic spikes.
- **Root Cause:** `min-instances` configured to 0 (scale-to-zero penalty).
- **Fix:**
  ```bash
  gcloud run services update prod-dispatch-api \
    --region=europe-west1 \
    --min-instances=2
  ```

### 15. Vertex AI Quota Exhaustion (`HTTP 429 Resource Exhausted`)
- **Symptom:** Menu extraction failures spike during vendor onboarding batches.
- **Root Cause:** Vertex AI default quota of 60 RPM exceeded.
- **Fix:** Enable internal fallback to Gemma 2B GKE container and request quota increase in GCP Console.

### 16. Database Deadlock on High-Concurrency Dispatch
- **Symptom:** PostgreSQL reports `deadlock detected` during simultaneous rider offer acceptances.
- **Root Cause:** Non-deterministic wallet locking order across parallel threads.
- **Fix:** Ensure wallets are strictly sorted by UUID before invoking `FOR UPDATE` row-locks in `ledger.repository.ts`.

### 17. BigQuery Continuous CDC Streaming Denial
- **Symptom:** BigQuery pipeline logs `User does not have bigquery.tables.updateData permission`.
- **Root Cause:** Service account missing write permissions on raw ingestion dataset.
- **Fix:** Grant `roles/bigquery.dataEditor` to `prod-dispatch-api` service account.

### 18. FCM Push Notification Delivery Failure
- **Symptom:** Riders do not receive dispatch notifications when app is backgrounded.
- **Root Cause:** Expired FCM registration token or corrupted service account JSON secret.
- **Fix:** Re-issue Firebase service account key and update `prod-dispatch-fcm-service-account`.

### 19. Ghost Rider Telemetry Stale Cache
- **Symptom:** Dispatch algorithm assigns offers to riders who disconnected 10+ minutes ago.
- **Root Cause:** Redis TTL on `rider:heartbeat:<id>` set too long or missing cleanup on disconnect.
- **Fix:** Ensure heartbeat TTL is 120s and execute `removeRiderFromDispatch()` when offline toggle is activated.

### 20. Ledger Imbalance Trigger Exception (`trg_ledger_balanced`)
- **Symptom:** Order completion transaction aborted by PostgreSQL constraint trigger.
- **Root Cause:** Rounding variance where `SUM(CREDIT) != SUM(DEBIT)` by fractions of a kobo.
- **Fix:** Ensure all monetary math uses integer kobo or `Prisma.Decimal` with fixed 2 decimal places before posting.

---

## 25.11 Disaster Recovery & Business Continuity

### Target Recovery Metrics
| Component | Recovery Time Objective (RTO) | Recovery Point Objective (RPO) | Strategy |
| :--- | :--- | :--- | :--- |
| **API & Web Gateways** | $\le 5$ minutes | 0 (Stateless) | Multi-instance Cloud Run auto-heal |
| **PostgreSQL Database** | $\le 30$ minutes | $\le 5$ minutes | High Availability (HA) automatic failover + 7-day PITR |
| **Redis Cache / Geolocation**| $\le 15$ minutes | $\le 1$ hour | Memorystore HA with automatic failover |
| **Infrastructure Config** | $\le 10$ minutes | 0 | Terraform stored in Git + GCS versioned state |
| **Gemma ML Serving** | $\le 20$ minutes | 0 | GKE Autopilot node auto-repair & Helm deployment |

### Disaster Recovery Scenarios & Execution

```text
Scenario A: Primary Cloud SQL Instance Fails
  Action: Zero-touch automatic failover. Cloud SQL detects heartbeat loss and promotes standby instance in <60 seconds.

Scenario B: Region-Wide Cloud Outage (europe-west1)
  1. Trigger cross-region Terraform plan against europe-west4.
  2. Restore Cloud SQL from automated cross-region backup bucket.
  3. Update Cloudflare DNS CNAME records to new regional Cloud Run endpoints.
  4. RTO target: 4 hours.

Scenario C: Accidental Table Dropping or Data Corruption
  1. Freeze writes: Put Cloud Run services in maintenance mode via feature flag.
  2. Execute point-in-time clone (PITR) to timestamp immediately prior to incident.
  3. Validate balance reconciliation on restored database.
  4. Update Secret Manager `prod-dispatch-database-url` and restore traffic.
```

---

## 25.12 The Day 1 Deployment Checklist

The literal hour-by-hour execution schedule for the founding engineer on launch day:

### Morning: Local Validation & Codebase Verification (09:00–12:00)
- [ ] **09:00:** Verify local CLI tool versions (`node v20`, `pnpm 9`, `gcloud`, `terraform 1.7+`).
- [ ] **09:30:** Clone repository, install packages, copy `.env.example`, generate EC keypair.
- [ ] **10:00:** Boot local PostGIS and Redis via `docker compose -f docker-compose.dev.yml up -d`.
- [ ] **10:30:** Run database migrations and seed data. Verify 7 singleton wallets exist.
- [ ] **11:00:** Execute test suites (`npm run test:e2e`). Confirm all 18 tests pass.
- [ ] **11:30:** Code review walkthrough of `modules/ledger/`, `modules/dispatch/`, and `infra/`.

### Afternoon: Infrastructure Provisioning & Secret Injection (13:00–17:00)
- [ ] **13:00:** Create GCP projects `dispatch-prod` and `dispatch-stg`; link corporate billing.
- [ ] **13:30:** Enable all 19 required GCP APIs via `gcloud services enable`.
- [ ] **14:00:** Create Terraform service account and provision state bucket `gs://dispatch-prod-tfstate`.
- [ ] **14:30:** Execute `terraform init` and `terraform plan`; review output with CTO.
- [ ] **15:00:** Run `terraform apply`; verify creation of 74 resources.
- [ ] **15:45:** Populate all 17 secrets in Google Secret Manager using CLI standards.
- [ ] **16:30:** Build and push production Docker containers (API, Worker, Vendor, PWA) to Artifact Registry.

### Late Afternoon / Evening: Production Rollout & Smoke Testing (17:00–19:00)
- [ ] **17:00:** Execute initial Cloud SQL migration and seed via Cloud SQL Proxy.
- [ ] **17:30:** Deploy Cloud Run workloads (API, Worker, Frontends) and verify healthy instances.
- [ ] **18:00:** Deploy Gemma 2B Helm chart to GKE Autopilot cluster.
- [ ] **18:15:** Map custom domains in Cloud Run and configure Cloudflare DNS records.
- [ ] **18:30:** Configure live webhooks in Monnify, Korapay, and Meta WhatsApp dashboards.
- [ ] **18:45:** Execute automated smoke test suite: `./scripts/smoke-test.sh`.
- [ ] **19:00:** Post deployment sign-off in `#alerts` and notify founders: **"Production is live."**
