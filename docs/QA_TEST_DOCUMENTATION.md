# ARTIFACT 31: QA Test Documentation
The comprehensive test guide for QA engineers. Everything needed to test Dispatch end-to-end, from getting access to signing off on a release.

Structure:

QA philosophy — how we think about testing

QA environment setup — access, credentials, tooling

Test data setup — how to seed and reset

Test case format — the template we use

Customer test suite — 32 test cases

Vendor test suite — 27 test cases

Rider test suite — 28 test cases

Admin & ops test suite — 22 test cases

End-to-end scenarios — 8 full lifecycle tests with diagrams

Edge cases and negative tests — 40+ scenarios

Regression suite — what runs on every release

Bug reporting — template and severity classification

Release sign-off — the final checklist

Test automation — what's automated, what's manual


---

## 31.1 QA Philosophy
Six principles that shape how we test.

Principle 1 — Test the user's reality, not the happy path.

A test that only verifies "customer orders food and it arrives" is worth 10% of its value. The other 90% is: what happens when the rider rejects? When the payment fails? When the customer sends a Yoruba voice note?

Principle 2 — Every test case has a why.

No "verify the button is clickable." Every test verifies something a real user would experience. If we can't name the user impact, we don't write the test.

Principle 3 — Manual QA first, automation second.

We automate what's stable. We test manually what's new, changing, or complex. A QA engineer's job is judgment, not just execution.

Principle 4 — Bugs are gifts.

Every bug found in QA is a bug the customer didn't find. Treat them as data. Categorize them. Fix the systemic issue, not just the symptom.

Principle 5 — Test data must be realistic.

Test customers named "Test Customer 1" test nothing. Test customers named "Adaeze from Tanke, orders jollof every Friday" test the real thing.

Principle 6 — Sign-off is a promise.

When a QA engineer signs off on a release, they're saying "I've verified this works for our actors." That's a serious promise. Never sign off under pressure.


---

## 31.2 QA Environment Setup
Getting access
Every QA engineer needs:

| Access | How to get | Owner |
| :--- | :--- | :--- |
| Staging URL | Email from CTO | CTO |
| Staging admin panel | Email from CTO | CTO |
| Test vendor account | Seeded automatically | QA lead |
| Test rider account | Seeded automatically | QA lead |
| Test customer account | Seeded automatically | QA lead |
| WhatsApp test number | Added to staging | CTO |
| Monnify sandbox | Env vars in staging | Payments engineer |
| Sentry access | Invite from engineer | CTO |
| Slack channels: #qa, #bugs, #releases | Auto-added | Ops lead |
| Google Docs (test plans, bug reports) | Auto-shared | QA lead |
Setup checklist
□ Staging URL works: https://api.staging.dispatch.ng/health returns 200
□ Vendor portal loads: https://vendor.staging.dispatch.ng
□ Customer PWA loads: https://app.staging.dispatch.ng
□ Admin panel loads: https://admin.staging.dispatch.ng (behind IAP)
□ Rider app APK installed (Firebase App Distribution link)
□ WhatsApp test number active
□ Test data seeded (see Section 31.3)
Tooling
Browser: Chrome + Firefox (test both)

Mobile: Two devices (one budget Android, one iPhone)

Network throttling: Chrome DevTools → Slow 3G

Screen recording: Loom or native (for bug reports)

API testing: Postman or Insomnia (for direct API tests)

Database access: Read-only psql to staging (via Cloud SQL proxy)

Logs: Cloud Logging viewer in GCP Console

Test data seeding
Run the seed script once to populate staging:

```bash
cd apps/api
pnpm ts-node scripts/qa-seed.ts
```
This creates:

Test customers (10):

| Phone | Name | Cluster | Behavior |
| :--- | :--- | :--- | :--- |
| +2348000000001 | Adaeze Obi | Tanke | Regular; orders jollof weekly |
| +2348000000002 | Emeka Nwosu | GRA | First-time; hasn't ordered yet |
| +2348000000003 | Fatima Bello | Tanke | Refunded once; flagged for fraud |
| +2348000000004 | Tunde Adeyemi | Challenge | Uses WhatsApp voice notes |
| +2348000000005 | Ngozi Eze | Fate | Orders late night |
| ... 5 more |  |  |  |
Test vendors (10):

| Name | Cluster | Menu size | Bank account |
| :--- | :--- | :--- | :--- |
| Mama's Kitchen | Tanke | 12 items | Test account 1 |
| Chicken Republic | GRA | 25 items | Test account 2 |
| Tunde's Shawarma | Tanke | 8 items | Test account 3 |
| Iya Ngozi Food Canteen | Challenge | 15 items | Test account 4 |
| Suya Palace | Fate | 10 items | Test account 5 |
| ... 5 more |  |  |  |
Test riders (10):

| Name | Cluster | Vehicle | Status |
| :--- | :--- | :--- | :--- |
| Ahmed Ibrahim | Tanke | Motorcycle | Online |
| Chinedu Okoro | GRA | Motorcycle | Online |
| Yusuf Lawal | Tanke | Motorcycle | Offline |
| Emeka Obi | Challenge | Motorcycle | Online |
| Femi Adeyemi | Fate | Motorcycle | Online |
| ... 5 more |  |  |  |
Test admin accounts:

| Role | Phone | Permissions |
| :--- | :--- | :--- |
| Admin | +2348000000100 | Full admin |
| Support | +2348000000101 | Support + read-only admin |
| Ops manager | +2348000000102 | Ops + dispute resolution |
Test OTP handling in staging
In staging, OTP is not sent via SMS to real numbers. Instead:

