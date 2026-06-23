import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bank = searchParams.get("bank");
    const network = searchParams.get("network");

    const where: Record<string, unknown> = { isActive: true };
    if (bank) where.bank = { contains: bank };
    if (network) where.network = network;

    const cards = await prisma.cardProduct.findMany({
      where,
      orderBy: { estimatedAnnualValue: "desc" },
      include: { _count: { select: { bins: true } } },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Catalog error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
