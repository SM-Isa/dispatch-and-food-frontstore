# Dispatch Platform: Comprehensive API Reference & Endpoint Specification

This document provides the definitive, exhaustive specification for all REST API endpoints and webhooks implemented across the **Dispatch Rider Aggregator & Food Vendor Storefront** platform.

---

## 1. Global API Conventions

### Base URLs
- **Production API**: `https://api.dispatch.ng/v1`
- **Staging API**: `https://api.staging.dispatch.ng/v1`
- **Local Development**: `http://localhost:4000`

### Authentication & Authorization Headers
Except for explicitly marked public endpoints, all requests require a JSON Web Token (JWT) in the `Authorization` header:
```http
Authorization: Bearer <jwt-access-token>
X-Device-Id: <uuid-v4>
```
Roles are strictly enforced via `@Roles(...)` decorators and `@UseGuards(JwtAuthGuard, RolesGuard)`:
- `CUSTOMER`: End-users ordering food via PWA/WhatsApp.
- `VENDOR`: Restaurant/store owners managing menus and orders.
- `RIDER`: Verified delivery riders receiving dispatch offers.
- `ADMIN`: Dispatch operations managers and founders (requires MFA).
- `PUBLIC`: Unauthenticated endpoints (menu browsing, public tracking).
- `WEBHOOK`: Secured by cryptographic HMAC signatures (Monnify, Korapay, Meta).

### Standard Error Response Shape
All error responses adhere to the standard NestJS exception schema:
```json
{
  "statusCode": 400,
  "message": "Detailed error message or validation errors array",
  "error": "Bad Request",
  "timestamp": "2026-10-12T14:30:00.000Z",
  "path": "/v1/orders"
}
```

---

## 2. Table of Contents & Module Index

