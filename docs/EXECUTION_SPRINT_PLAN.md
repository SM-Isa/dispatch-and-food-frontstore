# 📘 30-DAY OPERATIONAL EXECUTION SPRINT PLAN (ARTIFACT 20)

> **Document Type:** Operational Launch Playbook, Day-by-Day Sprint Cadence & Go/No-Go Decision Gate  
> **Trigger Event:** Capital Close (₦55M Pre-Seed / Google Cloud Grant Approval) & Official "Go" Signal  
> **Primary Launch Cluster:** Tanke Cluster (University of Ilorin Corridor), Ilorin, Kwara State  
> **Sprint Objective:** From zero live transactions to **200 onboarded vendors**, **100 verified riders**, and **2,000 completed orders** in 30 days.  
> **Budget Allocation:** ₦22,000,000 – ₦24,000,000 NGN  

---

## 20.1 Core Sprint Principles

The 30-day sprint bridges our strategic specifications into real-world marketplace operations in Ilorin. Six strict operational rules govern this period:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SIX NON-NEGOTIABLE SPRINT EXECUTION RULES                       │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ Rule                     │ Implementation Directive                                    │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 1. Working Over Perfect  │ 200 vendors, 100 riders, 2,000 orders. Ship to enable this. │
│ 2. Field First, Code 2nd │ If forced between minor UI polish and onboarding 5 bukkas,  │
│                          │ we prioritize vendor supply. Supply generates liquidity.    │
│ 3. Zero New Features     │ Specs (Artifacts 1–19) are locked. All "what if" ideas      │
│                          │ are moved to Month 2 backlog. Execution only.               │
│ 4. Single North Star     │ First-order conversion and 35-min delivery completion rate. │
│ 5. Hourly Comms Cadence  │ 09:00 standup, 18:00 all-hands update, live Slack #issues.  │
│ 6. Sleep Is Mandatory    │ 8 hours minimum. Burnout in Week 2 destroys Weeks 3 and 4.  │
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 20.2 Pre-Sprint Prerequisites (Day 0 Gate)

