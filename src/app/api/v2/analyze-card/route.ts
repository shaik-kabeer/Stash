import { NextRequest, NextResponse } from "next/server";
import { findCardByBIN, getCardWithFullGraph } from "@/lib/graph/queries";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cardNumber: string = body.cardNumber ?? "";
    const bin = cardNumber.replace(/\s/g, "").slice(0, 6);

    if (bin.length < 6) {
      return NextResponse.json({ error: "Need at least 6 digits" }, { status: 400 });
    }

    // Try normalized BIN first
    let card = await findCardByBIN(bin);

    // Try 8-digit BIN
    if (!card) {
      const bin8 = cardNumber.replace(/\s/g, "").slice(0, 8);
      card = await findCardByBIN(bin8);
    }

    if (card) {
      return NextResponse.json({
        identified: true,
        source: "normalized_graph",
        card,
      });
    }

    // Fallback to legacy CardBIN table
    const legacyBin = await prisma.cardBIN.findUnique({ where: { bin } });
    if (legacyBin) {
      return NextResponse.json({
        identified: true,
        source: "legacy_bin",
        bin: legacyBin,
      });
    }

    // External BIN lookup
    try {
      const extRes = await fetch(`https://binlist.wellcart.pk/bin/${bin}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
      if (extRes.ok) {
        const extData = await extRes.json();
        return NextResponse.json({
          identified: false,
          source: "external_bin_api",
          externalData: extData,
          suggestion: "Card not in our database. External BIN data returned.",
        });
      }
    } catch {
      // External API failure is non-fatal
    }

    return NextResponse.json({
      identified: false,
      source: "none",
      message: "Could not identify this card",
    });
  } catch (error) {
    console.error("POST /api/v2/analyze-card error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
