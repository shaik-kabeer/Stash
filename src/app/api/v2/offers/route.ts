import { NextRequest, NextResponse } from "next/server";
import { getActiveOffers } from "@/lib/graph/queries";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const offers = await getActiveOffers({
      cardId: sp.get("cardId") ?? undefined,
      merchant: sp.get("merchant") ?? undefined,
    });
    return NextResponse.json({ offers });
  } catch (error) {
    console.error("GET /api/v2/offers error:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}