Before Day 1 begins, the following operational, legal, technical, and logistical prerequisites must be physically verified:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DAY 0 PREREQUISITE GATE                                │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ Legal & Corporate        │ ☑ Nigerian entity incorporated (CAC RC Number active)       │
│                          │ ☑ Corporate bank account operational (GTBank / Access)      │
│                          │ ☑ Tax Identification Number (TIN) issued                    │
│                          │ ☑ NDPR Data Protection audit filing registered              │
│                          │ ☑ Founder IP Assignment & Reverse Vesting Agreements signed │
│                          │ ☑ Third-party fleet insurance policy engaged                │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Financial & Payment Rails│ ☑ Pre-seed capital wired (₦55M) or GCP credits approved    │
│                          │ ☑ Monnify & Korapay BaaS merchant accounts verified         │
│                          │ ☑ Automated payout disbursement API credentials tested     │
│                          │ ☑ Initial ₦4M operational cash float deposited              │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Cloud & AI Infrastructure│ ☑ GCP Project `dispatch-prod` created with billing linked   │
│                          │ ☑ Terraform bootstrap applied (`infra/environments/prod`)   │
│                          │ ☑ Secret Manager populated (JWT, PSP keys, Meta tokens)     │
│                          │ ☑ Gemini 1.5 Flash & Pro APIs active with quota confirmed    │
│                          │ ☑ Memorystore Redis 7 & Cloud SQL PostgreSQL 16 provisioned │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Core Launch Team (8 Pax) │ ☑ 2 Backend Engineers (NestJS, Ledger, Dispatch)            │
│                          │ ☑ 1 Mobile Engineer (Flutter Rider App)                     │
│                          │ ☑ 1 Frontend Engineer (Next.js Vendor Portal & Customer PWA)│
│                          │ ☑ 1 Vendor Ops Lead + 1 Rider Ops Lead                      │
│                          │ ☑ 1 Field Coordinator + 1 Growth Marketing Lead             │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Physical Launch Kit      │ ☑ 4 Field tablets loaded with camera scanning PWA           │
│                          │ ☑ 200 Branded T-shirts (Riders, merchant ambassadors)       │
│                          │ ☑ 5,000 Tanke launch discount flyers                        │
│                          │ ☑ 500 Vendor counter QR stickers & table-talkers            │
│                          │ ☑ 300 Certified motorcycle helmets + 20 thermal food bags   │
│                          │ ☑ Tanke Rider Training room reserved (2-hour blocks daily)  │
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 20.3 The Three Parallel Execution Tracks

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THREE PARALLEL EXECUTION TRACKS                           │
├────────────────────┬──────────────────────────────────┬────────────────────────────────┤
│ Track              │ Dedicated Personnel              │ 30-Day Sprint Mandate          │
├────────────────────┼──────────────────────────────────┼────────────────────────────────┤
│ Track A:           │ CTO, 2 Backend Engineers,        │ • Prod cluster live Day 1      │
│ Engineering        │ 1 Mobile Eng, 1 Frontend Eng     │ • Sub-400ms API latency        │
│                    │                                  │ • Zero ledger discrepancies    │
├────────────────────┼──────────────────────────────────┼────────────────────────────────┤
│ Track B:           │ Vendor Ops Lead,                 │ • 200 vendors onboarded        │
│ Vendor Operations  │ Field Coordinator                │ • 100 Tier-1 anchor canteens   │
│                    │                                  │ • Sub-90s AI menu digitization │
├────────────────────┼──────────────────────────────────┼────────────────────────────────┤
│ Track C:           │ Rider Ops Lead,                  │ • 100 verified riders (₦500K)  │
│ Rider & Growth     │ Growth Lead, CEO                 │ • 1,000 unique customers       │
│                    │                                  │ • 2,000 completed orders       │
└────────────────────┴──────────────────────────────────┴────────────────────────────────┘
```

---

## 20.4 Week 1: Foundation & The First Real Delivery (Days 1–7)

*Theme: Infrastructure goes live on production, the first 45 vendors are onboarded, and the first 130 live orders are fulfilled.*

### Day 1 (Monday) — All-Hands Launch & Production Provisioning
* **09:00 – 11:00:** All-hands kickoff meeting. CEO presents milestones; track leads present day-by-day roadmaps.
* **11:00 – 18:00 (Track A - Engineering):**
  * Execute `terraform apply` in `infra/environments/prod`.
  * Run PostgreSQL DDL (`database/ddl.sql`) and seed base system wallets (`database/seed.sql`).
  * Deploy NestJS API to Cloud Run; verify `https://api.dispatch.ng/health` returns `200 OK`.
  * Deploy Next.js Vendor Portal to `https://vendor.dispatch.ng`.
  * Distribute Flutter rider app internal APK build via Firebase App Distribution.
* **13:00 – 18:00 (Track B - Vendor Ops):** Call 10 pre-screened Tanke vendors; schedule 8 on-site onboarding visits for Day 2.
* **13:00 – 18:00 (Track C - Rider Ops & Growth):** Call 10 pre-screened motorcycle riders; schedule 6 guarantor document verification reviews. Verify WhatsApp Business Cloud API webhooks.
* **18:00 – 18:30:** Day 1 All-Hands Sync. Review blockers.

### Day 2 (Tuesday) — First Vendor Menu Scan & First Rider Verification
* **Track B:** Deploy field kit to Vendor 1 (Tanke bukka). Execute Gemini 1.5 Flash menu photo scan. Verify 14 dishes extracted in 8 seconds. Vendor confirms prices and goes live. Onboard 3 vendors total.
* **Track C:** Screen Rider 1. Verify ₦500,000 guarantor bond via direct phone verification with local community leader. Complete motorcycle mechanical inspection (brakes, lights, tires). Screen 2 riders total.
* **Track A:** Place internal simulated end-to-end test order. Validate Monnify webhook callback, zero-sum double-entry ledger entries, and WebSocket delivery tracking.
* **Deliverables:** 3 live vendors, 2 verified riders, 1 successful test transaction.

### Day 3 (Wednesday) — First Live Public Customer Order
* **Track C:** Send inaugural WhatsApp broadcast to the first 500 pre-launch UNILORIN student signups:  
  *"We are officially live in Tanke! First 100 orders get free delivery. Reply to this chat with your lunch order!"*
