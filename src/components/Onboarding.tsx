'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { seedState } from '@/lib/seed'
import type { Team } from '@/lib/types'

export const PENDING_TEAM_KEY = 'pendingTeamName'

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
  const [invalid, setInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const teamName = name.trim()
    if (!teamName) {
      // 위 안내와 같은 문구가 되풀이되지 않도록, 글을 더하지 않고 입력칸만 강조한다.
      setInvalid(true)
      inputRef.current?.focus()
      return
    }
    setInvalid(false)
    setBusy(true)
    setError('')
    const supabase = createClient()

    if (signedIn) {
      const { data, error: err } = await supabase
        .from('teams')
        .insert({ name: teamName, state: seedState() })
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
        터치 몇 번으로 1~4쿼터 포메이션 뚝딱!
        <br />
        링크 하나로 팀원들에게 바로 공유하세요.
      </p>
      <form onSubmit={submit}>
        <div className="field-in">
          <label htmlFor="teamname">팀 이름을 입력해 주세요</label>
          <input
            id="teamname"
            ref={inputRef}
            value={name}
            aria-invalid={invalid}
            style={invalid ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 1px var(--danger)' } : undefined}
            onChange={(e) => {
              setName(e.target.value)
              if (invalid) setInvalid(false)
            }}
            maxLength={20}
            placeholder="대한민국 FC"
            autoComplete="off"
            autoFocus
          />
        </div>
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? '이동 중…' : '확인'}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
        {!signedIn && <p className="hint">구글로 로그인하면 명단과 라인업이 자동 저장되어, 언제 어디서나 바로 꺼내 쓸 수 있어요!</p>}
      </form>
    </main>
  )
}
