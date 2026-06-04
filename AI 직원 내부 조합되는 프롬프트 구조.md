# AI 직원 내부 조합되는 프롬프트 구조

## 결론

- 현재 AI 직원 실행 시 OpenAI로 전달되는 프롬프트는 `system` 1개와 `user` 1개로 구성됨.
- `system` 프롬프트에는 `roleDefinition`, `workflow`, `rules`가 조합됨.
- 사용자가 입력한 실행 내용은 `user` 메시지로 그대로 들어감.
- 중요한 점: DB의 `prompt` 필드는 현재 실행용 프롬프트 조합에 실제로 사용되지 않음.

## 관련 코드 위치

- 실행 API: `src/app/api/execute/route.ts`
- OpenAI 호출 및 프롬프트 조합: `src/lib/openai.ts`
- 작성 폼에서 입력받는 필드: `src/components/worker/WorkerForm.tsx`

## 실제 실행 흐름

### 1. 사용자 입력 수집

실행 API에서 아래 2개를 받음.

```ts
const executeSchema = z.object({
  workerId: z.string(),
  input: z.string().min(1).max(5000),
});
```

- `workerId`: 어떤 AI 직원을 실행할지
- `input`: 사용자가 실행창에 입력한 요청 내용

### 2. DB에서 AI 직원 정보 조회

`src/app/api/execute/route.ts`에서 `AIWorker`를 조회한 뒤 아래 값을 `executeAIWorker()`에 전달함.

```ts
const { output, tokens } = await executeAIWorker(
  worker.prompt,
  worker.roleDefinition,
  worker.workflow,
  worker.rules,
  input
);
```

전달되는 인자 순서:

1. `prompt`
2. `roleDefinition`
3. `workflow`
4. `rules`
5. `input`

## 실제 OpenAI 프롬프트 조합 구조

`src/lib/openai.ts`에서 실제 `systemPrompt`는 아래 형태로 만들어짐.

```ts
const systemPrompt = `당신은 AI 직원입니다.

역할: ${roleDefinition}

업무 플로우:
${workflow}

${rules ? `규칙:\n${rules}` : ""}

사용자의 요청에 따라 위 역할과 플로우에 맞게 업무를 수행하세요.`;
```

즉 실제 구조는 아래와 같음.

```text
[system]
당신은 AI 직원입니다.

역할: {roleDefinition}

업무 플로우:
{workflow}

규칙:
{rules}   // rules가 있을 때만 포함

사용자의 요청에 따라 위 역할과 플로우에 맞게 업무를 수행하세요.

[user]
{input}
```

## 메시지 배열 구조

OpenAI 호출 시 실제 메시지 배열은 다음과 같음.

```ts
messages: [
  { role: "system", content: systemPrompt },
  { role: "user", content: userInput },
]
```

정리하면:

- 시스템 지시문: 역할/업무플로우/규칙
- 사용자 지시문: 실행창에 입력한 실제 요청

## 현재 반영되는 필드 / 반영되지 않는 필드

### 실제 반영되는 필드

- `roleDefinition`
- `workflow`
- `rules`
- 사용자 실행 입력값 `input`

### 현재 실행 프롬프트에 반영되지 않는 필드

- `prompt`

이 부분이 중요함.

함수 시그니처에는 `prompt`가 있음.

```ts
export async function executeAIWorker(
  prompt: string,
  roleDefinition: string,
  workflow: string,
  rules: string | null,
  userInput: string
)
```

하지만 함수 내부 `systemPrompt`를 만들 때는 `prompt` 변수를 전혀 사용하지 않음.

즉 현재 상태에서는 작성 화면에서 입력한 `시스템 프롬프트(prompt)`가 저장은 되지만, 실제 AI 실행에는 반영되지 않음.

## 작성 화면 기준 필드 의미와 실제 실행 반영 관계

`src/components/worker/WorkerForm.tsx`에서 핵심 필드는 아래처럼 입력받음.

- `roleDefinition`: 역할 정의
- `workflow`: 업무 플로우
- `prompt`: 시스템 프롬프트
- `rules`: 규칙 및 제약사항

하지만 현재 실행 기준으로 보면:

- 역할 정의: 반영됨
- 업무 플로우: 반영됨
- 시스템 프롬프트: 반영 안 됨
- 규칙 및 제약사항: 반영됨

## 현재 모델 설정

`src/lib/openai.ts` 기준:

```ts
model: "gpt-4o-mini"
```

추가 설정:

- `max_tokens: 2000`

## 최종 판단

가장 정확하게 표현하면 아래와 같음.

> 현재 AI 직원 내부 프롬프트는 `roleDefinition + workflow + rules + user input` 구조로 조합된다. `prompt` 필드는 함수 인자로 전달되지만 실제 system 프롬프트 생성에는 사용되지 않는다.

## 참고 메모

원래 의도가 `prompt`까지 포함하는 것이었다면, 추후 아래 형태로 바뀌어야 할 가능성이 높음.

```text
당신은 AI 직원입니다.

역할: {roleDefinition}

업무 플로우:
{workflow}

시스템 프롬프트:
{prompt}

규칙:
{rules}
```

하지만 현재 코드 기준 실제 동작은 그 상태가 아님.