* **11:00 – 14:00 (The First Rush):** First live customer order placed via WhatsApp. Order parsed by Gemini 1.5 Pro, accepted by Rider 1, prepared by Vendor 1, and delivered in 28 minutes.
* **Track A:** Monitor live Cloud Logging and BigQuery CDC streams. Fix edge-case address normalization errors in real-time.
* **Deliverables:** First live customer order delivered; 5–10 orders processed; 10 cumulative vendors; 8 cumulative riders.

### Days 4–7 (Thursday – Sunday) — Volume Ramp & First Weekend Peak
* **Day 4 (Thursday):** Push volume to 30 cumulative orders. Onboard 10 additional vendors. Execute first daily automated bank payout to riders (`POST /api/payouts`).
* **Day 5 (Friday):** Launch "Friday Night Campus Combos" in Tanke. Process 25 orders between 18:00 and 22:00. Cumulative: 60 orders, 30 vendors, 20 riders.
* **Day 6 (Saturday):** First high-volume weekend stress test. Target: 50 orders in a single day. All hands on-call. Support ticket response time verified under 5 minutes.
* **Day 7 (Sunday):** Operations stand-down from 12:00–18:00 for rest. 18:00: Week 1 Retrospective.
* **Week 1 Exit Criteria Checklist:**
  - [x] 130+ cumulative orders completed.
  - [x] 45 active vendors live on platform.
  - [x] 30 verified riders with active guarantor bonds.
  - [x] Zero P1 critical infrastructure downtime incidents in prior 48 hours.
  - [x] P95 delivery transit time $< 36\text{ minutes}$.

---

## 20.5 Week 2: Vendor Supply Acceleration & Fleet Expansion (Days 8–14)

