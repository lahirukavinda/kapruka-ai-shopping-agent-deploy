import { createOpenAI } from "@ai-sdk/openai";
import { orchestrate } from "@/lib/agents/orchestrator";

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
