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
        <p className="hint">단톡방 명단을 통째로 붙여 넣어도 한 번에 추가돼요. 이름을 누르면 오늘 참석으로 바뀌고, 추가한 선수는 가나다순으로 들어갑니다.</p>
        {roster.length === 0 ? (
          <p className="hint">아직 등록된 선수가 없어요. 위에서 선수 이름을 추가해 주세요.</p>
        ) : (
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
        )}
      </section>
    </>
  )
}
