'use client'

import { useEffect, useState } from 'react'
import {
  COLORS, PITCH_SVG, benchOf, colKey, grpOf, lab, nameOf, playedTotal,
} from '@/lib/lineup-core'
import type { TeamState } from '@/lib/types'

/** 팀원이 보는 읽기 전용 화면: 4쿼터를 2×2로 한눈에. 이름을 고르면 내 위치만 강조한다. */
/** 공지 내용이 바뀌면 다시 안 읽은 것으로 보이게, 내용으로 짧은 표식을 만든다. */
function mark(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return String(h)
}

const MEGAPHONE = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8a3 3 0 0 1 0 6" />
    <path d="M10 8v11a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-5" />
    <path d="M12 8l4.524-3.77a.9.9 0 0 1 1.476.692v12.156a.9.9 0 0 1-1.476.692L12 14H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h8" />
  </svg>
)

export default function ShareView({ name, state, readKey = 'preview' }: { name: string; state: TeamState; readKey?: string }) {
  const [me, setMe] = useState('')
  const meId = state.attend.includes(me) ? me : ''
  const notes = state.notes ?? ['', '', '', '']
  // 팀원이 이미 읽은 공지(쿼터별 표식). 폰에만 기억해 두고, 공지 내용이 바뀌면 다시 안 읽은 상태가 된다.
  const storeKey = `wp_nr_${readKey}`
  const [seen, setSeen] = useState<Record<number, string>>({})
  const [open, setOpen] = useState<number | null>(null)
  useEffect(() => {
    try {
      setSeen(JSON.parse(localStorage.getItem(storeKey) || '{}'))
    } catch {
      /* 저장소를 못 쓰면 읽음 표시 없이 계속 보여 준다 */
    }
  }, [storeKey])
  function openNote(qi: number) {
    setOpen(qi)
    const next = { ...seen, [qi]: mark(notes[qi]) }
    setSeen(next)
    try {
      localStorage.setItem(storeKey, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <section className="card">
        <b>{name}</b>
        <div className="row" style={{ marginTop: 10 }}>
          <label htmlFor="me" style={{ fontSize: 13, color: 'var(--mute)' }}>내 이름</label>
          <select id="me" value={meId} onChange={(e) => setMe(e.target.value)}>
            <option value="">전체 보기</option>
            {state.attend.map((id) => (
              <option key={id} value={id}>{nameOf(state, id)}</option>
            ))}
          </select>
        </div>
        {meId && (
          <p className="mine">
            {[0, 1, 2, 3].map((i) => `${i + 1}Q ${state.q[i][meId] ? lab(state.q[i][meId]) : '벤치'}`).join(' · ')}{' '}
            <span style={{ color: 'var(--mute)', fontWeight: 400 }}>(총 {playedTotal(state, meId)}쿼터)</span>
          </p>
        )}
      </section>

      <section className="view">
        <div className="vgrid">
          {[0, 1, 2, 3].map((qi) => {
            const q = state.q[qi]
            const bench = benchOf(state, qi)
            return (
              <div className="card vq" key={qi}>
                <h3>{qi + 1}쿼터 <small>{state.fm[qi]}</small></h3>
                <div className="pitch">
                  <div className="field">
                    <span dangerouslySetInnerHTML={{ __html: PITCH_SVG }} />
                    {notes[qi]?.trim() && (
                      <button
                        type="button"
                        className={`noteico${seen[qi] === mark(notes[qi]) ? ' read' : ''}`}
                        onClick={() => openNote(qi)}
                        aria-label={`${qi + 1}쿼터 감독 공지 보기`}
                      >
                        {MEGAPHONE}
                      </button>
                    )}
                    {Object.keys(q).map((id) => {
                      const p = q[id]
                      const l = lab(p)
                      const hex = COLORS[colKey(state.pc, id, l)][1]
                      const cls = `chip ${grpOf(l)}${meId ? (meId === id ? ' me' : ' dim') : ''}${p.y >= 90 ? ' nmtop' : ''}`
                      return (
                        <div className={cls} key={id} style={{ left: `${p.x}%`, top: `${p.y}%`, ['--cc' as string]: hex }}>
                          <span className={`c${l.length > 3 ? ' sm' : ''}`} style={{ background: hex, color: '#fff' }}>{l}</span>
                          <span className="nm">{nameOf(state, id)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <p className="bn">벤치: {bench.map((id) => nameOf(state, id)).join(', ') || '없음'}</p>
              </div>
            )
          })}
        </div>
      </section>
      {open !== null && notes[open]?.trim() && (
        <div className="qov" role="dialog" aria-modal="true" aria-label={`${open + 1}쿼터 감독 공지`} onClick={() => setOpen(null)}>
          <div className="qpop" onClick={(e) => e.stopPropagation()}>
            <div className="qh"><b>{open + 1}쿼터 감독 공지</b></div>
            <p className="notetext">{notes[open]}</p>
            <button className="btn small primary" onClick={() => setOpen(null)}>확인</button>
          </div>
        </div>
      )}
    </>
  )
}
