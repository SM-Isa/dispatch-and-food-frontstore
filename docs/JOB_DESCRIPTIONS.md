# 📘 FIRST-HIRE JOB DESCRIPTIONS & RECRUITMENT FRAMEWORK (ARTIFACT 21)

> **Document Type:** Production Recruitment Manual, Job Descriptions, Screening Criteria, Interview Rubrics & Compensation Schedule  
> **Target Headcount:** 8 Core Hires (Expanding to 11 by Day 30)  
> **Market Focus:** Nigerian Tech Talent Ecosystem (Pan-Nigeria Remote Engineering + Ilorin-Based Field Operations)  
> **Hiring Timeline:** Day 1 through Day 14 of 30-Day Operational Execution Sprint  
> **Hiring Budget:** ₦1,300,000 NGN (Posting fees, referral incentives & paid work trial stipends)  

---

## 21.1 Core Hiring Philosophy

In early-stage African marketplaces, talent quality and cultural alignment dictate whether an operational sprint succeeds or burns capital. Five foundational principles govern our hiring:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          FIVE RECRUITMENT & HIRING DIRECTIVES                          │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ Principle                │ Concrete Policy                                             │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 1. Trajectory > Pedigree │ A mid-level builder who has shipped production code beats a │
│                          │ corporate enterprise engineer. We value high agency.        │
│ 2. 30-Day Mutual Trial   │ Every employment contract includes a transparent 30-day     │
│                          │ mutual review clause. If not a fit, we part ways cleanly.   │
│ 3. Market-Rate Pay       │ We pay competitive Lagos market rates—not depressed tier-2  │
│                          │ local rates—to recruit top national engineering talent.     │
│ 4. Universal Equity      │ Every full-time hire receives real vesting equity (4-year   │
│                          │ schedule with a 1-year cliff), fostering owner mentality.   │
│ 5. Location Discipline   │ Engineering is 100% remote across Nigeria. Field Operations │
│                          │ must reside in Ilorin. Boots-on-the-ground cannot be remote.│
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 21.2 The Eight Prioritized Launch Roles

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             PRIORITIZED RECRUITMENT SCHEDULE                           │
├────┬─────────────────────────────┬────────────────────┬──────────────────┬─────────────┤
│ P# │ Role Title                  │ Location & Mode    │ Monthly Base Comp│ Hire Target │
├────┼─────────────────────────────┼────────────────────┼──────────────────┼─────────────┤
│ 1  │ Senior Backend Engineer     │ Remote (Nigeria)   │ ₦500K – ₦700K    │ Day 1       │
│ 2  │ Backend Engineer (Dispatch) │ Remote (Nigeria)   │ ₦400K – ₦600K    │ Day 1       │
│ 3  │ Mobile Engineer (Flutter)   │ Remote (Nigeria)   │ ₦400K – ₦550K    │ Day 5       │
│ 4  │ Frontend Engineer (Next.js) │ Remote (Nigeria)   │ ₦350K – ₦500K    │ Day 10      │
│ 5  │ Vendor Operations Lead      │ Ilorin (On-Site)   │ ₦250K – ₦350K*   │ Day 1       │
│ 6  │ Rider Operations Lead       │ Ilorin (On-Site)   │ ₦250K – ₦350K*   │ Day 1       │
│ 7  │ Field Operations Coord.     │ Ilorin (On-Site)   │ ₦180K – ₦250K*   │ Day 3       │
│ 8  │ Growth Marketing Lead       │ Remote or Ilorin   │ ₦300K – ₦450K    │ Day 7       │
├────┴─────────────────────────────┴────────────────────┴──────────────────┴─────────────┤
│ * Ops roles include performance bonuses (₦2,000/vendor, ₦1,500/rider, ₦500/coord).    │
│ Secondary Cohort (Day 15–30): DevOps/Platform (₦600K), AI/ML Engineer (₦750K), Support.│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 21.3 Full Job Descriptions, Screening Criteria & Interview Flows

---

