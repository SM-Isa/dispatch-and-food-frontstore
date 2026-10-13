# ARTIFACT 30: System Architecture Overview
The consolidated architecture document. One place that answers: what are all the components, what does each do, where is it deployed, and how does a request flow through the system.

This is the first thing a new engineer reads, the first thing a QA engineer needs, and the document a technical reviewer will ask for.

Structure:

System at a glance — one paragraph, one diagram

Component inventory — every service, its purpose, its deployment

Deployment topology — where each component lives (GCP, external)

Request flows — 4 primary journeys, step by step

WhatsApp integration deep-dive — the conversational commerce pipeline

Data ownership matrix — which service owns which data

External integrations map — every third party and what they do

Network and security boundaries — VPC, TLS, auth

Failure domains — what happens when each component goes down

Environments — dev, staging, production


---

## 30.1 System at a Glance
Dispatch is a three-sided marketplace connecting customers, vendors, and riders in Nigerian tier-2 cities. Three frontends serve the three actors. One backend serves all three. AI modules are woven into the critical path. External providers handle payments, messaging, and maps.

In one sentence: a Next.js customer PWA, a Next.js vendor portal, and a Flutter rider app talk to a NestJS API on Cloud Run, which uses Postgres, Redis, and Google AI services, and integrates with Monnify, Korapay, Meta WhatsApp, Termii, and Google Maps.

System overview diagram
```text
                            ┌──────────────────────────────────────┐
                            │           EXTERNAL USERS             │
                            └──────────────────────────────────────┘
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
      ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
      │  CUSTOMERS    │          │   VENDORS     │          │    RIDERS     │
      │               │          │               │          │               │
      │  WhatsApp     │          │  Vendor       │          │  Rider App    │
      │  (primary)    │          │  Portal       │          │  (Flutter)    │
      │               │          │  (Next.js)    │          │               │
      │  Customer     │          │               │          │               │
      │  PWA          │          │               │          │               │
      │  (Next.js)    │          │               │          │               │
      └───────┬───────┘          └───────┬───────┘          └───────┬───────┘
              │                          │                          │
              │           HTTPS / WSS    │                          │
              └──────────────────────────┼──────────────────────────┘
                                         ▼
                            ┌──────────────────────────┐
                            │      API GATEWAY         │
                            │   (Cloud Run + Nginx)    │
                            │   api.dispatch.ng        │
                            └────────────┬─────────────┘
                                         │
                                         ▼
                            ┌──────────────────────────┐
                            │      NestJS API          │
                            │   (Cloud Run)            │
                            │                          │
                            │  ┌──────────────────┐    │
                            │  │  Auth Module     │    │
                            │  │  Orders Module   │    │
                            │  │  Dispatch Module │    │
                            │  │  Ledger Module   │    │
                            │  │  Payments Module │    │
                            │  │  AI Module       │    │
                            │  │  Realtime (WS)   │    │
                            │  └──────────────────┘    │
                            └────────────┬─────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
      ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
      │  CLOUD SQL    │          │  MEMORYSTORE  │          │  GKE AUTOPILOT│
      │  PostgreSQL 16│          │   Redis 7     │          │  Gemma        │
      │  + PostGIS    │          │               │          │  (fine-tuned) │
      └───────────────┘          └───────────────┘          └───────┬───────┘
                                                                   │
                                                                   ▼
                                                          ┌───────────────┐
                                                          │  VERTEX AI    │
                                                          │  XGBoost      │
                                                          │  Endpoints    │
                                                          └───────────────┘
                                         │
                                         ▼
                            ┌──────────────────────────┐
                            │  BIGQUERY                │
                            │  (analytics + ML data)   │
                            └──────────────────────────┘
                                         │
                                         ▼
                            ┌──────────────────────────┐
                            │      EXTERNAL PROVIDERS  │
                            │  ┌──────────────────┐    │
                            │  │ Monnify (bank)   │    │
                            │  │ Korapay (cards)  │    │
                            │  │ Meta (WhatsApp)  │    │
                            │  │ Termii (SMS)     │    │
                            │  │ Google Maps      │    │
                            │  │ Firebase (FCM)   │    │
                            │  │ Sentry           │    │
                            │  │ MyCoverGenius    │    │
                            │  └──────────────────┘    │
                            └──────────────────────────┘
```

---

## 30.2 Component Inventory
Every component, one row. Purpose, technology, deployment target, GCP resource name.


### Frontend components
| Component | Purpose | Technology | Deployed to | URL |
| :--- | :--- | :--- | :--- | :--- |
| Customer PWA | Customers browse vendors, place orders, track deliveries, view history | Next.js 14 (App Router), Tailwind CSS, TypeScript | Cloud Run | app.dispatch.ng |
| Vendor Portal | Vendors manage menus, accept orders, view earnings, toggle sold-out | Next.js 14 (App Router), Tailwind CSS, TypeScript | Cloud Run | vendor.dispatch.ng |
| Rider App | Riders receive offers, navigate, deliver, track earnings | Flutter 3.24 (Android + iOS) | Google Play + App Store | In-store |
| Admin Dashboard | Ops team manages vendors, riders, orders, disputes, ledger | Next.js 14 (internal, behind IAP) | Cloud Run (private) | admin.dispatch.ng |

### Backend components
| Component | Purpose | Technology | Deployed to | Internal URL |
| :--- | :--- | :--- | :--- | :--- |
| API Service | All REST endpoints, WebSocket, auth, business logic | NestJS 10, Node 20, TypeScript | Cloud Run | prod-dispatch-api |
| Worker Service | Background jobs: reconciliation, payout batches, notification outbox, forecast refresh | NestJS 10, BullMQ, Node 20 | Cloud Run | prod-dispatch-worker |
| Dispatch Engine | (part of API) Broadcast offers, handle accept/reject, escalation ladder | NestJS module | Cloud Run (in API) | — |
| Ledger Service | (part of API) Double-entry posting, wallet management, reconciliation | NestJS module | Cloud Run (in API) | — |
| AI Client | (part of API) Unified interface to Gemini, Gemma, Vertex AI | NestJS module | Cloud Run (in API) | — |
| Realtime Gateway | (part of API) WebSocket rooms for orders, dispatch, rider offers | NestJS Socket.IO | Cloud Run (in API) | — |

