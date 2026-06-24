"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  BadgePercent,
  Coins,
  ExternalLink,
  IndianRupee,
  Loader2,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";
import type { RedeemLink } from "@/lib/rewards/redeem-links";

interface RewardProgram {
  id: string;
  name: string;
  pointName: string;
  card: {
    name: string;
    bank: { name: string; code?: string } | null;
  };
}

interface Recommendation {
  name: string;
  type: string;
  pointsNeeded: number;
  estimatedValue: number;
  efficiencyRating: string;
  estimatedCPP: number;
  description: string | null;
  isBest?: boolean;
  isWorst?: boolean;
  portalUrl?: string;
}

interface OptimizeResult {
  program: { id: string; name: string; pointName: string; card: string; bank: string };
  balance: number;
  recommendation: string;
  recommendations: Recommendation[];
  bestOption: Recommendation | null;
  redeemLinks: RedeemLink[];
}

interface UserRewardEntry {
  programId: string;
  programName: string;
  balance: number;
  bankName: string;
  bestRedemptionRate: number;
}

const efficiencyColors: Record<string, string> = {
  excellent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  good: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  fair: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  poor: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

function formatType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SimulatorPage() {
  const searchParams = useSearchParams();
  const [programs, setPrograms] = useState<RewardProgram[]>([]);
  const [userRewards, setUserRewards] = useState<UserRewardEntry[]>([]);
  const [programId, setProgramId] = useState("");
  const [balance, setBalance] = useState("10000");
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState("");
  const [showMyOnly, setShowMyOnly] = useState(true);
  const [combinedView, setCombinedView] = useState<{ programName: string; balance: number; bestValue: number; bestOption: string }[]>([]);
  const [showCombined, setShowCombined] = useState(false);
  const [loadingCombined, setLoadingCombined] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/v2/reward-programs").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v2/rewards").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([progs, rewardsData]) => {
      const allProgs: RewardProgram[] = Array.isArray(progs) ? progs : [];
      setPrograms(allProgs);

      const rewards: UserRewardEntry[] = (rewardsData?.userRewards ?? []).map((ur: UserRewardEntry) => ({
        programId: ur.programId,
        programName: ur.programName,
        balance: ur.balance,
        bankName: ur.bankName,
        bestRedemptionRate: ur.bestRedemptionRate,
      }));
      setUserRewards(rewards);

      const qProgramId = searchParams.get("programId");
      const qBalance = searchParams.get("balance");

      if (qProgramId && allProgs.some((p) => p.id === qProgramId)) {
        setProgramId(qProgramId);
        const userBal = rewards.find((r) => r.programId === qProgramId);
        setBalance(qBalance ?? String(userBal?.balance ?? 10000));
      } else if (rewards.length > 0) {
        const firstWithBalance = rewards.find((r) => r.balance > 0);
        if (firstWithBalance) {
          setProgramId(firstWithBalance.programId);
          setBalance(String(firstWithBalance.balance));
        } else if (allProgs.length > 0) {
          setProgramId(allProgs[0].id);
        }
      } else if (allProgs.length > 0) {
        setProgramId(allProgs[0].id);
        setShowMyOnly(false);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [searchParams]);

  const handleProgramChange = useCallback((id: string) => {
    setProgramId(id);
    const userBal = userRewards.find((r) => r.programId === id);
    if (userBal) setBalance(String(userBal.balance));
  }, [userRewards]);

  const handleSimulate = async () => {
    const bal = parseInt(balance, 10);
    if (!programId || isNaN(bal) || bal < 0) {
      setError("Please select a program and enter a valid balance.");
      return;
    }
    setError("");
    setSimulating(true);
    setResult(null);
    try {
      const res = await fetch("/api/v2/reward-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, balance: bal }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Simulation failed");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  const handleCombinedOptimize = async () => {
    if (userRewards.length === 0) return;
    setLoadingCombined(true);
    setShowCombined(true);
    const results: typeof combinedView = [];
    for (const ur of userRewards.filter((r) => r.balance > 0)) {
      try {
        const res = await fetch("/api/v2/reward-optimizer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programId: ur.programId, balance: ur.balance }),
        });
        if (res.ok) {
          const data = await res.json();
          results.push({
            programName: ur.programName,
            balance: ur.balance,
            bestValue: data.bestOption?.estimatedValue ?? 0,
            bestOption: data.bestOption?.name ?? "N/A",
          });
        }
      } catch { /* skip */ }
    }
    setCombinedView(results);
    setLoadingCombined(false);
  };

  const displayPrograms = showMyOnly && userRewards.length > 0
    ? programs.filter((p) => userRewards.some((ur) => ur.programId === p.id))
    : programs;

  const selectedProgram = programs.find((p) => p.id === programId);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Redemption Simulator</h1>
        <p className="text-muted-foreground">Compare redemption options and find the best value for your reward points</p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Reward Program</label>
              {userRewards.length > 0 && (
                <button onClick={() => setShowMyOnly(!showMyOnly)} className="text-[10px] font-medium text-indigo-600 hover:text-indigo-500">
                  {showMyOnly ? "Show all programs" : "Show my programs only"}
                </button>
              )}
            </div>
            <select value={programId} onChange={(e) => handleProgramChange(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select program...</option>
              {displayPrograms.map((p) => {
                const userBal = userRewards.find((ur) => ur.programId === p.id);
                return (
                  <option key={p.id} value={p.id}>
                    {p.card.bank?.name ?? "Unknown"} — {p.name} ({p.pointName}){userBal ? ` [${userBal.balance.toLocaleString()}]` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs text-muted-foreground">Point Balance</label>
            <input type="number" min="0" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleSimulate} disabled={simulating || !programId} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
            {simulating ? <Loader2 className="size-4 animate-spin" /> : <BadgePercent className="size-4" />}
            Simulate
          </button>
        </div>
        {selectedProgram && (
          <p className="mt-3 text-xs text-muted-foreground">{selectedProgram.card.name} &middot; {selectedProgram.pointName}</p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Combined optimization across all user programs */}
      {userRewards.filter((r) => r.balance > 0).length > 1 && (
        <div className="rounded-xl border bg-gradient-to-r from-violet-50 to-indigo-50 p-5 dark:from-violet-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400">Combined Portfolio Optimization</h3>
            </div>
            <button onClick={handleCombinedOptimize} disabled={loadingCombined} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted disabled:opacity-50">
              {loadingCombined ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
              Optimize All
            </button>
          </div>
          {showCombined && combinedView.length > 0 && (
            <div className="mt-4 space-y-2">
              {combinedView.map((cv, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-2.5 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-medium">{cv.programName}</p>
                    <p className="text-xs text-muted-foreground">{cv.balance.toLocaleString()} pts &rarr; {cv.bestOption}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">₹{cv.bestValue.toLocaleString("en-IN")}</p>
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2">
                <p className="text-sm font-semibold">Total Best Value</p>
                <p className="text-lg font-bold text-emerald-600">₹{combinedView.reduce((s, c) => s + c.bestValue, 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <>
          {result.bestOption && (
            <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="size-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-400">Best Option</h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Best Value</span>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-bold">{result.bestOption.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatType(result.bestOption.type)}</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">₹{result.bestOption.estimatedValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="mt-1 text-sm text-muted-foreground">₹{result.bestOption.estimatedCPP.toFixed(2)} per point</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${efficiencyColors[result.bestOption.efficiencyRating] ?? efficiencyColors.fair}`}>{result.bestOption.efficiencyRating}</span>
                  {result.bestOption.portalUrl && (
                    <a href={result.bestOption.portalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500">
                      Redeem <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-gradient-to-r from-indigo-50 to-violet-50 p-5 dark:from-indigo-950/20 dark:to-violet-950/20">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Summary</h3>
            </div>
            <p className="text-sm">{result.recommendation}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Coins className="size-3.5" />{result.balance.toLocaleString("en-IN")} {result.program.pointName}</span>
              <span className="flex items-center gap-1"><IndianRupee className="size-3.5" />{result.program.card} &middot; {result.program.bank}</span>
            </div>
          </div>

          {result.recommendations.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">All Redemption Options</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className={`rounded-xl border bg-card p-5 shadow-sm ${rec.isBest ? "ring-2 ring-emerald-300 dark:ring-emerald-800" : rec.isWorst ? "ring-2 ring-red-200 dark:ring-red-900" : ""}`}>
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-tight">{rec.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{formatType(rec.type)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {rec.isBest && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Best Value</span>}
                        {rec.isWorst && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400">Worst Value</span>}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${efficiencyColors[rec.efficiencyRating] ?? efficiencyColors.fair}`}>{rec.efficiencyRating}</span>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-emerald-600">₹{rec.estimatedValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="mt-1 text-sm text-muted-foreground">₹{rec.estimatedCPP.toFixed(2)} per point</p>
                    {rec.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{rec.description}</p>}
                    {rec.portalUrl && (
                      <a href={rec.portalUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                        Redeem <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
              <Coins className="mx-auto mb-4 size-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No Options Available</h3>
              <p className="mt-1 text-sm text-muted-foreground">No eligible redemption options for this balance.</p>
            </div>
          )}

          {result.redeemLinks.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Redemption Portals</h2>
              <div className="flex flex-wrap gap-2">
                {result.redeemLinks.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
                    <ExternalLink className="size-3.5" />
                    {link.label}
                  </a>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {!result && !simulating && (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <BadgePercent className="mx-auto mb-4 size-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">Run a Simulation</h3>
          <p className="mt-1 text-sm text-muted-foreground">Select a reward program, enter your balance, and click Simulate to compare redemption options.</p>
        </div>
      )}
    </div>
  );
}
