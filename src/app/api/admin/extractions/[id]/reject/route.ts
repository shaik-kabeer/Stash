import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { reason } = await req.json();

    const job = await prisma.extractionJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Extraction job not found" }, { status: 404 });

    await prisma.extractionJob.update({
      where: { id },
      data: {
        status: "rejected",
        validationErrors: JSON.stringify({
          ...(job.validationErrors ? JSON.parse(job.validationErrors) : {}),
          rejectionReason: reason ?? "Rejected by admin",
        }),
      },
    });

    return NextResponse.json({ success: true, message: "Extraction rejected" });
  } catch (error) {
    return NextResponse.json({ error: "Rejection failed", details: String(error) }, { status: 500 });
  }
}
