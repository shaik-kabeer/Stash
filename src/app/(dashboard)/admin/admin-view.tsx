"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Settings2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface Program {
  id: string;
  name: string;
  provider: string;
  type: string;
  conversionRate: number;
  category: string;
  expiryRules: string | null;
  transferPartners: string | null;
  color: string | null;
  isActive: boolean;
  currencyEquivalent: string;
  _source?: "normalized" | "legacy";
  earnRate?: string | null;
  pointName?: string | null;
  cardName?: string | null;
  redemptionCount?: number;
  transferCount?: number;
}

interface AgentLog {
  id: string;
  agentName: string;
  workflowName: string | null;
  status: string;
  durationMs: number | null;
  executedAt: string;
  output: string | null;
}

interface AdminViewProps {
  programs: Program[];
  agentLogs: AgentLog[];
}

const PROGRAM_TYPES = [
  { value: "credit_card", label: "Credit Card" },
  { value: "airline_miles", label: "Airline Miles" },
  { value: "hotel_loyalty", label: "Hotel Loyalty" },
  { value: "cashback", label: "Cashback" },
];

const CATEGORIES = ["Banking", "Travel", "Hospitality", "Retail", "Other"];

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
      Active
    </Badge>
  ) : (
    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">
      Inactive
    </Badge>
  );
}

function AgentStatusIcon({ status }: { status: string }) {
  if (status === "completed") {
    return <CheckCircle2 className="size-4 text-emerald-500" />;
  }
  if (status === "failed") {
    return <XCircle className="size-4 text-red-500" />;
  }
  return <Clock className="size-4 text-amber-500" />;
}

function ProgramForm({
  program,
  onSubmit,
  loading,
  submitLabel,
}: {
  program: Partial<Program>;
  onSubmit: (data: Partial<Program>) => void;
  loading: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState({
    name: program.name ?? "",
    provider: program.provider ?? "",
    type: program.type ?? "credit_card",
    conversionRate: String(program.conversionRate ?? ""),
    category: program.category ?? "Banking",
    expiryRules: program.expiryRules ?? "",
    transferPartners: program.transferPartners ?? "",
    color: program.color ?? "#6366f1",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      ...form,
      conversionRate: Number(form.conversionRate),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Program Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="provider">Provider</Label>
          <Input
            id="provider"
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm({ ...form, type: v ?? "credit_card" })}
          >
            <SelectTrigger id="type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROGRAM_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v ?? "Banking" })}
          >
            <SelectTrigger id="category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="conversionRate">Conversion Rate (₹/point)</Label>
          <Input
            id="conversionRate"
            type="number"
            step="0.01"
            min="0"
            value={form.conversionRate}
            onChange={(e) =>
              setForm({ ...form, conversionRate: e.target.value })
            }
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="color">Brand Color</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-9 w-14 cursor-pointer p-1"
            />
            <Input
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="expiryRules">Expiry Rules</Label>
        <Textarea
          id="expiryRules"
          value={form.expiryRules}
          onChange={(e) => setForm({ ...form, expiryRules: e.target.value })}
          rows={2}
          placeholder="Points expire 2 years from earning date"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="transferPartners">Transfer Partners</Label>
        <Input
          id="transferPartners"
          value={form.transferPartners}
          onChange={(e) =>
            setForm({ ...form, transferPartners: e.target.value })
          }
          placeholder="Air India, Marriott, etc."
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditProgramDialog({ program }: { program: Program }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: Partial<Program>) {
    setLoading(true);
    try {
      await fetch("/api/admin/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: program.id, ...data }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5" />
        }
      >
        <Pencil className="size-3.5" />
        Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Program</DialogTitle>
          <DialogDescription>
            Update conversion rate and expiry rules for {program.name}.
          </DialogDescription>
        </DialogHeader>
        <ProgramForm
          program={program}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}

function AddProgramDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: Partial<Program>) {
    setLoading(true);
    try {
      await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500" />
        }
      >
        <Plus className="size-4" />
        Add Program
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Reward Program</DialogTitle>
          <DialogDescription>
            Create a new loyalty program with conversion rates and expiry rules.
          </DialogDescription>
        </DialogHeader>
        <ProgramForm
          program={{}}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Create Program"
        />
      </DialogContent>
    </Dialog>
  );
}

export function AdminView({ programs, agentLogs }: AdminViewProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggle(program: Program) {
    setTogglingId(program.id);
    try {
      await fetch("/api/admin/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: program.id, isActive: !program.isActive }),
      });
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  const activeCount = programs.filter((p) => p.isActive).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Program Administration
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage reward programs, conversion rates, and monitor agent activity.
          </p>
        </div>
        <AddProgramDialog />
      </div>

      <Card className="border-indigo-200/60 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="size-4 text-indigo-600" />
            Card data pipeline
          </CardTitle>
          <CardDescription>
            Add bank URLs, crawl page content, extract with AI, then approve in Extractions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/admin/sources"
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Open Sources (Crawl &amp; Extract) <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{programs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200/60 bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agent Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{agentLogs.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="size-5 text-indigo-600" />
            <CardTitle>Reward Programs</CardTitle>
          </div>
          <CardDescription>
            Configure conversion rates, expiry rules, and program status.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Rate (₹/pt)</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: program.color ?? "#6366f1",
                        }}
                      />
                      <span className="font-medium">{program.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {program.provider}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {program.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    ₹{program.conversionRate.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] ${program._source === "normalized" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                      {program._source === "normalized" ? "v2" : "legacy"}
                    </Badge>
                    {program.cardName && <p className="mt-0.5 text-[10px] text-muted-foreground">{program.cardName}</p>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge active={program.isActive} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={program.isActive}
                      onCheckedChange={() => handleToggle(program)}
                      disabled={togglingId === program.id}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditProgramDialog program={program} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-violet-600" />
            <CardTitle>Agent Execution Logs</CardTitle>
          </div>
          <CardDescription>
            Recent AI agent workflow runs across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Agent</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Executed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No agent executions recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                agentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.agentName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.workflowName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AgentStatusIcon status={log.status} />
                        <span
                          className={cn(
                            "text-sm capitalize",
                            log.status === "completed" && "text-emerald-600",
                            log.status === "failed" && "text-red-600",
                            log.status === "pending" && "text-amber-600"
                          )}
                        >
                          {log.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {log.durationMs ? `${log.durationMs}ms` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(log.executedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
