# ARTIFACT 27: Security Review Checklist & Technical Due Diligence Audit

This document constitutes the pre-launch security audit for the **Dispatch Rider Aggregator & Food Vendor Storefront** platform. It serves as the operational baseline required before opening the platform to real Nigerian customers and vendors, and as the technical security disclosure for enterprise partners and institutional investors during seed-round technical due diligence.

---

## 27.1 Threat Model

Before establishing defenses, we explicitly define the adversaries, motivations, target assets, and deliberate out-of-scope risks.

### Attacker Profiles
| Attacker | Motivation | Capability | Likelihood |
| :--- | :--- | :---: | :---: |
| **Opportunistic Fraudster** | Free food, refund abuse, fake non-delivery claims | Low | **High** |
| **Organized Fraud Ring** | Cash extraction via fabricated orders and payout gaming | Medium | **Medium** |
| **Curious Competitor** | Scraping pricing, vendor lists, and rider commission splits | Medium | **Medium** |
| **Disgruntled User / Rider** | Retaliation, chargeback spam, fake complaints | Low | **Medium** |
| **Insider (Employee)** | Financial embezzlement, unauthorized database tampering | High | **Low** |
| **Script Kiddie** | Automated credential stuffing, scraping, DoS | Low | **Medium** |
| **Payment Fraudster** | Card testing via checkout endpoints | Medium | **Medium** |
| **Nation-State / APT** | Outside startup profile; no state espionage interest | High | **Very Low** |

### Target Assets & Value
* **Payment & Escrow Rails**: Direct financial theft, virtual account routing manipulation, refund loop abuse.
* **Customer PII**: Nigerian Data Protection Regulation (NDPR) regulatory fines, user impersonation.
* **Vendor & Rider Bank Accounts**: Account takeover (ATO), diversion of automated payout batches.
* **Double-Entry Financial Ledger**: Silent balance drift, unauthorized wallet overdraft creation.
* **Privileged Admin Access**: Full database takeover, arbitrary status flipping.
* **Secret Manager & API Keys**: Cloud resource hijacking, Vertex AI token exhaustion.
* **Conversational AI / WhatsApp Endpoint**: Prompt injection, service denial, model abuse.

### Deliberately Accepted Risks
1. **Nation-state cyber warfare**: Defense costs disproportionate to pre-seed profile.
2. **Physical office break-ins in Ilorin**: Mitigated by asset insurance and disk encryption, not armed security.
3. **GCP internal zero-days**: Relies on Google Cloud's hypervisor and infrastructure boundary guarantees.

---

## 27.2 OWASP Top 10 Coverage

### A01 — Broken Access Control
* **Risk**: Cross-tenant data leakage (Customer A reading Customer B's order; Vendor A viewing Vendor B's payouts).
* **Mitigations**:
  - Strict resource ownership checks in all controllers/services:
    ```typescript
    if (order.customerId !== req.user.sub && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied to resource');
    }
    ```
  - Role-Based Access Control (RBAC) enforced via `@Roles(...)` decorators and global `JwtAuthGuard`.
  - Zero client trust: Total amounts, delivery fees, and commissions recalculated server-side.
  - Multi-tenant cluster isolation for vendors and dispatch offers.
* **Verification Checks**:
  - [x] Customer A cannot fetch Customer B's order (HTTP 403 Forbidden).
  - [x] Vendor A cannot view or modify Vendor B's menu items.
  - [x] Rider A cannot accept a delivery offer targeted to Rider B.
  - [x] Unprivileged users cannot access `/api/admin/*` endpoints.
  - [x] Soft-deleted accounts immediately lose API token validity.

