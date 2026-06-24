# RewardOS — Legacy to Normalized Migration Plan

> Generated: 2026-06-24

## Overview

RewardOS has dual data stacks. All new development uses the normalized graph. Legacy models are preserved for backward compatibility but should no longer receive new writes.

## Legacy → Normalized Route Mapping

| Legacy Route | Normalized Equivalent | Status |
|---|---|---|
| `GET /api/cards/catalog` | `GET /api/v2/cards` | Covered — deprecate legacy |
| `POST /api/cards/compare` | Explore page inline compare | Covered — deprecate legacy |
| `GET /api/cards/offers` | `GET /api/v2/offers` | Covered — deprecate legacy |
| `POST /api/cards/chat` | `POST /api/v2/chat` | Covered — deprecate legacy |
| `GET /api/cards/report/[id]` | `GET /api/v2/cards/[id]` | Covered — deprecate legacy |
| `POST /api/cards/identify` | `GET /api/v2/cards?bin=` + `POST /api/v2/card-intelligence` | Covered — deprecate legacy |
| `GET/POST /api/rewards` | `GET /api/v2/rewards` + `POST /api/v2/rewards/balance` | Covered — deprecate legacy |
| `PUT/DELETE /api/rewards/[id]` | Need v2 DELETE for `UserReward` | Partial |
| `POST /api/agent/chat` | `POST /api/v2/chat` | Covered — deprecate legacy |
| `POST /api/agent/workflow` | `GET /api/v2/health-score` + `POST /api/v2/reward-optimizer` | Partial |
| `GET/POST/PUT /api/admin/programs` | Needs v2 admin for `NormalizedProgram` | Pending |

## Legacy Model → Normalized Model Mapping

| Legacy Model | Normalized Model | Migration |
|---|---|---|
| `CardProduct` | `Card` | Seeded in parallel; stop writing legacy |
| `CardBIN` | `CardBIN2` | Both exist; onboarding uses both with normalized-first |
| `RewardProgram` | `NormalizedProgram` | Different schemas; no auto-migration |
| `RewardAccount` | `UserReward` | Different schemas; users should use v2 balance API |
| `RewardTransaction` | None (v2 has no tx model) | Data unused; defer |
| `RewardValuation` (per-user) | `ProgramValuation` (reference) | Different purpose; keep both |
| `CardReport` | None | Model unused; defer |

## Onboarding Engine Changes (Done)

The onboarding engine (`src/lib/cards/onboarding-engine.ts`) has been updated:
- Card catalog matching now queries `Card` (normalized) instead of `CardProduct` (legacy)
- Reward program mapping now queries `NormalizedProgram` first, with legacy `RewardProgram` as fallback
- `UserCard` still writes `cardProductId` for existing data but new onboards prefer `cardId`

## Deprecation Schedule

### Phase 1 (Now)
- Stop new writes to legacy models from onboarding
- Wire new features exclusively to normalized stack

### Phase 2 (Month 2)
- Remove legacy card routes (`/api/cards/catalog`, `compare`, `offers`, `chat`, `report`)
- Remove legacy agent routes (`/api/agent/chat`, `/api/agent/workflow`)

### Phase 3 (Month 3)
- Migrate admin programs CRUD to `NormalizedProgram`
- Remove legacy rewards routes (`/api/rewards`, `/api/rewards/[id]`)
- Data migration script: `CardProduct` → `Card`, `CardBIN` → `CardBIN2`

### Phase 4 (Future)
- Mark legacy models as deprecated in schema with comments
- Remove `CardProduct`, `CardBIN`, `RewardProgram`, `RewardAccount` after full cutover
