import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const [goals, userRewards] = await Promise.all([
    prisma.goalPlan.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.userReward.findMany({
      where: { userId },
      include: { program: { include: { redemptions: true, card: { include: { bank: true } } } } },
    }),
  ]);

  let currentProgress = 0;
  const programBreakdown: { programName: string; balance: number; estimatedValue: number; cardName: string }[] = [];
  for (const ur of userRewards) {
    const bestRate = ur.program.redemptions.reduce((max, r) => (r.conversionRate > max ? r.conversionRate : max), 0);
    const value = ur.balance * (bestRate || 0.25);
    currentProgress += value;
    if (ur.balance > 0) {
      programBreakdown.push({
        programName: ur.program.name,
        balance: ur.balance,
        estimatedValue: Math.round(value),
        cardName: ur.program.card.name,
      });
    }
  }

  const updatedGoals = await Promise.all(
    goals.map(async (goal) => {
      if (Math.abs(goal.currentProgress - currentProgress) > 1) {
        await prisma.goalPlan.update({
          where: { id: goal.id },
          data: { currentProgress: Math.round(currentProgress) },
        });
      }
      return { ...goal, currentProgress: Math.round(currentProgress) };
    }),
  );

  return NextResponse.json({ goals: updatedGoals, programBreakdown, totalRewardsValue: Math.round(currentProgress) });
}

const DESTINATION_ESTIMATES: Record<string, { value: number; currency: string }> = {
  dubai: { value: 45000, currency: "INR" },
  goa: { value: 15000, currency: "INR" },
  singapore: { value: 60000, currency: "INR" },
  bangkok: { value: 35000, currency: "INR" },
  bali: { value: 50000, currency: "INR" },
  maldives: { value: 80000, currency: "INR" },
  london: { value: 120000, currency: "INR" },
  paris: { value: 110000, currency: "INR" },
  new_york: { value: 130000, currency: "INR" },
  tokyo: { value: 90000, currency: "INR" },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, destination, targetValue: customTarget } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const destKey = (destination ?? "").toLowerCase().replace(/\s+/g, "_");
    const estimate = DESTINATION_ESTIMATES[destKey];
    const targetValue = customTarget ?? estimate?.value ?? 50000;

    const userRewards = await prisma.userReward.findMany({
      where: { userId },
      include: {
        program: { include: { redemptions: true, card: { include: { bank: true } } } },
      },
    });

    let currentProgress = 0;
    const cardSuggestions: string[] = [];
    const strategies: string[] = [];

    for (const ur of userRewards) {
      const bestRate = ur.program.redemptions.reduce(
        (max, r) => (r.conversionRate > max ? r.conversionRate : max), 0);
      const value = ur.balance * (bestRate || 0.25);
      currentProgress += value;
      if (bestRate > 0.5) {
        cardSuggestions.push(ur.program.card.name);
        strategies.push(`Use ${ur.program.card.name} for high-reward categories to earn ${ur.program.pointName} faster`);
      }
    }

    const gap = Math.max(0, targetValue - currentProgress);
    let projectedDate: Date | null = null;
    if (gap > 0 && userRewards.length > 0) {
      const avgMonthlyEarn = currentProgress > 0 ? currentProgress / 6 : 2000;
      const monthsToGoal = Math.ceil(gap / avgMonthlyEarn);
      projectedDate = new Date();
      projectedDate.setMonth(projectedDate.getMonth() + monthsToGoal);
    }

    if (gap > 0) {
      strategies.push(`You need ≈₹${Math.round(gap)} more in rewards to reach your goal`);
    } else {
      strategies.push("You already have enough rewards! Consider redeeming now.");
    }

    const goal = await prisma.goalPlan.create({
      data: {
        userId,
        title,
        destination: destination ?? null,
        targetValue,
        currentProgress: Math.round(currentProgress),
        recommendedCards: cardSuggestions.length > 0 ? JSON.stringify(cardSuggestions) : null,
        earningStrategy: strategies.length > 0 ? JSON.stringify(strategies) : null,
        projectedDate,
      },
    });

    return NextResponse.json({
      goal,
      analysis: {
        currentRewardsValue: Math.round(currentProgress),
        targetValue,
        gap: Math.round(gap),
        projectedDate: projectedDate?.toISOString().split("T")[0] ?? null,
        recommendedCards: cardSuggestions,
        strategies,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v2/goals error:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
