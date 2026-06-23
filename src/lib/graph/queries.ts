import { prisma } from "@/lib/prisma";

// Full include tree reused across queries
const fullCardInclude = {
  bank: true,
  benefits: { where: { isActive: true } },
  rewardPrograms: {
    include: {
      redemptions: { where: { isActive: true } },
      transferPartners: { where: { isActive: true } },
    },
  },
  offers: { where: { isActive: true } },
  bins: true,
} as const;

export type CardWithFullGraph = NonNullable<Awaited<ReturnType<typeof getCardWithFullGraph>>>;
export type BankWithCards = NonNullable<Awaited<ReturnType<typeof getBankCards>>>;
export type ProgramFull = NonNullable<Awaited<ReturnType<typeof getRewardProgramFull>>>;

export async function getCardWithFullGraph(cardId: string) {
  return prisma.card.findUnique({
    where: { id: cardId },
    include: fullCardInclude,
  });
}

export async function getAllCards(filters?: {
  bankId?: string;
  network?: string;
  cardType?: string;
  tier?: string;
  maxAnnualFee?: number;
}) {
  return prisma.card.findMany({
    where: {
      isActive: true,
      ...(filters?.bankId && { bankId: filters.bankId }),
      ...(filters?.network && { network: { equals: filters.network } }),
      ...(filters?.cardType && { cardType: filters.cardType }),
      ...(filters?.tier && { tier: filters.tier }),
      ...(filters?.maxAnnualFee !== undefined && { annualFee: { lte: filters.maxAnnualFee } }),
    },
    include: fullCardInclude,
    orderBy: { estimatedAnnualValue: "desc" },
  });
}

export async function getBankCards(bankId: string) {
  return prisma.bank.findUnique({
    where: { id: bankId },
    include: {
      cards: {
        where: { isActive: true },
        include: fullCardInclude,
        orderBy: { estimatedAnnualValue: "desc" },
      },
    },
  });
}

export async function getAllBanks() {
  return prisma.bank.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { cards: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRewardProgramFull(programId: string) {
  return prisma.normalizedProgram.findUnique({
    where: { id: programId },
    include: {
      card: { include: { bank: true } },
      redemptions: { where: { isActive: true }, orderBy: { estimatedCPP: "desc" } },
      transferPartners: { where: { isActive: true } },
    },
  });
}

export async function getAllRewardPrograms() {
  return prisma.normalizedProgram.findMany({
    where: { isActive: true },
    include: {
      card: { include: { bank: true } },
      redemptions: { where: { isActive: true } },
      transferPartners: { where: { isActive: true } },
    },
  });
}

export async function searchByBenefit(category?: string, keyword?: string) {
  return prisma.benefit.findMany({
    where: {
      isActive: true,
      ...(category && { category }),
      ...(keyword && {
        OR: [
          { title: { contains: keyword } },
          { description: { contains: keyword } },
        ],
      }),
    },
    include: {
      card: { include: { bank: true } },
    },
    orderBy: { valueEstimate: "desc" },
  });
}

export async function getTransferPartnerReach(partnerName: string) {
  return prisma.transferPartner.findMany({
    where: {
      partnerName: { contains: partnerName },
      isActive: true,
    },
    include: {
      program: {
        include: {
          card: { include: { bank: true } },
        },
      },
    },
  });
}

export async function getActiveOffers(filters?: { cardId?: string; merchant?: string }) {
  const now = new Date();
  return prisma.offer.findMany({
    where: {
      isActive: true,
      ...(filters?.cardId && { cardId: filters.cardId }),
      ...(filters?.merchant && { merchant: { contains: filters.merchant } }),
      OR: [
        { validTo: null },
        { validTo: { gte: now } },
      ],
    },
    include: {
      card: { include: { bank: true } },
    },
  });
}

export async function findCardByBIN(bin: string) {
  const record = await prisma.cardBIN2.findUnique({
    where: { bin },
    include: {
      card: { include: fullCardInclude },
    },
  });
  return record?.card ?? null;
}

export async function searchCards(query: string) {
  return prisma.card.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query } },
        { bestFor: { contains: query } },
        { bank: { name: { contains: query } } },
      ],
    },
    include: fullCardInclude,
    take: 20,
  });
}

export async function compareBenefits(cardIds: string[], category?: string) {
  return prisma.benefit.findMany({
    where: {
      cardId: { in: cardIds },
      isActive: true,
      ...(category && { category }),
    },
    include: {
      card: { select: { id: true, name: true, bank: { select: { name: true } } } },
    },
    orderBy: { valueEstimate: "desc" },
  });
}

export async function getPortfolioCards(userId: string) {
  return prisma.userCard.findMany({
    where: { userId, isActive: true },
    include: {
      normalizedCard: {
        include: fullCardInclude,
      },
      cardProduct: true,
    },
  });
}

export async function getUserRewards(userId: string) {
  return prisma.userReward.findMany({
    where: { userId },
    include: {
      program: {
        include: {
          redemptions: { where: { isActive: true }, orderBy: { estimatedCPP: "desc" } },
          transferPartners: { where: { isActive: true } },
          card: { select: { id: true, name: true, bank: { select: { name: true } } } },
        },
      },
    },
  });
}
