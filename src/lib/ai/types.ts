import type { AIProvider } from "@/lib/ai/catalog";

export type AIExecutionRequest = {
  provider: AIProvider;
  model: string;
  roleDefinition: string;
  workflow: string;
  rules?: string | null;
  prompt: string;
  userInput: string;
  maxTokens?: number;
  temperature?: number;
};

export type AIExecutionResult = {
  output: string;
  tokens: number;
  provider: AIProvider;
  model: string;
  systemPrompt: string;
};

export type AIProviderAdapter = {
  provider: AIProvider;
  execute: (input: AIExecutionRequest) => Promise<AIExecutionResult>;
};