### Role 1: Senior Backend Engineer (NestJS / Double-Entry Ledger)
* **Title:** Senior Backend Engineer — Financial Ledger & Platform Core
* **Location:** Remote (Anywhere in Nigeria)
* **Reporting to:** Chief Technology Officer (CTO)
* **Compensation:** ₦500,000 – ₦700,000 NGN/month + 0.3% – 0.8% Equity

#### The Mission
> *You will own the money layer. In our platform, not a single kobo moves without deterministic, zero-sum double-entry accounting integrity. You will build and maintain the high-concurrency PostgreSQL and NestJS services that safeguard escrow, settle merchant accounts, process driver payouts, and protect the platform against financial drift.*

#### What You Will Build
* **Double-Entry Financial Ledger Engine:** PostgreSQL schema and NestJS services enforcing immutable balance invariants (`SUM(debit) - SUM(credit) = 0`) with row-level locks (`FOR NO KEY UPDATE`).
* **Payment Gateway & BaaS Webhooks:** Resilient, idempotent webhook processors for Monnify and Korapay virtual bank account settlements.
* **Order Management System (OMS):** Real-time order lifecycle state machine with snapshot auditing (`ORD-XXXX`).
* **Automated Reconciliation Cron:** Automated reconciliation scripts detecting ghost rider balances and payment discrepancies.

#### What You Must Bring
* 4+ years of production experience with Node.js and TypeScript.
* Deep mastery of PostgreSQL (isolation levels, serializable transactions, partial indexing, execution plans).
* Production experience with NestJS (or demonstrated mastery of Express/Fastify architectures).
* Experience with Redis caching and BullMQ distributed job queues.
* Architectural intuition for race conditions, idempotency keys, and network split-brain failure modes.

#### What We Value Most
* You have previously engineered software that directly debited or credited real money.
* You care about correctness and data integrity more than hacky velocity in financial pipelines.
* You debug issues by analyzing structured JSON logs and database locks rather than adding random `console.log` statements.

#### Screening Rubric (CV & Top-of-Funnel Filter)
* **Strong Signal:** 4+ years Node/TS; speaks specifically about `SERIALIZABLE` or `READ COMMITTED` transaction boundaries; links clean, tested GitHub repositories; describes real money bugs.
* **Weak Signal:** Only tutorial-level Express code; relies exclusively on ORM magic without understanding raw SQL; vague answers regarding race conditions.

#### 4-Stage Interview Process
1. **Technical Phone Screen (60 min):** Background review (15m) + Live coding exercise in TypeScript: Implement an in-memory sliding-window rate limiter with concurrency protection (35m) + Q&A (10m).
2. **System Design Deep-Dive (90 min):** *"Design a double-entry ledger for a food delivery platform. Customers transfer via virtual bank accounts; payments are split between escrow, vendor, rider, and platform. How do you design the tables, isolation levels, and locks to handle 500 concurrent transactions safely?"*
3. **Paid 4-Hour Work Trial (Remote, ₦50,000 Stipend):** Implement a real isolated feature from our engineering backlog (e.g., an idempotent webhook retry queue with exponential backoff and HMAC-SHA256 signature verification).
4. **Founder & Culture Alignment (30 min):** Video conversation with CEO and CTO regarding startup autonomy, pace, and expectations.

---

### Role 2: Backend Engineer (NestJS / Dispatch & Geospatial)
* **Title:** Backend Engineer — Geospatial Dispatch & Real-Time Logistics
* **Location:** Remote (Nigeria)
* **Reporting to:** Senior Backend Engineer / CTO
* **Compensation:** ₦400,000 – ₦600,000 NGN/month + 0.2% – 0.5% Equity

#### The Mission
> *You will own the movement layer. When an order is placed, your engine finds the best motorcycle rider in milliseconds, broadcasts the offer, and prevents race conditions when 10 riders tap 'Accept' simultaneously.*

