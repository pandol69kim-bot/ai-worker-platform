import { executeAIWorkerWithProvider } from "@/lib/ai/execute";
import { buildWorkerSystemPrompt } from "@/lib/ai/prompt";

export { buildWorkerSystemPrompt };

export async function executeAIWorker(
  prompt: string,
  roleDefinition: string,
  workflow: string,
  rules: string | null,
  userInput: string
) {
  return executeAIWorkerWithProvider({
    provider: "openai",
    model: "gpt-4o-mini",
    prompt,
    roleDefinition,
    workflow,
    rules,
    userInput,
  });
}
