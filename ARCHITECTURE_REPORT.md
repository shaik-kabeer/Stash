# RewardOS — Architecture Report

> Generated: 2026-06-24

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
├───────────┬───────────┬──────────┬──────────┬───────────┤
│  Auth     │  Pages    │  API     │  Admin   │  Agents   │
│  NextAuth │  6 main   │  v2 REST │  Pipeline│  Groq v2  │
│  JWT+Role │  + detail │  17 rtes │  Sources │  4 agents │
└─────┬─────┴─────┬─────┴────┬─────┴────┬─────┴─────┬─────┘
      │           │          │          │           │
┌─────▼───────────▼──────────▼──────────▼───────────▼─────┐
│                     Library Layer                         │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│ Graph    │ Rewards  │ Extract  │ Email    │ Cards        │
│ queries  │ valuator │ pipeline │ parser   │ onboard      │
│          │ optimizer│ schemas  │          │ analyzer     │
│          │ best-card│ clean    │          │ BIN lookup   │
│          │ redeem   │ chunk    │          │              │
└──────────┴──────────┴──────────┴──────────┴──────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    Prisma ORM                            │
│              SQLite / Turso (libSQL)                     │
├──────────────────────────────────────────────────────────┤
│  Normalized Stack        │  Legacy Stack (deprecated)    │
│  ─────────────────       │  ──────────────────────       │
│  Bank                    │  CardProduct                  │
│  Card                    │  CardBIN                      │
│  Benefit                 │  RewardProgram                │
│  NormalizedProgram       │  RewardAccount                │
│  RedemptionOption        │  RewardTransaction            │
│  TransferPartner         │  RewardValuation              │
│  Offer                   │  Recommendation               │
│  CardBIN2                │  AgentExecution               │
│  UserCard                │  CardReport                   │
│  UserReward              │                               │
│  SourcePage              │                               │
│  CrawlJob                │                               │
│  ExtractionJob           │                               │
└──────────────────────────┴──────────────────────────────┘
```

---

## User Journey Alignment

| Journey Step | Features | Status |
|-------------|----------|--------|
| **Discover** | Card catalog, BIN lookup, best-card engine, AI advisor | ✅ Complete |
| **Track** | Card onboarding, reward balances, email import | ✅ Complete |
| **Value** | Portfolio valuation, INR estimates, fee analysis | ⚠️ Partial (no health score in UI) |
| **Optimize** | Best card per category, redemption options, AI advice | ⚠️ Partial (simulator needs work) |
| **Redeem** | Deep links to portals, redemption catalog | ⚠️ Partial (no goal planner) |

---

## Data Flow

```
Source URL → Crawl (fetch/Firecrawl/Playwright)
    → Clean (noise removal)
    → Chunk (16k with overlap)
    → Extract (Groq/OpenAI structured JSON)
    → Validate (Zod + business rules)
    → Admin Review (approve/reject)
    → Upsert (Bank → Card → Benefits/Programs/Offers)
    → User-facing APIs (search, detail, portfolio)
```

---

## Recommended Architecture Changes

1. **Add `MerchantCategory` model** for structured spend categories
2. **Add `RewardHealthScore` model** for persisted health tracking
3. **Add `GoalPlan` model** for travel/redemption goals
4. **Consolidate BIN lookup** into single canonical function
5. **Expose health score + redeem links + redemption simulator** as v2 API routes
6. **Wire dashboard components** (charts, expiry tracker)
7. **Fix optimizer transfer valuation bug**
8. **Deprecate legacy routes** (keep models for data, remove API surfaces)
