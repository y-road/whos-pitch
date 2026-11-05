import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Onboarding from '@/components/Onboarding'
import SetupNotice from '@/components/SetupNotice'
import { detectInApp } from '@/lib/auth-helpers'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!hasSupabaseEnv()) return <SetupNotice />

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: team } = await supabase.from('teams').select('id').maybeSingle()
    if (team) redirect('/app')
  }

  const { error } = await searchParams
  // 카카오톡 등 앱 안의 브라우저인지 서버에서 먼저 알아 두면, 화면이 깜빡이지 않고 처음부터 맞게 보인다.
  const inApp = detectInApp((await headers()).get('user-agent') ?? '')
  return (
    <Onboarding
      signedIn={!!user}
      initialInApp={inApp}
      initialError={error ? '로그인에 실패했어요. 다시 시도해 주세요.' : undefined}
    />
  )
}
