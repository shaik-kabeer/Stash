import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  searchCards,
  getCardWithFullGraph,
  compareBenefits,
  searchByBenefit,
  getActiveOffers,
  getRewardProgramFull,
  getAllRewardPrograms,
  getPortfolioCards,
  getUserRewards,
  getTransferPartnerReach,
} from "@/lib/graph/queries";
import { optimizeRedemption } from "@/lib/rewards/optimizer";
import { valuatePortfolio } from "@/lib/rewards/valuator";
import { analyzeCard } from "@/lib/cards/card-analyzer";

export const searchCardsTool = tool(
  async ({ query }) => {
    const results = await searchCards(query);
    return JSON.stringify(
      results.map((c) => ({
        id: c.id,
        name: c.name,
        bank: c.bank.name,
        network: c.network,
        annualFee: c.annualFee,
        tier: c.tier,
        estimatedAnnualValue: c.estimatedAnnualValue,
        bestFor: c.bestFor,
        benefitCount: c.benefits.length,
        offerCount: c.offers.length,
      })),
    );
  },
  {
    name: "search_cards",
    description: "Search credit cards by name, bank, or features. Returns matching cards with basic info.",
    schema: z.object({ query: z.string().describe("Search query: card name, bank, or feature") }),
  },
);

export const getCardGraphTool = tool(
  async ({ cardId }) => {
    const card = await getCardWithFullGraph(cardId);
    if (!card) return JSON.stringify({ error: "Card not found" });
    return JSON.stringify({
      id: card.id,
      name: card.name,
      bank: card.bank.name,
      network: card.network,
      annualFee: card.annualFee,
      joiningFee: card.joiningFee,
      tier: card.tier,
      bestFor: card.bestFor,
      estimatedAnnualValue: card.estimatedAnnualValue,
      benefits: card.benefits.map((b) => ({ category: b.category, title: b.title, description: b.description, value: b.valueEstimate })),
      programs: card.rewardPrograms.map((p) => ({
        name: p.name,
        pointName: p.pointName,
        earnRate: p.earnRate,
        redemptions: p.redemptions.map((r) => ({ name: r.name, type: r.type, rate: r.conversionRate, cpp: r.estimatedCPP })),
        transferPartners: p.transferPartners.map((t) => ({ name: t.partnerName, type: t.partnerType, ratio: t.transferRatio })),
      })),
      offers: card.offers.map((o) => ({ title: o.title, merchant: o.merchant, discount: o.discountValue })),
    });
  },
  {
    name: "get_card_graph",
    description: "Get full card details: benefits, reward programs, redemption options, transfer partners, offers.",
    schema: z.object({ cardId: z.string().describe("Card ID") }),
  },
);

export const compareBenefitsTool = tool(
  async ({ cardIds, category }) => {
    const results = await compareBenefits(cardIds, category ?? undefined);
    return JSON.stringify(
      results.map((b) => ({
        card: b.card.name,
        bank: b.card.bank?.name,
        category: b.category,
        title: b.title,
        description: b.description,
        value: b.valueEstimate,
      })),
    );
  },
  {
    name: "compare_benefits",
    description: "Compare benefits across multiple cards, optionally filtered by category.",
    schema: z.object({
      cardIds: z.array(z.string()).describe("Array of card IDs to compare"),
      category: z.string().nullable().optional().describe("Filter by category: lounge, travel, fuel, dining, movie, golf, forex, etc."),
    }),
  },
);

export const searchBenefitsTool = tool(
  async ({ category, keyword }) => {
    const results = await searchByBenefit(category ?? undefined, keyword ?? undefined);
    return JSON.stringify(
      results.slice(0, 15).map((b) => ({
        card: b.card.name,
        bank: b.card.bank?.name,
        category: b.category,
        title: b.title,
        description: b.description,
        value: b.valueEstimate,
      })),
    );
  },
  {
    name: "search_benefits",
    description: "Search for cards with specific benefits. Filter by category (lounge, travel, fuel, etc.) and/or keyword.",
    schema: z.object({
      category: z.string().nullable().optional().describe("Benefit category"),
      keyword: z.string().nullable().optional().describe("Keyword to search in benefit title/description"),
    }),
  },
);

export const getRedemptionOptionsTool = tool(
  async ({ programId }) => {
    const program = await getRewardProgramFull(programId);
    if (!program) return JSON.stringify({ error: "Program not found" });
    return JSON.stringify({
      name: program.name,
      pointName: program.pointName,
      earnRate: program.earnRate,
      card: program.card.name,
      redemptions: program.redemptions.map((r) => ({
        name: r.name,
        type: r.type,
        rate: r.conversionRate,
        minPoints: r.minPoints,
        cpp: r.estimatedCPP,
        description: r.description,
      })),
    });
  },
  {
    name: "get_redemption_options",
    description: "Get all redemption options for a reward program with conversion rates.",
    schema: z.object({ programId: z.string().describe("Reward program ID") }),
  },
);

