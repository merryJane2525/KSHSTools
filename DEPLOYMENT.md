# 배포 가이드 (Equipment Board)

Next.js 16 + Prisma(PostgreSQL) 기반 웹 서비스를 배포하는 방법을 단계별로 정리했습니다.

---

## 1. 사전 준비

### 1.1 필요한 것

- **Node.js** 20.x 이상 (LTS 권장)
- **PostgreSQL** 데이터베이스 (로컬, Neon, Supabase, Railway, AWS RDS 등)
- **Git** (Vercel/GitHub 연동 시)
- (선택) **Vercel** 계정

### 1.2 환경 변수 정리

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 연결 문자열. 예: `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `JWT_SECRET` | ✅ | 세션 JWT 서명용. 32자 이상 랜덤 문자열 권장. |
| `VAPID_PUBLIC_KEY` | 푸시 사용 시 | Web Push 공개 키 (`npx web-push generate-vapid-keys`로 생성) |
| `VAPID_PRIVATE_KEY` | 푸시 사용 시 | Web Push 비밀 키 |
| `ADMIN_EMAIL` | 시드 실행 시 | 초기 관리자 이메일 |
| `ADMIN_PASSWORD` | 시드로 신규 ADMIN 생성 시 | 초기 관리자 비밀번호 |
| `ADMIN_USERNAME` | 선택 | 초기 관리자 username (없으면 이메일 기반 생성) |

- **로컬**: 프로젝트 루트 `web/` 에 `.env` 파일 생성 후 위 변수 입력.
- **Vercel**: 프로젝트 → Settings → Environment Variables 에서 동일 변수 추가 (Production / Preview 구분 가능).

---

## 2. 로컬에서 빌드 확인

배포 전에 로컬에서 프로덕션 빌드가 되는지 확인합니다.

```bash
cd web

# 의존성 설치
npm install

# 환경 변수 로드 ( .env 파일 있음 가정)
# DATABASE_URL, JWT_SECRET 등이 설정되어 있어야 함

# Prisma 클라이언트 생성 + 마이그레이션 적용
npx prisma generate
npx prisma migrate deploy

# (선택) 초기 ADMIN 1명 생성
# .env 에 ADMIN_EMAIL, ADMIN_PASSWORD 설정 후
npm run db:seed

# 프로덕션 빌드
npm run build

# 로컬에서 프로덕션 서버 실행
npm start
```

`http://localhost:3000` 으로 접속해 로그인·기능이 정상인지 확인합니다.

---

## 3. 데이터베이스 준비

### 3.1 PostgreSQL 준비

