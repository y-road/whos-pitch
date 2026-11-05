/** 라인업 공통 로직: 포메이션·포지션·색상 상수와 계산 함수 (편집 화면/공유 화면이 함께 쓴다) */
import type { Placement, TeamState } from './types.ts'

export type Slot = { x: number; y: number; l: string }

/* x,y는 필드 대비 %, 위쪽이 상대 골문 */
const GKs: Slot = { x: 50, y: 89, l: 'GK' }
const D4: Slot[] = [
  { x: 14, y: 70, l: 'LB' },
  { x: 37, y: 72, l: 'CB' },
  { x: 63, y: 72, l: 'CB' },
  { x: 86, y: 70, l: 'RB' },
]
const D3: Slot[] = [
  { x: 26, y: 76, l: 'CB' },
  { x: 50, y: 78, l: 'CB' },
  { x: 74, y: 76, l: 'CB' },
]

export const FORMS: Record<string, Slot[]> = {
  '4-4-2': [GKs, ...D4, { x: 14, y: 50, l: 'LM' }, { x: 38, y: 54, l: 'CM' }, { x: 62, y: 54, l: 'CM' }, { x: 86, y: 50, l: 'RM' }, { x: 36, y: 22, l: 'ST' }, { x: 64, y: 22, l: 'ST' }],
  '4-3-3': [GKs, ...D4, { x: 50, y: 58, l: 'DM' }, { x: 28, y: 46, l: 'CM' }, { x: 72, y: 46, l: 'CM' }, { x: 16, y: 24, l: 'LW' }, { x: 50, y: 18, l: 'ST' }, { x: 84, y: 24, l: 'RW' }],
  '4-2-3-1': [GKs, ...D4, { x: 36, y: 58, l: 'DM' }, { x: 64, y: 58, l: 'DM' }, { x: 16, y: 38, l: 'LM' }, { x: 50, y: 36, l: 'AM' }, { x: 84, y: 38, l: 'RM' }, { x: 50, y: 16, l: 'ST' }],
  '4-1-4-1': [GKs, ...D4, { x: 50, y: 62, l: 'DM' }, { x: 14, y: 46, l: 'LM' }, { x: 38, y: 48, l: 'CM' }, { x: 62, y: 48, l: 'CM' }, { x: 86, y: 46, l: 'RM' }, { x: 50, y: 18, l: 'ST' }],
  '4-5-1': [GKs, ...D4, { x: 12, y: 46, l: 'LM' }, { x: 31, y: 52, l: 'CM' }, { x: 50, y: 48, l: 'CM' }, { x: 69, y: 52, l: 'CM' }, { x: 88, y: 46, l: 'RM' }, { x: 50, y: 18, l: 'ST' }],
  '3-5-2': [GKs, ...D3, { x: 10, y: 54, l: 'LM' }, { x: 50, y: 60, l: 'DM' }, { x: 30, y: 48, l: 'CM' }, { x: 70, y: 48, l: 'CM' }, { x: 90, y: 54, l: 'RM' }, { x: 36, y: 22, l: 'ST' }, { x: 64, y: 22, l: 'ST' }],
  '3-4-3': [GKs, ...D3, { x: 14, y: 52, l: 'LM' }, { x: 38, y: 56, l: 'CM' }, { x: 62, y: 56, l: 'CM' }, { x: 86, y: 52, l: 'RM' }, { x: 18, y: 26, l: 'LW' }, { x: 50, y: 20, l: 'ST' }, { x: 82, y: 26, l: 'RW' }],
  '5-3-2': [GKs, { x: 10, y: 66, l: 'LB' }, { x: 28, y: 76, l: 'CB' }, { x: 50, y: 78, l: 'CB' }, { x: 72, y: 76, l: 'CB' }, { x: 90, y: 66, l: 'RB' }, { x: 28, y: 50, l: 'CM' }, { x: 50, y: 54, l: 'CM' }, { x: 72, y: 50, l: 'CM' }, { x: 36, y: 22, l: 'ST' }, { x: 64, y: 22, l: 'ST' }],
}