#### What You Will Build
* **Geospatial Candidate Matching Engine:** Redis geospatial queries (`GEOSEARCH`, `GEODIST`) evaluating rider proximity, battery level, acceptance history, and fairness quotas.
* **Distributed Offer Locking:** Atomic Redis locking (`SET key rider_id NX EX 20`) preventing duplicate offer claims.
* **WebSocket Presence Gateway:** Battery-optimized real-time WebSocket connection handling 20-second rider GPS telemetry updates.
* **Vertex AI Integration:** Ingesting demand forecast coefficients from BigQuery/Vertex endpoints to dynamically weight offer radiuses.

#### What You Must Bring
* 2–4 years of production experience in TypeScript / Node.js.
* Strong production experience with Redis data structures (specifically Sorted Sets, Hashes, and Geospatial commands).
* Experience architecting WebSocket or Socket.IO real-time event pipelines.
* Clean handling of asynchronous operations, Promise concurrency, and event-driven architectures.

#### 4-Stage Interview Process
1. **Technical Screen (60 min):** Live coding: Implement a Redis-backed atomic distributed mutex with auto-expiry.
2. **System Design (60 min):** *"Design the rider dispatch pipeline: 1 order, 25 nearby riders, 15-second acceptance window. Ensure exactly one winner wins with zero race conditions."*
3. **Paid Work Trial (4 hours, ₦50,000 Stipend):** Build a Redis geospatial clustering filter with unit tests.
4. **Culture Fit (30 min):** CTO conversation.

---

### Role 3: Mobile Engineer (Flutter)
* **Title:** Mobile Engineer — Flutter Rider App
* **Location:** Remote (Nigeria)
* **Reporting to:** CTO
* **Compensation:** ₦400,000 – ₦550,000 NGN/month + 0.2% – 0.5% Equity

#### The Mission
> *Riders are the frontline of our marketplace. You will build the Flutter application they rely on for daily income. It must operate flawlessly on budget $60 Android devices (2GB RAM, Android 9), in hot sun, across intermittent 3G networks, without draining the motorcycle rider’s battery.*

#### What You Will Build
* **Cross-Platform Rider Mobile App (Android-First):** Flutter app with responsive vector route rendering, live turn-by-turn navigation banners, and offline state recovery.
* **Background Telemetry Sync:** Battery-efficient background GPS heartbeats streaming location every 20 seconds.
* **Real-Time Dispatch Sound & HUD:** High-urgency physical audio chimes, full-screen lock screen notifications, and one-tap offer acceptance modals.
* **In-App Rider Wallet:** Real-time earnings tally, completed delivery breakdown, and automated bank withdrawal requests.

#### What You Must Bring
* 3+ years of production Flutter experience.
* Proven experience with state management (Riverpod, Bloc, or StateNotifier).
* Deep understanding of Android background services, wake-locks, and battery optimization.
* Production experience with Firebase Cloud Messaging (FCM) high-priority data payloads.
* At least two live apps published on the Google Play Store (links required).

#### Interview Structure
1. **App Audit & Technical Screen (60 min):** Code walkthrough of candidate's live Play Store apps; discussion of Android lifecycle memory management and Riverpod architectures.
2. **Code Review Exercise (60 min):** Review an intentionally buggy Flutter sample containing memory leaks in location streams and improper `setState` calls.
3. **Paid Work Trial (4 hours, ₦50,000 Stipend):** Build a resilient offline location buffer that caches GPS fixes locally in SQLite when offline and flushes to an API when connectivity returns.
4. **Culture Fit (30 min):** CTO + Rider Ops Lead.

---

### Role 4: Frontend Engineer (Next.js)
* **Title:** Frontend Engineer — Vendor Portal & Customer PWA
* **Location:** Remote (Nigeria)
* **Reporting to:** CTO
* **Compensation:** ₦350,000 – ₦500,000 NGN/month + 0.15% – 0.4% Equity

#### The Mission
> *You will engineer the visual interfaces that merchants and customers interact with. You will build our lightning-fast SSR customer web storefronts that render under 1.5 seconds on 3G connections, and our interactive Vendor Portal with live camera menu scanning.*

