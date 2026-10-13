# 📘 RIDER RECRUITMENT AND TRAINING PLAYBOOK (ARTIFACT 15)

> **Document Type:** Field Operations & Rider Supply-Side Operating Manual  
> **Target Audience:** Rider Success Lead, Rider Ops Coordinators, Field Verification Representatives, City General Managers  
> **Target Geography:** Ilorin, Kwara State, Nigeria (Tanke, GRA, Fate, Challenge clusters)  
> **Target Scale:** 300 Verified Active Motorcycle Dispatch Riders (0 to 6 Months)  
> **Core Tooling:** Rider Flutter Mobile App (`mobile/`), Dispatch Engine (`backend/src/modules/dispatch/`), Termii SMS, Monnify Payouts, MyCoverGenius Microinsurance

---

## 1. Executive Summary & The Operational Reality of Riders

Motorcycle dispatch riders are the most visible and vulnerable layer of the marketplace. They are the only human beings the customer physically meets upon order delivery. While informal food vendors are tethered to fixed physical kitchens and accustomed to daily commercial routines, motorcycle dispatch riders operate in a fundamentally distinct operational reality:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SUPPLY-SIDE OPERATIONAL COMPARISON                              │
├─────────────────────┬────────────────────────────────────┬─────────────────────────────┤
│ Dimension           │ Informal Food Vendors              │ Motorcycle Dispatch Riders  │
├─────────────────────┼────────────────────────────────────┼─────────────────────────────┤
│ Monthly Churn       │ 10% – 15% / month                  │ 25% – 40% / month (High)    │
│ Average Tenure      │ Years (Generational kitchens)      │ 2 – 6 Months                │
│ Physical Risk       │ Kitchen burns, kitchen slips       │ Traffic, robbery, weather   │
│ Cash Exposure       │ Receives digitally via bank        │ May collect cash on delivery│
│ Mobility & Location │ Fixed physical storefront          │ Mobile, anonymous by default│
│ Trust Verification  │ Business address & bank resolution │ Guarantor + ID + Bike inspection│
│ Compensation Metric │ 85% of order subtotal GMV          │ Per-delivery fee + bonuses  │
│ Psychological Anchor│ Commercial profitability           │ Community & cash liquidity  │
└─────────────────────┴────────────────────────────────────┴─────────────────────────────┘
```

### The Seven Failure Modes to Defend Against
1. **Ghost Riders:** Signing up to collect initial promotional fuel bonuses, then never taking a delivery.
2. **Rogue Riders:** Accepting food pickup from a vendor and absconding without delivery.
3. **Guarantor Impersonation:** Submitting fake phone numbers or paid fraudulent guarantors.
4. **Bike Breakdown Attrition:** Minor mechanical failures causing immediate, unrecoverable rider dropout.
5. **Fuel Price Sensitivity:** Local PMS (fuel) price spikes wiping out daily earnings, causing sudden fleet strikes.
6. **Severe Road Incidents:** Traffic accidents occurring without medical insurance, exposing the platform to community backlash.
7. **Cellular Data Depletion:** Budget Android phones running out of prepaid airtime, causing abrupt disconnection from the dispatch engine.

---

## 2. Target Rider Profiles & Cluster Quotas

We do not recruit every motorcycle rider on the street. Selecting irresponsible, unvetted, or transient riders causes delivery theft, cold food, and customer churn.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                RIDER RECRUITMENT MATRIX                                │
├─────────────────┬──────────────────────────────────┬───────────────────────────────────┤
│ Tier Category   │ Criteria & Characteristics       │ Operational Decision              │
├─────────────────┼──────────────────────────────────┼───────────────────────────────────┤
│ Tier 1: Core    │ • Age 22–40 years                │ PRIMARY TARGET:                   │
│ (Priority)      │ • Owns roadworthy motorcycle     │ Court aggressively.               │
│                 │ • Verifiable family/landlord KYC │ Fast-track 48h onboarding.        │
│                 │ • Prior gig work (Bolt/Gokada)   │ Target: 300 active by Month 6.    │
│                 │ • Android 8+, resident in cluster│                                   │
├─────────────────┼──────────────────────────────────┼───────────────────────────────────┤
│ Tier 2: Caution │ • Age < 22 or 40–50 years        │ RESTRICTED FLEET:                 │
│ (Selective)     │ • Rental bike / no ownership     │ Cap at maximum 25% of fleet.      │
│                 │ • Part-time availability (3 days)│ Pair with experienced buddy rider.│
│                 │ • New to Ilorin (< 6 months)     │ Maximum 70 platform-wide.         │
├─────────────────┼──────────────────────────────────┼───────────────────────────────────┤
│ Tier 3: Reject  │ • No verifiable guarantor        │ STRICTLY REJECT:                  │
│ (Disqualified)  │ • Refuses background check       │ Zero exceptions. "You do not meet │
│                 │ • Faulty bike / missing papers   │ our criteria at this time."       │
│                 │ • History of theft or aggression │ Prevent platform liability.       │
└─────────────────┴──────────────────────────────────┴───────────────────────────────────┘
```

