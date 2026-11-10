'use client'

import { useState } from 'react'
import {
  COLORS, PITCH_SVG, benchOf, colKey, grpOf, lab, nameOf, playedTotal,
} from '@/lib/lineup-core'
import type { TeamState } from '@/lib/types'

/** 팀원이 보는 읽기 전용 화면: 4쿼터를 2×2로 한눈에. 이름을 고르면 내 위치만 강조한다. */
export default function ShareView({ name, state }: { name: string; state: TeamState }) {
  const [me, setMe] = useState('')
  const meId = state.attend.includes(me) ? me : ''

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
    </>
  )
}
