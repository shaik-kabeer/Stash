import { NextRequest, NextResponse } from "next/server";
import { getBankCards } from "@/lib/graph/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bank = await getBankCards(id);
    if (!bank) return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    return NextResponse.json(bank);
  } catch (error) {
    console.error("GET /api/v2/banks/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch bank" }, { status: 500 });
  }
}