*Theme: Accelerate vendor onboarding from 45 to 100; expand active fleet from 30 to 70 riders; conduct first structured rider safety school.*

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 WEEK 2 EXECUTION CADENCE                               │
├─────────┬──────────────────────┬───────────────────────────────┬───────────────────────┤
│ Day     │ Engineering (A)      │ Vendor Operations (B)         │ Rider & Growth (C)    │
├─────────┼──────────────────────┼───────────────────────────────┼───────────────────────┤
│ Day 8   │ Performance tuning:  │ Field blitz: Onboard 10 bukkas│ Screen 8 new riders;  │
│         │ API P95 < 350ms      │ (55 cumulative)               │ 38 cumulative riders  │
├─────────┼──────────────────────┼───────────────────────────────┼───────────────────────┤
│ Day 9   │ Dispatch clustering  │ Field blitz: Onboard 10 bukkas│ Rider Training Cohort │
│         │ fair-sharing fixes   │ (65 cumulative)               │ #1 (8 riders, 2 hrs)  │
├─────────┼──────────────────────┼───────────────────────────────┼───────────────────────┤
│ Day 10  │ Run k6 load test     │ Ingest 10 new menus via PWA   │ 54 cumulative riders; │
│         │ (100 orders/min)     │ (75 cumulative)               │ Launch student referral│
├─────────┼──────────────────────┼───────────────────────────────┼───────────────────────┤
│ Day 11  │ Mobile GPS drift     │ Top-10 vendor weekly review:  │ 60 cumulative riders; │
│         │ filter improvements  │ earnings and best-sellers     │ distribute 1,000 flyers│
├─────────┼──────────────────────┼───────────────────────────────┼───────────────────────┤
│ Day 12  │ BigQuery feature     │ Onboard 10 evening suya grills│ "Weekend Family Pack" │
│         │ pipeline validation  │ (85 cumulative)               │ WhatsApp campaign     │
├─────────┼──────────────────────┼───────────────────────────────┼───────────────────────┤
│ Day 13  │ On-call peak support │ Ops support on high-volume    │ Peak Volume Test 2:   │
│         │ (20 orders/hour)     │ kitchen order boards          │ 100 orders in one day │
├─────────┼──────────────────────┼───────────────────────────────┼───────────────────────┤
│ Day 14  │ SRE database audit   │ Rest / Prep Week 3            │ Week 2 Retrospective  │
└─────────┴──────────────────────┴───────────────────────────────┴───────────────────────┘
```

* **Week 2 Exit Criteria:**
  - [x] 100 cumulative vendors live on platform.
  - [x] 70 verified riders equipped with helmets and delivery boxes.
  - [x] 500 cumulative orders completed.
  - [x] Order acceptance rate $> 85\%$.
  - [x] Customer dispute/complaint rate $< 4.5\%$.

---

## 20.6 Week 3: Customer Retention & Quality Enforcement (Days 15–21)

*Theme: Trigger automated retention loops on Week 1 & 2 customer cohorts; optimize rider dispatch density; enforce merchant preparation quality.*

* **Day 15 (Monday) — Cohort Retention Engine Launch:**
  * Automated WhatsApp re-engagement blast to the 400+ customers who ordered in Week 1:  
    *"Missing your favorite Amala from Iya Meta? Order today and get ₦300 off your lunch."*
  * Target: Achieve a 25% Day-7 cohort repeat purchase rate.
* **Day 16 (Tuesday) — Rider Training School Cohort 2:**
  * Train 15 new motorcycle riders on customer etiquette, app usage, and road safety. Cumulative fleet reaches 80 riders.
* **Day 17 (Wednesday) — Mid-Sprint Operational Audit:**
  * Benchmark progress against Day 30 milestones:
    * *Vendors:* 110 / 200 (55% of target).
    * *Riders:* 80 / 100 (80% of target).
    * *Orders:* 800 / 2,000 (40% of target).
    * *Action Adjustment:* Vendor onboarding is slightly behind pace. Temporarily reassign the Field Coordinator and 1 Growth Rep to full-time vendor menu scanning.
* **Days 18–20 (Thursday – Saturday) — Supply Quality & Peak Test 3:**
  * Vendor Ops Lead conducts in-person audits of the bottom 15 vendors generating $<3$ orders/week to re-photograph menus and adjust pricing.
  * Saturday Peak Volume Test 3: Achieve **150 completed orders in a single day**.
* **Day 21 (Sunday) — Week 3 Retrospective:**
  * **Deliverables:** 140 cumulative vendors, 90 verified riders, 1,200 cumulative orders, 40% repeat order rate.

---

## 20.7 Week 4: Final Sprint to Targets & Metric Closure (Days 22–30)

*Theme: Final operational push across all three tracks to close out the Day 30 targets.*

* **Day 22 (Monday) — Executive Field Blitz:**
  * CEO and CTO join the vendor ops team in Tanke for full-day field onboarding. Onboard 20 bukkas in 8 hours. Cumulative vendors reach 160.
* **Day 23 (Tuesday) — Final Rider Verification Batch:**
  * Screen and verify the final 10 riders. Cumulative fleet hits the **100 verified rider target**.
* **Day 24 (Wednesday) — High-Volume Stress Test:**
  * Target: Achieve **200 completed orders in a single day**.
* **Day 25 (Thursday) — Vendor NPS Audit:**
  * Survey all 180+ vendors via WhatsApp and in-person visits: *"Would you recommend Dispatch to another vendor?"* Target: $\ge +40\text{ NPS}$.
* **Day 26 (Friday) — Customer NPS Audit:**
  * Survey all customers with 3+ completed orders. Target: $\ge +40\text{ NPS}$.
* **Day 27 (Saturday) — Peak Order Record:**
  * Target: Achieve **250 completed orders in one day**.
* **Days 28–29 (Sunday – Monday) — Gap Closure:**
  * Close any remaining delta across vendors ($<200$) or total orders ($<2,000$).
* **Day 30 (Tuesday) — Final Deliverables Pull & Team Dinner:**
  * Pull production database analytics; tally final 30-day KPIs; celebrate with all-hands team dinner in Ilorin.

---

### Day 30 Final Deliverable Scorecard

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DAY 30 FINAL METRIC SCORECARD                             │
├───────────────────────────────────┬──────────────┬───────────────┬─────────────────────┤
│ Metric Description                │ Sprint Target│ Minimum Pass  │ Primary Owner       │
├───────────────────────────────────┼──────────────┼───────────────┼─────────────────────┤
│ Total Onboarded Vendors           │ 200 vendors  │ 175 vendors   │ Vendor Ops Lead     │
│ Tier-1 Core Canteens              │ 100 vendors  │ 80 vendors    │ Vendor Ops Lead     │
│ Verified Riders (₦500K Bond)      │ 100 riders   │ 85 riders     │ Rider Ops Lead      │
│ Active Weekly Riders (5+ Trips)   │ 80 riders    │ 65 riders     │ Rider Ops Lead      │
│ Cumulative Orders Fulfilled       │ 2,000 orders │ 1,600 orders  │ Growth Lead / CEO   │
│ Unique Transacting Customers      │ 1,000 users  │ 800 users     │ Growth Lead         │
│ Repeat Customer Rate (Cohort M1)  │ 35.0%        │ 28.0%         │ Growth Lead         │
│ Average Delivery Completion Time  │ < 35 minutes │ < 40 minutes  │ CTO / Rider Lead    │
│ Customer Net Promoter Score (NPS) │ > +40        │ > +30         │ Growth Lead         │
│ Vendor Net Promoter Score (NPS)   │ > +40        │ > +30         │ Vendor Ops Lead     │
│ Gemini AI Menu Extraction F1      │ > 0.90       │ > 0.85        │ CTO                 │
│ Cloud Infrastructure Uptime       │ > 99.5%      │ > 99.0%       │ CTO                 │
│ Unresolved P1 Incidents           │ 0 incidents  │ 0 incidents   │ CTO                 │
└───────────────────────────────────┴──────────────┴───────────────┴─────────────────────┘
```

