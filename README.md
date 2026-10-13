# Dispatch Rider Aggregator & Food Vendor Storefront

A unified multi-tenant platform optimized for fast e-commerce catalog rendering, lightweight motorcycle rider mobile data usage, and reliable double-entry financial operational tracking.

---

## 🏛 System Architecture

```text
       [ Customer PWA ]        [ Vendor Portal ]        [ Rider App (Flutter) ]
              │                       │                           │
              ▼                       ▼                           ▼
       ┌─────────────────────────────────────────────────────────────────┐
       │                     API Gateway / Nginx Proxy                   │
       └─────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
       ┌──────────────────────────────┐       ┌──────────────────────────────┐
       │    Order Management (OMS)    │       │   Dispatch & Geospatial Engine│
       └──────────────┬───────────────┘       └──────────────▲───────────────┘
                      │                                      │
                      ▼                                      │
       ┌──────────────────────────────┐       ┌──────────────┴───────────────┐
       │ Payment Aggregator & Webhooks│◄─────►│    Internal Ledger & Escrow  │
       └──────────────────────────────┘       └──────────────────────────────┘
```

---

## 📁 Repository Structure

```text
dispatch-and-food-frontstore/
├── backend/                       # NestJS Modular Backend Service
│   ├── src/
│   │   ├── common/
│   │   │   ├── database/          # PostgreSQL Connection Pool & Transactions
│   │   │   ├── redis/             # Redis Geospatial (GEOADD / GEORADIUS) & Cache
│   │   │   ├── guards/            # JWT & RBAC Roles Guards
│   │   │   └── filters/           # Global Exception Normalizer
│   │   └── modules/
│   │       ├── auth/              # Phone Number + Hashed OTP (bcrypt) Authentication
│   │       ├── users/             # User Management & RBAC Roles
│   │       ├── vendors/           # Multi-Tenant Kitchens, WhatsApp/IG Slugs, Clusters (Tanke, GRA)
│   │       ├── products/          # Catalog (is_published vs is_available)
│   │       ├── orders/            # Order Management System (ORD-XXXX numbering & Snapshots)
│   │       ├── dispatch/          # Geospatial Candidate Matching & Fairness Rounds
│   │       ├── deliveries/        # Delivery Execution & Dropoff Photo Proof
│   │       ├── riders/            # Guarantor Verification Gate & Battery-Efficient GPS Heartbeat
│   │       ├── payments/          # Monnify / Korapay BaaS Virtual Accounts & Idempotent Webhooks
│   │       ├── ledger/            # Custom Double-Entry Ledger & Escrow Settlement Engine
│   │       ├── payouts/           # Vendor & Rider Bank Payout Transfers
│   │       ├── reviews/           # Vendor & Rider Rating (1-5 Stars) Engine
│   │       └── notifications/     # Transactional Outbox (SMS, WhatsApp, Push, Email)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                      # Next.js 14 + Tailwind CSS (SSR & Customer PWA)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Platform Discovery & Cluster Zone Selector
│   │   │   ├── store/[slug]/      # Fast SSR Vendor Storefront for WhatsApp/IG Sharing
│   │   │   ├── checkout/          # Instant Bank Transfer Virtual Account Presentation
│   │   │   ├── track/[orderNo]/   # Real-Time Delivery Tracking
│   │   │   ├── vendor-portal/     # Live Kitchen Order Board & Open/Closed Switch
│   │   │   └── admin/ledger/      # Financial Double-Entry Audit & Reconciliation Status
│   │   └── lib/api.ts
│   └── package.json
│
├── mobile/                        # Flutter Cross-Platform Rider App
│   ├── lib/
│   │   ├── core/                  # Low-data HTTP Client & 20s GPS Heartbeat Sync
│   │   ├── screens/
│   │   │   ├── login_screen.dart  # Phone OTP Authentication
│   │   │   ├── home_screen.dart   # Online/Offline Toggle & Incoming Dispatch Modal
│   │   │   └── wallet_screen.dart # Real-time Rider Earnings & Payout Requests
│   └── pubspec.yaml
│
├── packages/
│   └── shared/                    # Shared TypeScript Types, Enums & Chart of Accounts
│
├── database/
│   ├── ddl.sql                    # Production PostgreSQL 14+ DDL (PostGIS, pgcrypto, citext)
│   ├── seed.sql                   # Seed Data: System Wallets, Tanke/GRA Clusters, Vendors, Riders
│   └── reconciliation.sql         # Nightly Balance Integrity & Ghost Rider Audit Script
│
├── infra/                         # Terraform Infrastructure-as-Code for GCP (Artifact 10)
│   ├── environments/prod/         # Production Environment (Cloud Run, Cloud SQL HA, GKE Autopilot)
│   └── modules/                   # VPC, Cloud SQL, Memorystore, GKE, Vertex AI, BigQuery, IAM
│
├── load-tests/                    # k6 Load & Concurrency Stress Testing Suite
│   ├── orders.js                  # 100 orders/sec OMS checkout spike testing
│   ├── dispatch.js                # 50-VU concurrent offer matching & lock race condition testing
│   └── rider-telemetry.js         # 500 concurrent riders streaming GPS heartbeats (<120ms GEOADD)
│
├── docs/                          # Architecture Specs, Playbooks & Grant Documentation
│   ├── DEPLOYMENT_GUIDE.md        # Production Infrastructure Deployment & Runbook (Artifact 25)
│   ├── LAUNCH_CALENDAR_90_DAY.md  # 90-Day Multi-Cluster Expansion & Seed Plan (Artifact 24)
│   ├── FOUNDER_OPERATING_AGREEMENT.md # Founder Equity, Reverse Vesting & Governance (Artifact 23)
│   ├── LEGAL_REGULATORY_CHECKLIST.md # Legal, NDPR, Tax & Regulatory Compliance Manual (Artifact 22)
│   ├── JOB_DESCRIPTIONS.md        # 8 Core First-Hire Specs, Scoring Rubrics & Bands (Artifact 21)
│   ├── EXECUTION_SPRINT_PLAN.md   # 30-Day Operational Execution Sprint Plan (Artifact 20)
│   ├── INVESTOR_DECK.md           # 15-Slide Pre-Seed Investor Pitch Deck & Playbook (Artifact 19)
│   ├── GOOGLE_FOR_STARTUPS_APPLICATION.md # Official $350K AI Track Grant Submission Draft (Artifact 18)
│   ├── AI_TRACK_APPLICATION.md    # Google for Startups AI Track Proposal & Architecture (Artifact 2)
│   ├── BIGQUERY_VERTEX_PIPELINES.md# Vertex AI & BigQuery Machine Learning Pipelines
│   ├── OBSERVABILITY_RUNBOOK.md   # Production SRE Runbook & 3 AM Incident Playbooks (Artifact 13)
│   ├── VENDOR_ONBOARDING_PLAYBOOK.md# Ops Manual: 200 Vendors in Ilorin (Artifact 14)
│   ├── RIDER_RECRUITMENT_PLAYBOOK.md# Fleet Manual: 300 Riders & Guarantor Vetting (Artifact 15)
│   ├── GTM_PLAYBOOK.md            # Customer Acquisition & Viral Loops (Artifact 16)
│   └── FINANCIAL_MODEL.md         # 36-Month Pro Forma & Unit Economics Model (Artifact 17)
│
└── docker-compose.yml             # Local Multi-Container Setup (PostGIS 15 + Redis 7)
```

