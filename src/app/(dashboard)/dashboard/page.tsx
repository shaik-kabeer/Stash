"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Coins,
  CreditCard,
  Heart,
  IndianRupee,
  PieChart,
  Plane,
  Plus,
  ShieldAlert,
  Sparkles,
  Star,
  Tag,
  Target,
  TrendingUp,
} from "lucide-react";

interface PortfolioCard {
  userCardId: string;
  cardId: string;
  name: string;
  bank: string;
  bankCode: string;
  network: string;
  tier: string;
  annualFee: number;
  estimatedAnnualValue: number;
  color: string | null;
  benefitCount: number;
  offerCount: number;
  confidence: string;
}

interface Portfolio {
  cards: PortfolioCard[];
  totalCards: number;
  totalEstimatedValue: number;
  totalAnnualFees: number;
  netValue: number;
  catalogSize: number;
}

interface RewardValuation {
  programName: string;
  pointName: string;
  balance: number;
  bestRedemptionRate: number;
  estimatedValueINR: number;
  bestRedemptionName: string;
  category?: string;
}

interface Valuation {
  totalRewardPrograms: number;
  totalPointsBalance: number;
  totalEstimatedValueINR: number;
  rewardNetWorth?: number;
  rewards: RewardValuation[];
  byCategory?: { category: string; totalValueINR: number; programCount: number }[];
  insights: string[];
}

interface HealthScore {
  overallScore: number;
  grade: string;
  expiringPoints: number;
  unusedBenefits: number;
  inactiveCards: number;
  potentialLoss: number;
  suggestions: string[];
  factors: { name: string; impact: number; status: string; detail: string }[];
}

interface GoalPlan {
  id: string;
  title: string;
  destination: string | null;
  targetValue: number;
  currentProgress: number;
  projectedDate: string | null;
  status: string;
}

const bankColors: Record<string, string> = {
  HDFC: "from-blue-600 to-blue-800",
  ICICI: "from-orange-500 to-orange-700",
  SBI: "from-blue-800 to-indigo-900",
  AXIS: "from-purple-600 to-purple-800",
  AMEX: "from-emerald-600 to-emerald-800",
  CITI: "from-red-500 to-red-700",
};

function getCardGradient(bankCode: string): string {
  return bankColors[bankCode] ?? "from-slate-700 to-slate-900";
}

