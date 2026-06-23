import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_USER_ID = "user_demo_001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? DEMO_USER_ID;

    const accounts = await prisma.rewardAccount.findMany({
      where: { userId },
      include: { program: true },
      orderBy: { estimatedValueINR: "desc" },
    });

    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch reward accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId = DEMO_USER_ID, programId, balance } = body;

    if (!programId || balance === undefined || balance === null) {
      return NextResponse.json(
        { error: "programId and balance are required" },
        { status: 400 }
      );
    }

    const program = await prisma.rewardProgram.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const existing = await prisma.rewardAccount.findUnique({
      where: { userId_programId: { userId, programId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Account already exists for this program" },
        { status: 409 }
      );
    }

    const numericBalance = Number(balance);
    const estimatedValueINR = numericBalance * program.conversionRate;

    const account = await prisma.rewardAccount.create({
      data: {
        userId,
        programId,
        balance: numericBalance,
        estimatedValueINR,
        lastSynced: new Date(),
        status: "active",
      },
      include: { program: true },
    });

    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create reward account" },
      { status: 500 }
    );
  }
}
