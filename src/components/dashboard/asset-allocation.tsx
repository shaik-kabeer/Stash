"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatINR, formatPercent } from "@/lib/utils/formatters";

export interface AllocationItem {
  provider: string;
  value: number;
  color: string;
}

interface AssetAllocationProps {
  data: AllocationItem[];
  totalValue: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: AllocationItem & { percentage: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-xl">
      <p className="font-medium">{item.provider}</p>
      <p className="text-muted-foreground">{formatINR(item.value)}</p>
      <p className="text-xs text-muted-foreground">
        {formatPercent(item.percentage).replace("+", "")} of portfolio
      </p>
    </div>
  );
}

export function AssetAllocation({ data, totalValue }: AssetAllocationProps) {
  const chartData = data.map((item) => ({
    ...item,
    name: item.provider,
    percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
  }));

  return (
    <Card className="flex h-full flex-col border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
        <CardDescription>Portfolio breakdown by provider</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.provider}
                  fill={entry.color}
                  stroke="transparent"
                  className="transition-opacity hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <ul className="mt-2 flex flex-col gap-1.5 px-2">
          {chartData.map((entry) => (
            <li
              key={entry.provider}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate text-muted-foreground">{entry.provider}</span>
              </span>
              <span className="font-medium tabular-nums">
                {entry.percentage.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground">Total Portfolio</p>
          <p className="text-lg font-bold tabular-nums">{formatINR(totalValue)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
