import { NextRequest, NextResponse } from "next/server";
import { getRewardProgramFull } from "@/lib/graph/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const program = await getRewardProgramFull(id);
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });
    return NextResponse.json(program);
  } catch (error) {
    console.error("GET /api/v2/reward-programs/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 });
  }
}
