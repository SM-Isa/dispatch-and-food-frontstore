# 📘 VENDOR ONBOARDING PLAYBOOK (ARTIFACT 14)

> **Document Type:** Field Operations & Supply-Side Go-To-Market Playbook  
> **Target Audience:** Field Sales Representatives, Vendor Success Managers, Operations Coordinators, City General Managers  
> **Target Geography:** Ilorin, Kwara State, Nigeria (Tanke, GRA, Fate, Challenge clusters)  
> **Target Scale:** First 200 Verified Active Vendors (0 to 6 Months)  
> **Core Tooling:** Vendor Portal (`vendor.dispatch.ng`), Gemini 1.5 Flash Vision Menu Pipeline, WhatsApp Business Bot, Monnify Account Resolution

---

## 1. Executive Summary & The Cold-Start Problem

In tier-2 Nigerian cities like Ilorin, food delivery marketplaces fail almost exclusively on the supply side. A two-sided marketplace cannot operate without reliable restaurant supply, but onboarding traditional and semi-informal Nigerian food vendors presents three structural barriers:

1. **No Digital Menus:** Over $80\%$ of target food vendors in Ilorin (buka operators, local canteens, shawarma kiosks) do not maintain printed or digital menus. The menu, available daily proteins, and real-time pricing live exclusively in the kitchen head cook's mind.
2. **Cash & Informal Settlement Dominance:** Cash remains the psychological default. Bank transfers are considered "modern," while physical POS terminals are reserved for large supermarkets. Platform settlement requires absolute trust in timely, error-free automated bank payouts.
3. **Severe Platform Fatigue & Cynicism:** The average restaurant owner in Tanke or Fate has already been pitched by 2 to 3 failed delivery startups that promised volume, failed to provide dispatch riders, withheld funds, or shut down within months. Vendors assume new platforms will fail.

```
       ┌────────────────────────────────────────────────────────┐
       │             THE ILORIN SUPPLY-SIDE COLD START          │
       └───────────────────────────┬────────────────────────────┘
                                   │
      ┌────────────────────────────┼───────────────────────────┐
      ▼                            ▼                           ▼
[ Informal Menus ]       [ Financial Cynicism ]      [ Operational Inertia ]
No digital listings;     Distrust of payouts;        Vendor refuses complex
dishes live in memory    burn from dead apps         software & long delays
      │                            │                           │
      ▼                            ▼                           ▼
[ Gemini Vision ]        [ T+0/T+1 Monnify ]         [ 20-Min Handshake ]
Instant digitization     Automated twice-weekly      In-person test order
from paper/dish photos   guaranteed transfers        & physical audio bell
```

### Metrics of Success (Month 6 Milestone)
* **200 Vendors Actively Listed** across the four primary Ilorin clusters.
* **120 Vendors Performing $\ge 5$ Orders/Week** (the core operational liquidity benchmark).
* **60 Anchor Vendors Performing $\ge 20$ Orders/Week** (high-volume traffic drivers).
* **$< 15\%$ Monthly Churn** across the active vendor cohort.
* **Average Menu Upload-to-First-Order Time $< 3$ Days**.

### Failure Anti-Patterns to Avoid
* **The Signup Vanity Trap:** Signing 300+ vendors where only 40 generate real orders.
* **The Ghost Kitchen Mirage:** Listing vendors who stay marked offline or never accept orders.
* **Stale Catalog Rot:** Menus with outdated prices or signature items permanently marked "Sold Out."

---

## 2. Target Vendor Profiles & Cluster Allocation

