# 📘 FINANCIAL MODEL & UNIT ECONOMICS (ARTIFACT 17)

> **Document Type:** Master Financial Model, Pro Forma Projections & Unit Economics Architecture  
> **Target Audience:** Google for Startups Cloud Reviewers, Venture Investors, Chief Financial Officer, Founders  
> **Target Scale:** 36-Month Pro Forma Projection (Ilorin Launch to 3-City Regional Scale)  
> **Foreign Exchange Benchmark:** ₦1,530 NGN = $1.00 USD  
> **Program Grant Benchmark:** $350,000 USD Google Cloud Credits (AI Track) $\approx ₦535,500,000\text{ NGN}$

---

## 1. Executive Summary & Model Architecture

This financial model serves as the quantitative capstone of the Dispatch Rider Aggregator & Food Vendor Storefront platform. It unifies every engineering, operational, and commercial assumption from **Artifacts 1 through 16** into a deterministic three-layer financial model.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: OPERATIONAL DRIVERS (Input Assumptions)                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Cluster Launch Cadence (Tanke ──► GRA ──► Challenge ──► Fate)                        │
│ • Active Vendor Base & Tier Mix (14.2% – 20.0% Weighted Take Rate)                     │
│ • Fleet Sizing & Rider Productivity (120 Full-Time + 80 Part-Time Riders)              │
│ • Customer Acquisition Trajectory (Blended CAC ₦2,200 ──► ₦1,400)                     │
│ • Average Food Order Value (₦3,500 Base Food Subtotal + ₦850 Delivery Fee)             │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: UNIT ECONOMICS (Per-Order & Cohort Output)                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Gross Revenue per Order: ₦1,095 (25.2% of GMV)                                       │
│ • Direct Variable Costs per Order: ₦157 (PSP toll, support, refunds)                   │
│ • Net Platform Contribution Margin: ₦920 – ₦938 (21.6% of GMV)                         │
│ • 12-Month Customer LTV: ₦12,144 (Contribution Basis)                                  │
│ • LTV:CAC Ratio: 5.5:1 (Year 1 Target)                                                 │
│ • Customer CAC Payback Window: 1.1 Months                                              │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: INSTITUTIONAL FINANCIALS (36-Month Pro Forma Statements)                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Operating Break-Even: Month 8 (Month 5 with Google Cloud Credits applied)            │
│ • Cash-Flow Break-Even: Month 15 (Month 11 with Google Cloud Credits applied)          │
│ • Pre-Break-Even Working Capital Requirement: ₦37M (~$24,000 USD)                      │
│ • Month 12 Operating Run-Rate: ₦27.38M Rev / +₦5.80M Operating Profit ($3,800/mo)      │
│ • Year 3 Scale Run-Rate: ₦1.18B Rev / +₦514M Operating Profit ($336,000/mo)           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Comprehensive Revenue Model

