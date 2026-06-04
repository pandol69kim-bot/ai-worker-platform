import { GoogleGenAI } from "@google/genai";
import { buildWorkerSystemPrompt } from "@/lib/ai/prompt";
import { getProviderApiKey } from "@/lib/ai/keys";
import type { AIProviderAdapter } from "@/lib/ai/types";

export const geminiProvider: AIProviderAdapter = {
  provider: "gemini",
  async execute(input) {
    const apiKey = await getProviderApiKey("gemini");
    if (!apiKey) {
      throw new Error("Gemini API 키가 설정되지 않았습니다.");
    }

    const client = new GoogleGenAI({ apiKey });
    const systemPrompt = buildWorkerSystemPrompt(
      input.prompt,
      input.roleDefinition,
      input.workflow,
      input.rules
    );

    const response = await client.models.generateContent({
      model: input.model,
      contents: input.userInput,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: input.maxTokens ?? 2000,
        temperature: input.temperature,
      },
    });

    return {
      output: response.text ?? "",
      tokens: response.usageMetadata?.totalTokenCount ?? 0,
      provider: input.provider,
      model: input.model,
      systemPrompt,
    };
  },
};