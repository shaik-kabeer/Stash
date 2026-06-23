# RewardOS - The Mint for Rewards

RewardOS aggregates loyalty points, reward points, miles, cashback balances, and memberships from multiple providers into a single intelligent dashboard. Think of it as managing an investment portfolio, but for rewards.

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with demo data
npx tsx prisma/seed.mts

# Start the development server
npm run dev
```

Visit **http://localhost:3000**

## Demo Credentials

- **Email:** arjun@rewardos.in
- **Password:** demo1234

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (via Prisma) |
| ORM | Prisma 7 |
| Auth | NextAuth.js |
| AI/LLM | OpenAI SDK + LangGraph.js |
| Charts | Recharts |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Authentication |
| `/register` | New account registration |
| `/dashboard` | Portfolio overview with charts |
| `/accounts` | Manage reward programs |
| `/advisor` | AI-powered rewards advisor |
| `/insights` | Expiring rewards, optimization tips |
| `/admin` | Manage programs and conversion rates |

## Reward Programs (Simulated)

- HDFC Reward Points (0.20 INR/pt)
- Axis EDGE Rewards (0.25 INR/pt)
- SBI Rewardz (0.25 INR/pt)
- ICICI Reward Points (0.25 INR/pt)
- Air India Flying Returns (0.75 INR/mile)
- IndiGo BluChip (1.00 INR/pt)
- Marriott Bonvoy (0.65 INR/pt)

## AI Agents

The app includes 5 LangGraph.js agents that work in **mock mode** (no API key needed) or with a real OpenAI API key:

1. **Reward Aggregator** - Gathers and normalizes balances
2. **Valuation Agent** - Calculates real redemption value
3. **Optimization Agent** - Suggests best redemption strategy
4. **Monitoring Agent** - Detects expiring assets
5. **Personal CFO** - Conversational rewards advisor

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| GET/POST | `/api/rewards` | List/create reward accounts |
| PUT/DELETE | `/api/rewards/[id]` | Update/delete account |
| POST | `/api/agent/chat` | Chat with AI advisor (SSE) |
| POST | `/api/agent/workflow` | Run analysis workflow |
| GET/POST/PUT | `/api/admin/programs` | Manage reward programs |

## Database

SQLite database stored at `prisma/dev.db`. To switch to PostgreSQL:

1. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`
2. Update `DATABASE_URL` in `.env`
3. Install `@prisma/adapter-pg` instead of `@prisma/adapter-better-sqlite3`
4. Run `npx prisma migrate dev`
