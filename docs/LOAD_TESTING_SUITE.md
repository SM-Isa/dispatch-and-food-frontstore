# ARTIFACT 26: Load Test Suite

This document establishes the load testing framework and execution suite for the **Dispatch Rider Aggregator & Food Vendor Storefront** platform. It proves the platform can handle peak transactional velocity before real customers encounter bottleneck failure modes.

---

## 26.1 Load Testing Philosophy

Five principles govern performance and capacity engineering at Dispatch:

1. **Principle 1 — Test the real system, not a mock.**  
   k6 hits the actual staging environment (production-shaped infrastructure, production-sized database). No mocks. No shortcuts. If the database is slow because of an N+1 query, we must see it under load.

2. **Principle 2 — Test scenarios, not isolated endpoints.**  
   We do not test "1,000 requests to `/orders`". We test "500 customers browsing menus, 100 adding to cart, 50 checking out, 20 riders accepting offers — all concurrently." Realistic user mix beats synthetic single-endpoint volume.

3. **Principle 3 — Fail fast, fix faster.**  
   If a test fails, we do not rerun hoping for a different result. We analyze the bottleneck, remediate the code or infrastructure parameter, and re-run.

4. **Principle 4 — Test to failure, not just to target.**  
   The goal is not merely "does it survive $X$?" It is "at what $X$ does it break, and how does it degrade?" Knowing the ceiling and graceful degradation posture is essential for high-stress operational stability.

5. **Principle 5 — Test continuously, not once.**  
   Load tests run weekly in CI against staging. Performance regressions are caught before PRs hit production.

---

## 26.2 The Load Profile

Peak projections derived from the Dispatch multi-cluster financial model:

### Expected Load by Operational Phase
| Phase | Orders/Day | Peak Orders/Hour | Concurrent Users | Concurrent Riders |
| :--- | :---: | :---: | :---: | :---: |
| **Month 1** | 2,000 | 100 | 500 | 100 |
| **Month 3** | 6,000 | 300 | 1,500 | 100 |
| **Month 6** | 13,000 | 650 | 3,000 | 200 |
| **Month 12** | 25,000 | 1,250 | 5,000 | 200 |
| **Month 24** | 66,000 | 3,300 | 15,000 | 400 |

### Peak Temporal Patterns
* **Daily Peaks**:
  - Lunch: 12:00–14:00 (35% of daily volume)
  - Dinner: 18:00–21:00 (45% of daily volume)
  - Off-peak: 20% distributed across the remaining 19 hours
* **Weekly Peaks**:
  - Friday & Saturday: 1.4x daily average
  - Sunday: 1.2x daily average
  - Monday–Thursday: 0.9x daily average
* **Monthly Peaks**:
  - Payday week (25th to month-end): 1.3x baseline
  - First week of month: 1.1x baseline

### Testing Targets
| Test Type | Target Volume | Rationale |
| :--- | :--- | :--- |
| **Sustained Peak** | Month 12 peak (1,250 orders/hr) for 1 hour | Confirms annual headroom |
| **Burst Peak** | 2x Month 12 peak (2,500 orders/hr) for 5 min | Black Friday / Festival rush resilience |
| **Rider Heartbeat** | 2,000 concurrent riders every 30s | High-frequency Redis GEO load |
| **WhatsApp Messages**| 10,000 messages/hour | Conversational commerce ingestion |
| **Menu Extraction** | 500 menu uploads/hour | Vendor onboarding bursts |
| **Webhook Throughput**| 5,000 webhooks/hour | PSP retry storm absorption |
| **Long-Running Soak**| 650 orders/hr sustained for 24 hours | Catches memory and pool leaks |
| **Failure Recovery** | Kill Cloud Run container during peak | Confirms zero dropped requests |

---

## 26.3 Tooling