---

## 💰 Double-Entry Ledger & Chart of Accounts

Every monetary transaction is paired and guaranteed to balance: `SUM(CREDIT) - SUM(DEBIT) = 0`.
Enforced at the database level by the deferred constraint trigger `trg_ledger_balanced`:

| Account Code | Meaning | Normal Balance |
| :--- | :--- | :--- |
| `1100_CUSTOMER_ESCROW` | Customer money received, held until completion | Debit |
| `1200_PSP_RECEIVABLE` | In-flight funds from Monnify / Korapay | Debit |
| `2000_VENDOR_PAYABLE` | Owed to vendors post-commission | Credit |
| `2100_RIDER_PAYABLE` | Owed to motorcycle riders | Credit |
| `2200_PLATFORM_REVENUE` | Commission and service fees earned | Credit |
| `2300_CUSTOMER_REFUND_PAYABLE` | Refunds owed upon order failure | Credit |
| `3000_BANK_SETTLEMENT` | Cash actually residing in bank account | Debit |

### Transaction Flow
1. **Order Paid**: 
   - `DEBIT 1200_PSP_RECEIVABLE` (Bank/PSP asset increases)
   - `CREDIT 1100_CUSTOMER_ESCROW` (Escrow liability increases)
2. **Order Completed**:
   - `DEBIT 1100_CUSTOMER_ESCROW` (Escrow liability decreases)
   - `CREDIT 2000_VENDOR_PAYABLE` (Vendor liability increases)
   - `CREDIT 2100_RIDER_PAYABLE` (Rider liability increases)
   - `CREDIT 2200_PLATFORM_REVENUE` (Platform commission increases)
