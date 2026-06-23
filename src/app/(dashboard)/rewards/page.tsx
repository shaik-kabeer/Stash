"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Banknote,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  CreditCard,
  Edit3,
  ExternalLink,
  Gift,
  IndianRupee,
  Loader2,
  Plane,
  Plus,
  RefreshCw,
  Star,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { getRedeemLinks, type RedeemLink } from "@/lib/rewards/redeem-links";

interface RedemptionOption {
  id: string;
  name: string;
  type: string;
  conversionRate: number;
  minPoints: number;
  description: string | null;
  estimatedCPP: number;
  isActive: boolean;
}

interface TransferPartner {
  id: string;
  partnerName: string;
  partnerType: string;
  transferRatio: string;
  transferFee: number;
  transferTime: string | null;
  estimatedCPP: number;
}

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
  redemptions: RedemptionOption[];
  transferPartners: TransferPartner[];
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
  totalCards: number;
  totalRewardPrograms: number;
  totalPointsBalance: number;
  totalEstimatedValueINR: number;
  cards: { cardName: string; bankName: string; annualFee: number; estimatedAnnualValue: number; netValue: number }[];
  rewards: RewardValuation[];
  insights: string[];
}

interface ProgramsByBank {
  bankName: string;
  programs: RewardProgram[];
}

interface OptimizeResult {
  program: { id: string; name: string; pointName: string; card: string; bank: string };
  balance: number;
  recommendations: {
    name: string;
    type: string;
    pointsNeeded: number;
    estimatedValue: number;
    efficiencyRating: string;
    estimatedCPP: number;
    description: string | null;
  }[];
  bestOption: { name: string; estimatedValue: number; efficiencyRating: string } | null;
}

const efficiencyColors: Record<string, string> = {
  excellent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  good: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  fair: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  poor: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  varies: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
};

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

