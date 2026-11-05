/** 팀 한 곳의 앱 상태. teams.state(jsonb)에 통째로 저장된다. */

export type Player = {
  id: string
  name: string
  /** 용병(임시 선수). 팀 명단에는 보이지 않는다. */
  merc?: boolean
}

export type Placement = {
  x: number
  y: number
  /** 포지션 이니셜 (직접 바꾸지 않았으면 위치로 자동 계산) */
  l?: string
  /** 사용자가 포지션을 직접 바꿨는지 */
  m?: boolean
}

export type Guide = { x: number; y: number; l: string }

export type TeamState = {
  players: Player[]
  /** 오늘 참석자 id */
  attend: string[]
  /** 쿼터별(4개) 선수 배치: 선수 id -> 위치 */
  q: Record<string, Placement>[]
  /** 쿼터별 포메이션 이름 */
  fm: string[]
  /** 쿼터별로 직접 옮긴 점선 위치(없으면 포메이션 기본값) */
  gs: (Guide[] | null)[]
  /** 선수별 칩 색상 (red/green/blue/orange) */
  pc: Record<string, string>
  /** 선수 id 발급용 증가 번호 */
  seq: number
  sortDir: 'asc' | 'desc'
}

export type Team = {
  id: string
  name: string
  share_token: string
  state: unknown
}
