# AI 직원 삭제기능 여부 체크

## 결론

- 삭제 기능은 이미 구현되어 있음.
- 다만 모든 AI 직원을 삭제할 수 있는 것은 아니고, `draft` 또는 `rejected` 상태일 때만 삭제 가능하도록 제한되어 있음.
- `rejected` 상태 삭제는 현재 DB 관계 설정 때문에 실제 운영에서 실패할 가능성이 있음.

## 확인한 구현 위치

### 1. 사용자 화면 삭제 버튼 존재

- 파일: `src/components/worker/WorkerActions.tsx`
- `draft`, `rejected` 상태에서만 삭제 버튼이 표시됨.
- 삭제 버튼 클릭 시 `DELETE /api/workers/{id}` 요청을 보냄.

핵심 코드 요약:

- `handleDelete()`에서 `fetch(`/api/workers/${worker.id}`, { method: "DELETE" })` 호출
- UI 노출 조건: `[`draft`, `rejected`]`

### 2. 삭제 API 존재

- 파일: `src/app/api/workers/[id]/route.ts`
- `DELETE` 핸들러가 구현되어 있음.

동작 조건:

- 로그인 필요
- 작성자 본인 또는 관리자만 삭제 가능
- 상태가 `draft` 또는 `rejected`일 때만 삭제 가능

실제 삭제 코드:

```ts
await db.aIWorker.delete({ where: { id } });
```

## 현재 확인된 제한 사항

### 1. published / approved / submitted 상태 삭제 불가

아래 조건 때문에 초안 또는 반려 상태만 삭제 가능함.

```ts
if (!["draft", "rejected"].includes(worker.status)) {
  return NextResponse.json({ error: "초안 또는 반려된 AI 직원만 삭제할 수 있습니다." }, { status: 400 });
}
```

즉, 등록 후 검수중(`submitted`), 승인(`approved`), 게시(`published`) 상태에서는 삭제 기능이 없음.

### 2. rejected 상태는 실제 삭제 실패 가능성 있음

- 파일: `prisma/schema.prisma`
- `AIWorker`는 `AdminReview[]`와 연결되어 있음.
- `AdminReview.worker` 관계에 `onDelete: Cascade`가 설정되어 있지 않음.

관련 구조:

```prisma
model AIWorker {
  ...
  adminReviews AdminReview[]
}

model AdminReview {
  ...
  worker AIWorker @relation(fields: [workerId], references: [id])
}
```

반려(`rejected`) 상태가 되려면 관리자 리뷰 데이터가 이미 생성되어 있을 가능성이 높음. 그런데 `AIWorker` 삭제 시 연결된 `AdminReview`가 남아 있으면 외래키 제약으로 삭제가 막힐 수 있음.

즉:

- `draft` 삭제: 대체로 가능
- `rejected` 삭제: 구현은 되어 있지만 실제로는 실패 가능성 높음

## 추가 관찰 사항

- 관리자 전용 삭제 API는 별도로 보이지 않음.
- 삭제 버튼은 일반 제작자 화면 기준으로만 연결되어 있음.
- 삭제 실패 시 프론트에서 사용자에게 오류 메시지를 보여주는 처리는 없음. 현재는 성공 시 `router.refresh()`만 수행함.

## 최종 판단

- AI 직원 삭제기능은 "있음"
- 하지만 완전한 삭제기능이라고 보기에는 제한이 있음
- 현재 기준 가장 정확한 표현:

> 초안(`draft`)과 반려(`rejected`) 상태의 AI 직원에 한해 삭제 API와 UI가 존재한다. 다만 `rejected` 상태는 관리자 리뷰 연관 데이터 때문에 실제 삭제가 실패할 가능성이 있다.