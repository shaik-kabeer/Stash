import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runOnboardingEngine } from "@/lib/cards/onboarding-engine";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userCardId, cardId } = await req.json();
    if (!userCardId || !cardId) {
      return NextResponse.json({ error: "userCardId and cardId are required" }, { status: 400 });
    }

    const userCard = await prisma.userCard.findFirst({ where: { id: userCardId, userId } });
    if (!userCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId }, include: { bank: true } });
    if (!card) {
      return NextResponse.json({ error: "Catalog card not found" }, { status: 404 });
    }

    await prisma.userCard.update({
      where: { id: userCardId },
      data: {
        cardId,
        productName: card.name,
        bank: card.bank.name,
        network: card.network,
        confidence: "exact",
      },
    });

    return NextResponse.json({ success: true, cardName: card.name });
  } catch (error) {
    console.error("PUT /api/cards/onboard error:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

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
