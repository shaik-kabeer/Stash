import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { programId, balance, expiryDate: expiryOverride } = await req.json();

    if (!programId || typeof balance !== "number" || balance < 0) {
      return NextResponse.json({ error: "programId and a non-negative balance are required" }, { status: 400 });
    }

    const program = await prisma.normalizedProgram.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ error: "Reward program not found" }, { status: 404 });
    }

    let expiryDate: Date | null = null;
    if (expiryOverride) {
      expiryDate = new Date(expiryOverride);
    } else if (program.expiryMonths && program.expiryMonths > 0) {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + program.expiryMonths);
    }

    const reward = await prisma.userReward.upsert({
      where: { userId_programId: { userId, programId } },
      update: { balance, lastSynced: new Date(), ...(expiryDate && { expiryDate }) },
      create: { userId, programId, balance, expiryDate },
    });

    return NextResponse.json({
      success: true,
      reward: {
        id: reward.id,
        programId: reward.programId,
        balance: reward.balance,
        expiryDate: reward.expiryDate,
        lastSynced: reward.lastSynced,
      },
    });
  } catch (error) {
    console.error("POST /api/v2/rewards/balance error:", error);
    return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
  }
}
