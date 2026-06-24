import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["active", "completed", "cancelled"] as const;

async function getAuthorizedGoal(id: string, userId: string) {
  const goal = await prisma.goalPlan.findUnique({ where: { id } });
  if (!goal) return { error: NextResponse.json({ error: "Goal not found" }, { status: 404 }) };
  if (goal.userId !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { goal };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const { id } = await params;
    const result = await getAuthorizedGoal(id, userId);
    if ("error" in result) return result.error;

    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

    const goal = await prisma.goalPlan.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("PUT /api/v2/goals/[id] error:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const { id } = await params;
    const result = await getAuthorizedGoal(id, userId);
    if ("error" in result) return result.error;

    await prisma.goalPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/v2/goals/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
