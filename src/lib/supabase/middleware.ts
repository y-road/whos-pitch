import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasSupabaseEnv, SUPABASE_KEY, SUPABASE_URL } from './env'

/** 요청마다 로그인 세션 쿠키를 갱신한다. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!hasSupabaseEnv()) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // 토큰이 만료됐으면 여기서 갱신된다. getUser 호출을 지우지 말 것.
  await supabase.auth.getUser()
  return response
}