### Data components
| Component | Purpose | Technology | Deployed to | Notes |
| :--- | :--- | :--- | :--- | :--- |
| PostgreSQL | Primary database: users, orders, ledger, vendors, riders | Cloud SQL Postgres 16 + PostGIS | Cloud SQL | Regional HA, read replica, PITR |
| Redis | Cache, session store, rate limits, rider presence, BullMQ queues | Memorystore Redis 7 | Memorystore | Standard HA, 5 GB |
| BigQuery | Analytics, ML feature store, event logs | BigQuery | GCP | 4 datasets: raw, features, models, analytics |
| Cloud Storage | Media (logos, banners, food photos), backups, model artifacts | GCS | GCP | 5 buckets: media, menu-images, backups, model-artifacts, build-logs |

### AI components
| Component | Purpose | Technology | Deployed to | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Gemini (Vision + Pro + Flash) | Menu extraction, WhatsApp parsing, support triage, fraud explanation | Google Vertex AI (Gemini models) | GCP (regional) | API-called, not self-hosted |
| Gemma 2B | Fine-tuned dish classification | vLLM on GKE Autopilot | GKE | 2 replicas, autoscaling to 4 |
| Vertex AI Endpoints | Demand forecast (XGBoost), fraud score (XGBoost), rider match (logistic regression) | Vertex AI Endpoints | GCP | 3 endpoints |
| Vertex AI Pipelines | Weekly model retraining | Vertex AI Pipelines | GCP | Triggered by Cloud Scheduler |

### External providers
| Provider | Purpose | Integration | Auth |
| :--- | :--- | :--- | :--- |
| Monnify | Bank transfer payments, virtual accounts, payouts | REST API + webhooks | API key + webhook HMAC |
| Korapay | Card payments | REST API + webhooks | API key + webhook HMAC |
| Meta WhatsApp Cloud API | Customer messaging channel | Webhooks + REST API | App secret + HMAC |
| Termii | SMS for OTP delivery | REST API | API key |
| Google Maps Platform | Routing, distance, geocoding | REST API | API key (restricted) |
| Firebase Cloud Messaging | Push notifications to rider app | REST API | Service account |
| Sentry | Error tracking | SDK | DSN |
| MyCoverGenius | Rider insurance | REST API + webhooks | API key |

### DevOps components
| Component | Purpose | Deployed to | Notes |
| :--- | :--- | :--- | :--- |
| Terraform state bucket | Stores infrastructure state | GCS | Versioned |
| Artifact Registry | Container images | GCP | Scanned for CVEs |
| Cloud Scheduler | Cron jobs (reconciliation, payouts, forecast) | GCP | 4 jobs |
| Secret Manager | All secrets (18 secrets) | GCP | Versioned |
| Cloud Logging | All application logs | GCP | 90-day retention |
| Cloud Monitoring | Metrics, dashboards, alerts | GCP | Integrated with PagerDuty |
| Cloud Trace | Distributed tracing | GCP | Sampling 10% |

---

## 30.3 Deployment Topology
Every component's location within GCP, and its network position.


### GCP project structure
```text
GCP Organization: dispatch-ng
└── Project: dispatch-prod
    ├── Region: europe-west1 (primary)
    ├── Region: europe-west1 (evaluating africa-south1)
    │
    ├── VPC: prod-dispatch-vpc (10.10.0.0/16)
    │   ├── Subnet: prod-dispatch-subnet (10.10.1.0/24)
    │   ├── Secondary ranges: pods (10.20.0.0/16), services (10.30.0.0/20)
    │   ├── Private Service Range: 10.100.0.0/16 (Cloud SQL + Redis)
    │   ├── Cloud NAT
    │   └── Serverless VPC Connector (10.10.2.0/28)
    │
    ├── Cloud Run services (all in europe-west1)
    │   ├── prod-dispatch-api (VPC connector, min 2, max 50)
    │   ├── prod-dispatch-worker (VPC connector, min 1, max 10)
    │   ├── prod-dispatch-vendor-portal (min 1, max 20)
    │   ├── prod-dispatch-customer-pwa (min 1, max 30)
    │   └── prod-dispatch-admin (private, min 1, max 5)
    │
    ├── GKE Autopilot
    │   └── Cluster: prod-dispatch-gke
    │       └── Namespace: gemma
    │           └── Deployment: gemma-serving (2-4 replicas)
    │
    ├── Cloud SQL
    │   └── Instance: prod-dispatch-postgres
    │       ├── Private IP: 10.100.0.5
    │       ├── Tier: db-custom-4-16384
    │       ├── HA: REGIONAL
    │       └── Read replica: prod-dispatch-postgres-replica
    │
    ├── Memorystore
    │   └── Instance: prod-dispatch-redis
    │       ├── Private IP: 10.100.1.3
    │       ├── Tier: STANDARD_HA
    │       └── Auth + TLS enabled
    │
    ├── BigQuery datasets
    │   ├── dispatch-prod_raw
    │   ├── dispatch-prod_features
    │   ├── dispatch-prod_models
    │   └── dispatch-prod_analytics
    │
    ├── Vertex AI Endpoints (europe-west1)
    │   ├── prod-dispatch-demand-forecast
    │   ├── prod-dispatch-fraud-score
    │   └── prod-dispatch-rider-match
    │
    ├── Cloud Storage buckets
    │   ├── prod-dispatch-media
    │   ├── prod-dispatch-menu-images
    │   ├── prod-dispatch-backups
    │   ├── prod-dispatch-model-artifacts
    │   └── prod-dispatch-build-logs
    │
    └── Secret Manager
        └── 18 secrets (all prefixed with prod-dispatch-)
```

### Network topology
```text
                       INTERNET
                          │
                          ▼
              ┌────────────────────────┐
              │   Cloud DNS + TLS      │
              │   (Cloudflare proxy)   │
              └───────────┬────────────┘
                          │
              ┌───────────┴────────────┐
              │                        │
              ▼                        ▼
    ┌──────────────────┐    ┌──────────────────┐
    │  Cloud Run       │    │  Cloud Run       │
    │  (public)        │    │  (private)       │
    │                  │    │                  │
    │  - api           │    │  - admin         │
    │  - vendor-portal │    │                  │
    │  - customer-pwa  │    └──────────────────┘
    └────────┬─────────┘
             │
             │ Serverless VPC Connector
             │ (10.10.2.0/28)
             ▼
    ┌────────────────────────────────────────────┐
    │         VPC prod-dispatch-vpc              │
    │                                            │
    │  ┌──────────────┐    ┌──────────────┐     │
    │  │  Cloud SQL   │    │  Memorystore │     │
    │  │  10.100.0.5  │    │  10.100.1.3  │     │
    │  └──────────────┘    └──────────────┘     │
    │                                            │
    │  ┌──────────────┐                          │
    │  │  GKE Pods    │                          │
    │  │  10.20.x.x   │                          │
    │  └──────────────┘                          │
    │                                            │
    └────────────────┬───────────────────────────┘
                     │
                     │ Cloud NAT (egress only)
                     ▼
    ┌────────────────────────────────────────────┐
    │         EXTERNAL PROVIDERS                 │
    │  Monnify, Korapay, Meta, Termii,           │
    │  Google Maps, Firebase, Sentry,            │
    │  MyCoverGenius                             │
    └────────────────────────────────────────────┘
```
Key points:

