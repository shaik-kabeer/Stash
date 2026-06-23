"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Tag, X } from "lucide-react";

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

const bankColors: Record<string, string> = {
  HDFC: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  ICICI: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  SBI: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  AXIS: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  AMEX: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  CITI: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export default function OffersPage() {
  const [tab, setTab] = useState<"my" | "all">("all");
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
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
      const myCardIds = new Set((portfolioData.cards ?? []).map((c: { cardId: string }) => c.cardId));
      setMyOffers(offers.filter((o) => myCardIds.has(o.card?.id)));
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
        <p className="text-muted-foreground">Discover deals and discounts across credit cards</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b">
        <button
          onClick={() => setTab("all")}
          className={`pb-2.5 text-sm font-medium transition-colors ${tab === "all" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-muted-foreground hover:text-foreground"}`}
        >
          All Offers ({allOffers.length})
        </button>
        <button
          onClick={() => setTab("my")}
          className={`pb-2.5 text-sm font-medium transition-colors ${tab === "my" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-muted-foreground hover:text-foreground"}`}
        >
          My Card Offers ({myOffers.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter by merchant, card, or keyword..."
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

      {/* Offers list */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Tag className="mx-auto mb-4 size-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">
            {tab === "my" ? "No offers for your cards" : "No offers found"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "my" ? "Add more cards to your portfolio to see personalized offers." : "Try a different search term."}
          </p>
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
                  {offer.merchant && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{offer.merchant}</span>
                  )}
                  {offer.category && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{offer.category}</span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Link
                    href={`/cards/${offer.card?.id}`}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bankBadge} transition-opacity hover:opacity-80`}
                  >
                    {offer.card?.bank?.name} &middot; {offer.card?.name}
                  </Link>
                  {offer.validTo && (
                    <p className="text-[10px] text-muted-foreground">
                      Until {new Date(offer.validTo).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
