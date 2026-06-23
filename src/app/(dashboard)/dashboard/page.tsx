"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Coins,
  CreditCard,
  IndianRupee,
  Plus,
  Sparkles,
  Star,
  Tag,
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
}

interface Valuation {
  totalRewardPrograms: number;
  totalPointsBalance: number;
  totalEstimatedValueINR: number;
  rewards: RewardValuation[];
  insights: string[];
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v2/portfolio").then((r) => r.ok ? r.json() : null),
      fetch("/api/v2/rewards").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([portfolio, rewardsData]) => {
      setData(portfolio?.cards ? portfolio : null);
      setRewards(rewardsData?.valuation ?? null);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your cards and rewards at a glance</p>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CreditCard} label="My Cards" value={portfolio.totalCards} />
        <StatCard icon={TrendingUp} label="Card Annual Value" value={`₹${portfolio.totalEstimatedValue.toLocaleString("en-IN")}`} accent />
        <StatCard icon={Coins} label="Reward Points" value={rewards ? rewards.totalPointsBalance.toLocaleString("en-IN") : "0"} sub={rewards ? `${rewards.totalRewardPrograms} programs` : undefined} />
        <StatCard icon={IndianRupee} label="Points Value" value={`₹${rewards ? Math.round(rewards.totalEstimatedValueINR).toLocaleString("en-IN") : "0"}`} accent sub="Unredeemed value" />
      </div>

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
          {rewards.insights.length > 3 && (
            <Link href="/rewards" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500">
              View all insights <ArrowRight className="size-3" />
            </Link>
          )}
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
            {rewards.rewards.slice(0, 3).map((r) => (
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/rewards" icon={Coins} title="Rewards" description="View & optimize your reward points" />
          <QuickAction href="/explore" icon={CreditCard} title="Explore Cards" description={`Browse ${portfolio.catalogSize}+ cards in catalog`} />
          <QuickAction href="/offers" icon={Tag} title="View Offers" description="Deals across all your cards" />
          <QuickAction href="/advisor" icon={Sparkles} title="AI Advisor" description="Personalized recommendations" />
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
