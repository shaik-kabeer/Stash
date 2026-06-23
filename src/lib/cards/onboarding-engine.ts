import { prisma } from "@/lib/prisma";
import { findCardByBIN, getCardWithFullGraph, type CardWithFullGraph } from "@/lib/graph/queries";

// ── Types ────────────────────────────────────────────────────────

export interface OnboardingInput {
  cardNumber: string;
  nickname?: string;
  userId: string;
}

export interface PipelineStep {
  step: string;
  status: "success" | "partial" | "skipped" | "failed";
  data: Record<string, unknown>;
  durationMs: number;
}

export interface OnboardingResult {
  success: boolean;
  confidence: "exact" | "probable" | "unknown";
  confidenceScore: number;
  userCard: {
    id: string;
    bank: string | null;
    network: string | null;
    cardType: string | null;
    tier: string | null;
    country: string | null;
    productName: string | null;
    cardProductId: string | null;
    rewardProgramId: string | null;
    rewardProgramName: string | null;
  } | null;
  normalizedCard?: CardWithFullGraph | null;
  pipeline: PipelineStep[];
  error?: string;
}

interface ExternalBINData {
  bin?: string;
  scheme?: string;
  type?: string;
  card_tier?: string;
  issuer?: string;
  country_a2?: string;
  country_name?: string;
}

// ── Engine ───────────────────────────────────────────────────────