### Fleet Quotas per Cluster (Month 6 Target)

| Cluster Zone | Primary Corridor | Tier 1 Target | Tier 2 Cap | Active Peak Fleet Required |
| :--- | :--- | :--- | :--- | :--- |
| **Tanke** | Unilorin Road, Sanrab, Tipper Garage | 90 | 20 | 50 Active (400 orders/day) |
| **GRA** | Ahmadu Bello Way, Police Roundabout | 80 | 20 | 45 Active (360 orders/day) |
| **Challenge** | Post Office, Muritala Road, Offa Garage | 70 | 15 | 40 Active (320 orders/day) |
| **Fate** | Fate Roundabout, Shoprite corridor | 60 | 15 | 35 Active (280 orders/day) |
| **Total** | **Platform Fleet** | **300** | **70** | **170 Active Concurrently** |

> [!IMPORTANT]
> **The Demand-to-Rider Ratio Rule:** Maintain a strict ratio of **1 active rider per 8 daily orders** in each cluster. An undersupplied cluster breaches delivery SLAs ($> 90\text{s}$ time-to-assign); an oversupplied cluster leaves riders idle, depresses daily earnings below ₦5,000, and triggers fleet churn.

---

## 3. Guarantor Verification: The Mandatory Trust Gate

Guarantor verification is the cornerstone of risk management for motorcycle logistics in Nigeria. A rider with a reputable guarantor will not steal orders or abandon a delivery.

```
 [ Step 1: In-App ] ──► [ Step 2: Automated ] ──► [ Step 3: OTP Check ]
   Rider Submits          Termii Phone Lookup       Guarantor Enters
   Guarantor KYC          & NIN Format Check        SMS Auth Code
          │                       │                       │
          ▼                       ▼                       ▼
 [ Step 6: Sign ]   ◄── [ Step 5: Address ]   ◄── [ Step 4: Phone Call ]
   Digital Contract       Field Agent Visits        24h Voice Screen
   ₦500K Liability        Home (Tier-1 Only)        by Ops Coordinator
```

### Guarantor Legal & Social Requirements
A valid guarantor must satisfy all criteria:
1. **Age:** Minimum 30 years old.
2. **Fixed Residence:** Verifiable physical home address in Kwara State (subject to field inspection).
3. **Relationship:** Verifiable documented connection: Parent, Sibling ($>30$), Landlord, Religious Leader (Imam/Pastor), or Established Business Owner.
4. **Identity Verification:** Valid National Identity Number (NIN), Voter's Card, or Driver's License.
5. **Exclusivity:** Cannot guarantee more than one rider simultaneously.
6. **Independence:** Cannot be another active dispatch rider.

### Verification Workflow & SLAs

| Step | Action & Owner | Time Budget | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **1. In-App Submission** | Rider inputs guarantor data in app | 5 Minutes | Full name, phone, address, NIN photo, relationship. |
| **2. Automated Screening** | Dispatch backend automated checks | $< 1\text{ Minute}$ | Termii active number ping, NIN 11-digit regex, duplicate check. |
| **3. OTP Consent** | Guarantor enters SMS OTP | 5 Minutes | Guarantor confirms explicit awareness of application. |
| **4. Voice Verification** | Rider Ops Coordinator phone call | $\le 24\text{ Hours}$ | Structured 3-minute interview verifying relationship and consent. |
| **5. Physical Inspection** | Field Rep visits home address | $\le 48\text{ Hours}$ | Confirms physical residence for high-risk / Tier-1 cohorts. |
| **6. Digital Execution** | Guarantor signs digital liability form | 5 Minutes | Digital agreement accepting secondary liability up to ₦500,000. |

### Red Flags: Instant Disqualification
* Guarantor asks: *"How much will Dispatch pay me to sign this?"* (Misunderstands legal role).
* Phone number unreachable after 3 attempts over 48 hours.
* Physical home address does not exist or landlord states the guarantor moved away.
* Guarantor hesitates or states: *"I only met him last month at the car wash."*

