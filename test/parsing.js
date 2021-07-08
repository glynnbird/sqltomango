const sqltomango = require('..')
const assert = require('assert');

['..'].forEach(function (r) {
  describe('parsing tests - ' + r, function () {
    it('should parse where-free query', function () {
      const q = sqltomango.parse('SELECT a FROM mytable')
      assert.deepEqual(q, { table: 'mytable', fields: ['a'] })
    })

    it('should handle multiple fields', function () {
      const q = sqltomango.parse('SELECT a,b,c FROM mytable')
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'] })
    })

    it('should handle dot notation ', function () {
      const q = sqltomango.parse('SELECT a,b,c.owner.name FROM mytable')
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c.owner.name'] })
    })

    it('should handle SELECT *', function () {
      const q = sqltomango.parse('SELECT * FROM mytable')
      assert.deepEqual(q, { table: 'mytable' })
    })

    it('should handle WHERE =', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d='dog'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: 'dog' } } })
    })

    it('should handle integers', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d='1'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: 1 } } })
    })

    it('should respect quotes', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d='1'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: '1' } } })
    })

    it('should handle dates', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d='2018-01-02'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: '2018-01-02' } } })
    })

    it('should handle floats', function () {
      const q = sqltomango.parse('SELECT a,b,c FROM mytable WHERE d=1.525')
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: 1.525 } } })
    })

    it('should handle bools', function () {
      const q = sqltomango.parse('SELECT a,b,c FROM mytable WHERE d=true')
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $eq: true } } })
    })

    it('should handle WHERE = with dot notation', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE name.d='1'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { 'name.d': { $eq: '1' } } })
    })

    it('should handle WHERE !=', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d!='1'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $ne: '1' } } })
    })

    it('should handle WHERE >', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gt: '1' } } })
    })

    it('should handle WHERE >=', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d >= '1'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gte: '1' } } })
    })

    it('should handle WHERE <', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d < '1'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $lt: '1' } } })
    })

    it('should handle negative numbers', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d < '-1'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $lt: -1 } } })
    })

    it('should handle WHERE <=', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d <= '1'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $lte: '1' } } })
    })

    it('should handle WHERE x AND y', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d <= '1' AND e = '2'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { $and: [{ d: { $lte: '1' } }, { e: { $eq: '2' } }] } })
    })

    it('should handle WHERE x OR y', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d <= '1' OR e = '2'")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { $or: [{ d: { $lte: '1' } }, { e: { $eq: '2' } }] } })
    })

    it('should handle WHERE x OR (y AND z)', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d <= '1' OR (e = '2' AND f = '3')")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { $or: [{ d: { $lte: '1' } }, { $and: [{ e: { $eq: '2' } }, { f: { $eq: '3' } }] }] } })
    })

    it('should handle ORDER BY e ASC', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1' ORDER BY e ASC")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gt: '1' } }, sort: [{ e: 'asc' }] })
    })

    it('should handle ORDER BY e DESC', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1' ORDER BY e DESC")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gt: '1' } }, sort: [{ e: 'desc' }] })
    })

    it('should handle ORDER BY e,f', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1' ORDER BY e,f")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gt: '1' } }, sort: [{ e: 'asc' }, { f: 'asc' }] })
    })

    it('should handle ORDER BY e DESC,f DESC', function () {
      const q = sqltomango.parse("SELECT a,b,c FROM mytable WHERE d > '1' ORDER BY e DESC,f DESC")
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], selector: { d: { $gt: '1' } }, sort: [{ e: 'desc' }, { f: 'desc' }] })
    })

    it('should handle LIMIT 100', function () {
      const q = sqltomango.parse('SELECT a,b,c FROM mytable LIMIT 100')
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], limit: 100 })
    })

    it('should handle LIMIT 200,100', function () {
      const q = sqltomango.parse('SELECT a,b,c FROM mytable LIMIT 200, 100')
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], limit: 100, skip: 200 })
    })

    it('should handle LIMIT 100 OFFSET 200', function () {
      const q = sqltomango.parse('SELECT a,b,c FROM mytable LIMIT 100 OFFSET 200')
      assert.deepEqual(q, { table: 'mytable', fields: ['a', 'b', 'c'], limit: 100, skip: 200 })
    })
  })
})
