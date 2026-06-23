import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { balance, sync } = body;

    const account = await prisma.rewardAccount.findUnique({
      where: { id },
      include: { program: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (sync) {
      const updated = await prisma.rewardAccount.update({
        where: { id },
        data: { lastSynced: new Date() },
        include: { program: true },
      });
      return NextResponse.json(updated);
    }

    if (balance === undefined || balance === null) {
      return NextResponse.json(
        { error: "balance or sync flag is required" },
        { status: 400 }
      );
    }

    const numericBalance = Number(balance);
    const estimatedValueINR = numericBalance * account.program.conversionRate;

    const updated = await prisma.rewardAccount.update({
      where: { id },
      data: {
        balance: numericBalance,
        estimatedValueINR,
      },
      include: { program: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update reward account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const account = await prisma.rewardAccount.findUnique({ where: { id } });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await prisma.rewardAccount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete reward account" },
      { status: 500 }
    );
  }
}
