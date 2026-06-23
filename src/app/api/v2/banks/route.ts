import { NextResponse } from "next/server";
import { getAllBanks } from "@/lib/graph/queries";

export async function GET() {
  try {
    const banks = await getAllBanks();
    return NextResponse.json(banks);
  } catch (error) {
    console.error("GET /api/v2/banks error:", error);
    return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 });
  }
}
