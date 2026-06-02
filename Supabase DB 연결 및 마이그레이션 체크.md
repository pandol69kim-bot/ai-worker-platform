# Supabase DB 연결 및 마이그레이션 체크

## 1. 현재 확인된 상태

2026-06-02 기준으로 현재 프로젝트에서 확인된 내용입니다.

- `prisma/schema.prisma`의 datasource provider는 `postgresql`
- `src/lib/db.ts`는 `@prisma/adapter-pg` 기반으로 동작
- `prisma.config.ts`는 `DATABASE_URL`과 `DIRECT_URL`을 모두 사용하도록 설정됨
- `.env.example`은 Supabase PostgreSQL 형식으로 작성되어 있음
- `npx prisma generate`는 정상 완료됨

즉, **애플리케이션 코드 기준으로는 SQLite에서 Supabase PostgreSQL로 전환된 상태**입니다.

## 2. 현재 구조에서 중요한 포인트

Supabase 연결에서는 URL 용도가 나뉩니다.

- `DATABASE_URL`: 앱 런타임 연결용
- `DIRECT_URL`: Prisma 마이그레이션/직접 연결용

현재 `.env.example` 기준 예시는 아래 형식입니다.

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

해석:

- `6543`: Supabase pooler 주소, 앱 연결용
- `5432`: direct 주소, Prisma migrate 용

## 3. 연결 체크 항목

### 3.1 환경변수 체크

아래 값이 실제 `.env`에 있어야 합니다.

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

확인 포인트:

- `DATABASE_URL`은 pooler 주소인지
- `DIRECT_URL`은 `db.[project-ref].supabase.co:5432` 직결 주소인지
- 비밀번호가 URL 인코딩 이슈 없이 정확한지
- Supabase 프로젝트가 일시정지 상태가 아닌지

### 3.2 Prisma 설정 체크

현재 설정 기준:

- `prisma/schema.prisma` -> `provider = "postgresql"`
- `prisma.config.ts` -> `schema = "prisma/schema.prisma"`
- `prisma.config.ts` -> `migrations.path = "prisma/migrations"`

즉, Prisma의 기준 스키마는 **루트의 `prisma/schema.prisma`** 입니다.

### 3.3 런타임 DB 연결 체크

현재 `src/lib/db.ts`는 아래 방식입니다.

- `process.env.DATABASE_URL` 사용
- `PrismaPg` 어댑터 사용

즉, 앱 실행 중 DB 접속은 `DATABASE_URL` 기준입니다.

## 4. 마이그레이션 상태 체크

현재 직접 확인한 상태는 아래와 같습니다.

- 루트 `prisma/schema.prisma`는 PostgreSQL 상태
- 루트 `prisma/migrations` 폴더는 현재 보이지 않음
- 대신 `prisma/prisma/` 하위에 예전 SQLite 스키마/마이그레이션 흔적이 남아 있음

이 의미는 다음과 같습니다.

1. 현재 운영 기준으로 써야 하는 Prisma 기준 파일은 `prisma/schema.prisma`
2. 예전 SQLite 흔적은 `prisma/prisma/*` 아래에 남아 있어 혼동 가능성 있음
3. 루트 `prisma/migrations`가 없으면 아직 PostgreSQL용 초기 마이그레이션이 확정되지 않았을 가능성이 큼

## 5. 우선 실행할 체크 명령

아래 순서로 확인하면 됩니다.

### 5.1 Prisma Client 생성 확인

```bash
npx prisma generate
```

정상 기준:

- 에러 없이 완료
- 생성된 client가 `postgresql` 기준으로 생성됨

### 5.2 DB 연결/마이그레이션 상태 확인

```bash
npx prisma migrate status
```

확인할 것:

- 현재 DB 연결 성공 여부
- 적용된 migration 존재 여부
- migration drift 여부

### 5.3 아직 루트 migration이 없다면 초기 migration 생성

개발 환경에서 최초 1회:

```bash
npx prisma migrate dev --name init
```

예상 결과:

- 루트 `prisma/migrations/...` 생성
- Supabase DB에 현재 스키마 반영

### 5.4 운영/배포 환경에서는 deploy 사용

```bash
npx prisma migrate deploy
```

주의:

- 운영 서버에서는 `migrate dev` 대신 `migrate deploy`를 사용
- 이때 `DIRECT_URL`이 올바르게 설정되어 있어야 함

## 6. Seed 체크

마이그레이션 후 기본 데이터가 필요하면 아래를 실행합니다.

```bash
npx prisma db seed
```

확인할 것:

- 관리자 계정 생성 여부
- 메이커 계정 생성 여부
- 샘플 AI Worker 생성 여부

## 7. 애플리케이션 실행 체크

DB 마이그레이션 후 아래를 확인합니다.

```bash
npm run dev
```

체크 항목:

- 로그인 화면 진입 가능
- 회원가입 가능
- 대시보드 진입 가능
- 관리자 승인 API 동작
- 구매/리뷰/실행 API에서 DB 오류 없는지 확인

## 8. 현재 주의할 점

### 8.1 예전 SQLite 흔적이 남아 있음

현재 워크스페이스에는 아래 예전 파일이 남아 있을 수 있습니다.

- `prisma/prisma/schema.prisma`
- `prisma/prisma/migrations/*`
- `dev.db`
- `prisma/dev.db`

이 파일들은 현재 PostgreSQL 전환 이후에는 혼동을 만들 수 있습니다.

권장:

- 실제 PostgreSQL 마이그레이션이 안정적으로 완료된 뒤 정리
- 정리 전에는 삭제 대상이 맞는지 한 번 더 확인

### 8.2 Prisma 기준 스키마는 하나로 유지해야 함

현재 기준으로는 `prisma/schema.prisma`만 기준으로 써야 합니다.

같은 저장소 안에 SQLite용 스키마와 PostgreSQL용 스키마가 동시에 남아 있으면 아래 문제가 생깁니다.

- 어떤 schema로 `generate` 했는지 헷갈림
- 잘못된 provider 기반 client 생성 가능
- 런타임 초기화 오류 재발 가능

## 9. 권장 체크리스트

- [x] `prisma/schema.prisma`가 `postgresql`인지 확인
- [x] `src/lib/db.ts`가 `PrismaPg`인지 확인
- [x] `.env.example`에 `DATABASE_URL`, `DIRECT_URL` 형식 반영 확인
- [x] `npx prisma generate` 성공 확인
- [ ] `npx prisma migrate status` 확인
- [ ] 필요 시 `npx prisma migrate dev --name init` 실행
- [ ] `npx prisma migrate deploy` 기준 운영 절차 정리
- [ ] `npx prisma db seed` 확인
- [ ] `npm run dev`로 실제 기능 확인
- [ ] 중복 SQLite 흔적 정리

## 10. 추천 다음 순서

현재 상태에서는 아래 순서가 가장 안전합니다.

1. `npx prisma migrate status` 실행
2. 루트 migration이 없으면 `npx prisma migrate dev --name init` 실행
3. `npx prisma db seed` 실행
4. `npm run dev`로 로그인/대시보드/API 확인
5. 문제 없으면 예전 SQLite 흔적 정리

## 11. 한 줄 결론

현재 코드는 이미 Supabase PostgreSQL 연결 구조로 넘어와 있습니다. 다만 **루트 마이그레이션 확정 여부와 예전 SQLite 흔적 정리**가 남아 있으므로, 다음 핵심 체크는 `prisma migrate status`와 초기 migration 정리입니다.