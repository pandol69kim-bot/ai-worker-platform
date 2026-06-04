# 게시된 AI 직원 상태변경기능 체크

## 결론

- 게시된 AI 직원의 상태를 변경하는 전용 기능은 현재 사용자 화면에 없음.
- 관리자 화면에서도 게시된 AI 직원을 다시 다른 상태로 바꾸는 공식 UI는 확인되지 않음.
- 다만 백엔드 관리자 API는 상태 전이 제한을 두지 않고 있어, API를 직접 호출하면 게시된 AI 직원도 `rejected` 같은 상태로 변경될 수 있음.

## 확인한 구현 위치

### 1. 관리자 상태변경 API 존재

- 파일: `src/app/api/admin/workers/[id]/review/route.ts`
- 관리자 리뷰 액션은 아래 3가지만 허용함.

```ts
action: z.enum(["approve", "reject", "publish"])
```

실제 상태 변경은 아래처럼 이뤄짐.

```ts
switch (action) {
  case "approve":
    newStatus = "approved";
    break;
  case "reject":
    newStatus = "rejected";
    break;
  case "publish":
    newStatus = "published";
    break;
}
```

그리고 최종적으로:

```ts
await db.aIWorker.update({
  where: { id },
  data: updateData,
});
```

즉, 상태를 바꾸는 서버 기능 자체는 존재함.

### 2. 하지만 게시 상태 전용 변경 로직은 없음

위 API에는 다음과 같은 보호 로직이 없음.

- `published` 상태일 때는 변경 불가
- `published -> draft` 금지
- `published -> rejected` 금지
- `publish`는 `approved` 상태에서만 가능

즉, 현재 코드는 "현재 상태가 무엇인지"를 거의 검사하지 않고, 요청받은 액션대로 상태를 변경하는 구조임.

## UI 기준 확인 결과

### 1. 관리자 페이지에는 게시된 AI 직원 목록이 없음

- 파일: `src/app/admin/page.tsx`

관리자 페이지에서 실제로 불러오는 목록은 다음 두 종류뿐임.

- 검수 대기: `submitted`, `reviewing`
- 게시 가능: `approved`

즉, `published` 상태인 AI 직원은 관리자 페이지 목록에 직접 표시되지 않음.

### 2. 관리자 액션 UI도 게시된 항목용으로 설계되어 있지 않음

- 파일: `src/components/worker/AdminWorkerActions.tsx`

노출되는 주요 버튼:

- `submitted`일 때만 `승인`
- `approved`일 때만 `게시`
- `반려` 버튼은 조건 없이 항상 렌더링됨

이 말은 컴포넌트 자체만 보면 `published` 상태에도 `반려` 액션을 보일 수 있는 구조지만, 현재 관리자 페이지가 게시된 항목을 이 컴포넌트에 넘기지 않으므로 실제 UI에서는 사용되지 않음.

### 3. 제작자 화면에서는 게시된 항목 상태변경 기능 없음

- 파일: `src/components/worker/WorkerActions.tsx`
- 파일: `src/app/studio/workers/[id]/edit/page.tsx`
- 파일: `src/app/api/workers/[id]/submit/route.ts`

제작자 기준:

- `draft`, `rejected`만 편집 가능
- `draft`, `rejected`만 재제출 가능
- `draft`, `rejected`만 삭제 가능
- `approved`, `published`는 보기만 가능

따라서 제작자는 게시된 AI 직원의 상태를 바꿀 수 없음.

## 실무 판단

현재 상태변경 기능을 두 관점으로 나누면 아래와 같음.

### 1. 공식 기능 관점

- 게시된 AI 직원 상태변경 기능: 사실상 없음
- 이유: 관리자 UI에도 없고, 제작자 UI에도 없음

### 2. 백엔드 동작 관점

- 게시된 AI 직원 상태변경 가능성: 있음
- 이유: 관리자 API가 현재 상태를 검증하지 않기 때문

예를 들어 관리자 권한으로 `review` API에 `reject`를 보내면, 게시된 항목도 `rejected`로 바뀔 수 있는 구조임.

## 최종 판단

가장 정확한 표현은 아래와 같음.

> 게시된 AI 직원의 상태를 바꾸는 공식 화면 기능은 현재 없다. 다만 관리자 리뷰 API에는 상태 전이 제한이 없어, API 직접 호출 기준으로는 게시된 AI 직원의 상태가 변경될 수 있다.