3. **Payout Settled**:
   - `DEBIT 2000_VENDOR_PAYABLE` or `2100_RIDER_PAYABLE`
   - `CREDIT 3000_BANK_SETTLEMENT`

---

## 🚀 Quickstart

### 1. Start Infrastructure (PostgreSQL with PostGIS + Redis)
```bash
docker-compose up -d postgres redis
```
This automatically runs `database/ddl.sql` and `database/seed.sql` on startup.

### 2. Start Backend Modular Service
```bash
cd backend
npm install
npm run start:dev
```
API runs on `http://localhost:4000/api`  
Swagger Documentation: `http://localhost:4000/api/docs`

### 3. Start Frontend (Vendor Storefront & Admin)
```bash
cd frontend
npm install
npm run dev
```
Storefront opens on `http://localhost:3000`

### 4. Run Flutter Mobile App (Rider App)
```bash
cd mobile
flutter pub get
flutter run
```

### 5. Run Nightly Reconciliation Audit
```bash
docker-compose exec -T postgres psql -U postgres -d dispatch_storefront < database/reconciliation.sql
```
Or call `GET http://localhost:4000/api/ledger/audit` via the Admin API.

### 6. Run Concurrency & Integration Tests
```bash
cd backend
npm run test:e2e
```
Executes:
- `auth.e2e-spec.ts`: Rate limits, bcrypt OTP verification, JWT access/refresh rotation.
- `ledger.e2e-spec.ts`: Zero-sum balance validation, wallet locking, and 10 concurrent transfer racers.
- `dispatch-lock.e2e-spec.ts`: Atomic Redis single-winner lock with 10 simultaneous rider claims.

### 7. Run k6 Load & Stress Tests
```bash
cd load-tests
# Run complete test suite (orders spike, candidate lock race, rider GPS streaming)
./run-all.sh

# Or run individual scripts:
k6 run orders.js
k6 run dispatch.js
k6 run rider-telemetry.js
```

---

## 📚 Master Playbooks & Strategic Architecture

