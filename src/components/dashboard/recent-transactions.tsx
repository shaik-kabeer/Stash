"use client";

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
import { Badge } from "@/components/ui/badge";
import { formatDate, formatINR, formatPoints } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

export interface TransactionItem {
  id: string;
  type: "earn" | "redeem";
  points: number;
  valueINR: number;
  description: string;
  transactionDate: string;
  program: string;
  provider: string;
  color: string;
}

interface RecentTransactionsProps {
  transactions: TransactionItem[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest activity across all reward programs</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-(--card-spacing)">Date</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="hidden pr-(--card-spacing) md:table-cell">
                Description
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => {
              const isEarn = tx.type === "earn";
              return (
                <TableRow
                  key={tx.id}
                  className="animate-in fade-in slide-in-from-left-2 fill-mode-both duration-300"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <TableCell className="pl-(--card-spacing) text-muted-foreground">
                    {formatDate(tx.transactionDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: tx.color }}
                      />
                      <span className="max-w-[120px] truncate font-medium">
                        {tx.program}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        isEarn
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
                      )}
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      isEarn ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    {isEarn ? "+" : ""}
                    {formatPoints(Math.abs(tx.points))}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      isEarn ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    {isEarn ? "+" : "-"}
                    {formatINR(Math.abs(tx.valueINR))}
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate pr-(--card-spacing) text-muted-foreground md:table-cell">
                    {tx.description}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
