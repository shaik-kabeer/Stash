import { StateGraph, MessagesAnnotation, END, START } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, type BaseMessage } from "@langchain/core/messages";
import {
  getRedemptionOptionsTool,
  getTransferPartnersTool,
  calculateBestRedemptionTool,
  listProgramsTool,
  getPartnerReachTool,
  getCardGraphTool,
} from "./tools";

const SYSTEM_PROMPT = `You are the RewardOptimization Agent for RewardOS, a specialist in maximizing the value of credit card reward points.

You help users get the most value from their points/miles/cashback by:
- Finding the best redemption options for their reward balance
- Comparing direct redemptions vs transfer partner options
- Calculating value per point for different strategies
- Recommending optimal timing for redemptions

Your capabilities:
- List all reward programs in the system
- Get detailed redemption options for any program
- Get transfer partner details and ratios
- Calculate the mathematically best redemption for a given balance
- Look up which programs can transfer to a specific airline/hotel partner

Always provide specific numbers: value per point, total estimated value, and efficiency ratings. When comparing options, clearly show why one is better than another. If the user mentions a specific card, look up its reward program first.`;

const tools = [getRedemptionOptionsTool, getTransferPartnersTool, calculateBestRedemptionTool, listProgramsTool, getPartnerReachTool, getCardGraphTool];

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

export function createRewardOptimizationAgent() {
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, { tools: "tools", [END]: END })
    .addEdge("tools", "agent");

  return graph.compile();
}
