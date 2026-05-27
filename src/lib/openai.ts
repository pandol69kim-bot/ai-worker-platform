import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function executeAIWorker(
  prompt: string,
  roleDefinition: string,
  workflow: string,
  rules: string | null,
  userInput: string
): Promise<{ output: string; tokens: number }> {
  const systemPrompt = `당신은 AI 직원입니다.

역할: ${roleDefinition}

업무 플로우:
${workflow}

${rules ? `규칙:\n${rules}` : ""}

사용자의 요청에 따라 위 역할과 플로우에 맞게 업무를 수행하세요.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ],
    max_tokens: 2000,
  });

  const output = completion.choices[0]?.message?.content || "";
  const tokens = completion.usage?.total_tokens || 0;

  return { output, tokens };
}
