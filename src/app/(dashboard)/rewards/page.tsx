"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgePercent,
  Banknote,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  CreditCard,
  Edit3,
  ExternalLink,
  Gift,
  IndianRupee,
  Loader2,
  Plane,
  Plus,
  Star,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { getRedeemLinks } from "@/lib/rewards/redeem-links";

interface RewardProgram {
  id: string;
  name: string;
  pointName: string;
  earnRate: string;
  earnDescription: string | null;
  card: {
    id: string;
    name: string;
    bank: { name: string; code: string } | null;
  };
  redemptions: { id: string; name: string; type: string; conversionRate: number; minPoints: number; description: string | null; estimatedCPP: number; isActive: boolean }[];
  transferPartners: { id: string; partnerName: string; partnerType: string; transferRatio: string; transferFee: number; transferTime: string | null; estimatedCPP: number }[];
}

interface UserRewardEntry {
  id: string;
  programId: string;
  programName: string;
  pointName: string;
  bankName: string;
  cardName: string;
  balance: number;
  expiryDate: string | null;
  expiryMonths: number | null;
  lastSynced: string;
  bestRedemptionRate: number;
}

interface Valuation {
  totalCards: number;
  totalRewardPrograms: number;
  totalPointsBalance: number;
  totalEstimatedValueINR: number;
  cards: { cardName: string; bankName: string; annualFee: number; estimatedAnnualValue: number; netValue: number }[];
  rewards: { programName: string; pointName: string; balance: number; bestRedemptionRate: number; estimatedValueINR: number; bestRedemptionName: string }[];
  insights: string[];
}

interface ProgramsByBank {
  bankName: string;
  programs: RewardProgram[];
}

const bankColors: Record<string, string> = {
  HDFC: "from-blue-600 to-blue-800",
  ICICI: "from-orange-500 to-orange-700",
  SBI: "from-blue-800 to-indigo-900",
  AXIS: "from-purple-600 to-purple-800",
  AMEX: "from-emerald-600 to-emerald-800",
  CITI: "from-red-500 to-red-700",
};

const bankBg: Record<string, string> = {
  HDFC: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  ICICI: "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30",
  SBI: "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30",
  AXIS: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30",
  AMEX: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
  CITI: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
};

