'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GOOGLE_CLIENT_ID } from '@/lib/supabase/env'
import { randomNonce, sha256Hex } from '@/lib/auth-helpers'

/* Google Identity Services(GIS) 최소 타입 */
type CredentialResponse = { credential?: string }
type GsiId = {
  initialize: (config: {
    client_id: string
    nonce: string
    callback: (res: CredentialResponse) => void
    auto_select?: boolean
    itp_support?: boolean
    use_fedcm_for_prompt?: boolean
  }) => void
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void
  cancel: () => void
}
declare global {
  interface Window {
    google?: { accounts: { id: GsiId } }
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client'

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    const script = existing ?? Object.assign(document.createElement('script'), { src: GSI_SRC, async: true, defer: true })
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('gsi-load-failed')), { once: true })
    if (!existing) document.head.appendChild(script)
  })
}

/**
 * 구글 로그인 버튼.
 * 구글 화면에 Supabase 주소 대신 우리 서비스(도메인)가 보이도록 Google Identity Services 로 로그인하고,
 * 받은 ID 토큰을 Supabase 에 넘겨(signInWithIdToken) 세션을 만든다. 재전송 공격을 막기 위해 nonce 를 쓴다.
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID 가 없거나 구글 스크립트를 못 불러오면 기존 방식(signInWithOAuth)으로 대신한다.
 */
export default function GoogleLoginButton({ onError }: { onError: (message: string) => void }) {
  const router = useRouter()
  const holder = useRef<HTMLDivElement>(null)
  const errorRef = useRef(onError)
  errorRef.current = onError
  const [fallback, setFallback] = useState(!GOOGLE_CLIENT_ID)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false
    ;(async () => {
      try {
        const nonce = randomNonce() // Supabase 에는 원본을 넘긴다
        const hashedNonce = await sha256Hex(nonce) // 구글에는 해시를 넘긴다
        await loadGsi()
        const el = holder.current
        if (cancelled || !el || !window.google) return
        const gid = window.google.accounts.id
        gid.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: hashedNonce,
          auto_select: false,
          itp_support: true,
          use_fedcm_for_prompt: true,
          callback: async (res) => {
            if (!res.credential) {
              errorRef.current('로그인에 실패했어요. 다시 시도해 주세요.')
              return
            }
            setBusy(true)
            errorRef.current('')
            const { error } = await createClient().auth.signInWithIdToken({
              provider: 'google',
              token: res.credential,
              nonce,
            })
            if (error) {
              setBusy(false)
              errorRef.current('로그인에 실패했어요. 다시 시도해 주세요.')
              return
            }
            router.replace('/app')
            router.refresh()
          },
        })
        el.innerHTML = ''
        gid.renderButton(el, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          locale: 'ko',
          width: Math.min(380, Math.max(200, el.clientWidth || 320)),
        })
      } catch {
        if (cancelled) return
        setFallback(true)
        errorRef.current('구글 로그인 버튼을 불러오지 못했어요. 아래 버튼으로 로그인해 주세요.')
      }
    })()
    return () => {
      cancelled = true
      window.google?.accounts.id.cancel()
    }
  }, [router])

  async function oauthFallback() {
    setBusy(true)
    errorRef.current('')
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      setBusy(false)
      errorRef.current('구글 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  if (fallback) {
    return (
      <button className="btn primary" type="button" onClick={oauthFallback} disabled={busy}>
        {busy ? '이동 중…' : '구글로 로그인'}
      </button>
    )
  }

  return (
    <div className="gsi">
      <div ref={holder} className="gsi-btn" aria-busy={busy} style={busy ? { opacity: 0.5, pointerEvents: 'none' } : undefined} />
      {busy && <p className="hint">로그인 중…</p>}
    </div>
  )
}
