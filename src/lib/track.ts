import { createClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/supabase/env'

/**
 * 이탈 측정용 단계 기록. 개인정보 없이 "브라우저별 익명 번호 + 단계 이름"만 남긴다.
 * 같은 단계는 한 번 접속(세션)에 한 번만 기록하고, 실패해도 서비스에는 영향이 없다.
 */
export function track(name: string, props?: Record<string, unknown>) {
  try {
    if (typeof window === 'undefined' || !hasSupabaseEnv()) return
    const key = 'wp_ev_' + name
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    let vid = localStorage.getItem('wp_vid')
    if (!vid) {
      vid = crypto.randomUUID()
      localStorage.setItem('wp_vid', vid)
    }
    void createClient()
      .from('events')
      .insert({ vid, name, props: props ?? {} })
      .then(
        () => {},
        () => {},
      )
  } catch {
    /* 기록이 막힌 환경이면 그냥 넘어간다 */
  }
}