| Document | Category | Key Contents & Operational Value |
| :--- | :--- | :--- |
| [`DEPLOYMENT_GUIDE.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/DEPLOYMENT_GUIDE.md) | **Production Runbook** | Complete GCP bootstrap, secret population, Cloud Run/GKE deploy, smoke test & rollback. |
| [`LAUNCH_CALENDAR_90_DAY.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/LAUNCH_CALENDAR_90_DAY.md) | **Multi-Cluster Scale** | 90-day expansion (GRA/Challenge), 13K orders/mo run-rate, +₦2M EBITDA & ₦300M Seed round. |
| [`FOUNDER_OPERATING_AGREEMENT.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/FOUNDER_OPERATING_AGREEMENT.md) | **Corporate Governance** | 50/40/10 equity split, 4-yr vesting / 1-yr cliff, decision categories, 4-stage deadlock ladder. |
| [`LEGAL_REGULATORY_CHECKLIST.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/LEGAL_REGULATORY_CHECKLIST.md) | **Legal & Compliance** | CAC corporate setup, NDPR data compliance, 14.5% payroll taxes, gig classification & insurance. |
| [`JOB_DESCRIPTIONS.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/JOB_DESCRIPTIONS.md) | **Talent & Hiring** | 8 core role specs, ₦50K paid trials, interview rubrics, equity bands & rejection SLA. |
| [`EXECUTION_SPRINT_PLAN.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/EXECUTION_SPRINT_PLAN.md) | **Launch Operations** | 30-day operational launch plan, 3 parallel tracks, ₦24M budget, Tanke rollout, Day 31 Gate. |
| [`INVESTOR_DECK.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/INVESTOR_DECK.md) | **Capital Raising** | 15-slide pre-seed pitch deck, 5-minute verbal script, 12 investor objection answers & data room. |
| [`GOOGLE_FOR_STARTUPS_APPLICATION.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/GOOGLE_FOR_STARTUPS_APPLICATION.md) | **Grant Submission Draft** | Formal ~2,500-word submission text for Google for Startups Cloud Program ($350K AI Track). |
| [`AI_TRACK_APPLICATION.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/AI_TRACK_APPLICATION.md) | **Google Cloud Grant** | Comprehensive proposal & technical architecture for Google Cloud AI Track. |
| [`BIGQUERY_VERTEX_PIPELINES.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/BIGQUERY_VERTEX_PIPELINES.md) | **Machine Learning** | BigQuery feature store, Gemma 2B menu normalization, and Vertex XGBoost dispatch. |
| [`OBSERVABILITY_RUNBOOK.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/OBSERVABILITY_RUNBOOK.md) | **SRE & Production Ops** | Golden signals, 7 SLOs, P1–P4 alerts, and 3 AM runbooks for ledger balance drift & dispatch SLA collapse. |
| [`VENDOR_ONBOARDING_PLAYBOOK.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/VENDOR_ONBOARDING_PLAYBOOK.md) | **Merchant Ops** | 65-min onboarding manual for first 200 vendors in Tanke, GRA, Challenge, and Fate clusters. |
| [`RIDER_RECRUITMENT_PLAYBOOK.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/RIDER_RECRUITMENT_PLAYBOOK.md) | **Fleet Logistics** | Manual for recruiting and training 300 riders, ₦500K guarantor vetting, and MyCoverGenius insurance. |
| [`GTM_PLAYBOOK.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/GTM_PLAYBOOK.md) | **Growth & Marketing** | 0 to 10,000 MAC acquisition manual, 70% cluster saturation rule, and 45-min viral WhatsApp loops. |
| [`FINANCIAL_MODEL.md`](file:///Users/sulaiman/Downloads/dispatch-and-food-frontstore/docs/FINANCIAL_MODEL.md) | **Financial Architecture** | 36-month pro forma model, unit economics (₦938/order net contribution margin), and break-even math. |

---

## ☁️ Google Cloud Platform Footprint

The system's cloud architecture is defined in Terraform (`infra/`):
- **Serverless API & Frontends:** Cloud Run (NestJS backend, Next.js storefront/admin portal).
- **Relational Storage:** Cloud SQL PostgreSQL 16 with PostGIS extension and High Availability (HA).
- **In-Memory Cache & Geolocation:** Memorystore for Redis 7 with TLS & AUTH.
- **AI Inference & LLM Serving:** GKE Autopilot running Gemma 2B containerized microservices + Vertex AI Gemini 1.5 endpoints.
- **Analytics & BigQuery:** Continuous CDC streaming into BigQuery for dispatch feature store and financial reconciliation.

Tech stack is pragmatic for the Nigerian market:

Flutter for budget Androids ✅

Next.js SSR for WhatsApp/IG link previews ✅

Redis for geospatial (GEOADD/GEOSEARCH) ✅

Mapbox/OSM over Google Maps (cost) ✅