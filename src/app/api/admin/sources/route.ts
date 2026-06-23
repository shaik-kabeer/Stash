import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const sources = await prisma.sourcePage.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        bank: { select: { name: true, code: true } },
        _count: { select: { crawlJobs: true, extractionJobs: true } },
      },
    });
    return NextResponse.json(sources);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sources", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { url, pageType, bankId } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const existing = await prisma.sourcePage.findUnique({ where: { url } });
    if (existing) return NextResponse.json({ error: "Source already exists" }, { status: 409 });

    const source = await prisma.sourcePage.create({
      data: { url, pageType: pageType ?? "card_page", bankId: bankId ?? null, status: "pending" },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create source", details: String(error) }, { status: 500 });
  }
}