---

## 4. Recruitment Channels & Unit Acquisition Economics

To build the initial 300-rider fleet, operations deploys six targeted recruitment pipelines with a blended cost-per-acquisition (CAC) cap of **₦2,870 per active rider**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        RIDER RECRUITMENT PIPELINE ALLOCATION                           │
├──────────────────────────┬──────────────┬──────────────┬───────────────────────────────┤
│ Recruitment Channel      │ Target Fleet │ Budget (NGN) │ Key Mechanic & Conversion     │
├──────────────────────────┼──────────────┼──────────────┼───────────────────────────────┤
│ 1. Bolt/Uber/Gokada Alumni│ 100 Riders   │ ₦50,000      │ Direct pitch at driver lounges│
│                          │              │              │ & WhatsApp groups (15% conv)  │
│ 2. Active Rider Referrals│ 90 Riders    │ ₦400,000     │ ₦5,000 bounty paid after 20th │
│                          │              │              │ completed delivery (High qual)│
│ 3. Motorcycle Mechanics  │ 40 Riders    │ ₦100,000     │ 10 partner workshops in Ilorin│
│                          │              │              │ ₦2,000 bounty per vetted hire │
│ 4. Fuel Station Displays │ 30 Riders    │ ₦30,000      │ Banner & QR standees at 15    │
│                          │              │              │ major petrol stations         │
│ 5. Faith & Civic Networks│ 30 Riders    │ ₦210,000     │ Sponsorship of community hall │
│                          │              │              │ & mosque youth forums         │
│ 6. Targeted Social Ads   │ 20 Riders    │ ₦100,000     │ Meta ads in Kwara State targeting│
│                          │              │              │ male 22–35, bike enthusiasts  │
├──────────────────────────┼──────────────┼──────────────┼───────────────────────────────┤
│ TOTAL BLENDED            │ 310 Recruits │ ₦890,000     │ ₦2,870 Average CAC per Rider  │
└──────────────────────────┴──────────────┴──────────────┴───────────────────────────────┘
```

---

## 5. The Field Sales Pitch: Earnings-First & Objection Handling

Riders do not care about platform vision or tech buzzwords. They care about daily net take-home pay, fuel consumption, and whether they will get paid today.

### The 60-Second Fuel Station Hook
*(Use when approaching riders at petrol stations, bike stands, or mechanic shops)*

> *"Good afternoon, my brother. My name is [Name] with **Dispatch**—we are the new food delivery network operating across Tanke, GRA, and Fate.*  
>  
> *We are hiring riders right now. You earn between **₦700 and ₦1,200 per food trip**, and your money is sent directly to your bank account every Tuesday and Friday—or you can cash out instantly every evening.*  
>  
> *Our trips are short (2 to 4 kilometers). You spend less fuel than carrying passengers, and you don't carry heavy passengers that wear out your shock absorbers.*  
>  
> *Here is my card. Let me send you the registration link on WhatsApp right now."*

---

### The 5-Minute Earnings Comparison Demo

#### Walk Through the Realistic Fuel Math
```
  DAILY EARNINGS COMPARISON: DISPATCH FOOD VS. PASSENGER HAILING (BOLT/OKADA)
  ───────────────────────────────────────────────────────────────────────────
  METRIC                     PASSENGER OKADA              DISPATCH FOOD
  Average Daily Trips:       8 Passenger Rides            15 Food Deliveries
  Average Trip Distance:     6.5 km per ride              3.2 km per delivery
  Total Daily Kilometers:    52 km ridden                 48 km ridden
  Gross Daily Revenue:       ₦5,600 (8 × ₦700)            ₦13,050 (15 × ₦870)
  Daily Fuel Expenditure:    -₦2,500                      -₦3,000
  Daily Bike Maintenance:    -₦600 (Heavy wear)           -₦500 (Light food box)
  ───────────────────────────────────────────────────────────────────────────
  NET TAKE-HOME DAILY PAY:   ₦2,500 NET                   ₦9,550 NET (3.8× Higher)
  MONTHLY NET (25 DAYS):     ₦62,500                      ₦238,750 (Bank Teller Level)
