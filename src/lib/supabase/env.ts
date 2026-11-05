// 대시보드의 REST 주소(.../rest/v1/)를 그대로 붙여 넣어도 동작하도록 프로젝트 주소만 남긴다.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '')
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** 구글 로그인(Google Identity Services)용 웹 클라이언트 ID. 비어 있으면 기존 방식(signInWithOAuth)으로 로그인한다. */
export const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '').trim()

/** Supabase 연결 정보가 설정되어 있는지 (처음 배포할 때 안내 화면을 띄우기 위함) */
export function hasSupabaseEnv(): boolean {
  return SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 10
}
