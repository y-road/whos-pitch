'use client'

import { useEffect, useRef } from 'react'
import { mountLineupEditor } from '@/lib/lineup-editor'
import type { TeamState } from '@/lib/types'

/** 라인업 편집 화면. 편집 엔진을 붙이고, 바뀐 상태를 부모(자동 저장)로 올려 준다. */
export default function LineupTab({
  state,
  cur,
  onCur,
  onChange,
}: {
  state: TeamState
  cur: number
  onCur: (q: number) => void
  onChange: (next: TeamState) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // 마운트 시점의 상태로 시작하고, 이후 변경은 엔진이 소유한다. 콜백은 항상 최신 것을 쓴다.
  const init = useRef({ state, cur })
  const cb = useRef({ onChange, onCur })
  cb.current = { onChange, onCur }

  useEffect(() => {
    if (!ref.current) return
    // 화면을 떠난 뒤(탭 전환·예시 지우기 등)에는 엔진이 남긴 늦은 콜백이 상태를 되돌리지 못하게 막는다.
    let alive = true
    const destroy = mountLineupEditor(ref.current, {
      state: init.current.state,
      cur: init.current.cur,
      onChange: (s: TeamState) => {
        if (alive) cb.current.onChange(s)
      },
      onCur: (q: number) => {
        if (alive) cb.current.onCur(q)
      },
    })
    return () => {
      alive = false
      destroy()
    }
  }, [])

  return <div ref={ref} />
}