**Tool**: [k6](https://k6.io) by Grafana Labs.

* **Why k6**:
  - Written in Go: Generates 10,000+ virtual users (VUs) from a single host.
  - JavaScript scripting: Clean, native syntax for engineering teams.
  - Native protocol support: HTTP/1.1, HTTP/2, WebSocket, gRPC.
  - Native telemetry export: Direct stream to InfluxDB, Prometheus, and Grafana.
  - Headless CI execution: Single static binary without background daemons.
* **Why Not JMeter**: Heavy JVM footprint, awkward XML/GUI scripting.
* **Why Not Locust**: Python GIL bottleneck; requires distributed workers for moderate loads.
* **Why Not Artillery**: Node.js single-thread execution caps out around 1,000 VUs per host.

### Load Generation Infrastructure
* Standard CI: 1 Cloud Run Job (4 vCPU / 8 GB RAM) or GitHub Actions large runner.
* Scale stress testing: 4 GCE `e2-medium` instances running k6 in distributed mode.

---

## 26.4 Test Scenarios (Ranked by Criticality)

### Scenario 1 — Sustained Peak (Orders)
* **Objective**: Verify Month 12 peak order processing.
* **Load**: 1,250 orders/hr sustained for 1 hour (80% browsing, 15% cart additions, 5% checkouts).
* **SLAs**:
  - P95 API Latency < 500ms
  - P99 API Latency < 1,500ms
  - Error rate < 0.5%
  - Database pool saturation < 80%
  - Zero 5xx errors on `/orders`

### Scenario 2 — Burst Peak
* **Objective**: Rapid scale-out from 0 to 2,500 orders/hr in 30 seconds for 5 minutes.
* **SLAs**:
  - Cloud Run scales from min-instances to 50 within 60s
  - Zero cold-start drops
  - P95 latency < 1,000ms during burst
  - 100% request completion

### Scenario 3 — Rider Heartbeat
* **Objective**: Stress Redis PostGIS GEO radius storage with 2,000 concurrent riders.
* **Load**: Heartbeat sent every 30 seconds for 30 minutes.
* **SLAs**:
  - P95 heartbeat latency < 200ms
  - Redis `GEOADD` latency P95 < 10ms
  - Zero Redis command timeouts
  - Zero lock contention on rider location tables

### Scenario 4 — WhatsApp Message Burst
* **Objective**: Stress conversational commerce ingestion and queue dispatch.
* **Load**: 10,000 messages/hr (166 msgs/min), 70% text, 30% audio.
* **SLAs**:
  - P95 queue processing < 5s
  - Zero messages dropped
  - AI token rate limits respected via BullMQ backpressure

### Scenario 5 — Menu Extraction Throughput
* **Objective**: High-volume multimodal OCR onboarding.
* **Load**: 500 menu uploads/hr triggering Gemini 1.5 Flash Vision.
* **SLAs**:
  - P95 extraction latency < 8s
  - Schema parsing success > 99%
  - Zero quota exhaustion (buffered via Cloud Tasks)

### Scenario 6 — Webhook Throughput
* **Objective**: Ingest Monnify/Korapay payment webhooks under bank retry storms.
* **Load**: 5,000 webhooks/hr with 10% duplicate events.
* **SLAs**:
  - P95 webhook response < 3s
  - Zero double-credited ledger entries
  - Reconciliation query variance remains 0.00

### Scenario 7 — 24-Hour Soak
* **Objective**: Detect memory leaks, slow garbage collection, and connection leaks.
* **Load**: 650 orders/hr sustained for 24 hours.
* **SLAs**:
  - Container memory growth < 20%
  - DB connection pool growth < 10%
  - P95 latency degradation < 15% between Hour 1 and Hour 24

### Scenario 8 — Instance Failure During Peak
* **Objective**: Verify high availability during unexpected Cloud Run instance termination.
* **Action**: Terminate primary instance at Minute 15 of sustained peak.
* **SLAs**:
  - Cloud Run auto-heals within 30s
  - Zero dropped active client connections
  - P95 latency spike < 500ms

---

## 26.5 The k6 Test Scripts

### Shared Configuration (`load-tests/config.js`)
```javascript
export const config = {
  baseUrl: __ENV.BASE_URL || 'http://localhost:4000',
  apiToken: __ENV.API_TOKEN || '',
  vendorIds: (__ENV.VENDOR_IDS || '20000000-0000-0000-0000-000000000001').split(',').filter(Boolean),
  productIds: (__ENV.PRODUCT_IDS || '30000000-0000-0000-0000-000000000001,30000000-0000-0000-0000-000000000002').split(',').filter(Boolean),
  riderIds: (__ENV.RIDER_IDS || '40000000-0000-0000-0000-000000000001').split(',').filter(Boolean),
};
```

### Shared Helpers (`load-tests/helpers.js`)
```javascript
import { check } from 'k6';
import { config } from './config.js';

export function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiToken}`,
  };
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function checkOk(res, name) {
  return check(res, {
    [`${name}: status is 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${name}: duration < 500ms`]: (r) => r.timings.duration < 500,
  });
}
```

### Scenario 1: Sustained Peak (`load-tests/scenarios/sustained-peak.js`)
```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { config } from '../config.js';
import { authHeaders, randomChoice, checkOk } from '../helpers.js';

const browseLatency = new Trend('browse_latency');
const checkoutLatency = new Trend('checkout_latency');
const ordersCompleted = new Counter('orders_completed');
const orderErrors = new Rate('order_errors');

