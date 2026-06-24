"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BadgePercent,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gift,
  IndianRupee,
  Loader2,
  Plane,
  Shield,
  Star,
  Tag,
  TrendingUp,
} from "lucide-react";
import { getRedeemLinks } from "@/lib/rewards/redeem-links";

interface Benefit {
  id: string;
  category: string;
  title: string;
  description: string;
  valueEstimate: number;
}

interface RedemptionOption {
  id: string;
  name: string;
  type: string;
  description: string | null;
  estimatedCPP: number;
  minPoints: number;
}

interface TransferPartner {
  id: string;
  partnerName: string;
  partnerType: string;
  transferRatio: string;
  estimatedCPP: number;
}

interface RewardProgram {
  id: string;
  name: string;
  pointName: string;
  earnRate: string | null;
  earnDescription: string | null;
  redemptions: RedemptionOption[];
  transferPartners: TransferPartner[];
}

interface Offer {
  id: string;
  title: string;
  description: string | null;
  merchant: string | null;
  discountValue: string | null;
  validFrom: string | null;
  validTo: string | null;
}

interface CardDetail {
  id: string;
  name: string;
  network: string;
  cardType: string;
  tier: string;
  annualFee: number;
  joiningFee: number;
  estimatedAnnualValue: number;
  bestFor: string | null;
  imageUrl: string | null;
  color: string | null;
  bank: { id: string; name: string; code: string; logoUrl: string | null };
  benefits: Benefit[];
  rewardPrograms: RewardProgram[];
  offers: Offer[];
}

const HIDDEN_BENEFIT_CATEGORIES = ["insurance", "golf", "forex", "milestone", "concierge"];

const categoryIcons: Record<string, React.ElementType> = {
  lounge: Plane,
  travel: Plane,
  fuel: CreditCard,
  dining: Gift,
  shopping: Tag,
  cashback: IndianRupee,
  insurance: Shield,
  entertainment: Star,
  golf: Award,
  forex: IndianRupee,
  milestone: TrendingUp,
  concierge: Star,
};

const bankColors: Record<string, string> = {
  HDFC: "from-blue-600 to-blue-800",
  ICICI: "from-orange-500 to-orange-700",
  SBI: "from-blue-800 to-indigo-900",
  AXIS: "from-purple-600 to-purple-800",
  AMEX: "from-emerald-600 to-emerald-800",
  CITI: "from-red-500 to-red-700",
};

