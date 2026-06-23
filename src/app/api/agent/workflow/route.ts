import { NextResponse } from "next/server";
import { runPortfolioAnalysis } from "@/lib/workflows/portfolio-analysis";
import { runExpiryDetection } from "@/lib/workflows/expiry-detection";
import {
  runRedemptionOptimization,
  DEFAULT_REDEMPTION_CATALOG,
} from "@/lib/workflows/redemption-optimization";
import {
  runCardRecommendation,
  SpendingCategory,
} from "@/lib/workflows/card-recommendation";
import { DEMO_USER_ID } from "@/lib/agents/config";
import { prisma } from "@/lib/prisma";

const VALID_WORKFLOWS = [
  "portfolio-analysis",
  "expiry-detection",
  "redemption-optimization",
  "card-recommendation",
] as const;

type WorkflowName = (typeof VALID_WORKFLOWS)[number];

async function getAccountsForUser(userId: string) {
  const accounts = await prisma.rewardAccount.findMany({
    where: { userId },
    include: { program: true },
  });

  return accounts.map((a) => ({
    provider: a.program.provider,
    balance: a.balance,
    conversionRate: a.program.conversionRate,
    valueINR: a.estimatedValueINR,
    expiryDate: a.expiryDate?.toISOString() ?? null,
    transferPartners: a.program.transferPartners,
    status: a.status,
  }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workflow, input = {} } = body;

    if (!workflow || !VALID_WORKFLOWS.includes(workflow)) {
      return NextResponse.json(
        {
          error: "Invalid workflow",
          validWorkflows: VALID_WORKFLOWS,
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    let result: unknown;

    switch (workflow as WorkflowName) {
      case "portfolio-analysis": {
        const userId = input.userId ?? DEMO_USER_ID;
        result = await runPortfolioAnalysis(userId);
        break;
      }

      case "expiry-detection": {
        const accounts =
          input.accounts ??
          (await getAccountsForUser(input.userId ?? DEMO_USER_ID));
        result = await runExpiryDetection(accounts);
        break;
      }

      case "redemption-optimization": {
        const accounts =
          input.accounts ??
          (await getAccountsForUser(input.userId ?? DEMO_USER_ID));
        const catalog = input.redemptionCatalog ?? DEFAULT_REDEMPTION_CATALOG;
        result = await runRedemptionOptimization(accounts, catalog);
        break;
      }

      case "card-recommendation": {
        const category = (input.category ?? "travel") as SpendingCategory;
        result = await runCardRecommendation(category);
        break;
      }
    }

    const durationMs = Date.now() - startTime;

    if (input.userId) {
      await prisma.agentExecution.create({
        data: {
          userId: input.userId ?? DEMO_USER_ID,
          agentName: workflow,
          workflowName: workflow,
          status: "completed",
          input: JSON.stringify(input),
          output: JSON.stringify(result),
          durationMs,
        },
      });
    }

    return NextResponse.json({ workflow, result, durationMs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workflow failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
