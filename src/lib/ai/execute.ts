import {
  DEFAULT_AI_MODEL_BY_PROVIDER,
  DEFAULT_AI_PROVIDER,
  isSupportedAIModel,
  isSupportedAIProvider,
  type AIProvider,
} from "@/lib/ai/catalog";
import { claudeProvider } from "@/lib/ai/providers/claude";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { openAIProvider } from "@/lib/ai/providers/openai";
import type { AIExecutionRequest, AIExecutionResult, AIProviderAdapter } from "@/lib/ai/types";

const providerRegistry: Record<AIProvider, AIProviderAdapter> = {
  openai: openAIProvider,
  gemini: geminiProvider,
  claude: claudeProvider,
};

export async function executeAIWorkerWithProvider(
  input: Omit<AIExecutionRequest, "provider" | "model"> & {
    provider?: string | null;
    model?: string | null;
  }
): Promise<AIExecutionResult> {
  const provider: AIProvider = isSupportedAIProvider(input.provider ?? "")
    ? (input.provider as AIProvider)
    : DEFAULT_AI_PROVIDER;
  const model = input.model && isSupportedAIModel(provider, input.model)
    ? input.model
    : DEFAULT_AI_MODEL_BY_PROVIDER[provider];

  return providerRegistry[provider].execute({
    ...input,
    provider,
    model,
  });
}

export { executeAIWorkerWithProvider as executeAIWorker };