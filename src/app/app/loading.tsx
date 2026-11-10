import { PitchBg } from '@/components/Onboarding'

/** 앱 데이터를 불러오는 동안 멈춘 것처럼 보이지 않게 보여 주는 화면 */
export default function Loading() {
  return (
    <main className="onb" aria-busy="true">
      <PitchBg />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="onb-logo" src="/logo.png" width={92} height={92} alt="" />
      <h1>나 오늘 어디 뛰어?</h1>
      <p className="onb-load" role="status">불러오는 중<span aria-hidden="true">…</span></p>
    </main>
  )
}