#### What You Will Build
* **Vendor Portal Web App:** Responsive Next.js 14 dashboard featuring drag-and-drop menu photo scanning (`MenuDigitizer.tsx`), real-time kitchen ticket board, and live audio order alerts.
* **Customer Storefront & PWA:** Ultra-lightweight customer ordering web app with instant virtual account checkout and SVG vector delivery tracking.
* **Internal Ops Admin Console:** Financial reconciliation dashboards, dispute resolution tooling, and cluster geographic controls.

#### What You Must Bring
* 3+ years of experience with React, Next.js (App Router), and TypeScript.
* Advanced Tailwind CSS for clean, responsive, mobile-first layouts.
* Deep appreciation for Core Web Vitals (LCP $< 2.0\text{s}$, INP $< 100\text{ms}$ on low-end mobile devices).
* Experience with HTML5 Canvas / Web Audio API for interactive elements and sound alerts.

---

### Role 5: Vendor Operations Lead
* **Title:** Vendor Operations Lead — Merchant Acquisition & Retention
* **Location:** Ilorin, Kwara State (100% On-Site / Field-Facing)
* **Reporting to:** Chief Executive Officer (CEO)
* **Compensation:** ₦250,000 – ₦350,000 NGN/month Base + ₦2,000 per Tier-1 Onboarded Bukka (Target: ₦400K–₦450K/mo) + ₦80K Transport Allowance + 0.15% – 0.3% Equity

#### The Mission
> *This is not a desk job. You will be on the streets of Tanke, GRA, and Fate daily. You will establish trust with 200+ local food vendors (bukkas, canteens, roadside grills), photograph their menus with our AI tool, and guide them through their first 30 days of online sales.*

#### What You Will Do
* **Door-to-Door Merchant Acquisition:** Visit 15+ candidate food vendors daily across assigned commercial clusters.
* **65-Minute Onboarding Protocol:** Photograph paper/chalkboard menus, audit Gemini AI output on our field tablet, verify bank account details, and install physical QR counter signage.
* **Merchant Success & Churn Prevention:** Monitor daily kitchen order volume; conduct physical check-ins with vendors doing $<3$ orders/week to optimize prices or availability.
* **Manage Field Representatives:** Direct two field sales reps and one coordinator to ensure daily acquisition quotas are met.

#### What You Must Bring
* 3+ years of field sales, merchant acquiring, or retail ops experience in Nigeria.
* Complete fluency in English and Yoruba (familiarity with Kwara/Ilorin colloquial expressions preferred).
* Deep local knowledge of Ilorin neighborhoods, markets, and dining culture.
* High emotional intelligence and resilience; ability to connect respectfully with informal marketplace matriarchs (*Iya Alaje*).
* Own personal transportation (motorcycle or car) with valid licensing.

#### Interview Structure
1. **Screening Call (30 min):** Track record in field sales, grit, and local commercial ties.
2. **Live Field Shadow (Half-Day):** Candidate accompanies a founder on 4 real merchant visits in Tanke. We evaluate their natural rapport, body language, and ability to handle merchant skepticism.
3. **Role-Play Pitch (45 min):** Candidate pitches a skeptical buka owner who insists *"I don't need internet food; my customers already know me."*
4. **Final Culture Alignment (30 min):** CEO interview.

---

### Role 6: Rider Operations Lead
* **Title:** Rider Operations Lead — Fleet Recruitment, Training & Safety
* **Location:** Ilorin, Kwara State (100% On-Site)
* **Reporting to:** CEO / Ops Director
* **Compensation:** ₦250,000 – ₦350,000 NGN/month Base + ₦1,500 per Verified Active Rider (Target: ₦400K/mo) + ₦80K Transport Allowance + 0.15% – 0.3% Equity

#### The Mission
> *Motorcycle dispatch riders are the backbone of our service. You will recruit, vet, train, and retain a fleet of 100+ professional riders in Ilorin. You will build a supportive, high-accountability rider culture where riders earn a predictable living and wear their helmets with pride.*

