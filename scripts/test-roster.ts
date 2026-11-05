import assert from 'node:assert/strict'
import {
  addPlayer,
  clearAttend,
  emptyState,
  normalizeState,
  removePlayer,
  rosterOf,
  selectAll,
  setAttend,
  setSortDir,
} from '../src/lib/roster.ts'

let s = emptyState()
for (const n of ['최동현', '가나다', '박성진']) {
  const r = addPlayer(s, n)
  assert.ok(r.ok)
  s = r.state
}
assert.deepEqual(s.players.map((p) => p.name), ['가나다', '박성진', '최동현'], '가나다순으로 들어간다')
assert.equal(s.attend.length, 3, '추가한 선수는 참석 처리된다')

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
