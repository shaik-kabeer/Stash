# RewardOS — Product Overview

> India's Loyalty Asset Operating System
> "The Bloomberg Terminal for Loyalty Assets"

---

## What is RewardOS?

RewardOS is a web application that helps Indian credit card holders **discover, track, value, optimize, and redeem** their loyalty rewards. Most Indians unknowingly leave thousands of rupees on the table — expired points, sub-optimal redemptions, unused card benefits. RewardOS fixes that.

---

## The Problem

Indian consumers collectively hold **₹50,000+ crore** in unredeemed loyalty points across banks. The average credit card holder:

- **Doesn't know** what their points are worth in real money
- **Forgets** to use complimentary lounge access, insurance, or dining benefits
- **Redeems poorly** — choosing cashback at ₹0.20/point when flights give ₹0.50/point
- **Misses deadlines** — points expire silently after 2-3 years
- **Can't compare** which card to swipe for which purchase
- **Has no single dashboard** — reward info is scattered across 3-4 bank apps

---

## The Solution

RewardOS brings all reward intelligence into one place.

| Bank App Reality | RewardOS |
|-----------------|----------|
| "You have 12,000 points" | "Your 12,000 EDGE points are worth ₹4,200 as flights, ₹2,400 as cashback. **Flights give 75% more value.**" |
| No expiry warning | "⚠ 8,000 SBI points expire in 2 months — worth ₹2,800" |
| No cross-bank view | "Your total Reward Net Worth: **₹18,450** across 3 programs" |
| No spending guidance | "Use your Axis Atlas for this Amazon purchase — earns 5x points vs 1x on HDFC" |

---

## Features

### 1. Card Portfolio Manager
**What:** Add credit cards via card number/BIN. Auto-detects bank, network, card product, and maps to our catalog.

**User gets:**
- All cards in one visual dashboard
- Estimated annual value per card
- "Wrong card?" correction if BIN detection picks the wrong product
- Link to detailed card intelligence page

---

### 2. Reward Net Worth Dashboard
**What:** The homepage KPI — total monetary value of all reward points across every bank.

**User gets:**
- Total reward net worth in ₹ (e.g., ₹18,450)
- Breakdown by program (Axis EDGE: ₹5,200 | ICICI Rewards: ₹2,900 | Marriott: ₹10,350)
- Breakdown by category (Travel, Cashback, Hotels)
- Active cards count with total annual fees vs. estimated annual value
- Smart insights ("Your HDFC Infinia points are better redeemed as flights, not cashback")

---

### 3. Reward Balance Tracker
**What:** Manually enter or update reward point balances for each program.

**User gets:**
- Per-program balance cards with estimated ₹ value
- Expiry date tracking — color-coded (red < 3 months, amber < 6 months)
- Auto-computed expiry based on program rules
- Quick edit to update balances anytime
- "Simulate" link on each balance card → jumps to Redemption Simulator

---

### 4. Redemption Simulator
**What:** Compare all redemption options for a given reward program and balance.

**User gets:**
- Select program → enter balance → see every redemption path ranked
- Best vs. Worst value highlighted
- Value per point (₹/point) for each option
- Efficiency rating (Excellent / Good / Fair / Poor)
- Deep links to official bank redemption portals
- "Combined Portfolio Optimization" — simulate ALL programs at once, see total best value
- Pre-populated with user's actual balances (not dummy 10,000)
- URL deep-linking from Rewards page (`/simulator?programId=xxx&balance=yyy`)

**Example output:**
| Option | Value | Per Point | Rating |
|--------|-------|-----------|--------|
| Flights via SmartBuy | ₹4,200 | ₹0.35 | Excellent |
| Amazon Voucher | ₹3,000 | ₹0.25 | Good |
| Cashback | ₹2,400 | ₹0.20 | Fair |
| Statement Credit | ₹2,000 | ₹0.17 | Poor |

---

### 5. Reward Health Score
**What:** A 0-100 score measuring how well the user is managing their loyalty assets.

**Factors:**
- Points about to expire
- Card benefits not being used (lounge, insurance, golf)
- Poor redemption choices in the past
- Cards sitting inactive
- Missed earning opportunities

**User gets:**
- Score with color-coded status
- Estimated value being lost (₹)
- Actionable recommendations

---

### 6. Card Intelligence Engine
**What:** Deep-dive into any credit card's full feature set.

**User gets:**
- Bank, network, tier, annual fee, joining fee
- All benefits categorized (lounge, travel, dining, fuel, insurance, shopping, entertainment, golf, forex)
- Reward program details with earn rates
- Redemption options with ₹/point for each
- Transfer partners (airlines, hotels) with ratios
- Hidden benefits they may not be using + estimated lost value
- Best-for and worst-for use cases
- Deep links to redeem through official bank portals

