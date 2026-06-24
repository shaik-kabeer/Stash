import { NextRequest, NextResponse } from "next/server";
import { optimizeRedemption } from "@/lib/rewards/optimizer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { programId, balance } = body;

    if (!programId || typeof balance !== "number") {
      return NextResponse.json(
        { error: "programId and balance (number) are required" },
        { status: 400 },
      );
    }

    const result = await optimizeRedemption(programId, balance);
    if (!result) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/v2/reward-optimizer error:", error);
    return NextResponse.json({ error: "Optimization failed" }, { status: 500 });
  }
}
