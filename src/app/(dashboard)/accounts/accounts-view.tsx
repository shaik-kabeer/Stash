"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  Clock,
  Crown,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  formatDate,
  formatINR,
  formatPoints,
  formatRelativeDate,
} from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface SerializedAccount {
  id: string;
  balance: number;
  estimatedValueINR: number;
  lastSynced: string;
  expiryDate: string | null;
  tier: string | null;
  program: {
    id: string;
    name: string;
    provider: string;
    color: string;
    type: string;
    category: string;
  };
}

interface AvailableProgram {
  id: string;
  name: string;
  provider: string;
  color: string;
}

interface AccountsViewProps {
  accounts: SerializedAccount[];
  availablePrograms: AvailableProgram[];
  userId: string;
  totalValue: number;
  totalPoints: number;
}

function ImportCsvDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleImport() {
    setImporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setImporting(false);
    setOpen(false);
    setFileName(null);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
        <Upload className="size-4" />
        Import CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Reward Accounts</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: program, balance, tier. We&apos;ll match
            programs and sync balances automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/30 px-6 py-10 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50">
            <Upload className="mb-3 size-8 text-muted-foreground" />
            <Label
              htmlFor="csv-upload"
              className="cursor-pointer text-sm font-medium text-indigo-600 hover:underline"
            >
              Choose CSV file
            </Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="mt-3 max-w-xs"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            {fileName && (
              <p className="mt-2 text-xs text-muted-foreground">{fileName}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importing || !fileName}>
            {importing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Importing…
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddProgramDialog({
  availablePrograms,
  userId,
}: {
  availablePrograms: AvailableProgram[];
  userId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState("");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!programId || !balance) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          programId,
          balance: Number(balance),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add program");
        setLoading(false);
        return;
      }

      setOpen(false);
      setProgramId("");
      setBalance("");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500" />}>
        <Plus className="size-4" />
        Add Program
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Reward Program</DialogTitle>
            <DialogDescription>
              Link a new loyalty program and enter your current points balance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="program">Program</Label>
              <Select
                value={programId}
                onValueChange={(v) => setProgramId(v ?? "")}
              >
                <SelectTrigger id="program" className="w-full">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrograms.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      All programs linked
                    </SelectItem>
                  ) : (
                    availablePrograms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span
                          className="mr-2 inline-block size-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="balance">Points Balance</Label>
              <Input
                id="balance"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 5000"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !programId || !balance}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Program"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AccountCard({
  account,
  onSync,
  syncing,
}: {
  account: SerializedAccount;
  onSync: (id: string) => void;
  syncing: boolean;
}) {
  const brandColor = account.program.color;

  return (
    <Card
      className="group relative overflow-hidden border-border/60 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{
        borderTopWidth: 3,
        borderTopColor: brandColor,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-[0.15]"
        style={{ backgroundColor: brandColor }}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md"
              style={{ backgroundColor: brandColor }}
            >
              {account.program.provider.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base leading-tight">
                {account.program.provider}
              </CardTitle>
              <CardDescription className="text-xs">
                {account.program.name}
              </CardDescription>
            </div>
          </div>
          {account.tier && (
            <Badge
              variant="outline"
              className="shrink-0 gap-1 border-amber-200 bg-amber-50 text-amber-700"
            >
              <Crown className="size-3" />
              {account.tier}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Points Balance
          </p>
          <p className="text-2xl font-bold tabular-nums tracking-tight">
            {formatPoints(account.balance)}
          </p>
          <p
            className="mt-0.5 text-lg font-semibold tabular-nums"
            style={{ color: brandColor }}
          >
            {formatINR(account.estimatedValueINR)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              Expires
            </div>
            <p className="mt-0.5 font-medium">
              {account.expiryDate
                ? formatRelativeDate(account.expiryDate)
                : "No expiry"}
            </p>
            {account.expiryDate && (
              <p className="text-[10px] text-muted-foreground">
                {formatDate(account.expiryDate)}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              Last Synced
            </div>
            <p className="mt-0.5 font-medium">
              {formatRelativeDate(account.lastSynced)}
            </p>
          </div>
        </div>

        <Badge variant="secondary" className="text-[10px] uppercase">
          {account.program.category} · {account.program.type.replace(/_/g, " ")}
        </Badge>
      </CardContent>

      <CardFooter className="border-t bg-muted/20 pt-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => onSync(account.id)}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Syncing…
            </>
          ) : (
            <>
              <RefreshCw className="size-3.5" />
              Sync Balance
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function AccountsView({
  accounts,
  availablePrograms,
  userId,
  totalValue,
  totalPoints,
}: AccountsViewProps) {
  const router = useRouter();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  async function handleSync(accountId: string) {
    setSyncingId(accountId);
    try {
      await fetch(`/api/rewards/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sync: true }),
      });
      router.refresh();
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Reward Accounts
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage all your loyalty programs, balances, and sync status in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportCsvDialog />
          <AddProgramDialog
            availablePrograms={availablePrograms}
            userId={userId}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-violet-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Portfolio
            </CardTitle>
            <Wallet className="size-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-indigo-700">
              {formatINR(totalValue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatPoints(totalPoints)} points across {accounts.length} programs
            </p>
          </CardContent>
        </Card>
      </div>

      {accounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="mb-4 size-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No accounts yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first reward program to start tracking your portfolio value.
            </p>
            <div className="mt-6">
              <AddProgramDialog
                availablePrograms={availablePrograms}
                userId={userId}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account, index) => (
            <div
              key={account.id}
              className={cn(
                "animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500"
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <AccountCard
                account={account}
                onSync={handleSync}
                syncing={syncingId === account.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
