"use client";

import {
  AlertTriangle,
  Coins,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatINR, formatPercent, formatPoints } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface PortfolioSummaryProps {
  totalValueINR: number;
  totalPoints: number;
  expiringCount: number;
  monthlyGrowth: number;
}

const metrics = [
  {
    key: "value",
    title: "Total Value",
    icon: IndianRupee,
    gradient: "from-indigo-500 to-violet-600",
    bgGlow: "bg-indigo-500/10",
    iconColor: "text-indigo-600",
  },
  {
    key: "points",
    title: "Total Points",
    icon: Coins,
    gradient: "from-violet-500 to-purple-600",
    bgGlow: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
  {
    key: "expiring",
    title: "Expiring Soon",
    icon: AlertTriangle,
    gradient: "from-amber-500 to-orange-600",
    bgGlow: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
  {
    key: "growth",
    title: "Monthly Growth",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-600",
    bgGlow: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
] as const;

export function PortfolioSummary({
  totalValueINR,
  totalPoints,
  expiringCount,
  monthlyGrowth,
}: PortfolioSummaryProps) {
  const values: Record<(typeof metrics)[number]["key"], string> = {
    value: formatINR(totalValueINR),
    points: formatPoints(totalPoints),
    expiring: String(expiringCount),
    growth: formatPercent(monthlyGrowth),
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card
          key={metric.key}
          className={cn(
            "group relative overflow-hidden border-border/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-100/50",
            "animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500"
          )}
          style={{ animationDelay: `${index * 75}ms` }}
        >
          <div
            className={cn(
              "pointer-events-none absolute -right-6 -bottom-6 size-24 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-60",
              metric.bgGlow
            )}
          />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                metric.gradient
              )}
            >
              <metric.icon className="size-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold tracking-tight tabular-nums md:text-3xl",
                metric.key === "growth" &&
                  (monthlyGrowth >= 0 ? "text-emerald-600" : "text-red-600"),
                metric.key === "expiring" && expiringCount > 0 && "text-amber-600"
              )}
            >
              {values[metric.key]}
            </p>
            {metric.key === "growth" && (
              <p className="mt-1 text-xs text-muted-foreground">
                vs. previous month
              </p>
            )}
            {metric.key === "expiring" && expiringCount > 0 && (
              <p className="mt-1 text-xs text-amber-600/80">
                within 90 days
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
