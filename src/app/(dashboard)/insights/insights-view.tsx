"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Clock,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  formatDate,
  formatINR,
  formatPoints,
} from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface ExpiringAccount {
  id: string;
  provider: string;
  programName: string;
  color: string;
  balance: number;
  estimatedValueINR: number;
  expiryDate: string;
  daysRemaining: number;
  tier: string | null;
}

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ProgramPerformance {
  programId: string;
  name: string;
  provider: string;
  color: string;
  avgEfficiency: number;
  totalINR: number;
  conversionRate: number;
}

interface InsightsViewProps {
  expiringAccounts: ExpiringAccount[];
  optimizationRecs: Recommendation[];
  programPerformance: ProgramPerformance[];
  actionRecs: Recommendation[];
  allRecommendations: Recommendation[];
  highPriorityCount: number;
  totalAtRisk: number;
}

function PriorityBadge({ priority }: { priority: string }) {
  const config = {
    high: {
      label: "High",
      className: "border-red-200 bg-red-50 text-red-700",
    },
    medium: {
      label: "Medium",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    low: {
      label: "Low",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  }[priority] ?? {
    label: priority,
    className: "border-border bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase", config.className)}>
      {config.label}
    </Badge>
  );
}

function UrgencyBadge({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining <= 30) {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
        <AlertTriangle className="size-3" />
        Critical · {daysRemaining}d
      </Badge>
    );
  }
  if (daysRemaining <= 60) {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
        <Clock className="size-3" />
        Urgent · {daysRemaining}d
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
      <Clock className="size-3" />
      Soon · {daysRemaining}d
    </Badge>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <Card className="border-border/60 transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-snug">{rec.title}</CardTitle>
          <PriorityBadge priority={rec.priority} />
        </div>
        <CardDescription className="line-clamp-3 text-sm leading-relaxed">
          {rec.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0">
        <span className="text-xs text-muted-foreground capitalize">
          {rec.type.replace(/_/g, " ")}
        </span>
        <Link
          href={rec.actionUrl ?? "/accounts"}
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
        >
          Take Action
          <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function InsightsView({
  expiringAccounts,
  optimizationRecs,
  programPerformance,
  actionRecs,
  allRecommendations,
  highPriorityCount,
  totalAtRisk,
}: InsightsViewProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-[#0a0f2e] via-[#151b45] to-[#312e81] p-6 text-white shadow-xl md:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-violet-500/20 blur-[80px]" />
          <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-indigo-500/20 blur-[80px]" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-200">
              <Sparkles className="size-3.5 text-violet-400" />
              AI-Powered Advisory Report
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Portfolio Insights
            </h1>
            <p className="mt-2 max-w-xl text-sm text-indigo-200/80 md:text-base">
              Personalized recommendations to maximize redemption value, prevent
              expiry losses, and optimize your rewards strategy.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-indigo-300/70">At Risk</p>
              <p className="text-xl font-bold tabular-nums">{formatINR(totalAtRisk)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-indigo-300/70">High Priority</p>
              <p className="text-xl font-bold tabular-nums text-red-300">
                {highPriorityCount}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm sm:col-span-1">
              <p className="text-xs text-indigo-300/70">Insights</p>
              <p className="text-xl font-bold tabular-nums">
                {allRecommendations.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="expiring" className="gap-6">
        <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-1 border-b bg-transparent p-0">
          <TabsTrigger value="expiring" className="gap-2 px-4 py-2.5">
            <AlertTriangle className="size-4" />
            Expiring Rewards
            {expiringAccounts.length > 0 && (
              <Badge variant="secondary" className="ml-1 size-5 justify-center p-0 text-[10px]">
                {expiringAccounts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="optimization" className="gap-2 px-4 py-2.5">
            <Lightbulb className="size-4" />
            Optimization
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2 px-4 py-2.5">
            <BarChart3 className="size-4" />
            Program Performance
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-2 px-4 py-2.5">
            <Target className="size-4" />
            Recommended Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expiring" className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Expiring Within 90 Days</h2>
            <p className="text-sm text-muted-foreground">
              Rewards at risk of expiry — act now to preserve value.
            </p>
          </div>
          {expiringAccounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Zap className="mb-3 size-10 text-emerald-500" />
                <p className="font-medium">No expiring rewards in the next 90 days</p>
                <p className="text-sm text-muted-foreground">
                  Your portfolio is healthy — keep earning!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {expiringAccounts.map((account) => (
                <Card
                  key={account.id}
                  className="overflow-hidden border-border/60"
                  style={{ borderLeftWidth: 4, borderLeftColor: account.color }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{account.provider}</CardTitle>
                        <CardDescription>{account.programName}</CardDescription>
                      </div>
                      <UrgencyBadge daysRemaining={account.daysRemaining} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold tabular-nums">
                        {formatPoints(account.balance)}
                      </span>
                      <span
                        className="text-lg font-semibold tabular-nums"
                        style={{ color: account.color }}
                      >
                        {formatINR(account.estimatedValueINR)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Expires {formatDate(account.expiryDate)}</span>
                      {account.tier && (
                        <Badge variant="secondary" className="text-[10px]">
                          {account.tier}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Optimization Opportunities</h2>
            <p className="text-sm text-muted-foreground">
              AI-identified ways to increase redemption value across your portfolio.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {optimizationRecs.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Program Performance</h2>
            <p className="text-sm text-muted-foreground">
              Redemption efficiency by program — higher is better value per point.
            </p>
          </div>
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Program</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Efficiency</TableHead>
                    <TableHead className="text-right">Rate (₹/pt)</TableHead>
                    <TableHead className="text-right">Portfolio Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programPerformance.map((prog) => (
                    <TableRow key={prog.programId}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: prog.color }}
                          />
                          <span className="font-medium">{prog.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {prog.provider}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <TrendingUp
                            className={cn(
                              "size-3.5",
                              prog.avgEfficiency >= 100
                                ? "text-emerald-500"
                                : "text-amber-500"
                            )}
                          />
                          <span className="font-semibold tabular-nums">
                            {prog.avgEfficiency.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{prog.conversionRate.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatINR(prog.totalINR)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programPerformance.slice(0, 3).map((prog) => (
              <Card
                key={prog.programId}
                className="border-border/60"
                style={{ borderTopWidth: 3, borderTopColor: prog.color }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{prog.name}</CardTitle>
                  <CardDescription>{prog.provider}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums">
                    {prog.avgEfficiency.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    avg. redemption efficiency
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(prog.avgEfficiency, 150) / 1.5}%`,
                        backgroundColor: prog.color,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Recommended Actions</h2>
            <p className="text-sm text-muted-foreground">
              Prioritized steps to improve your rewards portfolio this month.
            </p>
          </div>
          <div className="space-y-4">
            {actionRecs.map((rec, index) => (
              <Card
                key={rec.id}
                className="border-border/60 transition-all hover:shadow-md"
              >
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{rec.title}</h3>
                        <PriorityBadge priority={rec.priority} />
                      </div>
                      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={rec.actionUrl ?? "/accounts"}
                    className={cn(
                      buttonVariants(),
                      "shrink-0 gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500"
                    )}
                  >
                    {rec.type === "expiry_warning" ? "Redeem Now" : "View Details"}
                    <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