Cloud Run services reach Cloud SQL and Redis via the Serverless VPC Connector.


### External providers are reached via Cloud NAT (outbound only, no inbound).

Webhooks from external providers hit Cloud Run's public HTTPS endpoint.

The admin dashboard is behind IAP (Identity-Aware Proxy).


---

## 30.4 Request Flows
Four primary journeys. Each shows every component touched and every handoff.


### Flow 1 — Customer places an order (via WhatsApp)
This is the primary customer journey. WhatsApp is the entry point.

```text
Step 1: Customer sends WhatsApp message
────────────────────────────────────────────────────────────────
   Customer's WhatsApp
        │
        │  "Abeg send two packs of amala from Mama's Kitchen to GRA"
        ▼
   Meta WhatsApp Cloud API
        │
        │  Webhook POST (HMAC signed)
        ▼
   api.dispatch.ng/webhooks/whatsapp
        │
   (handled by NestJS API)
        │
        ├──▶ Verify HMAC signature
        ├──▶ Insert into webhook_events (idempotency)
        ├──▶ Return 200 within 5 seconds (required by Meta)
        └──▶ Enqueue message processing job to Redis (BullMQ)

Step 2: Message processing (async worker)
────────────────────────────────────────────────────────────────
   Worker (Cloud Run)
        │
        ├──▶ Fetch message from queue
        ├──▶ If voice note: call Gemini native audio for transcription
        ├──▶ Call Gemini 1.5 Pro with Structured Outputs:
        │      - System prompt (from prompts table)
        │      - Conversation history
        │      - New message
        │      - Response schema (order intent)
        ├──▶ Parse response:
        │      - Intent: PLACE_ORDER
        │      - Vendor: "Mama's Kitchen" (cluster hint: GRA)
        │      - Items: [{name: "Amala", qty: 2}]
        │      - Address: "GRA, beside First Bank"
        │      - Confidence: 0.94
        ├──▶ If confidence < 0.85: generate clarification question
        │    (separate Gemini call), send reply, await response
        ├──▶ Resolve vendor: query Postgres for "Mama's Kitchen" in GRA
        ├──▶ Resolve items: match "Amala" against vendor's menu
        └──▶ Create order via OrdersModule

Step 3: Order creation
────────────────────────────────────────────────────────────────
   OrdersModule (inside API service)
        │
        ├──▶ Validate vendor open, items available
        ├──▶ Calculate pricing:
        │      - Subtotal: ₦5,000
        │      - Delivery fee: ₦850 (distance-based)
        │      - Platform fee: ₦100
        │      - Total: ₦5,950
        ├──▶ Check customer risk score (call Vertex AI fraud-score)
        ├──▶ Insert into orders table (status: PENDING)
        ├──▶ Insert order_items (with product snapshot)
        ├──▶ Insert order_status_history
        ├──▶ Create delivery record (status: LOOKING_FOR_RIDER)
        ├──▶ Write to BigQuery (events table)
        └──▶ Call Monnify: generate virtual account

Step 4: Customer receives payment instructions
────────────────────────────────────────────────────────────────
   Worker sends WhatsApp reply via Meta Cloud API:
        "Order confirmed! Total: ₦5,950
         Pay to: 9012345678 (Wema Bank)
         Account name: DISPATCH/ORD-2K3F9A
         Valid for 30 minutes."
        │
        ▼
   Customer's WhatsApp

Step 5: Customer pays
────────────────────────────────────────────────────────────────
   Customer transfers ₦5,950 from their bank app
        │
        ▼
   Monnify receives payment, matches to virtual account
        │
        │  Webhook POST (HMAC signed)
        ▼
   api.dispatch.ng/webhooks/monnify
        │
        ├──▶ Verify HMAC signature
        ├──▶ Insert into webhook_events (idempotency)
        ├──▶ Look up order by payment_reference
        ├──▶ Open Postgres transaction:
        │      - UPDATE orders SET status = 'PAID', paid_at = now()
        │      - INSERT order_status_history
        │      - LedgerService.postEntryGroup(...)
        │          DEBIT  CUSTOMER_ESCROW  ₦5,950
        │          CREDIT VENDOR_PAYABLE   ₦4,000 (80% of ₦5,000)
        │          CREDIT RIDER_PAYABLE    ₦850 (delivery fee)
        │          CREDIT PLATFORM_REVENUE ₦1,000 (₦800 commission + ₦100 platform + ₦100 delivery margin)
        │          (See Artifact 7 for full breakdown)
        │      - UPDATE wallets (balances)
        │      - Verify entry group sums to zero
        ├──▶ Emit WebSocket event: order.paid
        └──▶ Return 200

Step 6: Vendor receives notification
────────────────────────────────────────────────────────────────
   Vendor's tablet/phone (Vendor Portal via WebSocket)
        │
        │  Event: order.paid
        ▼
   UI shows: "New order — ₦5,950 — 2 packs Amala"
   Plays notification sound
   Vendor taps "Accept"
        │
        ▼
   POST /vendors/me/orders/{id}/accept
        │
        ├──▶ UPDATE orders SET status = 'PREPARING'
        ├──▶ INSERT order_status_history
        └──▶ Emit WebSocket: order.preparing
```
Total components touched:
Meta WhatsApp → Cloud Run API (webhook) → Redis (queue) → Cloud Run Worker → Gemini Pro → Postgres → Vertex AI (fraud) → Monnify → Cloud Run API (webhook) → Postgres (ledger) → WebSocket → Vendor Portal


### Flow 2 — Rider accepts a delivery offer
Once the vendor marks food ready, the dispatch engine kicks in.