```

---

### Critical Objection Handling

| Rider Objection | Underlying Anxiety | Proven Field Response |
| :--- | :--- | :--- |
| *"What if I don't get orders and just sit idle?"* | Fear of wasted fuel and lost time. | *"We only launch in active clusters with confirmed vendor orders. Tanke already does 400 orders a day. If orders are ever slow, we pay a relocation bonus to move to GRA."* |
| *"What if a customer refuses to pay or runs away?"* | Fear of absorbing food loss out of pocket. | *"You never handle customer food debt. 95% of orders are prepaid by card or transfer before you move. If a cash order ever fails, Dispatch absorbs the cost, not you."* |
| *"What happens when my bike breaks down?"* | Mechanical failure means immediate starvation. | *"We have partnered with 10 mechanics across Ilorin. You get discounted repairs, and Dispatch advances the repair bill from future earnings over 4 weeks so you never stop riding."* |
| *"What if traffic police or KWARTMA stop me?"* | Fear of extortion or impoundment. | *"You receive an official Dispatch rider manifest, branded reflective jacket, and registered delivery box. Our legal team is on call 24/7 if an officer stops an active delivery."* |
| *"What if I get into an accident?"* | Fear of medical bills and loss of livelihood. | *"Every active rider is enrolled in our microinsurance policy. Medical expenses are covered up to ₦500,000, and you receive ₦15,000/day sick pay for up to 14 days while healing."* |

---

## 6. End-to-End Onboarding Workflow (The 4-Day SLA)

```
 [ Day 0: 20 Min ] ──► [ Day 1: 24h ] ──► [ Day 2: 30 Min ] ──► [ Day 3: 24h ]
   Digital Apply         Guarantor Call    Field Verification     Background Check
   & Monnify NUBAN       & Phone Screen    & Bike Inspection      via VerifyMe/NIN
          │                                                              │
          ▼                                                              ▼
 [ Day 5: GO LIVE ] ◄── [ Day 4: 2h ] ◄─────────────────────────── [ Day 3: 2h ]
   Welcome Bonus         First Ride-Along                           Classroom Training
   & WhatsApp Group      with Senior Buddy                          & Safety Briefing
```

### Day 0: Digital Application (20 Minutes)
* Input NUBAN bank account number; verified in real-time via Monnify API.
* Upload clear photos of rider face, motorcycle registration, and driver's license.
* Input guarantor contact and upload guarantor NIN.

### Day 1: Guarantor Screening (24-Hour Window)
* Automated Termii SMS sent with OTP verification link.
* Rider Ops Coordinator executes a 3-minute voice verification call.

### Day 2: Physical Bike Inspection & Field Audit (30 Minutes)
Field representative conducts a 10-point physical check:
1. Working front headlight and brake tail-lights.
2. Tread depth on front and rear tires ($> 2\text{mm}$).
3. Functional front and rear drum/disc brakes.
4. Secure rear carrier rack capable of mounting the thermal delivery box.
5. Engine sound and exhaust smoke level (no excessive oil burning).
6. Presence of dual rear-view mirrors.
7. Verification of chassis and engine serial numbers against vehicle license.

### Day 3: Classroom Training & Safety Briefing (2 Hours)
Mandatory in-person session at Dispatch Operations Center (see Section 8 & 10).

### Day 4: Mandatory Buddy Ride-Along (2 Hours)
* The recruit is paired with an experienced "Senior Rider Buddy" for their first 3 live deliveries.
* **Delivery 1:** Recruit observes the buddy navigate, interact with the kitchen, and greet the customer.
* **Delivery 2:** Recruit performs the pickup and navigation while the buddy shadows.
* **Delivery 3:** Recruit executes the entire order independently; buddy signs off on app competency.
* Senior Buddy is credited a **₦1,500 mentoring bounty** upon sign-off.

### Day 5: Fleet Activation & Welcome Grant
* Account status set to `is_approved = true`.
* Branded reflective vest and insulated waterproof delivery backpack issued.
* **₦500 welcome fuel grant** credited directly to the rider wallet.
* Rider added to cluster WhatsApp community group.

---

## 7. Motorcycle Fleet & Fuel Financing Models

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MOTORCYCLE OWNERSHIP & FINANCING MODELS                         │
├─────────────────────┬──────────────────┬──────────────────┬────────────────────────────┤
│ Model               │ Model A: Owner   │ Model B: Rental  │ Model C: Lease-to-Own      │
├─────────────────────┼──────────────────┼──────────────────┼────────────────────────────┤
│ Fleet Target        │ 60% of Fleet     │ 25% of Fleet     │ 15% of Fleet (Capped at 50)│
│ Motorcycle Asset    │ Rider owns bike  │ Local fleet partner│ Platform-purchased asset │
│ Daily Vehicle Toll  │ ₦0.00            │ ₦2,500 / day     │ ₦1,400 / day (Deducted)    │
│ Fuel Responsibility │ Rider            │ Rider            │ Rider                      │
│ Maintenance Cost    │ Rider            │ Rental Partner   │ Platform subsidized        │
│ Path to Ownership   │ Immediate        │ None             │ Full ownership in 14 mos   │
│ Churn Likelihood    │ Lowest (15%/mo)  │ Highest (35%/mo) │ Moderate (18%/mo)          │
└─────────────────────┴──────────────────┴──────────────────┴────────────────────────────┘
```

