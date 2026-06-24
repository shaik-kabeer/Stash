# RewardOS — Full Codebase Audit Report

> Generated: 2026-06-24 | Auditor: Principal Architect

---

## Module Status Matrix

| # | Module | Status | Notes |
|---|--------|--------|-------|
| 1 | Authentication | **Complete** | NextAuth credentials, JWT sessions, role-based access, register/login/logout |
| 2 | Dashboard | **Partial** | Shows portfolio summary + rewards; 5 dashboard components built but unwired (charts, expiry tracker, transactions) |
| 3 | Card Catalog | **Complete** | Normalized `Card` model with bank/network/fees; v2 search/filter/BIN lookup; legacy `CardProduct` still exists |
| 4 | Card Discovery Engine | **Partial** | BIN lookup works via 3 overlapping routes (`identify`, `analyze-card`, `cards?bin=`); needs consolidation |
| 5 | BIN Detection | **Complete** | `CardBIN2` (normalized) + `CardBIN` (legacy) + external API fallback |
| 6 | Benefits Explorer | **Complete** | Category-based search, keyword matching, Explore page with filters |
| 7 | Reward Programs | **Complete** | `NormalizedProgram` with earn rates; legacy `RewardProgram` parallel but separate |
| 8 | Reward Portfolio | **Complete** | `UserReward` balances, manual entry, email import, INR valuation |
| 9 | Reward Valuation Engine | **Partial** | `valuator.ts` computes from graph but no persisted `reward_valuations` v2 table; legacy snapshots unused |
| 10 | Redemption Catalog | **Partial** | `RedemptionOption` model exists with seed data; no standalone API route |
| 11 | Redemption Simulator | **Partial** | `/api/v2/reward-optimizer` exists but duplicates `optimizer.ts` logic; transfer valuation buggy |
| 12 | Best Card Engine | **Complete** | `best-card.ts` queries live graph; `/api/v2/best-card`; Explore page |
| 13 | AI Advisor | **Complete** | 4 Groq agents (card, reward, offer, portfolio) via `/api/v2/chat`; fallback without API key |
| 14 | Knowledge Graph | **Complete** | `graph/queries.ts` with 15+ query functions; full relational model |
| 15 | Email Parser | **Partial** | Regex-based bank detection + balance extraction; single-match limitation |
| 16 | Offer Engine | **Complete** | `Offer` model, merchant search, card-linked offers, portfolio filtering |
| 17 | Admin Dashboard | **Complete** | Sources, crawl, extract, approve/reject pipeline; program CRUD; agent logs |
| 18 | Data Pipeline | **Complete** | Crawl → clean → chunk → extract (OpenAI/Groq) → validate → approve → upsert |
| 19 | Crawlers | **Complete** | Admin fetch, Firecrawl, Playwright, PDF; CLI tools + admin UI |
| 20 | APIs | **Partial** | 39 routes; v2 stack active; legacy routes orphaned; 3 feature APIs missing |
| 21 | Database Schema | **Partial** | 23 models; dual-stack (legacy + normalized); missing `merchant_categories`, `reward_health_scores` |

---

## Critical Findings

### 1. Dual Data Architecture
Two parallel stacks exist with no bridge:
- **Legacy:** `CardProduct`, `RewardProgram`, `RewardAccount`, `CardBIN`
- **Normalized (v2):** `Bank`, `Card`, `Benefit`, `NormalizedProgram`, `CardBIN2`, `UserReward`

Impact: Agents and older routes use legacy data; UI uses v2 data. No FK between stacks.

### 2. Missing Features
- **Goal Planner:** Zero implementation anywhere
- **Reward Health Score API:** Logic exists in `monitoring.ts` but not exposed to v2 UI
- **Redemption Simulator:** Partial; needs unification and bug fixes
- **Deep Link API:** Client-only; no REST endpoint

### 3. Bugs Found
- `optimizer.ts`: Transfer partner units treated as INR (airline miles = rupees)
- `reward-optimizer` API: Reimplements ranking instead of importing `optimizer.ts`
- CFO agent: Binds OpenAI tools but never executes tool calls
- Email parser: `exec()` without global flag — misses multiple balances

### 4. Dead Code
- `/api/agent/chat` — no frontend consumer
- `/api/agent/workflow` — no frontend consumer
- `/api/cards/catalog`, `compare`, `offers`, `chat`, `report/[id]` — superseded by v2
- `RewardTransaction` model — seeded but never read
- `CardReport` model — never written or read
- 5 dashboard components in `src/components/dashboard/` — never imported

### 5. Security Gaps
- `/api/admin/programs` — no admin auth check
- `/api/v2/reward-optimizer` — no auth (accepts any programId/balance)
- `/api/agent/*` — no auth, defaults to demo user

---

## Page Status

| Page | Status | Notes |
|------|--------|-------|
| `/` (Landing) | Complete | Static marketing; mock stats |
| `/login` | Complete | |
| `/register` | Complete | |
| `/dashboard` | Partial | Core works; chart/expiry components unwired |
| `/my-cards` | Partial | Add/list works; no delete card |
| `/rewards` | Complete | Most feature-rich page |
| `/explore` | Complete | Search, BIN, categories, compare, best-card |
| `/offers` | Complete | All + my-card filtering |
| `/advisor` | Complete | Multi-agent chat |
| `/cards/[id]` | Complete | Full card detail |
| `/admin/*` | Complete | Full pipeline UI |
| 8 redirect pages | Placeholder | Compare, benefits, scanner → Explore etc. |

---

## Schema Gaps

| Expected | Exists | Model |
|----------|--------|-------|
| merchant_categories | **No** | Free-text `category` on Benefit |
| reward_health_scores | **No** | Computed in agents, not persisted |
| reward_valuations (v2) | **No** | v2 computes at runtime; legacy table exists but unused |
| Unified card model | **No** | `Card` + `CardProduct` coexist |
| Unified reward program | **No** | `NormalizedProgram` + `RewardProgram` coexist |
