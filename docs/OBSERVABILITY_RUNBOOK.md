# 📘 OBSERVABILITY RUNBOOK

> **Document Type:** Production Engineering Runbook & On-Call Playbook  
> **Target Audience:** Primary & Secondary On-Call Engineers, Tech Leads, Engineering Leadership, Operations Leads  
> **Platform:** Dispatch Rider Aggregator & Food Vendor Storefront  
> **Deployment Target:** Google Cloud Platform (Cloud Run, GKE Autopilot, Cloud SQL PostGIS, Memorystore Redis, Vertex AI, BigQuery)  
> **Timezone Reference:** West Africa Time (WAT / UTC+1)  
> **Emergency Status Page:** https://status.dispatch.ng  
> **War Room / ChatOps:** Slack `#alerts`, `#incidents`, `#war-room-2026-XXXX`

---

## 1. Executive Overview & Design Philosophy

This document is the single operational source of truth opened when PagerDuty triggers an escalation at 3:00 AM WAT. It answers four unambiguous questions in real time:
1. **What does this alert actually mean?**
2. **How do I triage and isolate the blast radius immediately?**
3. **What is the exact remediation / mitigation command sequence?**
4. **Who must be paged, notified, or escalated to?**

### The Golden Rule of Alerting
> **Every alert must be actionable.**  
> If an alert fires and an engineer does not have a definitive, urgent remediation action or investigation playbook, it is **noise**—not an alert. Noise degrades team vigilance, causes alert fatigue, and obscures catastrophic failures. Any alert that cannot be triaged and resolved must either be adjusted to a higher threshold, downgraded to a P3/P4 dashboard metric, or deleted.

---

## 2. Observability Architecture & Stack

The platform deploys a unified, multi-tiered observability stack native to Google Cloud Platform to eliminate vendor bloat while delivering distributed tracing, metric aggregation, and centralized queryable log streams.

```
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   APPLICATIONS                                         │
 │  Customer PWA   │   Vendor Portal   │   Rider Flutter App   │   NestJS Backend API     │
 └─────────┬───────┴─────────┬─────────┴───────────┬───────────┴─────────────┬────────────┘
           │                 │                     │                         │
           ▼                 ▼                     ▼                         ▼
    Sentry SDK        Sentry SDK            Sentry SDK               OpenTelemetry SDK
 (Client Errors)   (Portal Errors)        (Crashlytics)           (Traces & Custom Metrics)
           │                 │                     │                         │
           └─────────────────┼─────────────────────┴────────────┐            │
                             ▼                                  │            ▼
 ┌──────────────────────────────────────────────────┐           │   Google Cloud Trace
 │                  Sentry Cloud                    │           │   (Distributed Tracing)
 │    (Source Maps, Exception Grouping, Session)    │           │
 └──────────────────────────────────────────────────┘           ▼
                                                    Google Cloud Logging
                                             (Structured JSON with Trace ID)
                                                                │
                                    ┌───────────────────────────┴────────────────────────────┐
                                    ▼                                                        ▼
                        Log-Based Metric Filters                           BigQuery Sink Export
                     (Ledger Invariant, Webhooks)                      (`dispatch_prod_raw.logs`)
                                    │                                                        │
                                    ▼                                                        ▼
 ┌──────────────────────────────────────────────────────────────┐              Metabase / BI
 │                  Google Cloud Monitoring                     │           Executive Dashboards
 │      (Alert Policies, Uptime Checks, SLI/SLO Engines)        │
 └──────────────────────────────┬───────────────────────────────┘
                                │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
      PagerDuty Engine                       Slack Webhooks
(P1/P2 On-Call Escalation)              (#alerts, #incidents)
```

### Layer Breakdown & Tool Rationale

| Layer | Tool / Service | Technical Rationale & Operational Role |
| :--- | :--- | :--- |
| **Metrics** | Google Cloud Monitoring + Managed Prometheus | Native to GCP Cloud Run and GKE Autopilot. Zero licensing overhead, sub-minute ingestion latency, auto-scales with container instances. |
| **Logs** | Cloud Logging $\rightarrow$ BigQuery Sink | Application stdout emits structured JSON containing `trace`, `spanId`, `userId`, `clusterZone`. Partitioned daily exports in BigQuery (`dispatch_prod_raw.events`) enable high-speed SQL forensics. |
| **Distributed Tracing** | Google Cloud Trace | Automatically correlates HTTP requests traversing Cloud Run microservices, GKE Gemma containers, and external Vertex AI inference endpoints. |
| **Error Aggregation** | Sentry (Node.js, Next.js, Flutter) | Automatic exception deduplication, source map deobfuscation, stack-trace unwinding, and user-impact tagging. |
| **Business APM** | BigQuery + Metabase | Operational analytics monitoring real-time orders/min, rider dispatch SLA heatmaps, payment conversions, and ledger integrity. |
| **Synthetic Uptime** | Cloud Monitoring Uptime Checks | Multi-region 60-second synthetic HTTP probes hitting `/health` across `api.dispatch.ng`, `vendor.dispatch.ng`, and `app.dispatch.ng`. |
| **On-Call Management** | PagerDuty | 24/7 automated schedules, escalation trees, SMS/voice overrides, and mobile push notifications. |
| **ChatOps** | Slack (`#alerts`, `#incidents`, `#war-room`) | Real-time incident collaboration, automated deployment announcements, and triage coordination. |
| **Public Status Page** | Statuspage.io / Better Stack | Public customer and vendor transparency during outages, reducing inbound customer support storms. |