### Fuel Support & Daily Cashflow Management
1. **Discounted Fuel Network:** Negotiate a **5% volume discount** at 15 designated petrol stations across Ilorin using branded Dispatch Fuel ID Cards.
2. **Daily Micro-Fuel Advance:** Riders who have completed $\ge 30$ lifetime deliveries with a $\ge 4.5$ star rating can request an instant **₦3,000 daily fuel advance** via the app. The advance is automatically deducted from that day's delivery earnings with zero interest.

---

## 8. Safety Standards & Incident Management

Safety is non-negotiable. Reckless driving destroys brand equity, risks lives, and incurs regulatory penalties from Kwara State Road Traffic Management Authority (KWARTMA).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             DISPATCH SAFETY PROTOCOLS                                  │
├─────────────────────┬──────────────────────────────────────────────────────────────────┤
│ Protocol            │ Mandatory Operational Standard                                   │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Helmet Requirement  │ DOT/ECE approved helmet strapped at all times. Zero exceptions.  │
│ Speed Limits        │ Max 50 km/h on main roads; 30 km/h in residential; 20 km/h markets│
│ Mobile Usage        │ STRICTLY FORBIDDEN while in motion. Phone must sit on handlebar  │
│                     │ mount. Pull off road to accept dispatch offers.                  │
│ Severe Rainstorms   │ App automatically suspends dispatch rounds during torrential     │
│                     │ rainstorms until flooding recedes. Call ops to hold meals.       │
│ Night Operations    │ High-visibility reflective vest required after 18:30 WAT.        │
│ Defensive Stance    │ Assume other vehicles cannot see you at roundabouts & blind spots│
└─────────────────────┴──────────────────────────────────────────────────────────────────┘
```

### Disciplinary Suspension Schedule
* **1st Infraction (Riding without helmet / phone use):** 7-day app suspension.
* **2nd Infraction (Reckless driving / customer altercation):** 30-day suspension + mandatory retraining.
* **3rd Infraction (Theft / intoxication / physical violence):** Permanent platform ban + guarantor notification + police handover.

---

## 9. Comprehensive Microinsurance Coverage

Every rider is protected from day one through our partnership with **MyCoverGenius**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        INSURANCE COVERAGE MATRIX (MYCOVERGENIUS)                       │
├────────────────────────────────┬──────────────────────────┬────────────────────────────┤
│ Coverage Benefit               │ Tier 1: Platform-Funded  │ Tier 2: Enhanced Upgrade   │
├────────────────────────────────┼──────────────────────────┼────────────────────────────┤
│ Monthly Premium Cost           │ ₦1,800 (Paid by Platform)│ ₦2,500 (Rider co-pay)      │
│ Third-Party Property Damage    │ Up to ₦2,000,000         │ Up to ₦5,000,000           │
│ Personal Medical Expenses      │ Up to ₦500,000 / incident│ Up to ₦2,000,000 / incident│
│ Hospitalization Allowance      │ Up to ₦15,000 / day (14d)│ Up to ₦25,000 / day (30d)  │
│ Stolen Motorcycle Protection   │ Up to ₦150,000           │ Full replacement value     │
│ Smartphone Theft Protection    │ Up to ₦80,000            │ Up to ₦120,000             │
│ Permanent Disability Grant     │ ₦1,000,000               │ ₦3,000,000                 │
│ Death Benefit to Next-of-Kin   │ ₦2,000,000               │ ₦5,000,000                 │
└────────────────────────────────┴──────────────────────────┴────────────────────────────┘
```

> [!NOTE]
> Riders who maintain a **$\ge 4.8$ rating across 500 incident-free deliveries** receive the Tier-2 Enhanced Insurance package at zero cost, funded by Dispatch platform reserves.

---

## 10. The 25-Minute Rider App Mastery Curriculum

Conducted hands-on during the Day-3 onboarding session on the recruit's personal smartphone.

