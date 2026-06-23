import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { prisma } from "@/lib/prisma";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

async function getCardCatalogContext() {
  const cards = await prisma.cardProduct.findMany({
    where: { isActive: true },
    select: {
      name: true,
      bank: true,
      network: true,
      annualFee: true,
      joiningFee: true,
      rewardStructure: true,
      cashbackStructure: true,
      loungeAccess: true,
      travelBenefits: true,
      fuelBenefits: true,
      diningBenefits: true,
      movieBenefits: true,
      forexMarkup: true,
      milestoneRewards: true,
      welcomeBenefits: true,
      bestFor: true,
      worstFor: true,
      estimatedAnnualValue: true,
    },
  });

  return cards
    .map(
      (c) =>
        `**${c.name}** (${c.bank}, ${c.network})\n` +
        `Fee: ₹${c.annualFee}/yr | Est Value: ₹${c.estimatedAnnualValue}/yr\n` +
        `Rewards: ${c.rewardStructure}\n` +
        `Cashback: ${c.cashbackStructure}\n` +
        `Lounge: ${c.loungeAccess}\n` +
        `Travel: ${c.travelBenefits}\n` +
        `Fuel: ${c.fuelBenefits}\n` +
        `Dining: ${c.diningBenefits}\n` +
        `Movies: ${c.movieBenefits}\n` +
        `Forex: ${c.forexMarkup}\n` +
        `Milestones: ${c.milestoneRewards}\n` +
        `Welcome: ${c.welcomeBenefits}\n` +
        `Best For: ${c.bestFor}\n` +
        `Not Ideal: ${c.worstFor}`
    )
    .join("\n\n---\n\n");
}

interface UIMessagePart {
  type: string;
  text?: string;
}

interface IncomingMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: UIMessagePart[];
}

function extractTextFromMessage(msg: IncomingMessage): string {
  if (typeof msg.content === "string" && msg.content.length > 0) {
    return msg.content;
  }
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text!)
      .join("");
  }
  return "";
}

function toModelMessages(messages: IncomingMessage[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: extractTextFromMessage(m),
    }))
    .filter((m) => m.content.length > 0);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessages: IncomingMessage[] = body.messages;

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const catalog = await getCardCatalogContext();

    const modelMessages = toModelMessages(rawMessages);

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are CardDNA AI, an expert Indian credit card advisor. You have deep knowledge about credit cards available in India.

Here is your knowledge base of cards we track:

${catalog}

Guidelines:
- Answer questions about specific cards, compare cards, recommend cards based on spending patterns
- Use specific numbers and data from the catalog above
- Format responses with markdown for readability
- If asked about a card not in the catalog, say so honestly and provide general guidance
- Currency is always INR (₹)
- Be concise but thorough. Use bullet points for comparisons
- When recommending, always explain WHY based on the user's stated needs
- For fee analysis, always calculate ROI = (estimated value - annual fee) / annual fee`,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat route error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
