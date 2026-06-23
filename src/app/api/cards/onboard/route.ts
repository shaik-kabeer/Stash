import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runOnboardingEngine } from "@/lib/cards/onboarding-engine";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { cardNumber, nickname } = await req.json();

    if (!cardNumber || typeof cardNumber !== "string") {
      return NextResponse.json({ error: "Card number is required" }, { status: 400 });
    }

    const result = await runOnboardingEngine({ cardNumber, nickname, userId });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Onboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const cards = await prisma.userCard.findMany({
      where: { userId, isActive: true },
      include: {
        normalizedCard: {
          include: {
            bank: true,
            benefits: true,
            offers: { where: { validTo: { gte: new Date() } } },
          },
        },
      },
      orderBy: { onboardedAt: "desc" },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Get cards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