```
┌────────────────────────────────────────────────────────────────────────┐
│                  THE 25-MINUTE TRAINING TIMELINE                       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
      ┌────────────────────────────┼───────────────────────────┐
      ▼                            ▼                           ▼
[ Lesson 1: 3 Min ]      [ Lesson 2: 4 Min ]         [ Lesson 3: 4 Min ]
Going Online &           45-Second Offer             In-App Turn-By-Turn
Background Location      Acceptance Chime            Vector GPS Navigation
      │                            │                           │
      ├────────────────────────────┼───────────────────────────┘
      ▼                            ▼
[ Lesson 4: 4 Min ]      [ Lesson 5: 4 Min ]
Vendor Pickup & Kitchen  Customer Handover &
Order Code Matching      Masked Phone Call
      │                            │
      └──────────────┬─────────────┘
                     ▼
             [ Lessons 6-8: 6 Min ]
             Instant Wallet Cash-Out,
             Support Help & Code of Conduct
```

### The 8 Core Curriculum Modules
1. **Going Online & Permissions (3 Min):** Enable "Always Allow" location permissions. Disable aggressive Android OS battery optimization (which kills background location tracking).
2. **The 45-Second Offer Window (4 Min):** Demonstrate the high-priority audio chime and vibration. Explain that offers expire in 45 seconds to maintain customer SLAs.
3. **Turn-by-Turn GPS Navigation (4 Min):** Demonstrate switching between the built-in lightweight vector navigation screen and external Google Maps.
4. **Kitchen Order Pickup (4 Min):** Verify order number with restaurant staff. Inspect meal packaging seal. Tap **"Order Picked Up"** to notify customer.
5. **Customer Dropoff & Phone Masking (4 Min):** Demonstrate in-app dialer (masks rider and customer personal numbers). Collect delivery confirmation OTP from customer.
6. **Wallet & Instant Cash-Out (2 Min):** Demonstrate checking daily accrued balance and triggering instant bank withdrawals.
7. **24/7 Operations Desk Hotline (2 Min):** Save the emergency dispatch hotline number into phone speed-dial.
8. **Code of Conduct & Prohibitions (2 Min):** Strict zero-tolerance rules on account sharing, phone use while driving, and order tampering.

---

## 11. The Critical First 14 Days: Retention Cadence

The majority of rider attrition occurs within the first 336 hours. Operations executes a structured retention protocol:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        14-DAY RIDER RETENTION CHECKLIST                                │
├───────┬─────────────────┬──────────────────────────────────────────────────────────────┤
│ Day   │ Engagement      │ Core Operational Objective & Diagnostic Checks               │
├───────┼─────────────────┼──────────────────────────────────────────────────────────────┤
│ Day 1 │ Active Tracking │ Monitor first 3 delivery offers live. Call if rider rejects  │
│       │                 │ all 3 or stalls $> 10\text{m}$ at pickup. Celebrate 1st trip.│
│ Day 2 │ Silent Audit    │ Verify telemetry heartbeat integrity; check daily earnings.  │
│ Day 3 │ WhatsApp Ping   │ Check in on fatigue, app questions, and fuel consumption.     │
│ Day 5 │ Weekly Review   │ Classify metrics into Green, Yellow, or Red status.          │
│ Day 7 │ Milestone Bonus │ Disburse **₦2,000 streak bonus** for 7 consecutive active days│
│ Day 10│ Fatigue Screen  │ Proactively check on riders who took $> 2$ consecutive days  │
│       │                 │ off without notice; prevent silent churn.                    │
│ Day 14│ Core Fleet Gate │ Formal review: $\ge 100$ deliveries, $\ge 4.5$ rating, zero  │
│       │                 │ safety violations $\rightarrow$ Promoted to Core Veteran.    │
└───────┴─────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 12. Transparent Earnings & Real-Time Remuneration

Riders trust platforms that never hide calculations or delay withdrawals.

### Comprehensive Delivery Compensation Formula
$$\text{Rider Pay} = \mathbf{₦600\text{ Base}} + (\mathbf{₦50/\text{km}} \times \text{Distance}) + \text{Multipliers} + \text{Incentives}$$

* **Peak Lunch/Dinner Multiplier:** $1.2\times$ base fare ($12:00\text{--}14:30$ and $18:30\text{--}21:00$ WAT).
* **Rainstorm Multiplier:** $1.3\times$ base fare during active heavy rainfall.
* **Long-Distance Surcharge:** $+15\%$ on deliveries spanning $> 5.0\text{ km}$.
* **Daily Streak Incentive:** $+₦500$ bonus upon completing 10 deliveries in a single calendar day.

