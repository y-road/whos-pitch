import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** 구글 로그인이 끝나고 돌아오는 주소. 인증 코드를 세션으로 바꾼 뒤 /app 으로 보낸다. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/app`)
  }
  return NextResponse.redirect(`${origin}/?error=auth`)
}