We do not onboard every food stall. Selecting the wrong vendor burns field operations capacity, degrades customer experience, and damages platform reputation.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              VENDOR SEGMENTATION MATRIX                                │
├─────────────────┬──────────────────────────────────┬───────────────────────────────────┤
│ Tier Category   │ Criteria & Profile               │ Strategic Decision                │
├─────────────────┼──────────────────────────────────┼───────────────────────────────────┤
│ Tier 1: Core    │ • Fixed physical shop/kiosk      │ PRIMARY TARGET:                   │
│ (Priority)      │ • Existing daily walk-in crowd   │ Deploy field sales immediately.   │
│                 │ • 5–25 defined menu items        │ Fast-track onboarding in ≤24h.   │
│                 │ • AOV: ₦1,500 – ₦5,000           │ Target: 200 active by Month 6.    │
│                 │ • Owner present daily            │                                   │
├─────────────────┼──────────────────────────────────┼───────────────────────────────────┤
│ Tier 2: Caution │ • Home kitchens with WhatsApp    │ RESTRICTED TARGET:                │
│ (Selective)     │ • Menus > 40 items               │ Cap at max 45 platform-wide.     │
│                 │ • AOV < ₦1,200                   │ Require proven social proof       │
│                 │ • Operating < 3 months           │ or active WhatsApp order volume.  │
├─────────────────┼──────────────────────────────────┼───────────────────────────────────┤
│ Tier 3: Reject  │ • Mobile carts / street stalls   │ DO NOT ONBOARD:                   │
│ (Disqualified)  │ • Cash-only (refuses bank KYC)   │ Politely decline. Dispatch and    │
│                 │ • Poor sanitation / food safety  │ hygiene risk is unacceptable.     │
└─────────────────┴──────────────────────────────────┴───────────────────────────────────┘
```

### Cluster Targets (6-Month Horizon)

| Cluster Zone | Geographic Anchor & Characteristics | Tier 1 Target | Tier 2 Max Cap |
| :--- | :--- | :--- | :--- |
| **Tanke** | University of Ilorin student & staff corridor, high delivery density | 60 | 15 |
| **GRA** | High-income residential, corporate offices, premium casual dining | 55 | 10 |
| **Challenge** | Commercial trading hub, fast-food outlets, inter-city transport node | 45 | 10 |
| **Fate** | Affluent families, civil servants, event centers, medium density | 40 | 10 |
| **Total** | **Platform Target** | **200** | **45** |

> [!IMPORTANT]
> Never exceed the 45 Tier-2 vendor ceiling. Over-indexing on home kitchens without physical storefronts exhausts field reps with customer dispatch complaints and rider collection delays.

---

## 3. The Field Sales Scripts & Objection Handling

Sales reps must speak authentic Nigerian English. Never speak overly academic corporate English (which feels foreign and untrustworthy), and avoid heavy Pidgin (which feels unprofessional to business owners).

```
 ┌───────────────────────────────────────────────────────────────────────┐
 │                   THE FIELD PITCH PROGRESSION                         │
 └──────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
[ 60-Second Doorstep Pitch ]                     [ 5-Minute In-Store Demo ]
Hooks attention; anchors on                      Plays audio bell; calculates
bringing new off-peak sales                      exact Naira economics; closes
           │                                                 │
           └────────────────────────┬────────────────────────┘
                                    ▼
                      [ Objections Neutralized ]
                      Trust, commission, payout
                      transparency, tech simplicity
```

### The 60-Second Doorstep Hook
*(Use when approaching the vendor at the counter, doorway, or during off-peak hours)*

> *"Good afternoon, ma/sir. My name is [Name], and I’m with **Dispatch**—we’re a food delivery network built right here in Ilorin.*  
>  
> *We bring you paying customers who want your food right now but cannot beat the heat, rain, or traffic to come to your shop. You pay nothing to join. We only earn a small commission when a customer successfully receives their order.*  
>  
> *You keep your kitchen, your prices, and your walk-in customers. We handle the motorcycle delivery and collect the payments for you.*  
>  
> *Can I show you how simple it works on my phone? It takes only 3 minutes."*

---

### The 5-Minute Sit-Down Pitch & Economic Demonstration

#### 1. Identify the Pain Point (60 Seconds)
*"You know how customers call you during lunch to say 'Please hold two plates of Amala and Goat meat,' but then they can’t find a bike, or the rain starts, and the food gets cold? Or how they promise to come tomorrow and never show up? Dispatch turns those calls into instant paid orders."*

#### 2. Play the Sound & Show the Interface (90 Seconds)
Open `vendor.dispatch.ng` on the field tablet or smartphone. Show the clean layout of a neighboring non-competing restaurant. Trigger the sample order sound (the signature chime).  
*"Hear that? When an order comes in, your phone rings loud and clear like a cashier bell. You tap one green button to accept, and you start cooking."*

#### 3. Break Down the Exact Naira Economics (60 Seconds)
Walk through an authentic ₦5,000 order:
```
  Customer Cart Subtotal (2 plates @ ₦2,500):     ₦5,000
  Customer Delivery Fee (Paid to Dispatch Rider):   ₦800
  Customer Platform Service Fee:                    ₦100
  ──────────────────────────────────────────────────────
  Total Charged to Customer Card/Transfer:        ₦5,900

  YOUR PAYOUT (85% of ₦5,000 Subtotal):           ₦4,250
  Platform Commission (15%):                        ₦750
  Rider Delivery Payout (100% of Delivery Fee):     ₦800
  Platform Service Margin:                          ₦850
