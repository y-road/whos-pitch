import assert from 'node:assert/strict'
import {
  addPlayer,
  addPlayers,
  parseNames,
  clearAttend,
  emptyState,
  normalizeState,
  removePlayer,
  rosterOf,
  selectAll,
  setAttend,
  setSortDir,
} from '../src/lib/roster.ts'
import { seedState } from '../src/lib/seed.ts'
import { clearSample } from '../src/lib/roster.ts'

let s = emptyState()
for (const n of ['최동현', '가나다', '박성진']) {
  const r = addPlayer(s, n)
  assert.ok(r.ok)
  s = r.state
}
assert.deepEqual(s.players.map((p) => p.name), ['가나다', '박성진', '최동현'], '가나다순으로 들어간다')
assert.equal(s.attend.length, 0, '추가한 선수는 불참 상태로 시작한다')
s = selectAll(s)
assert.equal(s.attend.length, 3, '전체 선택하면 모두 참석')

assert.deepEqual(addPlayer(s, '  가나다 '), { ok: false, error: '이미 있는 이름이에요' })
assert.deepEqual(addPlayer(s, '   '), { ok: false, error: '이름을 입력해 주세요' })

s = setSortDir(s, 'desc')
assert.deepEqual(s.players.map((p) => p.name), ['최동현', '박성진', '가나다'], '내림차순')

// 라인업에 배치된 선수는 참석 해제 시 모든 쿼터에서 빠진다
const id = s.players[0].id
s = { ...s, q: s.q.map((quarter) => ({ ...quarter, [id]: { x: 50, y: 50 } })) }
s = setAttend(s, id, false)
assert.ok(!s.attend.includes(id))
assert.ok(s.q.every((quarter) => !(id in quarter)))

s = selectAll(s)
assert.equal(s.attend.length, 3)
s = clearAttend(s)
assert.equal(s.attend.length, 0, '전체 해제')

// 용병은 전체 해제에서 유지되고 명단에는 보이지 않는다
s = { ...s, players: [...s.players, { id: 'p9', name: '용병1', merc: true }], attend: ['p9'] }
s = clearAttend(s)
assert.deepEqual(s.attend, ['p9'])
assert.equal(rosterOf(s).length, 3)

s = removePlayer(s, 'p9')
assert.equal(s.players.length, 3)

// DB에서 이상한 값이 와도 앱이 죽지 않는다
assert.equal(normalizeState(null).q.length, 4)
assert.equal(normalizeState({ players: 'x', q: [1] }).players.length, 0)
assert.deepEqual(normalizeState({ players: [{ id: 'a', name: '가' }], attend: ['a', 'zz'] }).attend, ['a'])

console.log('roster tests passed')

// 예시 데이터(seed)와 지우기
{
  const seeded = seedState()
  assert.equal(seeded.sample, true)
  assert.equal(normalizeState(JSON.parse(JSON.stringify(seeded))).sample, true)
  assert.equal(normalizeState(emptyState()).sample, undefined)
  // 선수 추가·참석 변경 같은 일반 편집은 예시 표시를 유지한다
  const added = addPlayer(seeded, '새선수')
  assert.ok(added.ok && added.state.sample === true)
  assert.equal(setAttend(seeded, seeded.players[0].id, false).sample, true)
  // 지우면 빈 상태, 표시도 사라진다
  const cleared = clearSample()
  assert.equal(cleared.sample, undefined)
  assert.equal(cleared.players.length, 0)
  assert.equal(cleared.attend.length, 0)
  assert.ok(cleared.q.every((q) => Object.keys(q).length === 0))
}
console.log('seed/sample: ok')

// 여러 명 한 번에 추가
assert.deepEqual(parseNames('철수, 영희\n민수  1. 지수 - 하나'), ['철수', '영희', '민수', '지수', '하나'])
{
  const base = emptyState()
  const r = addPlayers(base, '철수, 영희\n철수\n아주아주아주긴이름이에요요요')
  assert.ok(r.ok)
  if (r.ok) {
    assert.deepEqual(r.added, ['철수', '영희'])
    assert.deepEqual(r.dup, ['철수'])
    assert.equal(r.long.length, 1)
    assert.equal(r.state.players.length, 2)
    assert.equal(r.state.attend.length, 0, '새 선수는 불참')
  }
  assert.deepEqual(addPlayers(base, '  , \n'), { ok: false, error: '이름을 입력해 주세요' })
  const one = addPlayers(base, '가')
  assert.ok(one.ok)
  if (one.ok) assert.deepEqual(addPlayers(one.state, '가'), { ok: false, error: '이미 있는 이름이에요' })
}