> **Sprint Success Threshold:** Achieving $\ge 9$ of the 13 metrics above constitutes a passing sprint, authorizing the expansion into Cluster 2 (GRA).

---

## 20.8 Daily Operational Cadence & Synchronizations

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DAILY RECURRING TEAM CADENCE                              │
├─────────────┬───────────────────────────┬──────────────────────────────────────────────┤
│ Time (WAT)  │ Meeting / Check-In        │ Attendees & Core Objective                   │
├─────────────┼───────────────────────────┼──────────────────────────────────────────────┤
│ 09:00–09:15 │ Leadership Standup        │ CEO, CTO, Ops Leads, Growth Lead.            │
│             │ (15 mins strictly)        │ 1 thing done yesterday, 1 today, blockers.   │
├─────────────┼───────────────────────────┼──────────────────────────────────────────────┤
│ 12:30–12:35 │ Midday Field Check-In     │ Field Reps & Ops Leads via WhatsApp group:   │
│             │ (Asynchronous WhatsApp)   │ Morning vendors visited, contracts signed.   │
├─────────────┼───────────────────────────┼──────────────────────────────────────────────┤
│ 18:00–18:30 │ All-Hands Daily Sync      │ Entire 8-person team. Review daily metric    │
│             │ (30 mins)                 │ dashboard, log wins, triage open issues.     │
├─────────────┼───────────────────────────┼──────────────────────────────────────────────┤
│ Real-Time   │ Slack `#issues-live`      │ Any system error, rider accident, or vendor  │
│             │ Channel                   │ walkout posted immediately. Zero lag.        │
└─────────────┴───────────────────────────┴──────────────────────────────────────────────┘
```

### Live Metabase Command Dashboard
A centralized dashboard auto-refreshed every 5 minutes displays:
1. **Real-time Orders:** Today vs. daily target.
2. **Cumulative Supply:** Live vendors and active riders vs. sprint trajectory.
3. **Delivery Latency:** P50 transit time and P95 delivery completion duration.
4. **Financial Health:** Gross GMV, cumulative escrow balance, and pending payouts.
5. **Open Support Tickets:** Unresolved customer WhatsApp inquiries $> 10\text{ minutes}$.

---

## 20.9 Detailed Roles & RACI Matrix

```
┌───────────────────┬────────────────┬────────────────┬────────────────┬────────────────┐
│ Responsibility    │ Responsible    │ Accountable    │ Consulted      │ Informed       │
├───────────────────┼────────────────┼────────────────┼────────────────┼────────────────┤
│ Production Uptime │ CTO            │ CTO            │ Backend Engs   │ All Team       │
│ Double-Entry Math │ Backend Eng 1  │ CTO            │ Finance Lead   │ CEO            │
│ Vendor Quota (200)│ Vendor Lead    │ Vendor Lead    │ Field Coord    │ CEO            │
│ Rider Fleet (100) │ Rider Lead     │ Rider Lead     │ Field Coord    │ CEO            │
│ Customer Orders   │ Growth Lead    │ CEO            │ Vendor Lead    │ All Team       │
│ Investor Comms    │ CEO            │ CEO            │ CTO            │ Advisory Board │
└───────────────────┴────────────────┴────────────────┴────────────────┴────────────────┘
```

* **Chief Executive Officer (CEO):** Accountable for overall sprint target delivery, weekly investor reporting, top-20 vendor VIP management, and regulatory compliance.
* **Chief Technology Officer (CTO):** Accountable for 99.5% cloud availability, zero ledger discrepancies, Gemini API performance, and on-call SRE incident triage.
* **Backend Engineer 1 (Fintech & Orders):** Owns Monnify/Korapay virtual account generation, webhook processing, order status transitions, and double-entry ledger audits.
* **Backend Engineer 2 (Dispatch & Geospatial):** Owns Redis candidate matching, BullMQ distributed locks, GPS heartbeat compression, and WhatsApp bot logic.
* **Mobile Engineer (Flutter):** Owns the Android rider application, real-time map tracking, offline state handling, and rapid bug fix turnaround.
* **Frontend Engineer (Next.js):** Owns the Vendor Portal camera uploader (`MenuDigitizer.tsx`), customer tracking web view, and live order board.
* **Vendor Operations Lead:** Owns merchant acquisition, the 65-minute onboarding protocol, physical QR counter signage, and merchant NPS.
* **Rider Operations Lead:** Owns rider vetting, ₦500,000 guarantor legal verification, safety equipment distribution, and daily rider bank payouts.
* **Field Operations Coordinator:** Manages field inventory (tablets, shirts, flyers, helmets) and provides hands-on onboarding support.
* **Growth Marketing Lead:** Owns the WhatsApp broadcast loops, student ambassador networks, campus activations, and customer referral tracking.

---

## 20.10 30-Day Sprint Budget & Burn Rate

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              30-DAY OPERATIONAL SPRINT BUDGET                          │
├────────────────────────────┬──────────┬──────────┬──────────┬──────────┬───────────────┤
│ Expense Category           │ Week 1   │ Week 2   │ Week 3   │ Week 4   │ 30-Day Total  │
├────────────────────────────┼──────────┼──────────┼──────────┼──────────┼───────────────┤
│ Personnel Salaries (8 pax) │ ₦2.40M   │ ₦2.40M   │ ₦2.40M   │ ₦2.40M   │ ₦9.60M        │
│ Cloud & AI Infrastructure* │ ₦0.60M   │ ₦0.80M   │ ₦1.00M   │ ₦1.20M   │ ₦3.60M        │
│ Field Marketing & Ambass.  │ ₦0.80M   │ ₦1.00M   │ ₦1.20M   │ ₦1.50M   │ ₦4.50M        │
│ Digital & WhatsApp Promo   │ ₦0.30M   │ ₦0.40M   │ ₦0.50M   │ ₦0.60M   │ ₦1.80M        │
│ Materials (Helmets, Shirts)│ ₦1.20M   │ ₦0.30M   │ ₦0.20M   │ ₦0.10M   │ ₦1.80M        │
│ Training Venue & Logistics │ ₦0.20M   │ ₦0.30M   │ ₦0.20M   │ ₦0.30M   │ ₦1.00M        │
│ Legal, NDPR & Municipal    │ ₦0.50M   │ ₦0.10M   │ ₦0.10M   │ ₦0.10M   │ ₦0.80M        │
│ Unforeseen Contingency     │ ₦0.20M   │ ₦0.20M   │ ₦0.20M   │ ₦0.30M   │ ₦0.90M        │
├────────────────────────────┼──────────┼──────────┼──────────┼──────────┼───────────────┤
│ TOTAL WEEKLY EXPENDITURE   │ ₦6.20M   │ ₦5.50M   │ ₦5.80M   │ ₦6.50M   │ ₦24.00M       │
└────────────────────────────┴──────────┴──────────┴──────────┴──────────┴───────────────┘
```

