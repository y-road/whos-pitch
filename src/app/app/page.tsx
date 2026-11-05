import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import type { Team } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AppPage() {
  if (!hasSupabaseEnv()) redirect('/')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: team } = await supabase
    .from('teams')
    .select('id,name,share_token,state')
    .maybeSingle()

  return <AppShell userEmail={user.email ?? ''} initialTeam={(team as Team | null) ?? null} />
}
