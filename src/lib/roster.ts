import type { Player, TeamState } from './types.ts'

export const DEFAULT_FORMATION = '4-3-3'

export function emptyState(): TeamState {
  return {
    players: [],
    attend: [],
    q: [{}, {}, {}, {}],
    fm: [DEFAULT_FORMATION, DEFAULT_FORMATION, DEFAULT_FORMATION, DEFAULT_FORMATION],
    gs: [null, null, null, null],
    pc: {},
    seq: 1,
    sortDir: 'asc',
  }
}

/** DB에서 읽은 값을 안전하게 앱 상태로 바꾼다 (빠진 항목은 기본값). */
export function normalizeState(raw: unknown): TeamState {
  const base = emptyState()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<TeamState>
  const players = Array.isArray(r.players)
    ? r.players.filter((p): p is Player => !!p && typeof p.id === 'string' && typeof p.name === 'string')
    : []
  const ids = new Set(players.map((p) => p.id))
  return {
    players,
    attend: Array.isArray(r.attend) ? r.attend.filter((id) => ids.has(id)) : [],
    q: Array.isArray(r.q) && r.q.length === 4 ? r.q : base.q,
    fm: Array.isArray(r.fm) && r.fm.length === 4 ? r.fm : base.fm,
    gs: Array.isArray(r.gs) && r.gs.length === 4 ? r.gs : base.gs,
    pc: r.pc && typeof r.pc === 'object' ? r.pc : {},
    seq: typeof r.seq === 'number' && r.seq >= 1 ? r.seq : players.length + 1,
    sortDir: r.sortDir === 'desc' ? 'desc' : 'asc',
    ...(r.sample === true ? { sample: true } : {}),
  }
}

/** 팀 명단(용병 제외) */
export function rosterOf(s: TeamState): Player[] {
  return s.players.filter((p) => !p.merc)
}

export function mercCount(s: TeamState): number {
  return s.players.filter((p) => p.merc).length
}

/** 이름 가나다순(또는 역순)으로 선수와 참석자 순서를 정렬한다. */
export function sortPlayers(s: TeamState): TeamState {
  const dir = s.sortDir === 'desc' ? -1 : 1
  const players = [...s.players].sort((a, b) => dir * a.name.localeCompare(b.name, 'ko'))
  const index = new Map(players.map((p, i) => [p.id, i]))
  const attend = [...s.attend].sort((a, b) => (index.get(a) ?? 99) - (index.get(b) ?? 99))
  return { ...s, players, attend }
}

export type AddResult = { ok: true; state: TeamState } | { ok: false; error: string }

export function addPlayer(s: TeamState, rawName: string): AddResult {
  const name = rawName.trim()
  if (!name) return { ok: false, error: '이름을 입력해 주세요' }
  if (s.players.some((p) => p.name === name)) return { ok: false, error: '이미 있는 이름이에요' }
  const id = `p${s.seq}`
  const next: TeamState = {
    ...s,
    seq: s.seq + 1,
    players: [...s.players, { id, name }],
    attend: [...s.attend, id],
  }
  return { ok: true, state: sortPlayers(next) }
}

function withoutPlayerInLineup(s: TeamState, id: string): TeamState {
  return {
    ...s,
    attend: s.attend.filter((a) => a !== id),
    q: s.q.map((quarter) => {
      const copy = { ...quarter }
      delete copy[id]
      return copy
    }),
  }
}

export function setAttend(s: TeamState, id: string, on: boolean): TeamState {
  const has = s.attend.includes(id)
  if (on && !has) return sortPlayers({ ...s, attend: [...s.attend, id] })
  if (!on && has) return withoutPlayerInLineup(s, id)
  return s
}

export function selectAll(s: TeamState): TeamState {
  return sortPlayers({ ...s, attend: s.players.map((p) => p.id) })
}

/** 전체 해제: 팀 명단 선수만 해제하고 용병은 그대로 둔다. */
export function clearAttend(s: TeamState): TeamState {
  return s.players
    .filter((p) => !p.merc && s.attend.includes(p.id))
    .reduce((acc, p) => setAttend(acc, p.id, false), s)
}

export function removePlayer(s: TeamState, id: string): TeamState {
  const next = withoutPlayerInLineup(s, id)
  const pc = { ...next.pc }
  delete pc[id]
  return { ...next, players: next.players.filter((p) => p.id !== id), pc }
}

export function setSortDir(s: TeamState, dir: 'asc' | 'desc'): TeamState {
  return sortPlayers({ ...s, sortDir: dir })
}

/** 예시 데이터를 모두 지우고 빈 상태로 시작한다. */
export function clearSample(): TeamState {
  return emptyState()
}
