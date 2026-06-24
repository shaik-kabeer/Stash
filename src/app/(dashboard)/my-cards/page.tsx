"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";

interface NormalizedCard {
  id: string;
  name: string;
  network: string;
  tier: string;
  annualFee: number;
  estimatedAnnualValue: number;
  color: string | null;
  bank: { name: string; code: string };
  benefits: { id: string; category: string; title: string }[];
  offers: { id: string; title: string }[];
}

interface UserCard {
  id: string;
  inputBIN: string;
  last4: string | null;
  nickname: string | null;
  network: string | null;
  bank: string | null;
  confidence: string;
  onboardedAt: string;
  normalizedCard: NormalizedCard | null;
}

const bankColors: Record<string, string> = {
  HDFC: "from-blue-600 to-blue-800",
  ICICI: "from-orange-500 to-orange-700",
  SBI: "from-blue-800 to-indigo-900",
  AXIS: "from-purple-600 to-purple-800",
  AMEX: "from-emerald-600 to-emerald-800",
  CITI: "from-red-500 to-red-700",
};

function confidenceBadge(c: string) {
  if (c === "exact") return { label: "Exact Match", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" };
  if (c === "probable") return { label: "Probable", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" };
  return { label: "Unknown", cls: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" };
}

interface CatalogCard {
  id: string;
  name: string;
  network: string;
  bank: { name: string; code: string };
}

export default function MyCardsPage() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [cardInput, setCardInput] = useState("");
  const [nickname, setNickname] = useState("");
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<{ success: boolean; message: string } | null>(null);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [correcting, setCorrecting] = useState(false);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/v2/cards?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.cards?.slice(0, 8) ?? []);
      }
    } catch { /* ignore */ }
    setSearching(false);
  };

  const handleCorrect = async (userCardId: string, cardId: string) => {
    setCorrecting(true);
    try {
      const res = await fetch("/api/cards/onboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCardId, cardId }),
      });
      if (res.ok) {
        setCorrectingId(null);
        setSearchQuery("");
        setSearchResults([]);
        loadCards();
      }
    } catch { /* ignore */ }
    setCorrecting(false);
  };

  const loadCards = () => {
    setLoading(true);
    fetch("/api/cards/onboard")
      .then((r) => {
        if (!r.ok) return { cards: [] };
        return r.json();
      })
      .then((d) => setCards(d?.cards ?? []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadCards, []);

  const handleAdd = async () => {
    const digits = cardInput.replace(/\s/g, "");
    if (digits.length < 6) {
      setAddResult({ success: false, message: "Enter at least 6 digits" });
      return;
    }
    setAdding(true);
    setAddResult(null);
    try {
      const res = await fetch("/api/cards/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: digits, nickname: nickname || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddResult({ success: false, message: data.error ?? "Failed to add card" });
      } else {
        setAddResult({ success: true, message: `${data.identity?.cardName ?? "Card"} added successfully!` });
        setCardInput("");
        setNickname("");
        loadCards();
        setTimeout(() => { setShowAdd(false); setAddResult(null); }, 2000);
      }
    } catch {
      setAddResult({ success: false, message: "Network error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Cards</h1>
          <p className="text-muted-foreground">Cards you&apos;ve added to your portfolio</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500"
        >
          {showAdd ? <X className="size-4" /> : <Plus className="size-4" />}
          {showAdd ? "Cancel" : "Add Card"}
        </button>
      </div>

      {/* Add card form */}
      {showAdd && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Add a New Card</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Enter your card number (or first 6-8 digits). We&apos;ll identify the card, bank, and match it to our catalog.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Card number or first 6-8 digits"
              value={cardInput}
              onChange={(e) => setCardInput(e.target.value)}
              className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={19}
            />
            <input
              type="text"
              placeholder="Nickname (optional)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-48"
            />
            <button
              onClick={handleAdd}
              disabled={adding}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-500 disabled:opacity-50"
            >
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
              {adding ? "Identifying..." : "Identify & Add"}
            </button>
          </div>
          {addResult && (
            <div className={`mt-3 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${addResult.success ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"}`}>
              {addResult.success ? <CheckCircle2 className="size-4" /> : <X className="size-4" />}
              {addResult.message}
            </div>
          )}
        </div>
      )}

      {/* Cards list */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <CreditCard className="mx-auto mb-4 size-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">No cards in your portfolio</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Add your first credit card to unlock personalized benefits, offers, and reward optimization.
          </p>
          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-500"
            >
              <Plus className="size-4" /> Add Your First Card
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const nc = card.normalizedCard;
            const badge = confidenceBadge(card.confidence);
            const grad = bankColors[nc?.bank?.code ?? ""] ?? "from-slate-700 to-slate-900";
            const isCorrectingThis = correctingId === card.id;
            return (
              <div key={card.id} className="space-y-2">
                <Link href={nc ? `/cards/${nc.id}` : "#"} className="group block">
                  <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${grad} p-5 text-white shadow-lg transition-transform group-hover:scale-[1.02]`}>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider opacity-80">{nc?.bank?.name ?? card.bank ?? "Unknown"}</p>
                        <p className="mt-1 truncate text-lg font-semibold">{nc?.name ?? card.nickname ?? "Unknown Card"}</p>
                      </div>
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{card.network ?? nc?.network ?? ""}</span>
                    </div>
                    <p className="mt-2 font-mono text-sm tracking-widest opacity-60">
                      •••• •••• •••• {card.last4 ?? card.inputBIN.slice(-4)}
                    </p>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        {nc && (
                          <>
                            <p className="text-xs opacity-70">Annual Value</p>
                            <p className="text-lg font-bold">₹{nc.estimatedAnnualValue.toLocaleString("en-IN")}</p>
                          </>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                    </div>
                    {nc && (
                      <div className="mt-3 flex gap-3 text-xs opacity-70">
                        <span>{nc.benefits.length} benefits</span>
                        <span>{nc.offers.length} offers</span>
                      </div>
                    )}
                  </div>
                </Link>

                {card.confidence !== "exact" && !isCorrectingThis && (
                  <button
                    onClick={() => { setCorrectingId(card.id); setSearchQuery(""); setSearchResults([]); }}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                  >
                    <RefreshCw className="size-3" /> Wrong card? Change match
                  </button>
                )}

                {isCorrectingThis && (
                  <div className="rounded-lg border bg-card p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold">Search for the correct card</p>
                      <button onClick={() => setCorrectingId(null)} className="p-0.5 text-muted-foreground hover:text-foreground">
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Type card name..."
                        className="w-full rounded-lg border bg-background py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                    {searching && <p className="mt-2 text-xs text-muted-foreground">Searching...</p>}
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                        {searchResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleCorrect(card.id, c.id)}
                            disabled={correcting}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                          >
                            <div>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground">{c.bank.name} &middot; {c.network}</p>
                            </div>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
