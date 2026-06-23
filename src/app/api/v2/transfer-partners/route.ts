import { NextRequest, NextResponse } from "next/server";
import { getTransferPartnerReach } from "@/lib/graph/queries";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const partnerName = sp.get("partner");

    if (partnerName) {
      const reach = await getTransferPartnerReach(partnerName);
      return NextResponse.json(reach);
    }

    const all = await prisma.transferPartner.findMany({
      where: { isActive: true },
      include: {
        program: {
          include: {
            card: { select: { id: true, name: true, bank: { select: { name: true } } } },
          },
        },
      },
    });
    return NextResponse.json(all);
  } catch (error) {
    console.error("GET /api/v2/transfer-partners error:", error);
    return NextResponse.json({ error: "Failed to fetch transfer partners" }, { status: 500 });
  }
}