```
*"You take home ₦4,250 on a sale that would not have existed without us. We never take a kobo from your delivery fee or touch your in-store walk-in cash."*

#### 4. The 30-Day Risk-Free Close (60 Seconds)
*"Let us take a quick photo of your menu board right now. Our computer vision reads it instantly. Your first 20 orders are 100% commission-free as our welcome gift. If you don't love the extra sales after 30 days, we turn off your profile with one click. Deal?"*

---

### Comprehensive Objection Handling

| Common Vendor Objection | Root Fear | Proven Field Response |
| :--- | :--- | :--- |
| *"I already have enough walk-in customers."* | Disruption of current kitchen routine. | *"Your walk-in customers love you. We don't touch them. We bring the civil servant at State Secretariat or the student at PS who physically cannot leave their desk to walk here today."* |
| *"How am I sure you will send my money?"* | History of failed startups absconding with funds. | *"You don't pay us to register. The customer’s payment sits with our licensed banking partner (Monnify). Every Tuesday and Friday morning, your earnings transfer directly into your account. You see every order balance live in your app."* |
| *"15% commission is too high for food."* | Misunderstanding gross margin on extra volume. | *"If you sell 25 plates today, your rent and staff are already paid for. The 5 extra plates we bring you are pure profit. You keep ₦850 out of every ₦1,000 extra we bring to your pocket."* |
| *"I don't know how to operate complicated apps."* | Fear of technology and literacy barriers. | *"It takes 2 taps: 'Accept Order' and 'Ready for Pickup'. If you prefer, we can send your orders directly into WhatsApp—you just reply 'YES' to accept."* |
| *"Delivery apps came here before and failed."* | Skepticism regarding operational viability. | *"Those companies sat in Lagos and tried to run Ilorin remotely. We are based here in Kwara State. Here is my personal mobile number—if a rider is ever 5 minutes late, you call me directly."* |
| *"What happens if a customer complains about the food?"* | Fear of chargebacks or unfair blame. | *"We handle all customer service and rider disputes. You never have to argue with a customer. If the issue is delivery delay or rider spill, Dispatch absorbs the cost, not you."* |

---

## 4. Multi-Channel Recruitment Strategy

To acquire the initial 200 vendors efficiently, the operations team runs six recruitment pipelines with a total budget cap of **₦730,000** ($\sim ₦3,650$ blended acquisition cost per vendor).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        RECRUITMENT PIPELINE ALLOCATION                                 │
├──────────────────────────┬──────────────┬──────────────┬───────────────────────────────┤
│ Recruitment Channel      │ Target Signed│ Budget (NGN) │ Execution Cadence & Mechanic  │
├──────────────────────────┼──────────────┼──────────────┼───────────────────────────────┤
│ 1. Direct Field Sales    │ 100 Vendors  │ ₦400,000     │ 2 Reps, 20 knocks/day, Tanke  │
│                          │              │              │ & GRA cluster sweeps          │
│ 2. Customer In-App Leads │ 40 Vendors   │ ₦80,000      │ ₦2,000 food credit bounty on  │
│                          │              │              │ vendor's 5th completed order  │
│ 3. Vendor Peer Referrals │ 30 Vendors   │ ₦150,000     │ ₦5,000 cash bounty to active  │
│                          │              │              │ vendor upon referee's 10th txn│
│ 4. WhatsApp Communities  │ 20 Vendors   │ ₦0 (Organic) │ Targeted outreach to Ilorin   │
│                          │              │              │ Caterers & Food Network groups│
│ 5. Market Associations   │ 10 Vendors   │ ₦80,000      │ Event sponsorship & executive │
│                          │              │              │ leadership endorsement        │
│ 6. Food Micro-Creators   │ 0 (Awareness)│ ₦20,000      │ Meal tasting credits to local │
│                          │              │              │ Ilorin TikTok/IG foodies      │
├──────────────────────────┼──────────────┼──────────────┼───────────────────────────────┤
│ TOTAL BLENDED            │ 200 Vendors  │ ₦730,000     │ ₦3,650 Average CAC per Vendor │
└──────────────────────────┴──────────────┴──────────────┴───────────────────────────────┘
```

