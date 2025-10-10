import test from 'node:test'
import assert from 'node:assert/strict'
import * as sqltomango from '../index.js'

test('should parse where-free query', function () {
  const q = sqltomango.parse('SELECT a FROM mytable')
  assert.deepEqual(q, { table: 'mytable', fields: ['a'] })
})

test('should handle multiple fields', function () {
  const q = sqltomango.parse('SELECT a,b,c FROM mytable')
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'] })
})

test('should handle SELECT *', function () {
  const q = sqltomango.parse('SELECT * FROM mytable')
  assert.deepEqual(q, { table: 'mytable' })
})

test('should handle WHERE =', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d='dog'")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: 'dog' } } })
})

test('should handle integers', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d=1")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: 1 } } })
})

test('should respect quotes', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d='1'")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: '1' } } })
})

test('should handle dates', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d='2018-01-02'")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: '2018-01-02' } } })
})

test('should handle floats', function () {
  const q = sqltomango.parse('SELECT a,b,c FROM mytable WHERE d=1.525')
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: 1.525 } } })
})

test('should handle bools', function () {
  const q = sqltomango.parse('SELECT a,b,c FROM mytable WHERE d=true')
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: true } } })
})

test('should handle WHERE !=', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d!='1'")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $ne: '1' } } })
})

test('should handle WHERE >', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1'")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gt: '1' } } })
})

test('should handle WHERE >=', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d >= '1'")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gte: '1' } } })
})

test('should handle WHERE <', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d < '1'")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $lt: '1' } } })
})

test('should handle negative numbers', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d < -1")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $lt: -1 } } })
})

test('should handle WHERE <=', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d <= '1'")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $lte: '1' } } })
})

test('should handle WHERE x AND y', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d <= '1' AND e = '2'")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { $and: [{ d: { $lte: '1' } }, { e: { $eq: '2' } }] } })
})

test('should handle WHERE x OR y', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d <= '1' OR e = '2'")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { $or: [{ d: { $lte: '1' } }, { e: { $eq: '2' } }] } })
})

test('should handle WHERE x OR (y AND z)', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d <= '1' OR (e = '2' AND f = '3')")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { $or: [{ d: { $lte: '1' } }, { $and: [{ e: { $eq: '2' } }, { f: { $eq: '3' } }] }] } })
})

test('should handle ORDER BY e ASC', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1' ORDER BY e ASC")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gt: '1' } }, sort: [{ e: 'asc' }] })
})

test('should handle ORDER BY e DESC', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1' ORDER BY e DESC")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gt: '1' } }, sort: [{ e: 'desc' }] })
})

test('should handle ORDER BY e,f', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1' ORDER BY e,f")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gt: '1' } }, sort: [{ e: 'asc' }, { f: 'asc' }] })
})

test('should handle ORDER BY e DESC,f DESC', function () {
  const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1' ORDER BY e DESC,f DESC")
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gt: '1' } }, sort: [{ e: 'desc' }, { f: 'desc' }] })
})

test('should handle LIMIT 100', function () {
  const q = sqltomango.parse('SELECT a,b,c FROM mytable LIMIT 100')
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], limit: 100 })
})

test('should handle LIMIT 200,100', function () {
  const q = sqltomango.parse('SELECT a,b,c FROM mytable LIMIT 200, 100')
  assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], limit: 100, skip: 200 })
})

test('should handle IN', function() {
  const q = sqltomango.parse("SELECT * FROM mytable WHERE x IN ('a','b','c')")
  assert.deepEqual(q, { table: 'mytable',selector:{ x: { $in: ['a','b','c'] }} })
})

test('should handle NOT IN', function() {
  const q = sqltomango.parse("SELECT * FROM mytable WHERE x NOT IN ('a','b','c')")
  assert.deepEqual(q, { table: 'mytable',selector:{ x: { $nin: ['a','b','c'] }} })
})
