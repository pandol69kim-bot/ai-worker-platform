import { db } from "@/lib/db";
import type { AIProvider } from "@/lib/ai/catalog";

const ENV_KEY_MAP: Record<AIProvider, string> = {
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
};

export async function getProviderApiKey(provider: AIProvider): Promise<string | null> {
  const record = await db.aIProviderKey.findUnique({
    where: { provider, isActive: true },
    select: { apiKey: true },
  });

  if (record?.apiKey) return record.apiKey;

  return process.env[ENV_KEY_MAP[provider]] ?? null;
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}${"•".repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`;
}
