// SQL parser library
var sqlparser = require('sql-parser');

// simplifies value objects to allow dot notation for accessing objects e.g. person.name
// strips back ticks so that `person.name` becomes person.name
var simplify = function(obj) {
  return obj.toString().replace(/^[`']/,'').replace(/[`']$/,'');
}


// recursive function that dives into the tree of parsed WHERE clauses and creates
// the equivalent selector. The selector function calls itself as it meets operators
// like AND and OR, making the JSON tree deeper at this point.
// s - the selector object to be added to
// condition - the parsed SQL condition to be converted.
var selector = function(s, condition) {

  switch (condition.operation.toUpperCase()) {
    case '=':
      s[simplify(condition.left)] = { '$eq' : simplify(condition.right) };
    break;

    case '!=':
      s[simplify(condition.left)] = { '$not' : simplify(condition.right) };
    break;

    case '<':
      s[simplify(condition.left)] = { '$lt' : simplify(condition.right) };
    break;

    case '<=':
      s[simplify(condition.left)] = { '$lte' : simplify(condition.right) };
    break;

    case '>':
      s[simplify(condition.left)] = { '$gt' : simplify(condition.right) };
    break;

    case '>=':
      s[simplify(condition.left)] = { '$gte' : simplify(condition.right) };
    break;

    case 'IN':
      s[simplify(condition.left)] = { '$in' : condition.right.value.map(function(v) { return v.value}) };    
    break;

    case 'NOT IN':
      s[simplify(condition.left)] = { '$nin' : condition.right.value.map(function(v) { return v.value}) };    
    break;

    case 'AND':
      var op = '$and';
      s[op] = {};
      selector(s[op], condition.left);
      selector(s[op], condition.right);      
    break;

    case 'OR':
      var op = '$or';
      s[op] = {};
      selector(s[op], condition.left);
      selector(s[op], condition.right);      
    break;

    default: 
      throw(new Error('unsupported SQL operation ' + condition.operation));
  }

  return s;
};


// parase an SQL query and return the equivalent Cloudant QUERY
var parse = function(query) {

  // empty cloudant query object
  var obj = {
    fields: null
  };

  // parse the SQL into a tree
  var tree = sqlparser.parse(query);

  // look for exceptions
  if (tree.distinct) {
    throw new Error('DISTINCT not supported');
  }
  if (tree.joins.length > 0) {
    throw new Error('joins not supported');
  }
  if (tree.unions.length > 0) {
    throw new Error('unions not supported');
  }
  if (tree.group) {
    throw new Error('GROUP not supported');
  }

  // extract the field list 
  if (tree.fields && tree.fields.toString() !== '*') {
    obj.fields = [];
    for(var i in tree.fields) {
      var field = tree.fields[i];
      if (!field.field.value) {
        throw new Error(field.toString() + ' not supported');
      }
      obj.fields.push(simplify(field.field))
      
    }
  } else {
    obj.fields = null;
  }

  // extract where clauses by recursively walking the tree
  obj.selector = selector({}, tree.where.conditions);

  // extract order by and convert to mango syntax
  if (tree.order && tree.order.orderings) {
    obj.sort = [];
    var lastorder = null;
    for(var i in tree.order.orderings) {
      var t = tree.order.orderings[i];
      var s = {
      }; 
      s[t.value.value] = (t.direction === 'ASC') ? 'asc' : 'desc';
      if (lastorder != null && s[t.value.value] != lastorder) {
        throw new Error('ORDER BY must be either all ASC or all DESC, not mixed')
      }
      lastorder = s[t.value.value];
      obj.sort.push(s);
    }
  }

  // skip and limit
  if (tree.limit) {
    obj.limit = tree.limit.value.value;
    if (tree.limit.offset) {
      obj.skip = tree.limit.offset.value;
    }
  }

  return obj;
};

module.exports = parse;