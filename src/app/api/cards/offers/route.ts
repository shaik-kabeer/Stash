import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cards = await prisma.cardProduct.findMany({
      where: {
        isActive: true,
        NOT: { currentOffers: null },
      },
      select: {
        id: true,
        name: true,
        bank: true,
        network: true,
        color: true,
        currentOffers: true,
        annualFee: true,
      },
      orderBy: { bank: "asc" },
    });

    const withOffers = cards.filter(
      (c) => c.currentOffers && c.currentOffers.trim() !== "" && c.currentOffers.trim().toLowerCase() !== "none"
    );

    return NextResponse.json({ cards: withOffers });
  } catch (error) {
    console.error("Offers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
