# RewardOS — V2 Roadmap

> Generated: 2026-06-24

---

## Phase 1: Fix & Stabilize (Current Sprint)

### 1.1 Fix Bugs
- [ ] Fix optimizer transfer valuation (miles ≠ rupees)
- [ ] Fix email parser single-match limitation
- [ ] Add admin auth to `/api/admin/programs`
- [ ] Fix `estimatedAnnualValue` calculation on card upsert

### 1.2 Consolidate
- [ ] Unify BIN lookup into single function (remove `analyze-card` duplication)
- [ ] Wire `optimizer.ts` into `/api/v2/reward-optimizer` (remove inline reimplementation)

---

## Phase 2: Missing Features (This Release)

### 2.1 Reward Health Score
- [ ] Add `/api/v2/health-score` endpoint
- [ ] Surface health score on Dashboard page
- [ ] Add health score card to Rewards page
- [ ] Persist scores in new `RewardHealthScore` model

### 2.2 Redemption Simulator
- [ ] Create `/api/v2/simulate-redemption` with proper transfer valuation
- [ ] Build simulator UI component for Rewards page
- [ ] Show best/worst value highlighting

### 2.3 Goal Planner
- [ ] Add `GoalPlan` schema model
- [ ] Create `/api/v2/goals` CRUD endpoints
- [ ] Build goal planner UI (trip selection, point gap, timeline)
- [ ] Wire AI advisor to goal context

### 2.4 Deep Link Redemption API
- [ ] Expose `/api/v2/redeem-links` wrapping existing `redeem-links.ts`
- [ ] Expand portal URLs for more banks
- [ ] Add program-specific deep links

### 2.5 Card Intelligence Engine
- [ ] Consolidate card lookup into `/api/v2/card-intelligence`
- [ ] Return full card profile: bank, network, fees, benefits, rewards, best uses, hidden benefits
- [ ] Wire to My Cards page for richer card profiles

---

## Phase 3: Data Platform (Next Sprint)

### 3.1 Schema Additions
- [ ] Add `MerchantCategory` model (MCC codes)
- [ ] Add `RewardHealthScore` model
- [ ] Add `GoalPlan` model
- [ ] Add `RewardValuation` v2 model (distinct from legacy)

### 3.2 Data Acquisition
- [ ] Crawl top 30 Indian credit cards via listing pages
- [ ] Research and seed reward valuations (travel/hotel multipliers)
- [ ] Import MCC data for merchant categorization
- [ ] Expand transfer partner data

---

## Phase 4: Dashboard Enhancement

### 4.1 Wire Existing Components
- [ ] Portfolio summary with chart
- [ ] Expiry tracker widget
- [ ] Asset allocation breakdown
- [ ] Growth chart (value over time)
- [ ] Recent activity feed

### 4.2 New Widgets
- [ ] Health score gauge
- [ ] Goal progress tracker
- [ ] "You're losing ₹X" alert banner

---

## Phase 5: AI Advisor Enhancement

### 5.1 Context Enrichment
- [ ] Pass user portfolio + goals to agent context
- [ ] Add conversation history support (multi-turn)
- [ ] Add health score to advisor responses

### 5.2 Rule-Based First
- [ ] Pre-compute common questions (best card, point value, unused benefits)
- [ ] Use LLM only for explanation layer
- [ ] Cache frequent answers

---

## Phase 6: Legacy Cleanup (Future)

- [ ] Deprecate `/api/agent/*` routes
- [ ] Deprecate `/api/cards/catalog`, `compare`, `offers`, `chat`, `report`
- [ ] Deprecate `/api/rewards/*` (replace with v2)
- [ ] Mark legacy models as deprecated in schema
- [ ] Remove dead dashboard components or wire them
