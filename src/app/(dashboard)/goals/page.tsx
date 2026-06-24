"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  Loader2,
  MapPin,
  Plane,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

interface GoalPlan {
  id: string;
  title: string;
  destination: string | null;
  targetValue: number;
  currentProgress: number;
  projectedDate: string | null;
  status: string;
}

interface GoalAnalysis {
  currentRewardsValue: number;
  targetValue: number;
  gap: number;
  projectedDate: string | null;
  recommendedCards: string[];
  strategies: string[];
}

interface CreateGoalResponse {
  goal: GoalPlan;
  analysis: GoalAnalysis;
}

const DESTINATIONS = [
  { label: "Dubai", value: "Dubai" },
  { label: "Singapore", value: "Singapore" },
  { label: "Goa", value: "Goa" },
  { label: "Bangkok", value: "Bangkok" },
  { label: "Bali", value: "Bali" },
  { label: "Maldives", value: "Maldives" },
  { label: "London", value: "London" },
  { label: "Paris", value: "Paris" },
  { label: "New York", value: "New York" },
  { label: "Tokyo", value: "Tokyo" },
  { label: "Custom", value: "custom" },
];

function ProgressBar({ current, target, className }: { current: number; target: number; className?: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className={className}>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>₹{Math.round(current).toLocaleString("en-IN")}</span>
        <span>{pct}%</span>
        <span>₹{Math.round(target).toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("Dubai");
  const [customTarget, setCustomTarget] = useState("");
  const [analysis, setAnalysis] = useState<GoalAnalysis | null>(null);
  const [createdGoal, setCreatedGoal] = useState<GoalPlan | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/v2/goals");
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals ?? []);
      }
    } catch {
      setGoals([]);
    }
  }, []);

  useEffect(() => {
    fetchGoals().finally(() => setLoading(false));
  }, [fetchGoals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a goal title.");
      return;
    }

    setError("");
    setSubmitting(true);
    setAnalysis(null);
    setCreatedGoal(null);

    const body: { title: string; destination: string; targetValue?: number } = {
      title: title.trim(),
      destination: destination === "custom" ? "Custom" : destination,
    };

    if (destination === "custom" && customTarget) {
      const val = parseFloat(customTarget);
      if (!isNaN(val) && val > 0) body.targetValue = val;
    }

    try {
      const res = await fetch("/api/v2/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create goal");
      }
      const data: CreateGoalResponse = await res.json();
      setAnalysis(data.analysis);
      setCreatedGoal(data.goal);
      setGoals((prev) => [data.goal, ...prev]);
      setTitle("");
      setDestination("Dubai");
      setCustomTarget("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v2/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
        if (createdGoal?.id === id) {
          setCreatedGoal(null);
          setAnalysis(null);
        }
      }
    } catch {
      setError("Failed to delete goal");
    } finally {
      setDeletingId(null);
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight">Travel Goal Planner</h1>
        <p className="text-muted-foreground">
          Set travel goals and track how your reward points stack up against the target
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreate} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="size-4 text-indigo-600" />
            <h2 className="text-lg font-semibold">Create Goal</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer trip to Bali"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Destination</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DESTINATIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {destination === "custom" && (
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Custom Target (INR)</label>
                <input
                  type="number"
                  min="0"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                  placeholder="50000"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Target className="size-4" />
              )}
              Create Goal
            </button>
          </div>
        </form>

        {analysis && createdGoal ? (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Plane className="size-4 text-indigo-600" />
              <h2 className="text-lg font-semibold">Goal Analysis</h2>
            </div>

            <div className="mb-1 flex items-start justify-between">
              <div>
                <p className="font-medium">{createdGoal.title}</p>
                {createdGoal.destination && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {createdGoal.destination}
                  </p>
                )}
              </div>
            </div>

            <ProgressBar
              current={analysis.currentRewardsValue}
              target={analysis.targetValue}
              className="mt-4"
            />

            {analysis.gap > 0 ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                Gap: ₹{analysis.gap.toLocaleString("en-IN")} more needed
              </p>
            ) : (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                You have enough rewards to reach this goal!
              </p>
            )}

            {analysis.recommendedCards.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <CreditCard className="size-3.5" /> Recommended Cards
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.recommendedCards.map((card) => (
                    <span
                      key={card}
                      className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                    >
                      {card}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.strategies.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Strategies</p>
                <ul className="space-y-1.5">
                  {analysis.strategies.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-indigo-500" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.projectedDate && (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-3.5" />
                Projected completion: {formatDate(analysis.projectedDate)}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border bg-card p-12 text-center shadow-sm">
            <div>
              <Target className="mx-auto mb-4 size-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">Plan Your Next Trip</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a goal to see how your current rewards compare and get personalized strategies.
              </p>
            </div>
          </div>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Plane className="size-4" /> Your Goals
        </h2>

        {goals.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
            <MapPin className="mx-auto mb-4 size-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No Goals Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first travel goal to start tracking progress.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal) => (
              <div key={goal.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{goal.title}</p>
                    {goal.destination && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {goal.destination}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    disabled={deletingId === goal.id}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/10"
                    aria-label="Delete goal"
                  >
                    {deletingId === goal.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>

                <ProgressBar
                  current={goal.currentProgress}
                  target={goal.targetValue}
                  className="mt-4"
                />

                {goal.projectedDate && (
                  <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Calendar className="size-3" />
                    Projected: {formatDate(goal.projectedDate)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
