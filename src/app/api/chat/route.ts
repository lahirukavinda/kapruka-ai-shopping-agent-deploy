import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getSystemPromptForLanguage } from "@/lib/agents/concierge";
import { getAllTools } from "@/lib/agents/tools";

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

export async function POST(req: Request) {
  try {
    const { messages, language = "en" } = await req.json();

    const model = selectModel(messages);
    const systemPrompt = getSystemPromptForLanguage(language);

    const result = await streamText({
      model: openai(model),
      system: systemPrompt,
      messages,
      tools: getAllTools(),
      maxSteps: 5,
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
