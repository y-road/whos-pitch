import { headers } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { EMAIL_HEADER, UID_HEADER } from './middleware'

/**
 * 지금 로그인한 사용자. 미들웨어가 이미 확인해 헤더로 넘겨 주므로 보통은 Supabase에 다시 묻지 않는다.
 * 헤더가 없을 때만(미들웨어를 거치지 않은 경우) 직접 확인한다.
 */
export async function currentUser(supabase: SupabaseClient): Promise<{ id: string; email: string } | null> {
  const h = await headers()
  const id = h.get(UID_HEADER)
  if (id) {
    let email = ''
    try {
      email = decodeURIComponent(h.get(EMAIL_HEADER) ?? '')
    } catch {
      /* ignore */
    }
    return { id, email }
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? { id: user.id, email: user.email ?? '' } : null
}