```text
Step 1: Vendor marks order ready
────────────────────────────────────────────────────────────────
   Vendor Portal
        │
        ▼
   POST /vendors/me/orders/{id}/ready-for-pickup
        │
   (API service)
        │
        ├──▶ UPDATE orders SET status = 'AWAITING_RIDER'
        ├──▶ DispatchEngine.beginDispatch(deliveryId)
        │      (See Flow 3 for the dispatch sequence)
        └──▶ Return 202

Step 2: Dispatch engine broadcasts
────────────────────────────────────────────────────────────────
   DispatchEngine (inside API service)
        │
        ├──▶ Query Redis: GEOSEARCH riders:online
        │      FROMLONLAT (pickup coords)
        │      BYRADIUS 2000m
        │      Filter: no active offer, not busy
        ├──▶ For each candidate: query Postgres for rider stats
        ├──▶ Score candidates (DispatchScorer):
        │      - Proximity: 40%
        │      - Idle time: 20%
        │      - Acceptance rate: 20%
        │      - Rating: 10%
        │      - AI match score (Vertex): 10%
        ├──▶ For top 3 candidates:
        │      - INSERT rider_dispatch_attempts
        │      - Redis SET NX offer:{id}:claimed
        │      - Push WebSocket to rider:{id}:offers
        │          Event: dispatch.offer
        │          Payload: {offerId, pickup, dropoff, earnings}
        └──▶ Schedule timeout job in BullMQ (45 seconds)

Step 3: Rider receives offer
────────────────────────────────────────────────────────────────
   Rider App (Flutter) via WebSocket
        │
        │  Event: dispatch.offer
        ▼
   Vibrate + notification sound
   Show modal: "New delivery — ₦850 — Accept or Reject (45s)"

Step 4: Rider taps accept
────────────────────────────────────────────────────────────────
   Rider App
        │
        ▼
   POST /offers/{offerId}/accept
   Headers: Authorization: Bearer <rider JWT>
        │
   (API service — OffersService)
        │
        ├──▶ Load offer, verify rider owns it
        ├──▶ Redis SET NX offer:{id}:claimed → {riderId}
        │      If already claimed: 409 OFFER_ALREADY_TAKEN
        │      If won: continue
        ├──▶ Open Postgres transaction:
        │      - UPDATE rider_dispatch_attempts SET response = 'ACCEPTED'
        │      - UPDATE deliveries SET rider_id = ..., status = 'ACCEPTED'
        │      - UPDATE orders SET status = 'RIDER_ASSIGNED'
        │      - INSERT order_status_history
        │      (Serializable isolation)
        ├──▶ Cancel other live offers for this delivery:
        │      - Redis DEL offer:{otherId}:claimed
        │      - UPDATE rider_dispatch_attempts SET response = 'LOST_RACE'
        │      - Push WebSocket: dispatch.offer_lost to other riders
        ├──▶ Redis: mark rider as busy (BUSY_KEY, TTL 1h)
        ├──▶ Remove BullMQ timeout job
        ├──▶ Emit WebSocket: delivery.rider_assigned
        │      (to customer, vendor, admin rooms)
        └──▶ Return 200

Step 5: Rider navigates to vendor
────────────────────────────────────────────────────────────────
   Rider App opens Google Maps with vendor coordinates
   Rider physically travels to vendor

Step 6: Rider picks up food
────────────────────────────────────────────────────────────────
   Rider App
        │
        ▼
   POST /deliveries/{id}/picked-up
        │
   (API service)
        │
        ├──▶ UPDATE deliveries SET status = 'PICKED_UP', picked_up_at = now()
        ├──▶ UPDATE orders SET status = 'PICKED_UP'
        ├──▶ Push WebSocket: order.status_changed (customer)
        └──▶ Return 200

Step 7: Rider delivers
────────────────────────────────────────────────────────────────
   Rider App
        │
        ▼
   POST /deliveries/{id}/delivered
   Body: { location: {...}, otp: "4821", proofImageUrl: "..." }
        │
   (API service — DeliveriesService)
        │
        ├──▶ Validate customer OTP (if provided)
        ├──▶ Open Postgres transaction:
        │      - UPDATE deliveries SET status = 'DELIVERED'
        │      - UPDATE orders SET status = 'COMPLETED'
        │      - UPDATE riders SET total_deliveries = total_deliveries + 1
        │      - INSERT order_status_history
        │      - LedgerService.postEntryGroup(...):
        │          DEBIT  RIDER_POOL      ₦850
        │          CREDIT RIDER (rider)   ₦680 (80%)
        │          CREDIT PLATFORM_REVENUE ₦170 (20% logistics margin)
        │      - UPDATE wallets
        ├──▶ Redis: mark rider as free (DEL BUSY_KEY)
        ├──▶ Emit WebSocket: delivery.completed
        ├──▶ Queue payout settlement job (BullMQ)
        └──▶ Return 200

Step 8: Rider sees earnings
────────────────────────────────────────────────────────────────
   Rider App GET /riders/me/wallet
   Shows updated balance: ₦680 added
```

### Flow 3 — Dispatch broadcast (deep dive)
This is the heart of the platform. The sequence that makes deliveries happen.

```text
T+0s: Vendor marks ready-for-pickup
     DispatchEngine.beginDispatch(deliveryId)
     └──▶ Redis SET dispatch:{deliveryId}:round = "1" NX
          If exists: no-op (idempotency)

T+0s: Round 1 broadcast
     ├──▶ Query Redis GEOSEARCH riders:online
     ├──▶ Filter: not busy, no active offer
     ├──▶ Query Postgres: rider stats (acceptance rate, rating)
     ├──▶ Score candidates (DispatchScorer)
     ├──▶ Top 3 candidates claimed
     ├──▶ INSERT rider_dispatch_attempts (3 rows)
     ├──▶ WebSocket push to 3 riders
     ├──▶ Schedule timeout job (BullMQ, 45s delay)
     └──▶ Log: dispatch.round_broadcast

T+0–45s: Waiting for accepts
     ├── Rider 1 taps Accept
     │    └──▶ OffersService.acceptOffer(...)
     │         └──▶ Redis SET NX offer:{id}:claimed → rider_1
     │              If wins: commit, cancel other offers
     │              If loses: 409
     │
     └── Rider 2 rejects → OffersService.rejectOffer(...)
          └──▶ UPDATE rider_dispatch_attempts SET response = 'REJECTED'
          └──▶ Check if all live offers rejected
               If yes: escalate immediately (don't wait for timeout)

T+45s: Timeout fires (if no accept)
     └──▶ BullMQ job: dispatch-timeout:{deliveryId}:1
          ├──▶ Verify delivery still LOOKING_FOR_RIDER
          ├──▶ Verify round still = 1
          ├──▶ Cancel all live offers:
          │      - Redis DEL offer:{id}:claimed
          │      - UPDATE rider_dispatch_attempts SET response = 'TIMED_OUT'
          │      - WebSocket: dispatch.offer_expired
          ├──▶ Escalate to Round 2 (radius 3000m, same cluster)
          └──▶ Schedule new timeout (45s)

T+90s: Round 3 escalation (radius 4000m, adjacent clusters)
T+150s: Round 4 escalation (radius 5000m, all clusters)
T+210s: Round 5 — Manual dispatch queue
     ├──▶ Alert ops team
     ├──▶ WebSocket to admin:dispatch
     └──▶ Order sits in manual queue until ops assigns

```
Total time to assign (target): < 90 seconds (P95)