> **Note on Google Cloud Credit Impact:** If the $350,000 Google Cloud credit grant is active on Day 1, the **₦3.60M** Cloud & AI line item drops to **₦0.00**, reducing actual sprint cash burn to **₦20.40M**.

### End-of-Sprint Cash Runway Projection:
* **Total Pre-Seed Capital Raised:** ₦55,000,000
* **Less: 30-Day Sprint Spend:** (₦24,000,000)
* **Unencumbered Cash Balance (Day 30):** **₦31,000,000 NGN** (~$20,260 USD)
* **Post-Sprint Monthly Run-Rate:** ~₦6.20M/month (steady-state headcount and marketing).
* **Guaranteed Runway:** **5.0 Months** (Extends to **8.5+ Months** with Google Cloud credit coverage).

---

## 20.11 Operational Risk Register & Mitigation Playbooks

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TOP 10 OPERATIONAL FAILURE MODES                          │
├────┬─────────────────────────────┬──────────┬──────────┬───────────────────────────────┤
│ #  │ Threat Scenario             │ Impact   │ Risk     │ Pre-Engineered Mitigation     │
├────┼─────────────────────────────┼──────────┼──────────┼───────────────────────────────┤
│ 1  │ Production crash in W1      │ Fatal    │ Medium   │ CTO on 24/7 on-call; automated│
│    │                             │          │          │ Cloud Run rollback scripts.   │
├────┼─────────────────────────────┼──────────┼──────────┼───────────────────────────────┤
│ 2  │ Vendor onboarding lag       │ High     │ High     │ Reassign field reps to assist;│
│    │                             │          │          │ streamline flow to 12 mins.   │
├────┼─────────────────────────────┼──────────┼──────────┼───────────────────────────────┤
│ 3  │ Rider guarantor slowdown    │ High     │ Medium   │ Batch phone verifications;    │
│    │                             │          │          │ tap motorcycle union bosses.  │
├────┼─────────────────────────────┼──────────┼──────────┼───────────────────────────────┤
│ 4  │ WhatsApp Business ban       │ Fatal    │ Low      │ Secondary phone pre-verified; │
│    │                             │          │          │ SMS/USSD fallback operational.│
├────┼─────────────────────────────┼──────────┼──────────┼───────────────────────────────┤
│ 5  │ Gemini API quota cap        │ High     │ Low      │ Enterprise quota pre-approved;│
│    │                             │          │          │ manual admin entry fallback.  │
├────┼─────────────────────────────┼──────────┼──────────┼───────────────────────────────┤
│ 6  │ Monnify/Korapay outage      │ High     │ Medium   │ Dual PSP failover; automated  │
│    │                             │          │          │ switch to Korapay BaaS rails. │
├────┼─────────────────────────────┼──────────┼──────────┼───────────────────────────────┤
│ 7  │ Key anchor bukka walks      │ Medium   │ Low      │ CEO personally manages top 20 │
│    │                             │          │          │ vendors; volume rebate terms. │
├────┼─────────────────────────────┼──────────┼──────────┼───────────────────────────────┤
│ 8  │ Core team burnout           │ High     │ High     │ Mandatory Sundays off; daily  │
│    │                             │          │          │ 8h sleep rule; team dinners.  │
├────┼─────────────────────────────┼──────────┼──────────┼───────────────────────────────┤
│ 9  │ Heavy monsoon rainfall      │ Medium   │ High     │ 1.3x rain tariff incentive;   │
│    │                             │          │          │ branded raincoats for fleet.  │
├────┼─────────────────────────────┼──────────┼──────────┼───────────────────────────────┤
│ 10 │ Rider order theft           │ Medium   │ Low      │ ₦500K guarantor legal bond;   │
│    │                             │          │          │ delivery photo dropoff proof. │
└────┴─────────────────────────────┴──────────┴──────────┴───────────────────────────────┘
```

---

## 20.12 Day 31 Go / No-Go Decision Gate

On **Day 31 at 10:00 WAT**, the founders and core leads convene for the **Cluster 2 (GRA) Expansion Decision Gate**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                DAY 31 DECISION CRITERIA                                │
├───────────────────────────────────────────────────────────────┬────────────────────────┤
│ Metric Threshold                                              │ Evaluation Status      │
├───────────────────────────────────────────────────────────────┼────────────────────────┤
│ 1. Minimum 9 of 13 scorecard metrics achieved                 │ Pass / Fail            │
│ 2. Unit economics confirmed: Contribution ≥ ₦800 per order    │ Pass / Fail            │
│ 3. 30-Day Customer Cohort Repeat Rate ≥ 30%                   │ Pass / Fail            │
│ 4. Rider Fleet 30-Day Retention Rate ≥ 80%                    │ Pass / Fail            │
│ 5. Vendor Net Promoter Score (NPS) ≥ +35                      │ Pass / Fail            │
│ 6. Zero unresolved P1 production infrastructure incidents     │ Pass / Fail            │
│ 7. Available unencumbered cash balance ≥ ₦25,000,000 NGN      │ Pass / Fail            │
└───────────────────────────────────────────────────────────────┴────────────────────────┘
```