### Automated Sunday WhatsApp Performance Summary
Every Sunday at 20:00 WAT, every rider receives an automated breakdown:
```
  ════════════════════════════════════════════════════
     DISPATCH RIDER STATEMENT: WEEK 42
     Rider: Musa Ibrahim (ID: RDR-8821)
  ════════════════════════════════════════════════════
  • Completed Deliveries:        87 Trips
  • Total Road Kilometers:       289.4 km
  • Base Delivery Fares:         ₦63,850.00
  • Peak & Streak Bonuses:       ₦3,500.00
  ────────────────────────────────────────────────────
  GROSS EARNINGS ACCRUED:        ₦67,350.00

  DEDUCTIONS:
  • Fuel Advances Repaid:       -₦4,000.00
  • Tier-2 Microinsurance:        -₦625.00
  ────────────────────────────────────────────────────
  NET PAYOUT DISBURSED:          ₦62,725.00 (Sent to Kuda Bank)

  • Customer Star Rating:        4.85 / 5.0 Stars
  • On-Time Dispatch SLA:        94.2%
  • Cluster Rank:                Top 15% in Tanke
  ════════════════════════════════════════════════════
```

---

## 13. Churn Diagnostics & The Churn-Save Playbook

Rider loss follows predictable patterns. Operations intervenes before the rider sells their bike or transitions to a competitor.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CHURN INDICATOR TIERS & INTERVENTIONS                           │
├───────────┬──────────────────────────────────────────┬─────────────────────────────────┤
│ Tier Level│ Diagnostic Trigger                       │ SLA & Operational Intervention  │
├───────────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ Tier 1    │ • Offline 3 consecutive days without note│ SLA: < 4 Hours                  │
│ (Critical)│ • Offer acceptance rate drops below 60%  │ Voice call by Ops Coordinator.  │
│           │ • Star rating plummets below 4.0 stars   │ Diagnose fuel/bike distress.    │
│           │ • Explicit statement of quitting         │                                 │
├───────────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ Tier 2    │ • Weekly earnings drop 3 weeks in a row  │ SLA: < 24 Hours                 │
│ (Drifting)│ • Stops working peak lunch/dinner windows│ Coaching call; recommend cluster│
│           │ • Decline in weekly deliveries by > 30%  │ relocation with surge bonus.    │
├───────────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ Tier 3    │ • Zero offers accepted while logged in   │ SLA: Next Business Day          │
│ (Warning) │ • Customer rating drifts to 4.3 stars    │ Technical phone audit (check GPS│
│           │ • Avoids rainy day shifts                │ and mobile network provider).   │
└───────────┴──────────────────────────────────────────┴─────────────────────────────────┘
```

### The 60-Day Official Pause Policy
Riders experiencing illness, family commitments, or bike engine overhauls can request an **Official 60-Day Pause**. During a pause:
* Their historical rating and core status are locked and preserved.
* They are not penalized in the algorithm upon reactivation.
* Prevents permanent churn driven by temporary life events.

---

## 14. Community Building: The Core Retention Engine

Community is the single most powerful retention lever in West African gig logistics. Riders who belong to an organized community churn at **one-third the rate** of isolated gig workers.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             COMMUNITY RETENTION PILLARS                                │
├─────────────────────┬──────────────────────────────────────────────────────────────────┤
│ Community Program   │ Structure, Frequency & Incentive                                 │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Cluster WhatsApp Hub│ Curated group per cluster managed by elected Rider Captain.      │
│                     │ Strictly no political/religious spam. Real-time road alerts.     │
│ Elected Captains    │ Top veteran rider elected every 6 months. Receives ₦30,000/month │
│                     │ stipend to mentor recruits and represent fleet concerns.         │
│ Monthly Townhalls   │ 2-hour Saturday meetup with hot jollof rice, safety refresher,    │
│                     │ peer awards, and open Q&A with city management (₦80K budget).    │
│ Micro-Savings Club  │ Optional daily ₦200 automatic deduction into a 12% yield savings │
│                     │ account with partner microfinance bank (Carbon/FairMoney).       │
│ Annual Awards Gala  │ "Rider of the Year" wins ₦500,000 cash, holiday grant, and new    │
│                     │ motorcycle upgrade. "Safety Champion" wins ₦50,000.              │
└─────────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 15. Marketplace Economics & Rider Ops Financial Model

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PLATFORM UNIT REVENUE PER RIDER                                 │
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│ Operational Metric                     │ Value (NGN) & Economic Output                 │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ Average Deliveries per Rider Daily     │ 15 Completed Trips                            │
│ Average Delivery Fee Charged           │ ₦800.00                                       │
│ Rider Payout (80% of Delivery Fee)     │ -₦640.00                                      │
│ Platform Technology Fee Charged        │ ₦100.00                                       │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ Platform Retained Margin per Delivery  │ ₦260.00                                       │
│ Daily Platform Margin per Active Rider │ ₦3,900.00 (15 × ₦260)                         │
│ Monthly Platform Margin per Active Rider│ ₦97,500.00 (25 Working Days)                  │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ All-In Rider Acquisition Cost (CAC)    │ ₦8,500.00 (Recruitment + KYC + Gear)          │
│ PAYBACK PERIOD PER ONBOARDED RIDER     │ 2.2 Days of Active Delivery Work              │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```

