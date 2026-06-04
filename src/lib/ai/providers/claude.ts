import Anthropic from "@anthropic-ai/sdk";
import { buildWorkerSystemPrompt } from "@/lib/ai/prompt";
import { getProviderApiKey } from "@/lib/ai/keys";
import type { AIProviderAdapter } from "@/lib/ai/types";

export const claudeProvider: AIProviderAdapter = {
  provider: "claude",
  async execute(input) {
    const apiKey = await getProviderApiKey("claude");
    if (!apiKey) {
      throw new Error("Anthropic API 키가 설정되지 않았습니다.");
    }

    const client = new Anthropic({ apiKey });
    const systemPrompt = buildWorkerSystemPrompt(
      input.prompt,
      input.roleDefinition,
      input.workflow,
      input.rules
    );

    const response = await client.messages.create({
      model: input.model,
      system: systemPrompt,
      max_tokens: input.maxTokens ?? 2000,
      temperature: input.temperature,
      messages: [{ role: "user", content: input.userInput }],
    });

    const output = response.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");

    return {
      output,
      tokens: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
      provider: input.provider,
      model: input.model,
      systemPrompt,
    };
  },
};