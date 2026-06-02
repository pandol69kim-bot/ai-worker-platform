# AI 전문가 목록에 나오는 이미지를 바꾸는 방법

## 현재 구조

AI 전문가 목록 카드의 이미지는 현재 DB 이미지가 아니라, 코드에 고정된 이모지로 출력되고 있습니다.

현재 렌더 위치:
- [src/app/market/page.tsx](src/app/market/page.tsx)

현재 코드:

```tsx
<div className="aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
  <span className="text-4xl">🤖</span>
</div>
```

즉, 지금 목록에 보이는 이미지를 바꾸려면 이 부분을 수정해야 합니다.

## 방법 1. 전체 목록 이미지를 한 번에 같은 이미지로 바꾸기

가장 쉬운 방법입니다.

1. 원하는 이미지를 `public` 폴더에 넣습니다.
2. [src/app/market/page.tsx](src/app/market/page.tsx) 에서 `🤖` 부분을 이미지 태그로 바꿉니다.

예시:

```tsx
import Image from "next/image";

<div className="aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
  <Image
    src="/worker-default.png"
    alt="AI 직원 기본 이미지"
    width={120}
    height={120}
    className="h-20 w-20 object-contain"
  />
</div>
```

예를 들어 아래 파일을 넣으면 됩니다.

```text
public/worker-default.png
```

이 방법의 특징:
- 모든 AI 전문가 카드가 같은 이미지로 보임
- 가장 빠르게 화면을 바꿀 수 있음
- 데이터베이스 수정이 필요 없음

## 방법 2. AI마다 다른 이미지를 보이게 하기

현재 스키마에는 이미 썸네일 필드가 있습니다.

위치:
- [prisma/schema.prisma](prisma/schema.prisma)

필드:

```prisma
thumbnail String?
```

즉, 구조상으로는 AI마다 다른 이미지를 붙일 수 있습니다. 다만 현재 마켓 목록 페이지에서는 이 필드를 아직 사용하지 않고 있습니다.

### 2-1. 목록 조회에 thumbnail 추가

현재 [src/app/market/page.tsx](src/app/market/page.tsx) 의 `findMany` 결과에는 `thumbnail`을 별도로 고르지 않아도 기본적으로 포함되지만, 코드 의도를 분명히 하려면 목록 카드 렌더에서 `worker.thumbnail`을 사용하도록 바꾸면 됩니다.

예시 렌더 방식:

```tsx
import Image from "next/image";

<div className="aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center overflow-hidden">
  {worker.thumbnail ? (
    <Image
      src={worker.thumbnail}
      alt={worker.title}
      width={640}
      height={360}
      className="h-full w-full object-cover"
    />
  ) : (
    <span className="text-4xl">🤖</span>
  )}
</div>
```

이렇게 하면:
- `thumbnail` 값이 있는 AI는 실제 이미지 표시
- 없는 AI는 기존 `🤖` 이모지 유지

### 2-2. 썸네일 값 넣는 방법

`thumbnail`에는 보통 아래 둘 중 하나를 저장합니다.

1. `public` 기준 경로

```text
/workers/barbecue.png
```

2. 외부 이미지 URL

```text
https://example.com/images/barbecue.png
```

외부 URL을 쓸 경우에는 Next.js 이미지 설정도 함께 확인해야 합니다.

관련 파일:
- [next.config.ts](next.config.ts)

## 현재 프로젝트 기준으로 가장 현실적인 방법

지금 상태에서 가장 쉬운 순서는 아래입니다.

1. 먼저 공통 기본 이미지를 `public`에 추가
2. [src/app/market/page.tsx](src/app/market/page.tsx) 의 `🤖`를 `Image`로 교체
3. 이후 필요하면 `worker.thumbnail` 기반으로 확장

이 순서가 좋은 이유:
- 바로 화면이 바뀜
- 리스크가 작음
- 나중에 개별 썸네일 구조로 자연스럽게 확장 가능

## 같이 보면 좋은 위치

- 목록 카드: [src/app/market/page.tsx](src/app/market/page.tsx)
- 상세 페이지 상단 아이콘: [src/app/market/[id]/page.tsx](src/app/market/[id]/page.tsx)
- DB 스키마: [prisma/schema.prisma](prisma/schema.prisma)

## 주의사항

- 현재 상세 페이지도 상단에서 `🤖`를 따로 쓰고 있어서, 목록만 바꾸면 상세 페이지 아이콘은 그대로 남을 수 있습니다.
- 외부 이미지 URL을 사용할 경우 Next Image 설정이 추가로 필요할 수 있습니다.
- 카드 디자인에 맞게 `object-cover` 또는 `object-contain` 중 하나를 선택해야 합니다.

## 한 줄 요약

지금 목록 이미지는 DB가 아니라 [src/app/market/page.tsx](src/app/market/page.tsx) 안의 `🤖` 하드코딩입니다. 가장 빠른 방법은 `public` 이미지로 교체하는 것이고, 제대로 확장하려면 `AIWorker.thumbnail`을 목록 카드에 연결하면 됩니다.