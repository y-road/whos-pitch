import type { Placement, TeamState } from './types.ts'
import { DEFAULT_FORMATION, emptyState, sortPlayers } from './roster.ts'
import { FORMS } from './lineup-core.ts'

/** 신규 팀이 처음 만들어질 때 미리 채워 두는 예시 데이터 */
const SAMPLE_PLAYERS = [
  '오현규', '손흥민', '이강인', '박진섭', '이재성', '황인범', '황희찬', '김태현', '이한범', '조현택', '조현우',
  '김민재', '설영우', '이동경', '송민규', '김지수', '엄지성', '정우영', '이승우', '문선민', '이태석',
]

const SAMPLE_ATTEND = [
  '손흥민', '오현규', '이강인', '이재성', '황인범', '박진섭', '황희찬', '김태현', '김민재', '이한범',
  '설영우', '조현우', '이승우', '정우영', '이태석',
]

/** [포지션, 선수] — 4-3-3 */
const SAMPLE_POS: [string, string][] = [
  ['ST', '오현규'], ['LW', '이강인'], ['RW', '손흥민'], ['CM', '황인범'], ['CM', '이재성'], ['DM', '박진섭'],
  ['LB', '설영우'], ['CB', '김민재'], ['CB', '이한범'], ['RB', '이태석'], ['GK', '조현우'],
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