### Field Sales Protocols (Channel 1)
* **Field Rep Daily Quota:** 20 verified store visits per representative, Monday through Friday.
* **Optimal Visit Windows:** 10:00 – 11:30 WAT (pre-lunch setup) and 15:30 – 17:00 WAT (post-lunch lull). **Strictly avoid 12:00 – 14:30 WAT rush hours.**
* **Field Uniform & Collateral:** Branded Dispatch polo shirt, photo ID lanyard, printed Yoruba/English one-pagers, and small relationship gifts (branded phone kickstands or ₦500 stationery tokens).

---

## 5. End-to-End Onboarding Workflow (The 65-Minute Protocol)

From initial handshake to live order readiness, the field representative executes a disciplined, standardized six-step protocol within a single on-site visit.

```
 [ Step 1: 15 Min ] ──► [ Step 2: 10 Min ] ──► [ Step 3: 10 Min ]
   Digital Profile         Gemini Vision           Top-3 Plated
   KYC & Monnify           Menu Scan               Food Photos
          │                       │                       │
          ▼                       ▼                       ▼
 [ Step 6: Days 1-7 ] ◄── [ Step 5: 20 Min ] ◄── [ Step 4: 10 Min ]
   Retention Cadence       App Training &          End-to-End Test
   & Daily Support         Audio Alarm             Order Execution
```

### Step 1: Account Setup & Financial Verification (15 Minutes)
1. Navigate to `vendor.dispatch.ng/signup` on the rep's tablet.
2. Enter vendor mobile phone number; request SMS OTP. Vendor enters OTP directly.
3. Input official business details:
   * **Storefront Name:** Formatted cleanly (e.g., *"Iya Yusuf Amala Point - Tanke"*).
   * **Cluster Assignment:** Auto-detected via GPS PostGIS boundary.
   * **Physical Address:** Street name, landmark (e.g., *"Opposite Sanrab Filling Station"*).
   * **Settlement Account:** Input NUBAN account number and bank code. System triggers real-time Monnify account name lookup to verify legal ownership.
4. Digital Terms Acceptance: Review 1-page plain English agreement (twice-weekly settlement, hygiene standards, non-exclusivity).

### Step 2: Automated Menu Extraction (10 Minutes)
1. Capture high-resolution photo of handwritten chalkboard, printed card, or kitchen whiteboard.
2. Tap **"Digitize with AI"** in the vendor dashboard. Gemini 1.5 Flash Vision parses text, currency, and items in $\sim 6\text{ seconds}$.
3. Rep and vendor review the draft:
   * Confirm Naira prices (correct any OCR misreads).
   * Map to canonical categories (`RICE`, `SWALLOW`, `PROTEIN`, `SOUPS`, `DRINKS`).
   * Toggle initial availability status (`is_available = true`).

### Step 3: Food Photography for Top 3 Dishes (10 Minutes)
* Photograph the vendor's 3 best-selling signature dishes.
* Angles: Flat $45^\circ$ overhead angle, natural sunlight, clean white ceramic or traditional earthenware bowl. No background clutter, thumbs, or napkins.

### Step 4: Mandatory End-to-End Test Order (10 Minutes)
> [!IMPORTANT]
> No vendor may go live without completing a physical test order. Unfamiliarity with the first incoming order is the #1 driver of day-one churn.

1. Field rep opens the Customer PWA (`app.dispatch.ng`) on their personal device.
2. Rep places an order for ₦1,000 (reimbursed via ops petty cash).
3. Vendor observes the terminal ring with the loud audio notification.
4. Vendor taps **"Accept Order"** $\rightarrow$ status changes to `PREPARING`.
5. After 2 minutes, vendor taps **"Ready for Pickup"** $\rightarrow$ status changes to `READY`.
6. Rep simulates rider collection, verifies dispatch completion, and marks delivery done.
7. Vendor views the credited ₦850 in their live app wallet balance.