#### What You Will Do
* **Fleet Recruitment Pipeline:** Partner with local commercial motorcycle associations (ACOMORAN, AMORAN) and fuel station hubs to source 300+ applicant riders.
* **Guarantor Verification Protocol:** Enforce the ₦500,000 legal indemnity bond verification for every rider, conducting direct voice calls and physical address confirmations.
* **Conduct Rider Training School:** Lead weekly 2-hour onboarding cohorts covering defensive driving, customer etiquette, app usage, and MyCoverGenius microinsurance.
* **Community Leadership:** Moderate the official Rider WhatsApp community; run monthly Rider Captain award ceremonies; manage incident resolutions and dispute claims.

#### What You Must Bring
* 3+ years of logistics, fleet management, or gig-community operational experience in Nigeria.
* Strong understanding of Nigerian motorcycle culture, transport union dynamics, and local transit ordinances.
* Fluency in English and Yoruba.
* High integrity and firmness; ability to enforce safety compliance and handle disciplinary suspensions objectively without escalating tension.

---

### Role 7: Field Operations Coordinator
* **Title:** Field Operations Coordinator — Logistics, Inventory & Data Scheduling
* **Location:** Ilorin, Kwara State (On-Site)
* **Reporting to:** Vendor & Rider Ops Leads
* **Compensation:** ₦180,000 – ₦250,000 NGN/month Base + ₦500 per Successful Onboarding + ₦60K Transport Allowance + 0.05% – 0.15% Equity

#### The Mission
> *You are the operational glue. You ensure field sales reps have daily route schedules, tablets are charged, merchant signage is printed, rider helmets are inventoried, and every signed guarantor document is uploaded to the CRM.*

#### What You Will Do
* Plan and optimize daily travel routes for field onboarding reps across Tanke and GRA.
* Inventory management: Track branded T-shirts, thermal delivery boxes, helmets, table-talkers, and tablets.
* Verify incoming KYC documents (ID photos, utility bills, guarantor forms) for completeness before account activation.
* Provide on-site logistical support during rider training workshops and merchant field activations.

#### What You Must Bring
* 1–3 years of operational administration, dispatch scheduling, or field logistics experience.
* Methodical attention to detail and zero tolerance for lost paperwork.
* Fluency in English and Yoruba; proficiency with Google Sheets / Excel.
* Own transportation.

---

### Role 8: Growth Marketing Lead
* **Title:** Growth Marketing Lead — Hyperlocal Customer Acquisition
* **Location:** Remote or Ilorin
* **Reporting to:** Chief Executive Officer (CEO)
* **Compensation:** ₦300,000 – ₦450,000 NGN/month + 0.2% – 0.4% Equity

#### The Mission
> *You will acquire the first 10,000 transacting customers in Ilorin. You will turn WhatsApp from a simple chat app into our primary growth engine, designing viral referral loops and hyper-targeted campus campaigns that keep blended CAC under ₦1,400.*

#### What You Will Do
* **WhatsApp Commerce Growth:** Design and execute viral WhatsApp Status campaigns, broadcast promotions, and community group drops across University of Ilorin student bodies and GRA residential associations.
* **Manage Referral Mechanics:** Optimize the symmetric ₦500 customer referral loop, monitoring virality coefficients and fraud rings.
* **Campus & Field Activations:** Direct student brand ambassadors; organize targeted flyer distributions during peak lunchtime lecture breaks.
* **Cohort Analytics:** Track weekly CAC, LTV, Day-7 and Day-30 retention curves, and channel payback periods in Metabase.

#### What You Must Bring
* 3+ years of growth marketing experience in Nigerian consumer tech, delivery, or fintech.
* Proven track record scaling organic referral loops and WhatsApp-first marketing.
* Fluency with Meta Ads Manager (local geo-fencing) and SQL/Sheets cohort analysis.
* Authentic copywriting that speaks the natural language of Nigerian youth without sounding like corporate jargon.

---