- **로컬**: PostgreSQL 설치 후 DB/유저 생성.
- **클라우드** 예시:
  - [Neon](https://neon.tech): 무료 티어, 연결 문자열 바로 발급.
  - [Supabase](https://supabase.com): Project Settings → Database → Connection string (URI).
  - [Railway](https://railway.app): PostgreSQL 추가 후 `DATABASE_URL` 복사.

연결 문자열 형식:

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

일부 호스팅은 `sslmode=require` 대신 `sslmode=verify-full` 등을 요구할 수 있습니다.

### 3.2 마이그레이션 적용

배포 환경(또는 배포 전에 한 번)에서 스키마를 적용합니다.

```bash
cd web
export DATABASE_URL="postgresql://..."   # 또는 .env 에 설정
npx prisma migrate deploy
```

- `migrate deploy` 는 기존 마이그레이션만 적용하고 새 파일은 만들지 않습니다.
- 개발용으로 스키마만 맞추고 싶다면 `npx prisma db push` 도 사용 가능 (운영에서는 `migrate deploy` 권장).

### 3.3 초기 ADMIN 생성 (시드)

최초 배포 시 관리자 계정이 없으면, 시드로 1명 생성합니다.

```bash
cd web
# .env 또는 환경 변수에 설정:
# ADMIN_EMAIL=admin@example.com
# ADMIN_PASSWORD=안전한비밀번호
# ADMIN_USERNAME=admin  (선택)

npm run db:seed
# 또는
npx prisma db seed
```

- 해당 이메일 사용자가 **이미 있으면** → 역할만 `ADMIN` 으로 변경 (비밀번호는 `ADMIN_PASSWORD` 가 있으면 갱신).
- **없으면** → `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_USERNAME`(또는 자동)으로 **신규 ADMIN** 생성.

---

## 4. Vercel 배포 (권장)

### 4.1 GitHub 연동

1. 프로젝트를 GitHub 저장소에 푸시합니다.
2. [Vercel](https://vercel.com) 로그인 후 **Add New → Project**.
3. 해당 GitHub 저장소 선택 후 **Import**.

### 4.2 프로젝트 설정

- **Framework Preset**: Next.js (자동 감지)
- **Root Directory**: `web`  
  (저장소 루트가 `Untitle` 이고 앱이 `web/` 안에 있으면 반드시 `web` 지정)
- **Build Command**: `npm run build` (기본값 유지)
- **Output Directory**: 기본값 유지
- **Install Command**: `npm install` (기본값)

### 4.3 환경 변수 설정

Vercel 대시보드: **Project → Settings → Environment Variables** 에서 다음을 추가합니다.

| Name | Value | Environments |
|------|--------|--------------|
| `DATABASE_URL` | `postgresql://...` (실제 연결 문자열) | Production, Preview |
| `JWT_SECRET` | 32자 이상 랜덤 문자열 | Production, Preview |
| `VAPID_PUBLIC_KEY` | (푸시 사용 시) 공개 키 | Production, Preview |
| `VAPID_PRIVATE_KEY` | (푸시 사용 시) 비밀 키 | Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | **검색엔진·공유용** 실제 사이트 URL (예: `https://kshstools.co.kr`) | Production |
| `NAVER_SITE_VERIFICATION` | (선택) 네이버 서치어드바이저 소유확인 코드. 서치어드바이저에서 HTML 태그 방식으로 발급한 `content` 값만 입력 | Production |

- **ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_USERNAME** 은 시드 실행 시에만 필요하므로, Vercel 환경 변수로 넣을 필요는 없습니다. 시드는 로컬 또는 별도 스크립트에서 한 번만 실행하면 됩니다.
- **NEXT_PUBLIC_SITE_URL** 이 없으면 기본값 `https://kshstools.co.kr` 이 사용됩니다. 커스텀 도메인을 쓰면 반드시 이 변수를 실제 공개 URL로 설정하세요. (사이트맵·canonical·OG URL에 사용됨)
- **NAVER_SITE_VERIFICATION**: [네이버 서치어드바이저](https://searchadvisor.naver.com)에서 사이트 소유확인 시 「HTML 태그」 방식을 선택하면 `content="..."` 안의 값만 복사해 이 환경 변수에 넣으면 됩니다. 설정 시 사이트 전역에 `<meta name="naver-site-verification" content="해당값">` 이 자동 삽입됩니다.

### 4.4 배포 실행

- **Deploy** 버튼으로 첫 배포를 실행합니다.
- 이후에는 연결한 브랜치에 `git push` 할 때마다 자동으로 배포됩니다 (Production: 보통 `main` / `master`).

### 4.5 배포 후 DB 마이그레이션·시드

Vercel은 빌드 시 `prisma generate` 만 실행하고, `migrate` / `seed` 는 자동으로 하지 않습니다. 다음 중 하나로 처리합니다.

**방법 A: 로컬에서 운영 DB 대상으로 실행 (가장 간단)**

```bash
cd web
# .env 에 운영용 DATABASE_URL 설정 (Vercel과 동일한 DB)
npx prisma migrate deploy
npm run db:seed   # 필요 시
```

**방법 B: Vercel Build Command 에 migrate 포함 (선택)**

- Build Command 를 다음처럼 변경할 수 있습니다 (DB 접근 가능한 환경이어야 함).  
  `npx prisma generate && npx prisma migrate deploy && next build`
- 이 경우 Vercel 빌드 시 DB에 접속하므로, 방화벽/IP 제한이 있으면 실패할 수 있습니다.  
  Neon·Supabase 등은 보통 외부 접속 허용이므로 사용 가능한 경우가 많습니다.

시드는 **한 번만** 실행하면 되므로, 로컬에서 `DATABASE_URL` 만 운영 DB로 바꿔서 `npm run db:seed` 실행하는 것을 권장합니다.

### 4.6 커스텀 도메인 연결 (https://kshstools.co.kr)

웹사이트를 **https://kshstools.co.kr** 도메인으로 연결하려면 다음 순서로 진행합니다.

1. **Vercel에서 도메인 추가**
   - Vercel 대시보드 → 해당 프로젝트 → **Settings** → **Domains**.
   - **Add** 에 `kshstools.co.kr` 입력 후 추가.
   - (선택) `www.kshstools.co.kr` 도 메인에 추가한 뒤, Vercel에서 기본 도메인을 `kshstools.co.kr` 로 두고 나머지를 리다이렉트하도록 설정할 수 있습니다.

2. **DNS 설정 (도메인 등록한 곳에서)**
   - 도메인 등록업체(가비아, 카페24, Cloudflare, GoDaddy 등)의 DNS 관리 화면으로 이동합니다.
   - Vercel의 **Domains** 화면에 표시된 대로 아래 중 하나로 설정합니다.
     - **A 레코드**:  
       - 호스트: `@` (또는 비워두기)  
       - 값: `76.76.21.21` (Vercel IP, 2024년 기준. Vercel Domains 화면에 표시된 값으로 확인)
     - **CNAME 레코드** (서브도메인만 가능, 루트 도메인은 일부 업체에서만):  
       - 호스트: `@` 또는 `www`  
       - 값: `cname.vercel-dns.com`
   - 루트 도메인(`kshstools.co.kr`)은 보통 **A 레코드** `76.76.21.21` 로 연결하고,  
     `www.kshstools.co.kr` 은 **CNAME** `cname.vercel-dns.com` 으로 연결합니다.
   - Vercel에서 **네임서버 사용**이 가능하다면, 도메인 등록업체에서 네임서버를 Vercel로 변경하면 Vercel이 자동으로 DNS를 관리합니다.

3. **SSL(HTTPS)**
   - Vercel이 도메인 소유를 확인한 뒤 자동으로 SSL 인증서를 발급합니다. 별도 설정 없이 **https://kshstools.co.kr** 로 접속 가능해집니다.

4. **확인**
   - DNS 전파에는 수분~최대 48시간이 걸릴 수 있습니다.
   - **Settings → Domains** 에서 도메인 옆에 초록색 체크가 뜨면 연결 완료입니다.
   - 브라우저에서 `https://kshstools.co.kr` 로 접속해 동작을 확인하세요.

5. **환경 변수**
   - 커스텀 도메인으로 서비스할 경우 Vercel **Environment Variables** 에 `NEXT_PUBLIC_SITE_URL=https://kshstools.co.kr` 를 설정해 두면, 사이트맵·캐노니컬·OG URL이 이 주소로 생성됩니다. (코드 기본값이 이미 `https://kshstools.co.kr` 이므로 미설정 시에도 동일하게 동작합니다.)

---

## 5. 배포 후 확인

1. **접속**: Vercel이 부여한 URL (예: `https://프로젝트명.vercel.app`) 로 접속.
2. **회원가입/로그인**: 가입 후 로그인되는지 확인 (역할은 USER).
3. **관리자**: 시드로 만든 ADMIN 계정으로 로그인 → `/admin/users` 등 관리자 메뉴 접근 가능한지 확인.
4. **푸시 알림 (선택)**: `VAPID_*` 설정한 경우, 알림 페이지에서 「푸시 알림 켜기」 후 실제 알림 수신 여부 확인.

### 5.5 검색엔진 노출 (SEO)

검색엔진에 사이트가 잘 노출되도록 다음을 권장합니다.

1. **NEXT_PUBLIC_SITE_URL 설정**  
   Vercel 환경 변수에 실제 공개 URL을 넣어 두세요 (예: `https://도메인.vercel.app` 또는 커스텀 도메인). 이 값이 사이트맵·canonical·OG URL에 사용됩니다.

2. **사이트맵·robots 확인**  
   배포 후 아래 URL이 정상적으로 열리는지 확인하세요.  
   - `https://도메인/sitemap.xml`  
   - `https://도메인/robots.txt`  
   (robots.txt 안에 sitemap URL이 포함되어 있어야 합니다.)

3. **Google Search Console**  
   - [Google Search Console](https://search.google.com/search-console) 접속 후 사이트 소유권 확인(HTML 파일 업로드 또는 DNS 레코드 등).  
   - 소유권 확인 후 **사이트맵 제출**: Sitemaps 메뉴에서 `https://도메인/sitemap.xml` 제출.  
   - **URL 검사**: 상단 URL 검사에 메인 URL(예: `https://도메인/`) 입력 후 「색인 생성 요청」을 하면 인덱싱이 빨라질 수 있습니다.

4. **네이버 서치어드바이저 (Naver 검색 노출)**  
   - [네이버 서치어드바이저](https://searchadvisor.naver.com) 접속 후 네이버 계정으로 로그인.  
   - **사이트 관리 → 사이트 등록**에서 사이트 URL(예: `https://kshstools.co.kr`) 입력 후 등록.  
   - **소유 확인**: 「HTML 태그」 방식을 선택하면 `<meta name="naver-site-verification" content="xxxxxxxx">` 형태의 태그가 발급됩니다. 이때 `content` 안의 값(`xxxxxxxx`)만 복사해 Vercel 환경 변수 **NAVER_SITE_VERIFICATION** 에 넣고 재배포하면, 사이트에 해당 메타 태그가 자동으로 들어가 소유 확인이 완료됩니다. (HTML 파일 업로드 방식도 가능.)  
   - 소유 확인 후 **요청 → 사이트맵 제출** 메뉴에서 `https://도메인/sitemap.xml` 제출.  
   - 사이트맵 제출 후 약 14~16일 정도 소요 후 네이버 검색에 노출될 수 있습니다.

5. **Bing Webmaster Tools (선택)**  
   [Bing Webmaster Tools](https://www.bing.com/webmasters)에서 동일하게 사이트 등록 후 sitemap URL 제출.

검색 결과에 반영되기까지 며칠~몇 주 걸릴 수 있습니다. Google Search Console·네이버 서치어드바이저에서 각각 사이트맵 제출과 소유 확인을 해 두는 것이 좋습니다.

---

## 6. 문제 해결

### 빌드 실패: `Module not found 'web-push'`

- `web/package.json` 에 `web-push` 가 있는지 확인.
- 저장소에 `node_modules` 가 없이 푸시된 상태에서, Vercel이 `npm install` 을 실행하면 설치됩니다.  
  로컬에서 `cd web && npm install && npm run build` 가 성공하는지 먼저 확인하세요.

### 빌드 실패: `DATABASE_URL is missing`

- Vercel Environment Variables 에 `DATABASE_URL` 가 **Production**(및 사용하는 Preview 환경)에 설정되어 있는지 확인.
- Root Directory 가 `web` 인지 확인 (그래야 `web/` 기준으로 빌드·env 로드).

### 런타임 500: DB 연결 오류

- `DATABASE_URL` 형식이 올바른지, 호스트/포트/DB명/유저/비밀번호가 맞는지 확인.
- 클라우드 DB의 경우 **방화벽/IP 제한** 이 있으면, Vercel IP 대역 허용 또는 “모든 IP 허용” 설정이 필요할 수 있습니다 (Neon 등은 기본으로 허용).
- SSL: `?sslmode=require` 또는 제공처 문서에 맞는 옵션 추가.

### 로그인/세션 안 됨

- `JWT_SECRET` 이 설정되어 있는지, 배포 환경과 동일한 값인지 확인.
- 쿠키: Vercel은 기본 HTTPS 이므로 `secure` 쿠키가 정상 동작합니다.  
  다른 도메인에서 접속한다면 SameSite 등 설정은 코드(`setSessionCookie`)를 참고하세요.

### 관리자 페이지 접근 불가

- 초기 ADMIN 은 **시드로만** 생성됩니다. `ADMIN_EMAIL` / `ADMIN_PASSWORD` 로 `npm run db:seed` 를 한 번 실행했는지 확인.
- 이후 추가 ADMIN 은, 이미 로그인한 ADMIN 이 `/admin/users` 에서 「관리자 승격」으로만 부여할 수 있습니다.

### 푸시 알림이 동작하지 않음

- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` 가 배포 환경에 설정되어 있는지 확인.
- 브라우저가 푸시를 지원하고, **HTTPS**(또는 localhost) 환경인지 확인.
- 알림 페이지에서 「푸시 알림 켜기」 후, 다른 계정으로 해당 사용자를 멘션/댓글 등 해서 실제 발송이 되는지 확인.

---

## 7. 요약 체크리스트

- [ ] PostgreSQL DB 준비 및 `DATABASE_URL` 연결 확인
- [ ] `web/.env` (로컬) 또는 Vercel 환경 변수에 `DATABASE_URL`, `JWT_SECRET` 설정
- [ ] (푸시 사용 시) `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` 생성·설정
- [ ] `npx prisma migrate deploy` 로 스키마 적용
- [ ] (최초 1회) `ADMIN_EMAIL`(+ `ADMIN_PASSWORD` 등) 설정 후 `npm run db:seed` 실행
- [ ] Vercel Root Directory = `web`, 환경 변수 동일하게 설정 후 Deploy
- [ ] 배포 URL 로 접속해 로그인·관리자·푸시(선택) 동작 확인
- [ ] (SEO) Vercel에 `NEXT_PUBLIC_SITE_URL` 설정 후, Google Search Console·네이버 서치어드바이저에서 사이트 등록·sitemap 제출

이 순서대로 진행하면 동일 프로젝트를 안정적으로 배포할 수 있습니다.
