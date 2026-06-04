# Gemini, Claude 등 AI 추가 작업계획서

**작성일:** 2026-06-02  
**프로젝트:** ai-worker-platform  
**목표:** 현재 OpenAI 단일 실행 구조를 Gemini, Claude 등 다중 AI 제공자 구조로 확장하여 각 AI 직원이 서로 다른 모델/제공자를 선택해 실행할 수 있게 만들기

---

## 1. 현재 상태 요약

현재 프로젝트의 AI 실행 구조는 다음과 같습니다.

- 실행 API: `src/app/api/execute/route.ts`
- AI 호출 구현: `src/lib/openai.ts`
- 현재 사용 provider: OpenAI 단일
- 현재 사용 model: `gpt-4o-mini` 고정
- `AIWorker` 모델에는 provider/model 선택 필드가 아직 없음

즉, 지금 구조는 아래 특징을 가집니다.

- 모든 AI 직원이 같은 제공자를 사용함
- 모든 AI 직원이 같은 모델로 실행됨
- 향후 Claude, Gemini 추가 시 현재 구조로는 확장성이 낮음

---

## 2. 목표 정의

추가하려는 기능의 목표는 다음과 같습니다.

- OpenAI 외에 Gemini, Claude 같은 제공자를 추가할 수 있어야 함
- AI 직원 생성 시 어떤 provider/model을 사용할지 선택할 수 있어야 함
- 실행 시 worker 설정에 따라 맞는 provider SDK가 호출되어야 함
- 실패 메시지와 실행 로그는 기존처럼 유지되어야 함
- 향후 새로운 provider를 추가할 때 기존 코드 변경 범위를 최소화해야 함

---

## 3. 요구사항 정리

### 필수 요구사항

- provider 개념 도입
- model 개념 도입
- AIWorker별 provider/model 저장 가능
- 실행 API가 provider별 분기 가능
- OpenAI, Gemini, Claude 최소 3개 provider 확장 가능 구조 설계

### 권장 요구사항

- provider별 환경변수 분리
- provider별 에러 메시지 표준화
- UI에서 선택 가능한 모델 목록 제공
- 관리자/메이커가 worker별 모델 정책을 명확히 볼 수 있어야 함

### 선택 요구사항

- provider별 토큰/비용 추정치 표시
- provider fallback 전략
- 특정 provider 장애 시 대체 모델 사용
- provider별 실행 품질 비교 기능

---

## 4. 추천 아키텍처 방향

### 권장안: Provider Adapter 구조 도입

현재 `src/lib/openai.ts`처럼 단일 SDK 직접 호출 구조 대신, 제공자별 어댑터 구조로 바꾸는 것이 맞습니다.

권장 구조 예시:

- `src/lib/ai/types.ts`
- `src/lib/ai/providers/openai.ts`
- `src/lib/ai/providers/gemini.ts`
- `src/lib/ai/providers/claude.ts`
- `src/lib/ai/execute.ts`
- `src/lib/ai/registry.ts`

핵심 아이디어:

- 공통 인터페이스 정의
- provider별 구현 분리
- 실행 API는 provider 이름만 보고 적절한 adapter 호출

---

## 5. 추천 데이터 모델 변경

현재 `AIWorker`에는 provider/model 필드가 없습니다.

따라서 최소 아래 필드가 필요합니다.

### 5.1 AIWorker에 추가할 필드 후보

- `aiProvider`: `String`
- `aiModel`: `String`
- `temperature`: `Float?`
- `maxTokens`: `Int?`
- `systemPromptTemplate`: 선택 사항

최소 버전에서는 아래 두 필드만 먼저 추가해도 충분합니다.

- `aiProvider`
- `aiModel`

예시 방향:

- `aiProvider = "openai" | "gemini" | "claude"`
- `aiModel = "gpt-4o-mini" | "gemini-2.5-flash" | "claude-3-5-sonnet"`

### 5.2 Execution 로그 확장 후보

현재 `Execution`에는 provider/model 기록이 없습니다.

향후 운영 추적을 위해 아래도 고려할 수 있습니다.

- `provider`: `String?`
- `model`: `String?`

