import { NextRequest, NextResponse } from "next/server";
import { getBestCardsForCategory, getAllBestCards } from "@/lib/rewards/best-card";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");

    if (category) {
      const result = await getBestCardsForCategory(category);
      return NextResponse.json(result);
    }

    const results = await getAllBestCards();
    return NextResponse.json({ categories: results });
  } catch (error) {
    console.error("GET /api/v2/best-card error:", error);
    return NextResponse.json({ error: "Failed to fetch best cards" }, { status: 500 });
  }
}