### Strategic Outcomes Based on Gate Evaluation:
* **OUTCOME A: Full Green Light (7 of 7 Met):**
  * Immediately initiate **Cluster 2 (GRA) expansion** on Day 32.
  * Replicate vendor onboarding protocols for 60 GRA restaurants and corporate kitchens.
* **OUTCOME B: Conditional Extension (5 or 6 of 7 Met):**
  * Freeze expansion to GRA for 21 days.
  * Focus 100% of resources on deepening Tanke density, resolving customer repeat bottlenecks, and stabilizing rider retention.
* **OUTCOME C: Strategic Pause & Pivot ($<5$ of 7 Met):**
  * Halt all paid marketing. Convene advisory board. Re-evaluate customer pricing elasticity and merchant commission structures before redeploying remaining capital.

---

## 20.13 The Friday Investor Update Template

*Sent every Friday at 18:00 WAT without exception:*

```text
Subject: Dispatch — Week [N] Operational Sprint Update (Tanke Launch)

Hi [Investor / Advisor Name],

Here is our operational summary for Week [N] of our 30-day launch sprint in Ilorin:

HIGHLIGHTS:
- [Key Milestone 1, e.g., 52 new food vendors onboarded in Tanke; cumulative now at 142]
- [Key Milestone 2, e.g., Weekend volume record: 184 completed deliveries on Saturday]
- [Key Milestone 3, e.g., Zero ledger balance discrepancies across 1,100 transactions]

CORE METRICS DASHBOARD:
- Orders this week: [X] (Sprint Cumulative: [Y] / Target: 2,000)
- Active Vendors: [A] (Target: 200)
- Verified Riders: [B] (Target: 100)
- Transacting Customers: [C] (Target: 1,000)
- Average Delivery Duration: [D] minutes (Target: < 35 min)
- Net Contribution Margin per Order: ₦[E] (Target: ₦920)

CORE CHALLENGES & MITIGATIONS:
- [Challenge 1]: Afternoon rain slowed motorcycle dispatch by 12 minutes on Thursday.
  -> Action: Rolled out our 1.3x rain multiplier incentive to riders and equipped 40 riders with rain gear.
- [Challenge 2]: 4 bukkas experienced tablet WiFi disconnects during lunch peak.
  -> Action: Switched tablets to dedicated MTN 4G SIM backup lines.

NEXT WEEK PRIORITIES:
1. Conduct Cohort 2 Rider Training School (20 new riders).
2. Launch Day-7 customer WhatsApp retention campaign.
3. Onboard 40 additional dinner & late-night food vendors.

FINANCIAL POSITION:
- Cash in Bank: ₦[X] NGN (~$[Y] USD)
- Burn this Week: ₦[Z] NGN
- Runway Remaining: [M] Months

As always, thank you for your support. Please let us know if you have questions or feedback.

Best regards,

[Founder Name]
Co-Founder & CEO | Dispatch Technologies Ltd.
founders@dispatch.ng | https://dispatch.ng
```
