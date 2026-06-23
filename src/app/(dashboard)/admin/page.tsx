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
  const [programs, agentLogs] = await Promise.all([
    prisma.rewardProgram.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.agentExecution.findMany({
      orderBy: { executedAt: "desc" },
      take: 20,
    }),
  ]);

  const serializedPrograms = programs.map((p) => ({
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
  }));

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