export const options = {
  scenarios: {
    sustained_peak: {
      executor: 'constant-arrival-rate',
      rate: 1250,
      timeUnit: '1h',
      duration: '1h',
      preAllocatedVUs: 500,
      maxVUs: 2000,
    },
  },
  thresholds: {
    'http_req_duration{scenario:sustained_peak}': ['p(95)<500', 'p(99)<1500'],
    'http_req_failed': ['rate<0.005'],
    'order_errors': ['rate<0.01'],
  },
};

export default function () {
  const roll = Math.random();
  if (roll < 0.80) {
    browseJourney();
  } else if (roll < 0.95) {
    cartJourney();
  } else {
    checkoutJourney();
  }
}

function browseJourney() {
  group('browse', () => {
    const res = http.get(`${config.baseUrl}/api/products/vendor/${randomChoice(config.vendorIds)}`);
    browseLatency.add(res.timings.duration);
    checkOk(res, 'list_products');
    sleep(Math.random() * 2 + 1);
  });
}

function cartJourney() {
  browseJourney();
  sleep(Math.random() * 1.5 + 0.5);
}

function checkoutJourney() {
  browseJourney();
  group('checkout', () => {
    const payload = JSON.stringify({
      vendorId: randomChoice(config.vendorIds),
      items: config.productIds.slice(0, 2).map((id) => ({
        productId: id,
        quantity: 1,
      })),
      deliveryAddress: '14 University Road, Tanke, Ilorin',
      deliveryFee: 800,
    });

    const res = http.post(`${config.baseUrl}/api/orders`, payload, {
      headers: authHeaders(),
    });

    checkoutLatency.add(res.timings.duration);
    const ok = check(res, {
      'order_created: 201': (r) => r.status === 201 || r.status === 200,
      'has_order_number': (r) => {
        try {
          return !!JSON.parse(r.body).order_number;
        } catch {
          return false;
        }
      },
    });

    if (ok) {
      ordersCompleted.add(1);
      orderErrors.add(0);
    } else {
      orderErrors.add(1);
    }
  });
}
```

### Scenario 3: Rider Heartbeat (`load-tests/scenarios/rider-heartbeat.js`)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { config } from '../config.js';

const heartbeatLatency = new Trend('heartbeat_latency');
const heartbeatErrors = new Rate('heartbeat_errors');

export const options = {
  scenarios: {
    rider_heartbeat: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 2000 },
        { duration: '30m', target: 2000 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'heartbeat_latency': ['p(95)<200'],
    'heartbeat_errors': ['rate<0.001'],
  },
};

export default function () {
  const riderId = __VU % config.riderIds.length;
  const lat = 8.4831 + (Math.random() - 0.5) * 0.02;
  const lng = 4.5823 + (Math.random() - 0.5) * 0.02;

  const payload = JSON.stringify({
    latitude: lat,
    longitude: lng,
    batteryLevel: Math.floor(Math.random() * 60) + 30,
    timestamp: new Date().toISOString(),
  });

  const res = http.post(`${config.baseUrl}/api/riders/me/location`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiToken}`,
    },
  });

  heartbeatLatency.add(res.timings.duration);
  const ok = check(res, {
    'heartbeat_ok': (r) => r.status === 200 || r.status === 204,
  });
  heartbeatErrors.add(!ok);

  sleep(30);
}
```

### Scenario 6: Payment Webhook Throughput (`load-tests/scenarios/webhook-throughput.js`)
```javascript
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { config } from '../config.js';

const webhookLatency = new Trend('webhook_latency');
const webhookErrors = new Rate('webhook_errors');
const duplicatesCounter = new Counter('webhook_duplicates');

export const options = {
  scenarios: {
    webhook_throughput: {
      executor: 'constant-arrival-rate',
      rate: 83,
      timeUnit: '1m',
      duration: '30m',
      preAllocatedVUs: 100,
      maxVUs: 300,
    },
  },
  thresholds: {
    'webhook_latency': ['p(95)<3000'],
    'webhook_errors': ['rate<0.01'],
  },
};

