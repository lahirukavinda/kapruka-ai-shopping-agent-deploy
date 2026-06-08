import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getSystemPromptForLanguage } from "@/lib/agents/concierge";
import { getAllTools } from "@/lib/agents/tools";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
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
}