export default function DashboardPage() {
  const [data, setData] = useState<Portfolio | null>(null);
  const [rewards, setRewards] = useState<Valuation | null>(null);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [goals, setGoals] = useState<GoalPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v2/portfolio").then((r) => r.ok ? r.json() : null),
      fetch("/api/v2/rewards").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/v2/health-score").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/v2/goals").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([portfolio, rewardsData, healthData, goalsData]) => {
      setData(portfolio?.cards ? portfolio : null);
      setRewards(rewardsData?.valuation ?? null);
      setHealth(healthData?.overallScore !== undefined ? healthData : null);
      setGoals(goalsData?.goals ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const portfolio = data ?? { cards: [], totalCards: 0, totalEstimatedValue: 0, totalAnnualFees: 0, netValue: 0, catalogSize: 0 };
  const rewardNetWorth = (rewards?.rewardNetWorth ?? 0) || (portfolio.netValue + (rewards?.totalEstimatedValueINR ?? 0));

  return (
    <div className="space-y-8">
      {/* Reward Net Worth Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-sm font-medium uppercase tracking-wider text-indigo-200">Reward Net Worth</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            ₹{Math.round(rewardNetWorth).toLocaleString("en-IN")}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-indigo-100">
            <span className="flex items-center gap-1.5">
              <CreditCard className="size-3.5" />
              {portfolio.totalCards} cards (₹{portfolio.netValue.toLocaleString("en-IN")} net)
            </span>
            <span className="flex items-center gap-1.5">
              <Coins className="size-3.5" />
              {rewards?.totalPointsBalance.toLocaleString("en-IN") ?? "0"} points (₹{Math.round(rewards?.totalEstimatedValueINR ?? 0).toLocaleString("en-IN")})
            </span>
          </div>
        </div>

        {/* Category breakdown */}
        {rewards?.byCategory && rewards.byCategory.length > 0 && (
          <div className="relative mt-5 flex flex-wrap gap-2">
            {rewards.byCategory.map((cat) => (
              <span key={cat.category} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                {cat.category}: ₹{cat.totalValueINR.toLocaleString("en-IN")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Health Score + Potential Loss */}
      {health && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex size-14 items-center justify-center rounded-full text-2xl font-bold ${
                health.grade === "excellent" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                health.grade === "good" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
                health.grade === "fair" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
              }`}>
                {health.overallScore}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Heart className="size-4 text-rose-500" />
                  <p className="font-semibold">Reward Health</p>
                </div>
                <p className="text-xs capitalize text-muted-foreground">{health.grade}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {health.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <ShieldAlert className={`mt-0.5 size-3.5 shrink-0 ${
                    f.status === "critical" ? "text-red-500" : f.status === "warning" ? "text-amber-500" : "text-emerald-500"
                  }`} />
                  <span className="text-muted-foreground">{f.detail}</span>
                  <span className={`ml-auto shrink-0 font-mono text-[10px] ${f.impact > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {f.impact > 0 ? "+" : ""}{f.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {health.potentialLoss > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/20">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Value at Risk</p>
              <p className="mt-1 text-3xl font-bold text-red-600 dark:text-red-300">₹{health.potentialLoss.toLocaleString("en-IN")}</p>
              <div className="mt-3 space-y-1 text-xs text-red-600/80 dark:text-red-300/70">
                {health.expiringPoints > 0 && <p>Expiring: {health.expiringPoints.toLocaleString("en-IN")} pts</p>}
                {health.unusedBenefits > 0 && <p>Unused benefits: {health.unusedBenefits}</p>}
                {health.inactiveCards > 0 && <p>Inactive cards: {health.inactiveCards}</p>}
              </div>
              <Link href="/rewards" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-600 dark:text-red-400">
                Fix now <ArrowRight className="size-3" />
              </Link>
            </div>
          )}

          {health.suggestions.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold">Suggestions</p>
              <div className="space-y-2">
                {health.suggestions.slice(0, 4).map((s, i) => (
                  <p key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Sparkles className="mt-0.5 size-3 shrink-0 text-indigo-500" />
                    {s}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CreditCard} label="My Cards" value={portfolio.totalCards} />
        <StatCard icon={TrendingUp} label="Card Annual Value" value={`₹${portfolio.totalEstimatedValue.toLocaleString("en-IN")}`} accent />
        <StatCard icon={Coins} label="Reward Points" value={rewards ? rewards.totalPointsBalance.toLocaleString("en-IN") : "0"} sub={rewards ? `${rewards.totalRewardPrograms} programs` : undefined} />
        <StatCard icon={IndianRupee} label="Points Worth" value={`₹${rewards ? Math.round(rewards.totalEstimatedValueINR).toLocaleString("en-IN") : "0"}`} accent sub="Unredeemed value" />
      </div>

      {/* Goal Plans */}
      {goals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Plane className="size-4" /> My Goals</h2>
            <Link href="/goals" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Manage <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {goals.slice(0, 2).map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentProgress / goal.targetValue) * 100));
              return (
                <div key={goal.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{goal.title}</p>
                      {goal.destination && <p className="text-xs text-muted-foreground">{goal.destination}</p>}
                    </div>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">{pct}%</span>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>₹{goal.currentProgress.toLocaleString("en-IN")}</span>
                      <span>₹{goal.targetValue.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  {goal.projectedDate && (
                    <p className="mt-2 text-[10px] text-muted-foreground">Projected: {new Date(goal.projectedDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Insights banner */}
      {rewards && rewards.insights.length > 0 && (
        <div className="rounded-xl border bg-gradient-to-r from-indigo-50 to-violet-50 p-5 dark:from-indigo-950/20 dark:to-violet-950/20">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="size-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Smart Insights</h3>
          </div>
          <ul className="space-y-1.5">
            {rewards.insights.slice(0, 3).map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Star className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reward balances */}
      {rewards && rewards.rewards.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Reward Balances</h2>
            <Link href="/rewards" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Manage rewards <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.rewards.map((r) => (
              <Link key={r.programName} href="/rewards" className="group rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-indigo-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{r.programName}</p>
                    <p className="mt-0.5 text-xl font-bold">{r.balance.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground">{r.pointName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">₹{r.estimatedValueINR.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground">{r.bestRedemptionName}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Card tiles */}
      {portfolio.cards.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Cards</h2>
            <Link href="/my-cards" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.cards.map((card) => (
              <Link key={card.userCardId} href={`/cards/${card.cardId}`} className="group">
                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getCardGradient(card.bankCode)} p-5 text-white shadow-lg transition-transform group-hover:scale-[1.02]`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider opacity-80">{card.bank}</p>
                      <p className="mt-1 text-lg font-semibold">{card.name}</p>
                    </div>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{card.network}</span>
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-xs opacity-70">Annual Value</p>
                      <p className="text-lg font-bold">₹{card.estimatedAnnualValue.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right text-xs opacity-70">
                      <p>{card.benefitCount} benefits</p>
                      <p>{card.offerCount} offers</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/my-cards" className="flex min-h-[160px] items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-indigo-400 hover:bg-indigo-50/5">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Plus className="size-8" />
                <span className="text-sm font-medium">Add a Card</span>
              </div>
            </Link>
          </div>
        </section>
      ) : (
        <div className="rounded-xl border bg-card p-12 text-center">
          <CreditCard className="mx-auto mb-4 size-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">No cards yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Add your first card to see your portfolio value, benefits, and personalized recommendations.
          </p>
          <Link href="/my-cards" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-500">
            <Plus className="size-4" /> Add Your First Card
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <QuickAction href="/rewards" icon={Coins} title="Rewards" description="View & optimize points" />
          <QuickAction href="/simulator" icon={PieChart} title="Simulator" description="Compare redemption values" />
          <QuickAction href="/goals" icon={Target} title="Goal Planner" description="Plan trips with rewards" />
          <QuickAction href="/explore" icon={CreditCard} title="Explore" description={`${portfolio.catalogSize}+ cards`} />
          <QuickAction href="/advisor" icon={Sparkles} title="AI Advisor" description="Personalized advice" />
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, sub }: { icon: React.ElementType; label: string; value: string | number; accent?: boolean; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-lg ${accent ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" : "bg-muted text-muted-foreground"}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, description }: { href: string; icon: React.ElementType; title: string; description: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