### A02 — Cryptographic Failures
* **Risk**: Plaintext transmission or storage of phone numbers, tokens, or banking details.
* **Mitigations**:
  - **In Transit**: Strict TLS 1.3 encryption across all endpoints. HSTS preloaded (`max-age=31536000; includeSubDomains; preload`). Plaintext HTTP automatically redirects to HTTPS.
  - **At Rest**: Cloud SQL encrypted with Google-managed AES-256 keys. Cloud Storage buckets uniformly encrypted. Secrets segregated in GCP Secret Manager.
  - **Application Layer**: OTP codes hashed using bcrypt/argon2id (5-minute TTL). Device refresh tokens hashed with SHA-256 before database insertion. Admin TOTP secrets encrypted with AES-256-GCM using Google Cloud KMS.
  - **PII Scrubbing**: Phone numbers and delivery addresses masked in application logs and Sentry crash reports.
* **Verification Checks**:
  - [x] HTTP endpoints strictly return 301/308 redirects to HTTPS.
  - [x] Production application logs contain zero plaintext Nigerian phone numbers (`+234`).
  - [x] TOTP secrets cannot be decrypted without Cloud KMS key access.

### A03 — Injection (SQL, NoSQL, Command)
* **Risk**: Malicious SQL injection compromising user records or double-entry ledger balances.
* **Mitigations**:
  - Prisma ORM generates parameterized SQL queries across standard relational models.
  - PostGIS geospatial queries utilize strictly parameterized `$queryRaw` or `DatabaseService.query(text, params)` with `$1, $2` placeholders.
  - Zero dynamic string concatenation (`queryRawUnsafe` / `executeRawUnsafe` forbidden).
  - Class-validator and Zod schemas reject payloads with illegal characters or unexpected fields (`whitelist: true, forbidNonWhitelisted: true`).
* **Verification Checks**:
  - [x] SQL injection payload in phone number returns `400 Bad Request`, not `500 Server Error`.
  - [x] Codebase grep verifies zero instances of unparameterized raw query methods.

### A04 — Insecure Design
* **Risk**: Flawed architectural assumptions resulting in balance drift, race conditions, or unverified deliveries.
* **Mitigations**:
  - **Double-Entry Accounting Invariant**: Money cannot be created or destroyed. Every transaction requires balanced credit and debit entries ($\sum \text{Debits} \equiv \sum \text{Credits}$).
  - **Distributed Redis Locks**: Rider offer claims utilize atomic `SET NX EX` to prevent duplicate assignments during network latency spikes.
  - **Two-Factor Delivery Handoff**: Vendor handoff requires a 4-digit pickup PIN; dropoff requires a customer-supplied OTP before ledger payout executes.
  - **Fail-Safe Defaults**: If payment webhook signature verification fails, transactions remain locked in `PENDING`.
* **Verification Checks**:
  - [x] Unbalanced ledger transactions are rejected by database-level triggers.
  - [x] Concurrent rider claim race produces exactly 1 winner and clean 409 Conflict for competitors.

### A05 — Security Misconfiguration
* **Risk**: Exposed debug endpoints, default database passwords, or permissive CORS policies.
* **Mitigations**:
  - Production builds strip Swagger/OpenAPI documentation and development debug routers.
  - Cloud Run services configure `--no-allow-unauthenticated` for internal microservices.
  - Strict CORS allowlists: Only explicit production domains (`dispatch.ng`, `admin.dispatch.ng`, `vendor.dispatch.ng`) permitted. Wildcard `*` rejected.
  - Production containers run as unprivileged `nonroot` users with read-only root filesystems.
* **Verification Checks**:
  - [x] Debug paths (`/debug`, `/actuator`, `/metrics`, `/_next`) return 404 in production.
  - [x] CORS preflight rejects unauthorized external origins.
  - [x] Stack traces never leak to HTTP clients; internal errors return generic error IDs.

### A06 — Vulnerable and Outdated Components
* **Risk**: Remote code execution or data leakage through outdated npm dependencies.
* **Mitigations**:
  - GitHub Dependabot enabled with automated weekly vulnerability PRs.
  - CI pipeline enforces `npm audit --audit-level=high`. Build breaks on high/critical CVEs.
  - Minimal container base images: `node:20-alpine` pinned to immutable SHA256 digests.
  - Monorepo lockfiles (`package-lock.json`) committed to version control.
* **Verification Checks**:
  - [x] Production dependency tree reports 0 high or critical vulnerabilities.
  - [x] Base Docker images rebuilt within 30 days.

