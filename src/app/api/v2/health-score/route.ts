import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeHealthScore } from "@/lib/rewards/health-score";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const result = await computeHealthScore(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/v2/health-score error:", error);
    return NextResponse.json({ error: "Failed to compute health score" }, { status: 500 });
  }
}
