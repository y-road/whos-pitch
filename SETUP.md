# 설정 가이드 — 나 오늘 어디 뛰어?

순서대로 하시면 됩니다. 처음이면 30~40분 정도 걸려요. 막히면 그 화면을 캡처해서 알려 주세요.

## 0. 준비물
- 구글 계정 (로그인용 + Google Cloud 용)
- GitHub 계정, Supabase 계정, Vercel 계정 (모두 무료로 시작, 구글/깃허브로 가입 가능)

## 1. 코드를 GitHub에 올리기
1. https://github.com/new 에서 새 저장소 만들기 (이름 예: `lineup-app`, Private 권장)
2. 받은 zip을 풀어서 폴더 안에서 터미널로:
   ```
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/내아이디/lineup-app.git
   git push -u origin main
   ```
   (터미널이 어려우면 GitHub 저장소 화면의 **uploading an existing file** 로 폴더 안 파일을 끌어다 놓아도 됩니다. `node_modules`, `.next` 폴더는 올리지 마세요.)

## 2. Supabase 프로젝트 만들기
1. https://supabase.com → **New project**
   - Name: lineup / Region: **Northeast Asia (Seoul)** / DB 비밀번호는 따로 저장
2. 왼쪽 **SQL Editor → New query** → 폴더의 `supabase/migrations/0001_init.sql` 내용 전체를 붙여넣고 **Run** (Success 확인)
3. **Project Settings → API** 에서 아래 두 값을 메모
   - `Project URL`
   - `anon public` 키

## 3. Google 로그인 만들기
1. https://console.cloud.google.com → 상단 프로젝트 선택 → **새 프로젝트** (이름 예: lineup)
2. **API 및 서비스 → OAuth 동의 화면**
   - 사용자 유형 **외부** → 앱 이름 `나 오늘 어디 뛰어?`, 지원 이메일/개발자 연락처 입력 → 저장
   - 게시 상태가 *테스트*면 **테스트 사용자**에 주장님 구글 계정을 추가 (또는 **앱 게시**로 바꾸면 누구나 로그인 가능)
3. **사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID** → 유형 **웹 애플리케이션**
   - **승인된 리디렉션 URI**: Supabase의 **Authentication → Providers → Google** 화면 맨 위에 보이는 `Callback URL (for OAuth)` 값을 그대로 붙여넣기 (`https://<프로젝트>.supabase.co/auth/v1/callback`)
4. 만들어진 **클라이언트 ID / 클라이언트 보안 비밀번호**를 Supabase **Authentication → Providers → Google**에 입력 → **Enable** → Save

## 4. Vercel 배포
1. https://vercel.com → **Add New → Project** → 1번에서 만든 저장소 선택 (Framework: Next.js 자동 인식)
2. **Environment Variables** 에 두 개 추가
   | 이름 | 값 |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | 2-3에서 메모한 Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 2-3에서 메모한 anon public 키 |
3. **Deploy** → 끝나면 `https://xxxx.vercel.app` 주소가 나옵니다 (이걸 알려 주세요)

## 5. 배포 주소를 Supabase에 등록 (중요)
Supabase **Authentication → URL Configuration**
- **Site URL**: `https://xxxx.vercel.app`
- **Redirect URLs**에 추가: `https://xxxx.vercel.app/auth/callback` 와 `http://localhost:3000/auth/callback`

## 6. 확인하기
1. 배포 주소 접속 → 팀 이름 입력 → 확인 → 구글 로그인
2. **명단·참석** 탭에서 팀 이름이 채워져 있는지 확인, 선수 몇 명 추가
3. **라인업** 탭에서 선수를 끌어 배치
4. **공유** 탭에서 링크 복사 → 로그인하지 않은 다른 브라우저(시크릿 창)나 폰에서 열기
5. 라인업을 고치면 15초 안에(앱을 다시 열면 바로) 공유 화면에 반영되는지 확인

## 자주 막히는 곳
- 로그인 후 `/?error=auth` 로 돌아옴 → 5번의 Redirect URLs 또는 3-3의 리디렉션 URI 오타 확인
- `redirect_uri_mismatch` → 3-3 리디렉션 URI가 Supabase의 Callback URL과 정확히 같은지 확인
- "Supabase 설정이 필요해요" 화면 → Vercel 환경변수 이름/값 확인 후 **Redeploy**
- 공유 링크가 열리지 않음 → 2-2의 SQL이 끝까지 실행됐는지 확인

## 로컬에서 돌려 보기 (선택)
```
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:3000
```
