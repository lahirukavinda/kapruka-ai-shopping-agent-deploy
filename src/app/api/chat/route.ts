import { createOpenAI } from "@ai-sdk/openai";
import { orchestrate } from "@/lib/agents/orchestrator";
import type { CoreMessage } from "ai";

// Support both GitHub Models (free) and OpenAI directly
const apiKey = process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY || "";
const baseURL = process.env.GITHUB_TOKEN
  ? "https://models.inference.ai.azure.com"
  : undefined;

const openai = createOpenAI({
  apiKey,
  baseURL,
});

function selectModel(messages: { role: string; content: string }[]): string {
  const lastUserMsg = [...messages]
    .reverse()
    .find((m) => m.role === "user")?.content || "";

  const isComplex =
    lastUserMsg.length > 100 ||
    /compar|recommend|suggest|which.*better|help me choose|opinion/i.test(lastUserMsg) ||
    /broke up|sad|miss|sorry|anniversary|birthday|celebration/i.test(lastUserMsg);

  return isComplex ? "gpt-4o" : "gpt-4o-mini";
}

// Rough token estimate: ~4 chars per token for English text
function estimateTokens(msg: CoreMessage): number {
  const content = typeof msg.content === "string"
    ? msg.content
    : JSON.stringify(msg.content);
  return Math.ceil(content.length / 4) + 4; // +4 for role/overhead
}

// Keep recent messages within a token budget.
// System prompt (~1500 tok) + tools (~1500 tok) + response (~1000 tok) ≈ 4000.
// That leaves ~4000 for messages on the 8000-token gpt-4o plan.
const MESSAGE_TOKEN_BUDGET = 3500;

function trimMessages(messages: CoreMessage[]): CoreMessage[] {
  // Always keep the first (system context) message and the last user message.
  if (messages.length <= 2) return messages;

  const result: CoreMessage[] = [];
  let budget = MESSAGE_TOKEN_BUDGET;

  // Walk backwards to prioritise recent context
  for (let i = messages.length - 1; i >= 0; i--) {
    const cost = estimateTokens(messages[i]);
    if (cost <= budget) {
      result.unshift(messages[i]);
      budget -= cost;
    } else {
      // If we can't fit the whole message, try to include a truncated version
      // for the most recent user message
      if (i === messages.length - 1 && messages[i].role === "user") {
        const content = typeof messages[i].content === "string"
          ? messages[i].content
          : JSON.stringify(messages[i].content);
        const truncated = (content as string).slice(0, budget * 4);
        result.unshift({ role: "user", content: truncated });
      }
      break;
    }
  }

  return result;
}

export async function POST(req: Request) {
  try {
    const { messages: rawMessages, language = "en" } = await req.json();
    const messages = trimMessages(rawMessages);

    const model = selectModel(messages as { role: string; content: string }[]);
    const classifierModel = openai("gpt-4o-mini");
    const agentModel = openai(model);

    const result = await orchestrate({
      classifierModel,
      agentModel,
      messages,
      language,
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
