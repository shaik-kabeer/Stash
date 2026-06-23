import { StateGraph, MessagesAnnotation, END, START } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, type BaseMessage } from "@langchain/core/messages";
import {
  getUserCardsTool,
  getPortfolioValueTool,
  getCardGraphTool,
  analyzeCardTool,
  calculateBestRedemptionTool,
  searchOffersTool,
  searchCardsTool,
  searchBenefitsTool,
  listProgramsTool,
} from "./tools";

const SYSTEM_PROMPT = `You are the PortfolioAdvisor Agent for RewardOS — the most comprehensive agent in the system. You act as a personal "Reward CFO" providing holistic advice across a user's entire credit card portfolio.

Your capabilities span ALL other agents:
- Full portfolio analysis: all cards, reward balances, total value
- Individual card deep analysis: fee-to-value, category strengths, peer comparison
- Reward optimization: best redemption paths for each program
- Offer matching: relevant deals for the user's specific cards
- Gap analysis: identify missing benefit categories and recommend new cards

When advising:
1. Start by getting the user's full portfolio (cards + rewards)
2. Analyze each card's value proposition
3. Identify optimization opportunities
4. Consider the portfolio as a whole — are there overlaps or gaps?
5. Make actionable recommendations

Key analysis areas:
- Cards costing more than their value (candidates for downgrade/cancellation)
- Unredeemed rewards losing value (especially with expiry)
- Benefit gaps (e.g., no lounge card, no forex-friendly card)
- Suboptimal card usage (using a low-reward card for a high-spend category)

Always provide specific, actionable advice with numbers. Be the user's trusted financial advisor for their card portfolio.`;

const tools = [
  getUserCardsTool,
  getPortfolioValueTool,
  getCardGraphTool,
  analyzeCardTool,
  calculateBestRedemptionTool,
  searchOffersTool,
  searchCardsTool,
  searchBenefitsTool,
  listProgramsTool,
];

function createModel() {
  return new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0.3, apiKey: process.env.GROQ_API_KEY }).bindTools(tools);
}

async function agentNode(state: typeof MessagesAnnotation.State) {
  const model = createModel();
  const response = await model.invoke([new SystemMessage(SYSTEM_PROMPT), ...state.messages]);
  return { messages: [response] };
}

async function toolNode(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = (lastMessage as BaseMessage & { tool_calls?: Array<{ name: string; args: Record<string, unknown>; id: string }> }).tool_calls ?? [];

  const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));
  const results = [];
  for (const tc of toolCalls) {
    const matchedTool = toolMap[tc.name];
    if (matchedTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (matchedTool as any).invoke(tc.args);
      results.push({ role: "tool" as const, content: typeof result === "string" ? result : JSON.stringify(result), tool_call_id: tc.id, name: tc.name });
    }
  }
  return { messages: results };
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = (lastMessage as BaseMessage & { tool_calls?: unknown[] }).tool_calls;
  return toolCalls && toolCalls.length > 0 ? "tools" : END;
}

export function createPortfolioAdvisorAgent() {
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, { tools: "tools", [END]: END })
    .addEdge("tools", "agent");

  return graph.compile();
}