---

### 7. Best Card Engine
**What:** "Which card should I use for _____?"

**Input:** Category — Amazon, Dining, Fuel, Travel, Hotels, Groceries

**Output:** Ranked list of best cards with:
- Expected reward per ₹100 spent
- Relevant benefits for that category
- Estimated annual value

---

### 8. Travel Goal Planner
**What:** Set a travel destination goal and see how current rewards stack up.

**User gets:**
- Pick destination (Dubai, Singapore, Goa, Bali, Maldives, London, Tokyo, etc.)
- See current reward value vs. target value
- Gap analysis — how much more is needed
- Recommended earning strategy ("Use Axis Atlas for next 4 months")
- Projected date to reach goal
- Card recommendations to accelerate
- Progress recalculated from real balances on every visit (not stale)

---

### 9. Explore & Compare Cards
**What:** Browse, search, and compare all credit cards in the catalog.

**User gets:**
- Search by name, bank, or network
- BIN lookup (enter first 6-8 digits of any card)
- Category filter tabs (Lounge, Travel, Fuel, Dining, Shopping, Cashback, Insurance, Entertainment, Golf)
- Bank filter dropdown
- Sort by: Value (high/low), Fee (high/low), Group by Bank
- Side-by-side comparison of up to 3 cards (fees, value, benefits, tier, network)
- Best Card For... section showing top cards per category

---

### 10. Offers & Permanent Perks
**What:** Discover time-limited deals and permanent card benefits.

**User gets:**
- "My Card Offers" — offers specific to cards in their portfolio
- "Permanent Perks" — always-available benefits from their cards (lounge access, golf rounds, insurance, fuel surcharge waiver)
- "All Offers" — browse all offers across all cards
- Filter by merchant, card, or keyword
- If no active offers exist, auto-shows permanent perks instead of an empty page
- Prompt to add cards if portfolio is empty

---

### 11. AI Advisor
**What:** Chat-based assistant powered by 4 specialized AI agents.

**Can answer:**
- "Which card should I use at Amazon?"
- "What are my HDFC points worth?"
- "Should I redeem my Axis EDGE points now or wait?"
- "What benefits am I not using?"
- "How can I maximize my reward earnings?"
- "Which card is best for international travel?"

---

### 12. Admin Data Pipeline
**What:** Backend system for acquiring, extracting, and curating credit card data.

**Capabilities:**
- Add source URLs (bank websites, comparison sites)
- Crawl pages (HTTP fetch, Firecrawl, Playwright, PDF)
- AI-powered structured extraction (card name, fees, benefits, reward programs)
- Zod validation of extracted data
- Human review queue (approve/reject)
- Upsert into database with deduplication
- Program CRUD for managing reward programs

---

## User Stories

### Story 1: "I have 3 credit cards but no idea what my points are worth"
**Ravi**, a 32-year-old software engineer, has an HDFC Regalia, Axis Flipkart, and SBI SimplyCLICK. He knows he has "some points" but has never redeemed them.

1. He adds his 3 cards via card number on RewardOS
2. He enters his point balances from each bank app
3. Dashboard shows: **Reward Net Worth: ₹12,800**
4. He clicks "Simulate" on his HDFC points → discovers flights give 2x more value than cashback
5. He redeems through the deep link to HDFC SmartBuy
6. **Result:** Saved ₹4,000+ by choosing the right redemption

---

### Story 2: "I forgot my SBI points were expiring"
**Priya**, a 28-year-old marketing manager, hasn't checked her SBI card rewards in over a year.

1. She adds her SBI card and enters balance
2. Rewards page shows: **⚠ 15,000 points expire in 45 days — worth ₹4,500**
3. She clicks "Simulate" → best option is Amazon vouchers at ₹0.30/point
4. She redeems before expiry through the portal link
5. **Result:** Saved ₹4,500 that would have vanished

---

### Story 3: "I never use my card's lounge access"
**Amit**, a 35-year-old consultant who travels monthly, has an Axis Atlas card.

1. He views his Axis Atlas card detail page
2. "Hidden Benefits You're Not Using" section shows: Airport Lounge (8 visits/year), Travel Insurance, Golf access
3. Estimated lost value: **₹12,000/year**
4. He starts using complimentary lounge access on his next trip
5. **Result:** Gets value he was already paying for via annual fee

---

### Story 4: "Which card should I swipe at this restaurant?"
**Sneha**, a foodie with 4 cards, is at a fine dining restaurant.

