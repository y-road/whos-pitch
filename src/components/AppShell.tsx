'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { normalizeState, mercCount, clearSample, rosterOf } from '@/lib/roster'
import { track } from '@/lib/track'
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
        track('team_created')
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
  const [tab, setTab] = useState<Tab>('lineup')
  const [name, setName] = useState(team.name)
  const [state, setState] = useState<TeamState>(() => normalizeState(team.state))
  const [token, setToken] = useState(team.share_token)
  const [cur, setCur] = useState(0)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [toastMsg, setToastMsg] = useState('')
  const [hlKey, setHlKey] = useState(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** 잠깐 떴다 사라지는 안내 */
  const notify = useCallback((msg: string) => {
    setToastMsg(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 4200)
  }, [])
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  // 이탈 측정 + 선수 추가 독려
  useEffect(() => {
    track('app_open')
  }, [])
  const rosterCount = rosterOf(state).length
  const prevCount = useRef(rosterCount)
  useEffect(() => {
    const prev = prevCount.current
    prevCount.current = rosterCount
    if (state.sample || rosterCount <= prev) return
    if (prev < 1 && rosterCount >= 1) track('player_added')
    if (prev < 3 && rosterCount >= 3) track('players_3')
    if (prev < 11 && rosterCount >= 11) track('players_11')
    if (prev < 3 && rosterCount >= 3 && rosterCount < 11) {
      notify(`벌써 ${rosterCount}명이나 추가했어요! 11명까지 마저 채우고 포메이션을 짜 보세요 ⚽`)
    } else if (prev < 11 && rosterCount >= 11) {
      notify('11명 완성! 이제 이름을 눌러 참석을 정하고, 라인업 탭에서 포메이션을 짜 보세요')
    }
  }, [rosterCount, state.sample, notify])
  const prevAttend = useRef(state.attend.length)
  useEffect(() => {
    const prev = prevAttend.current
    prevAttend.current = state.attend.length
    if (!state.sample && prev < 11 && state.attend.length >= 11) track('attend_11')
  }, [state.attend.length, state.sample])
  const firstTab = useRef(true)
  useEffect(() => {
    if (firstTab.current) {
      firstTab.current = false
      return
    }
    if (tab === 'lineup') track('tab_lineup')
    if (tab === 'share') track('tab_share')
  }, [tab])

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
  const lineupEdited = useRef(false)
  const onLineupChange = (next: TeamState) => {
    if (!state.sample) {
      if (!lineupEdited.current) {
        lineupEdited.current = true
        track('lineup_edit')
      }
      if (Object.keys(next.q[0] ?? {}).length >= 11) track('lineup_11')
    }
    setState((prev) => (prev.sample ? { ...next, sample: true } : next))
  }

  function startFresh() {
    if (!window.confirm("예시 데이터가 지워지고 빈 화면에서 시작해요.\n\n이렇게 사용하세요.\n1. 선수를 추가하고, 이름을 눌러 참석을 정해요.\n2. '라인업' 탭에서 포메이션을 짜요.\n3. '공유' 탭에서 링크로 팀원에게 보내요.")) return
    setState(clearSample())
    setCur(0)
    setTab('roster')
    track('sample_cleared')
    setHlKey((k) => k + 1)
    notify('우리 팀 선수들을 추가해 보세요! 쉼표나 줄바꿈으로 여러 명을 한 번에 넣을 수 있어요')
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
          ).map(([key, label], i) => (
            <Fragment key={key}>
              {i > 0 && (
                <span className="steparrow" aria-hidden="true">
                  ›
                </span>
              )}
              <button role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
                <span className="stepno" aria-hidden="true">{i + 1}</span>
                {label}
              </button>
            </Fragment>
          ))}
        </nav>
        {state.sample && (
          <div className="banner" role="note">
            <span>
              {tab === 'lineup'
                ? '선수를 드래그해 포메이션을 구성해보세요. 준비가 되면 예시 데이터를 지우고 시작하세요!'
                : '예시 데이터로 채워져 있어요. 직접 시작하려면 지워 주세요.'}
            </span>
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


      {tab === 'roster' && <RosterTab teamName={name} onTeamName={setName} state={state} onChange={setState} notify={notify} hlKey={hlKey} />}
      {tab === 'lineup' && <LineupTab state={state} cur={cur} onCur={setCur} onChange={onLineupChange} />}
      {tab === 'share' && (
        <ShareTab
          token={token}
          onToken={setToken}
          name={name || team.name}
          state={state}
          onCopied={() => track('share_copy')}
        />
      )}
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
