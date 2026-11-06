'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Row = { ev_name: string; visitors: number; total: number }

// 순서대로 "다음 단계로 넘어간 비율"을 본다.
const STEPS: [string, string][] = [
  ['landing_view', '첫 화면 방문'],
  ['name_submitted', '팀 이름 입력 → 로그인 화면'],
  ['team_created', '로그인 후 팀 생성'],
  ['app_open', '앱 화면 진입'],
  ['sample_cleared', '예시 데이터 지우고 시작'],
  ['player_added', '선수 1명 이상 추가'],
  ['players_3', '선수 3명 이상 추가'],
  ['players_11', '선수 11명 이상 추가'],
  ['attend_11', '참석 11명 이상 선택'],
  ['tab_lineup', '라인업 탭 열기'],
  ['lineup_edit', '라인업 편집 시작'],
  ['lineup_11', '1쿼터 11명 배치 완료'],
  ['tab_share', '공유 탭 열기'],
  ['share_copy', '공유 링크 복사'],
  ['share_view', '팀원이 공유 링크 열어 봄'],
]
const SIDE: [string, string][] = [
  ['returning_click', '"아이디가 이미 있어요" 누름 (기존 회원)'],
  ['inapp_blocked', '카카오톡 안에서 열려 막힘'],
]

export default function AdminFunnel() {
  const [days, setDays] = useState(30)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [msg, setMsg] = useState('불러오는 중…')

  useEffect(() => {
    let alive = true
    ;(async () => {
      setRows(null)
      setMsg('불러오는 중…')
      const sb = createClient()
      const { data: u } = await sb.auth.getUser()
      if (!u.user) {
        if (alive) setMsg('login')
        return
      }
      const { data, error } = await sb.rpc('admin_funnel', { p_days: days })
      if (!alive) return
      if (error) {
        setMsg(error.code === '42501' || /forbidden/.test(error.message) ? 'forbidden' : error.code === 'PGRST202' ? 'nosql' : '불러오지 못했어요: ' + error.message)
        return
      }
      setRows((data as Row[]) ?? [])
      setMsg('')
    })()
    return () => {
      alive = false
    }
  }, [days])

  const get = (k: string) => rows?.find((r) => r.ev_name === k)?.visitors ?? 0
  const first = get('landing_view')

  return (
    <main className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>이탈 현황</h1>
      <p className="hint" style={{ marginTop: 0 }}>
        단계별로 몇 명이 도달했는지 보여줘요. 숫자는 브라우저 기준이라, 카톡에서 외부 브라우저로 옮기면 한 사람이 두 번 잡힐 수 있어요.
      </p>
      <div className="row" style={{ margin: '10px 0' }}>
        {[7, 30, 90].map((d) => (
          <button key={d} className="btn small" aria-pressed={days === d} onClick={() => setDays(d)}>
            최근 {d}일
          </button>
        ))}
      </div>

      {msg === 'login' ? (
        <p>
          먼저 로그인해 주세요. <Link href="/">처음 화면으로</Link>
        </p>
      ) : msg === 'forbidden' ? (
        <p className="error">관리자 이메일로 등록된 계정이 아니에요. 0002_events.sql 마지막 줄의 이메일을 확인해 주세요.</p>
      ) : msg === 'nosql' ? (
        <p className="error">아직 집계 기능이 설치되지 않았어요. Supabase SQL Editor에서 0002_events.sql 을 실행해 주세요.</p>
      ) : msg ? (
        <p className="hint">{msg}</p>
      ) : (
        <>
          <section className="card">
            <ol className="funnel">
              {STEPS.map(([k, label], i) => {
                const n = get(k)
                const prev = i === 0 ? 0 : get(STEPS[i - 1][0])
                const stepPct = i === 0 || prev === 0 ? null : Math.round((n / prev) * 100)
                const allPct = first ? Math.round((n / first) * 100) : null
                return (
                  <li key={k}>
                    <div className="funnel-top">
                      <span>{label}</span>
                      <b>{n}명</b>
                    </div>
                    <div className="funnel-bar">
                      <i style={{ width: first ? Math.min(100, (n / first) * 100) + '%' : '0%' }} />
                    </div>
                    <div className="funnel-sub">
                      {allPct !== null && <span>처음 대비 {allPct}%</span>}
                      {stepPct !== null && (
                        <span className={stepPct < 50 ? 'bad' : ''}>
                          이전 단계 대비 {stepPct}%{stepPct < 50 ? ' ← 이탈 큼' : ''}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
          <section className="card" style={{ marginTop: 10 }}>
            <b>참고</b>
            <ul className="plain">
              {SIDE.map(([k, label]) => (
                <li key={k}>
                  {label}: <b>{get(k)}명</b>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}