---

## 3. The Four Golden Signals & Service SLIs

All monitored microservices report against Google’s Four Golden Signals: **Latency**, **Traffic**, **Errors**, and **Saturation**.

| Golden Signal | Metric Definition | Baseline (Nominal) | Alert Threshold |
| :--- | :--- | :--- | :--- |
| **Latency** | Request execution duration (P50, P95, P99) | P95 $< 180\text{ms}$ | P95 $> 500\text{ms}$ (Core API), P95 $> 2\text{s}$ (AI endpoints) |
| **Traffic** | Requests per second / active concurrent users | Normal daily curve | Baseline $\pm 3\sigma$ standard deviations |
| **Errors** | HTTP 5xx rate, gRPC errors, unhandled rejections | $< 0.05\%$ | $> 1.0\%$ total requests for 5 minutes continuous |
| **Saturation** | Resource utilization (CPU, RAM, Connections, Redis) | $< 50\%$ utilization | $> 80\%$ utilization for $> 10\text{ minutes}$ |

### Per-Service Service Level Indicators (SLIs)

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ Service               │ Primary SLI Metric                       │ Target Objective   │
├───────────────────────┼──────────────────────────────────────────┼────────────────────┤
│ NestJS Backend API    │ Availability (2xx / Total HTTP Requests) │ ≥ 99.9%            │
│ NestJS Backend API    │ P95 Request Duration                     │ < 400ms            │
│ Dispatch Engine       │ Time-to-Assign P95                       │ < 90 seconds       │
│ Financial Ledger      │ Zero-Sum Mathematical Invariant          │ 100% (Absolute 0)  │
│ Payment Webhooks      │ Ingestion to Processing P95 Duration     │ < 3.0 seconds      │
│ WhatsApp Commerce Bot │ Intent & Slot Extraction P95             │ < 3.5 seconds      │
│ Gemini Menu Vision    │ Extraction & Taxonomy Normalization P95  │ < 8.0 seconds      │
│ Rider Location Sync   │ Heartbeat Ingestion & Geo-index Rate     │ > 99.0%            │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Service Level Objectives (SLOs) & Error Budgets

SLOs represent our formal operational commitments. Error budgets dictate development velocity: if an error budget is exhausted, feature releases halt until reliability is restored.

### SLO 1: API Availability
* **Objective:** $99.9\%$ of valid incoming HTTP requests return non-5xx responses over a rolling 30-day window.
* **Error Budget:** 43.2 minutes of total downtime or equivalent failed requests per calendar month.
* **Multi-Window Burn-Rate Alerts:**
  * **Critical Fast Burn (P1 Page):** $2\%$ of error budget consumed within 1 hour ($\text{Burn Rate} = 14.4$).
  * **Severe Slow Burn (P1 Page):** $5\%$ of error budget consumed within 6 hours ($\text{Burn Rate} = 6.0$).
  * **Warning Drift (P3 Ticket):** $10\%$ of error budget consumed within 3 days.

### SLO 2: Order Placement Success
* **Objective:** $99.5\%$ of `POST /orders` requests complete successfully (`201 Created`) within $5\text{ seconds}$.
* **Rationale:** Accounts for intermittent Nigerian payment gateway (Monnify/Korapay) network drops where client-side idempotency retries are applied.

### SLO 3: Dispatch Time-to-Assign
* **Objective:** $90.0\%$ of active orders transition from `LOOKING_FOR_RIDER` to `ASSIGNED` within $90\text{ seconds}$.
* **Rationale:** In tier-2 logistics (Ilorin), freshly prepared hot food (e.g., Swallow, Amala, Fried Rice) cools rapidly. Rider acceptance drop-off surges significantly if dispatch rounds exceed 3 minutes.

### SLO 4: Payment Webhook Processing Latency
* **Objective:** $99.0\%$ of validated PSP webhooks are processed (ledger entries committed, order marked `CONFIRMED`) within $3.0\text{ seconds}$ of arrival.
* **Rationale:** Vendors will not start preparing orders until payment confirmation is displayed on their portal.

### SLO 5: Double-Entry Ledger Integrity
* **Objective:** $100.0\%$ zero-sum invariant across all entry groups. Zero un-reconciled wallet balance drifts.
* **Error Budget:** **0.00% (Zero Tolerance).** Any variance triggers an immediate P1 emergency page.

### SLO 6: Conversational WhatsApp Order Conversion
* **Objective:** $\ge 55.0\%$ of user conversations initiating with `PLACE_ORDER` intent conclude with a successfully generated order ID.
* **Rationale:** A business SLI. If conversational drop-off spikes while API latencies remain green, the Gemini prompt formatting or product catalog embeddings have degraded.

### SLO 7: Rider Mobile App Synchronization
* **Objective:** $\ge 99.0\%$ of rider telemetry heartbeats (`POST /riders/me/location`) are accepted and stored within $1.0\text{ second}$.
* **Rationale:** Budget Android phones on 2G/3G networks must maintain real-time positioning to receive dispatch offers before geo-expiry.

---

