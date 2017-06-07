const sqltomango = require('..');
const assert = require('assert');

describe('exception tests', function() {

  it('should throw on empty string', function() {
    assert.throws(function() {
      var q = sqltomango('');
    });
  });

  it('should throw on non string', function() {
    assert.throws(function() {
      var q = sqltomango(null);
    });
  });

  it('should throw on invalid SQL', function() {
    assert.throws(function() {
      var q = sqltomango('SELECT FROM a');
    });
  });

  it('should throw on DISTINCT', function() {
    assert.throws(function() {
      var q = sqltomango("SELECT DISTINCT(x) FROM mytable WHERE y='2'");
    });
  });

  it('should throw on aggregation', function() {
    assert.throws(function() {
      var q = sqltomango("SELECT SUM(x) FROM mytable WHERE y='2'");
    });
  });

  it('should throw on GROUP BY', function() {
    assert.throws(function() {
      var q = sqltomango("SELECT x FROM mytable WHERE y='2' GROUP BY 1");
    });
  });

  it('should throw on JOIN', function() {
    assert.throws(function() {
      var q = sqltomango("SELECT x FROM mytable LEFT JOIN mytable2 ON id=id WHERE y='2'");
    });
  });

  it('should throw on UNION', function() {
    assert.throws(function() {
      var q = sqltomango("SELECT x FROM mytable1 UNION ALL SELECT y FROM mytable2");
    });
  });

  it('should throw on functions in the fields', function() {
    assert.throws(function() {
      var q = sqltomango("SELECT AVG(x) FROM mytable");
    });
  });

  it('should throw on functions in the selector', function() {
    assert.throws(function() {
      var q = sqltomango("SELECT x FROM mytable WHERE COS(y) > 0.5");
      console.log(q);
    });
  });

  it('throw on aliases', function() {
    assert.throws(function() {
      var q = sqltomango("SELECT a as x,b,c.owner.name FROM mytable");
    });
  });

  it('throw on mixed sort order', function() {
    assert.throws(function() {
      var q = sqltomango("SELECT a,b,c FROM mytable WHERE d > '1' ORDER BY e DESC,f ASC");
    });
  });



})