import { NextRequest, NextResponse } from "next/server";
import { searchByBenefit } from "@/lib/graph/queries";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const benefits = await searchByBenefit(
      sp.get("category") ?? undefined,
      sp.get("q") ?? undefined,
    );
    return NextResponse.json({ benefits });
  } catch (error) {
    console.error("GET /api/v2/benefits error:", error);
    return NextResponse.json({ error: "Failed to fetch benefits" }, { status: 500 });
  }
}
