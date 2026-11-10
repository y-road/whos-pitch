import { headers } from 'next/headers'
import Onboarding from '@/components/Onboarding'
import SetupNotice from '@/components/SetupNotice'
import { detectInApp } from '@/lib/auth-helpers'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import { currentUser } from '@/lib/supabase/user'

export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!hasSupabaseEnv()) return <SetupNotice />

  const supabase = await createClient()
  const user = await currentUser(supabase)
  // 로그인한 사람은 미들웨어가 이미 /app 으로 보낸다. 여기까지 왔다면(오류 표시 등) 아래 화면을 그대로 보여 준다.

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
