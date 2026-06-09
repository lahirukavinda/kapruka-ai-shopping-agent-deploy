import { createOpenAI } from "@ai-sdk/openai";
import { orchestrate } from "@/lib/agents/orchestrator";
import type { CoreMessage } from "ai";

// Support both GitHub Models (free) and OpenAI directly
const apiKey = process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY || "";
const isGitHubModels = !!process.env.GITHUB_TOKEN;
const baseURL = isGitHubModels
  ? "https://models.inference.ai.azure.com"
  : undefined;

const openai = createOpenAI({
  apiKey,
  baseURL,
});

// GitHub Models free tier: 8,000 total tokens for ALL models (gpt-4o and gpt-4o-mini).
// That includes system prompt + tool definitions + messages + response combined.
// Always use gpt-4o-mini on GitHub Models.
function selectModel(): string {
  return isGitHubModels ? "gpt-4o-mini" : "gpt-4o-mini";
}

// Estimate tokens from the FULL serialized message including tool results.
function estimateTokens(msg: CoreMessage): number {
  const serialized = JSON.stringify(msg);
  return Math.ceil(serialized.length / 4) + 4;
}

// Be very conservative: 8000 limit, reserve 6000 for system+tools+response,
// leaving only ~2000 tokens for messages. This accounts for tool defs being
// larger than initially estimated.
const MESSAGE_BUDGET = 2000;

// Compact an OLD message (not the last user message) to save tokens.
function compactOldMessage(msg: CoreMessage): CoreMessage | null {
  // Drop tool-role messages entirely — they contain huge JSON tool results
  if (msg.role === "tool") return null;

  if (msg.role === "user") {
    const content = typeof msg.content === "string"
      ? msg.content
      : JSON.stringify(msg.content);
    return { role: "user", content: content.slice(0, 200) };
  }

  if (msg.role === "assistant") {
    const content = typeof msg.content === "string" ? msg.content : "";
    if (content) {
      return { role: "assistant", content: content.slice(0, 200) };
    }
    // Assistant messages with only tool calls (no text) — skip
    return null;
  }

  return null;
}

function trimMessages(messages: CoreMessage[]): CoreMessage[] {
  if (!messages.length) return [];

  // The LAST user message must be preserved fully — it contains order details,
  // product IDs, delivery info etc. that the agent needs.
  // Find it and keep it intact (up to 1500 chars).
  const lastIdx = messages.length - 1;
  const lastMsg = messages[lastIdx];

  // Preserve last user message content fully
  const preservedLast: CoreMessage = lastMsg.role === "user"
    ? { role: "user", content: (typeof lastMsg.content === "string" ? lastMsg.content : JSON.stringify(lastMsg.content)).slice(0, 1500) }
    : compactOldMessage(lastMsg) ?? { role: "user" as const, content: "" };

  const lastCost = estimateTokens(preservedLast);
  let remaining = MESSAGE_BUDGET - lastCost;

  // Walk backwards through older messages, compacting and fitting to budget
  const older: CoreMessage[] = [];
  for (let i = lastIdx - 1; i >= 0 && remaining > 50; i--) {
    const compacted = compactOldMessage(messages[i]);
    if (!compacted) continue;
    const cost = estimateTokens(compacted);
    if (cost <= remaining) {
      older.unshift(compacted);
      remaining -= cost;
    } else {
      break;
    }
  }

  older.push(preservedLast);
  return older;
}

function isRateLimitError(err: unknown): boolean {
  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, unknown>;
    if (e.statusCode === 429) return true;
    if (typeof e.message === "string" && /rate.?limit|too many requests/i.test(e.message)) return true;
  }
  return false;
}

function isBodyTooLargeError(err: unknown): boolean {
  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, unknown>;
    if (e.statusCode === 413) return true;
    if (typeof e.message === "string" && /too large|tokens_limit_reached/i.test(e.message)) return true;
  }
  return false;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RETRIES = 2;

export async function POST(req: Request) {
  try {
    const { messages: rawMessages, language = "en" } = await req.json();

    const model = selectModel();
    let messages = trimMessages(rawMessages);

    const classifierModel = openai("gpt-4o-mini");
    const agentModel = openai(model);

    let lastError: unknown = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await orchestrate({
          classifierModel,
          agentModel,
          messages,
          language,
        });

        // Return the data stream response.
        // The orchestrate call itself will throw on 413/429 errors
        // during the initial model request before any streaming begins.
        return result.toDataStreamResponse();
      } catch (err) {
        lastError = err;
        console.error(`Chat API error (attempt ${attempt + 1}):`, err);

        if (isBodyTooLargeError(err)) {
          // Aggressively trim: keep only the last user message
          const lastUser = [...messages].reverse().find(m => m.role === "user");
          messages = lastUser
            ? [{ role: "user" as const, content: (typeof lastUser.content === "string" ? lastUser.content : "").slice(0, 200) }]
            : messages.slice(-1);
          continue;
        }

        if (isRateLimitError(err) && attempt < MAX_RETRIES) {
          const delay = 1000 * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }

        break;
      }
    }

    const isRateLimit = isRateLimitError(lastError);
    const isTokenLimit = isBodyTooLargeError(lastError);
    const code = isRateLimit ? "RATE_LIMITED" : isTokenLimit ? "TOKEN_LIMIT" : "UNKNOWN";

    const errorMessages: Record<string, string> = {
      RATE_LIMITED: "Aura is getting a lot of requests right now. Please wait a moment and try again.",
      TOKEN_LIMIT: "The conversation got too long. Try starting a fresh chat or sending a shorter message.",
      UNKNOWN: "Something went wrong. Please try again.",
    };

    return new Response(JSON.stringify({ error: errorMessages[code], code }), {
      status: isRateLimit ? 429 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return new Response(JSON.stringify({ error: message, code: "UNKNOWN" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
