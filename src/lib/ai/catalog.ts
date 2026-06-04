export const AI_PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "claude", label: "Claude" },
] as const;

export type AIProvider = (typeof AI_PROVIDER_OPTIONS)[number]["value"];

export const AI_MODEL_CATALOG = {
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
  ],
  gemini: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  ],
  claude: [
    { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-7-sonnet-latest", label: "Claude 3.7 Sonnet" },
  ],
} as const satisfies Record<AIProvider, ReadonlyArray<{ value: string; label: string }>>;

export const DEFAULT_AI_PROVIDER: AIProvider = "openai";

export const DEFAULT_AI_MODEL_BY_PROVIDER: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
  claude: "claude-3-5-sonnet-latest",
};

export function isSupportedAIProvider(value: string): value is AIProvider {
  return AI_PROVIDER_OPTIONS.some((provider) => provider.value === value);
}

export function getAIProviderLabel(provider: string) {
  return AI_PROVIDER_OPTIONS.find((item) => item.value === provider)?.label ?? provider;
}

export function getAIModelsForProvider(provider: AIProvider) {
  return AI_MODEL_CATALOG[provider];
}

export function isSupportedAIModel(provider: string, model: string) {
  if (!isSupportedAIProvider(provider)) {
    return false;
  }

  return AI_MODEL_CATALOG[provider].some((item) => item.value === model);
}

export function getAIModelLabel(provider: string, model: string) {
  if (!isSupportedAIProvider(provider)) {
    return model;
  }

  return AI_MODEL_CATALOG[provider].find((item) => item.value === model)?.label ?? model;
}

export function canViewAiConfig(input: {
  userRole?: string;
  isMaker?: boolean;
  isAiConfigPublic?: boolean | null;
}) {
  return input.userRole === "admin" || !!input.isMaker || !!input.isAiConfigPublic;
}