"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  CreditCard,
  Filter,
  Loader2,
  Search,
  X,
} from "lucide-react";

interface Card {
  id: string;
  name: string;
  network: string;
  tier: string;
  annualFee: number;
  estimatedAnnualValue: number;
  color: string | null;
  bank: { id: string; name: string; code: string };
  benefits: { id: string; category: string; title: string; description: string }[];
  _count?: { benefits: number; offers: number };
}

const CATEGORIES = [
  "all",
  "lounge",
  "travel",
  "fuel",
  "dining",
  "shopping",
  "cashback",
  "insurance",
  "entertainment",
  "golf",
];

const bankColors: Record<string, string> = {
  HDFC: "from-blue-600 to-blue-800",
  ICICI: "from-orange-500 to-orange-700",
  SBI: "from-blue-800 to-indigo-900",
  AXIS: "from-purple-600 to-purple-800",
  AMEX: "from-emerald-600 to-emerald-800",
  CITI: "from-red-500 to-red-700",
};

interface BestCardCategory {
  category: string;
  cards: {
    cardId: string;
    cardName: string;
    bankName: string;
    network: string;
    annualFee: number;
    estimatedAnnualValue: number;
    relevantBenefits: { title: string; description: string; valueEstimate: number }[];
    score: number;
    color: string;
  }[];
}

type SortKey = "bank" | "fee-low" | "fee-high" | "value-high" | "value-low";

