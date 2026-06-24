import { prisma } from "@/lib/prisma";

type BenefitRow = {
  category: string;
  title: string;
  description: string;
  terms?: string | null;
  valueEstimate?: number;
};

type RedemptionRow = {
  name: string;
  type: string;
  conversionRate: number;
  minPoints?: number;
  description?: string | null;
};

type TransferRow = {
  partnerName: string;
  partnerType: string;
  transferRatio: string;
  transferFee?: number;
  transferTime?: string | null;
};

type OfferRow = {
  title: string;
  merchant?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  validTo?: string | null;
  terms?: string | null;
};

export interface ExtractedCardPayload {
  card: {
    name: string;
    bank: string;
    network: string;
    cardType?: string;
    tier?: string | null;
    annualFee?: number;
    joiningFee?: number;
  };
  benefits?: BenefitRow[] | { benefits: BenefitRow[] };
  rewardStructure?: {
    pointName: string;
    earnRate: string;
    earnDescription?: string | null;
  };
  redemptionOptions?: RedemptionRow[] | { options: RedemptionRow[] };
  transferPartners?: TransferRow[] | { partners: TransferRow[] };
  offers?: OfferRow[];
}

export interface ExtractedJobPayload {
  pageType?: string;
  card?: ExtractedCardPayload["card"];
  benefits?: ExtractedCardPayload["benefits"];
  rewardStructure?: ExtractedCardPayload["rewardStructure"];
  redemptionOptions?: ExtractedCardPayload["redemptionOptions"];
  transferPartners?: ExtractedCardPayload["transferPartners"];
  offers?: OfferRow[] | { offers: OfferRow[] };
  cards?: ExtractedCardPayload[];
}

function normalizeBenefits(raw: ExtractedCardPayload["benefits"]): BenefitRow[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if ("benefits" in raw && Array.isArray(raw.benefits)) return raw.benefits;
  return [];
}

function normalizeRedemptionOptions(raw: ExtractedCardPayload["redemptionOptions"]): RedemptionRow[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if ("options" in raw && Array.isArray(raw.options)) return raw.options;
  return [];
}

function normalizeTransferPartners(raw: ExtractedCardPayload["transferPartners"]): TransferRow[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if ("partners" in raw && Array.isArray(raw.partners)) return raw.partners;
  return [];
}

function normalizeOffers(raw: ExtractedJobPayload["offers"]): OfferRow[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if ("offers" in raw && Array.isArray(raw.offers)) return raw.offers;
  return [];
}

export function normalizeExtractedJobPayload(raw: ExtractedJobPayload): {
  cards: ExtractedCardPayload[];
  offers: OfferRow[];
} {
  if (raw.cards && raw.cards.length > 0) {
    return {
      cards: raw.cards.map((c) => ({
        ...c,
        benefits: normalizeBenefits(c.benefits),
        redemptionOptions: normalizeRedemptionOptions(c.redemptionOptions),
        transferPartners: normalizeTransferPartners(c.transferPartners),
      })),
      offers: [],
    };
  }

  if (raw.card) {
    return {
      cards: [
        {
          card: raw.card,
          benefits: normalizeBenefits(raw.benefits),
          rewardStructure: raw.rewardStructure,
          redemptionOptions: normalizeRedemptionOptions(raw.redemptionOptions),
          transferPartners: normalizeTransferPartners(raw.transferPartners),
          offers: normalizeOffers(raw.offers),
        },
      ],
      offers: normalizeOffers(raw.offers),
    };
  }

  return { cards: [], offers: normalizeOffers(raw.offers) };
}

export async function upsertExtractedCard(
  data: ExtractedCardPayload,
  upserted: string[],
): Promise<string | null> {
  if (!data.card) return null;

  let bank = await prisma.bank.findFirst({
    where: { name: { contains: data.card.bank.split(" ")[0] } },
  });

  if (!bank) {
    const code = data.card.bank.replace(/\s+bank$/i, "").replace(/\s+/g, "").toUpperCase().slice(0, 10);
    bank = await prisma.bank.create({ data: { name: data.card.bank, code } });
    upserted.push(`Created bank: ${bank.name}`);
  }

  const existing = await prisma.card.findFirst({
    where: { name: data.card.name, bankId: bank.id },
  });

  let cardId: string;
  const benefits = normalizeBenefits(data.benefits);
  const benefitTotalValue = benefits.reduce((sum, b) => sum + (b.valueEstimate ?? 0), 0);

  if (existing) {
    await prisma.card.update({
      where: { id: existing.id },
      data: {
        network: data.card.network,
        cardType: data.card.cardType ?? "credit",
        tier: data.card.tier,
        annualFee: data.card.annualFee ?? 0,
        joiningFee: data.card.joiningFee ?? 0,
        estimatedAnnualValue: benefitTotalValue > 0 ? benefitTotalValue : existing.estimatedAnnualValue,
      },
    });
    cardId = existing.id;
    upserted.push(`Updated card: ${existing.name}`);
    await prisma.benefit.deleteMany({ where: { cardId } });
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
        estimatedAnnualValue: benefitTotalValue,
        color: "#6366f1",
      },
    });
    cardId = newCard.id;
    upserted.push(`Created card: ${data.card.name}`);
  }
  for (const b of benefits) {
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
  if (benefits.length > 0) {
    upserted.push(`Added ${benefits.length} benefits to ${data.card.name}`);
  }

  if (data.rewardStructure) {
    const existingProg = await prisma.normalizedProgram.findFirst({
      where: { cardId, pointName: data.rewardStructure.pointName },
    });

    const prog =
      existingProg ??
      (await prisma.normalizedProgram.create({
        data: {
          cardId,
          name: `${data.card.name} ${data.rewardStructure.pointName}`,
          pointName: data.rewardStructure.pointName,
          earnRate: data.rewardStructure.earnRate,
          earnDescription: data.rewardStructure.earnDescription,
        },
      }));

    if (existingProg) {
      await prisma.redemptionOption.deleteMany({ where: { programId: prog.id } });
      await prisma.transferPartner.deleteMany({ where: { programId: prog.id } });
    }

    const redemptionOptions = normalizeRedemptionOptions(data.redemptionOptions);
    for (const r of redemptionOptions) {
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
    if (redemptionOptions.length > 0) {
      upserted.push(`Added ${redemptionOptions.length} redemption options for ${data.card.name}`);
    }

    const transferPartners = normalizeTransferPartners(data.transferPartners);
    for (const tp of transferPartners) {
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
    if (transferPartners.length > 0) {
      upserted.push(`Added ${transferPartners.length} transfer partners for ${data.card.name}`);
    }

    if (!existingProg) {
      upserted.push(`Created reward program: ${prog.name}`);
    }
  }

  const offers = data.offers ?? [];
  for (const o of offers) {
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
  if (offers.length > 0) {
    upserted.push(`Added ${offers.length} offers to ${data.card.name}`);
  }

  return cardId;
}