### Flow 4 — Customer complaint and refund
A common operational journey. Shows how support, ledger, and external providers interact.

```text
Step 1: Customer complains via WhatsApp
────────────────────────────────────────────────────────────────
   "My food hasn't arrived and it's been 45 minutes"

Step 2: Message processing
────────────────────────────────────────────────────────────────
   Worker receives WhatsApp webhook
        │
        ├──▶ Gemini parses: intent = CHECK_STATUS, order_id = inferred from customer
        ├──▶ Fetch order from Postgres
        ├──▶ Order status = PREPARING (not yet dispatched)
        ├──▶ Generate response:
        │    "Your order ORD-2K3F9A is being prepared. We're
        │     finding a rider now — average wait is 6 minutes."
        └──▶ Send reply via Meta WhatsApp

Step 3: If customer insists on refund
────────────────────────────────────────────────────────────────
   Customer: "I want a refund. I'm not waiting anymore."
        │
        ▼
   Gemini classifies: intent = REFUND_REQUEST
        │
        ▼
   Business rules:
        - Status = PREPARING → allowed to refund
        - Status = PICKED_UP → requires vendor approval
        - Status = DELIVERED → requires ops review
        │
        ▼
   RefundsService.initiateRefund(orderId, reason, initiatedBy)
        │
        ├──▶ Open Postgres transaction:
        │      - UPDATE orders SET status = 'REFUNDED'
        │      - INSERT order_status_history
        │      - LedgerService.postEntryGroup(...):
        │          If pre-delivery (vendor not cooked yet):
        │            DEBIT  VENDOR_PAYABLE    ₦4,000
        │            DEBIT  RIDER_POOL        ₦850
        │            DEBIT  PLATFORM_REVENUE  ₦1,000
        │            CREDIT REFUND_POOL       ₦5,850
        │          If post-delivery (platform eats loss):
        │            DEBIT  PLATFORM_REVENUE  ₦1,000
        │            DEBIT  PLATFORM_LOSS     ₦4,850
        │            CREDIT REFUND_POOL       ₦5,850
        │      - UPDATE wallets
        ├──▶ Enqueue Monnify refund API call (BullMQ)
        ├──▶ Emit WebSocket: order.refunded
        └──▶ Send WhatsApp confirmation to customer

Step 4: Monnify processes refund
────────────────────────────────────────────────────────────────
   Monnify sends webhook: refund.success
        │
        ▼
   api.dispatch.ng/webhooks/monnify (refund callback)
        │
        ├──▶ LedgerService.postEntryGroup(settlement):
        │      DEBIT  REFUND_POOL       ₦5,850
        │      CREDIT CUSTOMER_ESCROW   ₦5,850
        └──▶ Update customer WhatsApp: "Refund processed"

Step 5: Reconciliation
────────────────────────────────────────────────────────────────
   Nightly job (worker):
        ├──▶ Query wallets balance vs. ledger entries sum
        ├──▶ Assert balance = sum(entries)
        ├──▶ If discrepancy: alert P1
        └──▶ Log to BigQuery
```

---

## 30.5 WhatsApp Integration Deep-Dive
WhatsApp is the primary customer interface. This section explains how it works technically.

Why WhatsApp is the primary channel
90%+ of target customers use WhatsApp daily

< 4% will install a food delivery app

Voice notes work for low-literacy users

Rich media (photos, locations) supported

Business API provides webhooks + automation

