import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return null;
  }
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const programs = await prisma.normalizedProgram.findMany({
      include: {
        card: { select: { id: true, name: true, bank: { select: { name: true, code: true } } } },
        _count: { select: { redemptions: true, transferPartners: true, userRewards: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(programs);
  } catch (error) {
    console.error("GET /api/admin/v2/programs error:", error);
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { cardId, name, pointName, earnRate, earnDescription, expiryMonths } = body;

    if (!cardId || !name || !pointName || !earnRate) {
      return NextResponse.json({ error: "cardId, name, pointName, and earnRate are required" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const program = await prisma.normalizedProgram.create({
      data: {
        cardId,
        name,
        pointName,
        earnRate,
        earnDescription: earnDescription ?? null,
        expiryMonths: expiryMonths ? parseInt(expiryMonths) : null,
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/v2/programs error:", error);
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Program id is required" }, { status: 400 });
    }

    const updated = await prisma.normalizedProgram.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.pointName && { pointName: data.pointName }),
        ...(data.earnRate && { earnRate: data.earnRate }),
        ...(data.earnDescription !== undefined && { earnDescription: data.earnDescription }),
        ...(data.expiryMonths !== undefined && { expiryMonths: data.expiryMonths ? parseInt(data.expiryMonths) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/admin/v2/programs error:", error);
    return NextResponse.json({ error: "Failed to update program" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Program id is required" }, { status: 400 });
    }

    await prisma.normalizedProgram.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/v2/programs error:", error);
    return NextResponse.json({ error: "Failed to delete program" }, { status: 500 });
  }
}
