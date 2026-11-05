'use client'

import { useState } from 'react'
import {
  addPlayer,
  clearAttend,
  mercCount,
  removePlayer,
  rosterOf,
  selectAll,
  setAttend,
  setSortDir,
} from '@/lib/roster'
import type { TeamState } from '@/lib/types'

export default function RosterTab({
  teamName,
  onTeamName,
  state,
  onChange,
}: {
  teamName: string
  onTeamName: (name: string) => void
  state: TeamState
  onChange: (next: TeamState) => void
}) {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  const roster = rosterOf(state)
  const mercs = mercCount(state)
  const attending = state.attend.length - mercs

  function add(e: React.FormEvent) {
    e.preventDefault()
    const r = addPlayer(state, newName)
    if (!r.ok) {
      setError(r.error)
      return
    }
    setError('')
    setNewName('')
    onChange(r.state)
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

      <section className="card">
        <form className="row" style={{ alignItems: 'flex-end' }} onSubmit={add}>
          <div className="field-in">
            <label htmlFor="newname">선수 추가</label>
            <input
              id="newname"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="이름 입력"
              maxLength={10}
              autoComplete="off"
            />
          </div>
          <button className="btn primary" type="submit" style={{ minHeight: 44 }}>추가</button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
        <p className="hint">이름을 누르면 오늘 참석으로 바뀌어요. 추가한 선수는 가나다순 위치에 들어갑니다.</p>
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
                  <button className="del" aria-label={`${p.name} 삭제`} onClick={() => onChange(removePlayer(state, p.id))}>
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
