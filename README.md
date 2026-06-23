# Stash - Loyalty Asset Operating System

A full-stack SaaS platform for aggregating, analyzing, and optimizing credit card rewards, loyalty points, miles, and cashback.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Next.js API Routes, Prisma 7 ORM
- **Database:** SQLite (local) / Turso (production)
- **Auth:** NextAuth.js (JWT + Credentials)
- **AI:** LangGraph.js agents with Groq (llama-3.3-70b-versatile)
- **Data Pipeline:** Playwright, Firecrawl, pdf-parse, OpenAI structured outputs

## Features

- BIN detection and card onboarding engine
- Normalized card/bank/benefit/program knowledge graph
- Reward portfolio valuation and optimization
- "Best Card for Category X" engine
- AI advisor (4 LangGraph agents + rule-based fallback)
- Email parsing for reward balance extraction
- Manual reward balance tracking
- Redemption deep-links to bank portals
- Admin dashboard for data pipeline management
- Compare cards, explore catalog, active offers

## Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed demo data
npx tsx prisma/seed.mts
npx tsx prisma/seed-normalized.mts

# Start dev server
npx next dev
```

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY="your-groq-key"
```

Demo login: `arjun@rewardos.in` / `demo1234`

## Deploy to Vercel + Turso (Free)

### 1. Create Turso Database

Sign up at [turso.tech](https://turso.tech) (free tier: 9GB storage), then:

- Create a database named `stash`
- Copy the **Database URL** (`libsql://stash-yourusername.turso.io`)
- Create an **Auth Token** from database settings

### 2. Seed the Turso Database

Add Turso credentials to your local `.env`:

```env
TURSO_DATABASE_URL="libsql://stash-yourusername.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
```

Then push the schema and seed:

```bash
npx prisma db push
npx tsx prisma/seed.mts
npx tsx prisma/seed-normalized.mts
```

### 3. Deploy to Vercel

Connect your GitHub repo at [vercel.com](https://vercel.com), then add these environment variables:

| Variable | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://stash-yourusername.turso.io` |
| `TURSO_AUTH_TOKEN` | Your Turso auth token |
| `NEXTAUTH_SECRET` | Any random string (use `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your Vercel deployment URL |
| `GROQ_API_KEY` | Your Groq API key (optional) |

Deploy and you're live.

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected pages (dashboard, cards, rewards, etc.)
│   ├── api/             # API routes (v2/, admin/, cards/, auth/)
│   ├── login/           # Login page
│   └── register/        # Registration page
├── lib/
│   ├── agents/          # LangGraph AI agents
│   ├── cards/           # Card onboarding engine
│   ├── email/           # Email parser
│   ├── extraction/      # AI data extraction pipeline
│   ├── graph/           # Knowledge graph queries
│   └── rewards/         # Valuator, optimizer, best-card engine
├── components/          # UI components (shadcn/ui)
└── proxy.ts             # Auth middleware
prisma/
├── schema.prisma        # Database schema
├── seed.mts             # Demo user + legacy data seed
└── seed-normalized.mts  # Normalized card knowledge graph seed
```

## License

MIT
