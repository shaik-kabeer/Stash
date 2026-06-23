import { NextRequest, NextResponse } from "next/server";
import { getAllCards, searchCards, findCardByBIN } from "@/lib/graph/queries";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q");
    const bin = sp.get("bin");

    if (bin) {
      const card = await findCardByBIN(bin.slice(0, 8)) ?? await findCardByBIN(bin.slice(0, 6));
      return NextResponse.json({ cards: card ? [card] : [] });
    }

    if (q) {
      const results = await searchCards(q);
      return NextResponse.json({ cards: results });
    }

    const cards = await getAllCards({
      bankId: sp.get("bankId") ?? undefined,
      network: sp.get("network") ?? undefined,
      cardType: sp.get("cardType") ?? undefined,
      tier: sp.get("tier") ?? undefined,
      maxAnnualFee: sp.get("maxAnnualFee") ? Number(sp.get("maxAnnualFee")) : undefined,
    });
    return NextResponse.json({ cards });
  } catch (error) {
    console.error("GET /api/v2/cards error:", error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}
