export function buildWorkerSystemPrompt(
  prompt: string,
  roleDefinition: string,
  workflow: string,
  rules: string | null | undefined
) {
  return `당신은 AI 직원입니다.

역할: ${roleDefinition}

시스템 프롬프트:
${prompt}

업무 플로우:
${workflow}

${rules ? `규칙:\n${rules}` : ""}

사용자의 요청에 따라 위 역할과 플로우에 맞게 업무를 수행하세요.`;
}