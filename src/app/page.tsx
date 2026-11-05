import { redirect } from 'next/navigation'
import Onboarding from '@/components/Onboarding'
import SetupNotice from '@/components/SetupNotice'
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
  return (
    <Onboarding
      signedIn={!!user}
      initialError={error ? '로그인에 실패했어요. 다시 시도해 주세요.' : undefined}
    />
  )
}
