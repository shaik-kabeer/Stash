import { StateGraph, MessagesAnnotation, END, START } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, type BaseMessage } from "@langchain/core/messages";
import {
  searchCardsTool,
  getCardGraphTool,
  compareBenefitsTool,
  searchBenefitsTool,
  analyzeCardTool,
} from "./tools";

const SYSTEM_PROMPT = `You are the CardDiscovery Agent for RewardOS, an expert at helping users find the perfect credit card.

You have access to a knowledge graph of Indian credit cards with detailed benefits, reward structures, and offers.

Your capabilities:
- Search cards by name, bank, or features
- Get full card details with benefits, rewards, and offers
- Compare benefits across multiple cards
- Search for specific benefit categories (lounge, travel, fuel, dining, movie, forex, etc.)
- Analyze a card's value proposition vs peers

When helping users:
1. Understand their spending patterns and priorities
2. Search for matching cards
3. Provide detailed comparisons when multiple options exist
4. Give clear recommendations with reasoning
5. Use actual data from the knowledge graph, not assumptions

Always be specific with numbers (fees, values, earn rates). Format responses clearly with card names, key benefits, and why each card fits the user's needs.`;

const tools = [searchCardsTool, getCardGraphTool, compareBenefitsTool, searchBenefitsTool, analyzeCardTool];

function createModel() {
  return new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    apiKey: process.env.GROQ_API_KEY,
  }).bindTools(tools);
}

async function agentNode(state: typeof MessagesAnnotation.State) {
  const model = createModel();
  const systemMessage = new SystemMessage(SYSTEM_PROMPT);
  const response = await model.invoke([systemMessage, ...state.messages]);
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
      results.push({
        role: "tool" as const,
        content: typeof result === "string" ? result : JSON.stringify(result),
        tool_call_id: tc.id,
        name: tc.name,
      });
    }
  }
  return { messages: results };
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = (lastMessage as BaseMessage & { tool_calls?: unknown[] }).tool_calls;
  if (toolCalls && toolCalls.length > 0) return "tools";
  return END;
}

export function createCardDiscoveryAgent() {
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, { tools: "tools", [END]: END })
    .addEdge("tools", "agent");

  return graph.compile();
}
