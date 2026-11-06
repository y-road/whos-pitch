'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { normalizeState } from '@/lib/roster'
import { track } from '@/lib/track'
import type { TeamState } from '@/lib/types'
import ShareView from './ShareView'

type Shared = { name: string; state: TeamState; updated_at?: string }

/** 공유 링크 화면. 주장이 고치면 15초 안에(그리고 화면으로 돌아올 때 바로) 새 내용으로 바뀐다. */
export default function LiveShare({ token, initial }: { token: string; initial: { name: string; state: unknown } }) {
  const [data, setData] = useState<Shared>({ name: initial.name, state: normalizeState(initial.state) })
  const [gone, setGone] = useState(false)
  const busy = useRef(false)

  useEffect(() => {
    track('share_view')
  }, [])

  const refresh = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    try {
      const { data: rows, error } = await createClient().rpc('get_shared_team', { p_token: token })
      if (error) return
      const row = Array.isArray(rows) ? rows[0] : null
      if (!row) {
        setGone(true)
        return
      }
      setGone(false)
      setData({ name: row.name, state: normalizeState(row.state), updated_at: row.updated_at })
    } finally {
      busy.current = false
    }
  }, [token])

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 15000)
    const onVis = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onVis)
    }
  }, [refresh])

  if (gone) {
    return (
      <div className="wrap">
        <section className="card">
          <b>이 링크는 더 이상 사용할 수 없어요</b>
          <p className="hint">주장이 공유 링크를 새로 만들었을 수 있어요. 새 링크를 받아 주세요.</p>
        </section>
      </div>
    )
  }

  const attending = data.state.attend.length
  return (
    <div className="wrap">
      <header className="top">
        <h1>나 오늘 어디 뛰어?</h1>
        <div className="meta">{data.name}<br />참석 {attending}명</div>
      </header>
      <ShareView name={data.name} state={data.state} />
    </div>
  )
}
