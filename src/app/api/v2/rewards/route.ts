import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { valuatePortfolio } from "@/lib/rewards/valuator";
import { getAllRewardPrograms } from "@/lib/graph/queries";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const [valuation, allPrograms, userRewards, userCards] = await Promise.all([
      valuatePortfolio(userId).catch((err) => {
        console.error("valuatePortfolio error:", err);
        return {
          userId,
          totalCards: 0,
          totalRewardPrograms: 0,
          totalPointsBalance: 0,
          totalEstimatedValueINR: 0,
          rewardNetWorth: 0,
          cards: [] as { cardName: string; bankName: string; annualFee: number; estimatedAnnualValue: number; netValue: number }[],
          rewards: [] as { programName: string; pointName: string; balance: number; bestRedemptionRate: number; estimatedValueINR: number; bestRedemptionName: string }[],
          byCategory: [] as { category: string; totalValueINR: number; programCount: number }[],
          insights: [] as string[],
        };
      }),
      getAllRewardPrograms(),
      prisma.userReward.findMany({
        where: { userId },
        include: { program: { include: { card: { include: { bank: true } }, redemptions: true } } },
      }),
      prisma.userCard.findMany({
        where: { userId, isActive: true },
        select: { cardId: true },
      }),
    ]);

    const userCardIds = new Set(userCards.map((uc) => uc.cardId).filter(Boolean));
    const userProgramIds = new Set(userRewards.map((ur) => ur.programId));

    const userPrograms = allPrograms.filter(
      (p) => userProgramIds.has(p.id) || userCardIds.has(p.cardId),
    );

    const userProgramsByBank: Record<string, { bankName: string; programs: typeof allPrograms }> = {};
    for (const p of userPrograms) {
      const bankName = p.card?.bank?.name ?? "Other";
      if (!userProgramsByBank[bankName]) {
        userProgramsByBank[bankName] = { bankName, programs: [] };
      }
      userProgramsByBank[bankName].programs.push(p);
    }

    const userRewardsWithExpiry = userRewards.map((ur) => ({
      id: ur.id,
      programId: ur.programId,
      programName: ur.program.name,
      pointName: ur.program.pointName,
      bankName: ur.program.card?.bank?.name ?? "Unknown",
      cardName: ur.program.card?.name ?? "",
      balance: ur.balance,
      expiryDate: ur.expiryDate?.toISOString() ?? null,
      expiryMonths: ur.program.expiryMonths,
      lastSynced: ur.lastSynced.toISOString(),
      bestRedemptionRate: ur.program.redemptions.reduce(
        (max, r) => (r.conversionRate > max ? r.conversionRate : max), 0) || 0.25,
    }));

    return NextResponse.json({
      valuation,
      userRewards: userRewardsWithExpiry,
      programsByBank: Object.values(userProgramsByBank),
      allPrograms,
    });
  } catch (error) {
    console.error("GET /api/v2/rewards error:", error);
    return NextResponse.json({ error: "Failed to load rewards" }, { status: 500 });
  }
}