/** 포지션 목록: [약어, 이름] */
export const POS = [
  { g: '공격', c: 'FW', it: [['ST', '스트라이커'], ['SS', '섀도우 스트라이커'], ['CF', '센터 포워드'], ['LW', '왼쪽 윙어'], ['RW', '오른쪽 윙어']] },
  { g: '미드필더', c: 'MF', it: [['CM', '중앙 미드필더'], ['LCM', '왼쪽 중앙 미드필더'], ['RCM', '오른쪽 중앙 미드필더'], ['DM', '수비형 미드필더'], ['AM', '공격형 미드필더'], ['LM', '왼쪽 미드필더'], ['RM', '오른쪽 미드필더']] },
  { g: '수비', c: 'DF', it: [['CB', '중앙 수비수'], ['LB', '왼쪽 풀백'], ['RB', '오른쪽 풀백']] },
  { g: '골키퍼', c: 'GK', it: [['GK', '골키퍼']] },
] as const

export const POSCLS: Record<string, string> = {}
POS.forEach((g) => g.it.forEach((t) => (POSCLS[t[0]] = g.c)))
export const grpOf = (l: string) => POSCLS[l] || 'MF'

export const COLORS: Record<string, [string, string]> = {
  red: ['빨강', '#DC2626'],
  green: ['초록', '#16A34A'],
  blue: ['파랑', '#2563EB'],
  orange: ['주황', '#EA580C'],
}
export const COLORDEF: Record<string, string> = { FW: 'red', MF: 'green', DF: 'blue', GK: 'orange' }

export function esc(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

/** 68x100 기준 단위의 거리 */
export function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = (a.x - b.x) * 0.68
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}
export const sortPos = (q: Record<string, Placement>, a: string, b: string) => q[b].y - q[a].y || q[a].x - q[b].x

export function posLabel(x: number, y: number): string {
  if (y > 87) return 'GK'
  if (y > 62) return x < 26 ? 'LB' : x > 74 ? 'RB' : 'CB'
  if (y > 40) {
    if (x < 22) return 'LM'
    if (x > 78) return 'RM'
    return y >= 54 && x >= 38 && x <= 62 ? 'DM' : 'CM'
  }
  if (y > 30) {
    if (x < 28) return 'LM'
    if (x > 72) return 'RM'
    return 'AM'
  }
  return x < 28 ? 'LW' : x > 72 ? 'RW' : 'ST'
}
export const lab = (p: Placement) => p.l || posLabel(p.x, p.y)

export function colKey(pc: Record<string, string>, id: string, l: string): string {
  const k = pc?.[id]
  return COLORS[k] ? k : COLORDEF[grpOf(l)]
}

/* ---- 상태에서 파생되는 값 ---- */
export const idxOf = (s: TeamState, id: string) => {
  const i = s.players.findIndex((p) => p.id === id)
  return i < 0 ? 99 : i
}
export const nameOf = (s: TeamState, id: string) => s.players.find((p) => p.id === id)?.name ?? '?'
export const playedTotal = (s: TeamState, id: string) => [0, 1, 2, 3].filter((i) => s.q[i][id]).length
export function benchOf(s: TeamState, qi: number): string[] {
  return s.attend
    .filter((id) => !s.q[qi][id])
    .sort((a, b) => playedTotal(s, a) - playedTotal(s, b) || idxOf(s, a) - idxOf(s, b))
}

export const PITCH_SVG =
  '<svg viewBox="0 0 68 100" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="rgba(255,255,255,.7)" stroke-width=".5">' +
  '<rect x="2" y="2" width="64" height="96"/><line x1="2" y1="50" x2="66" y2="50"/><circle cx="34" cy="50" r="8.5"/><circle cx="34" cy="50" r=".6" fill="#fff"/>' +
  '<rect x="14" y="2" width="40" height="16"/><rect x="25" y="2" width="18" height="6"/><path d="M26.5 18 A8.5 8.5 0 0 0 41.5 18"/>' +
  '<rect x="14" y="82" width="40" height="16"/><rect x="25" y="92" width="18" height="6"/><path d="M26.5 82 A8.5 8.5 0 0 1 41.5 82"/></g></svg>'