export default function ExplorePage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("value-high");
  const [allBanks, setAllBanks] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [binInput, setBinInput] = useState("");
  const [binResult, setBinResult] = useState<Card | null>(null);
  const [binLoading, setBinLoading] = useState(false);
  const [binError, setBinError] = useState("");
  const [bestCards, setBestCards] = useState<BestCardCategory[]>([]);
  const [selectedBestCategory, setSelectedBestCategory] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      const url = category !== "all"
        ? `/api/v2/benefits?category=${category}`
        : `/api/v2/cards?${params}`;
      const res = await fetch(url);
      const data = await res.json();
      let fetched: Card[];
      if (category !== "all") {
        const benefitCards: Card[] = data.benefits?.map((b: { card: Card }) => b.card).filter(Boolean) ?? [];
        fetched = Array.from(new Map(benefitCards.map((c) => [c.id, c])).values());
      } else {
        fetched = data.cards ?? [];
      }
      setCards(fetched);
      const banks = Array.from(new Set(fetched.map((c) => c.bank?.name).filter(Boolean))).sort() as string[];
      if (banks.length > allBanks.length) setAllBanks(banks);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [query, category, allBanks.length]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  useEffect(() => {
    fetch("/api/v2/best-card")
      .then((r) => r.ok ? r.json() : { categories: [] })
      .then((d) => setBestCards(d.categories ?? []))
      .catch(() => {});
  }, []);

  const handleBinLookup = async () => {
    const digits = binInput.replace(/\s/g, "");
    if (digits.length < 6) { setBinError("Enter at least 6 digits"); return; }
    setBinLoading(true);
    setBinError("");
    setBinResult(null);
    try {
      const res = await fetch(`/api/v2/cards?bin=${digits.slice(0, 8)}`);
      const data = await res.json();
      if (data.cards?.length > 0) {
        setBinResult(data.cards[0]);
      } else {
        setBinError("No card found for this BIN");
      }
    } catch {
      setBinError("Lookup failed");
    } finally {
      setBinLoading(false);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const compareCards = cards.filter((c) => compareIds.has(c.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Explore Cards</h1>
          <p className="text-muted-foreground">Browse, search, compare, and discover credit cards</p>
        </div>
        <button
          onClick={() => { setCompareMode(!compareMode); if (compareMode) setCompareIds(new Set()); }}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${compareMode ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" : "hover:bg-muted"}`}
        >
          <ArrowLeftRight className="size-4" />
          {compareMode ? `Comparing (${compareIds.size})` : "Compare"}
        </button>
      </div>

      {/* Best Card Engine */}
      {bestCards.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold">Best Card For...</h3>
            <p className="text-xs text-muted-foreground">Pick a category to see top cards ranked by real benefit data</p>
          </div>
          <div className="px-5 py-3">
            <div className="flex flex-wrap gap-2">
              {bestCards.map((bc) => (
                <button
                  key={bc.category}
                  onClick={() => setSelectedBestCategory(selectedBestCategory === bc.category ? null : bc.category)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${selectedBestCategory === bc.category ? "bg-indigo-600 text-white" : "bg-muted hover:bg-muted/80"}`}
                >
                  {bc.category}
                </button>
              ))}
            </div>
            {selectedBestCategory && (() => {
              const bc = bestCards.find((c) => c.category === selectedBestCategory);
              if (!bc || bc.cards.length === 0) return null;
              return (
                <div className="mt-4 space-y-3">
                  {bc.cards.map((c, i) => (
                    <Link key={c.cardId} href={`/cards/${c.cardId}`} className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        #{i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{c.cardName}</p>
                        <p className="text-xs text-muted-foreground">{c.bankName} &middot; {c.network} &middot; Fee: ₹{c.annualFee.toLocaleString("en-IN")}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.relevantBenefits.slice(0, 3).map((b, j) => (
                            <span key={j} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{b.title}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{c.estimatedAnnualValue.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] text-muted-foreground">est. value/yr</p>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Search + BIN lookup */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cards by name, bank, or network..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="BIN (6-8 digits)"
            value={binInput}
            onChange={(e) => setBinInput(e.target.value)}
            className="w-40 rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            maxLength={8}
          />
          <button
            onClick={handleBinLookup}
            disabled={binLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {binLoading ? <Loader2 className="size-4 animate-spin" /> : "Lookup"}
          </button>
        </div>
      </div>

      {/* BIN result */}
      {(binResult || binError) && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${binError ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"}`}>
          {binError ? (
            <span>{binError}</span>
          ) : (
            <span>
              BIN match: <Link href={`/cards/${binResult!.id}`} className="font-medium underline">{binResult!.name}</Link> by {binResult!.bank.name}
            </span>
          )}
          <button onClick={() => { setBinResult(null); setBinError(""); }} className="ml-2"><X className="size-4" /></button>
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${category === cat ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {cat === "all" ? "All Cards" : cat}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-muted-foreground" />
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Banks</option>
              {allBanks.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="value-high">Value: High to Low</option>
            <option value="value-low">Value: Low to High</option>
            <option value="fee-low">Fee: Low to High</option>
            <option value="fee-high">Fee: High to Low</option>
            <option value="bank">Group by Bank</option>
          </select>
        </div>
      </div>

      {/* Compare panel */}
      {compareMode && compareIds.size >= 2 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold">Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-5 py-3 font-medium text-muted-foreground">Feature</th>
                  {compareCards.map((c) => (
                    <th key={c.id} className="px-5 py-3 font-medium">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-5 py-2.5 text-muted-foreground">Bank</td>
                  {compareCards.map((c) => <td key={c.id} className="px-5 py-2.5">{c.bank.name}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="px-5 py-2.5 text-muted-foreground">Network</td>
                  {compareCards.map((c) => <td key={c.id} className="px-5 py-2.5">{c.network}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="px-5 py-2.5 text-muted-foreground">Annual Fee</td>
                  {compareCards.map((c) => <td key={c.id} className="px-5 py-2.5">₹{c.annualFee.toLocaleString("en-IN")}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="px-5 py-2.5 text-muted-foreground">Est. Annual Value</td>
                  {compareCards.map((c) => <td key={c.id} className="px-5 py-2.5 font-medium text-emerald-600">₹{c.estimatedAnnualValue.toLocaleString("en-IN")}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="px-5 py-2.5 text-muted-foreground">Tier</td>
                  {compareCards.map((c) => <td key={c.id} className="px-5 py-2.5 capitalize">{c.tier}</td>)}
                </tr>
                <tr>
                  <td className="px-5 py-2.5 text-muted-foreground">Benefits</td>
                  {compareCards.map((c) => (
                    <td key={c.id} className="px-5 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(c.benefits ?? []).slice(0, 5).map((b) => (
                          <span key={b.id} className="rounded bg-muted px-1.5 py-0.5 text-xs">{b.category}</span>
                        ))}
                        {(c.benefits?.length ?? 0) > 5 && <span className="text-xs text-muted-foreground">+{(c.benefits?.length ?? 0) - 5}</span>}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card grid */}
      {(() => {
        if (loading) return (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        );
        const filtered = (bankFilter !== "all" ? cards.filter((c) => c.bank?.name === bankFilter) : cards).toSorted((a, b) => {
          switch (sortBy) {
            case "fee-low": return a.annualFee - b.annualFee;
            case "fee-high": return b.annualFee - a.annualFee;
            case "value-low": return a.estimatedAnnualValue - b.estimatedAnnualValue;
            case "bank": return (a.bank?.name ?? "").localeCompare(b.bank?.name ?? "");
            default: return b.estimatedAnnualValue - a.estimatedAnnualValue;
          }
        });
        if (filtered.length === 0) return (
          <div className="rounded-xl border bg-card p-12 text-center">
            <CreditCard className="mx-auto mb-4 size-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No cards found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or category filter.</p>
          </div>
        );
        return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((card) => {
            const grad = bankColors[card.bank?.code ?? ""] ?? "from-slate-700 to-slate-900";
            const isSelected = compareIds.has(card.id);
            return (
              <div key={card.id} className="group relative">
                {compareMode && (
                  <button
                    onClick={() => toggleCompare(card.id)}
                    className={`absolute right-3 top-3 z-10 flex size-6 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? "border-indigo-400 bg-indigo-600 text-white" : "border-white/50 bg-black/20 text-white/70 hover:bg-black/40"}`}
                  >
                    {isSelected && <span className="text-xs font-bold">✓</span>}
                  </button>
                )}
                <Link href={`/cards/${card.id}`}>
                  <div className={`overflow-hidden rounded-xl bg-gradient-to-br ${grad} p-5 text-white shadow-lg transition-transform group-hover:scale-[1.02]`}>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider opacity-80">{card.bank?.name}</p>
                        <p className="mt-1 truncate text-lg font-semibold">{card.name}</p>
                      </div>
                      <div className="ml-2 flex flex-col items-end gap-1">
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{card.network}</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] capitalize">{card.tier}</span>
                      </div>
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-xs opacity-70">Annual Fee</p>
                        <p className="font-semibold">₹{card.annualFee.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-70">Est. Value</p>
                        <p className="font-semibold">₹{card.estimatedAnnualValue.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    {card.benefits && card.benefits.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {card.benefits.slice(0, 4).map((b) => (
                          <span key={b.id} className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] capitalize">{b.category}</span>
                        ))}
                        {card.benefits.length > 4 && <span className="text-[10px] opacity-60">+{card.benefits.length - 4}</span>}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
        );
      })()}
    </div>
  );
}