### Step 5: 20-Minute Operational Mastery Training (20 Minutes)
Cover the seven core operating lessons (detailed in Section 7).

### Step 6: 7-Day Field Follow-Up Cadence
Initiate the structured post-onboarding retention schedule (detailed in Section 8).

---

## 6. Menu Photography & Gemini Vision Fallback Playbook

The accuracy of Gemini 1.5 Flash Vision relies directly on photographic fidelity. Field reps are trained as disciplined menu photographers.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MENU PHOTOGRAPHY QUALITY STANDARDS                              │
├───────────────────┬─────────────────────────────────┬──────────────────────────────────┤
│ Dimension         │ Acceptable Standard             │ Unacceptable Fault               │
├───────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ Camera Distance   │ Fixed 12–15 inches perpendicular│ Tilted angle causing keystoning  │
│ Lighting          │ Diffuse daylight, zero shadows  │ Direct flash glare on laminate   │
│ Framing           │ 100% text within margin borders │ Cropped edges or blurred headers │
│ Surface Flatness  │ Held taut or flat on tabletop   │ Crumpled paper or folded creases │
│ Handwriting Style │ Legible print or clear cursive  │ Faded chalk or smudged pencil    │
└───────────────────┴─────────────────────────────────┴──────────────────────────────────┘
```

### Visual Confidence Indicators & Actions

```
┌───────────────────────┬──────────────────────┬─────────────────────────────────────────┐
│ Confidence Score      │ Visual Indicator     │ Required Field Representative Action    │
├───────────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ Score ≥ 0.90          │ Green Checkmark      │ Auto-accepted into menu catalog         │
│ 0.75 ≤ Score < 0.89   │ Yellow Caution       │ Verbally verify price with kitchen owner │
│ Score < 0.75          │ Red Alert Flag       │ Tap manual edit to retype item/price    │
└───────────────────────┴──────────────────────┴─────────────────────────────────────────┘
```

### Handling Unwritten Menus (The "In-Head" Menu)
If the owner has no written menu, reps use one of three fallback paths:
1. **Dictation Flow (Recommended):** Open the vendor portal's manual entry screen. Rep asks: *"What soups do you have today? What proteins?"* Auto-complete suggestions (`Egusi`, `Efo Riro`, `Assorted Meat`, `Titus Fish`) allow input of a 15-item menu in $< 5\text{ minutes}$.
2. **Plated Counter Sweep:** Photograph the physical serving pots or display counter. Gemini detects the food items visually, and the rep prompts the vendor for the price of each.
3. **Paper Transcription:** Rep writes the items on a clean notepad in bold marker, then photographs the paper for Gemini processing.

### Gemini Technical Failure Fallback Matrix

| Failure Mode | Underlying Root Cause | Immediate Field Remediation |
| :--- | :--- | :--- |
| `IMAGE_UNREADABLE` | Severe blur, inadequate lighting, or corrupt upload | Re-take photo with daylight framing. If still failing, switch to manual dictation flow. |
| `PRICE_AMBIGUOUS` | Shorthand pricing (e.g., *"1.5"* for ₦1,500, or range *"200-500"*) | Rep reads price aloud: *"Is Jollof Rice two thousand five hundred Naira?"* Adjust field manually. |
| `CATEGORY_MISMATCH` | Nigerian dish classified incorrectly (e.g., Amala as `SNACK`) | Manually override category dropdown. If $> 5$ items misclassify, flag `#ai-quality` for retraining. |
| `VENDOR_SUSPICIOUS` | Reluctance to have storefront photographed | Explain photo is for customer trust. If refused, use standard clean category illustration temporarily. |
| `API_503_UNAVAILABLE`| Google Vertex AI outage or quota limits | App drops to offline-cached dictation form. Complete onboarding; sync when connectivity restores. |

---

## 7. The 20-Minute Vendor Mastery Curriculum

A vendor who does not understand the notification and order lifecycle will fail within 48 hours. Training must be hands-on with the vendor's actual phone.

