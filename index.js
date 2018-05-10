// SQL parser library
var sqlparser = require('./sqlparser/index.js');

// simplifies value objects to allow dot notation for accessing objects e.g. person.name
// strips back ticks so that `person.name` becomes person.name
var simplify = function(obj) {
  var str = obj.toString().replace(/^[`']/,'').replace(/[`']$/,'');
  // if it contains backticks, it's too complex for Mango e.g. COS(`x`)
  if (str.match(/`/)) {
    throw new Error(str + ' not supported');
  }
  return str;
};

// simplifies and then tries to infer types from the data for value parameters in the WHERE clause
// e.g. "2.5" --> 2.5
//       "2"  --> 2
//      "true" --> true etc
var parameterise = function(obj) {
  var str = simplify(obj);
  var u = str.toUpperCase();

  // if the thing is numeric, parse as number
  if (str.match(/^[\-0-9\.]+$/)) {
    if (str.match(/\./)) {
      return parseFloat(str);
    } else {
      return parseInt(str);
    }
  } else if (u === 'TRUE') {
    return true;
  } else if (u === 'FALSE') {
    return false;
  } else {
    return str;
  }
};

// recursive function that dives into the tree of parsed WHERE clauses and creates
// the equivalent selector. The selector function calls itself as it meets operators
// like AND and OR, making the JSON tree deeper at this point.
// s - the selector object to be added to
// condition - the parsed SQL condition to be converted.
var selector = function(s, condition) {
  var op = null;
  
  switch (condition.operation.toUpperCase()) {
    case '=':
      s[simplify(condition.left)] = { '$eq' : parameterise(condition.right) };
    break;

    case '!=':
      s[simplify(condition.left)] = { '$ne' : parameterise(condition.right) };
    break;

    case '<':
      s[simplify(condition.left)] = { '$lt' : parameterise(condition.right) };
    break;

    case '<=':
      s[simplify(condition.left)] = { '$lte' : parameterise(condition.right) };
    break;

    case '>':
      s[simplify(condition.left)] = { '$gt' : parameterise(condition.right) };
    break;

    case '>=':
      s[simplify(condition.left)] = { '$gte' : parameterise(condition.right) };
    break;

    case 'IN':
      s[simplify(condition.left)] = { '$in' : condition.right.value.map(function(v) { return v.value}) };    
    break;

    case 'NOT IN':
      s[simplify(condition.left)] = { '$nin' : condition.right.value.map(function(v) { return v.value}) };    
    break;

    case 'AND':
      op = '$and';
      s[op] = [];
      s[op].push(selector({}, condition.left));
      s[op].push(selector({}, condition.right));      
    break;

    case 'OR':
      op = '$or';
      s[op] = [];
      s[op].push(selector({}, condition.left));
      s[op].push(selector({}, condition.right));      
    break;

    default: 
      throw(new Error('unsupported SQL operation ' + condition.operation));
  }

  return s;
};


// parase an SQL query and return the equivalent Cloudant QUERY
var parse = function(query) {

  // throw on non string
  if (typeof query !== 'string') {
    throw(new Error('query must be a string'));
  }

  // empty cloudant query object
  var obj = { };

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
      
      // aliases not supported
      if (field.name !== null) {
        throw new Error('alias ' + field.toString() + ' not supported');
      }

      // complex things in the field list not supported
      if (!field.field.value) {
        throw new Error(field.toString() + ' not supported');
      }
      obj.fields.push(simplify(field.field))
      
    }
  } 

  // extract where clauses by recursively walking the tree
  if (tree.where) {
    obj.selector = selector({}, tree.where.conditions);
  }

  // extract order by and convert to mango syntax
  if (tree.order && tree.order.orderings) {
    obj.sort = [];
    var lastorder = null;
    for(var i in tree.order.orderings) {
      var t = tree.order.orderings[i];
      var s = {
      }; 
      s[t.value.value] = (t.direction.toUpperCase() === 'DESC') ? 'desc' : 'asc';
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

module.exports = {
  parse: parse
};