## 21.4 Structured Interview Scorecards & Rating Rubrics

All interviewers submit independent scores on a **1 to 5 scale** immediately following candidate sessions:
* `1 = Strong No` | `2 = No` | `3 = Neutral / Hesitant` | `4 = Yes` | `5 = Strong Yes`
* *Hiring Threshold:* Candidates must achieve $\ge 4.0$ weighted average across all rounds, with **zero ratings of 2 or below**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ENGINEERING CANDIDATE SCORECARD RUBRIC                          │
├──────────────────────────┬────────┬────────────────────────────────────────────────────┤
│ Evaluation Dimension     │ Weight │ Observable Evidence & Criteria                     │
├──────────────────────────┼────────┼────────────────────────────────────────────────────┤
│ 1. Core Technical Depth  │ 30%    │ Mastery of DB transactions, race conditions, locks │
│ 2. Code Quality & Tests  │ 20%    │ Clean TypeScript, modular structure, test coverage │
│ 3. Debugging Instinct    │ 15%    │ Analyzes root causes via logs before writing code   │
│ 4. Clear Communication   │ 15%    │ Explains complex distributed problems simply       │
│ 5. Autonomy & High Agency│ 10%    │ Proactively resolves ambiguity; biased to action   │
│ 6. Cultural Fit & Mission│ 10%    │ Enthusiastic about secondary African city logistics│
└──────────────────────────┴────────┴────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         OPERATIONS CANDIDATE SCORECARD RUBRIC                          │
├──────────────────────────┬────────┬────────────────────────────────────────────────────┤
│ Evaluation Dimension     │ Weight │ Observable Evidence & Criteria                     │
├──────────────────────────┼────────┼────────────────────────────────────────────────────┤
│ 1. Field Grit & Empathy  │ 30%    │ Comfort in informal markets; genuine respect       │
│ 2. Local Market Knowledge│ 20%    │ Intimate familiarity with Ilorin transit & culture │
│ 3. Resilience to Friction│ 20%    │ Energy remains high after multiple merchant rejections│
│ 4. Systems & Data Habits │ 15%    │ Meticulous logging of visits, phone calls, and CRM │
│ 5. Leadership & Comms    │ 15%    │ Commands respect from riders and merchant owners   │
└──────────────────────────┴────────┴────────────────────────────────────────────────────┘
```

---

## 21.5 Comprehensive Compensation & Equity Schedule

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        2026 NIGERIAN STARTUP COMPENSATION BENCHMARKS                   │
├──────────────────────────────┬──────────────────┬──────────────────┬───────────────────┤
│ Role Title                   │ Base Salary Band │ Standard Equity  │ Equity Vesting    │
├──────────────────────────────┼──────────────────┼──────────────────┼───────────────────┤
│ Senior Backend Engineer      │ ₦500K – ₦700K/mo │ 0.30% – 0.80%    │ 4 Years / 1-Yr Cl.│
│ Backend Engineer (Dispatch)  │ ₦400K – ₦600K/mo │ 0.20% – 0.50%    │ 4 Years / 1-Yr Cl.│
│ Mobile Engineer (Flutter)    │ ₦400K – ₦550K/mo │ 0.20% – 0.50%    │ 4 Years / 1-Yr Cl.│
│ Frontend Engineer (Next.js)  │ ₦350K – ₦500K/mo │ 0.15% – 0.40%    │ 4 Years / 1-Yr Cl.│
│ Vendor Operations Lead       │ ₦250K – ₦350K/mo*│ 0.15% – 0.30%    │ 4 Years / 1-Yr Cl.│
│ Rider Operations Lead        │ ₦250K – ₦350K/mo*│ 0.15% – 0.30%    │ 4 Years / 1-Yr Cl.│
│ Field Coordinator            │ ₦180K – ₦250K/mo*│ 0.05% – 0.15%    │ 4 Years / 1-Yr Cl.│
│ Growth Marketing Lead        │ ₦300K – ₦450K/mo │ 0.20% – 0.40%    │ 4 Years / 1-Yr Cl.│
│ DevOps / Platform Engineer   │ ₦500K – ₦700K/mo │ 0.20% – 0.50%    │ 4 Years / 1-Yr Cl.│
│ AI / ML Engineer             │ ₦650K – ₦850K/mo │ 0.30% – 0.60%    │ 4 Years / 1-Yr Cl.│
│ Customer Support Lead        │ ₦130K – ₦180K/mo │ 0.02% – 0.05%    │ 4 Years / 1-Yr Cl.│
└──────────────────────────────┴──────────────────┴──────────────────┴───────────────────┘
```