```
┌────────────────────────────────────────────────────────────────────────┐
│                  THE 20-MINUTE TRAINING TIMELINE                       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
      ┌────────────────────────────┼───────────────────────────┐
      ▼                            ▼                           ▼
[ Lesson 1: 3 Min ]      [ Lesson 2: 3 Min ]         [ Lesson 3: 2 Min ]
The "Cash Chime"         Order Acceptance            Ready for Pickup
Audio Notification       & Kitchen Ticket            Handshake Protocol
      │                            │                           │
      ├────────────────────────────┼───────────────────────────┘
      ▼                            ▼
[ Lesson 4: 3 Min ]      [ Lesson 5: 2 Min ]
The "Sold Out" Toggle    Wallet Ledger &
Prevents Cancellations   Settlement Audit
      │                            │
      └──────────────┬─────────────┘
                     ▼
             [ Lessons 6-7: 7 Min ]
             Dispute Support & Ground
             Rules for Platform Hygiene
```

### The 7 Core Operational Lessons
1. **Lesson 1: The Cash Chime (3 Min):** Set vendor phone volume to maximum. Ensure battery saver does not mute notifications. *"This sound is customer money entering your shop. When you hear it, open the app immediately."*
2. **Lesson 2: Order Acceptance (3 Min):** Walk through accepting orders vs. rejecting. Rule: **Never let an order ring out.** If an item is unavailable, tap reject with the reason rather than abandoning the customer.
3. **Lesson 3: Marking Ready for Pickup (2 Min):** Emphasize never tapping "Ready" until the food is boxed. Premature taps cause dispatch riders to wait in kitchens, leading to friction and cold food.
4. **Lesson 4: The "Sold Out" Toggle (3 Min):** The most critical inventory tool. Demonstrate toggling Jollof Rice off when the pot finishes at 14:00, and back on when a fresh batch is cooked.
5. **Lesson 5: Wallet & Payout Transparency (2 Min):** Show the real-time ledger balance. Demonstrate how each completed order credits 85% of food value. Show the Tuesday/Friday settlement calendar.
6. **Lesson 6: Escalation & Help (2 Min):** Have the vendor save the Field Rep’s and the Operations Desk’s direct WhatsApp phone numbers.
7. **Lesson 7: Platform Ground Rules (5 Min):**
   * *Never sell stale or reheated leftover food.*
   * *Never quarrel with dispatch riders or customers; escalate all friction.*
   * *Keep operating hours accurate in the portal.*

### The Low-Literacy / Non-Smartphone Fallback (WhatsApp Commerce)
For kitchen owners with basic feature phones or shared devices:
* Configure the vendor profile in **WhatsApp Interactive Mode**.
* Incoming orders arrive as WhatsApp Business messages with interactive buttons:
  * Reply `1` or tap **[Accept Order]**
  * Reply `2` or tap **[Mark Ready]**
  * Reply `3` or tap **[Sold Out]**
* No mobile app installation, Google Play account, or storage management required.

---

## 8. The First 7 Days: Critical Retention Playbook

The majority of vendor churn occurs within the first 168 hours of platform activation. The operations team follows an active engagement cadence:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        7-DAY VENDOR RETENTION SCHEDULE                                 │
├───────┬─────────────────┬──────────────────────────────────────────────────────────────┤
│ Day   │ Channel         │ Core Action & Diagnostic Checks                              │
├───────┼─────────────────┼──────────────────────────────────────────────────────────────┤
│ Day 1 │ Phone Call      │ Check evening order volume. If 0 orders, check search        │
│       │ (19:00 WAT)     │ visibility, operating hours toggle, and GPS cluster tag.     │
│ Day 2 │ System Audit    │ Review automated logs: acceptance rate (target >95%),        │
│       │ (Silent)        │ kitchen prep latency (target <18m). Call only if errors.     │
│ Day 3 │ WhatsApp Ping   │ Proactive check-in. If < 2 orders total, review menu         │
│       │                 │ pricing against cluster competitors and suggest promotions.  │
│ Day 5 │ Metric Health   │ Classify vendor into Green, Yellow, or Red status. Deploy    │
│       │ Review          │ in-person field rescue for any Red status vendors.           │
│ Day 7 │ In-Person Visit │ Deliver laminated "Week 1 Performance Card". Review total    │
│       │                 │ earnings and review customer praise/critique.                │
└───────┴─────────────────┴──────────────────────────────────────────────────────────────┘
```

### Day 5 Early Warning Health Classification
* 🟢 **Green Flag ($\ge 5$ orders, $> 95\%$ accept rate):** Performing well. Send congratulatory message; introduce referral bounty program.
* 🟡 **Yellow Flag (2–4 orders, $80\% - 95\%$ accept rate):** Stalling. Suggest adding a popular lunch combo or adjusting dish photo.
* 🔴 **Red Flag ($0 - 1$ orders, $< 80\%$ accept rate, or complaints):** Immediate churn hazard. Dispatch field rep for an in-person diagnostic within 24 hours.

### The Day-7 "Performance Card" Deliverable
Field reps present a physical or WhatsApp shareable scorecard:
```
  ════════════════════════════════════════════════════
     DISPATCH VENDOR REPORT: WEEK 1 PERFORMANCE
     Store: Mama's Kitchen (Tanke Central)
  ════════════════════════════════════════════════════
  • Completed Deliveries:        18 Orders
  • Net Earnings Deposited:      ₦48,600.00
  • Top Selling Dish:            Amala with Gbegiri (62%)
  • Customer Rating:             4.8 / 5.0 Stars
  • Peak Order Window:           13:00 – 14:30 WAT
  ════════════════════════════════════════════════════
