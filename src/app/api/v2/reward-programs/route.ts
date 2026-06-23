import { NextResponse } from "next/server";
import { getAllRewardPrograms } from "@/lib/graph/queries";

export async function GET() {
  try {
    const programs = await getAllRewardPrograms();
    return NextResponse.json(programs);
  } catch (error) {
    console.error("GET /api/v2/reward-programs error:", error);
    return NextResponse.json({ error: "Failed to fetch reward programs" }, { status: 500 });
  }
}
