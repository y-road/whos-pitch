'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TeamState } from '@/lib/types'
import ShareView from './ShareView'

export default function ShareTab({
  token,
  onToken,
  name,
  state,
}: {
  token: string
  onToken: (t: string) => void
  name: string
  state: TeamState
}) {
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const url = typeof window === 'undefined' ? '' : `${window.location.origin}/t/${token}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.getElementById('shareurl') as HTMLInputElement | null
      el?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  async function rotate() {
    setError('')
    const { data, error: err } = await createClient().rpc('rotate_share_token')
    if (err || typeof data !== 'string') {
      setError('링크를 새로 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
      return
    }
    onToken(data)
    setConfirming(false)
  }

  return (
    <>
      <section className="card">
        <b>팀원에게 보낼 공유 링크</b>
        <p className="hint">
          이 링크는 팀 고정 링크예요. 단톡방에 한 번 올려 두면, 라인업을 고칠 때마다 같은 링크에 바로 반영됩니다.
          팀원은 로그인 없이 보기만 할 수 있어요.
        </p>
        <div className="linkbox">
          <input id="shareurl" readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="공유 링크" />
          <button className="btn primary" onClick={copy}>{copied ? '복사됨' : '링크 복사'}</button>
        </div>
        <p className="hint">
          <a href={`/t/${token}`} target="_blank" rel="noreferrer">팀원 화면 새 창으로 열기</a>
        </p>
      </section>

      <ShareView name={name} state={state} />

      <section className="card">
        <b>링크가 유출됐다면</b>
        <p className="hint">새 링크를 만들면 기존 링크는 바로 사용할 수 없게 되고, 팀원에게 새 링크를 다시 보내야 해요.</p>
        {confirming ? (
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn small" onClick={rotate}>네, 새 링크로 바꿀게요</button>
            <button className="btn small" onClick={() => setConfirming(false)}>취소</button>
          </div>
        ) : (
          <button className="btn small" style={{ marginTop: 8 }} onClick={() => setConfirming(true)}>공유 링크 새로 만들기</button>
        )}
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    </>
  )
}
