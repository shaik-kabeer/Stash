import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const programs = await prisma.rewardProgram.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(programs);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      provider,
      type,
      conversionRate,
      category,
      expiryRules,
      transferPartners,
      color,
      currencyEquivalent = "INR",
    } = body;

    if (!name || !provider || !type || conversionRate === undefined || !category) {
      return NextResponse.json(
        { error: "name, provider, type, conversionRate, and category are required" },
        { status: 400 }
      );
    }

    const program = await prisma.rewardProgram.create({
      data: {
        name,
        provider,
        type,
        conversionRate: Number(conversionRate),
        category,
        expiryRules: expiryRules ?? null,
        transferPartners: transferPartners ?? null,
        color: color ?? null,
        currencyEquivalent,
        isActive: true,
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create program" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.rewardProgram.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (updates.name !== undefined) data.name = updates.name;
    if (updates.provider !== undefined) data.provider = updates.provider;
    if (updates.type !== undefined) data.type = updates.type;
    if (updates.conversionRate !== undefined) {
      data.conversionRate = Number(updates.conversionRate);
    }
    if (updates.category !== undefined) data.category = updates.category;
    if (updates.expiryRules !== undefined) data.expiryRules = updates.expiryRules;
    if (updates.transferPartners !== undefined) {
      data.transferPartners = updates.transferPartners;
    }
    if (updates.color !== undefined) data.color = updates.color;
    if (updates.isActive !== undefined) data.isActive = Boolean(updates.isActive);
    if (updates.currencyEquivalent !== undefined) {
      data.currencyEquivalent = updates.currencyEquivalent;
    }

    const program = await prisma.rewardProgram.update({
      where: { id },
      data,
    });

    return NextResponse.json(program);
  } catch {
    return NextResponse.json(
      { error: "Failed to update program" },
      { status: 500 }
    );
  }
}