Platform revenue flows from four transparent, transaction-linked lines. All revenue is recognized on fulfilled deliveries.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         PER-ORDER REVENUE BREAKDOWN (BASE CASE)                        │
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│ Revenue Line Item                      │ Amount (NGN) & Economic Basis                 │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ Food Basket Subtotal                   │ ₦3,500.00 (Customer food items)               │
│ Customer Delivery Fee                  │ ₦850.00 (Distance-tiered delivery tariff)     │
│ Platform Technology Access Fee         │ ₦100.00 (Flat customer fee per receipt)       │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ GROSS MARKETPLACE VALUE (GMV)          │ ₦4,450.00 (100.0% of Checkout Total)          │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ Line 1: Vendor Commission (20.0%)      │ ₦700.00 (Retained from food subtotal)         │
│ Line 2: Delivery Margin (₦850 - ₦580)  │ ₦270.00 (Retained delivery fee spread)        │
│ Line 3: Platform Service Fee           │ ₦100.00 (Flat fee recognized as revenue)      │
│ Line 4: Payment Spread at Scale        │ ₦25.00 (0.7% PSP volume rebate at scale)      │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ TOTAL GROSS REVENUE PER ORDER          │ ₦1,095.00 (24.6% of GMV Take Rate)            │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```

### Revenue Line Specifics
1. **Vendor Commission (20.0% Base Rate):**
   * *Tier 1 Standard Vendors:* 20.0% standard commission.
   * *Tier 2 Anchor Accounts ($> ₦500\text{K/mo}$ GMV):* 18.0% volume incentive.
   * *New Vendor Onboarding Promotion:* 0% commission on the first 20 orders (welcome grant).
   * *Weighted Average at Month 12:* **19.1% across the full catalog**.
2. **Delivery Fee Spread Margin (₦270 per Order):**
   * Average customer delivery tariff: **₦850.00**.
   * Flat rider fulfillment payment: **₦580.00** (₦550 base + ₦30 distance bonus).
   * Platform retained margin: **₦270.00 per completed delivery**.
3. **Platform Technology Access Fee (₦100 per Order):**
   * Transparently displayed on customer receipt; frictionless, equivalent to the cost of a chilled sachet water.
4. **Payment Processing Spread (₦25 per Order):**
   * At early volume, platform absorbs 1.5% Monnify toll. At institutional scale ($> 100,000$ transactions/month), volume pricing drops to 0.8%, unlocking a ₦25/order spread.

### Year 1 Monthly Revenue Trajectory

```
┌───────┬──────────────┬──────────────────┬─────────────────┬────────────────────────────┐
│ Month │ Order Volume │ Revenue / Order  │ Monthly Revenue │ Annualized Run-Rate (NGN)  │
├───────┼──────────────┼──────────────────┼─────────────────┼────────────────────────────┤
│ M1    │ 1,400 orders │ ₦1,095.00        │ ₦1,533,000      │ ₦18,396,000                │
│ M3    │ 5,000 orders │ ₦1,095.00        │ ₦5,475,000      │ ₦65,700,000                │
│ M6    │ 13,000 orders│ ₦1,095.00        │ ₦14,235,000     │ ₦170,820,000               │
│ M9    │ 19,000 orders│ ₦1,095.00        │ ₦20,805,000     │ ₦249,660,000               │
│ M12   │ 25,000 orders│ ₦1,095.00        │ ₦27,375,000     │ ₦328,500,000 ($214,700 USD)│
├───────┼──────────────┼──────────────────┼─────────────────┼────────────────────────────┤
│ Y1 SUM│ 148,400 ords │ ₦1,095.00 (Avg)  │ ₦162,498,000    │ Total First-Year Gross Rev │
└───────┴──────────────┴──────────────────┴─────────────────┴────────────────────────────┘
```

---

## 3. Direct Variable & Fixed Cost Architecture

### Variable Unit Costs (Per-Order Fulfillment Toll)

| Cost Component | Unit Cost (NGN) | Calculation Rationale |
| :--- | :--- | :--- |
| **Payment Gateway Toll (PSP)** | ₦65.00 | 1.5% of ₦4,450 GMV paid to Monnify / Korapay |
| **Customer Support Allocation** | ₦48.00 | $\sim 5\%$ of orders require human resolution ($\sim ₦960/\text{ticket}$) |
| **Fraud & Refund Reserve** | ₦44.00 | 1.0% of GMV set aside for order appeasements |
| **Total Variable Cost / Order** | **₦157.00** | **3.5% of Gross Marketplace Value** |

$$\mathbf{\text{Contribution Margin}} = \text{Gross Revenue (₦1,095)} - \text{Variable Cost (₦157)} = \mathbf{₦938.00\text{ (21.1\% of GMV)}}$$

---

### Monthly Fixed Operational Costs (Month 12 Baseline)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MONTHLY FIXED EXPENSES (MONTH 12 PEAK)                          │
├────────────────────────────────────────┬──────────────────┬────────────────────────────┤
│ Expense Category                       │ Monthly Cost (₦) │ Description & Headcount    │
├────────────────────────────────────────┼──────────────────┼────────────────────────────┤
│ 1. Cloud & Core Engineering Tech       │ ₦4,100,000       │ Cloud Run, Cloud SQL HA,   │
│                                        │                  │ Redis, GKE, BigQuery, Maps │
│ 2. People & Salaries (28.5 Headcount)  │ ₦8,720,000       │ Executive, Engineering, Ops│
│ 3. Physical Facilities & Compliance    │ ₦1,560,000       │ Office rent, legal, audit  │
├────────────────────────────────────────┼──────────────────┼────────────────────────────┤
│ Total Fixed Operational Overhead (Opex)│ ₦14,380,000      │ Fixed monthly burn         │
│ 4. Variable Demand Generation (GTM)    │ ₦2,800,000       │ Ad spend, flyers, bounties │
├────────────────────────────────────────┼──────────────────┼────────────────────────────┤
│ TOTAL MONTHLY RUN-RATE EXPENSES        │ ₦17,180,000      │ Fully-loaded monthly cost  │
└────────────────────────────────────────┴──────────────────┴────────────────────────────┘
```