Architecture
```text
   ┌─────────────────────────────────────────────────────────────┐
   │                    CUSTOMER'S PHONE                         │
   │                                                             │
   │   WhatsApp app                                              │
   │   - Sends text messages                                     │
   │   - Sends voice notes                                       │
   │   - Sends location pins                                     │
   │   - Sends photos                                            │
   └────────────────────────┬────────────────────────────────────┘
                            │
                            │ WhatsApp protocol
                            ▼
   ┌─────────────────────────────────────────────────────────────┐
   │              META WHATSAPP CLOUD API                        │
   │                                                             │
   │   - Receives user messages                                  │
   │   - Sends webhook to our server (HMAC signed)               │
   │   - Receives our API calls to send messages                 │
   │   - Handles media upload/download                           │
   └────────────────────────┬────────────────────────────────────┘
                            │
                            │ HTTPS webhook
                            ▼
   ┌─────────────────────────────────────────────────────────────┐
   │           api.dispatch.ng/webhooks/whatsapp                 │
   │                                                             │
   │   1. Verify X-Hub-Signature-256 (HMAC-SHA256)               │
   │      - Secret: WHATSAPP_APP_SECRET                          │
   │      - Uses timingSafeEqual                                 │
   │                                                             │
   │   2. Insert webhook_events (idempotency)                    │
   │      ON CONFLICT (provider, event_id) DO NOTHING            │
   │                                                             │
   │   3. Return 200 immediately (Meta requires < 5s)            │
   │                                                             │
   │   4. Enqueue processing job to Redis (BullMQ)               │
   │      Queue: whatsapp-inbound                                │
   │      Payload: {message_id, from, type, content}             │
   └────────────────────────┬────────────────────────────────────┘
                            │
                            │ BullMQ job
                            ▼
   ┌─────────────────────────────────────────────────────────────┐
   │              WORKER (Cloud Run)                             │
   │                                                             │
   │   ConversationService.processMessage()                      │
   │                                                             │
   │   Step 1: Load conversation state                           │
   │     - Redis: conversation:{phone} → {state, context}        │
   │     - TTL: 30 minutes                                       │
   │                                                             │
   │   Step 2: If voice note, transcribe first                   │
   │     - Download audio from Meta Graph API                    │
   │     - Call Gemini 1.5 native audio                          │
   │     - Get transcription                                     │
   │                                                             │
   │   Step 3: Parse intent with Gemini 1.5 Pro                  │
   │     - Load prompt from prompts table (whatsapp_order_parse) │
   │     - Include conversation history                          │
   │     - Include customer context (known addresses, vendors)   │
   │     - Response schema: strict JSON                          │
   │                                                             │
   │   Step 4: Route by intent                                   │
   │     - PLACE_ORDER:                                           │
   │         - If confidence >= 0.85: create order                │
   │         - Else: ask clarification                            │
   │     - CHECK_STATUS:                                          │
   │         - Fetch latest order for customer                    │
   │         - Reply with status                                  │
   │     - CANCEL_ORDER:                                          │
   │         - Cancel if allowed, else explain                    │
   │     - MENU_INQUIRY:                                          │
   │         - Return menu link                                   │
   │     - HUMAN:                                                 │
   │         - Escalate to ops                                    │
   │     - UNCLEAR:                                               │
   │         - Ask generic clarification                          │
   │                                                             │
   │   Step 5: Send reply via Meta Cloud API                     │
   │     - POST /v1/messages                                     │
   │     - Authorization: Bearer WHATSAPP_ACCESS_TOKEN           │
   │     - Payload: {messaging_product: "whatsapp",              │
   │                 to: customer_phone,                          │
   │                 type: "text",                                │
   │                 text: {body: reply}}                         │
   │                                                             │
   │   Step 6: Update conversation state                          │
   │     - Redis: save state                                      │
   │     - Postgres: log message in conversation_messages         │
   │     - BigQuery: emit event for analytics                     │
   └────────────────────────┬────────────────────────────────────┘
                            │
                            │ HTTPS API call
                            ▼
   ┌─────────────────────────────────────────────────────────────┐
   │              META WHATSAPP CLOUD API                        │
   │                                                             │
   │   Delivers reply to customer                                │
   └────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                    CUSTOMER'S PHONE                         │
   │                                                             │
   │   Sees reply in WhatsApp                                    │
   └─────────────────────────────────────────────────────────────┘
```
Component responsibilities
| Component | Responsibility |
| :--- | :--- |
| Meta WhatsApp Cloud API | External. Delivers messages to/from customers. Signs webhooks. |
| API /webhooks/whatsapp | Receives webhooks. Verifies HMAC. Returns 200 within 5s. Enqueues. |
| Redis whatsapp-inbound queue | Buffers incoming messages for async processing. |
| Worker (ConversationService) | Processes messages. Calls Gemini. Creates orders. Sends replies. |
| Gemini 1.5 Pro | Parses intent, extracts structured order data. |
| Gemini 1.5 native audio | Transcribes voice notes. |
| Redis conversation:{phone} | Stores conversation state (TTL 30 min). |
| Postgres conversations + conversation_messages | Persistent log for support + analytics. |
| Meta WhatsApp Cloud API (outbound) | Sends replies to customers. |
Message processing flow (detailed)
```text
1. Inbound webhook arrives
   └──▶ POST /webhooks/whatsapp
        Body: {entry: [{changes: [{value: {messages: [...]}}]}]}
        Headers: X-Hub-Signature-256: sha256=...

2. Verify signature
   └──▶ HMAC-SHA256(WHATSAPP_APP_SECRET, rawBody) === signature
        If mismatch: 401, log to Sentry

3. Idempotency check
   └──▶ INSERT INTO webhook_events (provider='WHATSAPP', event_id=wamid.X)
        ON CONFLICT DO NOTHING
        If rowCount = 0: duplicate, return 200 immediately

4. Return 200 to Meta within 5 seconds
   └──▶ This is a hard requirement. Meta retries on timeout.

5. Enqueue processing job
   └──▶ BullMQ: whatsapp-inbound.add({
          messageId, from, timestamp, type, content, rawPayload
        })

6. Worker picks up job
   └──▶ ConversationService.processMessage(job)

7. Load conversation state
   └──▶ Redis GET conversation:{from}
        If missing: initialize with empty context

8. If type = audio
   └──▶ Download media: GET /v1/media/{mediaId} (Meta API)
        └──▶ Call Gemini native audio: transcribe
             └──▶ Replace content with transcription

9. Call Gemini 1.5 Pro
   └──▶ Prompt: system + history + new message + schema
        └──▶ Response: JSON with intent, order, confidence

10. Route by intent
    ├──▶ PLACE_ORDER + confidence >= 0.85:
    │     └──▶ OrdersService.createOrder(...)
    │          (See Flow 1 for full sequence)
    │     └──▶ Reply: order confirmation + payment instructions
    ├──▶ PLACE_ORDER + confidence < 0.85:
    │     └──▶ Gemini clarification prompt
    │     └──▶ Reply: clarification question
    │     └──▶ Save state: AWAITING_CLARIFICATION
    ├──▶ CHECK_STATUS:
    │     └──▶ Query latest order
    │     └──▶ Reply: order status
    ├──▶ CANCEL_ORDER:
    │     └──▶ OrdersService.cancelOrder(...)
    │     └──▶ Reply: confirmation
    ├──▶ MENU_INQUIRY:
    │     └──▶ Reply: link to vendor menu
    ├──▶ HUMAN:
    │     └──▶ Escalate to ops queue
    │     └──▶ Reply: "Connecting you to a human"
    └──▶ UNCLEAR:
          └──▶ Reply: generic clarification

11. Send reply via Meta Cloud API
    └──▶ POST /v1/messages
         └──▶ Meta delivers to customer's WhatsApp

12. Log to Postgres
    └──▶ INSERT INTO conversation_messages

13. Emit to BigQuery
    └──▶ INSERT INTO dispatch-prod_raw.events
```
Conversation state model
Stored in Redis with 30-minute TTL:

```json
{
  "phone": "+2348012345678",
  "state": "ACTIVE | AWAITING_CLARIFICATION | ESCALATED",
  "context": {
    "last_order_id": "ord_...",
    "pending_order": {
      "vendor_name": "Mama's Kitchen",
      "items": [{"name": "Amala", "qty": 2}],
      "missing_fields": ["delivery_address"]
    },
    "clarification_attempts": 1,
    "customer_id": "usr_..."
  },
  "last_updated": "2026-10-12T14:22:00Z"
}
```
Error handling
| Scenario | Response |
| :--- | :--- |
| HMAC signature invalid | 401, log to Sentry, no processing |
| Duplicate webhook | 200 immediately, no processing |
| Meta API rate limit | Retry with exponential backoff (3 attempts) |
| Gemini quota exceeded | Return friendly error, escalate to human |
| Gemini service down | Return friendly error, escalate to human |
| Order creation fails | Return friendly error, log to Sentry |
| Conversation state corrupted | Reset conversation, ask customer to restate |
Cost per WhatsApp order
| Component | Cost |
| :--- | :--- |
| Meta Cloud API (inbound + outbound) | ~₦8 |
| Gemini 1.5 Pro (parse) | ~₦15 |
| Gemini 1.5 native audio (if voice) | ~₦25 |
| Gemini clarification (if needed) | ~₦10 |
| Total per order | ~₦58 |
Compared to PWA order: ~₦5 (just API + DB).

