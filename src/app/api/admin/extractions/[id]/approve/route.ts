import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ExtractedPayload {
  card?: {
    name: string;
    bank: string;
    network: string;
    cardType?: string;
    tier?: string | null;
    annualFee?: number;
    joiningFee?: number;
  };
  benefits?: {
    category: string;
    title: string;
    description: string;
    terms?: string | null;
    valueEstimate?: number;
  }[];
  rewardStructure?: {
    pointName: string;
    earnRate: string;
    earnDescription?: string | null;
  };
  redemptionOptions?: {
    name: string;
    type: string;
    conversionRate: number;
    minPoints?: number;
    description?: string | null;
  }[];
  transferPartners?: {
    partnerName: string;
    partnerType: string;
    transferRatio: string;
    transferFee?: number;
    transferTime?: string | null;
  }[];
  offers?: {
    title: string;
    merchant?: string | null;
    discountType?: string | null;
    discountValue?: string | null;
    validTo?: string | null;
    terms?: string | null;
  }[];
}

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

    const data: ExtractedPayload = JSON.parse(job.extractedData);
    const upserted: string[] = [];

    if (data.card) {
      let bank = await prisma.bank.findFirst({
        where: { name: { contains: data.card.bank.split(" ")[0] } },
      });

      if (!bank) {
        const code = data.card.bank.replace(/\s+bank$/i, "").replace(/\s+/g, "").toUpperCase().slice(0, 10);
        bank = await prisma.bank.create({
          data: { name: data.card.bank, code },
        });
        upserted.push(`Created bank: ${bank.name}`);
      }

      const existing = await prisma.card.findFirst({
        where: { name: data.card.name, bankId: bank.id },
      });

      let cardId: string;

      if (existing) {
        await prisma.card.update({
          where: { id: existing.id },
          data: {
            network: data.card.network,
            cardType: data.card.cardType ?? "credit",
            tier: data.card.tier,
            annualFee: data.card.annualFee ?? 0,
            joiningFee: data.card.joiningFee ?? 0,
          },
        });
        cardId = existing.id;
        upserted.push(`Updated card: ${existing.name}`);
      } else {
        const newCard = await prisma.card.create({
          data: {
            bankId: bank.id,
            name: data.card.name,
            network: data.card.network,
            cardType: data.card.cardType ?? "credit",
            tier: data.card.tier,
            annualFee: data.card.annualFee ?? 0,
            joiningFee: data.card.joiningFee ?? 0,
            estimatedAnnualValue: 0,
            color: "#6366f1",
          },
        });
        cardId = newCard.id;
        upserted.push(`Created card: ${data.card.name}`);
      }

      if (data.benefits && data.benefits.length > 0) {
        for (const b of data.benefits) {
          await prisma.benefit.create({
            data: {
              cardId,
              category: b.category,
              title: b.title,
              description: b.description,
              terms: b.terms,
              valueEstimate: b.valueEstimate ?? 0,
            },
          });
        }
        upserted.push(`Added ${data.benefits.length} benefits`);
      }

      if (data.rewardStructure) {
        const prog = await prisma.normalizedProgram.create({
          data: {
            cardId,
            name: `${data.card.name} ${data.rewardStructure.pointName}`,
            pointName: data.rewardStructure.pointName,
            earnRate: data.rewardStructure.earnRate,
            earnDescription: data.rewardStructure.earnDescription,
          },
        });

        if (data.redemptionOptions && data.redemptionOptions.length > 0) {
          for (const r of data.redemptionOptions) {
            await prisma.redemptionOption.create({
              data: {
                programId: prog.id,
                name: r.name,
                type: r.type,
                conversionRate: r.conversionRate,
                minPoints: r.minPoints ?? 0,
                description: r.description,
                estimatedCPP: r.conversionRate,
              },
            });
          }
          upserted.push(`Added ${data.redemptionOptions.length} redemption options`);
        }

        if (data.transferPartners && data.transferPartners.length > 0) {
          for (const tp of data.transferPartners) {
            await prisma.transferPartner.create({
              data: {
                programId: prog.id,
                partnerName: tp.partnerName,
                partnerType: tp.partnerType,
                transferRatio: tp.transferRatio,
                transferFee: tp.transferFee ?? 0,
                transferTime: tp.transferTime,
              },
            });
          }
          upserted.push(`Added ${data.transferPartners.length} transfer partners`);
        }

        upserted.push(`Created reward program: ${prog.name}`);
      }

      if (data.offers && data.offers.length > 0) {
        for (const o of data.offers) {
          await prisma.offer.create({
            data: {
              cardId,
              title: o.title,
              merchant: o.merchant,
              discountType: o.discountType,
              discountValue: o.discountValue,
              validTo: o.validTo ? new Date(o.validTo) : null,
              terms: o.terms,
            },
          });
        }
        upserted.push(`Added ${data.offers.length} offers`);
      }
    }

    await prisma.extractionJob.update({
      where: { id },
      data: { status: "approved" },
    });

    return NextResponse.json({
      success: true,
      message: "Extraction approved and data upserted to normalized tables",
      upserted,
    });
  } catch (error) {
    return NextResponse.json({ error: "Approval failed", details: String(error) }, { status: 500 });
  }
}
