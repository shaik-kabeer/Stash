import { NextRequest, NextResponse } from "next/server";
import { getCardWithFullGraph } from "@/lib/graph/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const card = await getCardWithFullGraph(id);
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    return NextResponse.json(card);
  } catch (error) {
    console.error("GET /api/v2/cards/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch card" }, { status: 500 });
  }
}