## 5. Comprehensive Alert Catalog

### 🔴 P1 — Page Immediately (24/7/365 On-Call Awakening)

---

#### 1. `LEDGER_INTEGRITY_FAILURE`
* **Trigger:** Nightly automated reconciliation job identifies $\ge 1$ wallet balance mismatch, an unbalanced entry group (`SUM(credits) != SUM(debits)`), or global platform ledger drift $\ne 0$.
* **Business Impact:** Critical financial discrepancy. Platform is bleeding capital, misattributing balances, or violating Nigerian financial compliance.
* **Initial Triage:**
  1. Inspect the BigQuery reconciliation run:
     ```sql
     SELECT * FROM `dispatch_prod_models.reconciliation_runs`
     ORDER BY checked_at DESC LIMIT 1;
     ```
  2. Query drifted wallets directly in Cloud SQL read replica:
     ```sql
     SELECT w.id, w.user_id, w.balance,
            COALESCE(SUM(CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END), 0) AS computed_balance
     FROM wallets w
     LEFT JOIN ledger_entries le ON le.wallet_id = w.id
     GROUP BY w.id, w.user_id, w.balance
     HAVING w.balance <> COALESCE(SUM(CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END), 0);
     ```
  3. Verify git commits within the last 24 hours affecting `apps/api/src/modules/ledger`:
     ```bash
     git log --since="24 hours ago" -p apps/api/src/modules/ledger
     ```
* **Remediation & Fix:**
  * **Freeze Wallet Immediately:** If discrepancy is localized to specific accounts, prevent further movement:
    ```sql
    UPDATE wallets SET is_locked = true WHERE id IN ('<drifted_wallet_id>');
    ```
  * **Compensating Posting:** Never run manual `UPDATE` on `ledger_entries` or `wallets.balance`. Author and post a cryptographically audited compensating `EntryGroup`:
    ```sql
    -- Use the internal admin ledger compensation endpoint or stored procedure
    SELECT post_compensating_entry_group('<drifted_wallet_id>', <difference_amount>, '<reason_audit_hash>');
    ```
* **Escalation Path:** Primary On-Call $\rightarrow$ Backend Engineering Lead $\rightarrow$ CTO (Mandatory 15-minute SLA).

---

