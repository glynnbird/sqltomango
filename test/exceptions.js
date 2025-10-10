
import test from 'node:test'
import assert from 'node:assert/strict'
import * as sqltomango from '../index.js'

// run the tests on the original and browser-compatible code
test('should throw on empty string', function () {
  assert.throws(function () {
    sqltomango.parse('')
  })
})

test('should throw on non string', function () {
  assert.throws(function () {
    sqltomango.parse(null)
  })
})

test('should throw on invalid SQL', function () {
  assert.throws(function () {
    sqltomango.parse('SELECT FROM a')
  })
})

test('should throw on DISTINCT', function () {
  assert.throws(function () {
    sqltomango.parse("SELECT DISTINCT(x) FROM mytable WHERE y='2'")
  })
})

test('should throw on aggregation', function () {
  assert.throws(function () {
    sqltomango.parse("SELECT SUM(x) FROM mytable WHERE y='2'")
  })
})

test('should throw on GROUP BY', function () {
  assert.throws(function () {
    sqltomango.parse("SELECT x FROM mytable WHERE y='2' GROUP BY 1")
  })
})

test('should throw on functions in the fields', function () {
  assert.throws(function () {
    sqltomango.parse('SELECT AVG(x) FROM mytable')
  })
})

test('throw on aliases', function () {
  assert.throws(function () {
    sqltomango.parse('SELECT a as x,b,c.owner.name FROM mytable')
  })
})

test('throw on mixed sort order', function () {
  assert.throws(function () {
    sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1' ORDER BY e DESC,f ASC")
  })
})

