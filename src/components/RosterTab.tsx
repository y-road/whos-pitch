'use client'

import { useEffect, useRef, useState } from 'react'
import {
  addPlayers,
  clearAttend,
  mercCount,
  removePlayer,
  rosterOf,
  selectAll,
  setAttend,
  setSortDir,
} from '@/lib/roster'
import type { TeamState } from '@/lib/types'

/** 마지막 글자에 받침이 있으면 true (을/를 선택용) */
function hasFinal(name: string) {
  const c = name.trim().charCodeAt(name.trim().length - 1)
  return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : false
}

/** 자리 수(slots)를 인원(n)으로 나눈 분배: 몫만큼은 모두, 나머지 자리만큼의 사람이 한 쿼터 더 뛴다. 4쿼터가 상한. */
function split(slots: number, n: number) {
  const base = Math.min(4, Math.floor(slots / n))
  const more = base >= 4 ? 0 : slots - base * n
  const avg = Math.round(Math.min(4, slots / n) * 10) / 10
  return { avg, base, more, rest: n - more }
}
function QuotaRows({ slots, n, gk }: { slots: number; n: number; gk?: boolean }) {
  const { avg, base, more, rest } = split(slots, n)
  const rows: { q: number; n: number; gk?: boolean }[] = []
  if (gk) rows.push({ q: 4, n: 1, gk: true })
  if (more > 0) rows.push({ q: base + 1, n: more })
  if (rest > 0) rows.push({ q: base, n: rest })
  return (
    <>
      <p className="qavg">인당 평균 <b>{avg}쿼터</b></p>
      <ul className="qrows">
        {rows.map((r) => (
          <li key={(r.gk ? 'g' : '') + r.q}>
            <span className="qbar" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <i key={i} className={i < r.q ? 'on' : ''} />)}
            </span>
            <span className="qq">{r.q}쿼터</span>
            <span className="qn">{r.gk ? 'GK ' : ''}<b>{r.n}</b>명</span>
          </li>
        ))}
      </ul>
    </>
  )
}

export default function RosterTab({
  teamName,
  onTeamName,
  state,
  onChange,
  notify,
  hlKey = 0,
}: {
  teamName: string
  onTeamName: (name: string) => void
  state: TeamState
  onChange: (next: TeamState) => void
  notify?: (msg: string) => void
  /** 값이 바뀔 때마다 '선수 추가' 영역을 잠깐 강조한다 */
  hlKey?: number
}) {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [quotaOpen, setQuotaOpen] = useState(false)
  const [hl, setHl] = useState(false)
  const addRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!hlKey) return
    setHl(true)
    addRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const t = setTimeout(() => setHl(false), 3200)
    return () => clearTimeout(t)
  }, [hlKey])

  const roster = rosterOf(state)
  const mercs = mercCount(state)
  const attending = state.attend.length - mercs

  function add(e: React.FormEvent) {
    e.preventDefault()
    const r = addPlayers(state, newName)
    if (!r.ok) {
      setError(r.error)
      return
    }
    setError('')
    setNewName('')
    onChange(r.state)
    if (r.added.length > 1 || r.dup.length || r.long.length) {
      const skipped = r.dup.length + r.long.length
      notify?.(`${r.added.length}명을 추가했어요${skipped ? ` (중복·너무 긴 이름 ${skipped}개 제외)` : ''}`)
    }
  }

  return (
    <>
      <section className="card">
        <div className="field-in">
          <label htmlFor="team">팀 이름</label>
          <input id="team" value={teamName} onChange={(e) => onTeamName(e.target.value)} maxLength={20} />
        </div>
      </section>

      <section className="card">
        <div className="tiles">
          <div className="tile">
            <span>전체 인원</span>
            <b>
              {roster.length}
              <small>명</small>
            </b>
          </div>
          <div className="tile on">
            <button className="infob" aria-label="인당 출전 쿼터 계산 보기" onClick={() => setQuotaOpen(true)}>인당 출전</button>
            <span>참석 인원{mercs ? ` · 용병 +${mercs}` : ''}</span>
            <b>
              {attending}
              <small>명</small>
            </b>
          </div>
        </div>
        <div className="toolbar">
          <div className="row">
            <button className="btn small" onClick={() => onChange(selectAll(state))}>전체 선택</button>
            <button className="btn small" onClick={() => onChange(clearAttend(state))}>전체 해제</button>
          </div>
          <div className="row">
            <button className="btn small" aria-pressed={state.sortDir === 'asc'} onClick={() => onChange(setSortDir(state, 'asc'))}>
              가나다 오름차순
            </button>
            <button className="btn small" aria-pressed={state.sortDir === 'desc'} onClick={() => onChange(setSortDir(state, 'desc'))}>
              내림차순
            </button>
          </div>
        </div>
      </section>

      <section className={'card' + (hl ? ' hl' : '')} ref={addRef}>
        <form className="row" style={{ alignItems: 'flex-end' }} onSubmit={add}>
          <div className="field-in">
            <label htmlFor="newname">선수 추가</label>
            <textarea
              id="newname"
              rows={3}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                // 엔터는 추가, 줄바꿈은 Shift+엔터 (한글 조합 중 엔터는 무시)
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
              placeholder={'이름 입력\n여러 명은 쉼표·줄바꿈으로 한 번에\n예) 철수, 영희, 민수'}
              maxLength={600}
              autoComplete="off"
            />
          </div>
          <button className="btn primary" type="submit" style={{ minHeight: 44 }}>추가</button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
        {roster.length > 0 && (
          <>
          <p className="hint">이름을 누르면 오늘 참석으로 바뀌어요.</p>
          <ul className="plist">
            {roster.map((p) => {
              const on = state.attend.includes(p.id)
              return (
                <li key={p.id}>
                  <button className="tog" aria-pressed={on} onClick={() => onChange(setAttend(state, p.id, !on))}>
                    <span>{p.name}</span>
                    <span className="st">{on ? '참석' : '불참'}</span>
                  </button>
                  <button className="del" aria-label={`${p.name} 삭제`} onClick={() => {
                      onChange(removePlayer(state, p.id))
                      notify?.(`${p.name}${hasFinal(p.name) ? '을' : '를'} 삭제했어요`)
                    }}>
                    삭제
                  </button>
                </li>
              )
            })}
          </ul>
          </>
        )}
      </section>
      {quotaOpen && (
        <div className="qov" onClick={() => setQuotaOpen(false)}>
          <div className="qpop" role="dialog" aria-label="인당 출전 쿼터" onClick={(e) => e.stopPropagation()}>
            <div className="qh"><b>인당 출전 쿼터 계산</b><button aria-label="닫기" onClick={() => setQuotaOpen(false)}>×</button></div>
            {attending >= 11 ? (
              <>
                <div className="qbox"><h4>고정 GK 없는 경우</h4><QuotaRows slots={44} n={attending} /></div>
                <div className="qbox"><h4>고정 GK 있는 경우 <small>(GK는 4쿼터 고정)</small></h4><QuotaRows slots={40} n={attending - 1} gk /></div>
              </>
            ) : (
              <p className="qs">참석 11명부터 계산돼요 (지금 {attending}명)</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