WhatsApp costs ~10x more per order, but acquires 5x more customers. Net positive.


---

## 30.6 Data Ownership Matrix
Which service owns which data.

| Data entity | Primary service | Storage | Accessible via |
| :--- | :--- | :--- | :--- |
| Users | Auth Module | Postgres users | API endpoints |
| Sessions | Auth Module | Postgres sessions + Redis | API endpoints |
| OTP codes | Auth Module | Postgres otp_codes | Auth endpoints only |
| Device bindings | Auth Module | Postgres device_bindings | Auth endpoints |
| Vendors | Vendors Module | Postgres vendors | API endpoints |
| Products | Products Module | Postgres products | API endpoints |
| Orders | Orders Module | Postgres orders | API endpoints |
| Order items | Orders Module | Postgres order_items | API endpoints |
| Order status history | Orders Module | Postgres order_status_history | API endpoints |
| Riders | Riders Module | Postgres riders | API endpoints |
| Rider presence | Riders Module | Redis riders:online | Internal only |
| Deliveries | Deliveries Module | Postgres deliveries | API endpoints |
| Dispatch attempts | Dispatch Module | Postgres rider_dispatch_attempts | Internal only |
| Wallets | Ledger Module | Postgres wallets | API endpoints |
| Ledger entries | Ledger Module | Postgres ledger_entries | API endpoints (read-only) |
| Payouts | Payouts Module | Postgres payouts | API endpoints |
| Webhook events | Webhooks Module | Postgres webhook_events | Admin endpoints |
| Menu extractions | AI Module | Postgres menu_extractions | Vendor endpoints |
| Conversations | AI Module | Postgres conversations | Support endpoints |
| AI call logs | AI Module | Postgres ai_call_logs | Admin endpoints |
| Support tickets | Support Module | Postgres support_tickets | Support endpoints |
| Events (analytics) | All services | BigQuery events | Read-only, internal |
| Media (photos) | AI Module | Cloud Storage media | Signed URLs |
| Menu images | AI Module | Cloud Storage menu-images | Signed URLs |
Rules:

Each service owns its data. Cross-service reads go through APIs.

