import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { valuatePortfolio } from "@/lib/rewards/valuator";
import { getAllRewardPrograms } from "@/lib/graph/queries";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const [valuation, allPrograms] = await Promise.all([
      valuatePortfolio(userId),
      getAllRewardPrograms(),
    ]);

    const programsByBank: Record<string, {
      bankName: string;
      programs: typeof allPrograms;
    }> = {};

    for (const p of allPrograms) {
      const bankName = p.card?.bank?.name ?? "Other";
      if (!programsByBank[bankName]) {
        programsByBank[bankName] = { bankName, programs: [] };
      }
      programsByBank[bankName].programs.push(p);
    }

    return NextResponse.json({
      valuation,
      allPrograms,
      programsByBank: Object.values(programsByBank),
    });
  } catch (error) {
    console.error("GET /api/v2/rewards error:", error);
    return NextResponse.json({ error: "Failed to load rewards" }, { status: 500 });
  }
}
