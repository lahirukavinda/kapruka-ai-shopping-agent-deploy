import { streamText } from "ai";
import type { LanguageModelV1, CoreMessage } from "ai";
import { getSystemPromptForLanguage, SHOPPER_SYSTEM_PROMPT, LOGISTICS_SYSTEM_PROMPT } from "./concierge";
import { getAllTools, getShopperTools, getLogisticsTools } from "./tools";

type Intent = "shopping" | "logistics" | "general";

const INTENT_SYSTEM_PROMPT = `You are an intent classifier for a Sri Lankan e-commerce shopping assistant.
Given a user message, classify the intent into exactly one of these categories:
- "shopping": product search, browse, compare, view details, list categories
- "logistics": delivery cities, delivery check, shipping availability, delivery date/rate
- "general": order creation, order tracking, greetings, emotional messages, checkout, anything else

Respond with ONLY the intent word, nothing else.`;

export async function classifyIntent(
  model: LanguageModelV1,
  lastMessage: string
): Promise<Intent> {
  try {
    const result = await streamText({
      model,
      system: INTENT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: lastMessage }],
      maxTokens: 10,
    });

    let text = "";
    for await (const chunk of result.textStream) {
      text += chunk;
    }

    const cleaned = text.trim().toLowerCase();
    if (cleaned === "shopping" || cleaned === "logistics") {
      return cleaned;
    }
    return "general";
  } catch {
    return "general";
  }
}

interface OrchestrateParams {
  classifierModel: LanguageModelV1;
  agentModel: LanguageModelV1;
  messages: CoreMessage[];
  language: string;
}

export async function orchestrate({
  classifierModel,
  agentModel,
  messages,
  language,
}: OrchestrateParams) {
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  const lastUserMsg = lastUserMessage
    ? typeof lastUserMessage.content === "string"
      ? lastUserMessage.content
      : ""
    : "";

  const intent = await classifyIntent(classifierModel, lastUserMsg);

  let systemPrompt: string;
  let tools: ReturnType<typeof getAllTools>;

  switch (intent) {
    case "shopping":
      systemPrompt = SHOPPER_SYSTEM_PROMPT;
      tools = getShopperTools() as ReturnType<typeof getAllTools>;
      break;
    case "logistics":
      systemPrompt = LOGISTICS_SYSTEM_PROMPT;
      tools = getLogisticsTools() as ReturnType<typeof getAllTools>;
      break;
    default:
      systemPrompt = getSystemPromptForLanguage(language);
      tools = getAllTools();
      break;
  }

  return streamText({
    model: agentModel,
    system: systemPrompt,
    messages,
    tools,
    maxSteps: 5,
  });
}
