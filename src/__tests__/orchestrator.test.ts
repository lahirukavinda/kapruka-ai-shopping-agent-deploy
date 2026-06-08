import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the streamText function before importing orchestrator
vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

vi.mock("@/lib/agents/concierge", () => ({
  getSystemPromptForLanguage: vi.fn((lang: string) => `system-prompt-${lang}`),
  SHOPPER_SYSTEM_PROMPT: "shopper-prompt",
  LOGISTICS_SYSTEM_PROMPT: "logistics-prompt",
}));

vi.mock("@/lib/agents/tools", () => ({
  getAllTools: vi.fn(() => ({ all: true })),
  getShopperTools: vi.fn(() => ({ shopper: true })),
  getLogisticsTools: vi.fn(() => ({ logistics: true })),
}));

import { classifyIntent, orchestrate } from "@/lib/agents/orchestrator";
import { streamText } from "ai";
import type { LanguageModelV1 } from "ai";
import { getAllTools, getShopperTools, getLogisticsTools } from "@/lib/agents/tools";

const mockStreamText = vi.mocked(streamText);

function createMockModel(): LanguageModelV1 {
  return {
    specificationVersion: "v1",
    provider: "test",
    modelId: "test-model",
    defaultObjectGenerationMode: "json" as const,
    doGenerate: vi.fn(),
    doStream: vi.fn(),
  };
}

function makeTextStream(text: string): ReturnType<typeof streamText> {
  return {
    textStream: (async function* () {
      yield text;
    })(),
    text: Promise.resolve(text),
    toDataStreamResponse: vi.fn(),
  } as unknown as ReturnType<typeof streamText>;
}

describe("classifyIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 'shopping' when model says shopping", async () => {
    mockStreamText.mockReturnValue(makeTextStream("shopping"));
    const model = createMockModel();
    const result = await classifyIntent(model, "Show me birthday cakes");
    expect(result).toBe("shopping");
  });

  it("returns 'logistics' when model says logistics", async () => {
    mockStreamText.mockReturnValue(makeTextStream("logistics"));
    const model = createMockModel();
    const result = await classifyIntent(model, "Can you deliver to Kandy?");
    expect(result).toBe("logistics");
  });

  it("returns 'general' for unrecognized classification", async () => {
    mockStreamText.mockReturnValue(makeTextStream("hello"));
    const model = createMockModel();
    const result = await classifyIntent(model, "Hello!");
    expect(result).toBe("general");
  });

  it("returns 'general' when model throws an error", async () => {
    mockStreamText.mockImplementation(() => {
      throw new Error("API error");
    });
    const model = createMockModel();
    const result = await classifyIntent(model, "anything");
    expect(result).toBe("general");
  });

  it("trims and lowercases the model output", async () => {
    mockStreamText.mockReturnValue(makeTextStream("  Shopping  "));
    const model = createMockModel();
    const result = await classifyIntent(model, "Search for products");
    expect(result).toBe("shopping");
  });
});

describe("orchestrate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes shopping intent to shopper tools", async () => {
    mockStreamText
      .mockReturnValueOnce(makeTextStream("shopping"))
      .mockReturnValueOnce(makeTextStream("Here are some products"));

    const model = createMockModel();
    await orchestrate({
      classifierModel: model,
      agentModel: model,
      messages: [{ role: "user", content: "Show me cakes" }],
      language: "en",
    });

    // The second streamText call should use shopper tools
    expect(mockStreamText).toHaveBeenCalledTimes(2);
    const secondCall = mockStreamText.mock.calls[1][0];
    expect(secondCall.system).toBe("shopper-prompt");
    expect(getShopperTools).toHaveBeenCalled();
  });

  it("routes logistics intent to logistics tools", async () => {
    mockStreamText
      .mockReturnValueOnce(makeTextStream("logistics"))
      .mockReturnValueOnce(makeTextStream("Delivery info"));

    const model = createMockModel();
    await orchestrate({
      classifierModel: model,
      agentModel: model,
      messages: [{ role: "user", content: "Check delivery to Colombo" }],
      language: "en",
    });

    const secondCall = mockStreamText.mock.calls[1][0];
    expect(secondCall.system).toBe("logistics-prompt");
    expect(getLogisticsTools).toHaveBeenCalled();
  });

  it("routes general intent to all tools with language prompt", async () => {
    mockStreamText
      .mockReturnValueOnce(makeTextStream("general"))
      .mockReturnValueOnce(makeTextStream("Hello!"));

    const model = createMockModel();
    await orchestrate({
      classifierModel: model,
      agentModel: model,
      messages: [{ role: "user", content: "Hello there" }],
      language: "si",
    });

    const secondCall = mockStreamText.mock.calls[1][0];
    expect(secondCall.system).toBe("system-prompt-si");
    expect(getAllTools).toHaveBeenCalled();
  });

  it("extracts the last user message correctly", async () => {
    mockStreamText
      .mockReturnValueOnce(makeTextStream("shopping"))
      .mockReturnValueOnce(makeTextStream("result"));

    const model = createMockModel();
    await orchestrate({
      classifierModel: model,
      agentModel: model,
      messages: [
        { role: "user", content: "first message" },
        { role: "assistant", content: "response" },
        { role: "user", content: "second message" },
      ],
      language: "en",
    });

    // First call to streamText (classify) should use "second message"
    const classifyCall = mockStreamText.mock.calls[0][0];
    expect(classifyCall.messages).toEqual([{ role: "user", content: "second message" }]);
  });
});
