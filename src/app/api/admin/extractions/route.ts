import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status");
    const limit = parseInt(sp.get("limit") ?? "50");

    const jobs = await prisma.extractionJob.findMany({
      where: {
        ...(status && { status }),
      },
      include: {
        sourcePage: { select: { id: true, url: true } },
        crawlJob: { select: { id: true, method: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch extraction jobs", details: String(error) }, { status: 500 });
  }
}