| Module | Base Path | Controller File | Endpoints Count |
| :--- | :--- | :--- | :---: |
| [1. Authentication & Sessions](#1-authentication--sessions-auth) | `/auth` | `auth.controller.ts` | 5 |
| [2. Admin Authentication & MFA](#2-admin-authentication--mfa-adminauth) | `/admin/auth` | `admin-auth.controller.ts` | 4 |
| [3. User Profiles](#3-user-profiles-users) | `/users` | `users.controller.ts` | 2 |
| [4. Vendors & Storefronts](#4-vendors--storefronts-vendors) | `/vendors` | `vendors.controller.ts` | 5 |
| [5. Products & Menus](#5-products--menus-products) | `/products` | `products.controller.ts` | 5 |
| [6. Orders & Cart Lifecycle](#6-orders--cart-lifecycle-orders) | `/orders` | `orders.controller.ts` | 6 |
| [7. Deliveries & Fulfillment](#7-deliveries--fulfillment-deliveries) | `/deliveries` | `deliveries.controller.ts` | 3 |
| [8. Dispatch Engine & Live Offers](#8-dispatch-engine--live-offers-dispatch) | `/dispatch` | `dispatch.controller.ts` | 5 |
| [9. Riders & Geolocation Heartbeats](#9-riders--geolocation-heartbeats-riders) | `/riders` | `riders.controller.ts` | 5 |
| [10. Double-Entry Financial Ledger](#10-double-entry-financial-ledger-ledger) | `/ledger` | `ledger.controller.ts` | 4 |
| [11. Payments & Webhooks](#11-payments--webhooks-payments) | `/payments` | `payments.controller.ts` | 3 |
| [12. Payouts & Cash-Out](#12-payouts--cash-out-payouts) | `/payouts` | `payouts.controller.ts` | 2 |
| [13. Ratings & Reviews](#13-ratings--reviews-reviews) | `/reviews` | `reviews.controller.ts` | 2 |
| [14. Notifications & Outbox](#14-notifications--outbox-notifications) | `/notifications` | `notifications.controller.ts` | 1 |
| [15. WhatsApp Conversational Commerce](#15-whatsapp-conversational-commerce-webhookswhatsapp) | `/webhooks/whatsapp` | `whatsapp.webhook.controller.ts` | 4 |
| [16. AI Menu Extraction](#16-ai-menu-extraction-aimenu) | `/ai/menu` | `menu-extraction.controller.ts` | 4 |
| [17. AI Dispatch Demand Forecasting](#17-ai-dispatch-demand-forecasting-aidispatch) | `/ai/dispatch` | `forecast.controller.ts` | 2 |
| [18. AI Fraud Anomaly Scoring](#18-ai-fraud-anomaly-scoring-aifraud--adminaifraud) | `/ai/fraud` | `fraud.controller.ts` | 3 |
| [19. AI Customer Support Triage](#19-ai-customer-support-triage-support--adminaisupport) | `/support` | `support.controller.ts` | 4 |
| **Total** | | | **69 Endpoints** |

---

## 1. Authentication & Sessions (`/auth`)

### `POST /auth/otp/request`
- **Purpose**: Generates and dispatches a 6-digit cryptographic SMS OTP to a Nigerian phone number via Termii.
- **Access**: `PUBLIC`
- **Rate Limit**: 3 attempts per 10 minutes per IP/Phone.
- **Request Body**:
  ```json
  {
    "phone": "+2348012345678",
    "role": "CUSTOMER" // "CUSTOMER" | "VENDOR" | "RIDER"
  }
  ```
- **Responses**:
  - `200 OK`: `{"status": "SUCCESS", "message": "OTP dispatched successfully", "expiresInSeconds": 300}`
  - `400 Bad Request`: Invalid E.164 Nigerian phone format.
  - `429 Too Many Requests`: Rate limit exceeded.

### `POST /auth/otp/verify`
- **Purpose**: Validates the 6-digit OTP code, registers the user if new, binds the hardware session to `deviceId`, and issues ES256 JWT access and refresh tokens.
- **Access**: `PUBLIC`
- **Request Body**:
  ```json
  {
    "phone": "+2348012345678",
    "code": "849201",
    "deviceId": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "accessToken": "eyJhbGciOiJFUzI1NiIsInR5c...",
      "refreshToken": "d8f92a10b...",
      "expiresIn": 900,
      "user": {
        "id": "usr_9410294",
        "phone": "+2348012345678",
        "role": "CUSTOMER"
      }
    }
    ```
  - `401 Unauthorized`: Invalid or expired OTP code.

### `POST /auth/refresh`
- **Purpose**: Rotates the short-lived access token using a valid refresh token. Enforces device binding security.
- **Access**: `PUBLIC`
- **Request Body**:
  ```json
  {
    "refreshToken": "d8f92a10b...",
    "deviceId": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```
- **Responses**:
  - `200 OK`: New `accessToken` and rotated `refreshToken`.
  - `401 Unauthorized`: Revoked token or hardware device fingerprint mismatch.

### `POST /auth/logout`
- **Purpose**: Invalidates the active refresh token and terminates the current device session in Redis and Postgres.
- **Access**: `Bearer JWT`
- **Responses**:
  - `200 OK`: `{"success": true}`

### `POST /auth/logout-all`
- **Purpose**: Security kill-switch revoking all active sessions across all devices for the authenticated user.
- **Access**: `Bearer JWT`
- **Responses**:
  - `200 OK`: `{"revokedSessionsCount": 3}`

---

## 2. Admin Authentication & MFA (`/admin/auth`)

### `POST /admin/auth/login/request-otp`
- **Purpose**: Admin login step 1. Validates that the phone belongs to an authorized administrator and dispatches an OTP.
- **Access**: `PUBLIC`
- **Request Body**: `{"phone": "+2348000000100"}`
- **Responses**: `200 OK`

### `POST /admin/auth/login/verify`
- **Purpose**: Admin login step 2. Verifies OTP and returns a temporary ticket requiring RFC 6238 TOTP authenticator validation.
- **Access**: `PUBLIC`
- **Request Body**: `{"phone": "+2348000000100", "code": "192842"}`
- **Responses**:
  - `200 OK`: `{"mfaRequired": true, "tempToken": "tmp_admin_92a..."}`

### `POST /admin/auth/mfa/enroll`
- **Purpose**: Generates a new TOTP secret key and QR code data URL for Google Authenticator / 1Password.
- **Access**: `Bearer JWT (ADMIN)`
- **Responses**:
  - `200 OK`: `{"secret": "JBSWY3DPEHPK3PXP", "otpauthUrl": "otpauth://totp/Dispatch:admin..."}`

### `POST /admin/auth/mfa/confirm`
- **Purpose**: Validates the 6-digit TOTP code and converts temporary auth into a fully privileged Admin session.
- **Access**: `PUBLIC` (with `tempToken`)
- **Request Body**: `{"tempToken": "tmp_admin_92a...", "totpCode": "482019"}`
- **Responses**:
  - `200 OK`: Full admin `accessToken` and audit session ID.

---

## 3. User Profiles (`/users`)

### `GET /users/me`
- **Purpose**: Returns the full profile of the authenticated actor (Customer, Vendor staff, or Rider).
- **Access**: `Bearer JWT`
- **Responses**:
  - `200 OK`:
    ```json
    {
      "id": "usr_9410294",
      "phone": "+2348012345678",
      "fullName": "Adaeze Obi",
      "email": "adaeze@example.com",
      "role": "CUSTOMER",
      "defaultAddress": "14 University Road, Tanke, Ilorin",
      "createdAt": "2026-10-10T12:00:00Z"
    }
    ```

### `PATCH /users/me`
- **Purpose**: Updates personal profile information, default delivery address, and notification settings.
- **Access**: `Bearer JWT`
- **Request Body**:
  ```json
  {
    "fullName": "Adaeze Obi",
    "email": "adaeze.obi@gmail.com",
    "defaultAddress": "Block B, Tanke Buka, Ilorin"
  }
  ```
- **Responses**: `200 OK`

---

## 4. Vendors & Storefronts (`/vendors`)

### `GET /vendors`
- **Purpose**: Retrieves a list of active vendors with geographic cluster filtering, keyword search, and open/closed status.
- **Access**: `PUBLIC`
- **Query Parameters**:
  - `cluster` (optional): `Tanke` | `GRA` | `Challenge` | `Fate`
  - `search` (optional): Search query for store name or cuisine
  - `isOpen` (optional): `true` | `false`
- **Responses**: `200 OK` (Array of vendor storefront cards with average rating and ETA).

### `GET /vendors/slug/:slug`
- **Purpose**: Fetches vendor public profile, banner assets, operating hours, and full category menu by human-readable URL slug.
- **Access**: `PUBLIC`
- **Path Parameter**: `slug` (e.g. `mamas-kitchen-tanke`)
- **Responses**: `200 OK`

### `GET /vendors/:id`
- **Purpose**: Retrieves vendor internal details by UUID.
- **Access**: `PUBLIC`
- **Responses**: `200 OK`

### `POST /vendors`
- **Purpose**: Creates and registers a new vendor storefront.
- **Access**: `ADMIN` or `VENDOR`
- **Request Body**:
  ```json
  {
    "name": "Mama's Kitchen",
    "cluster": "Tanke",
    "address": "Opposite Tanke Junction, Ilorin",
    "latitude": 8.4799,
    "longitude": 4.5418,
    "commissionRate": 0.20,
    "bankCode": "035",
    "accountNumber": "0123456789"
  }
  ```
- **Responses**: `201 Created`

### `PATCH /vendors/:id/toggle-open`
- **Purpose**: Opens or temporarily closes the kitchen/storefront.
- **Access**: `VENDOR` (owner) or `ADMIN`
- **Request Body**: `{"isOpen": true}`
- **Responses**: `200 OK`: `{"vendorId": "vnd_102", "isOpen": true}`

---

## 5. Products & Menus (`/products`)

### `GET /products/vendor/:vendorId`
- **Purpose**: Lists all active menu items grouped by categories for a specific vendor.
- **Access**: `PUBLIC`
- **Responses**: `200 OK`

### `GET /products/:id`
- **Purpose**: Fetches a single dish/item by UUID with description, price, and availability.
- **Access**: `PUBLIC`
- **Responses**: `200 OK`

### `POST /products`
- **Purpose**: Creates a new product item in the vendor's catalog.
- **Access**: `VENDOR` or `ADMIN`
- **Request Body**:
  ```json
  {
    "vendorId": "vnd_102",
    "name": "Special Amala with Gbegiri & Ewedu",
    "category": "Swallow",
    "price": 2500,
    "description": "Hot piping Amala served with assorted goat meat.",
    "imageUrl": "https://storage.googleapis.com/prod-dispatch-media/amala.jpg"
  }
  ```
- **Responses**: `201 Created`

### `PATCH /products/:id`
- **Purpose**: Modifies price, description, or marks an item as sold out (`isAvailable: false`).
- **Access**: `VENDOR` or `ADMIN`
- **Request Body**: `{"price": 2700, "isAvailable": false}`
- **Responses**: `200 OK`

### `DELETE /products/:id`
- **Purpose**: Soft-deletes a product item from the vendor menu.
- **Access**: `VENDOR` or `ADMIN`
- **Responses**: `200 OK`: `{"deleted": true}`

---

## 6. Orders & Cart Lifecycle (`/orders`)

### `POST /orders`
- **Purpose**: Initiates order checkout. Validates that the vendor is open and items are available; calculates delivery fee and platform commission; assigns Monnify virtual account.
- **Access**: `Bearer JWT (CUSTOMER)`
- **Request Body**:
  ```json
  {
    "vendorId": "vnd_102",
    "items": [
      { "productId": "prd_501", "quantity": 2, "notes": "Extra pepper" }
    ],
    "deliveryAddress": "Hostel 3, UNILORIN Main Campus",
    "dropoffLat": 8.4820,
    "dropoffLng": 4.5450
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "orderId": "ord_849204",
      "orderNumber": "ORD-2K3F9A",
      "status": "PENDING",
      "subtotal": 5000,
      "deliveryFee": 850,
      "platformFee": 100,
      "totalAmount": 5950,
      "virtualAccount": {
        "bankName": "Wema Bank",
        "accountNumber": "9012345678",
        "accountName": "DISPATCH/ORD-2K3F9A",
        "expiresInMinutes": 30
      }
    }
    ```

### `GET /orders/track/:orderNumber`
- **Purpose**: Real-time order tracking endpoint accessible by customers without requiring full login. Returns stage, rider location, and ETA.
- **Access**: `PUBLIC`
- **Responses**: `200 OK`

### `GET /orders/:id`
- **Purpose**: Returns full order details, line items, timestamps, and payment status.
- **Access**: `Bearer JWT` (Customer owner, Vendor owner, Assigned Rider, or Admin)
- **Responses**: `200 OK`

### `GET /orders/customer/history`
- **Purpose**: Paginated list of past orders for the authenticated customer.
- **Access**: `Bearer JWT (CUSTOMER)`
- **Responses**: `200 OK`

### `GET /orders/vendor/:vendorId`
- **Purpose**: Retrieves all live active orders and order history for a vendor portal.
- **Access**: `Bearer JWT (VENDOR)`
- **Responses**: `200 OK`

### `PATCH /orders/:id/status`
- **Purpose**: Transition order state (`PREPARING`, `READY_FOR_PICKUP`, `CANCELLED`).
- **Access**: `VENDOR` or `ADMIN`
- **Request Body**: `{"status": "PREPARING"}`
- **Responses**: `200 OK`

---

## 7. Deliveries & Fulfillment (`/deliveries`)

### `GET /deliveries/active/me`
- **Purpose**: Returns the currently assigned, active delivery trip for the authenticated rider.
- **Access**: `Bearer JWT (RIDER)`
- **Responses**: `200 OK` (pickup coordinates, dropoff coordinates, customer phone, delivery fee).

### `PATCH /deliveries/:id/pickup`
- **Purpose**: Rider confirms that food package has been physically collected from vendor kitchen.
- **Access**: `Bearer JWT (RIDER)`
- **Responses**:
  - `200 OK`: `{"status": "PICKED_UP", "pickedUpAt": "2026-10-12T14:40:00Z"}`

### `PATCH /deliveries/:id/delivered`
- **Purpose**: Rider completes the delivery journey. Validates customer OTP and releases rider earnings to wallet via double-entry ledger.
- **Access**: `Bearer JWT (RIDER)`
- **Request Body**:
  ```json
  {
    "otp": "4821",
    "deliveryLatitude": 8.4820,
    "deliveryLongitude": 4.5450,
    "proofImageUrl": "https://storage.googleapis.com/.../proof.jpg"
  }
  ```
- **Responses**:
  - `200 OK`: `{"status": "DELIVERED", "riderEarnings": 680, "walletBalance": 12400}`
  - `400 Bad Request`: Invalid OTP verification code.

---

## 8. Dispatch Engine & Live Offers (`/dispatch`)

### `POST /dispatch/trigger/:deliveryId`
- **Purpose**: Triggers the geospatial dispatch algorithm for an order marked `READY_FOR_PICKUP`. Broadcasts live offers to nearby riders.
- **Access**: `ADMIN` or `SYSTEM`
- **Responses**: `202 Accepted`: `{"dispatchRound": 1, "candidatesContacted": 3}`

### `POST /dispatch/offers/:offerId/accept`
- **Purpose**: Rider accepts an incoming delivery offer. Enforces atomic race protection via Redis `SET NX offer:{id}:claimed` to ensure only one rider claims the order.
- **Access**: `Bearer JWT (RIDER)`
- **Responses**:
  - `200 OK`: `{"status": "ACCEPTED", "deliveryId": "dlv_9102"}`
  - `409 Conflict`: `OFFER_ALREADY_TAKEN` (lost the race to another rider).

### `POST /dispatch/offers/:offerId/reject`
- **Purpose**: Rider explicitly declines an offer. Triggers immediate escalation to next candidate.
- **Access**: `Bearer JWT (RIDER)`
- **Request Body**: `{"reason": "TOO_FAR"}`
- **Responses**: `200 OK`: `{"status": "REJECTED"}`

### `POST /dispatch/respond`
- **Purpose**: Unified endpoint supporting batch or client-generic responses to dispatch offers.
- **Access**: `Bearer JWT (RIDER)`
- **Request Body**: `{"offerId": "off_481", "action": "ACCEPT"}`
- **Responses**: `200 OK`

### `GET /dispatch/my-offers`
- **Purpose**: Polls or reconnects active pending offers for the authenticated rider.
- **Access**: `Bearer JWT (RIDER)`
- **Responses**: `200 OK` (Array of pending offers with 45-second expiry countdown).

---

## 9. Riders & Geolocation Heartbeats (`/riders`)

### `POST /riders/profile`
- **Purpose**: Submits rider onboarding documentation (guarantor info, bike plate, NIN).
- **Access**: `Bearer JWT`
- **Request Body**:
  ```json
  {
    "bikePlate": "KWR-849-XA",
    "guarantorName": "Alhaji Ibrahim Tanke",
    "guarantorPhone": "+2348033334444",
    "nin": "12345678901"
  }
  ```
- **Responses**: `201 Created`

### `GET /riders/profile/me`
- **Purpose**: Returns current rider profile, verification status, rating, and total completed deliveries.
- **Access**: `Bearer JWT (RIDER)`
- **Responses**: `200 OK`

### `POST /riders/heartbeat`
- **Purpose**: Periodic GPS ping (every 10–30s) updating the rider's position in the Redis geospatial index (`GEOADD riders:online`).
- **Access**: `Bearer JWT (RIDER)`
- **Request Body**: `{"longitude": 4.5420, "latitude": 8.4810}`
- **Responses**: `200 OK`

### `PATCH /riders/online`
- **Purpose**: Toggles rider availability state (`isOnline: true | false`).
- **Access**: `Bearer JWT (RIDER)`
- **Request Body**: `{"isOnline": true}`
- **Responses**: `200 OK`

### `PATCH /riders/:id/approve`
- **Purpose**: Admin operational sign-off approving a recruited rider after physical and guarantor checks.
- **Access**: `Bearer JWT (ADMIN)`
- **Responses**: `200 OK`

---

## 10. Double-Entry Financial Ledger (`/ledger`)

### `GET /ledger/audit`
- **Purpose**: Verifies that the global ledger satisfies the zero-sum invariant ($\sum \text{Debits} \equiv \sum \text{Credits}$).
- **Access**: `ADMIN`
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "BALANCED",
      "globalNet": "0",
      "totalPostings": 48291,
      "unbalancedGroups": []
    }
    ```

### `GET /ledger/wallet/vendor`
- **Purpose**: Retrieves available balance, escrow pending balance, and payout history for vendor owner.
- **Access**: `Bearer JWT (VENDOR)`
- **Responses**: `200 OK`: `{"availableBalance": 48200, "escrowPending": 8000}`

### `GET /ledger/wallet/rider`
- **Purpose**: Retrieves rider current earnings balance available for instant bank cash-out.
- **Access**: `Bearer JWT (RIDER)`
- **Responses**: `200 OK`: `{"availableBalance": 12400}`

### `GET /ledger/wallet/:walletId/entries`
- **Purpose**: Returns immutable line-by-line debit/credit audit postings for any specific wallet.
- **Access**: `ADMIN` or Wallet Owner
- **Responses**: `200 OK`

---

## 11. Payments & Webhooks (`/payments`)

### `POST /payments/initiate`
- **Purpose**: Generates dynamic virtual account or card payment checkout session.
- **Access**: `Bearer JWT`
- **Request Body**: `{"orderId": "ord_849204", "gateway": "MONNIFY"}`
- **Responses**: `200 OK`

### `POST /payments/webhook/monnify`
- **Purpose**: Inbound settlement callback from Monnify. Verifies SHA-512 HMAC signature, enforces idempotency, updates order to `PAID`, and posts initial 4-line ledger entry group.
- **Access**: `WEBHOOK` (validated via `monnify-signature` header)
- **Responses**: `200 OK`: `{"received": true}`

### `POST /payments/webhook/korapay`
- **Purpose**: Inbound settlement callback from Korapay for card transactions. Verifies SHA-256 HMAC signature.
- **Access**: `WEBHOOK` (validated via `x-korapay-signature` header)
- **Responses**: `200 OK`: `{"received": true}`

---

## 12. Payouts & Cash-Out (`/payouts`)

### `POST /payouts/request`
- **Purpose**: Initiates instant disbursement from vendor or rider wallet to verified Nigerian bank account via Monnify Transfer API.
- **Access**: `Bearer JWT (VENDOR | RIDER)`
- **Request Body**: `{"amount": 10000}`
- **Responses**:
  - `200 OK`: `{"payoutId": "pay_8491", "status": "PENDING", "reference": "DISP-PO-9410"}`
  - `422 Unprocessable Entity`: Insufficient available wallet balance.

### `GET /payouts/history`
- **Purpose**: Lists past payout disbursement batches and transfer reference numbers.
- **Access**: `Bearer JWT`
- **Responses**: `200 OK`

---

## 13. Ratings & Reviews (`/reviews`)

### `POST /reviews`
- **Purpose**: Customer rates vendor food quality and rider delivery performance (1–5 stars with review text).
- **Access**: `Bearer JWT (CUSTOMER)`
- **Request Body**:
  ```json
  {
    "orderId": "ord_849204",
    "vendorRating": 5,
    "riderRating": 5,
    "comment": "Food was boiling hot! Rider arrived very fast."
  }
  ```
- **Responses**: `201 Created`

### `GET /reviews/vendor/:vendorId`
- **Purpose**: Returns aggregated review score and public customer testimonials for a vendor.
- **Access**: `PUBLIC`
- **Responses**: `200 OK`

---

## 14. Notifications & Outbox (`/notifications`)

### `POST /notifications/outbox/process`
- **Purpose**: Manual or cron trigger processing queued SMS (Termii) and Push (FCM) notifications.
- **Access**: `ADMIN` or `SYSTEM`
- **Responses**: `200 OK`: `{"processedCount": 14, "failedCount": 0}`

---

## 15. WhatsApp Conversational Commerce (`/webhooks/whatsapp`)

### `GET /webhooks/whatsapp`
- **Purpose**: Meta Cloud API handshake verification endpoint (`hub.mode`, `hub.verify_token`, `hub.challenge`).
- **Access**: `PUBLIC` (Requires valid `WHATSAPP_VERIFY_TOKEN`)
- **Responses**: Returns `hub.challenge` string on success.

### `POST /webhooks/whatsapp`
- **Purpose**: Inbound message intake from customer WhatsApp. Verifies `X-Hub-Signature-256`, logs idempotency, returns 200 within 5 seconds, and enqueues background processing job to BullMQ.
- **Access**: `WEBHOOK` (Meta HMAC SHA-256)
- **Responses**: `200 OK`

### `GET /webhooks/whatsapp/conversations`
- **Purpose**: Lists active customer WhatsApp conversations with conversation state filters (`ACTIVE`, `AWAITING_CLARIFICATION`, `ESCALATED`).
- **Access**: `ADMIN` or `SUPPORT`
- **Responses**: `200 OK`

### `GET /webhooks/whatsapp/conversations/:id`
- **Purpose**: Fetches historical message exchanges and raw Gemini structured extraction payloads for a customer conversation.
- **Access**: `ADMIN` or `SUPPORT`
- **Responses**: `200 OK`

---

## 16. AI Menu Extraction (`/ai/menu`)

### `POST /ai/menu/extract`
- **Purpose**: Accepts food menu photos (handwritten chalkboards or printed cards) and invokes Gemini 1.5 Pro to extract dish names, categories, and prices.
- **Access**: `VENDOR` or `ADMIN`
- **Request Body**: `{"vendorId": "vnd_102", "imageUrl": "https://storage.googleapis.com/.../menu.jpg"}`
- **Responses**:
  - `200 OK`:
    ```json
    {
      "extractionId": "ext_9410",
      "items": [
        { "name": "Jollof Rice", "price": 2500, "category": "Rice", "confidence": 0.98 },
        { "name": "Fried Chicken", "price": 1200, "category": "Protein", "confidence": 0.95 }
      ]
    }
    ```

### `POST /ai/menu/extract/:id/confirm`
- **Purpose**: Commits the reviewed AI extraction into production database `products` rows.
- **Access**: `VENDOR` or `ADMIN`
- **Request Body**: Array of verified and edited menu items.
- **Responses**: `200 OK`: `{"createdProductsCount": 12}`

### `GET /ai/menu/extractions/:vendorId`
- **Purpose**: Returns previous OCR menu extraction attempts for a vendor.
- **Access**: `VENDOR` or `ADMIN`
- **Responses**: `200 OK`

### `GET /ai/menu/:id`
- **Purpose**: Retrieves a specific extraction session with confidence scores.
- **Access**: `VENDOR` or `ADMIN`
- **Responses**: `200 OK`

---

## 17. AI Dispatch Demand Forecasting (`/ai/dispatch`)

### `GET /ai/dispatch/forecast`
- **Purpose**: Returns Vertex AI XGBoost hourly demand forecasts by cluster zone (`Tanke`, `GRA`, etc.) to predict delivery surges.
- **Access**: `ADMIN` or `DISPATCH_ENGINE`
- **Query Parameters**: `cluster` (optional)
- **Responses**: `200 OK`: `{"cluster": "Tanke", "predictedOrdersNextHour": 42, "recommendedSurgeMultiplier": 1.2}`

### `GET /ai/dispatch/repositioning-advice`
- **Purpose**: Computes fleet rebalancing suggestions advising idle riders to move to high-demand clusters.
- **Access**: `ADMIN` or `RIDER`
- **Responses**: `200 OK`

---

## 18. AI Fraud Anomaly Scoring (`/ai/fraud` & `/admin/ai/fraud`)

### `POST /ai/fraud/score`
- **Purpose**: Computes a real-time transaction risk score (0.00–1.00) using Vertex AI anomaly detection models.
- **Access**: `INTERNAL` / `SYSTEM`
- **Request Body**: `{"customerId": "usr_912", "amount": 15000, "deliveryLat": 8.48, "deliveryLng": 4.54}`
- **Responses**: `200 OK`: `{"riskScore": 0.12, "decision": "ALLOW"}`

### `GET /admin/ai/fraud/review-queue`
- **Purpose**: Lists transactions or accounts flagged for fraud review by the AI model.
- **Access**: `ADMIN`
- **Responses**: `200 OK`

### `POST /admin/ai/fraud/review-queue/:id/resolve`
- **Purpose**: Operations decision on a flagged order (`APPROVE` or `BLOCK`).
- **Access**: `ADMIN`
- **Request Body**: `{"resolution": "APPROVE", "notes": "Customer verified via phone"}`
- **Responses**: `200 OK`

---

## 19. AI Customer Support Triage (`/support` & `/admin/ai/support`)

### `POST /support/tickets`
- **Purpose**: Creates a support ticket from an order complaint. Gemini classifies intent, urgency, and auto-suggests resolutions.
- **Access**: `CUSTOMER` or `VENDOR`
- **Request Body**: `{"orderId": "ord_849204", "message": "My drink was missing"}`
- **Responses**: `201 Created`: `{"ticketId": "tkt_102", "category": "MISSING_ITEM", "priority": "HIGH"}`

### `GET /support/tickets/:id`
- **Purpose**: Retrieves support thread messages and agent notes.
- **Access**: Ticket Owner or `SUPPORT` agent
- **Responses**: `200 OK`

### `POST /support/tickets/:id/messages`
- **Purpose**: Appends a reply message to an active support ticket.
- **Access**: Ticket Owner or `SUPPORT` agent
- **Request Body**: `{"content": "We have credited your wallet with ₦500."}`
- **Responses**: `200 OK`

### `GET /admin/ai/support/metrics`
- **Purpose**: Operational dashboard tracking automated AI resolution rate, first response time, and ticket volume.
- **Access**: `ADMIN`
- **Responses**: `200 OK`