### Full-Time Benefits Package:
* **Comprehensive Healthcare (HMO):** High-tier medical coverage covering employee, spouse, and up to two biological children.
* **Paid Time Off:** 25 working days paid annual leave for engineering; 20 days for operations + all Nigerian federal public holidays.
* **Hardware & Workstation Allowance:** ₦500,000 upfront laptop/phone stipend upon completing the 30-day trial + ₦30,000 monthly data/power stipend.
* **Operations Mobility Allowance:** Dedicated ₦60,000 – ₦80,000 monthly transport/fuel stipend for all field-facing Ilorin staff.
* **Professional Learning Fund:** ₦100,000 annual budget for technical books, cloud certifications, and technical conferences.

---

## 21.6 Offer Workflow, Closing Scripts & Onboarding

### The Verbal Offer Call
* Made via video call by the direct Hiring Manager and CEO.
* **Closing Script:**
  > *"We were deeply impressed by your paid work trial and your architectural clarity. We are building something transformative for secondary cities in Nigeria, and we want you to own this layer of the platform. We are extending a formal offer of [₦X,000,000 base] plus [Y% equity]. We want you to take 72 hours to review the terms with your family. If you have any questions or want to discuss any line item, call us directly."*

### First Week Onboarding Schedule
* **Day 1 (System Access & Mission Orientation):**
  * Hardware configuration, GitHub/Slack/AWS-GCP access provisioned.
  * Deep-dive reading: Engineers read Artifacts 1, 5, 6, 7, and 10; Ops leads read Artifacts 14, 15, and 16.
* **Day 2 (Pairing & Shadowing):**
  * Engineers pair on a local code checkout with the CTO; Ops leads shadow an on-site merchant onboarding.
* **Day 3 (First Production Task):**
  * Engineer merges their first production pull request (passing CI/CD); Ops lead conducts their first independent merchant interview.
* **Day 4 (CEO 1-on-1):**
  * 30-minute informal check-in on tools, team communication, and initial impressions.
* **Day 5 (Week 1 Review & Goal Alignment):**
  * Agree on concrete 30-day mutual milestones required to successfully transition past the evaluation period.

---

## 21.7 Respectful Rejection Framework

A startup's reputation in the Nigerian tech ecosystem is shaped by how it treats unsuccessful applicants. We adhere to four strict rejection standards:

1. **48-Hour SLA:** Formal rejection delivered within 48 hours of the final interview. Zero ghosting.
2. **Specific, Actionable Feedback:** Brief, constructive technical feedback rather than generic platitudes.
3. **No False Promises:** We only invite candidates to reapply if we genuinely intend to consider them for future cohorts.

### Rejection Template (Post-Interview)
```text
Subject: Update on your application with Dispatch Technologies

Hi [Candidate First Name],

Thank you for the time and energy you invested in interviewing with us for the [Role Title] position, and particularly for walking through our technical exercises.

We have decided to move forward with another candidate whose background more closely matches our immediate Day-1 production requirements. 

To provide specific feedback: our team was very impressed with your [Specific Strength, e.g., clean TypeScript component architecture], but for this phase we needed deeper hands-on experience in [Specific Gap, e.g., production PostgreSQL lock management under high concurrency].

We deeply appreciate your interest in Dispatch and the work you did. We wish you every success in your current endeavors.

Warm regards,

[Hiring Manager Name]
Dispatch Technologies Ltd.
```
