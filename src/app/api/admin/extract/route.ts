import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runExtraction } from "@/lib/extraction/run-extraction";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { sourcePageId } = await req.json();
    if (!sourcePageId) {
      return NextResponse.json({ error: "sourcePageId is required" }, { status: 400 });
    }

    const result = await runExtraction(sourcePageId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("not found") ? 404 : message.includes("Crawl first") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
