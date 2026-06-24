"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Gift,
  Loader2,
  Search,
  Shield,
  Sparkles,
  Star,
  Tag,
  X,
} from "lucide-react";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  merchant: string | null;
  category: string | null;
  discountValue: string | null;
  validFrom: string | null;
  validTo: string | null;
  card: {
    id: string;
    name: string;
    bank: { name: string; code: string };
  };
}

interface CardBenefit {
  id: string;
  title: string;
  description: string;
  category: string;
  cardId: string;
  cardName: string;
  bankName: string;
  bankCode: string;
}

interface PortfolioCard {
  cardId: string;
  normalizedCard: {
    id: string;
    name: string;
    bank: { name: string; code: string };
    benefits: { id: string; title: string; description: string; category: string }[];
  } | null;
}

const bankColors: Record<string, string> = {
  HDFC: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  ICICI: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  SBI: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  AXIS: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  AMEX: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  CITI: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const categoryIcons: Record<string, React.ElementType> = {
  lounge: Sparkles,
  travel: Sparkles,
  insurance: Shield,
  dining: Star,
  shopping: Gift,
  fuel: Star,
  entertainment: Star,
};

export default function OffersPage() {
  const [tab, setTab] = useState<"my" | "all" | "perks">("my");
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [cardPerks, setCardPerks] = useState<CardBenefit[]>([]);
  const [hasCards, setHasCards] = useState(true);
  const [loading, setLoading] = useState(true);
  const [merchantFilter, setMerchantFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/v2/offers").then((r) => r.ok ? r.json() : { offers: [] }),
      fetch("/api/v2/portfolio").then((r) => r.ok ? r.json() : { cards: [] }).catch(() => ({ cards: [] })),
    ]).then(([offersData, portfolioData]) => {
      const offers: Offer[] = offersData.offers ?? [];
      setAllOffers(offers);

      const portfolioCards: PortfolioCard[] = portfolioData.cards ?? [];
      setHasCards(portfolioCards.length > 0);
      const myCardIds = new Set(portfolioCards.map((c) => c.cardId).filter(Boolean));
      setMyOffers(offers.filter((o) => myCardIds.has(o.card?.id)));

      const perks: CardBenefit[] = [];
      for (const pc of portfolioCards) {
        if (!pc.normalizedCard) continue;
        for (const b of pc.normalizedCard.benefits) {
          perks.push({
            id: b.id,
            title: b.title,
            description: b.description,
            category: b.category,
            cardId: pc.normalizedCard.id,
            cardName: pc.normalizedCard.name,
            bankName: pc.normalizedCard.bank.name,
            bankCode: pc.normalizedCard.bank.code,
          });
        }
      }
      setCardPerks(perks);

      if (offers.filter((o) => myCardIds.has(o.card?.id)).length === 0 && perks.length > 0) {
        setTab("perks");
      }
    }).catch(() => {
      setAllOffers([]);
      setMyOffers([]);
    }).finally(() => setLoading(false));
  }, []);

  const displayOffers = tab === "my" ? myOffers : allOffers;
  const filtered = merchantFilter
    ? displayOffers.filter((o) =>
        o.merchant?.toLowerCase().includes(merchantFilter.toLowerCase()) ||
        o.title.toLowerCase().includes(merchantFilter.toLowerCase()) ||
        o.card?.name.toLowerCase().includes(merchantFilter.toLowerCase())
      )
    : displayOffers;

  const filteredPerks = merchantFilter
    ? cardPerks.filter((p) =>
        p.title.toLowerCase().includes(merchantFilter.toLowerCase()) ||
        p.category.toLowerCase().includes(merchantFilter.toLowerCase()) ||
        p.cardName.toLowerCase().includes(merchantFilter.toLowerCase())
      )
    : cardPerks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offers & Perks</h1>
        <p className="text-muted-foreground">Discover deals, discounts, and permanent benefits across your cards</p>
      </div>

      <div className="flex items-center gap-4 border-b">
        <button
          onClick={() => setTab("my")}
          className={`pb-2.5 text-sm font-medium transition-colors ${tab === "my" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-muted-foreground hover:text-foreground"}`}
        >
          My Card Offers ({myOffers.length})
        </button>
        <button
          onClick={() => setTab("perks")}
          className={`pb-2.5 text-sm font-medium transition-colors ${tab === "perks" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-muted-foreground hover:text-foreground"}`}
        >
          Permanent Perks ({cardPerks.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`pb-2.5 text-sm font-medium transition-colors ${tab === "all" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-muted-foreground hover:text-foreground"}`}
        >
          All Offers ({allOffers.length})
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={tab === "perks" ? "Filter by benefit, category, or card..." : "Filter by merchant, card, or keyword..."}
          value={merchantFilter}
          onChange={(e) => setMerchantFilter(e.target.value)}
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {merchantFilter && (
          <button onClick={() => setMerchantFilter("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !hasCards ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <CreditCard className="mx-auto mb-4 size-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">Add your cards first</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Add credit cards to your portfolio to see personalized offers and permanent perks.
          </p>
          <Link href="/my-cards" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            <CreditCard className="size-4" /> Add Cards
          </Link>
        </div>
      ) : tab === "perks" ? (
        filteredPerks.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <Gift className="mx-auto mb-4 size-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No perks found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or add more cards.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPerks.map((perk) => {
              const Icon = categoryIcons[perk.category] ?? Star;
              const badgeColor = bankColors[perk.bankCode] ?? "bg-muted text-muted-foreground";
              return (
                <div key={perk.id} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/10">
                      <Icon className="size-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight">{perk.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{perk.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Link href={`/cards/${perk.cardId}`} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor} transition-opacity hover:opacity-80`}>
                      {perk.bankName} &middot; {perk.cardName}
                    </Link>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] capitalize">{perk.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Tag className="mx-auto mb-4 size-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">
            {tab === "my" ? "No active offers for your cards right now" : "No offers found"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {tab === "my"
              ? "Check out your permanent card perks or explore new cards."
              : "Try a different search term."}
          </p>
          {tab === "my" && (
            <div className="mt-4 flex justify-center gap-3">
              {cardPerks.length > 0 && (
                <button onClick={() => setTab("perks")} className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
                  <Sparkles className="size-3.5" /> View Permanent Perks
                </button>
              )}
              <Link href="/explore" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                <CreditCard className="size-3.5" /> Explore Cards
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((offer) => {
            const bankBadge = bankColors[offer.card?.bank?.code ?? ""] ?? "bg-muted text-muted-foreground";
            return (
              <div key={offer.id} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{offer.title}</p>
                    {offer.description && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{offer.description}</p>
                    )}
                  </div>
                  {offer.discountValue && (
                    <span className="ml-3 shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {offer.discountValue}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {offer.merchant && <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{offer.merchant}</span>}
                  {offer.category && <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{offer.category}</span>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Link href={`/cards/${offer.card?.id}`} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bankBadge} transition-opacity hover:opacity-80`}>
                    {offer.card?.bank?.name} &middot; {offer.card?.name}
                  </Link>
                  {offer.validTo && <p className="text-[10px] text-muted-foreground">Until {new Date(offer.validTo).toLocaleDateString()}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
