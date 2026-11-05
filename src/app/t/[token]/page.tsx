import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LiveShare from '@/components/LiveShare'
import SetupNotice from '@/components/SetupNotice'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
// 공유 링크는 검색에 노출하지 않는다.
export const metadata: Metadata = { title: '오늘 라인업', robots: { index: false, follow: false } }

/** 팀원이 카톡 링크로 여는 읽기 전용 화면 (로그인 없음). */
export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  if (!hasSupabaseEnv()) return <SetupNotice />
  const { token } = await params
  if (!/^[0-9a-f]{64}$/.test(token)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.rpc('get_shared_team', { p_token: token })
  const row = Array.isArray(data) ? data[0] : null
  if (!row) notFound()

  return <LiveShare token={token} initial={{ name: row.name, state: row.state }} />
}