#### 2. `PAYMENT_WEBHOOK_PROCESSING_STALLED`
* **Trigger:** Table `webhook_events` has $> 50$ rows with `processed_at IS NULL` and `created_at < NOW() - INTERVAL '5 minutes'`.
* **Business Impact:** Customers have been debited by their bank via Monnify/Korapay, but orders remain stuck in `PENDING_PAYMENT`. Vendors do not receive tickets; riders are not dispatched.
* **Initial Triage:**
  1. Inspect the latest unprocessed webhook failure logs:
     ```sql
     SELECT id, provider, event_type, process_error, created_at 
     FROM webhook_events 
     WHERE processed_at IS NULL 
     ORDER BY created_at DESC LIMIT 20;
     ```
  2. Check signature validation failures:
     ```sql
     SELECT count(*) FROM webhook_events 
     WHERE signature_valid = false AND created_at > NOW() - INTERVAL '15 minutes';
     ```
  3. Verify PSP external status (Monnify Status: https://status.monnify.com, Korapay Status).
* **Remediation & Fix:**
  * **If Signature Verification Fails in Bulk:** Secret was rotated upstream. Retrieve new secret from PSP dashboard, update Google Secret Manager, and trigger Cloud Run redeploy:
    ```bash
    gcloud secrets versions add monnify-webhook-secret --data-file=/path/to/new_secret.txt
    ```
  * **Drain & Reprocess Backlog:** Once the root issue or bad deployment is patched:
    ```bash
    curl -X POST https://api.dispatch.ng/admin/webhooks/reprocess \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"since_minutes": 60, "limit": 500}'
    ```
* **Escalation Path:** Primary On-Call $\rightarrow$ Payments Lead $\rightarrow$ Operations Lead (to communicate with vendors).

---

#### 3. `DISPATCH_SLA_CRITICAL_BREACH`
* **Trigger:** P95 time-to-assign $> 180\text{ seconds}$ over a 15-minute window **AND** $> 5$ orders unassigned for $> 5\text{ minutes}$.
* **Business Impact:** High delivery churn, food spoiling, vendor kitchen congestion in key clusters (e.g., Tanke, Fate, Sanrab).
* **Initial Triage:**
  1. Inspect active orders and dispatch rounds:
     ```sql
     SELECT id, status, cluster_zone, dispatch_round, created_at, NOW() - created_at AS waiting_time
     FROM orders
     WHERE status = 'LOOKING_FOR_RIDER'
     ORDER BY created_at ASC;
     ```
  2. Compare online riders in Redis vs PostgreSQL:
     ```bash
     # Inspect Redis online riders count in target cluster
     redis-cli SCARD riders:online:tanke
     ```
  3. Check no-candidate rate in dispatch engine logs:
     ```bash
     gcloud logging read 'resource.type="cloud_run_revision" jsonPayload.message="NO_CANDIDATES_FOUND"' --limit=20
     ```
* **Remediation & Fix:**
  * **Supply Deficit (Insufficient Online Riders):** Trigger automated push surge notification with financial incentive to idle/offline riders:
    ```bash
    curl -X POST https://api.dispatch.ng/admin/dispatch/incentive \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -d '{"cluster": "TANKE", "bonus_naira": 350, "window_minutes": 45, "message": "High demand in Tanke! Earn extra ₦350 per trip!"}'
    ```
  * **Software / Lock Stalling:** If Redis geospatial queries are failing or returning timeouts, restart the Redis connection pool and scale up the API dispatch worker instances.
  * **Manual Fallback:** Authorize operations room dispatchers to execute manual overrides via the Ops Portal (`POST /admin/dispatch/manual-assign`).
* **Escalation Path:** Primary On-Call $\rightarrow$ Operations Lead $\rightarrow$ Dispatch Lead.

---

#### 4. `CLOUD_SQL_CONNECTION_EXHAUSTION`
* **Trigger:** PostgreSQL `active_connections > 180` (of 200 pool maximum) for $\ge 2\text{ minutes}$.
* **Business Impact:** Cascading HTTP 500 crashes across all microservices due to pool timeouts.
* **Initial Triage:**
  1. Inspect active PostgreSQL queries:
     ```sql
     SELECT pid, usename, application_name, client_addr, state, now() - query_start AS duration, query
     FROM pg_stat_activity
     WHERE state != 'idle'
     ORDER BY duration DESC;
     ```
  2. Identify connection leak source by application name:
     ```sql
     SELECT application_name, count(*) 
     FROM pg_stat_activity 
     GROUP BY application_name;
     ```
* **Remediation & Fix:**
  * **Terminate Blocking Queries:**
    ```sql
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE state != 'idle' AND now() - query_start > interval '30 seconds';
    ```
  * **Emergency Pool Expansion:** Temporarily scale up Cloud SQL instance compute tier via Terraform or gcloud to handle immediate backlog.
  * **Restart Leaking Revision:** Roll back or cycle Cloud Run revision instances if an unclosed transaction loop was recently introduced.
* **Escalation Path:** Primary On-Call $\rightarrow$ Infrastructure Lead $\rightarrow$ Database Administrator.

---

#### 5. `RIDER_APP_SYNC_FAILURE`
* **Trigger:** Rider heartbeat acceptance rate $< 90\%$ over 10 minutes **OR** offer acceptance endpoint (`POST /riders/offers/:id/accept`) error rate $> 5\%$.
* **Business Impact:** Mobile riders cannot confirm order pickups or broadcast location; dispatch engine treats entire fleet as offline.
* **Initial Triage:**
  1. Check endpoint HTTP status codes in Cloud Logging:
     ```bash
     gcloud logging read 'resource.type="cloud_run_revision" httpRequest.requestUrl=~"/riders/me/location"' \
       --limit=100 --format=json | jq '[.[] | .httpRequest.status] | group_by(.) | map({status: .[0], count: length})'
     ```
  2. Verify if a bad mobile APK was distributed via Google Play Console or Firebase App Distribution in the last 4 hours.
  3. Validate Firebase Cloud Messaging (FCM) push token delivery rates.
* **Remediation & Fix:**
  * **If Server Latency/5xx:** Roll back the backend API container image immediately.
  * **If Bad Mobile Release:** Enable server-side force-update or deprecate offending app build version via remote feature toggle.
  * **If Redis Geo Outage:** Flush corrupted geo-index key or verify Redis memory headroom.
* **Escalation Path:** Primary On-Call $\rightarrow$ Mobile Tech Lead $\rightarrow$ Backend Lead.

---

### 🟠 P2 — Page During Business Hours (08:00–22:00 WAT)

| Alert Name | Trigger Threshold | Primary Diagnostic Action | Remediation / Playbook |
| :--- | :--- | :--- | :--- |
| `API_ERROR_RATE_ELEVATED` | 5xx error rate $> 1.0\%$ for 5 min | Check Sentry exception stream filtered by service | Roll back recent Cloud Run deployment; patch unhandled exception |
| `API_LATENCY_DEGRADED` | P95 latency $> 800\text{ms}$ for 5 min | Inspect Cloud Trace and `pg_stat_statements` | Add Redis caching layer; optimize slow SQL join query |
| `DISPATCH_ACCEPTANCE_RATE_LOW` | Offer acceptance $< 30\%$ over 30 min | Verify cluster distance and rider payout margins | Increase cluster surge pricing; retune candidate scoring weights |
| `WHATSAPP_PARSE_QUALITY_DROP` | Intent parse F1 $< 0.88$ on 6h sample | Sample recent conversations flagged `UNCLEAR` | Pin Gemini 1.5 Flash model version; revert recent prompt edit |
| `BIGQUERY_QUERY_COST_SPIKE` | Daily spend $> \$150$ (baseline $\$6/\text{day}$) | Query `INFORMATION_SCHEMA.JOBS_BY_PROJECT` | Kill unpartitioned full-scan queries; enforce query partition filters |
| `PAYMENT_PROVIDER_WEBHOOK_MISSING` | Completed payouts with no webhooks $> 15\text{m}$ | Check PSP dashboard status; test webhook delivery | Fall back to automated polling worker (`GET /transactions/:ref`) |

---

### 🟡 P3 — Non-Urgent Tickets (Next Business Day Investigation)

| Alert Name | Trigger Condition | Operational Impact | Recommended Action |
| :--- | :--- | :--- | :--- |
| `SESSION_REVOCATION_SPIKE` | $> 20$ device mismatch revocations / hr | Potential credential credential stuffing or SIM-swap wave | Audit device fingerprints; tighten OTP IP-rate limits |
| `WHATSAPP_MESSAGE_QUEUE_BACKLOG` | `notifications_outbox` pending $> 500$ | Delayed customer notifications | Scale Cloud Tasks consumer workers; monitor Meta API limits |
| `CLOUD_SQL_CPU_HIGH` | CPU utilization $> 80\%$ for 15 min | System load spike or unindexed query | Schedule query index optimization; review cron job schedules |
| `RIDER_HEARTBEAT_STALE` | `riders:online` drops $> 30\%$ in 10 min | Telemetry connection drop | Check cellular network outages in Kwara State |
| `GCP_BUDGET_THRESHOLD_80_PERCENT` | Monthly spend exceeds 80% of budget | Cloud credit burn acceleration | Analyze cost dashboard; trim idle preview environments |
| `CERT_EXPIRY_SOON` | Managed TLS certificate expires in $< 14$ days | SSL termination failure | Verify Cloud DNS CAA records; trigger cert renewal |
| `DISK_SPACE_LOW` | Cloud SQL storage capacity $> 85\%$ | Database read-only transition risk | Verify storage auto-resize trigger; purge old temporary logs |

---

### ⚪ P4 — Log-Only & Dashboard Metrics (No Notification)

* Isolated client 4xx HTTP errors (`401 Unauthorized`, `404 Not Found`).
* Individual transient database connection retries.
* Self-recovering Gemini API transient 503 rate-limit retries.
* Single rider offer rejections (normal dispatch dynamics).

---

## 6. Dashboard Catalog & Ownership

Every dashboard has a dedicated owner, an SLA purpose, and a clear audience. Dashboards without owners are decommissioned.

```
┌─────────────────────────┬────────────────────────────┬─────────────────────────────────────────────────────────┐
│ Dashboard Name          │ Primary Owner              │ Core Monitored Metrics                                  │
├─────────────────────────┼────────────────────────────┼─────────────────────────────────────────────────────────┤
│ service-health          │ Backend On-Call Engineer   │ Four Golden Signals, P50/P95/P99 latency, Cloud Run CPU │
│ orders-realtime         │ Operations Lead            │ Orders/min, status breakdown, cart conversion rate      │
│ dispatch-realtime       │ Operations Lead            │ Time-to-assign P95, rounds distribution, manual queue   │
│ ledger-integrity        │ Backend Lead               │ Zero-sum invariant, wallet drift counter, stuck payouts │
│ payments-flow           │ Payments Engineer          │ Webhook latency, signature failures, payout batches     │
│ ai-performance          │ AI Lead                    │ Vertex AI/Gemini latency, token usage, cost/hour        │
│ ai-quality              │ AI Lead                    │ Intent classification F1, auto-resolution rate          │
│ unit-economics          │ CFO / Ops Director         │ GMV, platform take rate, delivery margin, cost-to-serve │
│ rider-health            │ Operations Lead            │ Active fleet count, offer accept rate, on-time SLA      │
│ vendor-health           │ Operations Lead            │ Kitchen prep latency, rejection rate, churn rate        │
│ customer-health         │ Growth Lead                │ Repeat order frequency, WhatsApp vs PWA split           │
│ infrastructure-cost     │ Infrastructure Lead        │ Daily GCP spend per service, BigQuery byte quotas       │
└─────────────────────────┴────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 7. On-Call Rotation & Operational Protocols

### Rotation Structure & Coverage

```
Role                    Rotation Period    Coverage Window          Primary Responsibility
Primary Backend         1 Week             24/7/365                 First responder for P1/P2 alerts
Secondary Backend       1 Week (Offset)    24/7/365                 Backup if Primary fails to ack in 5m
Mobile Lead             2 Weeks            08:00 – 22:00 WAT        Rider Flutter & PWA client issues
Operations Lead         1 Week             24/7/365                 Field operations & manual dispatch triage
Payments Engineer       2 Weeks            On-Call Consultation     Monnify, Korapay & Ledger reconciliations
```

### Essential On-Call Rules
1. **5-Minute P1 SLA:** The Primary On-Call must acknowledge any P1 alert within 5 minutes. If unacknowledged, PagerDuty automatically escalates to the Secondary Backend, followed by the Tech Lead.
2. **15-Minute P2 SLA:** Acknowledge and begin triage for P2 alerts within 15 minutes during business hours.
3. **No Deploys While On-Call:** The on-call engineer is dedicated strictly to reliability. If a patch deployment is required, the Secondary or another designated engineer performs the rollout.
4. **Guaranteed Compensation:** Every on-call shift is compensated with a fixed weekly stipend plus overtime pay for off-hours pages.

### Standard Weekly Handoff Protocol
Handoff occurs every **Monday at 10:00 WAT**. The outgoing on-call engineer posts the completed markdown template in `#oncall-handoff`:

```markdown
## On-Call Handoff — Week of [YYYY-MM-DD]
**Outgoing Primary:** @engineer_a  
**Incoming Primary:** @engineer_b  

### 1. Incidents & Escalations
- [INC-1042] Cloud SQL connection spike (Resolved 2026-10-12, Postmortem merged)
- None currently active.

### 2. Degraded Services / Known Watch Items
- Tanke cluster rider acceptance rate dipped to 44% during Friday rainstorm.
- BigQuery partition cost warning observed on `orders_snapshot`.

### 3. Planned Infrastructure Changes
- Cloud Run API memory allocation increase scheduled for Wednesday 04:00 WAT.
- Redis TLS cert rotation scheduled for Thursday.

### 4. Technical Debt / Action Items Follow-Up
- PR #214 merged to add timeout on Korapay webhook handling.
```

---

## 8. Incident Response Framework

### Severity Classification Matrix

| Severity Level | Definition | Impact Scope | Response SLA | Public Comms |
| :--- | :--- | :--- | :--- | :--- |
| **SEV1** | Catastrophic outage; revenue blocked; core flows down | Wide platform failure ($> 25\%$ users) | $< 5\text{ min}$ response; all-hands war room | Public Status Page update within 15m; vendor push banner |
| **SEV2** | Major degradation; core flow impaired but functioning | Partial impact ($5\% - 25\%$ users) | $< 15\text{ min}$ response; lead engaged | Status Page update; targeted in-app banner |
| **SEV3** | Minor degradation; non-critical features down | Low impact ($< 5\%$ users) | $< 1\text{ hour}$ response | Internal Slack notification only |
| **SEV4** | Internal tooling degraded; no customer impact | Zero customer impact | Next business day | None |

### Incident Command Roles (SEV1 & SEV2)
* **Incident Commander (IC):** Drives the resolution process, delegates tasks, maintains focus, and prevents distractions. Does **not** write code or debug directly.
* **Tech Lead (Operations / Engineering):** Diagnoses technical root cause, formulates mitigation, and tests fixes.
* **Communications Lead:** Updates the status page, drafts customer/vendor alerts, and briefs executive management.
* **Scribe:** Documents the incident timeline with exact timestamps in `#war-room-2026-XXXX`.

### Standard Communication Templates

#### Initial Public Status Page Notification (Within 15 Min of SEV1)
```
[Investigating] We are currently experiencing an issue affecting order processing and payment confirmations.
Our engineering team has been mobilized and is actively investigating the incident.
Affected Areas: Order Checkout, Payment Verification
Next Update: Within 15 minutes (HH:MM WAT)
```

#### Incident Update (Every 15–30 Min)
```
[Update HH:MM WAT] We have identified the cause of the delay affecting payment confirmations.
A mitigation is currently being deployed to our payment ingestion infrastructure.
Existing orders are preserved and will process automatically once services are fully restored.
Next Update: Within 20 minutes (HH:MM WAT)
```

#### Incident Resolution Announcement
```
[Resolved HH:MM WAT] All payment processing and dispatch services have returned to nominal operation.
Total Incident Duration: 38 minutes.
All backlogged payments have been reconciled successfully with zero financial loss.
A full blameless postmortem will be completed and published within 5 business days.
```

---

## 9. Blameless Postmortem Template

Every SEV1 and significant SEV2 incident mandates a blameless postmortem within 72 hours. Focus on **systemic vulnerabilities**, not human fallibility.

```markdown
# Incident Postmortem: [INC-YYYYMMDD-XX] - [Incident Title]

## 1. Executive Summary
Brief non-technical description of what occurred, total duration of customer impact, and final resolution.

## 2. Key Metrics & Impact
- **Total Duration:** XX minutes
- **Impact Window:** HH:MM WAT to HH:MM WAT
- **Estimated Orders Affected:** XX orders
- **Financial Variance:** ₦0.00 (Zero ledger discrepancy)
- **Customer Support Tickets:** XX tickets

## 3. Incident Timeline (All Times WAT)
- `14:12` - Anomaly begins; Monnify webhook gateway initiates retry storm.
- `14:16` - Alert `PAYMENT_WEBHOOK_PROCESSING_STALLED` triggers on PagerDuty.
- `14:19` - Primary On-Call acknowledges page and creates `#war-room-20261011`.
- `14:23` - IC declares SEV1; Comms Lead posts to status.dispatch.ng.
- `14:32` - Tech Lead identifies unhandled null byte in raw body parsing.
- `14:41` - Patch deployed to Cloud Run via emergency CI pipeline.
- `14:48` - Backlog drain initiated via admin reprocessing endpoint.
- `14:55` - Webhook queue returns to nominal; IC declares resolution.

## 4. Root Cause Analysis (5 Whys)
1. Why did orders stall? Because webhook events were failing with 500 errors.
2. Why were webhook events failing? Because the HMAC verifier threw an unhandled null exception.
3. Why was there a null exception? Because an unexpected retry payload lacked `paymentReference`.
4. Why wasn't this caught in CI? Because test fixtures only mocked standard transaction payloads.
5. Why were test fixtures incomplete? No schema validation contract was enforced on webhook ingestion.

## 5. What Went Well
- Alert fired within 4 minutes of the condition occurring.
- Status page update published within the 15-minute SLA.
- Double-entry ledger prevented duplicate order credits during reprocessing.

## 6. What Went Poorly
- Cloud Run health check remained green despite 100% webhook failure rate.
- Initial triage was delayed 5 minutes locating provider API documentation.

## 7. Action Items (Owner & Due Date Mandatory)
- [ ] Implement Zod schema validation on Monnify/Korapay raw payloads (@backend-lead, 2026-10-18)
- [ ] Connect Cloud Run synthetic health probe to test database write path (@infra-lead, 2026-10-20)
- [ ] Add circuit-breaker on webhook signature verification (@payments-lead, 2026-10-25)
```

---

## 10. The Three 3:00 AM Pages: Deep-Dive Playbooks

---

### Deep Dive 1: `LEDGER_INTEGRITY_FAILURE`

#### Situation
At **02:14 WAT**, the nightly Cloud Scheduler reconciliation job completes. PagerDuty fires:
`[CRITICAL] LEDGER_INTEGRITY_FAILURE: 2 wallets drifted, global net discrepancy != 0`.

#### Step 1: Extract the Automated Reconciliation Report (2 Minutes)
Run the analytical verification query in BigQuery:
```sql
SELECT 
  run_id, checked_at, total_wallets_checked, drifted_wallets_count, 
  unbalanced_groups_count, global_net_discrepancy, details_json
FROM `dispatch_prod_models.reconciliation_runs`
ORDER BY checked_at DESC 
LIMIT 1;
```

#### Step 2: Validate Against Production Cloud SQL Read Replica (3 Minutes)
Ensure the alert is not an artifact of replica replication lag:
```sql
SELECT 
  w.id AS wallet_id,
  w.user_id,
  w.balance AS stored_balance,
  COALESCE(SUM(CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END), 0) AS computed_balance,
  w.balance - COALESCE(SUM(CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END), 0) AS discrepancy
FROM wallets w
LEFT JOIN ledger_entries le ON le.wallet_id = w.id
GROUP BY w.id, w.user_id, w.balance
HAVING w.balance <> COALESCE(SUM(CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END), 0);
```

#### Step 3: Audit Ledger Entry Lineages (5 Minutes)
For each drifted wallet, inspect the last 20 posted journal lines:
```sql
SELECT 
  id, entry_group_id, account_code, direction, amount, balance_after, idempotency_key, created_at
FROM ledger_entries
WHERE wallet_id = '<DRIFTED_WALLET_ID>'
ORDER BY created_at DESC 
LIMIT 20;
```
Check for:
1. **Broken Chain:** `balance_after` of entry $N$ does not equal `balance_after` of entry $N-1 \pm \text{amount}$.
2. **Missing Pair:** An entry group with only one leg (violates zero-sum).
3. **Double Application:** Duplicate idempotency key bypass.

#### Step 4: Containment & Balance Freezing
Prevent further automated or manual transactions on affected wallets:
```sql
UPDATE wallets 
SET is_locked = true, updated_at = NOW() 
WHERE id IN ('<DRIFTED_WALLET_ID_1>', '<DRIFTED_WALLET_ID_2>');
```

#### Step 5: Post Compensating Entry Group (Never Mutate Historical Rows)
```sql
-- Post balancing transaction via internal stored procedure or API
SELECT ledger.post_entry_group(
  p_group_id        := gen_random_uuid(),
  p_description     := 'AUDIT_CORRECTION_INC_20261011',
  p_idempotency_key := 'reconciliation_fix_' || gen_random_uuid(),
  p_entries         := jsonb_build_array(
    jsonb_build_object(
      'wallet_id', '<DRIFTED_WALLET_ID>',
      'account_code', 'VENDOR_PAYABLE',
      'direction', 'CREDIT',
      'amount', <CORRECTION_AMOUNT>
    ),
    jsonb_build_object(
      'wallet_id', '<PLATFORM_RESERVE_WALLET_ID>',
      'account_code', 'SUSPENSE_DISCREPANCY',
      'direction', 'DEBIT',
      'amount', <CORRECTION_AMOUNT>
    )
  )
);
```

#### Step 6: Unlock & Verify
Re-run the verification query from Step 2. Confirm zero drifted records. Unlock wallet:
```sql
UPDATE wallets SET is_locked = false WHERE id = '<DRIFTED_WALLET_ID>';
```

---

### Deep Dive 2: `DISPATCH_SLA_CRITICAL_BREACH`

#### Situation
At **12:45 WAT** (Sunday peak lunch rush), P95 dispatch latency reaches **240 seconds**. 9 orders in the **Tanke** and **University Road** clusters have waited $> 6\text{ minutes}$ with no rider assigned.

#### Step 1: Diagnose Supply Scarcity vs Software Failure (2 Minutes)
Examine online rider availability across target zones:
```sql
SELECT 
  cluster_zone,
  COUNT(*) FILTER (WHERE is_online = true) AS online_riders,
  COUNT(*) FILTER (WHERE is_online = true AND is_busy = false) AS idle_riders,
  COUNT(*) FILTER (WHERE is_online = true AND last_heartbeat_at > NOW() - INTERVAL '2 minutes') AS healthy_riders
FROM riders
GROUP BY cluster_zone;
```

#### Step 2: Cross-Check Redis Geospatial Cluster Index
Execute Redis CLI check via bastion or Cloud Shell:
```bash
# Query online riders within 5km radius of Tanke Central (Lat: 8.4799, Lng: 4.5418)
redis-cli GEOSEARCH riders:geo:online FROMLONLAT 4.5418 8.4799 BYRADIUS 5000 m WITHDIST WITHCOORD
```
* **Case A: Redis has 0 riders, but Postgres shows 15 online:**  
  $\rightarrow$ The Redis geospatial index is out of sync. Re-seed Redis from PostgreSQL:
  ```bash
  curl -X POST https://api.dispatch.ng/admin/riders/reindex-geo \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  ```
* **Case B: Both Redis and Postgres show 0-2 idle riders:**  
  $\rightarrow$ Pure supply deficit. Proceed immediately to Step 3.

#### Step 3: Trigger High-Demand Surge Incentives (Step 3)
Inject a dynamic bonus notification via Termii SMS and FCM push to off-duty riders registered in Kwara State:
```bash
curl -X POST https://api.dispatch.ng/admin/dispatch/incentive \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster": "TANKE",
    "bonus_naira": 400,
    "window_minutes": 60,
    "push_title": "₦400 Surge Bonus Active in Tanke!",
    "push_body": "Heavy lunch rush orders waiting. Earn an extra ₦400 per completed delivery now!"
  }'
```

#### Step 4: Authorize Operations Room Manual Override (Step 4)
For any order lingering $> 8\text{ minutes}$:
1. Ping `#war-room-dispatch` in Slack: *"Authorizing manual force-assignment for Tanke cluster."*
2. Dispatcher assigns designated backup platform motorcycle directly via Admin API:
   ```bash
   curl -X POST https://api.dispatch.ng/admin/dispatch/manual-assign \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"order_id": "<STALLED_ORDER_ID>", "rider_id": "<BACKUP_RIDER_ID>"}'
   ```

#### Step 5: Mitigate Customer Impact
Notify waiting customers through PWA banner and auto-apply platform wallet compensation:
```bash
curl -X POST https://api.dispatch.ng/admin/customers/appeasement \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"order_id": "<STALLED_ORDER_ID>", "credit_naira": 300, "reason": "DISPATCH_DELAY"}'
```

---

### Deep Dive 3: `RIDER_APP_SYNC_FAILURE`

#### Situation
At **17:15 WAT**, rider telemetry heartbeat success plummets from **99.8% to 81.2%**. Multiple riders report that the Flutter app is stuck on "Connecting to Dispatch Network...".

#### Step 1: Check Inbound Endpoint HTTP Status Codes (2 Minutes)
Inspect the Cloud Run revision ingress traffic:
```bash
gcloud logging read 'resource.type="cloud_run_revision" httpRequest.requestUrl=~"/riders/me/location"' \
  --limit=200 --format=json | jq -r '.[].httpRequest.status' | sort | uniq -c
```
* **If 502 / 503 / 504 Dominates:** Cloud Run concurrency is saturated or Redis is failing to accept `GEOADD` writes.
* **If 400 / 422 Dominates:** Client payload schema validation error (recent mobile release bug).
* **If 401 / 403 Dominates:** Access token refresh failure or JWT expiration issue.

#### Step 2: Inspect Redis Server Memory & Slowlog (2 Minutes)
Connect to Memorystore Redis:
```text
INFO memory
INFO stats
SLOWLOG GET 10
```
Check if `used_memory` approaches `maxmemory`. If Redis entered `volatile-lru` eviction on critical keys, clear non-critical cache spaces:
```bash
# Delete non-critical cached menu thumbnails and session tokens (NEVER run FLUSHALL)
redis-cli --scan --pattern "cache:menu:*" | xargs -L 100 redis-cli DEL
```

#### Step 3: Verify Recent App Version Deployments
Check if a new Flutter bundle was published within the past 4 hours:
```bash
git log -n 5 -- apps/rider-mobile/
```
If an unhandled serialization bug exists in mobile release `v1.8.4`:
1. Enable server-side relaxed payload parsing in `backend/src/modules/dispatch/dto/location.dto.ts`.
2. Push emergency hotfix or activate feature flag:
   ```bash
   curl -X POST https://api.dispatch.ng/admin/config/flags \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"flag": "RELAXED_RIDER_TELEMETRY_VALIDATION", "enabled": true}'
   ```

#### Step 4: SMS Communication & Rider Earnings Protection
Riders depend on continuous daily earnings. If the network is degraded for $> 15\text{ minutes}$:
1. Broadcast an operational SMS via Termii:
   > *"Dispatch Alert: We are experiencing a temporary network delay. Your active shift and ratings are protected. Please pause at your current station. Next update in 10 mins."*
2. Automatically credit an idle-standby allowance to all riders checked in during the outage:
   ```bash
   curl -X POST https://api.dispatch.ng/admin/riders/standby-allowance \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"window_minutes": 30, "allowance_naira": 500}'
   ```

---

## 11. Compliance, Auditability & Runbook Maintenance

1. **Quarterly Fire Drills:** The engineering team conducts simulated SEV1 failover drills once every quarter (e.g., simulating Cloud SQL failover, forced Redis eviction, and simulated Monnify webhook silence).
2. **Postmortem Action Item SLA:** Every action item generated from a postmortem is assigned a Jira / GitHub issue with an absolute 14-day completion deadline.
3. **Runbook Review Cycle:** This runbook is reviewed and re-approved by the Backend Lead and CTO upon every minor version bump or database schema change.