Option 1: OTP is sent to the staging WhatsApp test number and can be read from the QA Slack channel (#staging-otp).

Option 2: OTP is logged in Cloud Logging with the prefix [QA-OTP] and can be queried:

```bash
gcloud logging read 'jsonPayload.message=~"\[QA-OTP\]"' \
  --limit=10 --format=json | jq '.[].jsonPayload'
```
Option 3: For automated tests, a fixed OTP (000000) is accepted in staging only.

Never use Option 3 for manual QA. It hides bugs in OTP generation.

Test data reset
Reset staging data between test cycles:

```bash
cd apps/api
pnpm ts-node scripts/qa-reset.ts
```
This:

Deletes all orders, deliveries, ledger entries

Keeps test users, vendors, riders

Resets wallet balances to zero

Clears Redis queues and cache

Warning: Never run this against production. The script checks NODE_ENV and refuses if not staging.


---

## 31.3 Test Case Format
Every test case follows this template:

```text
TEST ID:        C-001
TITLE:          Customer places order via WhatsApp and pays successfully
ACTOR:          Customer
PREREQUISITES:  Test customer is logged in; vendor is open; rider available
STEPS:          1. Open WhatsApp, send message to staging number
                2. Send: "Send 2 jollof from Mama's Kitchen to Tanke"
                3. Wait for bot reply
                4. Reply "yes" to confirm
                5. Receive virtual account details
                6. Complete transfer in Monnify sandbox
                7. Wait for confirmation
EXPECTED:       - Bot parses intent correctly
                - Order created with status PAID
                - Ledger entries posted (4 lines)
                - Confirmation message received
                - Vendor receives order notification
ACTUAL:         (fill during test)
STATUS:         PASS / FAIL / BLOCKED
BUG ID:         (if FAIL)
NOTES:          (screenshots, observations)
```
Test IDs are category-prefixed:

C-xxx = Customer

V-xxx = Vendor

R-xxx = Rider

A-xxx = Admin/Ops

E-xxx = End-to-End

N-xxx = Negative/Edge


---

## 31.4 Customer Test Suite (32 test cases)
Authentication
| ID | Title | Priority |
| :--- | :--- | :--- |
| C-001 | Customer requests OTP successfully | P1 |
| C-002 | Customer verifies OTP and logs in | P1 |
| C-003 | Customer cannot log in with wrong OTP | P1 |
| C-004 | Customer is rate-limited after 3 OTP requests | P1 |
| C-005 | Customer's session is bound to their device | P1 |
| C-006 | Customer can log out | P2 |
| C-007 | Customer can log out from all devices | P2 |
| C-008 | Customer's token refreshes automatically | P1 |
| C-009 | Customer session is revoked on device change | P1 |
Browsing
| ID | Title | Priority |
| :--- | :--- | :--- |
| C-010 | Customer sees list of nearby vendors | P1 |
| C-011 | Customer can filter vendors by cluster | P2 |
| C-012 | Customer sees vendor menu with categories | P1 |
| C-013 | Customer sees sold-out items clearly marked | P1 |
| C-014 | Customer can search for vendors | P2 |
| C-015 | Customer sees vendor ETA and delivery fee before ordering | P1 |
| C-016 | Customer cannot see closed vendors | P1 |
| C-017 | Customer outside delivery zone cannot order | P1 |
Ordering
| ID | Title | Priority |
| :--- | :--- | :--- |
| C-018 | Customer places order via WhatsApp text | P1 |
| C-019 | Customer places order via WhatsApp voice note | P1 |
| C-020 | Customer places order via PWA | P1 |
| C-021 | Customer receives clarification when message is ambiguous | P1 |
| C-022 | Customer can add notes to order | P3 |
| C-023 | Customer cannot order below vendor minimum | P2 |
| C-024 | Customer cannot order unavailable items | P1 |
| C-025 | Duplicate WhatsApp message doesn't create duplicate order | P1 |
Payment
| ID | Title | Priority |
| :--- | :--- | :--- |
| C-026 | Customer receives virtual account after order | P1 |
| C-027 | Customer payment confirms order as PAID | P1 |
| C-028 | Customer payment via card (Korapay) works | P2 |
| C-029 | Failed payment leaves order in PENDING | P1 |
| C-030 | Customer cannot cancel after payment without refund | P1 |
| C-031 | Customer can request refund before PREPARING | P2 |
| C-032 | Customer can request refund after PREPARING (with vendor approval) | P3 |
Address Book & Profiles
| ID | Title | Priority |
| :--- | :--- | :--- |
| C-033 | Customer saves new delivery address with landmark and cluster zone | P2 |
| C-034 | Customer selects saved address during checkout | P1 |
| C-035 | Customer deletes saved address from address book | P3 |
Coupons & Reviews
| ID | Title | Priority |
| :--- | :--- | :--- |
| C-036 | Customer applies valid promo code (DISPATCH500) and sees discount | P1 |
| C-037 | Customer sees validation error when entering expired or invalid coupon | P2 |
| C-038 | Customer submits 5-star rating and review for completed delivery | P2 |

### Detailed customer test cases (samples)

#### C-001 — Customer requests OTP successfully
Actor: Customer

Prerequisites:

Staging environment accessible

Test customer phone +2348000000001 not rate-limited

Steps:

Open https://app.staging.dispatch.ng

Click "Login"

Enter phone: +2348000000001

Click "Send OTP"

Expected:

HTTP 200 response

UI shows OTP input screen

OTP is delivered to staging WhatsApp number OR logged in Cloud Logging

Rate limit counter increments for this phone number

Verification:

```bash
# Check Cloud Logging
gcloud logging read 'jsonPayload.message=~"\[QA-OTP\]" AND jsonPayload.phone="+2348000000001"' \
  --limit=1 --format=json
```
Actual: _______
Status: _______


#### C-018 — Customer places order via WhatsApp text
Actor: Customer

Prerequisites:

Test customer logged in

Vendor "Mama's Kitchen" is open

At least 2 riders online in Tanke

QA engineer has access to staging WhatsApp test number

Steps:

Open WhatsApp on QA device

Send to staging number: "Abeg send two packs of amala and assorted meat from Mama's Kitchen to GRA, beside First Bank"

Wait up to 10 seconds for bot reply

Verify bot's reply includes: order summary, total amount, virtual account details

Reply "yes" to confirm

Verify a confirmation message arrives

Expected:

Bot correctly parses:

Vendor: "Mama's Kitchen" (matches Tanke cluster)

Items: 2x Amala with assorted meat

Delivery address: "GRA, beside First Bank"

Confidence ≥ 0.85

Order created in Postgres with status PENDING

Virtual account details sent

Order visible in admin panel

BigQuery event logged

Verification queries:

```sql
-- Check order created
SELECT id, status, total_amount, delivery_address
FROM orders
WHERE customer_id = (SELECT id FROM users WHERE phone_number = '+2348000000001')
ORDER BY created_at DESC LIMIT 1;

-- Check ledger entries (should be 0 at this stage, payment not yet received)
SELECT COUNT(*) FROM ledger_entries
WHERE order_id = 'ord_...';
-- Expected: 0
```
Actual: _______
Status: _______
Screenshots: WhatsApp conversation


#### C-019 — Customer places order via WhatsApp voice note
Actor: Customer

Prerequisites: Same as C-018

Steps:

Record a voice note (in English): "Two plates of jollof rice with chicken from Chicken Republic to Tanke, beside the market"

Send to staging WhatsApp number

Wait up to 15 seconds for bot reply (voice transcription + parsing)

Expected:

Bot transcribes accurately

Bot parses:

Vendor: "Chicken Republic"

Items: 2x Jollof Rice with Chicken

Delivery address: "Tanke, beside the market"

Order created

Response time < 15 seconds

Note: Also test in Nigerian Pidgin: "Abeg send me jollof rice two plates from Chicken Republic go Tanke"

Actual: _______
Status: _______


#### C-021 — Customer receives clarification when message is ambiguous
Actor: Customer

Steps:

Send ambiguous message: "Send me one jollof"

Wait for bot reply

Expected:

Bot identifies missing: vendor, delivery address

Bot replies with one clarification question, e.g.:
"Which vendor? We have jollof from Chicken Republic, Tunde's Shawarma, and 3 others"

Conversation state saved as AWAITING_CLARIFICATION

After customer replies, order completes

Actual: _______
Status: _______


#### C-025 — Duplicate WhatsApp message doesn't create duplicate order
Actor: Customer

Steps:

Send message: "Send 2 jollof from Mama's Kitchen to Tanke"

Immediately send the exact same message again (within 1 second)

Wait for bot replies

Expected:

Only ONE order created

Bot replies with the same confirmation to both messages

Duplicate webhook event logged and ignored

Verification:

```sql
SELECT COUNT(*) FROM orders
WHERE customer_id = '+2348000000001'
  AND created_at > now() - interval '5 minutes';
-- Expected: 1 (not 2)
```
Actual: _______
Status: _______


#### C-029 — Failed payment leaves order in PENDING
Actor: Customer

Steps:

Place order (get virtual account)

Do NOT pay

Wait 30 minutes

Check order status

Expected:

Order remains in PENDING

After 30 minutes, order auto-cancels

No ledger entries created

Customer receives WhatsApp notification: "Your order was cancelled because payment wasn't received"

Vendor doesn't see the order

Verification:

```sql
SELECT status, created_at FROM orders WHERE id = 'ord_...';
-- After 30 min: status should be 'CANCELLED'
```
Actual: _______
Status: _______


---

## 31.5 Vendor Test Suite (27 test cases)
Authentication and profile
| ID | Title | Priority |
| :--- | :--- | :--- |
| V-001 | Vendor logs in with OTP | P1 |
| V-002 | Vendor cannot access another vendor's data | P1 |
| V-003 | Vendor can update store name and logo | P2 |
| V-004 | Vendor can set operating hours | P2 |
| V-005 | Vendor can toggle open/closed status | P1 |
Menu management
| ID | Title | Priority |
| :--- | :--- | :--- |
| V-006 | Vendor uploads menu photo and AI extracts items | P1 |
| V-007 | Vendor reviews and corrects AI extraction | P1 |
| V-008 | Vendor manually adds a new product | P1 |
| V-009 | Vendor toggles item availability (sold out) | P1 |
| V-010 | Vendor edits item price | P1 |
| V-011 | Vendor deletes item | P2 |
| V-012 | Vendor uploads item photo | P2 |
| V-013 | Gemini failure falls back to manual entry | P2 |
| V-014 | Vendor cannot publish item without price | P1 |
Order management
| ID | Title | Priority |
| :--- | :--- | :--- |
| V-015 | Vendor receives order notification when paid | P1 |
| V-016 | Vendor sees order details (items, address, notes) | P1 |
| V-017 | Vendor accepts order (status → PREPARING) | P1 |
| V-018 | Vendor rejects order (triggers refund) | P1 |
| V-019 | Vendor marks order ready for pickup | P1 |
| V-020 | Vendor cannot accept cancelled order | P1 |
| V-021 | Vendor sees order history | P2 |
Earnings
| ID | Title | Priority |
| :--- | :--- | :--- |
| V-022 | Vendor sees earnings dashboard | P1 |
| V-023 | Vendor sees per-order breakdown | P1 |
| V-024 | Vendor downloads earnings statement | P2 |
| V-025 | Vendor sees commission rate | P2 |
Notifications
| ID | Title | Priority |
| :--- | :--- | :--- |
| V-026 | Vendor receives WhatsApp notification for new orders | P2 |
| V-027 | Vendor receives SMS for critical issues (e.g., vendor suspended) | P3 |
Menu Catalog & Self-Service Onboarding
| ID | Title | Priority |
| :--- | :--- | :--- |
| V-028 | Vendor toggles item Sold Out / In Stock with instant customer storefront reflection | P1 |
| V-029 | Vendor creates new dish with price in Naira and preparation time | P2 |
| V-030 | New kitchen completes self-service registration with cluster zone and NIP bank account | P1 |

### Detailed vendor test cases (samples)

#### V-006 — Vendor uploads menu photo and AI extracts items
Actor: Vendor

Prerequisites:

Vendor "Mama's Kitchen" logged in

Test menu image available (tests/fixtures/menu-handwritten-1.jpg)

Steps:

Navigate to Menu → "Add menu with AI"

Upload test image

Wait for extraction

Expected:

Extraction completes within 8 seconds

Response includes items with:

raw_text, parsed_name, parsed_price, category, confidence

If confidence < 0.85 for an item, it's flagged

Vendor sees a review screen with all items pre-filled

No items persisted until vendor clicks "Confirm"

Verification:

```sql
SELECT COUNT(*) FROM menu_extractions
WHERE vendor_id = 'vnd_...'
ORDER BY created_at DESC LIMIT 1;
-- Expected: 1 row with raw_response containing items
```
Actual: _______
Status: _______


#### V-009 — Vendor toggles item availability (sold out)
Actor: Vendor

Steps:

Vendor logs in

Navigate to menu

Toggle "Jollof Rice" to unavailable

Verify customer app reflects change within 5 seconds

Toggle back to available

Expected:

products.is_available = false

Customer app shows "Sold Out" label

Customers cannot add to cart

If a customer already has it in cart, checkout warns them

Change propagates via WebSocket within 2 seconds

Verification:

```sql
SELECT is_available, updated_at FROM products
WHERE id = 'prd_...';
```
Actual: _______
Status: _______


#### V-015 — Vendor receives order notification when paid
Actor: Vendor

Steps:

As customer, place and pay for an order from this vendor

Monitor vendor portal

Expected:

WebSocket event order.paid received within 3 seconds of webhook

Vendor portal plays notification sound

Order appears at top of "Active Orders"

Order shows: order number, items, address, total

Actual: _______
Status: _______


#### V-018 — Vendor rejects order (triggers refund)
Actor: Vendor

Steps:

Vendor receives paid order

Vendor clicks "Reject"

Selects reason: "OUT_OF_STOCK"

Confirms

Expected:

Order status → REFUNDED

Ledger entries reversed (see Artifact 7 Flow 3)

Customer receives WhatsApp: "Your order was cancelled by the vendor. Refund initiated."

Refund processes via Monnify within 24 hours

Vendor's rejection_count increments (used for quality monitoring)

Verification:

```sql
-- Order status
SELECT status FROM orders WHERE id = 'ord_...';
-- Expected: REFUNDED

-- Ledger reversal
SELECT SUM(CASE direction WHEN 'CREDIT' THEN amount ELSE -amount END)
FROM ledger_entries WHERE order_id = 'ord_...';
-- Expected: 0 (fully balanced)
```
Actual: _______
Status: _______


---

## 31.6 Rider Test Suite (28 test cases)
Authentication and profile
| ID | Title | Priority |
| :--- | :--- | :--- |
| R-001 | Rider logs in with OTP and device binding | P1 |
| R-002 | Rider session is bound to their device | P1 |
| R-003 | Rider cannot log in from a new device without re-auth | P1 |
| R-004 | Rider can update profile | P3 |
| R-005 | Rider sees approval status | P1 |
Presence
| ID | Title | Priority |
| :--- | :--- | :--- |
| R-006 | Rider goes online | P1 |
| R-007 | Rider goes offline | P1 |
| R-008 | Rider heartbeat updates location | P1 |
| R-009 | Rider becomes stale after 90s without heartbeat | P1 |
| R-010 | Rider's location appears in Redis geo set | P1 |
Offers
| ID | Title | Priority |
| :--- | :--- | :--- |
| R-011 | Rider receives offer via WebSocket | P1 |
| R-012 | Rider sees offer details (distance, earnings) | P1 |
| R-013 | Rider accepts offer | P1 |
| R-014 | Rider rejects offer | P1 |
| R-015 | Only one rider can accept an offer (race) | P1 |
| R-016 | Offer expires after 45s | P1 |
| R-017 | Rider cannot accept expired offer | P1 |
| R-018 | Rider cannot accept offer for another rider | P1 |
Delivery
| ID | Title | Priority |
| :--- | :--- | :--- |
| R-019 | Rider navigates to vendor | P2 |
| R-020 | Rider marks picked up | P1 |
| R-021 | Rider marks delivered | P1 |
| R-022 | Rider sees earnings after delivery | P1 |
| R-023 | Rider cannot mark delivered without pickup | P1 |
| R-024 | Rider with invalid OTP cannot mark delivered | P1 |
Wallet
| ID | Title | Priority |
| :--- | :--- | :--- |
| R-025 | Rider sees wallet balance | P1 |
| R-026 | Rider requests cash-out | P2 |
| R-027 | Cash-out respects wallet balance | P1 |
| R-028 | Rider sees ledger entries | P2 |
Fleet Profile & Safety Incidents
| ID | Title | Priority |
| :--- | :--- | :--- |
| R-029 | Rider reports delivery delay or road incident (bike breakdown, rain) | P2 |
| R-030 | Rider updates preferred operating cluster zone (Tanke, GRA, Campus) | P2 |

### Detailed rider test cases (samples)

#### R-011 — Rider receives offer via WebSocket
Actor: Rider

Prerequisites:

Rider logged in and online

Test vendor marks an order ready

Steps:

Rider app in foreground

As vendor, mark order ready

Observe rider app

Expected:

WebSocket event dispatch.offer received within 3 seconds

Notification sound plays

Offer modal shown with:

Pickup: vendor address

Dropoff: customer address

Distance to pickup and dropoff

Earnings breakdown

45-second countdown

Vibration triggers

Actual: _______
Status: _______


#### R-015 — Only one rider can accept an offer (race)
Actor: Rider (two devices)

Prerequisites:

Two riders online in same cluster

One order marked ready

Steps:

Both riders receive the offer

Both tap "Accept" within 500ms of each other

Expected:

First request wins

Second request receives 409 OFFER_ALREADY_TAKEN

Second rider sees: "This delivery has been taken by another rider"

Only first rider is assigned

Other live offers (for this delivery) are cancelled

Verification:

```sql
SELECT rider_id, status FROM deliveries WHERE id = 'dlv_...';
-- Expected: one rider_id, status ACCEPTED

SELECT response FROM rider_dispatch_attempts WHERE delivery_id = 'dlv_...';
-- Expected: one ACCEPTED, others TIMED_OUT or LOST_RACE
```
Note: This is the most important test in the entire QA suite. Race conditions in dispatch are the highest-risk failure mode.

Actual: _______
Status: _______


#### R-022 — Rider sees earnings after delivery
Actor: Rider

Steps:

Rider completes a delivery

Rider navigates to Wallet

Expected:

Wallet shows updated balance (+₦680 example)

Ledger entry visible: "Delivery earnings ORD-2K3F9A"

Breakdown shows: base + distance + peak multiplier if applicable

Balance is available for cash-out

Verification:

```sql
SELECT amount, direction, description FROM ledger_entries
WHERE wallet_id = (SELECT id FROM wallets WHERE owner_id = 'rdr_...')
ORDER BY created_at DESC LIMIT 1;
```
Actual: _______
Status: _______


#### R-024 — Rider with invalid OTP cannot mark delivered
Actor: Rider

Steps:

Rider arrives at customer with food

Customer provides wrong OTP: 0000

Rider enters wrong OTP

Expected:

Order does NOT advance to DELIVERED

Error: "Invalid code. Ask the customer for the correct 4-digit code."

Rider can retry

If 3 wrong attempts, escalate to ops

Actual: _______
Status: _______


---

## 31.7 Admin & Ops Test Suite (22 test cases)
Admin auth
| ID | Title | Priority |
| :--- | :--- | :--- |
| A-001 | Admin logs in with OTP + TOTP | P1 |
| A-002 | Admin cannot log in without TOTP | P1 |
| A-003 | Non-admin user cannot access admin endpoints | P1 |
| A-004 | Admin actions are audit-logged | P1 |
Order management
| ID | Title | Priority |
| :--- | :--- | :--- |
| A-005 | Admin sees all orders with filters | P1 |
| A-006 | Admin can search orders by order number | P1 |
| A-007 | Admin can force-cancel order | P2 |
| A-008 | Admin can force-refund order | P1 |
| A-009 | Admin can see order status history | P1 |
Vendor management
| ID | Title | Priority |
| :--- | :--- | :--- |
| A-010 | Admin sees all vendors | P1 |
| A-011 | Admin can view vendor details | P1 |
| A-012 | Admin can suspend vendor | P2 |
| A-013 | Admin can adjust commission rate | P2 |
| A-014 | Admin can approve a new vendor | P1 |
Rider management
| ID | Title | Priority |
| :--- | :--- | :--- |
| A-015 | Admin sees all riders | P1 |
| A-016 | Admin can approve pending rider | P1 |
| A-017 | Admin can suspend rider | P2 |
| A-018 | Admin can view rider delivery history | P1 |
Financial
| ID | Title | Priority |
| :--- | :--- | :--- |
| A-019 | Admin sees ledger reconciliation report | P1 |
| A-020 | Admin can view wallet balances | P1 |
| A-021 | Admin can trigger payout batch | P1 |
| A-022 | Admin can see payouts status | P1 |
Operational Interventions & Multi-Gateway Profiles
| ID | Title | Priority |
| :--- | :--- | :--- |
| A-023 | Admin overrides live order status with mandatory audit justification reason | P1 |
| A-024 | Admin verifies multi-gateway provider profile switching (Monnify vs Korapay vs Mock) | P2 |

### Detailed admin test case (sample)

#### A-019 — Admin sees ledger reconciliation report
Actor: Admin

Steps:

Admin logs in

Navigate to Admin → Ledger → Reconciliation

View latest reconciliation report

Expected:

Report shows:

Wallets checked: count > 0

Discrepancies: 0 (in healthy state)

Global net: 0

Stuck payouts: 0

Last run timestamp is within 24 hours

If any discrepancy exists, it's clearly listed with wallet ID and amount

Verification (manual):

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.staging.dispatch.ng/v1/admin/ledger/reconciliation
```
Expected response:

```json
{
  "data": {
    "checked_at": "2026-10-12T02:00:00Z",
    "wallets_checked": 245,
    "wallet_drifts": [],
    "unbalanced_groups": [],
    "global_net": "0",
    "stuck_payouts": [],
    "is_healthy": true
  }
}
```
Actual: _______
Status: _______


---

## 31.8 End-to-End Scenarios (8 full lifecycle tests)
These are the scenarios that involve multiple actors simultaneously. They're the ones that catch integration bugs.


### E-001 — Complete customer order lifecycle (happy path)
```text
ACTORS: Customer, Vendor, Rider
DURATION: ~45 minutes (including simulated travel)
PRIORITY: P1

STEPS:
1. Customer sends WhatsApp message ordering food
2. Bot parses, creates order (PENDING)
3. Customer receives virtual account
4. Customer pays via Monnify sandbox
5. Webhook fires, order becomes PAID
6. Ledger entries posted (4-line entry group)
7. Vendor receives notification, accepts order
8. Order becomes PREPARING
9. Vendor marks ready-for-pickup
10. Order becomes AWAITING_RIDER
11. Dispatch engine broadcasts offer to 3 nearby riders
12. Rider 1 accepts, order becomes RIDER_ASSIGNED
13. Rider navigates to vendor (simulated)
14. Rider marks picked up, order becomes PICKED_UP
15. Rider navigates to customer (simulated)
16. Customer provides OTP
17. Rider marks delivered, order becomes COMPLETED
18. Ledger entries posted for rider earnings (3-line entry group)
19. Rider wallet balance increases
20. Customer receives rating prompt
21. Customer rates 5 stars
22. Vendor sees updated rating

EXPECTED END STATE:
- Order status: COMPLETED
- Ledger: 7 entries, 2 groups, zero-sum
- Vendor wallet: credited
- Rider wallet: credited
- Platform wallet: credited
- Customer receives receipt via WhatsApp
- Ratings recorded
- BigQuery events logged for all steps
```
Diagram:

```text
Customer ──[WhatsApp msg]──> Meta ──> API ──> Postgres (PENDING)
                                              │
                                              ▼
                                    Gemini parses
                                              │
                                              ▼
                                    Monnify (virtual account)
                                              │
                          Customer pays  ────>│
                                              │
                                              ▼
                                    Postgres (PAID)
                                              │
                                              ▼
                                    Ledger (4 entries)
                                              │
                                              ▼
                          Vendor receives  <──│
                                              │
                          Vendor accepts ────>│
                                              │
                                              ▼
                                    Postgres (PREPARING)
                                              │
                          Vendor ready  ─────>│
                                              │
                                              ▼
                                    Dispatch broadcast
                                              │
                                              ▼
                          Riders receive  <───│
                                              │
                          Rider accepts  ────>│
                                              │
                                              ▼
                                    Postgres (RIDER_ASSIGNED)
                                              │
                          Rider delivers ────>│
                                              │
                                              ▼
                                    Postgres (COMPLETED)
                                              │
                                              ▼
                                    Ledger (3 entries)
                                              │
                                              ▼
                          Rider paid  <───────│
```

### E-002 — Customer cancels before vendor accepts
```text
ACTORS: Customer, Vendor
PRIORITY: P1

STEPS:
1. Customer orders
2. Customer pays
3. Order becomes PAID
4. Customer sends WhatsApp: "Cancel my order"
5. Bot parses cancel intent
6. Order is cancelled (status: REFUNDED)
7. Ledger reversal posted
8. Monnify refund initiated
9. Customer receives WhatsApp confirmation
10. Vendor never saw the order

EXPECTED END STATE:
- Order status: REFUNDED
- Ledger: original 4 entries + 4 reversal entries = zero-sum
- Refund processed within 24 hours
- No vendor involvement
```

### E-003 — Vendor rejects order (out of stock)
```text
ACTORS: Customer, Vendor, Admin
PRIORITY: P1

STEPS:
1. Customer orders and pays
2. Vendor sees order
3. Vendor rejects with reason "OUT_OF_STOCK"
4. Refund initiated
5. Customer notified via WhatsApp
6. Admin can see rejection in audit log

EXPECTED END STATE:
- Order status: REFUNDED
- Vendor rejection_count +1
- Refund processed
- Customer receives refund within 24h
- No rider involvement
```

### E-004 — Rider rejects all offers (escalation)
```text
ACTORS: Customer, Vendor, 5 Riders, Ops
PRIORITY: P1

STEPS:
1. Order paid, vendor accepts, ready for pickup
2. Dispatch broadcasts to 3 riders (Round 1)
3. All 3 reject
4. Escalate to Round 2 (5 riders)
5. All 5 reject
6. Escalate to Round 3 (8 riders, adjacent clusters)
7. All 8 reject
8. Escalate to Round 4 (12 riders, all clusters)
9. All 12 reject
10. Escalate to Round 5 (manual queue)
11. Ops manually assigns a rider

EXPECTED END STATE:
- Order eventually assigned via manual dispatch
- Total time: < 10 minutes
- Admin dashboard shows "manual dispatch required"
- Rider dispatch attempts table has 28 rows
- No orders dropped
```

### E-005 — Payment webhook duplicate
```text
ACTORS: Customer, Monnify
PRIORITY: P1

STEPS:
1. Customer pays
2. Monnify sends webhook #1
3. Order becomes PAID, ledger posted
4. Monnify sends webhook #2 (duplicate, same event_id)
5. API detects duplicate, returns 200
6. No additional ledger entries

EXPECTED END STATE:
- Only one order status change
- Only 4 ledger entries (not 8)
- Webhook_events table has 1 row for this event

```
VERIFICATION:
SELECT COUNT(*) FROM ledger_entries WHERE order_id = 'ord_...';
-- Expected: 4

SELECT COUNT(*) FROM webhook_events WHERE event_id = 'MNFY-...';
-- Expected: 1

### E-006 — Customer uses voice note in Yoruba
```text
ACTORS: Customer (Yoruba speaker)
PRIORITY: P2

STEPS:
1. Customer sends Yoruba voice note: "Mo fẹ́ jollof méjì láti Chicken Republic sí Tanke"
2. Bot transcribes via Gemini native audio
3. Bot parses intent
4. Order created

EXPECTED END STATE:
- Detected language: "yo"
- Vendor: Chicken Republic
- Items: 2x jollof
- Delivery: Tanke
- Order created successfully
```

### E-007 — Rider accident during delivery
```text
ACTORS: Rider, Ops, Customer, Vendor
PRIORITY: P1

STEPS:
1. Rider is mid-delivery with customer's food
2. Rider gets into an accident
3. Rider calls ops hotline
4. Ops dispatches alternate rider for the food
5. Original rider is taken off-app for 3 days
6. Insurance claim filed
7. Customer receives notification of delay
8. Order is completed by alternate rider

EXPECTED END STATE:
- Original rider's current delivery reassigned
- Rider marked injured in system
- Insurance claim created
- Customer receives compensation (₦200 credit)
- Order completed
```

### E-008 — Gemini service down
```text
ACTORS: Customer, Vendor, Ops
PRIORITY: P1

STEPS:
1. Simulate Gemini API failure (disable quota or mock)
2. Customer sends WhatsApp order
3. Bot detects Gemini failure
4. Bot replies: "Having trouble understanding. Please try again or use the app: [link]"
5. Customer uses PWA instead
6. Order completes

EXPECTED END STATE:
- Graceful degradation (no 500 error to customer)
- Logged in Sentry
- Alert fires to ops
- Customer can still order via alternative channel
```

---

## 31.9 Edge Cases and Negative Tests (40+ scenarios)
Grouped by category. Each has expected behavior.


### Authentication edges
| ID | Scenario | Expected |
| :--- | :--- | :--- |
| N-001 | OTP request with invalid phone format | 400 VALIDATION_ERROR |
| N-002 | OTP verify with expired code | 401 OTP_EXPIRED |
| N-003 | OTP verify with consumed code | 401 OTP_CONSUMED |
| N-004 | OTP verify with 5+ wrong attempts | 429 OTP_RATE_LIMIT_EXCEEDED |
| N-005 | Refresh with revoked session | 401 SESSION_REVOKED |
| N-006 | Refresh from a different device | 401 SESSION_REVOKED:DEVICE_MISMATCH |
| N-007 | Access token with wrong issuer | 401 |
| N-008 | Access token with expired signature | 401 |
| N-009 | Access token with tampered payload | 401 |

### Order edges
| ID | Scenario | Expected |
| :--- | :--- | :--- |
| N-010 | Order with 0 items | 400 VALIDATION_ERROR |
| N-011 | Order with negative quantity | 400 VALIDATION_ERROR |
| N-012 | Order from closed vendor | 422 VENDOR_CLOSED |
| N-013 | Order below vendor minimum | 422 MIN_ORDER_NOT_MET |
| N-014 | Order with unavailable item | 422 PRODUCT_UNAVAILABLE |
| N-015 | Order outside delivery radius | 422 OUT_OF_DELIVERY_RANGE |
| N-016 | Duplicate order within 30s | First succeeds, second flagged |
| N-017 | Order with SQL injection in notes | Sanitized, no error |

### Dispatch edges
| ID | Scenario | Expected |
| :--- | :--- | :--- |
| N-018 | Zero riders online | Escalate to manual queue |
| N-019 | All riders reject | Escalate to next round |
| N-020 | Rider goes offline mid-delivery | Delivery stuck, escalate |
| N-021 | Redis down | Dispatch falls back to Postgres |
| N-022 | Two riders accept simultaneously | One wins (Redis NX) |
| N-023 | Rider accepts expired offer | 409 OFFER_EXPIRED |
| N-024 | Delivery cancelled mid-dispatch | All live offers cancelled |

### Payment edges
| ID | Scenario | Expected |
| :--- | :--- | :--- |
| N-025 | Monnify webhook with invalid HMAC | 401 |
| N-026 | Monnify webhook duplicate | Idempotent, no double credit |
| N-027 | Payment arrives after order auto-cancelled | Order reinstated OR refund |
| N-028 | Refund amount > original | Rejected |
| N-029 | Payout to closed bank account | Payout failed, wallet restored |
| N-030 | Payout > wallet balance | 422 INSUFFICIENT_BALANCE |
| N-031 | Concurrent payouts from same wallet | One succeeds, one fails |

### AI edges
| ID | Scenario | Expected |
| :--- | :--- | :--- |
| N-032 | Menu image is a person (not menu) | Empty items, no error |
| N-033 | WhatsApp message in Arabic | Detected as "unknown", clarification asked |
| N-034 | Prompt injection in order notes | Refused, escalates to human |
| N-035 | Gemini quota exceeded | Fallback to manual entry |
| N-036 | Gemma service down | Fallback to Gemini classification |
| N-037 | Voice note too long (>60s) | Rejected with friendly message |

### Admin edges
| ID | Scenario | Expected |
| :--- | :--- | :--- |
| N-038 | Admin without MFA | 401 |
| N-039 | Support user tries admin action | 403 |
| N-040 | Admin force-cancel pending refund | Audited, refund preserved |

---

## 31.10 Regression Suite
Runs on every release. ~45 minutes total. All P1 tests, subset of P2.


### Automated (runs in CI)
All unit tests (Artifact 7, 8, 12)

Integration tests for ledger, dispatch, auth

Smoke tests (Artifact 25)

Security tests (Artifact 27)

CI blocks merge if any fail.


### Manual (QA engineer, per release)
Time budget: 45 minutes.

Must pass (P1, blocking):

C-001, C-002, C-018, C-025, C-026, C-027, C-029

V-001, V-006, V-009, V-015, V-017, V-018

R-011, R-013, R-015, R-020, R-021, R-022

A-001, A-005, A-019, A-021

E-001, E-002, E-003, E-005

Should pass (P2, non-blocking but flagged):

C-004, C-015, C-021

V-007, V-016, V-022

R-006, R-014, R-026

A-006, A-019

If any P1 fails: Block release. Fix. Re-test.

If 3+ P2 fail: Investigate systemic issue. Block release.

If 1–2 P2 fail: Document. Release if justified.


---

## 31.11 Bug Reporting
Every bug gets a report in #bugs Slack channel AND a ticket in the tracker (Linear, Jira, or GitHub Issues).


### Bug report template
```text
BUG REPORT
==========

ID:           BUG-XXXX
TITLE:        Short description (max 80 chars)
REPORTER:     QA engineer name
DATE:         2026-10-12
SEVERITY:     P1 / P2 / P3 / P4
PRIORITY:     Critical / High / Medium / Low
COMPONENT:    API / Vendor Portal / Customer PWA / Rider App / Admin
ENVIRONMENT:  staging / production
BUILD:        v1.4.2 (commit SHA)

TEST CASE:    C-018 (if applicable)
REPRODUCIBLE: Always / Sometimes / Once

STEPS TO REPRODUCE:
1. ...
2. ...
3. ...

EXPECTED BEHAVIOR:
...

ACTUAL BEHAVIOR:
...

EVIDENCE:
- Screenshot: [link]
- Video: [link]
- Logs: [link or paste]

IMPACT:
- Who is affected? (customers, vendors, riders, all)
- How often? (every order, 1 in 10, rare)
- Business impact? (revenue, trust, compliance)

ROOT CAUSE HYPOTHESIS:
(if known)

SUGGESTED FIX:
(if known)

ASSIGNED TO:
[engineer name]

FIXED IN:
[commit SHA or version]
```

### Severity classification
| Severity | Definition | Examples | Response time | Fix time |
| :--- | :--- | :--- | :--- | :--- |
| P1 | Complete feature broken, money at risk, security issue, or data loss | Ledger imbalance; login broken; double-charging; order stuck forever | Immediate | Same day |
| P2 | Major feature impaired, workaround exists | Rider can't see offer details; vendor can't update menu; refund slow | Same day | 1–3 days |
| P3 | Minor issue, cosmetic, or edge case | Typo in email; button alignment; wrong pluralization | Next business day | 1 week |
| P4 | Nice-to-have; low impact | "Would be nice if..." | Backlog | Backlog |

### Bug lifecycle
```text
New → Triaged → Assigned → In Progress → Fixed → In QA → Verified → Closed
                                                 │
                                                 └──▶ Reopened (if still broken)
```
QA engineer is the only person who can move a bug from "In QA" to "Verified" or "Reopened."


---

## 31.12 Release Sign-off
The final step before deploying to production.


### Pre-release checklist
□ All P1 tests pass
□ 90%+ of P2 tests pass
□ No open P1 bugs
□ No open P2 bugs older than 3 days
□ Regression suite ran on latest build
□ Performance benchmarks within 10% of baseline
□ Security scan passed (if new endpoints)
□ Load test passed (if new hot path)
□ Smoke test passes on staging
□ Rollback plan verified
□ Release notes drafted

### Sign-off document
```text
RELEASE SIGN-OFF
================

VERSION:      v1.4.2
DATE:         2026-10-12
BUILD:        commit abc123def456

SUMMARY OF CHANGES:
- Added WhatsApp voice note support for Yoruba/Hausa
- Improved dispatch scoring algorithm
- Fixed ledger reconciliation edge case

TESTING PERFORMED:
- Regression suite: PASS (45/45)
- End-to-end scenarios: PASS (8/8)
- Edge cases tested: 42/42
- Manual exploratory testing: 4 hours

BUGS FOUND:
- P1: 0
- P2: 1 (BUG-1234, fixed and verified)
- P3: 3 (documented, deferred)

RISKS ACCEPTED:
- [If any]

ROLLBACK PLAN:
- Previous version: v1.4.1
- Command: gcloud run services update-traffic prod-dispatch-api --to-revisions=prod-dispatch-api-00042-xyz=100
- Data migration: none
- Estimated rollback time: 30 seconds

SIGN-OFF:
QA Engineer:  __________________  Date: ____
CTO:          __________________  Date: ____
CEO:          __________________  Date: ____
```
No production deploy without all three signatures.


---

## 31.13 Test Automation
What's automated, what's manual.


### Automated (CI)
| Test type | Tool | Coverage | Runtime |
| :--- | :--- | :--- | :--- |
| Unit tests | Jest | 80%+ of business logic | 2 min |
| Integration tests | Jest + testcontainers | Ledger, dispatch, auth | 8 min |
| Smoke tests | Bash + curl | Post-deployment health | 30 sec |
| Security tests | pnpm audit, trivy | Dependency CVEs | 1 min |
| Load tests | k6 | Scheduled, not per PR | 30 min |
| Eval harness | Custom | AI prompt regression | 5 min |

### Manual (QA engineer)
| Test type | Frequency | Owner |
| :--- | :--- | :--- |
| Regression suite | Every release | QA engineer |
| End-to-end scenarios | Every release | QA engineer |
| Exploratory testing | 2 hours per release | QA engineer |
| Edge case verification | Weekly | QA engineer |
| Cross-device testing | Monthly | QA engineer |
| Accessibility audit | Quarterly | QA engineer |
| Penetration test | Quarterly | External firm |

### Automation roadmap
Q4 2026:

Automate C-001 through C-009 (auth flow) with Playwright

Automate V-001 through V-009 (vendor auth + menu) with Playwright

Automate E-001 (happy path) with Playwright + API calls

Q1 2027:

Automate rider app flow (R-011 to R-022) with Flutter integration tests

Automate WhatsApp flow (C-018 to C-025) with WhatsApp Cloud API test utilities

Q2 2027:

Automate admin actions (A-001 to A-022)

Automate 80% of negative tests (N-xxx)

Target by end of Q2 2027: 60% of regression suite automated, 3-minute feedback loop.


---

## 31.14 What This QA Documentation Gets Right
It's actor-based. Tests are organized by who's using the system, not by endpoint or module.

It has full test data. Named customers, realistic vendors, actual scenarios — not "test user 1."

It covers WhatsApp. The primary channel isn't an afterthought; it has its own suite.

It covers race conditions. The dispatch accept race is tested explicitly.

It covers edge cases honestly. 40+ negative tests, including prompt injection, SQL injection, and duplicate webhooks.

It has end-to-end scenarios with diagrams. Multi-actor flows with visual representations.

It has a bug template and severity classification. No ambiguity about how to report.

It has sign-off discipline. No release without a signed document.

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
| 31 | QA test documentation | ✅ |