1. She opens Best Card Engine → selects "Dining"
2. Result: "Use your HDFC Diners Black — earns 10x reward points on dining, worth ₹10/₹100 spent. Your Axis card only earns 1x."
3. She swipes the right card
4. **Result:** Earns 10x more points on that meal

---

### Story 5: "I want to fly to Dubai using my credit card rewards"
**Karthik**, a 30-year-old with decent reward balances across 2 programs, dreams of a Dubai trip.

1. He creates a Goal: "Dubai trip" → Target: ₹45,000
2. System shows: Current rewards worth ₹28,000 → Gap: ₹17,000
3. Recommendation: "Use Axis Atlas for next 4 months to close the gap"
4. Projected date: November 2026
5. He checks back monthly — progress auto-updates from real balances
6. **Result:** Plans and achieves a reward-funded trip

---

### Story 6: "My card was detected as the wrong product"
**Deepa** added her RBL Super Card, but BIN detection matched it to IndianOil RBL XTRA.

1. She sees "Probable Match" badge and a "Wrong card? Change match" button
2. Clicks it → searches "RBL Super"
3. Selects the correct card from results
4. Card is now correctly matched with proper benefits
5. **Result:** Sees accurate benefits and rewards for her actual card

---

## Target Users

| Segment | Description | Key Need |
|---------|-------------|----------|
| **Reward Maximizers** | Power users with 3-5 premium cards | Cross-program optimization, best-card-per-merchant |
| **Passive Holders** | Have 1-2 cards, never check rewards | Discovery — "you have ₹8,000 sitting unused" |
| **Travel Hackers** | Want to fly/stay free using points | Goal planner, transfer partners, mile valuations |
| **Fee-Conscious** | Want to justify annual fees | Net value calculator (annual value vs. fee) |
| **New Cardholders** | Just got first card | Card intelligence, benefit discovery |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, React, Tailwind CSS |
| Backend | Next.js API Routes (REST) |
| Database | SQLite (dev) / Turso (production) via Prisma ORM |
| Auth | NextAuth.js with JWT + role-based access |
| AI | Groq (Llama 3) for chat advisor + data extraction |
| Data Pipeline | Firecrawl, Playwright, PDF parser, Zod validation |

---

## Key Metrics

| Metric | Description |
|--------|-------------|
| Reward Net Worth | Total ₹ value of all user rewards |
| Health Score | 0-100 optimization score |
| Redemption Efficiency | Best vs. chosen redemption value gap |
| Benefits Utilization | % of available benefits actually used |
| Cards Tracked | Number of cards in user portfolio |
| Programs Monitored | Number of reward programs with balances |

---

## Product Roadmap Status

| Phase | Feature | Status |
|-------|---------|--------|
| P0 | Authentication & User Management | ✅ Complete |
| P0 | Card Portfolio Manager | ✅ Complete |
| P0 | Reward Net Worth Dashboard | ✅ Complete |
| P0 | Reward Valuation Engine | ✅ Complete |
| P0 | Redemption Simulator | ✅ Complete |
| P0 | Reward Health Score | ✅ Complete |
| P0 | Expiry Tracking | ✅ Complete |
| P1 | Card Intelligence Engine | ✅ Complete |
| P1 | Best Card Engine | ✅ Complete |
| P1 | Travel Goal Planner | ✅ Complete |
| P1 | AI Advisor (4 agents) | ✅ Complete |
| P1 | Deep Link Redemption | ✅ Complete |
| P1 | Card Correction Flow | ✅ Complete |
| P1 | Explore with Filters & Sort | ✅ Complete |
| P1 | Offers & Permanent Perks | ✅ Complete |
| P2 | Expand to 50+ cards | 🔄 In Progress (29 cards seeded) |
| P2 | Expanded transfer partners | 🔄 In Progress |
| P2 | MCC-based best card | 📋 Planned |
| P3 | Bank API integrations | 📋 Future |
| P3 | Auto-sync balances | 📋 Future |
| P3 | Point marketplace | 📋 Future |

---

## What Makes RewardOS Different

1. **Valuation, not just tracking** — We don't just show "12,000 points", we show "₹4,200 as flights or ₹2,400 as cashback"
2. **Cross-bank optimization** — Compare redemption value across ALL your cards simultaneously
3. **Proactive alerts** — Expiry warnings, unused benefit nudges, poor redemption detection
4. **Goal-oriented** — Not just "here are your points" but "here's how to get to Dubai with them"
5. **India-specific** — Built for Indian banks, Indian reward programs, Indian travel goals
6. **No bank login required** — Manual entry keeps it safe; email import for convenience
7. **Deep links, not transactions** — We guide you to redeem; we never touch your points

---

*RewardOS: Stop leaving money on the table.*
