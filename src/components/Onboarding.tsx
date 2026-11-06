'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { seedState } from '@/lib/seed'
import { track } from '@/lib/track'
import { detectInApp, type InApp } from '@/lib/auth-helpers'
import type { Team } from '@/lib/types'
import GoogleLoginButton from './GoogleLoginButton'
import InAppNotice from './InAppNotice'

export const PENDING_TEAM_KEY = 'pendingTeamName'

function LegalLinks() {
  return (
    <footer className="legal-links">
      <Link href="/terms">이용약관</Link>
      <span aria-hidden="true">·</span>
      <Link href="/privacy">개인정보처리방침</Link>
    </footer>
  )
}

/**
 * 팀 이름 입력 화면.
 * - 로그인 전: 이름을 확인한 뒤 구글 로그인 단계를 보여 준다. 이름은 기억해 두고, 로그인 후 /app 에서 팀이 만들어진다.
 * - 로그인 후(팀 없음): 바로 팀을 만든다.
 */
export default function Onboarding({
  signedIn,
  onCreated,
  initialError,
  initialInApp = null,
}: {
  signedIn: boolean
  onCreated?: (team: Team) => void
  initialError?: string
  initialInApp?: InApp
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError ?? '')
  const [invalid, setInvalid] = useState(false)
  const [step, setStep] = useState<'name' | 'login'>('name')
  /** 이미 아이디(구글 계정)가 있는 기존 회원이 팀 이름 입력 없이 바로 로그인하는 경우 */
  const [returning, setReturning] = useState(false)
  const [inApp, setInApp] = useState<InApp>(initialInApp)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const found = detectInApp(navigator.userAgent)
    setInApp(found)
    let ref = ''
    try {
      ref = document.referrer ? new URL(document.referrer).host : ''
    } catch {
      /* ignore */
    }
    track('landing_view', { ref, inapp: found?.kind ?? null })
    if (found?.kind === 'kakao' && !signedIn) track('inapp_blocked')
  }, [signedIn])

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
    setError('')

    if (!signedIn) {
      try {
        localStorage.setItem(PENDING_TEAM_KEY, teamName)
      } catch {
        /* 저장이 막힌 브라우저면 로그인 후 다시 입력하게 된다 */
      }
      track('name_submitted')
      setStep('login')
      return
    }

    setBusy(true)
    const { data, error: err } = await createClient()
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
    track('team_created')
    if (onCreated) onCreated(data as Team)
    else router.replace('/app')
  }

  function goReturning() {
    // 팀 이름을 새로 입력하지 않으므로, 이전에 남은 임시 이름이 있으면 지운다.
    try {
      localStorage.removeItem(PENDING_TEAM_KEY)
    } catch {
      /* ignore */
    }
    setInvalid(false)
    setError('')
    track('returning_click')
    setReturning(true)
    setStep('login')
  }

  function backToName() {
    setReturning(false)
    setError('')
    setStep('name')
  }

  // 카카오톡 안에서는 구글 로그인이 막히므로, 로그인 전에는 외부 브라우저 안내만 보여 준다.
  const kakaoBlocked = inApp?.kind === 'kakao' && !signedIn

  if (step === 'login') {
    return (
      <main className="onb">
        <h1>{returning ? '나 오늘 어디 뛰어?' : name.trim()}</h1>
        <p>{returning ? '구글로 로그인하면 저장해 둔 팀이 바로 열려요.' : '구글로 로그인하고 시작하세요.'}</p>
        <div className="onb-actions">
          {inApp && <InAppNotice inApp={inApp} />}
          {inApp?.kind !== 'kakao' && <GoogleLoginButton onError={setError} />}
          <button className="btn" type="button" onClick={backToName}>
            {returning ? '처음으로' : '팀 이름 다시 입력'}
          </button>
          {error && <p className="error" role="alert">{error}</p>}
          {!returning && <p className="hint">구글로 로그인하면 명단과 라인업이 자동 저장되어, 언제 어디서나 바로 꺼내 쓸 수 있어요!</p>}
        </div>
        <LegalLinks />
      </main>
    )
  }

  return (
    <main className="onb">
      <h1>나 오늘 어디 뛰어?</h1>
      <p>
        터치 몇 번으로 1~4쿼터 포메이션 뚝딱!
        <br />
        링크 하나로 팀원들에게 바로 공유하세요.
      </p>
      {kakaoBlocked ? (
        <div className="onb-actions">
          <InAppNotice inApp={inApp!} />
        </div>
      ) : (
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
          {!signedIn && (
            <button className="btn" type="button" onClick={goReturning} disabled={busy}>
              아이디가 이미 있어요
            </button>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      )}
      <LegalLinks />
    </main>
  )
}