export async function runOnboardingEngine(input: OnboardingInput): Promise<OnboardingResult> {
  const pipeline: PipelineStep[] = [];
  const digits = input.cardNumber.replace(/\D/g, "");

  if (digits.length < 6) {
    return { success: false, confidence: "unknown", confidenceScore: 0, userCard: null, pipeline, error: "At least 6 digits required" };
  }

  const bin6 = digits.slice(0, 6);
  const bin8 = digits.length >= 8 ? digits.slice(0, 8) : null;
  const last4 = digits.length >= 10 ? digits.slice(-4) : null;

  let bank: string | null = null;
  let network: string | null = null;
  let cardType: string | null = null;
  let tier: string | null = null;
  let country: string | null = null;
  let cardProductId: string | null = null;
  let productName: string | null = null;
  let rewardProgramId: string | null = null;
  let rewardProgramName: string | null = null;
  let confidence: "exact" | "probable" | "unknown" = "unknown";
  let confidenceScore = 0;

  // ── Step 1: BIN Lookup (local DB) ─────────────────────────────

  const t1 = Date.now();
  let localMatch = await prisma.cardBIN.findUnique({
    where: { bin: bin6 },
    include: { cardProduct: true },
  });
  if (!localMatch && bin8) {
    localMatch = await prisma.cardBIN.findUnique({
      where: { bin: bin8 },
      include: { cardProduct: true },
    });
  }

  if (localMatch) {
    bank = localMatch.bank;
    network = localMatch.network;
    cardType = localMatch.type;
    tier = localMatch.tier;
    country = localMatch.country;
    pipeline.push({ step: "BIN Lookup (Local)", status: "success", data: { bin: bin6, bank, network, type: cardType, tier }, durationMs: Date.now() - t1 });
  } else {
    pipeline.push({ step: "BIN Lookup (Local)", status: "skipped", data: { bin: bin6, reason: "Not in local database" }, durationMs: Date.now() - t1 });
  }

  // ── Step 1b: Normalized Graph BIN Lookup ─────────────────────

  const t1b = Date.now();
  let normalizedCard: CardWithFullGraph | null = null;
  let normalizedCardId: string | null = null;

  normalizedCard = await findCardByBIN(bin6);
  if (!normalizedCard && bin8) {
    normalizedCard = await findCardByBIN(bin8);
  }

  if (normalizedCard) {
    normalizedCardId = normalizedCard.id;
    if (!bank) bank = normalizedCard.bank.name;
    if (!network) network = normalizedCard.network;
    if (!cardType) cardType = normalizedCard.cardType;
    if (!tier) tier = normalizedCard.tier;
    if (!productName) productName = normalizedCard.name;
    confidence = "exact";
    confidenceScore = 1.0;
    pipeline.push({
      step: "Normalized Graph Lookup",
      status: "success",
      data: {
        cardId: normalizedCard.id,
        name: normalizedCard.name,
        bank: normalizedCard.bank.name,
        benefits: normalizedCard.benefits.length,
        programs: normalizedCard.rewardPrograms.length,
        offers: normalizedCard.offers.length,
      },
      durationMs: Date.now() - t1b,
    });
  } else {
    pipeline.push({
      step: "Normalized Graph Lookup",
      status: "skipped",
      data: { reason: "BIN not in normalized graph" },
      durationMs: Date.now() - t1b,
    });
  }

  // ── Step 2: BIN Lookup (External API) ─────────────────────────

  const t2 = Date.now();
  let externalData: ExternalBINData | null = null;
  try {
    const res = await fetch(`https://binlist.wellcart.pk/api/lookup/${bin6}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      externalData = (await res.json()) as ExternalBINData;
      if (!bank && externalData.issuer) bank = externalData.issuer;
      if (!network && externalData.scheme) network = externalData.scheme;
      if (!cardType && externalData.type) cardType = externalData.type;
      if (!tier && externalData.card_tier) tier = externalData.card_tier;
      if (!country && externalData.country_a2) country = externalData.country_a2;
      pipeline.push({
        step: "BIN Lookup (External)",
        status: "success",
        data: { issuer: externalData.issuer, scheme: externalData.scheme, type: externalData.type, tier: externalData.card_tier, country: externalData.country_a2, countryName: externalData.country_name },
        durationMs: Date.now() - t2,
      });
    } else {
      pipeline.push({ step: "BIN Lookup (External)", status: "failed", data: { httpStatus: res.status }, durationMs: Date.now() - t2 });
    }
  } catch {
    pipeline.push({ step: "BIN Lookup (External)", status: "failed", data: { reason: "Network timeout or error" }, durationMs: Date.now() - t2 });
  }

  // ── Step 3: Network Identification ────────────────────────────

  const t3 = Date.now();
  const normalizedNetwork = normalizeNetwork(network, digits);
  if (normalizedNetwork) {
    network = normalizedNetwork;
    pipeline.push({ step: "Network Identification", status: "success", data: { network: normalizedNetwork }, durationMs: Date.now() - t3 });
  } else {
    pipeline.push({ step: "Network Identification", status: "failed", data: { raw: network }, durationMs: Date.now() - t3 });
  }

  // ── Step 4: Bank Identification ───────────────────────────────

  const t4 = Date.now();
  const normalizedBank = normalizeBank(bank);
  if (normalizedBank) {
    pipeline.push({ step: "Bank Identification", status: bank !== normalizedBank ? "success" : "success", data: { raw: bank, normalized: normalizedBank }, durationMs: Date.now() - t4 });
    bank = normalizedBank;
  } else if (bank) {
    pipeline.push({ step: "Bank Identification", status: "partial", data: { raw: bank, note: "Could not normalize to known bank" }, durationMs: Date.now() - t4 });
  } else {
    pipeline.push({ step: "Bank Identification", status: "failed", data: { reason: "No bank information available" }, durationMs: Date.now() - t4 });
  }

  // ── Step 5: Card Catalog Matching ─────────────────────────────

  const t5 = Date.now();
  if (localMatch?.cardProduct) {
    cardProductId = localMatch.cardProduct.id;
    productName = localMatch.cardProduct.name;
    confidence = "exact";
    confidenceScore = 1.0;
    pipeline.push({ step: "Card Catalog Matching", status: "success", data: { match: "exact", productId: cardProductId, productName }, durationMs: Date.now() - t5 });
  } else if (bank) {
    const fuzzy = await prisma.cardProduct.findMany({
      where: { bank: { contains: bank.split(" ")[0] } },
      select: { id: true, name: true, bank: true, network: true },
    });

    if (fuzzy.length === 1) {
      cardProductId = fuzzy[0].id;
      productName = fuzzy[0].name;
      confidence = "probable";
      confidenceScore = 0.6;
      pipeline.push({ step: "Card Catalog Matching", status: "partial", data: { match: "single_bank_match", productId: cardProductId, productName, candidates: 1 }, durationMs: Date.now() - t5 });
    } else if (fuzzy.length > 1) {
      // Try narrowing by network
      const networkFiltered = fuzzy.filter((f) => f.network.toLowerCase() === (network ?? "").toLowerCase());
      if (networkFiltered.length === 1) {
        cardProductId = networkFiltered[0].id;
        productName = networkFiltered[0].name;
        confidence = "probable";
        confidenceScore = 0.7;
        pipeline.push({ step: "Card Catalog Matching", status: "partial", data: { match: "bank+network_narrowed", productId: cardProductId, productName, candidates: fuzzy.length }, durationMs: Date.now() - t5 });
      } else {
        confidence = "probable";
        confidenceScore = 0.3;
        pipeline.push({ step: "Card Catalog Matching", status: "partial", data: { match: "multiple_candidates", candidates: fuzzy.map((f) => ({ id: f.id, name: f.name })) }, durationMs: Date.now() - t5 });
      }
    } else {
      pipeline.push({ step: "Card Catalog Matching", status: "skipped", data: { reason: "No cards from this bank in catalog" }, durationMs: Date.now() - t5 });
    }
  } else {
    pipeline.push({ step: "Card Catalog Matching", status: "skipped", data: { reason: "No bank info to match against" }, durationMs: Date.now() - t5 });
  }

  // ── Step 6: Reward Program Mapping ────────────────────────────

  const t6 = Date.now();
  if (bank) {
    const program = await prisma.rewardProgram.findFirst({
      where: {
        OR: [
          { provider: { contains: bank.split(" ")[0] } },
          { name: { contains: bank.split(" ")[0] } },
        ],
        isActive: true,
      },
      select: { id: true, name: true },
    });

    if (program) {
      rewardProgramId = program.id;
      rewardProgramName = program.name;
      if (confidenceScore > 0) confidenceScore = Math.min(confidenceScore + 0.1, 1.0);
      pipeline.push({ step: "Reward Program Mapping", status: "success", data: { programId: program.id, programName: program.name }, durationMs: Date.now() - t6 });
    } else {
      pipeline.push({ step: "Reward Program Mapping", status: "skipped", data: { reason: `No reward program found for bank: ${bank}` }, durationMs: Date.now() - t6 });
    }
  } else {
    pipeline.push({ step: "Reward Program Mapping", status: "skipped", data: { reason: "No bank info for program lookup" }, durationMs: Date.now() - t6 });
  }

  // ── Step 7: Create / Update UserCard ──────────────────────────

  const t7 = Date.now();
  try {
    const matchSource = normalizedCard ? "normalized_graph" : localMatch ? (externalData ? "local+external" : "local") : externalData ? "external" : null;

    const userCard = await prisma.userCard.upsert({
      where: { userId_inputBIN: { userId: input.userId, inputBIN: bin6 } },
      create: {
        userId: input.userId,
        inputBIN: bin6,
        last4,
        nickname: input.nickname || productName || `${bank ?? "Unknown"} Card`,
        bank,
        network,
        cardType,
        tier,
        country,
        productName,
        cardProductId,
        cardId: normalizedCardId,
        confidence,
        confidenceScore,
        matchSource,
        rewardProgramId,
        pipelineLog: JSON.stringify(pipeline),
      },
      update: {
        last4,
        nickname: input.nickname || productName || `${bank ?? "Unknown"} Card`,
        bank,
        network,
        cardType,
        tier,
        country,
        productName,
        cardProductId,
        cardId: normalizedCardId,
        confidence,
        confidenceScore,
        matchSource,
        rewardProgramId,
        pipelineLog: JSON.stringify(pipeline),
      },
    });

    pipeline.push({ step: "Card Profile Created", status: "success", data: { userCardId: userCard.id }, durationMs: Date.now() - t7 });

    // If normalized card was found, load full graph if not already loaded
    if (normalizedCardId && !normalizedCard) {
      normalizedCard = await getCardWithFullGraph(normalizedCardId);
    }

    return {
      success: true,
      confidence,
      confidenceScore,
      userCard: {
        id: userCard.id,
        bank,
        network,
        cardType,
        tier,
        country,
        productName,
        cardProductId,
        rewardProgramId,
        rewardProgramName,
      },
      normalizedCard,
      pipeline,
    };
  } catch (error) {
    pipeline.push({ step: "Card Profile Created", status: "failed", data: { error: String(error) }, durationMs: Date.now() - t7 });
    return { success: false, confidence, confidenceScore, userCard: null, pipeline, error: "Failed to create card profile" };
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function normalizeNetwork(raw: string | null, digits: string): string | null {
  if (!raw && digits.length > 0) {
    const first = digits[0];
    if (first === "4") return "Visa";
    if (first === "5" || first === "2") return "Mastercard";
    if (first === "3") return digits[1] === "7" ? "Amex" : "Diners Club";
    if (first === "6") return "RuPay";
    return null;
  }
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper.includes("VISA")) return "Visa";
  if (upper.includes("MASTER")) return "Mastercard";
  if (upper.includes("AMEX") || upper.includes("AMERICAN")) return "Amex";
  if (upper.includes("RUPAY")) return "RuPay";
  if (upper.includes("DINERS")) return "Diners Club";
  if (upper.includes("DISCOVER")) return "Discover";
  if (upper.includes("JCB")) return "JCB";
  return raw;
}

const BANK_ALIASES: Record<string, string> = {
  "HDFC": "HDFC Bank",
  "ICICI": "ICICI Bank",
  "SBI": "SBI Card",
  "AXIS": "Axis Bank",
  "KOTAK": "Kotak Mahindra Bank",
  "IDFC": "IDFC FIRST Bank",
  "AU": "AU Small Finance Bank",
  "YES": "YES Bank",
  "INDUSIND": "IndusInd Bank",
  "RBL": "RBL Bank",
  "BOB": "Bank of Baroda",
  "PNB": "Punjab National Bank",
  "CITI": "Citibank",
  "HSBC": "HSBC",
  "STANDARD": "Standard Chartered",
  "FEDERAL": "Federal Bank",
  "CANARA": "Canara Bank",
  "UNION": "Union Bank",
  "BANDHAN": "Bandhan Bank",
};

function normalizeBank(raw: string | null): string | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  for (const [key, value] of Object.entries(BANK_ALIASES)) {
    if (upper.includes(key)) return value;
  }
  return raw;
}
