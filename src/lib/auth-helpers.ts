/**
 * 구글 로그인(Google Identity Services + Supabase signInWithIdToken)에서 쓰는 순수 함수들.
 * 브라우저·Node 어디서나 동작해야 하므로 외부 의존성이 없다.
 */

/** 예측할 수 없는 일회용 값(nonce). 로그인 한 번마다 새로 만든다. */
export function randomNonce(): string {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** SHA-256 해시를 16진수 문자열로. 구글에는 해시된 nonce를, Supabase에는 원본 nonce를 넘긴다. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export type InApp = { kind: 'kakao' | 'other' } | null

/**
 * 앱 안에 들어 있는 브라우저(인앱 브라우저)인지 User-Agent로 알아낸다.
 * 구글은 보안상 이런 임베디드 웹뷰에서의 로그인을 막는다(disallowed_useragent).
 */
export function detectInApp(userAgent: string): InApp {
  if (/KAKAOTALK/i.test(userAgent)) return { kind: 'kakao' }
  if (/NAVER\(inapp|Instagram|FBAN|FBAV|FB_IAB|\bLine\/|DaumApps|; wv\)/i.test(userAgent)) return { kind: 'other' }
  return null
}

/** 카카오톡에서 주소를 기본 외부 브라우저(크롬·사파리 등)로 여는 딥링크 (안드로이드·iOS 공통). */
export function kakaoExternalUrl(url: string): string {
  return `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
}

export function isAndroid(ua: string): boolean {
  return /Android/i.test(ua)
}

/**
 * 안드로이드용: 크롬으로 먼저 열고, 크롬이 없으면 카카오톡의 기본 외부 브라우저 열기로 넘어간다.
 * (intent:// 의 S.browser_fallback_url 을 사용)
 */
export function androidChromeIntentUrl(url: string): string {
  const u = new URL(url)
  const fallback = encodeURIComponent(kakaoExternalUrl(url))
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${fallback};end`
}
