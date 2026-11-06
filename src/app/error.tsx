'use client'

import { useEffect } from 'react'
import { track } from '@/lib/track'

/** 화면이 깨졌을 때 빈 화면 대신 안내하고, 원인 메시지를 보여 준다. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    track('client_error', { msg: String(error.message).slice(0, 200), stack: String(error.stack ?? '').split('\n').slice(0, 4).join(' | ').slice(0, 400) })
  }, [error])
  return (
    <main className="onb">
      <h1>앗, 화면에 문제가 생겼어요</h1>
      <p>잠시 후 다시 시도해 주세요. 저장된 내용은 그대로예요.</p>
      <div className="onb-actions">
        <button className="btn primary" onClick={() => reset()}>다시 시도</button>
        <button className="btn" onClick={() => (window.location.href = '/')}>처음으로</button>
        <p className="hint" style={{ wordBreak: 'break-all' }}>오류 내용: {String(error.message).slice(0, 160)}</p>
      </div>
    </main>
  )
}
