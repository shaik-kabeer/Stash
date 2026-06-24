import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeExtractedJobPayload,
  upsertExtractedCard,
  type ExtractedJobPayload,
} from "@/lib/extraction/upsert-extracted-card";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const job = await prisma.extractionJob.findUnique({
      where: { id },
      include: { sourcePage: true },
    });

    if (!job) return NextResponse.json({ error: "Extraction job not found" }, { status: 404 });
    if (!job.extractedData) return NextResponse.json({ error: "No extracted data to approve" }, { status: 400 });

    const raw = JSON.parse(job.extractedData) as ExtractedJobPayload;
    const { cards, offers } = normalizeExtractedJobPayload(raw);
    const upserted: string[] = [];

    if (cards.length === 0 && offers.length === 0) {
      return NextResponse.json({ error: "Nothing to approve in extraction payload" }, { status: 400 });
    }

    for (const cardPayload of cards) {
      await upsertExtractedCard(cardPayload, upserted);
    }

    if (offers.length > 0 && cards.length === 0) {
      return NextResponse.json({
        error: "Offers-only extractions need a linked card. Use card_page or listing_page, or approve offers manually.",
        offersFound: offers.length,
      }, { status: 400 });
    }

    await prisma.extractionJob.update({
      where: { id },
      data: { status: "approved" },
    });

    return NextResponse.json({
      success: true,
      message: `Approved ${cards.length} card(s) to normalized tables`,
      upserted,
    });
  } catch (error) {
    return NextResponse.json({ error: "Approval failed", details: String(error) }, { status: 500 });
  }
}