export default function RewardsPage() {
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [programsByBank, setProgramsByBank] = useState<ProgramsByBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  const [optimizeProgram, setOptimizeProgram] = useState<string | null>(null);
  const [optimizeBalance, setOptimizeBalance] = useState<string>("10000");
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [addProgramId, setAddProgramId] = useState("");
  const [addBalanceValue, setAddBalanceValue] = useState("");
  const [showEmailParse, setShowEmailParse] = useState(false);
  const [emailText, setEmailText] = useState("");
  const [parsingEmail, setParsingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    bank: string | null;
    balancesFound: number;
    autoUpdated: number;
    extractedBalances: { programName: string; balance: number; confidence: number }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/v2/rewards")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setValuation(data.valuation);
          setProgramsByBank(data.programsByBank ?? []);
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
          setProgramsByBank(data.programsByBank ?? []);
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
    } catch {}
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
    } catch {}
    setSavingBalance(false);
  };

  const handleEmailParse = async () => {
    if (!emailText.trim()) return;
    setParsingEmail(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/v2/email-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: emailText }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmailResult({
          bank: data.parsed.bank,
          balancesFound: data.parsed.balancesFound,
          autoUpdated: data.autoUpdated,
          extractedBalances: data.extractedBalances,
        });
        if (data.autoUpdated > 0) {
          refreshData();
        }
      }
    } catch {}
    setParsingEmail(false);
  };

  const handleEmailFileUpload = async (file: File) => {
    setParsingEmail(true);
    setEmailResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/v2/email-parse", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setEmailResult({
          bank: data.parsed.bank,
          balancesFound: data.parsed.balancesFound,
          autoUpdated: data.autoUpdated,
          extractedBalances: data.extractedBalances,
        });
        if (data.autoUpdated > 0) {
          refreshData();
        }
      }
    } catch {}
    setParsingEmail(false);
  };

  const allPrograms = programsByBank.flatMap((b) => b.programs);

  const handleOptimize = async (programId: string) => {
    const bal = parseInt(optimizeBalance) || 10000;
    setOptimizing(true);
    setOptimizeResult(null);
    try {
      const res = await fetch("/api/v2/reward-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, balance: bal }),
      });
      if (res.ok) {
        const data = await res.json();
        setOptimizeResult(data);
      }
    } catch {}
    setOptimizing(false);
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
          Aggregate, track, and optimize all your reward points across banks
        </p>
      </div>

      {/* Portfolio summary */}
      {valuation && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={Coins}
            label="Total Points"
            value={valuation.totalPointsBalance.toLocaleString("en-IN")}
            sub={`${valuation.totalRewardPrograms} programs`}
          />
          <SummaryCard
            icon={IndianRupee}
            label="Estimated Value"
            value={`₹${Math.round(valuation.totalEstimatedValueINR).toLocaleString("en-IN")}`}
            sub="Based on best redemption rates"
            accent
          />
          <SummaryCard
            icon={CreditCard}
            label="Active Cards"
            value={String(valuation.totalCards)}
            sub={`₹${valuation.cards.reduce((s, c) => s + c.annualFee, 0).toLocaleString("en-IN")} in annual fees`}
          />
          <SummaryCard
            icon={TrendingUp}
            label="Card Portfolio Value"
            value={`₹${valuation.cards.reduce((s, c) => s + c.estimatedAnnualValue, 0).toLocaleString("en-IN")}`}
            sub="Estimated annual value"
            accent
          />
        </div>
      )}

      {/* AI Insights */}
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
          <button
            onClick={() => setShowAddBalance(!showAddBalance)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
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
                <select
                  value={addProgramId}
                  onChange={(e) => setAddProgramId(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select program...</option>
                  {allPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.card.bank?.name} - {p.name} ({p.pointName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Balance</label>
                <input
                  type="number"
                  min="0"
                  value={addBalanceValue}
                  onChange={(e) => setAddBalanceValue(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-32 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleAddBalance}
                disabled={savingBalance || !addProgramId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingBalance ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Save
              </button>
            </div>
          </div>
        )}

        {valuation && valuation.rewards.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {valuation.rewards.map((r) => {
              const matchedProg = allPrograms.find((p) => p.name === r.programName);
              const isEditing = editingBalance === r.programName;
              return (
                <div key={r.programName} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{r.programName}</p>
                      {isEditing ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={editBalanceValue}
                            onChange={(e) => setEditBalanceValue(e.target.value)}
                            className="w-28 rounded border bg-background px-2 py-1 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => matchedProg && handleSaveBalance(matchedProg.id)}
                            disabled={savingBalance}
                            className="p-1 text-emerald-600 hover:text-emerald-700"
                          >
                            {savingBalance ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                          </button>
                          <button
                            onClick={() => setEditingBalance(null)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-2xl font-bold">{r.balance.toLocaleString("en-IN")}</p>
                          <button
                            onClick={() => {
                              setEditingBalance(r.programName);
                              setEditBalanceValue(String(r.balance));
                            }}
                            className="p-1 text-muted-foreground hover:text-indigo-600"
                            title="Edit balance"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{r.pointName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">₹{r.estimatedValueINR.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-muted-foreground">est. value</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">Best: {r.bestRedemptionName}</span>
                    <span className="text-xs font-medium text-indigo-600">₹{r.bestRedemptionRate.toFixed(2)}/pt</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-8 text-center">
            <Wallet className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No reward balances yet. Use "Add Balance" to manually enter your reward points.</p>
          </div>
        )}
      </section>

      {/* Email Parsing */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Import from Email</h2>
            <p className="text-xs text-muted-foreground">Paste a reward statement email or upload a .eml file to extract balances</p>
          </div>
          <button
            onClick={() => setShowEmailParse(!showEmailParse)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            {showEmailParse ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            {showEmailParse ? "Close" : "Parse Email"}
          </button>
        </div>

        {showEmailParse && (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Paste email content (reward statement, points summary, or transaction alert)
                </label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  rows={6}
                  placeholder="Paste your reward email content here...&#10;&#10;Example: Dear Customer, Your HDFC Reward Points balance is 24,500 points as of June 2026."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleEmailParse}
                  disabled={parsingEmail || !emailText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {parsingEmail ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
                  Extract Balances
                </button>
                <span className="text-xs text-muted-foreground">or</span>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
                  <Plus className="size-3.5" />
                  Upload .eml File
                  <input
                    type="file"
                    accept=".eml,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleEmailFileUpload(file);
                    }}
                  />
                </label>
              </div>

              {emailResult && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {emailResult.balancesFound > 0 ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <X className="size-4 text-amber-600" />
                    )}
                    <span className="text-sm font-medium">
                      {emailResult.bank ? `Detected: ${emailResult.bank}` : "Bank not identified"}
                    </span>
                  </div>
                  {emailResult.extractedBalances.length > 0 ? (
                    <div className="space-y-1.5">
                      {emailResult.extractedBalances.map((b, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{b.programName}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{b.balance.toLocaleString("en-IN")}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] ${b.confidence >= 0.7 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}>
                              {Math.round(b.confidence * 100)}% conf
                            </span>
                          </div>
                        </div>
                      ))}
                      {emailResult.autoUpdated > 0 && (
                        <p className="mt-2 text-xs text-emerald-600">
                          {emailResult.autoUpdated} balance(s) auto-updated in your portfolio
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No reward balances found in the email. Try a reward statement or points summary email.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Reward Programs by Bank */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Reward Programs by Bank</h2>
        {programsByBank.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <Gift className="mx-auto mb-4 size-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No reward programs found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add cards to your portfolio to see their reward programs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {programsByBank.map((bank) => {
              const isExpanded = expandedBank === bank.bankName;
              const code = bank.programs[0]?.card?.bank?.code ?? "";
              const bg = bankBg[code] ?? "border-muted bg-muted/30";
              return (
                <div key={bank.bankName} className={`rounded-xl border ${bg} overflow-hidden`}>
                  <button
                    onClick={() => setExpandedBank(isExpanded ? null : bank.bankName)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
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
                      {/* Redemption Deep Links */}
                      {(() => {
                        const links = getRedeemLinks(bank.bankName);
                        if (links.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-2">
                            {links.map((link) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-medium shadow-sm transition-colors hover:bg-muted"
                              >
                                <ExternalLink className="size-3" />
                                {link.label}
                              </a>
                            ))}
                          </div>
                        );
                      })()}

                      {bank.programs.map((program) => (
                        <div key={program.id} className="rounded-lg border bg-card p-5 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{program.name}</h4>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{program.pointName}</span>
                              </div>
                              <Link href={`/cards/${program.card.id}`} className="mt-0.5 text-xs text-indigo-600 hover:underline">
                                {program.card.name}
                              </Link>
                              {program.earnDescription && (
                                <p className="mt-1 text-xs text-muted-foreground">{program.earnDescription}</p>
                              )}
                            </div>
                            <span className="shrink-0 rounded-lg bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                              {program.earnRate}
                            </span>
                          </div>

                          {/* Redemption Options */}
                          {program.redemptions.length > 0 && (
                            <div className="mt-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Redemption Options</p>
                              <div className="space-y-1.5">
                                {program.redemptions
                                  .sort((a, b) => b.estimatedCPP - a.estimatedCPP)
                                  .map((r, i) => (
                                    <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                                      <div className="flex items-center gap-2.5">
                                        <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                                          {i + 1}
                                        </span>
                                        <div>
                                          <p className="text-sm font-medium">{r.name}</p>
                                          {r.description && <p className="text-[10px] text-muted-foreground">{r.description}</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {r.minPoints > 0 && <span className="text-[10px] text-muted-foreground">Min: {r.minPoints.toLocaleString()}</span>}
                                        <span className="text-sm font-bold text-emerald-600">{r.estimatedCPP.toFixed(2)} cpp</span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Transfer Partners */}
                          {program.transferPartners.length > 0 && (
                            <div className="mt-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transfer Partners</p>
                              <div className="grid gap-1.5 sm:grid-cols-2">
                                {program.transferPartners.map((tp) => (
                                  <div key={tp.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                                    <div>
                                      <p className="text-sm font-medium">{tp.partnerName}</p>
                                      <p className="text-[10px] text-muted-foreground capitalize">{tp.partnerType} &middot; {tp.transferRatio}{tp.transferFee > 0 ? ` &middot; Fee: ₹${tp.transferFee}` : ""}</p>
                                    </div>
                                    <Plane className="size-3.5 text-muted-foreground" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Optimize button */}
                          <div className="mt-4 flex items-center gap-2 border-t pt-4">
                            <input
                              type="number"
                              placeholder="Points balance"
                              value={optimizeProgram === program.id ? optimizeBalance : ""}
                              onChange={(e) => { setOptimizeProgram(program.id); setOptimizeBalance(e.target.value); }}
                              onFocus={() => setOptimizeProgram(program.id)}
                              className="w-32 rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => handleOptimize(program.id)}
                              disabled={optimizing}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                              {optimizing && optimizeProgram === program.id
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <BadgePercent className="size-3.5" />}
                              Optimize Redemption
                            </button>
                          </div>

                          {/* Optimization Result */}
                          {optimizeResult && optimizeResult.program.id === program.id && (
                            <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
                              <div className="mb-3 flex items-center justify-between">
                                <h5 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                                  Optimization for {optimizeResult.balance.toLocaleString()} {optimizeResult.program.pointName}
                                </h5>
                                {optimizeResult.bestOption && (
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${efficiencyColors[optimizeResult.bestOption.efficiencyRating] ?? efficiencyColors.fair}`}>
                                    Best: {optimizeResult.bestOption.efficiencyRating}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2">
                                {optimizeResult.recommendations.map((rec, i) => (
                                  <div key={i} className="flex items-center justify-between rounded bg-white/70 px-3 py-2 dark:bg-white/5">
                                    <div className="flex items-center gap-2">
                                      <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                                        {i + 1}
                                      </span>
                                      <div>
                                        <p className="text-sm font-medium">{rec.name}</p>
                                        {rec.description && <p className="text-[10px] text-muted-foreground">{rec.description}</p>}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-emerald-600">₹{rec.estimatedValue.toLocaleString("en-IN")}</p>
                                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${efficiencyColors[rec.efficiencyRating] ?? efficiencyColors.fair}`}>
                                        {rec.efficiencyRating}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
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
