import { NextRequest, NextResponse } from "next/server";
import { getRedeemLinks, getAllRedeemLinks } from "@/lib/rewards/redeem-links";

export async function GET(req: NextRequest) {
  const bank = req.nextUrl.searchParams.get("bank");

  if (bank) {
    const links = getRedeemLinks(bank);
    return NextResponse.json({ bank, links });
  }

  const all = getAllRedeemLinks();
  return NextResponse.json({ banks: all });
}