#### Detailed Headcount Breakdown (Month 12: 28.5 Full-Time Equivalent Staff)
* **Founders & Executives (2):** CEO (₦600K), CTO (₦600K).
* **Engineering & Product (8):** 3 Backend Node/NestJS engineers (₦1.5M), 1 Flutter mobile engineer (₦450K), 1 Next.js frontend engineer (₦400K), 1 Site Reliability/DevOps engineer (₦550K), 1 AI/ML Vertex engineer (₦700K), 1 QA automation engineer (₦400K).
* **Vendor Operations (4):** Vendor Success Lead (₦250K), 1 Ops Coordinator (₦150K), 2 Field Canvassing Reps (₦160K).
* **Rider Operations (6):** Rider Success Lead (₦250K), 2 Rider Ops Coordinators (₦300K), 2 Field Inspectors (₦200K), 1 Bike Partner Coordinator (₦120K).
* **Growth & Marketing (4.5):** Growth Lead (₦350K), Growth Marketer (₦200K), Field Marketing Lead (₦180K), Retention Manager (₦180K), Content Creator (₦40K part-time).
* **Customer Support & Administration (4):** 3 Shift Support Agents (₦390K), 1 Finance/Bookkeeping Officer (₦250K).

---

## 4. Multi-Sided Marketplace Unit Economics

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-SIDED UNIT ECONOMICS DASHBOARD                           │
├─────────────────────┬──────────────────┬──────────────────┬────────────────────────────┤
│ Marketplace Actor   │ Unit Acquisition │ Monthly Economic │ Payback Period             │
│                     │ Cost (CAC)       │ Contribution     │ & Lifetime Value           │
├─────────────────────┼──────────────────┼──────────────────┼────────────────────────────┤
│ 🛒 End Customer     │ ₦2,200 (Blended) │ +₦2,116 / month  │ Payback: 1.1 Months        │
│                     │                  │ (2.3 orders/mo)  │ 12-Month LTV: ₦12,144      │
│                     │                  │                  │ LTV:CAC Ratio: 5.5:1       │
├─────────────────────┼──────────────────┼──────────────────┼────────────────────────────┤
│ 🍳 Food Vendor      │ ₦3,650 (Field)   │ +₦101,850 / month│ Payback: 0.04 Months (1.2d)│
│                     │                  │ (167 orders/mo)  │ 12-Month LTV: ₦1,222,200   │
│                     │                  │                  │ LTV:CAC Ratio: 334:1       │
├─────────────────────┼──────────────────┼──────────────────┼────────────────────────────┤
│ 🏍️ Dispatch Rider   │ ₦8,500 (Vetted)  │ +₦97,500 / month │ Payback: 2.2 Days          │
│                     │                  │ (₦260 platform   │ 12-Month LTV: ₦1,170,000   │
│                     │                  │ margin × 375 ord)│ LTV:CAC Ratio: 137:1       │
└─────────────────────┴──────────────────┴──────────────────┴────────────────────────────┘
```

### Fleet Sizing & Rider Productivity Alignment
To prevent fleet under-utilization, the motorcycle fleet is sized strictly to order volume:
* **25,000 Orders/Month $\div$ 22 Working Days = 1,136 Orders/Day**.
* **Fleet Mix:** **120 Full-Time Riders** (averaging 10–12 trips/day) + **80 Part-Time Riders** (averaging 3–5 trips/day).
* **Full-Time Rider Take-Home Pay:** ₦13,050 gross/day $-$ ₦3,000 fuel $-$ ₦500 maintenance = **₦9,550 net daily take-home pay** ($\mathbf{₦238,750/\text{month}}$ net income).

---

## 5. Customer Cohort LTV & Capital Payback

Tracking a cohort of 1,000 customers acquired in Month 1 demonstrates that customer acquisition capital recycles in approximately 33 days.

```
┌───────┬──────────────┬──────────────────┬──────────────────┬───────────────────────────┐
│ Month │ Active Share │ Orders / Cust / Mo│ Monthly Margin   │ Cumulative Value / User   │
├───────┼──────────────┼──────────────────┼──────────────────┼───────────────────────────┤
│ M1    │ 100.0%       │ 2.30 orders      │ ₦2,116.00        │ ₦2,116.00 (96% of CAC)    │
│ M2    │ 60.0%        │ 2.00 orders      │ ₦1,840.00        │ ₦3,956.00 (180% of CAC)   │
│ M3    │ 40.0%        │ 1.70 orders      │ ₦1,564.00        │ ₦5,520.00                 │
│ M4    │ 32.0%        │ 1.50 orders      │ ₦1,380.00        │ ₦6,900.00                 │
│ M5    │ 28.0%        │ 1.20 orders      │ ₦1,104.00        │ ₦8,004.00                 │
│ M6    │ 22.0%        │ 1.00 orders      │ ₦920.00          │ ₦8,924.00 (4.1× CAC)      │
│ M7    │ 20.0%        │ 0.90 orders      │ ₦828.00          │ ₦9,752.00                 │
│ M8    │ 18.0%        │ 0.70 orders      │ ₦644.00          │ ₦10,396.00                │
│ M9    │ 17.0%        │ 0.60 orders      │ ₦552.00          │ ₦10,948.00                │
│ M10   │ 16.0%        │ 0.50 orders      │ ₦460.00          │ ₦11,408.00                │
│ M11   │ 15.0%        │ 0.40 orders      │ ₦368.00          │ ₦11,776.00                │
│ M12   │ 15.0%        │ 0.40 orders      │ ₦368.00          │ ₦12,144.00 (5.5× CAC)     │
└───────┴──────────────┴──────────────────┴──────────────────┴───────────────────────────┘
```

* **Customer Acquisition Cost:** **₦2,200.00**.
* **Capital Payback Window:** **1.1 Months** (Month 2 cumulative margin reaches ₦3,956).
* **12-Month Contribution LTV:** **₦12,144.00**.
* **LTV:CAC Multiple:** **5.5:1**.

---

## 6. 36-Month Pro Forma Cash Flow Projection

```
┌───────┬──────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬────────────────┐
│ Month │ Orders / Mo  │ Revenue (₦M)│ Margin (₦M) │ Fixed (₦M)  │ GTM (₦M)    │ P&L Op (₦M) │ Cumul Cash (₦M)│
├───────┼──────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼────────────────┤
│ M1    │ 1,400 orders │ ₦1.53M      │ ₦1.29M      │ ₦8.00M      │ ₦1.50M      │ -₦8.21M     │ -₦8.21M        │
│ M2    │ 3,000 orders │ ₦3.28M      │ ₦2.76M      │ ₦8.50M      │ ₦1.80M      │ -₦7.54M     │ -₦15.75M       │
│ M3    │ 5,000 orders │ ₦5.48M      │ ₦4.60M      │ ₦9.50M      │ ₦2.00M      │ -₦6.90M     │ -₦22.65M       │
│ M4    │ 7,500 orders │ ₦8.21M      │ ₦6.90M      │ ₦10.50M     │ ₦2.20M      │ -₦5.80M     │ -₦28.45M       │
│ M5    │ 10,500 orders│ ₦11.50M     │ ₦9.66M      │ ₦11.50M     │ ₦2.40M      │ -₦4.24M     │ -₦32.69M       │
│ M6    │ 13,000 orders│ ₦14.24M     │ ₦11.96M     │ ₦12.50M     │ ₦2.50M      │ -₦3.04M     │ -₦35.73M       │
│ M7    │ 15,500 orders│ ₦16.97M     │ ₦14.26M     │ ₦13.00M     │ ₦2.60M      │ -₦1.34M     │ -₦37.07M (PEAK)│
│ M8    │ 17,500 orders│ ₦19.16M     │ ₦16.10M     │ ₦13.50M     │ ₦2.60M      │ +₦0.00M     │ -₦37.07M       │
│ M9    │ 19,000 orders│ ₦20.81M     │ ₦17.48M     │ ₦14.00M     │ ₦2.70M      │ +₦0.78M     │ -₦36.29M       │
│ M10   │ 21,000 orders│ ₦23.00M     │ ₦19.32M     │ ₦14.20M     │ ₦2.70M      │ +₦2.42M     │ -₦33.87M       │
│ M11   │ 23,000 orders│ ₦25.19M     │ ₦21.16M     │ ₦14.30M     │ ₦2.80M      │ +₦4.06M     │ -₦29.81M       │
│ M12   │ 25,000 orders│ ₦27.38M     │ ₦23.00M     │ ₦14.40M     │ ₦2.80M      │ +₦5.80M     │ -₦24.01M       │
├───────┼──────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼────────────────┤
│ M13   │ 27,500 orders│ ₦30.11M     │ ₦25.30M     │ ₦15.00M     │ ₦3.00M      │ +₦7.30M     │ -₦16.71M       │
│ M14   │ 30,000 orders│ ₦32.85M     │ ₦27.60M     │ ₦15.50M     │ ₦3.00M      │ +₦9.10M     │ -₦7.61M        │
│ M15   │ 33,000 orders│ ₦36.14M     │ ₦30.36M     │ ₦16.00M     │ ₦3.20M      │ +₦11.16M    │ +₦3.55M (CASH+)│
│ M18   │ 42,000 orders│ ₦45.99M     │ ₦38.64M     │ ₦19.00M     │ ₦3.50M      │ +₦16.14M    │ +₦46.99M       │
│ M24   │ 66,000 orders│ ₦72.27M     │ ₦60.72M     │ ₦25.00M     │ ₦4.00M      │ +₦31.72M    │ +₦198.11M      │
│ M36   │ 90,000 orders│ ₦98.55M     │ ₦82.80M     │ ₦35.00M     │ ₦5.00M      │ +₦42.80M    │ +₦711.50M      │
└───────┴──────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴────────────────┘
```

### Annual Summary Totals
* **Year 1:** ₦165.2M Revenue | ₦138.8M Contribution | -₦65.1M Operating Loss | **Cash trough: -₦37.07M**.
* **Year 2:** ₦586.4M Revenue | ₦492.6M Contribution | **+₦174.1M Operating Profit** | **+₦198.1M Ending Cash**.
* **Year 3:** ₦1.18B Revenue | ₦994.0M Contribution | **+₦514.0M Operating Profit** | **+₦711.5M Ending Cash**.

---

## 7. Break-Even Analysis & The Google Cloud Catalyst

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        BREAK-EVEN ACCELERATION METRICS                                 │
├───────────────────────────────────┬────────────────────┬───────────────────────────────┤
│ Financial Metric                  │ Standard Baseline  │ Accelerated with Google Cloud │
├───────────────────────────────────┼────────────────────┼───────────────────────────────┤
│ Operating Break-Even Order Volume │ 14,674 orders / mo │ 9,250 orders / mo             │
│ First Profitable Month            │ Month 8            │ Month 5 (3 Months Faster)     │
│ Cumulative Cash-Flow Break-Even   │ Month 15           │ Month 11 (4 Months Faster)    │
│ Total Peak Working Capital Deficit│ ₦37,070,000 ($24K) │ ₦22,100,000 ($14.4K USD)      │
│ External Capital Required to Scale│ ₦55,000,000 ($36K) │ ₦33,000,000 ($21.5K USD)      │
│ Capital Requirement Reduction     │ Baseline 100%      │ 40.3% Capital Reduction       │
└───────────────────────────────────┴────────────────────┴───────────────────────────────┘
```