### A07 — Identification and Authentication Failures
* **Risk**: Credential stuffing, brute-force OTP interception, session fixation.
* **Mitigations**:
  - **Passwordless Architecture**: Authentication uses 6-digit cryptographic OTPs via SMS (Termii/Africa's Talking). Zero user passwords stored.
  - **Anti-Brute Force**: Maximum 5 incorrect verification attempts per OTP before permanent invalidation and phone cooldown lockout.
  - **Asymmetric JWTs**: Short-lived 15-minute access tokens signed with ES256; 30-day refresh tokens rotated upon every refresh invocation.
  - **Admin MFA**: Admin console mandates hardware/TOTP multi-factor authentication (Google Authenticator).
* **Verification Checks**:
  - [x] OTP lockout activates after 5 consecutive failures.
  - [x] Replaying an expired refresh token invalidates the entire user session family.
  - [x] Admin login without TOTP code fails with HTTP 401 Unauthorized.

### A08 — Software and Data Integrity Failures
* **Risk**: Forged payment webhooks from fraudulent bank rails; untrusted code updates.
* **Mitigations**:
  - **Cryptographic Webhook Signatures**:
    - Monnify: SHA-512 HMAC validation against raw request buffer.
    - Korapay: SHA-256 HMAC validation against raw request buffer.
    - Meta WhatsApp: SHA-256 HMAC signature validation (`X-Hub-Signature-256`).
  - Constant-time signature comparison using `crypto.timingSafeEqual` to eliminate timing attacks.
  - Double-entry ledger entries are append-only; update triggers strictly prevent row alteration.
* **Verification Checks**:
  - [x] Webhook request with missing or invalid signature header returns HTTP 401.
  - [x] SQL `UPDATE` on `ledger_entries` raises an immutable table constraint exception.

### A09 — Security Logging and Monitoring Failures
* **Risk**: Silent compromise going undetected; lack of forensic audit trails.
* **Mitigations**:
  - Cloud Logging ingests structured JSON logs across all Cloud Run services.
  - Sentry captures uncaught exceptions with automatic PII sanitization.
  - Critical security alerts configured in Google Cloud Monitoring:
    - Failed logins > 10/min for a single phone.
    - API 5xx error rate > 1.0%.
    - Double-entry ledger imbalance detected.
    - Webhook signature failures > 50/hour.
* **Verification Checks**:
  - [x] Admin privilege escalation, wallet modifications, and logins generate immutable audit records.
  - [x] Log retention set to 90 days for operational forensics.

### A10 — Server-Side Request Forgery (SSRF)
* **Risk**: Forcing backend services to query cloud metadata services (`http://169.254.169.254`) or internal databases.
* **Mitigations**:
  - Backend does not perform outbound HTTP requests based on user-supplied URLs.
  - Vendor menu images and proofs are uploaded directly to Cloud Storage via pre-signed URLs.
  - Webhook delivery destinations are hardcoded to approved PSP endpoints.
* **Verification Checks**:
  - [x] Uploading external image URLs pointing to internal IP addresses or cloud metadata returns validation error.

---

## 27.3 Authentication & Authorization Audit

### Token & Session Lifecycle Specifications
| Parameter | Specification | Defense Mechanism |
| :--- | :--- | :--- |
| **OTP Generation** | `crypto.randomInt(100000, 999999)` | Cryptographically secure pseudo-random number generator (CSPRNG) |
| **OTP Storage** | bcrypt / argon2id hashed in `otp_codes` | Plaintext OTP never written to persistent disk |
| **OTP Rate Limits** | 3 requests / phone / 15 min; 10 / IP / hour | Redis sliding window rate limiter |
| **Access Token** | 15-minute expiration, ES256 algorithm | Stateless verification across horizontal Cloud Run instances |
| **Refresh Token** | 30-day expiration, opaque UUID, SHA-256 hashed | Automatic rotation upon exchange; device-bound |
| **Session Revocation** | Database-backed user active status check | Admin can instantly freeze compromised accounts |
| **Admin MFA** | RFC 6238 TOTP (30s step, SHA-1/SHA-256) | Required for all admin portal authentications |

---

## 27.4 Data Protection & NDPR Compliance

### Sensitive Data Inventory
| Data Element | Storage Location | Protection Mechanism |
| :--- | :--- | :--- |
| **Phone Number** | `users.phone_number` | Unique index; encrypted at rest; masked in logs (`+23480****2222`) |
| **Full Name** | `users.full_name` | Encrypted at rest via Cloud SQL AES-256 |
| **Customer Delivery Address** | `orders.delivery_address` | Retained for 2 years post-order, then anonymized |
| **Rider GPS Telemetry** | `riders.last_location` | Active location in Redis; historical traces truncated to 30 days |
| **Bank Account Numbers** | `vendors.account_number` | Encrypted at rest; masked in portal UI (`******4921`) |
| **National Identity Number (NIN)**| `riders.nin` | Encrypted; access restricted to compliance review |
| **Guarantor Contact Info** | `riders.guarantor_phone` | Access restricted to verified fraud investigations |

### Automated Retention Cleanup
Scheduled nightly cleanup job purging transient security and telemetry records:
```sql
-- Nightly Data Hygiene Run
DELETE FROM otp_codes WHERE created_at < now() - interval '24 hours';
DELETE FROM webhook_events WHERE processed_at < now() - interval '30 days';
DELETE FROM notifications_outbox WHERE status = 'DELIVERED' AND created_at < now() - interval '30 days';
```

---

## 27.5 API Security & Rate Limiting

### Perimeter Throttling Matrix
| Endpoint Route | Threshold Limit | Action on Exceeded |
| :--- | :---: | :--- |
| `POST /api/auth/otp/request` | 3 requests / 15 min per phone | HTTP 429 Too Many Requests |
| `POST /api/auth/otp/verify` | 5 attempts per OTP code | Code invalidated + 15 min lockout |
| `POST /api/orders` | 10 orders / hour per customer | HTTP 429 (Fraud defense) |
| `POST /api/riders/me/location` | 2 updates / 30s per rider | HTTP 429 |
| `POST /api/payments/webhooks/*` | 1,000 requests / min per IP | HTTP 429 |
| **General Authenticated APIs** | 300 requests / min per user | HTTP 429 |
| **General Public APIs** | 60 requests / min per IP | HTTP 429 |

### Mandatory Security Headers
All Cloud Run and Next.js responses must output:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; img-src 'self' data: https://cdn.dispatch.ng; script-src 'self'
Permissions-Policy: geolocation=(self), camera=(), microphone=()
```

---

## 27.6 Infrastructure Security (GCP)

1. **Identity & Access Management (IAM)**:
   - Zero primitive roles (`Owner`, `Editor`, `Viewer`) assigned to team accounts.
   - Zero long-lived service account JSON keys. CI/CD uses **Workload Identity Federation**.
   - Mandatory Google Workspace hardware/2FA security keys for all engineering staff.
2. **Network Perimeter**:
   - Cloud SQL configured with **Private IP only** within VPC; public IP completely disabled.
   - Cloud Memorystore (Redis) accessible solely via VPC Service Access connector.
   - Cloud Armor WAF enabled on external HTTP(S) Load Balancer to filter DDoS and geo-blocked anomalies.
3. **Secret Hygiene**:
   - Zero secrets stored in Git repositories, Dockerfiles, or developer `.env` files committed to VCS.
   - Automated secret scanning enabled via GitHub Secret Scanning and TruffleHog pre-commit hooks.
   - Secret rotation executed every 90 days for PSP webhook secrets and JWT signing keys.

---

## 27.7 Payment & Financial Security

1. **Virtual Account Settlement**:
   - Monnify and Korapay dynamic virtual accounts are generated per order with a 30-minute expiry window.
   - Funds route directly into the Dispatch Master Settlement Account; food vendors and riders are credited in internal double-entry wallets and settled out via scheduled batches.
2. **Double-Entry Ledger Guarantees**:
   - Wallet balances cannot be decremented below zero unless explicitly configured as credit lines.
   - Every financial operation is accompanied by an immutable cryptographic idempotency key. Repeat webhook deliveries are safely acknowledged with HTTP 200 without duplicate credit execution.
3. **Payout Controls**:
   - Automated rider and vendor bank payouts require prior Name-Inquiry resolution via Monnify/Korapay verifying account name matches KYC records.
   - Payout batches exceeding ₦1,000,000 require dual-admin authorization before release.

---

## 27.8 AI / Multimodal Security (Vertex AI & Gemini)

1. **Prompt Injection & Jailbreak Defense**:
   - Conversational inputs from WhatsApp or web chat are isolated in standard user message turns; system instructions are immutable.
   - Structured JSON schema enforcement: Gemini outputs must conform to strictly typed JSON schemas. Unparseable responses trigger rule-based fallbacks.
   - Function calling tools utilize strict allowlists with role validation. AI cannot execute balance transfers, order status changes, or refunds directly.
2. **Data Confidentiality**:
   - Zero customer PII (phone numbers, full names, home addresses) is passed to Google Cloud Vertex AI prompt contexts. Entities are anonymized as temporary identifiers (`customer_#id`).
   - Enterprise Vertex AI guarantees zero training on customer prompts or menu images.

---

## 27.9 Incident Response & Regulatory Breach Protocol

### Severity Escalation Matrix
| Severity | Description | Response SLA | Leadership Escorted |
| :--- | :--- | :---: | :--- |
| **SEV1** | Active data breach, ledger imbalance, payment gateway compromise | Immediate ($< 15\text{m}$) | CEO, CTO, Legal Counsel |
| **SEV2** | Partial service outage, high API error rate ($> 5\%$), webhook processing failure | $< 30\text{m}$ | CTO, Lead Backend Engineer |
| **SEV3** | Non-critical functionality degraded, isolated rider location reporting issue | $< 4\text{h}$ | On-Call Engineer |
| **SEV4** | Minor cosmetic glitch, low-priority security bug | Next Sprint | Product Lead |

### NDPR 72-Hour Breach Notification Process
In accordance with the **Nigeria Data Protection Act (NDPA 2023)**:
1. **Hour 0–24**: Containment of breach, forensic snapshot of Cloud SQL and Cloud Logging records, activation of incident war room.
2. **Hour 24–48**: Impact assessment (scope of users affected, PII categories exposed).
3. **Hour 48–72**: Formal notification submitted to the **Nigeria Data Protection Commission (NDPC)** detailing incident scope, containment measures, and remediation steps.
4. **Day 3–7**: Direct notification delivered to affected Nigerian customers and vendors via SMS and email.

---

## 27.10 Penetration Testing Scope & Pre-Launch Sign-Off

### External Penetration Test Specification
* **Target Firms**: CyberPlural (Lagos), Purple Team Africa, or Cobalt.
* **Testing Window**: 3-week engagement (2 weeks active testing, 1 week retest).
* **Scope**:
  - Storefront API: `https://api.staging.dispatch.ng`
  - Vendor & Admin Portals: `https://vendor.staging.dispatch.ng`
  - Flutter Rider Mobile Application (release APK)
  - Monnify & Korapay Webhook Endpoints
* **Gate Requirement**: **Zero Critical or High severity vulnerabilities** permitted at launch. Medium findings must have an approved remediation roadmap within 60 days.

### Pre-Launch Executive Sign-Off Gate
Before shifting production DNS traffic to `dispatch.ng`:

| Function | Sign-off Representative | Gate Requirement | Status |
| :--- | :--- | :--- | :---: |
| **Engineering (CTO)** | Sulaiman | 100% E2E tests pass, zero high CVEs, secrets in KMS | [ ] |
| **Operations (COO)** | Operations Lead | 24/7 on-call rotation active, PagerDuty configured | [ ] |
| **Security Lead** | External Auditor | Penetration test report clean of Critical/High bugs | [ ] |
| **Legal Counsel** | Corporate Legal | NDPR privacy policies, vendor contracts, CAC filings active | [ ] |