### 12-Month Fleet Scaling & GMV Projections

| Month | Active Fleet | Deliveries / Day | Monthly Orders | Monthly GMV | Platform Delivery Margin |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **M1** | 60 Riders | 600 orders | 18,000 orders | ₦77,400,000 | ₦4,680,000 |
| **M3** | 140 Riders | 1,680 orders | 50,400 orders | ₦216,720,000 | ₦13,104,000 |
| **M6** | 300 Riders | 4,200 orders | 126,000 orders | ₦541,800,000 | ₦32,760,000 |
| **M12**| 500 Riders | 7,500 orders | 225,000 orders | ₦967,500,000 | ₦58,500,000 |

---

## 16. Rider Operations Team Structure & Headcount

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       RIDER OPERATIONS TEAM BUDGET (MONTHLY)                           │
├─────────────────────┬───────┬──────────────────┬───────────────────────────────────────┤
│ Role                │ Head  │ Base Salary      │ Variable Incentives & Quotas          │
├─────────────────────┼───────┼──────────────────┼───────────────────────────────────────┤
│ Rider Success Lead  │ 1     │ ₦250,000 / month │ • Bonus tied to fleet retention (>60%)│
│                     │       │                  │ • Quota: 300 active riders managed    │
│ Rider Ops Coord     │ 2     │ ₦150,000 / month │ • Bonus tied to 24h KYC SLA           │
│                     │       │                  │ • Handles calls, tickets & insurance  │
│ Field Reps          │ 2     │ ₦100,000 / month │ • ₦1,500 spiff per verified rider     │
│                     │       │                  │ • Quota: 40 field audits / month      │
│ Bike Coordinator    │ 1     │ ₦120,000 / month │ • Manages rental & lease portfolios   │
├─────────────────────┼───────┼──────────────────┼───────────────────────────────────────┤
│ TOTAL TEAM SALARY   │ 6     │ ₦870,000 / month │ Variable incentive pool: ~₦300,000    │
├─────────────────────┴───────┴──────────────────┴───────────────────────────────────────┤
│ Program Overhead: Community Meetups (₦80K) + Training Gear (₦200K) + Insurance (₦300K) │
│ TOTAL MONTHLY RIDER OPERATIONS BUDGET: ₦1,750,000                                      │
│ BREAK-EVEN REQUIREMENT: 18 Fully-Utilized Active Riders (Self-funding at 18x scale)    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 17. 90-Day Execution Roadmap

```
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                            THE 90-DAY RIDER LAUNCH CADENCE                            │
 └──────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
[ Days 1–30: Foundation ]           [ Days 31–60: Expansion ]           [ Days 61–90: Scale ]
• Hire Lead + 1 Coord + 1 Rep       • Hire 2nd Coord + Bike Coord       • All 4 clusters live
• Ink MyCoverGenius partnership     • Launch WhatsApp Captaincy         • 300 active vetted fleet
• Sign 10 mechanic workshops        • Roll out fuel card discounts      • Lease-to-own live (50 max)
• 60 active riders in Tanke         • 140 active riders across Tanke/GRA• 25% monthly churn target
```

---

## 18. Synthesis: Operational Golden Rules

1. **Lead with Daily Net Cash:** Never talk about platform equity or vision to motorcycle riders. Show them the exact ₦9,550 daily net profit after fuel.
2. **Never Compromise the Guarantor Gate:** A missing or unverified guarantor guarantees inventory loss. Verify every guarantor by voice and address.
3. **Handle Insurance Paperwork End-to-End:** When an accident happens, ops files the claim and pays the clinic upfront. A rider in pain cannot fill out insurance PDFs.
4. **Build Community, Not a Gig Pool:** Riders stay because of the monthly hot meals, their elected captain, and peer recognition—not just an algorithm.
5. **Protect the 45-Second Dispatch SLA:** Quick offer turnover keeps customer food hot and rider engines moving. Respect their time on the road.