export default function () {
  const isDuplicate = Math.random() < 0.10;
  const refNum = isDuplicate ? Math.floor(Math.random() * 50) : Math.floor(Math.random() * 100000);

  const payload = JSON.stringify({
    eventType: 'SUCCESSFUL_TRANSACTION',
    transactionReference: `MNFY_TXN_${refNum}`,
    paymentReference: `PAY_ORD_${refNum}`,
    amountPaid: 4500.00,
    paymentStatus: 'PAID',
  });

  const res = http.post(`${config.baseUrl}/api/payments/webhooks/monnify`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'monnify-signature': 'staging_test_signature_valid',
    },
  });

  webhookLatency.add(res.timings.duration);
  webhookErrors.add(res.status >= 400);

  if (isDuplicate) {
    duplicatesCounter.add(1);
  }

  check(res, {
    'webhook_handled': (r) => r.status === 200,
  });
}
```

---

## 26.6 Test Data Setup & Hygiene

### Seeding Script (`scripts/load-test-seed.ts`)
Creates realistic staging volume:
* 200 Vendors across Tanke, GRA, Challenge, and Fate clusters.
* 2,000 Menu Products with realistic NGN prices.
* 200 Verified Riders with motorcycle profiles and guarantor escrows.
* 5,000 Customers with verified +234 phone formats.

### Staging Cleanup (`scripts/load-test-cleanup.ts`)
```sql
DELETE FROM order_status_history WHERE order_id IN (
  SELECT id FROM orders WHERE notes = 'Load test order'
);
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE notes = 'Load test order'
);
DELETE FROM deliveries WHERE order_id IN (
  SELECT id FROM orders WHERE notes = 'Load test order'
);
DELETE FROM orders WHERE notes = 'Load test order';
DELETE FROM webhook_events WHERE event_id LIKE 'evt_load_%';
```

---

## 26.7 CI/CD Automation (`.github/workflows/load-test.yml`)

Weekly automated regression execution on Sundays at 03:00 UTC:
* Automatically provisions k6 binary on runner.
* Injects staging Cloud SQL connection string & staging tokens.
* Runs test scenarios with `--summary-export=results.json`.
* Uploads performance metrics artifacts to GitHub Actions.
* Dispatches Slack alerts if P95 latency or error rate exceeds thresholds.

---

## 26.8 Interpreting Results & Red Flags

```text
     ✓ list_products: status is 2xx
     ✓ checkout: status is 201
     ✓ checkout: has order_number

     http_req_duration..............: avg=124ms min=45ms med=98ms p(90)=245ms p(95)=412ms p(99)=1.21s
     http_req_failed................: 0.21%
     order_errors...................: 0.18%

     iterations.....................: 1250  41.6/s
     vus............................: 45    min=45  max=500
```

### Diagnostic Red Flags
| Symptom | Probable Cause | Immediate Remediation |
| :--- | :--- | :--- |
| **P99 >> P95** (e.g. P95=400ms, P99=4s) | Connection pool starvation or GC pauses | Increase Cloud SQL pool / tune container memory. |
| **Errors cluster at start** | Cold starts; min-instances too low | Set Cloud Run `--min-instances=2` minimum. |
| **Errors cluster at end** | Memory leak or connection leak | Inspect heap dumps and connection pool returns. |
| **Latency creeps up linearly** | Memory leak or unindexed table scan | Run `EXPLAIN ANALYZE` on slow queries; check Redis memory. |
| **Flat high latency across percentiles** | External API bottleneck (Telco, Gemini, PSP) | Implement BullMQ async buffering and backpressure. |

---

## 26.9 Infrastructure Capacity & Cost Model

### Cloud Run Scaling Profiles
| Throughput | Instances Needed | Instance Spec |
| :---: | :---: | :--- |
| **10 req/s** | 1 | `min=1, max=5` (2 vCPU, 2 GB) |
| **100 req/s** | 3 | `min=2, max=10` (2 vCPU, 2 GB) |
| **500 req/s** | 8 | `min=2, max=20` (2 vCPU, 2 GB) |
| **1,250 req/s** | 15 | `min=2, max=30` (2 vCPU, 2 GB) |
| **5,000 req/s** | 50 | `min=2, max=100` (2 vCPU, 2 GB) |

### Infrastructure Cost at Peak (Month 12: 1,250 orders/hr)
* Cloud Run (API + Workers + Portals): **$320/mo**
* Cloud SQL (HA with Read Replica): **$520/mo**
* Cloud Memorystore (Redis Standard HA): **$210/mo**
* Vertex AI & Gemini Foundation Models: **$1,510/mo**
* Google Maps Platform Routes & Distance Matrix: **$410/mo**
* BigQuery Analytics & Logging: **$180/mo**
* Other Infrastructure (GCS, Secret Mgr, Networking): **$560/mo**
* **Total Operating Infrastructure**: **$3,710/month** (Fully covered by Google for Startups Cloud Program AI credits).

---

## 26.10 Load Testing Calendar

1. **Weekly (Sundays 03:00 UTC)**: Sustained peak at Month 6 volume (650 orders/hr) for 1 hour (~$4 cost).
2. **Monthly (First Sunday, 03:00 UTC)**: All 8 scenarios at Month 6 volume for 4 hours (~$20 cost).
3. **Quarterly (Every 3 Months)**: Full capacity test at next-phase projected volume for 6 hours (~$50 cost).
4. **Pre-Cluster Launch**: Immediate sustained + burst peak verification before expanding into new cities (~$15 cost).
