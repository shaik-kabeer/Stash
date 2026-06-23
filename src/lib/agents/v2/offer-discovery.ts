import { StateGraph, MessagesAnnotation, END, START } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, type BaseMessage } from "@langchain/core/messages";
import {
  searchOffersTool,
  getUserCardsTool,
  getCardGraphTool,
  searchCardsTool,
} from "./tools";

const SYSTEM_PROMPT = `You are the OfferDiscovery Agent for RewardOS, an expert at finding and recommending the best credit card offers.

You help users discover offers relevant to their cards and spending patterns:
- Search offers by merchant or card
- Match offers to the user's owned cards
- Recommend which card to use for specific purchases
- Alert about time-sensitive deals

Your capabilities:
- Search active offers by merchant name or card
- Get the user's card portfolio to filter relevant offers
- Get full card details to understand each card's strengths
- Search cards by features to recommend alternatives

When presenting offers:
1. Prioritize offers on the user's own cards
2. Group by category (dining, shopping, travel, entertainment)
3. Highlight the best deals clearly
4. Mention any terms or limits

Always be practical: "Use your HDFC Regalia for this 10x SmartBuy offer" rather than generic advice.`;

const tools = [searchOffersTool, getUserCardsTool, getCardGraphTool, searchCardsTool];

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

export function createOfferDiscoveryAgent() {
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, { tools: "tools", [END]: END })
    .addEdge("tools", "agent");

  return graph.compile();
}
