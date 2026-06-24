import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminView } from "./admin-view";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    redirect("/dashboard");
  }
  const [legacyPrograms, normalizedPrograms, agentLogs] = await Promise.all([
    prisma.rewardProgram.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.normalizedProgram.findMany({
      include: {
        card: { select: { name: true, bank: { select: { name: true } } } },
        _count: { select: { redemptions: true, transferPartners: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.agentExecution.findMany({
      orderBy: { executedAt: "desc" },
      take: 20,
    }),
  ]);

  // Merge: prefer normalized programs, fallback to legacy
  const programs = [
    ...normalizedPrograms.map((p) => ({
      id: p.id,
      name: p.name,
      provider: p.card?.bank?.name ?? "Unknown",
      type: "credit_card",
      conversionRate: 0,
      category: "Banking",
      expiryRules: p.expiryMonths ? `${p.expiryMonths} months` : null,
      transferPartners: null,
      color: null,
      isActive: p.isActive,
      currencyEquivalent: "INR",
      _source: "normalized" as const,
      earnRate: p.earnRate,
      pointName: p.pointName,
      cardName: p.card?.name ?? "",
      redemptionCount: p._count.redemptions,
      transferCount: p._count.transferPartners,
    })),
    ...legacyPrograms.map((p) => ({
      id: p.id,
      name: p.name,
      provider: p.provider,
      type: p.type,
      conversionRate: p.conversionRate,
      category: p.category,
      expiryRules: p.expiryRules,
      transferPartners: p.transferPartners,
      color: p.color,
      isActive: p.isActive,
      currencyEquivalent: p.currencyEquivalent,
      _source: "legacy" as const,
      earnRate: null as string | null,
      pointName: null as string | null,
      cardName: null as string | null,
      redemptionCount: 0,
      transferCount: 0,
    })),
  ];

  const serializedPrograms = programs;

  const serializedLogs = agentLogs.map((log) => ({
    id: log.id,
    agentName: log.agentName,
    workflowName: log.workflowName,
    status: log.status,
    durationMs: log.durationMs,
    executedAt: log.executedAt.toISOString(),
    output: log.output,
  }));

  return (
    <AdminView programs={serializedPrograms} agentLogs={serializedLogs} />
  );
}
