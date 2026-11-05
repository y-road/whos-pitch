'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { emptyState } from '@/lib/roster'
import type { Team } from '@/lib/types'

export const PENDING_TEAM_KEY = 'pendingTeamName'

const GoogleMark = () => (
  <svg className="gmark" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
)

/**
 * 팀 이름 입력 화면.
 * - 로그인 전: 이름을 기억해 두고 구글 로그인으로 보낸다. 로그인 후 /app 에서 팀이 만들어진다.
 * - 로그인 후(팀 없음): 바로 팀을 만든다.
 */
export default function Onboarding({
  signedIn,
  onCreated,
  initialError,
}: {
  signedIn: boolean
  onCreated?: (team: Team) => void
  initialError?: string
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError ?? '')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const teamName = name.trim()
    if (!teamName) {
      setError('팀 이름을 입력해 주세요')
      return
    }
    setBusy(true)
    setError('')
    const supabase = createClient()

    if (signedIn) {
      const { data, error: err } = await supabase
        .from('teams')
        .insert({ name: teamName, state: emptyState() })
        .select('id,name,share_token,state')
        .single()
      if (err) {
        // 이미 팀이 있는 계정이면 그 팀으로 이동
        if (err.code === '23505') {
          router.replace('/app')
          return
        }
        setError('팀을 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
        setBusy(false)
        return
      }
      if (onCreated) onCreated(data as Team)
      else router.replace('/app')
      return
    }

    try {
      localStorage.setItem(PENDING_TEAM_KEY, teamName)
    } catch {
      /* 저장이 막힌 브라우저면 로그인 후 다시 입력하게 된다 */
    }
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (err) {
      setError('구글 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.')
      setBusy(false)
    }
  }

  return (
    <main className="onb">
      <h1>나 오늘 어디 뛰어?</h1>
      <p>
        조기축구 쿼터별 포메이션을 드래그로 짜고,
        <br />
        링크 하나로 팀원에게 공유하세요.
      </p>
      <form onSubmit={submit}>
        <div className="field-in">
          <label htmlFor="teamname">팀 이름을 입력해 주세요</label>
          <input
            id="teamname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="예: 우리 FC"
            autoComplete="off"
            autoFocus
          />
        </div>
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? '이동 중…' : signedIn ? '확인' : (<><GoogleMark />확인 후 구글로 시작하기</>)}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
        {!signedIn && <p className="hint">구글 계정으로 로그인하면 명단과 라인업이 계정에 저장돼요.</p>}
      </form>
    </main>
  )
}
