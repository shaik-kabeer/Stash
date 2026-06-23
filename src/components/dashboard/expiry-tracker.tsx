"use client";

import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatINR, formatPoints } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

export interface ExpiryItem {
  id: string;
  programName: string;
  provider: string;
  color: string;
  points: number;
  valueINR: number;
  expiryDate: string;
  daysRemaining: number;
  tier: string | null;
  type: string;
}

interface ExpiryTrackerProps {
  items: ExpiryItem[];
}

function getRecommendedAction(item: ExpiryItem): string {
  if (item.type === "airline_miles") {
    return "Book an award flight or transfer to a partner airline before expiry.";
  }
  if (item.type === "hotel_loyalty") {
    return "Redeem for a free night stay or transfer to airline partners.";
  }
  if (item.daysRemaining <= 30) {
    return "Redeem immediately via voucher or statement credit — time is critical.";
  }
  return "Redeem for Amazon vouchers or transfer to InterMiles for better value.";
}

function urgencyClass(days: number): string {
  if (days <= 30) return "border-red-200/80 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20";
  if (days <= 60) return "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20";
  return "border-orange-200/80 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20";
}

function urgencyBadge(days: number): { label: string; className: string } {
  if (days <= 30) return { label: "Critical", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" };
  if (days <= 60) return { label: "High", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" };
  return { label: "Medium", className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" };
}

export function ExpiryTracker({ items }: ExpiryTrackerProps) {
  return (
    <Card className="flex h-full flex-col border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
            <AlertTriangle className="size-4 text-amber-600" />
          </div>
          <div>
            <CardTitle>Expiry Alerts</CardTitle>
            <CardDescription>Points at risk within 90 days</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {items.length === 0 ? (
          <Alert className="border-emerald-200/80 bg-emerald-50/50">
            <AlertTitle className="text-emerald-700">All clear</AlertTitle>
            <AlertDescription>
              No points expiring in the next 90 days. Your portfolio is healthy.
            </AlertDescription>
          </Alert>
        ) : (
          items.map((item, index) => {
            const badge = urgencyBadge(item.daysRemaining);
            return (
              <Alert
                key={item.id}
                className={cn(
                  "animate-in fade-in slide-in-from-right-3 fill-mode-both duration-500",
                  urgencyClass(item.daysRemaining)
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Clock className="text-amber-600" />
                <AlertTitle className="flex flex-wrap items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.programName}
                  <Badge className={cn("text-[10px] font-semibold", badge.className)}>
                    {badge.label}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span>
                      <strong className="text-foreground">{formatPoints(item.points)}</strong>{" "}
                      points at risk
                    </span>
                    <span>
                      Value:{" "}
                      <strong className="text-foreground">{formatINR(item.valueINR)}</strong>
                    </span>
                    <span>
                      Expires:{" "}
                      <strong className="text-foreground">{formatDate(item.expiryDate)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-background/60 px-2 py-1.5 text-xs">
                    <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {item.daysRemaining} days
                    </span>
                    <span className="text-muted-foreground">remaining</span>
                  </div>
                  <p className="flex items-start gap-1 text-xs leading-relaxed">
                    <ArrowRight className="mt-0.5 size-3 shrink-0 text-indigo-500" />
                    {getRecommendedAction(item)}
                  </p>
                </AlertDescription>
              </Alert>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
