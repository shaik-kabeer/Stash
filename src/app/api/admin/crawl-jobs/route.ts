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
    const method = sp.get("method");
    const limit = parseInt(sp.get("limit") ?? "50");

    const jobs = await prisma.crawlJob.findMany({
      where: {
        ...(status && { status }),
        ...(method && { method }),
      },
      include: {
        sourcePage: { select: { id: true, url: true, bankId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch crawl jobs", details: String(error) }, { status: 500 });
  }
}
