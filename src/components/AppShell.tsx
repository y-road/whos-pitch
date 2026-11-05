'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { normalizeState, mercCount, clearSample } from '@/lib/roster'
import type { Team, TeamState } from '@/lib/types'
import Onboarding, { PENDING_TEAM_KEY } from './Onboarding'
import RosterTab from './RosterTab'
import LineupTab from './LineupTab'
import ShareTab from './ShareTab'

type Tab = 'roster' | 'lineup' | 'share'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function AppShell({
  userEmail,
  initialTeam,
}: {
  userEmail: string
  initialTeam: Team | null
}) {
  const [team, setTeam] = useState<Team | null>(initialTeam)
  const [creating, setCreating] = useState(false)

  // 구글 로그인 직후: 첫 화면에서 입력해 둔 팀 이름으로 팀을 만든다.
  useEffect(() => {
    if (team) return
    let pending = ''
    try {
      pending = localStorage.getItem(PENDING_TEAM_KEY) ?? ''
    } catch {
      /* ignore */
    }
    if (!pending.trim()) return
    setCreating(true)
    ;(async () => {
      const { seedState } = await import('@/lib/seed')
      const { data, error } = await createClient()
        .from('teams')
        .insert({ name: pending.trim(), state: seedState() })
        .select('id,name,share_token,state')
        .single()
      if (!error && data) {
        setTeam(data as Team)
        try {
          localStorage.removeItem(PENDING_TEAM_KEY)
        } catch {
          /* ignore */
        }
      }
      setCreating(false)
    })()
  }, [team])

  if (!team) {
    if (creating) {
      return (
        <main className="onb">
          <p>팀을 만드는 중이에요…</p>
        </main>
      )
    }
    return <Onboarding signedIn onCreated={setTeam} />
  }

  return <TeamApp userEmail={userEmail} team={team} />
}

function TeamApp({ userEmail, team }: { userEmail: string; team: Team }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('roster')
  const [name, setName] = useState(team.name)
  const [state, setState] = useState<TeamState>(() => normalizeState(team.state))
  const [token, setToken] = useState(team.share_token)
  const [cur, setCur] = useState(0)
  const [status, setStatus] = useState<SaveStatus>('idle')

  // 자동 저장: 바뀐 뒤 0.7초 쉬면 서버에 저장한다.
  const first = useRef(true)
  const latest = useRef({ name, state })
  latest.current = { name, state }

  const flush = useCallback(async () => {
    const { name: n, state: s } = latest.current
    setStatus('saving')
    const { error } = await createClient()
      .from('teams')
      .update({ name: n.trim() || team.name, state: s })
      .eq('id', team.id)
    setStatus(error ? 'error' : 'saved')
  }, [team.id, team.name])

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setStatus('saving')
    const t = setTimeout(flush, 700)
    return () => clearTimeout(t)
  }, [name, state, flush])

  // 탭을 닫거나 숨기기 직전에 아직 저장 전인 내용이 있으면 바로 저장한다.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && statusRef.current === 'saving') void flush()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [flush])
  const statusRef = useRef(status)
  statusRef.current = status

  async function logout() {
    await createClient().auth.signOut()
    router.replace('/')
    router.refresh()
  }

  // 라인업 편집기는 일부 항목만 돌려주므로, 예시 데이터 표시는 여기서 이어 붙인다.
  const onLineupChange = (next: TeamState) => setState((prev) => (prev.sample ? { ...next, sample: true } : next))

  function startFresh() {
    if (!window.confirm("예시 데이터를 지우고 시작할까요?\n\n1. 선수를 추가하고, 이름을 눌러 참석을 정해요.\n2. '라인업' 탭에서 포메이션을 짜요.\n3. '공유' 탭에서 링크로 팀원에게 보내요.")) return
    setState(clearSample())
    setCur(0)
    setTab('roster')
  }

  const attendCount = state.attend.length
  const statusText =
    status === 'saving' ? '저장 중…' : status === 'saved' ? '저장됨' : status === 'error' ? '저장 실패 — 네트워크를 확인해 주세요' : '계정에 자동 저장돼요'

  return (
    <div className="wrap">
      <header className="top">
        <h1>나 오늘 어디 뛰어?</h1>
        <div className="meta">
          <span>{name || team.name}</span>
          <br />
          참석 {attendCount}명{mercCount(state) ? ` (용병 ${mercCount(state)})` : ''}
        </div>
      </header>

      <div className="stickbar">
        <nav className="tabs" role="tablist" aria-label="화면">
          {(
            [
              ['roster', '명단·참석'],
              ['lineup', '라인업'],
              ['share', '공유'],
            ] as const
          ).map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </nav>
        {state.sample && (
          <div className="banner" role="note">
            <span>예시 데이터로 채워져 있어요. 직접 시작하려면 지워 주세요.</span>
            <button className="btn small primary" onClick={startFresh}>예시 지우고 시작</button>
          </div>
        )}
      </div>

      <div className="acct">
        <span className={`savestate${status === 'error' ? ' bad' : ''}`} role="status">{statusText}</span>
        <span>
          {userEmail}
          <button className="linkbtn" onClick={logout}>로그아웃</button>
        </span>
      </div>


      {tab === 'roster' && <RosterTab teamName={name} onTeamName={setName} state={state} onChange={setState} />}
      {tab === 'lineup' && <LineupTab state={state} cur={cur} onCur={setCur} onChange={onLineupChange} />}
      {tab === 'share' && <ShareTab token={token} onToken={setToken} name={name || team.name} state={state} />}
    </div>
  )
}