```
*This tangible summary builds pride, proves digital viability, and serves as viral marketing when shared with neighboring shopkeepers.*

---

## 9. Marketplace Economics & Unit Financial Model

Clear unit economics protect platform margins while keeping vendor earnings transparent and sustainable.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       REPRESENTATIVE ORDER UNIT ECONOMICS                              │
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│ Financial Metric                       │ Value (NGN) & Percentage Split                │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ Customer Food Subtotal                 │ ₦3,500.00                                     │
│ Customer Delivery Fee                  │ ₦700.00                                       │
│ Customer Platform Technology Fee       │ ₦100.00                                       │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ Gross Marketplace Value (GMV)          │ ₦4,300.00 (100.0%)                            │
│ Vendor Net Payout (85% of Subtotal)    │ -₦2,975.00                                    │
│ Rider Payout (80% of Delivery Fee)     │ -₦560.00                                      │
│ Payment Processing Toll (Monnify 1.5%) │ -₦64.50                                       │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ Gross Platform Revenue                 │ ₦700.50 (16.3% of GMV)                        │
│ Operational Cost-to-Serve (Support/SMS)│ -₦200.50                                      │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ NET CONTRIBUTION MARGIN PER ORDER      │ ₦500.00 (~11.6% Net Margin)                   │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```

### Platform Break-Even Horizon (Phase 1)
* **Monthly Team Overhead:** ₦430,000 base salaries + ₦100,000 performance incentives = **₦530,000/month**.
* **Infra & Cloud Baseline:** Cloud Run, Gemini Vision, BigQuery, Redis = **₦1,720,000/month**.
* **Total Fixed Operating Cost:** **₦2,250,000/month**.
* **Break-Even Volume:** $\frac{₦2,250,000}{₦500\text{ Margin/Order}} = \mathbf{4,500\text{ Orders/Month}}$.
* **At 200 Vendors:** Requires an average of **22.5 orders per vendor per month** ($\sim 0.75$ orders/vendor/day) to achieve full cash-flow positivity.

---

## 10. Churn Prediction & The Churn-Save Playbook