```
     (₦M Cash)
       ▲
       │                                                      ● Month 15 (Cash Positive)
   +20 │                                                 . - '
       │                                            . - '   ▲
   +10 │                                       . - '        │ WITH GOOGLE CLOUD:
       │                                  . - '             │ Month 11 Cash Positive
    0  ┼─────────────────────────────●──────────────────────┼────────────────────────► (Month)
       │                         Month 8              . - ' │
   -10 │                        (Op Break-Even)  . - '      │
       │                                    . - '           ▼
   -20 │                               . - '          -₦22M Deficit (With GCP)
       │                          . - '
   -30 │                     . - '
       │                . - '
   -40 │           . - ' ● Month 7 Peak Deficit (-₦37.07M)
       └─────────────────────────────────────────────────────────
```

### The $350K GCP Credit Utilization Plan (33-Month Runway)
The $350,000 USD grant in Google Cloud credits covers 100% of the platform's infrastructure, compute, and AI inference costs through **Month 33**.

```
┌───────────────────────────────────┬────────────────────────────┬───────────────────────┐
│ Service Architecture              │ Month 12 Burn (USD/mo)     │ Month 24 Burn (USD/mo)│
├───────────────────────────────────┼────────────────────────────┼───────────────────────┤
│ Cloud Run API & Portals           │ $140.00                    │ $420.00               │
│ Cloud SQL HA Postgres 16          │ $520.00                    │ $1,200.00             │
│ Memorystore Redis HA              │ $210.00                    │ $600.00               │
│ GKE Autopilot (Gemma Normalizer)  │ $310.00                    │ $800.00               │
│ BigQuery Analytics Warehouse      │ $180.00                    │ $650.00               │
│ Vertex AI Endpoints               │ $620.00                    │ $2,400.00             │
│ Gemini 1.5 Flash Vision OCR       │ $890.00                    │ $3,200.00             │
│ Google Maps Platform API          │ $410.00                    │ $1,800.00             │
│ Cloud Storage & Logging           │ $265.00                    │ $1,000.00             │
├───────────────────────────────────┼────────────────────────────┼───────────────────────┤
│ Monthly Google Cloud Consumption  │ $3,545.00 / month          │ $12,070.00 / month    │
├───────────────────────────────────┴────────────────────────────┴───────────────────────┤
│ Months 1–12 Total Grant Consumed:  $26,400.00 USD                                      │
│ Months 13–24 Total Grant Consumed: $93,600.00 USD                                      │
│ 24-Month Cumulative Grant Usage:   $120,000.00 USD (Leaves $230,000 USD for Expansion) │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Multi-Variable Sensitivity Stress-Testing

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SENSITIVITY ANALYSIS: BREAK-EVEN IMPACT                         │
├───────────────────────┬──────────────┬──────────────┬──────────────┬───────────────────┤
│ Variable Tested       │ Base Value   │ Adverse Shock│ Break-Even   │ Financial Impact  │
├───────────────────────┼──────────────┼──────────────┼──────────────┼───────────────────┤
│ 1. Rider Churn Rate   │ 25% / month  │ 40% / month  │ Month 10     │ +₦1.03M / mo cost │
│ 2. Commission Rate    │ 20.0% take   │ 15.0% take   │ Month 11     │ -19% Year 1 margin│
│ 3. Month-6 Retention  │ 22.0% active │ 15.0% active │ Month 10     │ LTV drops to ₦8.4K│
│ 4. Food Basket AOV    │ ₦3,500 subttl│ ₦2,800 subttl│ Month 11     │ Contribution ₦730 │
│ 5. Rider Delivery Pay │ ₦580 payout  │ ₦700 payout  │ Month 9      │ -₦120 unit margin │
│ 6. Blended CAC        │ ₦2,200 CAC   │ ₦3,500 CAC   │ Month 12     │ +₦15M Year 1 spend│
└───────────────────────┴──────────────┴──────────────┴──────────────┴───────────────────┤
│ COMBINED SEVERE SHOCK │ ALL 6 EVENTS │ SIMULTANEOUS │ Month 14     │ ₦65M Deficit ($42K│
│ (Absolute Bear Case)  │ OCCURRING    │ AT LAUNCH    │ (Survivable) │ Still profitable  │
└───────────────────────┴──────────────┴──────────────┴──────────────┴───────────────────┘
```