이 값이 있으면 어떤 실행이 어떤 제공자에서 실패했는지 추적이 쉬워집니다.

---

## 6. 실행 흐름 변경 계획

### 현재 흐름

1. `/api/execute` 호출
2. worker 조회
3. `executeAIWorker(...)` 호출
4. 내부에서 OpenAI SDK 직접 실행
5. 결과 저장

### 목표 흐름

1. `/api/execute` 호출
2. worker 조회
3. worker의 `aiProvider`, `aiModel` 확인
4. 공통 AI 실행 함수 호출
5. registry가 provider adapter 선택
6. 해당 SDK 실행
7. 결과 저장

즉, `executeAIWorker`는 provider 고정 함수가 아니라 **provider-aware dispatcher** 로 바뀌어야 합니다.

---

## 7. 파일별 작업 계획

### 7.1 신규 파일

권장 신규 파일:

- `src/lib/ai/types.ts`
- `src/lib/ai/registry.ts`
- `src/lib/ai/execute.ts`
- `src/lib/ai/providers/openai.ts`
- `src/lib/ai/providers/gemini.ts`
- `src/lib/ai/providers/claude.ts`

### 7.2 수정 파일

- `src/app/api/execute/route.ts`
- `src/components/worker/WorkerForm.tsx`
- `src/app/api/workers/route.ts`
- `src/app/api/workers/[id]/route.ts`
- `prisma/schema.prisma`
- `.env.example`
- 배포 관련 문서들

### 7.3 정리 대상 파일

현재 `src/lib/openai.ts`는 아래 중 하나로 정리합니다.

- provider별 adapter로 축소
- 또는 `src/lib/ai/providers/openai.ts`로 역할 이전 후 제거

권장:

- 장기적으로 `src/lib/openai.ts`는 제거하고 `src/lib/ai/providers/openai.ts`로 이동

---

## 8. UI/폼 변경 계획

### 8.1 Worker 생성/수정 폼

현재 `WorkerForm`에는 provider/model 선택 UI가 없습니다.

추가할 항목:

- AI 제공자 선택
- 모델 선택
- 선택한 provider에 따라 모델 목록 동적 변경

예시 UI:

- 제공자: OpenAI / Gemini / Claude
- 모델: provider 선택에 따라 옵션 변경

### 8.2 상세 페이지 표시 정보

현재 상세 페이지에는 어떤 AI 제공자를 쓰는지 표시되지 않습니다.

추가 후보:

- 사용 모델 배지
- 사용 provider 배지

예시:

- `OpenAI · gpt-4o-mini`
- `Gemini · gemini-2.5-flash`
- `Claude · claude-3-5-sonnet`

### 8.3 관리자 검수 항목

관리자 입장에서는 아래도 확인할 수 있어야 합니다.

- 어떤 provider를 쓰는지
- 어떤 model을 쓰는지
- 위험하거나 비용이 큰 모델인지

---

## 9. 환경변수 계획

provider별 환경변수를 분리해야 합니다.

### 필수 후보

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`

### 선택 후보

- `OPENAI_BASE_URL`
- `GEMINI_BASE_URL`
- `ANTHROPIC_BASE_URL`

원칙:

- 제공자별 키는 독립적으로 관리
- 없는 provider는 선택 불가 처리
- 서버 시작 시 필수 키 존재 여부를 검증하는 구조도 고려

---

## 10. Provider별 기술 검토 방향

### 10.1 OpenAI

현재 이미 사용 중이므로 기준 구현으로 유지합니다.

### 10.2 Gemini

검토 항목:

- 공식 SDK 선택
- system prompt 처리 방식
- 응답 텍스트 추출 방식
- 토큰 사용량 제공 여부

### 10.3 Claude

검토 항목:

- Anthropic SDK 도입
- system prompt / user message 구조 차이
- max tokens / temperature 옵션 차이
- usage 응답 형식 차이

즉, 각 provider는 같은 인터페이스를 따르되 내부 구현은 다르게 가져가야 합니다.

---

## 11. 공통 인터페이스 초안

예시 개념:

```ts
interface AIExecutionRequest {
  provider: string;
  model: string;
  roleDefinition: string;
  workflow: string;
  rules?: string | null;
  prompt: string;
  userInput: string;
  maxTokens?: number;
  temperature?: number;
}

