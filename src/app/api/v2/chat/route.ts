import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HumanMessage } from "@langchain/core/messages";
import { createCardDiscoveryAgent } from "@/lib/agents/v2/card-discovery";
import { createRewardOptimizationAgent } from "@/lib/agents/v2/reward-optimization";
import { createOfferDiscoveryAgent } from "@/lib/agents/v2/offer-discovery";
import { createPortfolioAdvisorAgent } from "@/lib/agents/v2/portfolio-advisor";

type AgentType = "card_discovery" | "reward_optimization" | "offer_discovery" | "portfolio_advisor";

function detectIntent(message: string): AgentType {
  const lower = message.toLowerCase();

  // Portfolio/holistic queries
  if (
    lower.includes("portfolio") ||
    lower.includes("all my cards") ||
    lower.includes("review my") ||
    lower.includes("card portfolio") ||
    lower.includes("optimize my") ||
    lower.includes("which card should i") ||
    lower.includes("downgrade") ||
    lower.includes("cancel") ||
    lower.includes("overall")
  ) {
    return "portfolio_advisor";
  }

  // Reward/points/redemption queries
  if (
    lower.includes("redeem") ||
    lower.includes("points") ||
    lower.includes("miles") ||
    lower.includes("transfer partner") ||
    lower.includes("best value") ||
    lower.includes("cashback") ||
    lower.includes("how to use my") ||
    lower.includes("reward") ||
    lower.includes("convert")
  ) {
    return "reward_optimization";
  }

  // Offer queries
  if (
    lower.includes("offer") ||
    lower.includes("deal") ||
    lower.includes("discount") ||
    lower.includes("sale") ||
    lower.includes("coupon") ||
    lower.includes("promo") ||
    lower.includes("merchant")
  ) {
    return "offer_discovery";
  }

  // Default: card discovery (find/compare/analyze cards)
  return "card_discovery";
}

function getAgent(intent: AgentType) {
  switch (intent) {
    case "card_discovery":
      return createCardDiscoveryAgent();
    case "reward_optimization":
      return createRewardOptimizationAgent();
    case "offer_discovery":
      return createOfferDiscoveryAgent();
    case "portfolio_advisor":
      return createPortfolioAdvisorAgent();
  }
}

