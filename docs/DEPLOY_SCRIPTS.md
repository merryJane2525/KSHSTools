# 배포·DB 스크립트 가이드 (GitHub + Vercel)

프로젝트 루트가 `web/` 이라고 가정합니다. 터미널에서 **반드시 `web` 폴더로 이동한 뒤** 아래 명령을 실행하세요.

---

## 1. 로컬 개발

| 목적 | 명령 | 설명 |
|------|------|------|
| 앱 실행 | `npm run dev` | Next.js 개발 서버 (기본 `http://localhost:3000`) |
| DB GUI | `npm run prisma:studio` | Prisma Studio로 DB 내용 확인/수정 |
| 린트 | `npm run lint` | ESLint 실행 |

```bash
cd web
npm run dev
```

---

## 2. DB 스키마 (Prisma)

| 목적 | 명령 | 언제 쓰나요 |
|------|------|-------------|
| 마이그레이션 **생성** | `npm run db:migrate` | 스키마를 바꾼 뒤, 새 migration 파일을 만들 때 |
| 스키마만 **반영** | `npm run db:push` | 프로토타입/개발 DB를 빠르게 맞출 때 (migration 파일 없이) |
| 시드 데이터 | `npm run db:seed` | 초기 데이터 넣을 때 (seed 설정된 경우) |
| 클라이언트만 생성 | `npm run prisma:generate` | 코드에서 Prisma 타입만 갱신할 때 (보통 빌드 시 자동) |

### 마이그레이션 한 번에 하기 (추천)

```bash
cd web
npm run db:migrate
```

- `prisma/schema.prisma` 수정 후 실행하면, 새 migration 파일이 생기고 **로컬 DB**에 적용됩니다.
- 마이그레이션 이름을 물어보면 적당히 입력 (예: `add_reservation_fields`).

### migration 없이 스키마만 맞추기

```bash
cd web
npm run db:push
```

- migration 파일은 만들지 않고, 현재 스키마를 DB에 그대로 반영합니다. (개발/스테이징에서만 권장)

---

## 3. 빌드 (로컬에서 확인)

| 목적 | 명령 | 설명 |
|------|------|------|
| 프로덕션 빌드 | `npm run build` | `prisma generate` 후 `next build` (Vercel과 동일) |
| 프로덕션 실행 | `npm run start` | 빌드 결과물로 서버 실행 (배포 환경과 비슷하게 테스트) |

```bash
cd web
npm run build
npm run start
```

---

## 4. GitHub에 올리기

```bash
cd web   # 또는 프로젝트 루트가 web이면 그 루트에서
git add .
git status
git commit -m "메시지"
git push origin main
```

- `prisma/migrations/` 폴더까지 포함해서 push 하면, Vercel 빌드 시 같은 스키마를 쓰게 됩니다.
- **실제 DB에 마이그레이션 적용**은 아래 5번에서 별도로 해야 합니다.

---

## 5. 배포 DB에 마이그레이션 적용 (중요)

Vercel은 **빌드 시 `prisma generate`만** 하고, **`prisma migrate deploy`는 실행하지 않습니다.**  
그래서 **배포용 DB**에는 아래 중 한 가지 방법으로 직접 마이그레이션을 적용해야 합니다.

### 방법 A: 로컬에서 배포 DB에 적용 (가장 간단)

1. Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables** 에서  
   배포용 `DATABASE_URL` 값을 복사합니다.
2. 로컬에 `.env` 또는 `.env.production`을 만들고 그 URL을 넣습니다.

   ```env
   DATABASE_URL="postgresql://..."
   ```

3. **그 URL로** 마이그레이션 적용:

   ```bash
   cd web
   npx prisma migrate deploy
   ```

- `migrate deploy`는 **기존 migration 파일만** 적용하고, 새 파일은 만들지 않습니다.
- 스키마를 바꾼 뒤에는 먼저 로컬에서 `npm run db:migrate`로 migration 파일을 만들고, push 한 다음, 위처럼 배포 DB에 `migrate deploy`를 실행하면 됩니다.

### 방법 B: Vercel 빌드 시 자동 적용

빌드할 때마다 마이그레이션까지 적용하고 싶다면, `package.json`의 `build` 스크립트를 다음처럼 바꿉니다.

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

- Vercel 빌드 시 **배포 환경의 `DATABASE_URL`**로 `prisma migrate deploy`가 실행됩니다.
- DB가 한 곳이고, 배포가 자주 없다면 이 방법이 편할 수 있습니다.

---

## 6. 스크립트 한눈에 보기

| 단계 | 명령 | 비고 |
|------|------|------|
| 1. 스키마 수정 | `prisma/schema.prisma` 편집 | - |
| 2. 마이그레이션 생성 | `npm run db:migrate` | `web` 폴더에서 |
| 3. 로컬 DB 적용 | 위 명령에 포함됨 | - |
| 4. 코드 푸시 | `git add . && git commit && git push` | migration 폴더 포함 |
| 5. 배포 DB 적용 | `npx prisma migrate deploy` (배포용 `DATABASE_URL` 넣고) | 방법 A 또는 B |
| 6. Vercel 빌드 | GitHub push 시 자동 | 또는 수동 Deploy |

---

## 7. 새로 추가한 필드가 있을 때 (예: 예약 화면용)

이전에 스키마에만 넣고 migration을 안 만들었다면, 한 번에 하려면:

```bash
cd web
npm run db:migrate
```

이름 입력 시 예: `add_reservation_display_fields`  
그 다음:

1. `git add prisma/migrations`
2. `git commit` / `git push`
3. 배포 DB에서 `npx prisma migrate deploy` (방법 A) 또는 Vercel build에 `migrate deploy` 포함 (방법 B)

이렇게 하면 로컬·배포 DB 모두 새 필드가 반영됩니다.
