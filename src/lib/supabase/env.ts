export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Supabase 연결 정보가 설정되어 있는지 (처음 배포할 때 안내 화면을 띄우기 위함) */
export function hasSupabaseEnv(): boolean {
  return SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 10
}
