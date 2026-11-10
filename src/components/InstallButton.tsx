'use client'

import { useEffect, useState } from 'react'
import { detectInApp } from '@/lib/auth-helpers'
import { track } from '@/lib/track'

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
type Mode = 'none' | 'prompt' | 'ios' | 'inapp'

/** "앱으로 설치" 버튼. 설치할 수 있는 브라우저에서만 보이고, 이미 앱으로 열었으면 숨긴다. */
export default function InstallButton() {
  const [mode, setMode] = useState<Mode>('none')
  const [open, setOpen] = useState(false)
  const [evt, setEvt] = useState<PromptEvent | null>(null)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (standalone) return
    const ua = navigator.userAgent
    if (detectInApp(ua)) {
      setMode('inapp')
      return
    }
    const ios = /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)
    if (ios) setMode('ios')
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as PromptEvent)
      setMode('prompt')
    }
    const onInstalled = () => {
      setMode('none')
      setOpen(false)
      track('pwa_installed')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (mode === 'none') return null

  async function click() {
    track('pwa_install_click')
    if (mode === 'prompt' && evt) {
      await evt.prompt()
      await evt.userChoice
      setEvt(null)
      setMode('none')
      return
    }
    setOpen(true)
  }

  return (
    <>
      <button className="linkbtn" onClick={click}>앱으로 설치</button>
      {open && (
        <div className="qov" role="dialog" aria-modal="true" aria-label="앱으로 설치" onClick={() => setOpen(false)}>
          <div className="qpop" onClick={(e) => e.stopPropagation()}>
            {mode === 'ios' ? (
              <>
                <div className="qh"><b>홈 화면에 앱처럼 추가하기</b></div>
                <ol className="inststeps">
                  <li>사파리 아래쪽 <b>공유 버튼</b>(네모에 화살표)을 누르세요</li>
                  <li><b>홈 화면에 추가</b>를 누르세요</li>
                  <li>오른쪽 위 <b>추가</b>를 누르면 끝이에요</li>
                </ol>
              </>
            ) : (
              <>
                <div className="qh"><b>크롬이나 사파리로 열어 주세요</b></div>
                <p className="hint">지금 보는 브라우저에서는 설치할 수 없어요. 메뉴에서 &ldquo;다른 브라우저로 열기&rdquo;를 눌러 주세요.</p>
              </>
            )}
            <button className="btn small" onClick={() => setOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </>
  )
}
