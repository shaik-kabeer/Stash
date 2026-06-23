import { NextRequest, NextResponse } from "next/server";
import { getRewardProgramFull } from "@/lib/graph/queries";

interface RankedOption {
  name: string;
  type: string;
  pointsNeeded: number;
  estimatedValue: number;
  efficiencyRating: string;
  estimatedCPP: number;
  description: string | null;
}

function getEfficiencyRating(cpp: number): string {
  if (cpp >= 0.75) return "excellent";
  if (cpp >= 0.50) return "good";
  if (cpp >= 0.25) return "fair";
  return "poor";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { programId, balance } = body;

    if (!programId || typeof balance !== "number") {
      return NextResponse.json(
        { error: "programId and balance (number) are required" },
        { status: 400 },
      );
    }

    const program = await getRewardProgramFull(programId);
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const ranked: RankedOption[] = [];

    for (const r of program.redemptions) {
      const valuePerPoint = r.conversionRate;
      const estimatedValue = balance * valuePerPoint;
      ranked.push({
        name: r.name,
        type: r.type,
        pointsNeeded: r.minPoints,
        estimatedValue: Math.round(estimatedValue * 100) / 100,
        efficiencyRating: getEfficiencyRating(r.estimatedCPP),
        estimatedCPP: r.estimatedCPP,
        description: r.description,
      });
    }

    for (const tp of program.transferPartners) {
      const [from, to] = tp.transferRatio.split(":").map(Number);
      const transferredUnits = (balance / from) * to;
      ranked.push({
        name: `Transfer to ${tp.partnerName}`,
        type: `${tp.partnerType}_transfer`,
        pointsNeeded: 0,
        estimatedValue: transferredUnits,
        efficiencyRating: "varies",
        estimatedCPP: 0,
        description: `${tp.transferRatio} ratio. ${tp.transferTime ?? "Unknown"} processing. Fee: ₹${tp.transferFee}`,
      });
    }

    ranked.sort((a, b) => b.estimatedCPP - a.estimatedCPP || b.estimatedValue - a.estimatedValue);

    return NextResponse.json({
      program: {
        id: program.id,
        name: program.name,
        pointName: program.pointName,
        card: program.card.name,
        bank: program.card.bank?.name,
      },
      balance,
      recommendations: ranked,
      bestOption: ranked[0] ?? null,
    });
  } catch (error) {
    console.error("POST /api/v2/reward-optimizer error:", error);
    return NextResponse.json({ error: "Optimization failed" }, { status: 500 });
  }
}
