import OpenAI from "openai";
import { buildWorkerSystemPrompt } from "@/lib/ai/prompt";
import { getProviderApiKey } from "@/lib/ai/keys";
import type { AIProviderAdapter } from "@/lib/ai/types";

export const openAIProvider: AIProviderAdapter = {
  provider: "openai",
  async execute(input) {
    const apiKey = await getProviderApiKey("openai");
    if (!apiKey) {
      throw new Error("OpenAI API 키가 설정되지 않았습니다.");
    }

    const client = new OpenAI({ apiKey });
    const systemPrompt = buildWorkerSystemPrompt(
      input.prompt,
      input.roleDefinition,
      input.workflow,
      input.rules
    );

    const completion = await client.chat.completions.create({
      model: input.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.userInput },
      ],
      max_tokens: input.maxTokens ?? 2000,
      temperature: input.temperature,
    });

    return {
      output: completion.choices[0]?.message?.content || "",
      tokens: completion.usage?.total_tokens || 0,
      provider: input.provider,
      model: input.model,
      systemPrompt,
    };
  },
};