function expiryStatus(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);
  const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  if (diffMonths < 0) return { label: `Expired ${label}`, cls: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10", urgent: true };
  if (diffMonths < 3) return { label: `Expires ${label}`, cls: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10", urgent: true };
  if (diffMonths < 6) return { label: `Expires ${label}`, cls: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10", urgent: false };
  return { label: `Expires ${label}`, cls: "text-muted-foreground bg-muted", urgent: false };
}

export default function RewardsPage() {
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [userRewards, setUserRewards] = useState<UserRewardEntry[]>([]);
  const [programsByBank, setProgramsByBank] = useState<ProgramsByBank[]>([]);
  const [allPrograms, setAllPrograms] = useState<RewardProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [addProgramId, setAddProgramId] = useState("");
  const [addBalanceValue, setAddBalanceValue] = useState("");

  useEffect(() => {
    fetch("/api/v2/rewards")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setValuation(data.valuation);
          setUserRewards(data.userRewards ?? []);
          setProgramsByBank(data.programsByBank ?? []);
          setAllPrograms(data.allPrograms ?? []);
          if (data.programsByBank?.length > 0) {
            setExpandedBank(data.programsByBank[0].bankName);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const refreshData = () => {
    setLoading(true);
    fetch("/api/v2/rewards")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setValuation(data.valuation);
          setUserRewards(data.userRewards ?? []);
          setProgramsByBank(data.programsByBank ?? []);
          setAllPrograms(data.allPrograms ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleSaveBalance = async (programId: string) => {
    const bal = parseFloat(editBalanceValue);
    if (isNaN(bal) || bal < 0) return;
    setSavingBalance(true);
    try {
      const res = await fetch("/api/v2/rewards/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, balance: bal }),
      });
      if (res.ok) {
        setEditingBalance(null);
        refreshData();
      }
    } catch { /* ignore */ }
    setSavingBalance(false);
  };

  const handleAddBalance = async () => {
    if (!addProgramId) return;
    const bal = parseFloat(addBalanceValue);
    if (isNaN(bal) || bal < 0) return;
    setSavingBalance(true);
    try {
      const res = await fetch("/api/v2/rewards/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId: addProgramId, balance: bal }),
      });
      if (res.ok) {
        setShowAddBalance(false);
        setAddProgramId("");
        setAddBalanceValue("");
        refreshData();
      }
    } catch { /* ignore */ }
    setSavingBalance(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rewards</h1>
        <p className="text-muted-foreground">
          Your reward points, balances, and optimization opportunities
        </p>
      </div>

      {/* Portfolio summary */}
      {valuation && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon={Coins} label="Total Points" value={valuation.totalPointsBalance.toLocaleString("en-IN")} sub={`${valuation.totalRewardPrograms} programs`} />
          <SummaryCard icon={IndianRupee} label="Estimated Value" value={`₹${Math.round(valuation.totalEstimatedValueINR).toLocaleString("en-IN")}`} sub="Based on best redemption rates" accent />
          <SummaryCard icon={CreditCard} label="Active Cards" value={String(valuation.totalCards)} sub={`₹${valuation.cards.reduce((s, c) => s + c.annualFee, 0).toLocaleString("en-IN")} in annual fees`} />
          <SummaryCard icon={TrendingUp} label="Card Portfolio Value" value={`₹${valuation.cards.reduce((s, c) => s + c.estimatedAnnualValue, 0).toLocaleString("en-IN")}`} sub="Estimated annual value" accent />
        </div>
      )}

      {/* Insights */}
      {valuation && valuation.insights.length > 0 && (
        <div className="rounded-xl border bg-gradient-to-r from-indigo-50 to-violet-50 p-5 dark:from-indigo-950/20 dark:to-violet-950/20">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="size-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Smart Insights</h3>
          </div>
          <ul className="space-y-2">
            {valuation.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Star className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Your Reward Balances */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Reward Balances</h2>
          <button onClick={() => setShowAddBalance(!showAddBalance)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted">
            <Plus className="size-3.5" />
            Add Balance
          </button>
        </div>

        {showAddBalance && (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Add / Update Reward Balance</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Reward Program</label>
                <select value={addProgramId} onChange={(e) => setAddProgramId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select program...</option>
                  {allPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.card.bank?.name} — {p.name} ({p.pointName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Balance</label>
                <input type="number" min="0" value={addBalanceValue} onChange={(e) => setAddBalanceValue(e.target.value)} placeholder="e.g. 15000" className="w-32 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={handleAddBalance} disabled={savingBalance || !addProgramId} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                {savingBalance ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Save
              </button>
            </div>
          </div>
        )}

        {userRewards.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {userRewards.map((r) => {
              const isEditing = editingBalance === r.programId;
              const estValue = Math.round(r.balance * r.bestRedemptionRate);
              const expiry = expiryStatus(r.expiryDate);
              return (
                <div key={r.programId} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.programName}</p>
                      <p className="text-[10px] text-muted-foreground">{r.bankName} &middot; {r.cardName}</p>
                      {isEditing ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <input type="number" min="0" value={editBalanceValue} onChange={(e) => setEditBalanceValue(e.target.value)} className="w-28 rounded border bg-background px-2 py-1 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
                          <button onClick={() => handleSaveBalance(r.programId)} disabled={savingBalance} className="p-1 text-emerald-600 hover:text-emerald-700">
                            {savingBalance ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                          </button>
                          <button onClick={() => setEditingBalance(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-2xl font-bold">{r.balance.toLocaleString("en-IN")}</p>
                          <button onClick={() => { setEditingBalance(r.programId); setEditBalanceValue(String(r.balance)); }} className="p-1 text-muted-foreground hover:text-indigo-600" title="Edit balance">
                            <Edit3 className="size-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{r.pointName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">₹{estValue.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-muted-foreground">est. value</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      {expiry ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${expiry.cls}`}>
                          {expiry.urgent && <AlertTriangle className="size-2.5" />}
                          <Calendar className="size-2.5" />
                          {expiry.label}
                        </span>
                      ) : r.expiryMonths ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          <Clock className="size-2.5" />
                          {r.expiryMonths}mo validity
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No expiry</span>
                      )}
                    </div>
                    <Link href={`/simulator?programId=${r.programId}&balance=${r.balance}`} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500">
                      <BadgePercent className="size-3" /> Simulate <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-8 text-center">
            <Wallet className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No reward balances yet. Use &quot;Add Balance&quot; to manually enter your reward points.</p>
          </div>
        )}
      </section>

      {/* Your Reward Programs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Reward Programs</h2>
          <Link href="/simulator" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
            <BadgePercent className="size-3.5" /> Open Simulator
          </Link>
        </div>
        {programsByBank.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <Gift className="mx-auto mb-4 size-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No reward programs yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Add cards to your portfolio or add reward balances to see your programs here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {programsByBank.map((bank) => {
              const isExpanded = expandedBank === bank.bankName;
              const code = bank.programs[0]?.card?.bank?.code ?? "";
              const bg = bankBg[code] ?? "border-muted bg-muted/30";
              return (
                <div key={bank.bankName} className={`rounded-xl border ${bg} overflow-hidden`}>
                  <button onClick={() => setExpandedBank(isExpanded ? null : bank.bankName)} className="flex w-full items-center justify-between p-5 text-left">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${bankColors[code] ?? "from-slate-600 to-slate-800"} text-white shadow`}>
                        <Banknote className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{bank.bankName}</p>
                        <p className="text-xs text-muted-foreground">{bank.programs.length} reward program{bank.programs.length > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 border-t px-5 pb-5 pt-4">
                      {(() => {
                        const links = getRedeemLinks(bank.bankName);
                        if (links.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-2">
                            {links.map((link) => (
                              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-medium shadow-sm transition-colors hover:bg-muted">
                                <ExternalLink className="size-3" />
                                {link.label}
                              </a>
                            ))}
                          </div>
                        );
                      })()}

                      {bank.programs.map((program) => {
                        const userBal = userRewards.find((ur) => ur.programId === program.id);
                        return (
                          <div key={program.id} className="rounded-lg border bg-card p-5 shadow-sm">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{program.name}</h4>
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{program.pointName}</span>
                                </div>
                                <Link href={`/cards/${program.card.id}`} className="mt-0.5 text-xs text-indigo-600 hover:underline">{program.card.name}</Link>
                                {program.earnDescription && <p className="mt-1 text-xs text-muted-foreground">{program.earnDescription}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                {program.earnRate && (
                                  <span className="shrink-0 rounded-lg bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{program.earnRate}</span>
                                )}
                              </div>
                            </div>

                            {/* Redemption summary */}
                            {program.redemptions.length > 0 && (
                              <div className="mt-3">
                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Redemptions</p>
                                <div className="flex flex-wrap gap-2">
                                  {program.redemptions.sort((a, b) => (b.estimatedCPP ?? 0) - (a.estimatedCPP ?? 0)).slice(0, 3).map((r) => (
                                    <span key={r.id} className="rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                                      {r.name} <span className="font-bold text-emerald-600">{(r.estimatedCPP ?? 0).toFixed(2)} cpp</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Transfer partners summary */}
                            {program.transferPartners.length > 0 && (
                              <div className="mt-3">
                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transfer Partners</p>
                                <div className="flex flex-wrap gap-2">
                                  {program.transferPartners.slice(0, 4).map((tp) => (
                                    <span key={tp.id} className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                                      <Plane className="size-3 text-muted-foreground" />
                                      {tp.partnerName} ({tp.transferRatio})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between border-t pt-3">
                              {userBal ? (
                                <span className="text-xs text-muted-foreground">Your balance: <span className="font-bold text-foreground">{userBal.balance.toLocaleString("en-IN")}</span> {program.pointName}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">No balance tracked</span>
                              )}
                              <Link href={`/simulator?programId=${program.id}&balance=${userBal?.balance ?? 10000}`} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500">
                                <BadgePercent className="size-3" /> Simulate <ArrowRight className="size-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: boolean;
}) {
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
