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

function estimateTotalTokens(messages: CoreMessage[]): number {
  return messages.reduce((sum, msg) => sum + estimateTokens(msg), 0);
}

// Be very conservative: 8000 limit, reserve 6000 for system+tools+response,
// leaving only ~2000 tokens for messages. This accounts for tool defs being
// larger than initially estimated.
const MESSAGE_BUDGET = 2000;

// Strip all non-text content from messages to save tokens.
// Tool invocations (product lists, categories, delivery info) are huge JSON
// blobs that the model doesn't need to see in history.
function compactMessage(msg: CoreMessage): CoreMessage {
  if (msg.role === "user") {
    const content = typeof msg.content === "string"
      ? msg.content
      : JSON.stringify(msg.content);
    return { role: "user", content: content.slice(0, 500) };
  }

  if (msg.role === "assistant") {
    const content = typeof msg.content === "string" ? msg.content : "";
    if (content) {
      return { role: "assistant", content: content.slice(0, 300) };
    }
    return { role: "assistant", content: "(results shown to user)" };
  }

  // Tool results, system messages - summarize aggressively
  return { role: "assistant" as const, content: "(previous context)" };
}

function trimMessages(messages: CoreMessage[]): CoreMessage[] {
  if (!messages.length) return [];

  // Always compact all messages to remove tool invocations
  const compacted = messages.map(compactMessage);

  // If within budget, return all compacted messages
  if (estimateTotalTokens(compacted) <= MESSAGE_BUDGET) {
    return compacted;
  }

  // Walk backwards, keeping as many recent messages as fit
  const result: CoreMessage[] = [];
  let remaining = MESSAGE_BUDGET;

  for (let i = compacted.length - 1; i >= 0; i--) {
    const cost = estimateTokens(compacted[i]);
    if (cost <= remaining) {
      result.unshift(compacted[i]);
      remaining -= cost;
    } else if (result.length === 0) {
      // Must include at least the last message, truncated
      const text = typeof compacted[i].content === "string"
        ? compacted[i].content
        : JSON.stringify(compacted[i].content);
      const truncated = (text as string).slice(0, Math.max(remaining * 4, 100));
      result.unshift({ role: "user", content: truncated });
      break;
    } else {
      break;
    }
  }

  return result;
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

        // Eagerly consume the first text chunk to catch 413/429 errors
        // that the API returns before streaming starts.
        // This forces the underlying HTTP request to complete its initial handshake.
        const fullStream = result.fullStream;
        const reader = fullStream.getReader();
        await reader.read();
        reader.releaseLock();

        // If we get here without throwing, the stream is valid.
        // Return the data stream response normally.
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
      RATE_LIMITED: "Kapri is getting a lot of requests right now. Please wait a moment and try again.",
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
