# Multi-Actor Local Testing Guide & Verification Suite

This document outlines the local end-to-end verification framework for the **Dispatch Rider Aggregator & Food Vendor Storefront** platform. It provides an automated, executable test suite that validates the full multi-actor transactional lifecycle across the four core participants before promoting builds to Google Cloud staging or production environments.

---

## 1. System Actors in the Lifecycle

```
┌─────────────────┐       1. Create Order & Pay       ┌──────────────────────┐
│    CUSTOMER     │ ────────────────────────────────> │   PAYMENT GATEWAY    │
│ (Zainab Balogun)│                                   │ (Monnify / Korapay)  │
└─────────────────┘                                   └──────────┬───────────┘
         │                                                       │ 2. Webhook (HMAC)
         │                                                       ▼
         │                                            ┌──────────────────────┐
         │                                            │   CUSTOMER ESCROW    │
         │                                            │ (Double-Entry Leg 1) │
         │                                            └──────────┬───────────┘
         │                                                       │
         │                3. Accept & Prepare Order              │
         ▼                                                       ▼
┌─────────────────┐ <──────────────────────────────── ┌──────────────────────┐
│  FOOD VENDOR    │                                   │   DISPATCH ENGINE    │
│  (Chef Adebayo) │ ────────────────────────────────> │ (Geospatial Matching)│
└─────────────────┘       4. Ready for Pickup         └──────────┬───────────┘
                                                                 │ 5. Race for Lock
                                                                 ▼
┌─────────────────┐       6. Verified Pickup & Dropoff┌──────────────────────┐
│  DISPATCH RIDER │ <──────────────────────────────── │     RIDER FLEET      │
│  (Musa Ibrahim) │ ────────────────────────────────> │  (Musa vs Competitor)│
└─────────────────┘       7. Delivered with OTP       └──────────┬───────────┘
                                                                 │
                                                                 │ 8. Atomic Settlement
                                                                 ▼
                                                      ┌──────────────────────┐
                                                      │  DOUBLE-ENTRY LEDGER │
                                                      │ (4-Way Zero-Sum Run) │
                                                      └──────────────────────┘
```

The four actors simulated in sequence:

1. **Customer (Zainab Balogun)**:
   - Selects items from a vendor storefront menu.
   - Places an order with dynamic pricing (subtotal, delivery fee, platform fee).
   - Receives dynamic virtual account and triggers simulated bank transfer payment.
   - Funds are locked in `CUSTOMER_ESCROW` via double-entry ledger.

2. **Vendor Owner (Chef Adebayo / Tanke Express Kitchen)**:
   - Receives order alert in vendor dashboard.
   - Transitions order status: `PAID` &rarr; `CONFIRMED` &rarr; `PREPARING`.
   - Packages order and marks `AWAITING_RIDER` (generates pickup verification secret).

3. **Dispatch Rider (Musa Ibrahim & Fleet)**:
   - Redis geospatial radius matching triggers delivery offer broadcast.
   - **Concurrency race test**: Multiple riders attempt to claim the same offer simultaneously; atomic Redis `SET NX EX` distributed lock ensures exactly one winner, rejecting competitors with HTTP 409 Conflict.
   - Rider arrives at vendor, inputs pickup verification PIN, marks `PICKED_UP`.
   - Rider arrives at customer, verifies delivery OTP, marks `DELIVERED`.

4. **Platform Admin & Financial Ledger Settlement**:
   - Delivery triggers an atomic 4-leg ledger posting:
     - **Debit Customer Escrow**: ₦6,600 (Releasing held funds).
     - **Credit Vendor Payable**: ₦4,845 (85% of food subtotal ₦5,700).
     - **Credit Rider Payable**: ₦640 (80% of delivery fee ₦800).
     - **Credit Platform Revenue**: ₦1,115 (15% vendor commission ₦855 + 20% rider cut ₦160 + platform fee ₦100).
   - Mathematically enforces: $\sum \text{Debits} \equiv \sum \text{Credits}$.
   - Idempotency key deduplication prevents double payouts or balance drift.

---

## 2. Test Execution Commands

### Run Multi-Actor Lifecycle Test Only
```bash
npm run test:e2e:lifecycle
```

### Run All E2E Suites (Auth, Dispatch Locks, Ledger, and Multi-Actor Lifecycle)
```bash
npm run test:e2e
```

### Run Unified Bash Runner
```bash
./scripts/test-actors-flow.sh
```

---

## 3. Automated Test Coverage Table

| Test Suite | File | Tests | Coverage |
| :--- | :--- | :---: | :--- |
| **Multi-Actor Lifecycle** | `src/modules/orders/multi-actor-lifecycle.e2e-spec.ts` | 7 | Customer order & checkout, Monnify/Korapay HMAC webhooks, Escrow credit, Vendor kitchen prep flow, Rider atomic lock racing, Dropoff OTP handoff, 4-leg ledger settlement, anti-counterfeiting imbalance rejection. |
| **Double-Entry Ledger** | `src/modules/ledger/ledger.e2e-spec.ts` | 8 | Zero-sum invariant, 4-leg splits, locked wallet handling, idempotency deduplication, 10 concurrent multi-leg transfers. |
| **Geospatial Dispatch Locks**| `src/modules/dispatch/dispatch-lock.e2e-spec.ts` | 6 | Redis `SET NX EX` offer claiming, 10-rider surge rush single winner, TTL auto-expiry, offer cancellation. |
| **Authentication & Webhooks** | `src/modules/auth/auth.e2e-spec.ts` | 4 | SHA-512 Monnify HMAC, SHA-256 Korapay HMAC, Meta WhatsApp webhook signatures, Nigerian phone normalization. |
| **Total** | | **25** | **100% Passing in ~2.1 seconds** |
