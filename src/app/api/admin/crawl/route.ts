import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { sourcePageId } = await req.json();

    const sourcePage = await prisma.sourcePage.findUnique({ where: { id: sourcePageId } });
    if (!sourcePage) {
      return NextResponse.json({ error: "Source page not found" }, { status: 404 });
    }

    const crawlJob = await prisma.crawlJob.create({
      data: { sourcePageId, method: "fetch", status: "running", startedAt: new Date() },
    });

    const startMs = Date.now();

    try {
      const res = await fetch(sourcePage.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; RewardOS Admin Crawler/1.0)" },
        signal: AbortSignal.timeout(15000),
      });

      const html = await res.text();
      const content = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const hash = createHash("sha256").update(content).digest("hex");
      const durationMs = Date.now() - startMs;
      const changed = hash !== sourcePage.contentHash;

      await prisma.sourcePage.update({
        where: { id: sourcePageId },
        data: { rawContent: content, contentHash: hash, lastCrawledAt: new Date(), status: "crawled" },
      });

      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: { status: "completed", completedAt: new Date(), durationMs },
      });

      return NextResponse.json({ crawlJobId: crawlJob.id, changed, contentLength: content.length, durationMs });
    } catch (error) {
      const durationMs = Date.now() - startMs;
      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: { status: "failed", completedAt: new Date(), durationMs, error: String(error) },
      });
      return NextResponse.json({ error: "Crawl failed", details: String(error) }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request", details: String(error) }, { status: 400 });
  }
}
