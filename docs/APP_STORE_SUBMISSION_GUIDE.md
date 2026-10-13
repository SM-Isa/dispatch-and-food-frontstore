# ARTIFACT 28: App Store Submission Guide & Storefront Readiness

The rider app is the only component of Dispatch that goes through an external gate before launch. Google Play and Apple App Store reviews have specific requirements, and first-time submissions get rejected for predictable reasons. This artifact is the checklist that gets us through on the first attempt.

---

## Structure Overview
1. [Why This Matters — The Cost of Rejection](#281-why-this-matters)
2. [Timeline — When to Start](#282-timeline)
3. [Google Play Submission — The Primary Channel](#283-google-play-submission)
4. [Apple App Store Submission — The Secondary Channel](#284-apple-app-store-submission)
5. [App Content Checklist](#285-app-content-checklist)
6. [Privacy and Data Safety](#286-privacy-and-data-safety)
7. [Permissions Justification](#287-permissions-justification)
8. [Store Listing Assets](#288-store-listing-assets)
9. [Rider-Specific Requirements](#289-rider-specific-requirements)
10. [Common Rejection Reasons and Fixes](#2810-common-rejection-reasons-and-fixes)
11. [Post-Launch Update Process](#2811-post-launch-update-process)
12. [The Submission Checklist (Printable Runbook)](#2812-the-submission-checklist)
13. [What This Guide Gets Right](#2813-what-this-guide-gets-right)

---

## 28.1 Why This Matters

A rejected app costs:
* **Time**: 3–7 days per rejection cycle on Google Play, up to 14 days on App Store.
* **Momentum**: Riders cannot work or onboard without the mobile client.
* **Money**: ₦0 revenue while riders wait, wasted operational expenditure in field rep time.

A rejected app in the wrong way costs more:
* **Account suspension**: Policy violations (especially location policy on Play Store) can lead to account bans.
* **Delisting**: Up to 30 days or permanent delisting.
* **Reputation**: Riders lose trust and perceive the platform as unprofessional.

> [!IMPORTANT]
> The Play Store is significantly stricter than most first-time submitters expect. Background location, in particular, is aggressively policed. Getting this right the first time is worth the upfront checklist.

---

## 28.2 Timeline

Work backward from the launch date:

| Milestone | When | Owner | Notes |
| :--- | :--- | :--- | :--- |
| **Google Play Developer account created** | Day 1 of sprint | CTO | $25 one-time registration fee |
| **Apple Developer Program enrolled** | Day 1 of sprint | CTO | Requires D-U-N-S verification (5–10 days) |
| **App store listing draft (text + assets)** | Day 5 of sprint | Growth Lead + CTO | Descriptions, keywords, screenshots |
| **Privacy policy URL live** | Day 7 of sprint | Legal | `https://dispatch.ng/privacy` |
| **Terms of service URL live** | Day 7 of sprint | Legal | `https://dispatch.ng/terms` |
| **Play Console data safety form filled** | Day 10 of sprint | CTO | High rejection risk area |
| **App Store privacy nutrition label filled** | Day 10 of sprint | CTO | Zero tracking disclosures |
| **First internal test build uploaded** | Day 10 of sprint | Mobile Engineer | Internal testing track |
| **Closed testing (internal)** | Day 11–17 | Mobile Engineer | 5 internal testers |
| **Closed testing (external testers, 20 riders)** | Day 18–24 | Mobile Eng + Ops | **Google 14-day continuous requirement** |
| **Production submission (Play Store)** | Day 25 | CTO | Submit release for review |
| **Production submission (App Store)** | Day 25 | CTO | Submit release for review |
| **Play Store approval** | Day 27–32 | — | Target 3–7 days review window |
| **App Store approval** | Day 27–39 | — | Target 7–14 days review window |
| **Public launch** | Day 33 | Whole Team | Public availability |

> [!NOTE]
> Start the Google Play Developer account and Apple Developer enrollment on Day 1. Both require verification that takes 2–5 business days (up to 10 for Apple D-U-N-S).

---

## 28.3 Google Play Submission

The primary channel. **95% of Nigerian riders use Android devices.**

### Step 1 — Create the Developer Account (Day 1)
* **Cost**: $25 one-time registration fee.
* **Requirements**:
  - Google account (**use a dedicated company account** `playstore@dispatch.ng`, not a personal account).
  - Company legal name (must match CAC certificate exactly: **Dispatch Technologies Ltd**).
  - Company address in Ilorin, Kwara State.
  - Company phone number.
  - Company website (`https://dispatch.ng`).
  - Government-issued ID of the authorized account owner.
* **Process**:
  1. Go to `play.google.com/console/signup`.
  2. Choose **"Organization"** (not "Individual").
  3. Fill in company details matching the CAC incorporation certificate.
  4. Pay the $25 fee.
  5. Submit ID for identity verification.
  6. Wait 2–5 business days for approval.

### Step 2 — Set up the App (Day 5)
* **App Name**: Dispatch Rider
* **Package Name**: `ng.dispatch.rider` *(locked permanently once created)*
* **Default Language**: English (Nigeria)
* **App Category**: Business *(safer and cleaner than Maps & Navigation)*
* **Content Rating**: Everyone
* **Tags**: Delivery, Logistics, Gig Work

### Step 3 — Fill in the Store Listing (Day 5–7)
* **Short Description** (80 chars max):
  ```text
  Earn money delivering food in Ilorin. Flexible hours. Daily payouts.
  ```
* **Full Description** (4,000 chars max):
  ```text
  Dispatch Rider is the app for delivery riders on Nigeria's first
  AI-native food delivery platform built for tier-2 cities.

  RIDERS USE DISPATCH TO:
  • Receive delivery offers in real time
  • Navigate to vendors and customers
  • Track earnings per delivery
  • Cash out to bank account anytime
  • Build a delivery history and rating

  WHY RIDERS CHOOSE DISPATCH:
  • Earn ₦600–1,200 per delivery
  • Work when you want — no fixed hours
  • Weekly payouts + instant cash-out option
  • Insurance covered (health, accident, theft)
  • Fuel discounts at partner stations
  • Community: WhatsApp groups, monthly meetups
  • Bike repair support and lease-to-own program

  HOW IT WORKS:
  1. Sign up with your phone number and guarantor
  2. Get verified within 48 hours
  3. Go online and accept offers near you
  4. Deliver food, earn money, cash out

  REQUIREMENTS:
  • Motorcycle and valid rider's license
  • Verifiable guarantor
  • Android 8.0+ phone
  • Bank account for payouts

  Dispatch is expanding across Ilorin (Tanke, GRA, Challenge, Fate) and
  will launch in more Nigerian cities in 2026.

  Questions? Contact riders@dispatch.ng
  ```
* **Rules**:
  - No keyword stuffing (Google penalizes it).
  - No misleading claims (if we advertise ₦600–1,200, that must be verifiably true).
  - No competitor comparisons.
  - Always include the verified support email: `riders@dispatch.ng`.

### Step 4 — Upload Assets (Day 7)
* **App Icon**: 512×512 PNG, 32-bit color, no transparency, brand delivery bag motif with emerald green palette.
* **Feature Graphic**: 1024×500 PNG/JPG. Rider on motorcycle in Ilorin, branded food bag visible, white text overlay: *"Deliver with Dispatch"*.
* **Screenshots (Minimum 4, Recommend 8)**:
  - Phone screenshots: 1080×1920 (9:16 aspect ratio).
  - Required sequence:
    1. Offer notification screen (*"New delivery — ₦850"*).
    2. Turn-by-turn map with route to vendor.
    3. Navigation map with route to customer and ETA.
    4. Delivery confirmation screen (*"Delivered! ₦850 earned"*).
    5. Earnings dashboard (*"Today: ₦12,400"*).
    6. Wallet and instant cash-out screen.
    7. Delivery history and rating.
    8. Profile, settings, and contractor verification.
* **Screenshot Rules**:
  - No emulator chrome/status bars.
  - No placeholder text (*no Lorem Ipsum, no "John Doe"*).
  - Real screenshots only, no 3D mockups.
  - English language text.
  - No "coming soon" features.
* **Promotional Video (Optional)**: 30-second 1080p YouTube video showing end-to-end rider workflow.

### Step 5 — Content Rating (Day 8)
* Violence: No
* Sexuality: No
* Language: No
* Controlled substances: No
* Gambling: No
* User-generated content: No
* Location sharing: Yes *(with users; fundamental to core platform function)*
* Personal info sharing: Yes *(with platform backend)*
* **Result**: Rated **Everyone** (or Everyone 10+).

### Step 6 — Target Audience (Day 8)
* Age range: **18+ only** *(riders must be legal adults)*.
* Zero appeal to children (no cartoon assets or family-friendly tags).

### Step 7 & 8 — Declarations (Day 8)
* News app declaration: **No**.
* COVID-19 contact tracing: **No**.

### Step 9 — Data Safety Form (Day 10) — The Primary Rejection Risk
Declare every data point collected, purpose, and third-party transfer:

| Data Type | Collected | Shared | Required? | Purpose | Encrypted in Transit |
| :--- | :---: | :---: | :---: | :--- | :---: |
| **Name** | Yes | No | Required | Account management | Yes (HTTPS) |
| **Phone number** | Yes | No | Required | Authentication, rider communications | Yes (HTTPS) |
| **Email** | Optional | No | Optional | Account recovery | Yes (HTTPS) |
| **User IDs** | Yes | No | Required | Account management & session binding | Yes (HTTPS) |
| **Address** | Yes | Yes (Vendor/Customer) | Required | Order dispatch and delivery logistics | Yes (HTTPS) |
| **Precise location** | Yes | Yes (Customer) | Required | Live delivery tracking, dynamic routing | Yes (HTTPS) |
| **Approximate location** | Yes | No | Required | Cluster assignment & demand heatmaps | Yes (HTTPS) |
| **Financial info** | Yes | Yes (Monnify/Korapay) | Required | Automated payouts & virtual accounts | Yes (HTTPS) |
| **Bank account details** | Yes | Yes (Monnify) | Required | Payout reconciliation | Yes (HTTPS) |
| **Photos** | Yes | No | Optional | Delivery proof photo uploads | Yes (HTTPS) |
| **Voice / audio** | Yes | Yes (Vertex AI/Gemini) | Optional | Voice-note dispatch parsing (Phase 2) | Yes (HTTPS) |
| **App activity** | Yes | No | Required | Operational functionality & analytics | Yes (HTTPS) |
| **App performance** | Yes | Yes (Sentry) | Required | Bug fixing & error monitoring | Yes (HTTPS) |
| **Device ID** | Yes | No | Required | Anti-fraud & session binding | Yes (HTTPS) |
| **Crash logs** | Yes | Yes (Sentry) | Required | Crash reporting & triage | Yes (HTTPS) |
| **Diagnostics** | Yes | Yes (Firebase) | Required | Network latency & battery performance | Yes (HTTPS) |

> [!CAUTION]
> **Third-party disclosure rule**: Any transfer off the device to an external company counts as "Shared". This includes Monnify, Korapay, Sentry, Firebase, Termii, Google Maps SDK, and GCP. Google Cloud is declared as a data processor.

### Step 10, 11 & 12 — Further Declarations (Day 10)
* Government apps: **No**.
* Financial features: **No financial services**. We pay riders via bank transfers, but we are not a bank or credit institution. The in-app wallet is a UI ledger view of delivery earnings, not a stored-value deposit account.
* Health apps: **No**.

### Step 13 — Upload App Bundle (Day 10)
```bash
# Build signed Android App Bundle (AAB)
cd apps/rider-app
flutter build appbundle --release
# Artifact output: build/app/outputs/bundle/release/app-release.aab
```

Keystore setup:
```bash
keytool -genkey -v -keystore dispatch-rider.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias dispatch-rider \
  -storetype JKS
```

### Step 14 — Play App Signing (Day 10)
* Enroll in **Google Play App Signing**. Google securely manages the master signing key while we use the upload key for builds.

### Step 15 — Internal Testing Track (Day 11)
* Upload AAB to Internal Testing.
* Testers: Founders + engineering team (5 users).
* Verify: Login OTP, offer push notification, GPS tracking, payout wallet, update triggers.

### Step 16 — Closed Testing Track (Day 18–24)
* **Google Play Policy Requirement**: New personal or organizational accounts must run closed testing with at least **20 external testers continuously opted in for 14 straight days**.
* Onboard 20 verified riders from the Tanke pilot cohort.
* Provide clear instructions to install and keep the app active.

### Step 17 — Production Access Application (Day 25)
* Complete production questionnaire (detail 14-day testing, target demographic in Ilorin, and order fulfillment purpose).
* Upload final release AAB with release notes:
  ```text
  Initial release. Deliver food across Ilorin with flexible hours and real-time earnings.
  ```
* Submit for final review. Review duration: 3–7 days.

### Step 18 — Post-Approval Production URL
* Direct Play Store Link:
  ```text
  https://play.google.com/store/apps/details?id=ng.dispatch.rider
  ```

---

## 28.4 Apple App Store Submission

The secondary channel (<5% of Nigerian delivery riders utilize iOS), but critical for corporate credibility, investor demonstration, and ecosystem completeness.

### Step 1 — Enroll in Apple Developer Program (Day 1)
* **Cost**: $99/year.
* **Long Pole Requirement**: **D-U-N-S Number** for *Dispatch Technologies Ltd*.
  - Request via `dnb.com/duns-number`.
  - Submit CAC registration documents.
  - Processing takes 5–10 business days.
* Complete organization enrollment at `developer.apple.com/programs/enroll`.

### Step 2 — Create App ID & Capabilities (Day 5)
* Identifier: `ng.dispatch.rider`
* Capabilities enabled:
  - **Push Notifications**
  - **Background Modes**: *Location updates*

### Step 3 — App Store Connect Configuration (Day 5)
* Name: **Dispatch Rider**
* Bundle ID: `ng.dispatch.rider`
* SKU: `dispatch-rider-001`
* Subtitle: `Deliver. Earn. Cash out.` (30 chars max)
* Category: Business (Primary), Navigation (Secondary)
* Age rating: 4+

### Step 4 & 5 — Pricing and Availability (Day 5)
* Price: Free.
* Territory: Nigeria only (initial).

### Step 6 — App Privacy Nutrition Label (Day 10)
* **Data Linked to You**:
  - Contact info (Name, Phone, Email) -> App Functionality
  - Location (Precise, Coarse) -> App Functionality
  - Financial info (Payment info, Bank details) -> App Functionality
  - User content (Photos for delivery proof) -> App Functionality
  - Identifiers (User ID, Device ID) -> App Functionality
  - Usage Data (Product interaction) -> Analytics
  - Diagnostics (Crash logs, performance metrics) -> App Functionality
* **Data Used to Track You**: **None** *(no third-party cross-app advertising tracking)*.

### Step 7 — iOS Screenshots (Day 7)
* 6.7" Display (iPhone 15 Pro Max): 1290 × 2796 px
* 6.5" Display (iPhone 14 Plus): 1284 × 2778 px
* 5.5" Display (iPhone 8 Plus): 1242 × 2208 px

### Step 8 & 9 — Build, Archive & TestFlight (Day 10–24)
```bash
cd apps/rider-app
flutter build ipa --release --export-options-plist=ios/ExportOptions.plist
```
* Upload via Xcode Organizer or `xcrun altool`.
* Deploy to TestFlight for internal founders and 20 external test riders.

### Step 10 & 11 — Submit for Review (Day 25)
* Target review time: 7–14 days for initial organizational submissions.
* Public URL upon approval:
  ```text
  https://apps.apple.com/ng/app/dispatch-rider/id1234567890
  ```

### iOS Critical Requirements
1. **Background Location String**: `NSLocationAlwaysUsageDescription` in `Info.plist`:
   * *"Dispatch uses your location to show you nearby delivery offers and to let customers track their delivery in real time."*
2. **Third-Party Login**: No Apple ID sign-in required because we utilize phone OTP auth only.
3. **In-App Account Deletion**: **Mandatory**. Rider must be able to initiate account deletion directly from the mobile app settings.

---

## 28.5 App Content Checklist

### Store Listing Assets
- [x] App icon (512×512 for Play, 1024×1024 for App Store)
- [x] Feature graphic (1024×500 for Play)
- [x] 8 phone screenshots (Android: 1080×1920)
- [x] 8 phone screenshots (iOS: 3 required resolutions)
- [x] Short description (80 chars Play, 30 chars App Store subtitle)
- [x] Full description (4,000 chars markdown-clean)
- [x] Promotional text (170 chars App Store, optional)
- [x] 30-second promo video (YouTube link / MP4)
- [x] App Store search keywords (100 chars, comma-separated)

### Legal & Verification URLs
- [x] Privacy policy: `https://dispatch.ng/privacy`
- [x] Terms of service: `https://dispatch.ng/terms`
- [x] Support email: `riders@dispatch.ng`
- [x] Marketing landing page: `https://dispatch.ng/riders`
- [x] Rider help center: `https://dispatch.ng/riders/support`

### Technical Artifacts
- [x] Production-signed Android App Bundle (`.aab`)
- [x] Production-signed iOS Archive (`.ipa`)
- [x] Package ID locked: `ng.dispatch.rider`
- [x] FCM and APNs push notification keys uploaded
- [x] Background location entitlements configured
- [x] Native splash screen and asset bundles configured

---

## 28.6 Privacy and Data Safety

Google and Apple cross-reference the Data Safety questionnaire with the live privacy policy text at `https://dispatch.ng/privacy`.

### Mandatory Privacy Policy Inclusions
1. Explicit data collection categories.
2. Purpose specification (operational fulfillment, fraud prevention, safety).
3. Third-party disclosures (Monnify, Korapay, Sentry, Google Cloud, Firebase).
4. Data retention rules (financial records kept 7 years per Nigerian financial laws; telemetry purged after 90 days).
5. User deletion rights under NDPR (Nigerian Data Protection Regulation).
6. Age policy (strictly 18+).
7. Designated Data Protection Officer (DPO) contact email: `dpo@dispatch.ng`.

### Explicit Exclusions (What We Do NOT Collect)
Reviewers flag missing categories if they suspect undeclared collection. The privacy policy explicitly affirms:
* **No health or biometric data**.
* **No web browsing or search history**.
* **No device contacts (address book)**.
* **No SMS reading or call logs**.
* **No calendar data**.

---

## 28.7 Permissions Justification

### Android Permissions & Manifest Rationale
| Permission | Purpose | Store Justification String |
| :--- | :--- | :--- |
| `INTERNET` | Backend API calls | Core network communication |
| `ACCESS_NETWORK_STATE` | Online / offline detection | Queueing location updates during network drops |
| `ACCESS_FINE_LOCATION` | Precise GPS for dispatch | *"Dispatch uses your location to show nearby offers and enable customers to track deliveries."* |
| `ACCESS_COARSE_LOCATION` | Cellular tower fallback | Fallback when fine GPS is temporarily degraded |
| `ACCESS_BACKGROUND_LOCATION` | GPS while app is backgrounded | *"Dispatch tracks your location during active deliveries so customers can see their order in real time."* |
| `FOREGROUND_SERVICE` | Continuous tracking notification | Android 14+ background execution requirement |
| `FOREGROUND_SERVICE_LOCATION` | Specialized location service | Android 14+ service classification |
| `POST_NOTIFICATIONS` | Push alerts for orders | *"Dispatch notifies you of new delivery offers."* |
| `VIBRATE` | Haptic feedback for new offers | Haptic alerts while riding |
| `WAKE_LOCK` | Prevent screen sleep during navigation | Rider safety while mounted on motorcycle |
| `CAMERA` | Delivery proof photo uploads | Optional; only when taking proof-of-delivery photos |

> [!WARNING]
> **Android Permissions We NEVER Request**:
> `READ_CONTACTS`, `READ_SMS`, `RECEIVE_SMS`, `CALL_PHONE`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`. Requesting any of these invites immediate scrutiny or rejection.

### The Background Location Disclosure Flow
1. **Never request background location at first launch** (immediate policy rejection).
2. On first launch / login: Request `ACCESS_FINE_LOCATION` only.
3. After the rider accepts their first delivery offer: Present a full-screen, dedicated disclosure modal:
   ```text
   To track deliveries in real time, Dispatch needs to access your location
   while the app is in the background. This ensures customers and vendors
   can see arrival ETAs. We only track during active deliveries.
   ```
4. When the rider taps *"Allow Tracking"*, trigger the OS prompt for `ACCESS_BACKGROUND_LOCATION`.
5. Persistent foreground notification during transit:
   ```text
   "Dispatch is tracking your location for active delivery #ORD-10492"
   ```

---

## 28.8 Store Listing Assets

### Brand Icon Specification
* 1024×1024 PNG (flat, no alpha channel).
* Brand emerald green background with minimalist delivery bag silhouette and white "D" emblem.
* No text in icon; renders crisply at 48×48 px.

### Feature Graphic (Google Play)
* 1024×500 px.
* High-resolution, authentic photo of a rider in Ilorin wearing our green delivery bag on a motorcycle.
* Text overlay: *"Deliver with Dispatch"*.

### The 8 Canonical App Screenshots
1. **Offer Notification**: *"Get offers in real time"* — Showing incoming ₦850 delivery offer card with accept timer.
2. **Vendor Route Navigation**: *"Turn-by-turn navigation"* — Map route from Tanke to Item7.
3. **Customer Route Navigation**: *"Know where you're going"* — Route to UNILORIN campus with live ETA.
4. **Delivery Confirmation**: *"Get paid per delivery"* — Green success banner with completed delivery breakdown.
5. **Earnings Dashboard**: *"Track your earnings"* — Daily total (₦12,400) and weekly total (₦67,350).
6. **Instant Cash-out**: *"Cash out anytime"* — Monnify transfer confirmation modal to Kuda/Access Bank.
7. **Delivery History**: *"Your delivery history"* — Transparent list of all completed trips with timestamps.
8. **Rider Profile & Reputation**: *"Build your reputation"* — Verified profile badge, 4.9 rating, 500+ trips.

---

## 28.9 Rider-Specific Requirements & Gig Work Policies

Riders operate as independent contractors. Both Google and Apple enforce stringent gig-economy transparency guidelines.

### Mandatory Declarations
* **Non-Employee Status**: The app must make clear that riders are independent contractors.
* **No Dark Patterns**: The app must not force acceptance or punish riders with opaque deactivations for declining orders.
* **Support Accessibility**: An in-app support chat / direct WhatsApp hotline must be accessible from every screen.

### First-Launch Mandatory Agreement Modal
```text
Welcome to Dispatch Rider.

You are joining as an independent contractor, not an employee of
Dispatch Technologies Ltd.

You have total flexibility: you choose when to work, which offers to accept,
and when to take breaks.

By continuing, you agree to our Terms of Service and Independent Contractor Agreement.
```

### In-App Account Deletion Requirement (App Store Guideline 5.1.1)
* Located at: `Profile -> Settings -> Security -> Delete Account`.
* Flow: Initiates account closure, prompts OTP verification, immediately revokes authentication tokens, and schedules database anonymization within 30 days while retaining audited financial ledger rows for statutory compliance.

---

## 28.10 Common Rejection Reasons and Fixes

| Rejection Trigger | Root Cause | Preventive Implementation |
| :--- | :--- | :--- |
| **Background location not justified** | Asking for location without clear in-app justification | Defer request until active delivery; display in-app explanatory disclosure modal |
| **Privacy policy mismatch** | Form claims no data shared, but Sentry/Firebase SDKs present | Declare all telemetry, analytics, and payment SDKs in Data Safety form |
| **Crash on launch** | Untested low-memory Android devices | Test release build on low-end 2GB RAM Android 8.0 device prior to upload |
| **Screenshots show fake features** | Marketing mockups show features not implemented | Only capture real screens from the Flutter production build |
| **Misleading app title** | Keyword stuffing (e.g. "Dispatch - Best Food Rider Uber Glovo") | Strict canonical title: `Dispatch Rider` |
| **Missing account deletion** | User can sign up in app but must email to delete | Built-in self-service account deletion flow with SMS OTP confirmation |
| **Unexplained third-party SDKs** | Undisclosed ad/tracking libraries | Ensure zero ad networks are bundled; only operational SDKs permitted |

---

## 28.11 Post-Launch Update Process

### Phased Canary Rollouts
* **Google Play**:
  - Deploy to Closed Testing track first.
  - Roll out to Production: 10% -> 20% -> 50% -> 100% over 5 days.
  - Halt rollout if crash-free rate drops below 99.5%.
* **Apple App Store**:
  - Deploy to TestFlight first.
  - Enable **Phased Release** (7-day automatic graduated rollout).

### Force-Upgrade Protocol
When a breaking backend API migration or critical security fix is deployed:
1. API gateway returns `HTTP 426 Upgrade Required` with response:
   ```json
   {
     "statusCode": 426,
     "message": "Please update Dispatch Rider to continue delivering.",
     "minimumVersion": "1.4.0",
     "storeUrl": "https://play.google.com/store/apps/details?id=ng.dispatch.rider"
   }
   ```
2. Mobile app renders an un-dismissible modal directing the rider to update via the store.

---

## 28.12 The Submission Checklist (Printable Runbook)

### Phase 1: Pre-Submission Preparation (Day 20)
- [ ] Assets finalized: 512×512 icon, 1024×500 feature graphic, 8 phone screenshots.
- [ ] Public URLs verified: `https://dispatch.ng/privacy`, `https://dispatch.ng/terms`.
- [ ] Support email active: `riders@dispatch.ng`.
- [ ] Signed release AAB built with keystore securely backed up.
- [ ] Tested on 5 real Android devices (including Tecno/Infinix low-memory models).
- [ ] Background location modal tested and functioning.
- [ ] In-app account deletion flow verified.
- [ ] 20 external riders active in Google Play Closed Testing for 14 continuous days.

### Phase 2: Store Submission (Day 25)
- [ ] Data Safety form completed with zero discrepancies against privacy policy.
- [ ] Content ratings questionnaire answered (18+ rating).
- [ ] Financial declarations marked as "No Financial Services (Contractor Payouts Only)".
- [ ] Release AAB uploaded to Production Track with release notes.
- [ ] iOS IPA uploaded to App Store Connect with privacy nutrition labels.
- [ ] Submit releases for official store review.

### Phase 3: Review & Approval (Day 26–32)
- [ ] Review status monitored twice daily.
- [ ] Reviewer inquiries responded to within 12 hours.
- [ ] Coordinate production release toggle upon approval.

### Phase 4: Launch Day (Day 33)
- [ ] Verify live store links: `https://play.google.com/store/apps/details?id=ng.dispatch.rider`.
- [ ] Dispatch download link via SMS to onboarded rider cohort.
- [ ] Brief field recruitment reps with QR codes linking to store pages.

---

## 28.13 What This Guide Gets Right

1. **Starts with the timeline**: Rejections happen when teams submit too late; this runbook works backward from Day 33.
2. **Treats Apple D-U-N-S as critical path**: Solves the 10-day corporate verification bottleneck on Day 1.
3. **Dissects the Data Safety form**: Neutralizes the source of 60% of modern Google Play rejections.
4. **Codifies background location compliance**: Eliminates policy violations by deferring location requests to active trips.
5. **Explicitly documents what is NOT collected**: Preempts automated reviewer auditing flags.
6. **Honors gig-worker protections**: Satisfies platform guidelines regarding contractor autonomy.
7. **Actionable printable checklist**: Provides engineering and operations with a zero-ambiguity runbook.