async function getFallbackResponse(intent: AgentType, message: string, userId: string): Promise<string> {
  const { prisma } = await import("@/lib/prisma");

  const lower = message.toLowerCase();
  const userCards = await prisma.userCard.findMany({
    where: { userId, isActive: true },
    include: { normalizedCard: { include: { bank: true, benefits: true, rewardPrograms: { include: { redemptions: true } } } } },
    take: 10,
  });

  const userRewards = await prisma.userReward.findMany({
    where: { userId },
    include: { program: { include: { card: { include: { bank: true } }, redemptions: true } } },
  });

  switch (intent) {
    case "portfolio_advisor": {
      if (userCards.length === 0) return "You haven't added any cards to your portfolio yet. Go to **My Cards** and onboard a card to get personalized advice.";
      const cards = userCards.filter((c) => c.normalizedCard).map((c) => c.normalizedCard!);
      const totalFees = cards.reduce((s, c) => s + c.annualFee, 0);
      const totalValue = cards.reduce((s, c) => s + c.estimatedAnnualValue, 0);
      const lines = [
        `**Portfolio Summary** (${cards.length} cards)`,
        ...cards.map((c) => `- **${c.name}** (${c.bank.name}) — Fee: ₹${c.annualFee}, Value: ₹${c.estimatedAnnualValue}`),
        `\n**Total Fees:** ₹${totalFees} | **Total Value:** ₹${totalValue} | **Net:** ₹${totalValue - totalFees}`,
      ];
      if (totalFees > totalValue) lines.push("\n⚠️ Your cards cost more than they're worth. Consider downgrading.");
      return lines.join("\n");
    }
    case "reward_optimization": {
      if (userRewards.length === 0) return "No reward balances found. Add your balances on the **Rewards** page to get optimization tips.";
      const lines = ["**Your Reward Balances:**"];
      for (const ur of userRewards) {
        const best = ur.program.redemptions.sort((a, b) => b.conversionRate - a.conversionRate)[0];
        const value = best ? Math.round(ur.balance * best.conversionRate) : 0;
        lines.push(`- **${ur.program.name}**: ${ur.balance.toLocaleString()} ${ur.program.pointName} ≈ ₹${value}`);
        if (best) lines.push(`  Best redemption: ${best.name} (₹${best.conversionRate}/pt)`);
      }
      return lines.join("\n");
    }
    case "offer_discovery": {
      const offers = await prisma.offer.findMany({
        where: { isActive: true, OR: [{ validTo: null }, { validTo: { gte: new Date() } }] },
        include: { card: { include: { bank: true } } },
        take: 10,
        orderBy: { createdAt: "desc" },
      });
      if (offers.length === 0) return "No active offers found at the moment. Check the **Offers** page for updates.";
      const lines = [`**${offers.length} Active Offers:**`];
      for (const o of offers) {
        lines.push(`- **${o.title}** on ${o.card.name} (${o.card.bank.name})${o.merchant ? ` at ${o.merchant}` : ""}`);
      }
      return lines.join("\n");
    }
    case "card_discovery":
    default: {
      if (lower.includes("best") || lower.includes("recommend")) {
        const { getAllBestCards } = await import("@/lib/rewards/best-card");
        const results = await getAllBestCards();
        if (results.length === 0) return "No card recommendations available. The card database may be empty.";
        const lines = ["**Top Card Picks:**"];
        for (const cat of results.slice(0, 3)) {
          lines.push(`\n**${cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}:**`);
          for (const c of cat.cards.slice(0, 2)) {
            lines.push(`- ${c.cardName} (${c.bankName}) — ₹${c.estimatedAnnualValue}/yr value`);
          }
        }
        return lines.join("\n");
      }
      const { searchCards } = await import("@/lib/graph/queries");
      const searchTerms = message.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      const cards = searchTerms.length > 2 ? await searchCards(searchTerms) : [];
      if (cards.length > 0) {
        const lines = [`Found **${cards.length}** matching cards:`];
        for (const c of cards.slice(0, 5)) {
          lines.push(`- **${c.name}** (${c.bank.name}, ${c.network}) — Fee: ₹${c.annualFee}, Value: ₹${c.estimatedAnnualValue}`);
        }
        return lines.join("\n");
      }
      return "I can help you find cards, compare benefits, check offers, and optimize rewards. Try asking:\n- \"Best card for travel\"\n- \"How should I redeem my HDFC points?\"\n- \"What offers are active?\"\n- \"Review my portfolio\"";
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { message, agent: requestedAgent } = body as { message: string; agent?: AgentType };

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const intent = requestedAgent || detectIntent(message);
    const userId = (session.user as { id?: string }).id ?? session.user.email ?? "unknown";

    const hasGroqKey = !!process.env.GROQ_API_KEY;

    if (!hasGroqKey) {
      const content = await getFallbackResponse(intent, message, userId);
      return NextResponse.json({
        response: content,
        agent: intent,
        mode: "fallback",
        messageCount: 1,
      });
    }

    try {
      const agentApp = getAgent(intent);
      const contextMessage = `[User ID: ${userId}]\n${message}`;

      const result = await agentApp.invoke({
        messages: [new HumanMessage(contextMessage)],
      });

      const lastMessage = result.messages[result.messages.length - 1];
      const content = typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

      return NextResponse.json({
        response: content,
        agent: intent,
        mode: "ai",
        messageCount: result.messages.length,
      });
    } catch (agentError) {
      console.error("Agent error, falling back:", agentError);
      const content = await getFallbackResponse(intent, message, userId);
      return NextResponse.json({
        response: content,
        agent: intent,
        mode: "fallback",
        messageCount: 1,
      });
    }
  } catch (error) {
    console.error("POST /api/v2/chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