---

## 9. Scenario Comparison: Bull vs. Base vs. Bear

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           3-SCENARIO 24-MONTH PERFORMANCE                              │
├───────────────────────────────┬──────────────────┬──────────────────┬──────────────────┤
│ Metric                        │ Bear Case        │ Base Case        │ Bull Case        │
├───────────────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Month 12 Orders / Month       │ 12,000 orders    │ 25,000 orders    │ 40,000 orders    │
│ Month 12 Gross Revenue        │ ₦11.04M          │ ₦27.38M          │ ₦45.20M          │
│ Month 12 Operating Margin     │ -₦3.20M (Loss)   │ +₦5.80M (Profit) │ +₦15.40M (Profit)│
│ Operating Break-Even Month    │ Month 18         │ Month 8          │ Month 5          │
│ Month 24 Orders / Month       │ 25,000 orders    │ 66,000 orders    │ 120,000 orders   │
│ Month 24 Monthly GMV          │ ₦100,000,000     │ ₦287,000,000     │ ₦534,000,000     │
│ Month 24 Monthly Operating P&L│ +₦2.10M          │ +₦31.72M         │ +₦68.20M         │
│ Expansion Milestone           │ Single city only │ Launch 2nd city  │ Launch 3 cities  │
└───────────────────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

## 10. 5-Year Regional Expansion Trajectory (3 Cities)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        5-YEAR REGIONAL COMMERCIAL SCALING                              │
├───────┬────────────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│ Year  │ Target Geographies │ Annual Orders│ Annual GMV   │ Annual Rev   │ Annual Profit│
├───────┼────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Y1    │ Ilorin (4 Clusters)│ 148,400 ords │ ₦650,000,000 │ ₦165,200,000 │ -₦65,100,000 │
│ Y2    │ Ilorin + Osogbo    │ 600,000 ords │ ₦2.67 Billion│ ₦657,000,000 │ +₦174,100,000│
│ Y3    │ + Ado-Ekiti        │ 1,200,000 ord│ ₦5.34 Billion│ ₦1.31 Billion│ +₦514,000,000│
│ Y4    │ + Akure            │ 2,200,000 ord│ ₦9.79 Billion│ ₦2.41 Billion│ +₦980,000,000│
│ Y5    │ 4 Regional Hubs    │ 3,800,000 ord│ ₦16.9 Billion│ ₦4.16 Billion│ +₦1.75B PROFIT│
└───────┴────────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

* **Year 5 Annual Revenue:** **₦4.16 Billion NGN ($\sim \$2.72\text{ Million USD}$)**.
* **Year 5 Annual Operating Profit:** **₦1.75 Billion NGN ($\sim \$1.14\text{ Million USD}$)**.
* **Cumulative Cash Reserves:** **₦3.4 Billion NGN**.

---

## 11. The Concrete Google for Startups Investment Case

### The Funding Request
**$350,000 USD in Google Cloud Platform Credits** over 24 months.

### The Return on Investment for Google
1. **Direct AI Operational Leverage:** Five production AI microservices generate **₦9.5M/month in human ops savings** against **₦1.9M/month in Google Cloud compute costs**—a net **$5.0\times$ economic surplus**.
2. **Defensible Technological Moat:** 100% Google-native stack (Gemini Flash Vision, fine-tuned Gemma 2B, Vertex AI Feature Store, BigQuery, Cloud Run, GKE Autopilot).
3. **Emerging Market Flagship:** Establishes the definitive reference case study for Google multimodal AI deployed in real-world informal African commerce.
4. **Capital Efficiency:** Shortens runway to cashflow break-even from **Month 15 to Month 11** and cuts external capital needs by **40%**.