Vendor loss is preventable if leading behavioral indicators are caught before the vendor turns off their phone.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CHURN PREDICTION INDICATOR TIERS                                │
├───────────┬──────────────────────────────────────────┬─────────────────────────────────┤
│ Tier Level│ Behavioral Indicator                     │ SLA & Mandatory Action          │
├───────────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ Tier 1    │ • Store closed 2 consecutive days        │ SLA: < 4 Hours                  │
│ (Critical)│ • Acceptance rate drops below 60%        │ In-person visit by Vendor       │
│           │ • 0 orders for 5 days after active volume│ Success Manager within 24h.     │
│           │ • Verbal intent to discontinue           │                                 │
├───────────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ Tier 2    │ • Order count drops 3 consecutive weeks  │ SLA: < 24 Hours                 │
│ (Drifting)│ • > 50% menu items marked "Sold Out"     │ Phone check-in; menu pricing    │
│           │ • Average order acceptance latency > 5m  │ audit; promotional push.        │
├───────────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ Tier 3    │ • Zero portal logins over 7 days         │ SLA: Next Business Day          │
│ (Passive) │ • No dish photos updated in 60 days      │ WhatsApp prompt with seasonal   │
│           │ • Customer rating dips below 3.8 stars   │ menu suggestions.               │
└───────────┴──────────────────────────────────────────┴─────────────────────────────────┘
```

### The 5-Step Churn Save Protocol
1. **Diagnosis (Within 4 Hours):** Call the owner directly. Ask open-ended questions: *"How is business this week? What part of the delivery flow gave you headache?"* Do not pitch; listen.
2. **Root Cause Categorization:** Identify whether the breakdown is:
   * **Demand Scarcity (40%):** Orders slowed down.
   * **Technology Friction (20%):** Phone storage full, notifications failing.
   * **Kitchen Stress (15%):** Staff shortages during walk-in peaks.
   * **Financial Anxiety (10%):** Delayed or misunderstood bank transfer.
3. **Deploy Targeted Remedy:** Offer a concrete operational fix:
   * *If demand:* Provide 7 days of homepage banner placement or a ₦300 customer discount funded by platform marketing.
   * *If technical:* Field rep visits to clean phone cache or switch profile to WhatsApp Order Mode.
   * *If kitchen stress:* Configure custom prep-time buffers (e.g., 30-minute default prep latency).
4. **Formalize in Writing:** Send an explicit WhatsApp recap: *"Mama Yusuf, as agreed, we are featuring your Fried Rice on the Tanke homepage this weekend to drive 15 orders. I will review numbers with you on Monday."*
5. **Log Intervention:** Record action in `vendor_churn_interventions` database table for analytics review.

---

## 11. Vendor Success Team Structure & Compensation

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           OPERATIONS TEAM ORGANIZATION                                 │
├─────────────────────┬───────┬──────────────────┬───────────────────────────────────────┤
│ Position            │ Head  │ Base Salary      │ Variable Incentives & Quotas          │
├─────────────────────┼───────┼──────────────────┼───────────────────────────────────────┤
│ Field Sales Reps    │ 2     │ ₦80,000 / month  │ • ₦2,000 per Tier-1 signed & active   │
│                     │       │                  │ • Quota: 12 verified Tier-1 / month   │
│ Vendor Success Mgr  │ 1     │ ₦150,000 / month │ • Bonus tied to cohort retention (>85%)│
│                     │       │                  │ • Quota: 100 active vendors under mgt │
│ Ops Coordinator     │ 1     │ ₦120,000 / month │ • Bonus tied to SLA resolution time   │
│                     │       │                  │ • Handles queue tickets & disputes    │
├─────────────────────┼───────┼──────────────────┼───────────────────────────────────────┤
│ TOTAL TEAM MONTHLY  │ 4     │ ₦430,000         │ Variable pool: ~₦100,000 / month      │
└─────────────────────┴───────┴──────────────────┴───────────────────────────────────────┘
```

### Field Representative Daily Route Rhythm
* **08:30 – 09:15 WAT:** Morning operations standup. Review previous day’s signups and test order logs.
* **09:30 – 11:30 WAT:** Morning field canvassing (10 door knocks in target cluster).
* **12:00 – 14:00 WAT:** Lunch rush monitoring and live order support for Day 1–3 vendors.
* **14:30 – 16:30 WAT:** Afternoon field canvassing (10 door knocks in target cluster).
* **16:45 – 17:30 WAT:** CRM logging, photo upload checks, and planning next day's visits.

---

## 12. Synthesis: Operational Golden Rules

1. **Never Lie About Commission:** Always state the 15% rate transparently. Misleading vendors creates instant resentment when the first settlement arrives.
2. **The First Order is Everything:** Never leave a vendor storefront until they have seen an order ring and experienced the fulfillment cycle.
3. **Protect the Audio Chime:** A vendor who does not hear their phone cannot fulfill orders. Notification settings must be verified in person.
4. **Respect the Walk-in Business:** We are an incremental profit partner, not the master of the vendor's kitchen. We adapt to their cooking rhythms.
5. **Local Presence Wins:** In tier-2 cities, trust belongs to people, not logos. A reliable, responsive field rep is the true moat of the marketplace.