export const getTransferPartnersTool = tool(
  async ({ programId }) => {
    const program = await getRewardProgramFull(programId);
    if (!program) return JSON.stringify({ error: "Program not found" });
    return JSON.stringify(
      program.transferPartners.map((t) => ({
        name: t.partnerName,
        type: t.partnerType,
        ratio: t.transferRatio,
        fee: t.transferFee,
        time: t.transferTime,
      })),
    );
  },
  {
    name: "get_transfer_partners",
    description: "Get transfer partners for a reward program.",
    schema: z.object({ programId: z.string().describe("Reward program ID") }),
  },
);

export const calculateBestRedemptionTool = tool(
  async ({ programId, balance }) => {
    const result = await optimizeRedemption(programId, balance);
    if (!result) return JSON.stringify({ error: "Program not found" });
    return JSON.stringify(result);
  },
  {
    name: "calculate_best_redemption",
    description: "Calculate the best redemption strategy for a given reward balance.",
    schema: z.object({
      programId: z.string().describe("Reward program ID"),
      balance: z.number().describe("Current points balance"),
    }),
  },
);

export const searchOffersTool = tool(
  async ({ merchant, cardId }) => {
    const offers = await getActiveOffers({ merchant: merchant ?? undefined, cardId: cardId ?? undefined });
    return JSON.stringify(
      offers.map((o) => ({
        title: o.title,
        card: o.card.name,
        bank: o.card.bank?.name,
        merchant: o.merchant,
        discountType: o.discountType,
        discountValue: o.discountValue,
        terms: o.terms,
      })),
    );
  },
  {
    name: "search_offers",
    description: "Search active offers. Filter by merchant name and/or card ID.",
    schema: z.object({
      merchant: z.string().nullable().optional().describe("Filter by merchant name"),
      cardId: z.string().nullable().optional().describe("Filter by card ID"),
    }),
  },
);

export const getUserCardsTool = tool(
  async ({ userId }) => {
    const cards = await getPortfolioCards(userId);
    return JSON.stringify(
      cards.map((uc) => ({
        id: uc.id,
        cardName: uc.normalizedCard?.name ?? uc.productName ?? "Unknown",
        bank: uc.normalizedCard?.bank.name ?? uc.bank ?? "Unknown",
        normalizedCardId: uc.normalizedCard?.id,
        confidence: uc.confidence,
      })),
    );
  },
  {
    name: "get_user_cards",
    description: "Get all cards in a user's portfolio.",
    schema: z.object({ userId: z.string().describe("User ID") }),
  },
);

export const getPortfolioValueTool = tool(
  async ({ userId }) => {
    const valuation = await valuatePortfolio(userId);
    return JSON.stringify(valuation);
  },
  {
    name: "get_portfolio_value",
    description: "Get full portfolio valuation including all cards, rewards, and optimization insights.",
    schema: z.object({ userId: z.string().describe("User ID") }),
  },
);

export const analyzeCardTool = tool(
  async ({ cardId }) => {
    const analysis = await analyzeCard(cardId);
    if (!analysis) return JSON.stringify({ error: "Card not found" });
    return JSON.stringify({
      card: analysis.card.name,
      bank: analysis.card.bank.name,
      feeToValueRatio: analysis.feeToValueRatio,
      valueVerdict: analysis.valueVerdict,
      categoryStrengths: analysis.categoryStrengths,
      peerComparison: analysis.peerComparison,
      summary: analysis.summary,
    });
  },
  {
    name: "analyze_card",
    description: "Deep analysis of a card: fee-to-value ratio, category strengths, peer comparison.",
    schema: z.object({ cardId: z.string().describe("Card ID to analyze") }),
  },
);

export const listProgramsTool = tool(
  async () => {
    const programs = await getAllRewardPrograms();
    return JSON.stringify(
      programs.map((p) => ({
        id: p.id,
        name: p.name,
        pointName: p.pointName,
        earnRate: p.earnRate,
        card: p.card.name,
        bank: p.card.bank?.name,
        redemptionCount: p.redemptions.length,
        transferPartnerCount: p.transferPartners.length,
      })),
    );
  },
  {
    name: "list_programs",
    description: "List all reward programs with their basic info.",
    schema: z.object({}),
  },
);

export const getPartnerReachTool = tool(
  async ({ partnerName }) => {
    const results = await getTransferPartnerReach(partnerName);
    return JSON.stringify(
      results.map((t) => ({
        partner: t.partnerName,
        type: t.partnerType,
        ratio: t.transferRatio,
        program: t.program.name,
        card: t.program.card.name,
        bank: t.program.card.bank?.name,
      })),
    );
  },
  {
    name: "get_partner_reach",
    description: "Find all reward programs that can transfer to a specific loyalty partner (airline/hotel).",
    schema: z.object({ partnerName: z.string().describe("Partner name like 'InterMiles' or 'Marriott'") }),
  },
);
