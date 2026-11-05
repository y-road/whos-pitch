import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { detectInApp, kakaoExternalUrl, randomNonce, sha256Hex } from '../src/lib/auth-helpers.ts'

// nonce: 길이·무작위성, 해시는 Node의 SHA-256과 같아야 한다
const a = randomNonce()
const b = randomNonce()
assert.match(a, /^[0-9a-f]{32}$/)
assert.notEqual(a, b)
assert.equal(await sha256Hex('abc'), createHash('sha256').update('abc').digest('hex'))
assert.equal(await sha256Hex(a), createHash('sha256').update(a).digest('hex'))

// 인앱 브라우저 감지
const KAKAO_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 KAKAOTALK/10.4.3'
const KAKAO_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.4.3'
const CHROME = 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0'
const NAVER = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36 NAVER(inapp; search; 1000; 12.0.0)'
assert.deepEqual(detectInApp(KAKAO_ANDROID), { kind: 'kakao' })
assert.deepEqual(detectInApp(KAKAO_IOS), { kind: 'kakao' })
assert.deepEqual(detectInApp(INSTAGRAM), { kind: 'other' })
assert.deepEqual(detectInApp(NAVER), { kind: 'other' })
assert.equal(detectInApp(CHROME), null)
assert.equal(detectInApp(SAFARI), null)

// 외부 브라우저 딥링크
assert.equal(
  kakaoExternalUrl('https://www.whospitch.live/'),
  'kakaotalk://web/openExternal?url=https%3A%2F%2Fwww.whospitch.live%2F',
)
console.log('auth helpers: ok')
