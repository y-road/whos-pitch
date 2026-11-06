'use client'

import { useState } from 'react'
import { androidChromeIntentUrl, isAndroid, kakaoExternalUrl, type InApp } from '@/lib/auth-helpers'

/**
 * 카카오톡 등 앱 안의 브라우저에서 열렸을 때의 안내.
 * 구글은 이런 화면에서의 로그인을 막기 때문에, 크롬·사파리 같은 외부 브라우저로 열도록 돕는다.
 */
export default function InAppNotice({ inApp }: { inApp: NonNullable<InApp> }) {
  const [copied, setCopied] = useState(false)
  const home = () => `${location.origin}/`

  /** 안드로이드: 크롬 먼저 → 없으면 기본 브라우저 / 아이폰 등: 기본 브라우저 */
  function openExternal() {
    window.location.href = isAndroid(navigator.userAgent) ? androidChromeIntentUrl(home()) : kakaoExternalUrl(home())
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(home())
      setCopied(true)
    } catch {
      window.prompt('아래 주소를 복사해 크롬이나 사파리에 붙여 넣어 주세요.', home())
    }
  }

  return (
    <div className="inapp" role="note">
      {inApp.kind === 'kakao' ? (
        <>
          <p>
            <b>카카오톡 안에서는 구글 로그인이 막혀 있어요.</b>
            <br />
            외부 브라우저(크롬·사파리 등)에서 열어 주세요.
          </p>
          <div className="inapp-actions">
            <button className="btn primary" type="button" onClick={openExternal}>
              외부 브라우저로 열기
            </button>
            <button className="btn" type="button" onClick={copy}>
              {copied ? '주소를 복사했어요' : '주소 복사'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            <b>앱 안의 브라우저에서는 구글 로그인이 막힐 수 있어요.</b>
            <br />
            로그인이 안 되면 주소를 복사해 크롬·사파리에서 열어 주세요.
          </p>
          <div className="inapp-actions">
            <button className="btn" type="button" onClick={copy}>
              {copied ? '주소를 복사했어요' : '주소 복사'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