interface AIExecutionResult {
  output: string;
  tokens: number;
  provider: string;
  model: string;
}
```

각 provider adapter는 같은 입력/출력 형태를 맞추는 방향이 좋습니다.

---

## 12. 구현 단계

### Phase 1: 구조 준비

목표:

- 다중 provider 구조를 수용할 기반 마련

작업:

- Prisma schema에 provider/model 필드 추가
- 공통 AI 타입 정의
- OpenAI adapter를 공통 인터페이스 기반으로 이관

### Phase 2: 실행 라우팅 전환

목표:

- 실행 API가 OpenAI 고정 구조에서 provider 분기 구조로 바뀌도록 함

작업:

- `src/app/api/execute/route.ts` 수정
- worker의 provider/model 읽기
- registry를 통한 adapter 실행
- execution 로그에 provider/model 저장 검토

### Phase 3: Gemini 추가

목표:

- OpenAI 외 첫 번째 추가 provider 연결

작업:

- Gemini SDK 설치
- Gemini adapter 구현
- 환경변수 반영
- 테스트 worker 생성

### Phase 4: Claude 추가

목표:

- Anthropic provider 연결

작업:

- Claude SDK 설치
- Claude adapter 구현
- 환경변수 반영
- 테스트 worker 생성

### Phase 5: UI 반영

목표:

- 메이커가 worker 생성 시 provider/model을 선택 가능하게 함

작업:

- `WorkerForm` 수정
- workers create/update API 검증 추가
- 상세 페이지에 provider/model 표시

### Phase 6: 운영 안정화

목표:

- 장애 대응과 메시지 품질 개선

작업:

- provider별 에러 메시지 정리
- 지원하지 않는 provider/model 방어 처리
- 키 누락 시 명확한 오류 응답 추가

---

## 13. 검증 계획

### 기능 검증

- OpenAI worker가 기존처럼 실행되는지
- Gemini worker가 정상 실행되는지
- Claude worker가 정상 실행되는지
- provider별 오류 메시지가 구분되어 보이는지
- provider/model 선택값이 DB에 저장되는지

### 회귀 검증

- 기존 worker 생성 흐름이 깨지지 않는지
- `/api/execute` 응답 구조가 기존 UI와 충돌하지 않는지
- 실행 기록 저장이 유지되는지

### 운영 검증

- API 키 누락 시 정확한 오류 메시지 노출
- 미지원 모델 선택 시 방어 처리
- provider별 응답 속도 차이가 큰 경우 UX 문제가 없는지

---

## 14. 우선순위

### 이번 작업에서 먼저 할 것

- provider/model 필드 추가
- 공통 AI adapter 구조 도입
- OpenAI를 새 구조로 먼저 이관
- Gemini 1개 추가

### 다음 작업으로 미뤄도 되는 것

- Claude 추가
- provider fallback
- 비용 추적
- 모델별 고급 파라미터 세분화

---

## 15. 주의사항

1. provider별 SDK 응답 형식이 다르므로 출력/토큰 처리 표준화가 필요함
2. 일부 provider는 OpenAI처럼 정확한 usage 정보를 주지 않을 수 있음
3. provider마다 system prompt 전달 방식이 다를 수 있음
4. 모델명은 하드코딩보다 registry 기반 상수 관리가 안전함
5. 잘못된 provider/model 조합은 생성 단계와 실행 단계 모두에서 막아야 함

---

## 16. 최종 구현 목표

최종적으로는 AI 직원 하나하나가 서로 다른 AI 엔진을 사용할 수 있어야 합니다.

예를 들어:

- 마케팅 카피 AI 직원: OpenAI
- 장문 분석 AI 직원: Claude
- 빠른 초안 생성 AI 직원: Gemini

이렇게 각 worker가 역할에 맞는 provider/model을 선택하고, 플랫폼은 이를 공통 인터페이스 아래에서 안정적으로 실행하는 구조가 되는 것이 목표입니다.
