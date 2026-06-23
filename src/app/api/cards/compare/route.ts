import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { cardIds } = await req.json();

    if (!Array.isArray(cardIds) || cardIds.length < 2 || cardIds.length > 4) {
      return NextResponse.json({ error: "Select 2-4 cards to compare" }, { status: 400 });
    }

    const cards = await prisma.cardProduct.findMany({
      where: { id: { in: cardIds } },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