No direct DB access across services (in the current monolith, this is discipline; in a future microservices split, it's enforced).

Ledger entries are immutable. Never UPDATE, only INSERT.


---

## 30.7 External Integrations Map
Every third party, what they do, how we call them.

| Integration | Direction | Trigger | Auth | Failure mode |
| :--- | :--- | :--- | :--- | :--- |
| Monnify | Outbound | Order creation | API key | Retry 3x, fall back to Korapay |
| Monnify | Inbound | Payment webhook | HMAC-SHA512 | Return 401, log |
| Monnify | Outbound | Refund | API key | Retry 3x, alert ops |
| Monnify | Outbound | Payout | API key | Retry 3x, alert ops |
| Korapay | Outbound | Card payment | API key | Fallback if Monnify down |
| Korapay | Inbound | Payment webhook | HMAC-SHA256 | Return 401, log |
| Meta WhatsApp | Outbound | Reply to customer | Access token | Retry 3x, log |
| Meta WhatsApp | Inbound | Customer message | HMAC-SHA256 | Return 401, log |
| Termii | Outbound | OTP SMS | API key | Retry 2x, fall back to Africa's Talking |
| Google Maps | Outbound | Distance/ETA | API key | Use haversine fallback |
| Gemini (Vertex) | Outbound | Menu parse, WhatsApp parse | Service account | Heuristic fallback |
| Gemma (GKE) | Outbound | Dish classification | Internal | Fall back to Gemini |
| Vertex AI (XGBoost) | Outbound | Forecast, fraud, match | Service account | Heuristic fallback |
| Firebase FCM | Outbound | Push notification | Service account | Log, retry next event |
| Sentry | Outbound | Error reporting | DSN | Silent drop |
| MyCoverGenius | Outbound | Insurance enrollment | API key | Queue, retry |
| MyCoverGenius | Inbound | Insurance webhook | HMAC | Return 401, log |
Rules:

Every outbound call has a timeout (5s default, 30s for AI).

Every outbound call has retry logic with exponential backoff.

Every external failure logs to Sentry with context.

Every webhook verifies signature before processing.

Every webhook is idempotent (via webhook_events).

### Map & Geolocation Engine Architecture

Dispatch utilizes a hybrid geolocation and mapping strategy tailored to Nigerian bandwidth and cost economics:
1. **Backend Routing & Distance Matrix**:
   - Primary: Google Maps Platform (Distance Matrix & Directions REST API) with restricted API key.
   - Resiliency Fallback: PostGIS `ST_DistanceSphere` and spherical Haversine formula executed internally within NestJS if Google Maps quota or network drops occur.
2. **Customer PWA Live Order Tracker**:
   - Implemented via an ultra-lightweight SVG vector canvas (`LiveTrackingMap.tsx`) rendering arterial corridors and motorcycle markers moving dynamically along Ilorin waypoints (Tanke $\rightarrow$ Tipper Garage $\rightarrow$ Fate Road $\rightarrow$ GRA).
   - *Rationale*: Eliminates external Mapbox/Google Maps client tile downloads (averaging 5–15 MB of map tiles) on mobile browsers operating on slow 3G data.
3. **Rider Mobile App Navigation**:
   - Implemented via native Flutter `CustomPaint` vector canvas (`RouteMapPainter` in `navigation_screen.dart`) displaying turn-by-turn guidance and speed/ETA telemetry without external map tile SDK dependencies.
   - Optional deep-link intent (`geo:lat,lng` or Google Maps app intent) available if the rider prefers external voice-guided turn-by-turn navigation.

---

## 30.8 Network and Security Boundaries
TLS
Every endpoint: HTTPS only, TLS 1.3.

HSTS: max-age=31536000; includeSubDomains; preload.

Certificate: Google-managed, auto-renewed.

Internal service-to-service: Same TLS (Cloud Run to Cloud SQL via Cloud SQL Auth Proxy).


### Authentication
| Boundary | Method |
| :--- | :--- |
| Customer to API | JWT (ES256, 15-min access + 30-day refresh) |
| Vendor to API | JWT (same) |
| Rider to API | JWT (same) + device binding |
| Admin to API | JWT + TOTP MFA |
| API to Cloud SQL | Cloud SQL Auth Proxy + IAM |
| API to Redis | AUTH + TLS (Memorystore) |
| API to GCS | Service account (Workload Identity) |
| API to Vertex AI | Service account (Workload Identity) |
| API to external providers | API keys (from Secret Manager) |
| Webhooks to API | HMAC-SHA256/512 |
Authorization
Role-based access control (RBAC): Every endpoint declares required roles.

Ownership checks: Every resource access verifies ownership.

Admin actions: Audit-logged to admin_audit_log.


### Secrets
All secrets in Secret Manager.

No secrets in environment variables of the developer's machine.

No secrets in Git.

Rotation policy: 90 days for high-risk; 180 days for others.


### Data
PII never sent to AI models. Only hashed tokens.

PII redacted from logs.

Data at rest encrypted (Cloud SQL, GCS, BigQuery default).

Data in transit encrypted (TLS 1.3).


### Network
Cloud SQL: No public IP. Reached via private IP + VPC connector.

Memorystore: No public IP. Reached via private service access.

GKE: Private cluster. No public API endpoint.

Cloud Run: Public HTTPS for API, private for admin (IAP).

External egress: Via Cloud NAT.


---

## 30.9 Failure Domains
What breaks when each component fails, and how we recover.

| Component fails | Impact | Recovery |
| :--- | :--- | :--- |
| Cloud Run API instance | Temporary latency spike | Auto-restart by Cloud Run |
| All Cloud Run API instances | Full outage | Auto-scale retry; alert P1 |
| Cloud Run Worker | Background jobs delayed | Auto-restart; queue buffers work |
| Cloud SQL primary | Writes fail | Auto-failover to standby (~30s) |
| Cloud SQL read replica | Reads fall back to primary | Traffic redirects automatically |
| Memorystore Redis | Cache miss; sessions still work (DB fallback) | Auto-failover to HA replica |
| GKE Gemma | Dish classification falls back to Gemini | Auto-restart pod; alert |
| Vertex AI endpoint | Forecast/fraud falls back to heuristics | Alert; manual failover |
| Gemini API | Menu extraction falls back to manual entry | Alert; quota increase |
| Monnify | Payments fall back to Korapay | Alert; auto-switch |
| Korapay | Payments fall back to Monnify | Alert; auto-switch |
| Meta WhatsApp | Customer channel degraded | Alert; SMS fallback (Termii) |
| Termii | OTP fallback to Africa's Talking | Alert; auto-switch |
| Google Maps | Distance falls back to haversine | Alert; keep going |
| Cloud Storage | Media unavailable (cached on CDN) | Alert; retry |
| BigQuery | Analytics delayed; ML pipeline pauses | Alert; buffer in GCS |
| Secret Manager | Existing pods keep cached secrets | Alert; secret rotation delay |
| Cloud NAT | Outbound calls fail | Alert; P1 |
RTO and RPO targets: See Artifact 25 Section 11.


---

## 30.10 Environments
Three environments. Each isolated.


### Development (local)
Who: Individual engineers

Where: Developer laptops

Data: Local Postgres + Redis in Docker

AI: Mocked for most things; real Gemini for prompt testing

Payments: Mock Monnify/Korapay

Cost: Zero (developer's own time)


### Staging
Who: QA, engineering, occasional investor demos

Where: GCP project dispatch-stg

Data: Synthetic (200 vendors, 2,000 products, 100 riders)

AI: Real Gemini + Vertex (small quotas)

Payments: Real Monnify/Korapay test accounts

WhatsApp: Test number

Cost: ~$500/month


### Production
Who: Real customers, vendors, riders

Where: GCP project dispatch-prod

Data: Real

AI: Real Gemini + Vertex (production quotas)

Payments: Real Monnify/Korapay live accounts

WhatsApp: Official business number

Cost: $3,700–12,000/month (covered by Google credits)


### Environment parity
Staging mirrors production infrastructure (smaller tiers).

Same Terraform modules, different variables.

Same Docker images (different tags).

Same config structure, different secrets.


### Promotion flow
```text
Local dev → PR → CI (unit + integration tests) → Merge to main
   → Auto-deploy to staging → QA sign-off
   → Manual approval → Deploy to production (canary 10% → 100%)
```

---

## 30.11 What This Architecture Gets Right
It's a modular monolith, not microservices. At this stage, microservices would add operational overhead without benefit. The module boundaries (Ledger, Dispatch, AI) are clean, so splitting later is straightforward.

Every component has one clear purpose. No ambiguity about what does what.

Every request flow is traceable. From customer tap to database write, there's a documented path.

WhatsApp is treated as a first-class channel, not a bolt-on. It has its own worker processing, state model, and error handling.

Failure modes are enumerated. What breaks when GKE goes down? What's the fallback? Documented.

Data ownership is explicit. No confusion about which service writes to which table.

Network boundaries are real. VPC, private IPs, TLS everywhere.

Environments are isolated. Staging failure can't touch production.

What You Have Now
| # | Artifact | Status |
| :--- | :--- | :--- |
| 1 | Ledger posting sequences | ✅ |
| 2 | AI narrative | ✅ |
| 3 | AI module API contracts | ✅ |
| 4 | BigQuery + Vertex AI pipeline spec | ✅ |
| 5 | Prisma schema | ✅ |
| 6 | NestJS module structure | ✅ |
| 7 | LedgerService implementation | ✅ |
| 8 | Dispatch engine implementation | ✅ |
| 9 | AI prompts | ✅ |
| 10 | Infrastructure-as-Code | ✅ |
| 11 | CI/CD | ✅ |
| 12 | Auth flow | ✅ |
| 13 | Observability runbook | ✅ |
| 14 | Vendor onboarding playbook | ✅ |
| 15 | Rider recruitment and training playbook | ✅ |
| 16 | Go-to-market playbook | ✅ |
| 17 | Financial model | ✅ |
| 18 | Google for Startups application | ✅ |
| 19 | Investor deck | ✅ |
| 20 | 30-day execution sprint plan | ✅ |
| 21 | First-hire job descriptions | ✅ |
| 22 | Legal and regulatory checklist | ✅ |
| 23 | Founder operating agreement | ✅ |
| 24 | 90-day launch calendar | ✅ |
| 25 | Deployment guide | ✅ |
| 26 | Load test suite | ✅ |
| 27 | Security review checklist | ✅ |
| 28 | App store submission guide | ✅ |
| 29 | Operational handbook | ✅ |
| 30 | System architecture overview | ✅ |