import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasSupabaseEnv, SUPABASE_KEY, SUPABASE_URL } from './env'

/** 미들웨어가 확인한 로그인 사용자를 페이지에 넘기는 헤더 (페이지가 다시 Supabase에 묻지 않게). 들어오는 값은 항상 지운다. */
export const UID_HEADER = 'x-wp-uid'
export const EMAIL_HEADER = 'x-wp-email'

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const headers = new Headers(request.headers)
  headers.delete(UID_HEADER)
  headers.delete(EMAIL_HEADER)
  if (user) {
    headers.set(UID_HEADER, user.id)
    headers.set(EMAIL_HEADER, encodeURIComponent(user.email ?? ''))
  }

  // 로그인한 사람이 첫 화면('/')으로 오면 바로 앱으로 보낸다 (페이지를 한 번 더 거치지 않도록).
  const { pathname, searchParams } = request.nextUrl
  const out =
    user && pathname === '/' && !searchParams.has('error')
      ? NextResponse.redirect(new URL('/app', request.url))
      : NextResponse.next({ request: { headers } })
  response.cookies.getAll().forEach((c) => out.cookies.set(c))
  return out
}
