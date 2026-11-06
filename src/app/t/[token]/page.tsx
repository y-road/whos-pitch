import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import LiveShare from '@/components/LiveShare'
import SetupNotice from '@/components/SetupNotice'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const getShared = cache(async (token: string) => {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_shared_team', { p_token: token })
  return Array.isArray(data) ? data[0] : null
})

// 공유 링크는 검색에 노출하지 않는다. 카카오톡 미리보기에는 팀 이름과 안내 문구를 보여 준다.
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const base: Metadata = { robots: { index: false, follow: false } }
  if (!hasSupabaseEnv() || !/^[0-9a-f]{64}$/.test(token)) return { ...base, title: '오늘 라인업' }
  const row = await getShared(token)
  const title = row?.name ? `${row.name} 오늘 라인업` : '오늘 라인업'
  const description = '내 포지션 확인하세요. 라인업이 바뀌면 이 링크에 바로 반영돼요.'
  return {
    ...base,
    title,
    description,
    openGraph: { type: 'website', title, description, images: [{ url: '/og/team.png', width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og/team.png'] },
  }
}

/** 팀원이 카톡 링크로 여는 읽기 전용 화면 (로그인 없음). */
export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  if (!hasSupabaseEnv()) return <SetupNotice />
  const { token } = await params
  if (!/^[0-9a-f]{64}$/.test(token)) notFound()

  const row = await getShared(token)
  if (!row) notFound()

  return <LiveShare token={token} initial={{ name: row.name, state: row.state }} />
}
