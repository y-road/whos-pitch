import type { Placement, TeamState } from './types.ts'
import { DEFAULT_FORMATION, emptyState, sortPlayers } from './roster.ts'
import { FORMS } from './lineup-core.ts'

/** 신규 팀이 처음 만들어질 때 미리 채워 두는 예시 데이터 */
const SAMPLE_PLAYERS = [
  '김스트', '박윙어', '최윙어', '김공미', '이공미', '민수미', '정풀백', '강풀백', '조센백', '윤센백', '이키퍼',
  '최공격', '이윙어', '송윙어', '조미드', '양미드', '심미드', '장풀백', '권센백', '장센백', '민풀백', '김키퍼',
  '장헤더', '송공격', '하풀백', '허풀백', '유미드', '최스트', '선풀백', '김풀백',
]

/** 라인업에 선 11명 + 벤치 4명 */
const SAMPLE_ATTEND = [
  '최스트', '이윙어', '송윙어', '조미드', '양미드', '심미드', '선풀백', '권센백', '장센백', '김풀백', '김키퍼',
  '박윙어', '이공미', '윤센백', '이키퍼',
]

/** [포지션, 선수] — 4-3-3 */
const SAMPLE_POS: [string, string][] = [
  ['ST', '최스트'], ['LW', '이윙어'], ['RW', '송윙어'], ['CM', '조미드'], ['CM', '양미드'], ['DM', '심미드'],
  ['LB', '선풀백'], ['CB', '권센백'], ['CB', '장센백'], ['RB', '김풀백'], ['GK', '김키퍼'],
]

/** 예시 데이터가 채워진 초기 상태를 만든다. 팀 이름은 state에 저장되지 않는다(teams.name 사용). */
export function seedState(): TeamState {
  const s = emptyState()
  s.players = SAMPLE_PLAYERS.map((name, i) => ({ id: `p${i + 1}`, name }))
  s.seq = s.players.length + 1
  const idOf = (name: string) => s.players.find((p) => p.name === name)!.id
  s.attend = SAMPLE_ATTEND.map(idOf)

  // 같은 포지션(CM, CB)은 왼쪽 자리부터 차례로 배정한다.
  const slots = [...FORMS[DEFAULT_FORMATION]].sort((a, b) => a.x - b.x)
  const used = new Set<number>()
  const q: Record<string, Placement> = {}
  for (const [l, name] of SAMPLE_POS) {
    const k = slots.findIndex((sl, i) => !used.has(i) && sl.l === l)
    if (k < 0) continue
    used.add(k)
    q[idOf(name)] = { x: slots[k].x, y: slots[k].y, l: slots[k].l }
  }
  // 2~4쿼터도 1쿼터와 같게 (직접 고칠 수 있다)
  s.q = [0, 1, 2, 3].map(() => structuredClone(q))
  s.sample = true
  return sortPlayers(s)
}