export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/v2/cards/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setCard)
      .catch(() => setError("Card not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="space-y-4">
        <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Explore
        </Link>
        <div className="rounded-xl border bg-card p-12 text-center">
          <CreditCard className="mx-auto mb-4 size-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">Card Not Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">This card doesn&apos;t exist in our catalog.</p>
        </div>
      </div>
    );
  }

  const grad = bankColors[card.bank.code] ?? "from-slate-700 to-slate-900";
  const benefitsByCategory: Record<string, Benefit[]> = {};
  card.benefits.forEach((b) => {
    (benefitsByCategory[b.category] ??= []).push(b);
  });
  const netValue = card.estimatedAnnualValue - card.annualFee;
  const hiddenBenefits = card.benefits.filter(
    (b) => HIDDEN_BENEFIT_CATEGORIES.includes(b.category) && b.valueEstimate > 0,
  );
  const estimatedLostValue = hiddenBenefits.reduce((sum, b) => sum + b.valueEstimate, 0);

  return (
    <div className="space-y-8">
      <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Explore
      </Link>

      {/* Card header */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-8 text-white shadow-xl`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider opacity-80">{card.bank.name}</p>
            <h1 className="mt-1 text-3xl font-bold">{card.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">{card.network}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize">{card.tier}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize">{card.cardType}</span>
            </div>
            {card.bestFor && <p className="mt-3 text-sm opacity-80">Best for: {card.bestFor}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 text-right">
            <div>
              <p className="text-xs opacity-70">Annual Fee</p>
              <p className="text-2xl font-bold">₹{card.annualFee.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Est. Annual Value</p>
              <p className="text-2xl font-bold text-emerald-300">₹{card.estimatedAnnualValue.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Value analysis */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IndianRupee className="size-4" /> Joining Fee
          </div>
          <p className="mt-1 text-xl font-bold">₹{card.joiningFee.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4" /> Net Annual Value
          </div>
          <p className={`mt-1 text-xl font-bold ${netValue >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {netValue >= 0 ? "+" : ""}₹{netValue.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BadgePercent className="size-4" /> Value-to-Fee Ratio
          </div>
          <p className="mt-1 text-xl font-bold">
            {card.annualFee > 0 ? `${(card.estimatedAnnualValue / card.annualFee).toFixed(1)}x` : "∞"}
          </p>
        </div>
      </div>

      {/* Benefits grid */}
      {Object.keys(benefitsByCategory).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Benefits</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(benefitsByCategory).map(([cat, benefits]) => {
              const Icon = categoryIcons[cat] ?? Gift;
              return (
                <div key={cat} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                      <Icon className="size-4" />
                    </div>
                    <h3 className="text-sm font-semibold capitalize">{cat}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{benefits.length}</span>
                  </div>
                  <ul className="space-y-2">
                    {benefits.map((b) => (
                      <li key={b.id} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                        <div>
                          <span className="font-medium">{b.title}</span>
                          <p className="text-xs text-muted-foreground">{b.description}</p>
                          {b.valueEstimate > 0 && <p className="text-xs font-medium text-emerald-600">Value: ₹{b.valueEstimate.toLocaleString("en-IN")}/yr</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hiddenBenefits.length > 0 && (
        <section className="rounded-xl border-2 border-amber-400/60 bg-amber-50/50 p-5 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertTriangle className="size-4" />
            </div>
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
              Hidden Benefits You May Not Be Using
            </h2>
          </div>
          <ul className="space-y-3">
            {hiddenBenefits.map((b) => {
              const Icon = categoryIcons[b.category] ?? Gift;
              return (
                <li key={b.id} className="flex items-start gap-3 rounded-lg border border-amber-200/60 bg-white/80 px-4 py-3 dark:border-amber-500/20 dark:bg-background/60">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{b.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{b.category}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    ₹{b.valueEstimate.toLocaleString("en-IN")}/yr
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 border-t border-amber-200/60 pt-3 text-sm font-semibold text-amber-800 dark:border-amber-500/20 dark:text-amber-300">
            Estimated Lost Value: ₹{estimatedLostValue.toLocaleString("en-IN")}/year
          </p>
        </section>
      )}

      {/* Reward programs */}
      {card.rewardPrograms.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Reward Programs</h2>
          {card.rewardPrograms.map((program) => (
            <div key={program.id} className="rounded-xl border bg-card shadow-sm">
              <div className="border-b p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{program.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {program.pointName} &middot; {program.earnDescription ?? ""}
                    </p>
                  </div>
                  {program.earnRate && (
                    <span className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {program.earnRate}
                    </span>
                  )}
                </div>
              </div>

              {program.redemptions.length > 0 && (
                <div className="border-b p-5">
                  <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Redemption Options</h4>
                  <div className="space-y-2">
                    {program.redemptions
                      .sort((a, b) => b.estimatedCPP - a.estimatedCPP)
                      .map((r, i) => (
                        <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                            <div>
                              <p className="text-sm font-medium">{r.name}</p>
                              {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-600">{(r.estimatedCPP ?? 0).toFixed(2)} cpp</p>
                            {r.minPoints && <p className="text-[10px] text-muted-foreground">Min: {r.minPoints.toLocaleString()} pts</p>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {program.transferPartners.length > 0 && (
                <div className="p-5">
                  <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Transfer Partners</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {program.transferPartners.map((tp) => (
                      <div key={tp.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium">{tp.partnerName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{tp.partnerType} &middot; {tp.transferRatio}</p>
                        </div>
                        <p className="text-sm font-bold text-indigo-600">{(tp.estimatedCPP ?? 0).toFixed(2)} cpp</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Redemption Deep Links */}
      {(() => {
        const links = getRedeemLinks(card.bank.name);
        if (links.length === 0) return null;
        return (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Redeem Your Rewards</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <ExternalLink className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{link.label}</p>
                    <p className="truncate text-xs text-muted-foreground capitalize">{link.type} portal</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Offers */}
      {card.offers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Active Offers</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {card.offers.map((offer) => (
              <div key={offer.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{offer.title}</p>
                    {offer.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{offer.description}</p>}
                    {offer.merchant && <p className="mt-1 text-xs font-medium text-indigo-600">{offer.merchant}</p>}
                  </div>
                  {offer.discountValue && (
                    <span className="ml-3 shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {offer.discountValue}
                    </span>
                  )}
                </div>
                {(offer.validFrom || offer.validTo) && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {offer.validFrom && `From: ${new Date(offer.validFrom).toLocaleDateString()}`}
                    {offer.validFrom && offer.validTo && " · "}
                    {offer.validTo && `Until: ${new Date(offer.validTo).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
