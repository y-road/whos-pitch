'use client'

import { useEffect, useRef, useState } from 'react'

// 재생 순서: 1 It's Only Us → 2 Radio → 3 Time Bomb → 4 너를 원해 → 5 The Phoenix (끝나면 처음으로 반복)
const TRACKS = ['/bgm/1.mp3', '/bgm/2.mp3', '/bgm/3.mp3', '/bgm/4.mp3', '/bgm/5.mp3']

export default function BgmPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const idx = useRef(0)
  const [started, setStarted] = useState(false) // 한 번이라도 켰는가
  const [on, setOn] = useState(false) // 소리가 나는 상태

  useEffect(() => {
    const a = new Audio()
    a.preload = 'none'
    a.src = TRACKS[0]
    a.onended = () => {
      idx.current = (idx.current + 1) % TRACKS.length
      a.src = TRACKS[idx.current]
      void a.play().catch(() => {})
    }
    audioRef.current = a
    return () => {
      a.pause()
      a.onended = null
      a.src = ''
    }
  }, [])

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (!started) {
      // 처음 켤 때만 첫 곡부터 시작한다.
      setStarted(true)
      setOn(true)
      a.muted = false
      void a.play().catch(() => {
        setStarted(false)
        setOn(false)
      })
      return
    }
    // 이후에는 재생은 계속되고 소리만 켜고 끈다.
    const next = !on
    a.muted = !next
    setOn(next)
  }

  return (
    <button
      type="button"
      className={'bgm-btn' + (on ? ' on' : '')}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? '배경음악 끄기' : '배경음악 켜기'}
      title={on ? '배경음악 끄기' : '배경음악 켜기'}
    >
      {on ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
          <path d="m16 9 5 6M21 9l-5 6" />
        </svg>
      )}
    </button>
  )
}
