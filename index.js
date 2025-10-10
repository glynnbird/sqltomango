// SQL parser library
import SQLParser from 'node-sql-parser'

// SQLParser does most of the work, but it returns floating
// point numbers as strings
function tidy(p) {
  if (p.type === 'number' && typeof p.value === 'string') {
    return parseFloat(p.value)
  } else {
    return p.value
  }
}

// recursive function that dives into the tree of parsed WHERE clauses and creates
// the equivalent selector. The selector function calls itself as it meets operators
// like AND and OR, making the JSON tree deeper at this point.
// s - the selector object to be added to
// condition - the parsed SQL condition to be converted.
const selector = function (s, condition) {
  let op = null
  switch (condition.operator) {
    case '=':
      s[condition.left.column] = { $eq: tidy(condition.right) }
      break

    case '!=':
      s[condition.left.column] = { $ne: tidy(condition.right) }
      break

    case '<':
      s[condition.left.column] = { $lt: tidy(condition.right) }
      break

    case '<=':
      s[condition.left.column] = { $lte: tidy(condition.right) }
      break

    case '>':
      s[condition.left.column] = { $gt: tidy(condition.right) }
      break

    case '>=':
      s[condition.left.column] = { $gte: tidy(condition.right) }
      break

    case 'IN':
      s[condition.left.column] = { $in: condition.right.value.map(function (v) { return tidy(v) }) }
      break

    case 'NOT IN':
      s[condition.left.column] = { $nin: condition.right.value.map(function (v) { return tidy(v) }) }
      break

    case 'AND':
      op = '$and'
      s[op] = []
      s[op].push(selector({}, condition.left))
      s[op].push(selector({}, condition.right))
      break

    case 'OR':
      op = '$or'
      s[op] = []
      s[op].push(selector({}, condition.left))
      s[op].push(selector({}, condition.right))
      break

    default:
      throw (new Error('unsupported SQL operation ' + condition.operation))
  }

  return s
}

// parase an SQL query and return the equivalent Cloudant QUERY
export function parse(query) {
  // throw on non string
  if (typeof query !== 'string') {
    throw (new Error('query must be a string'))
  }

  // empty cloudant query object
  const obj = {}

  // parse the SQL into a tree
  const parser = new SQLParser.Parser()
  let tree
  try {
    tree = parser.astify(query)
  } catch (e) {
    throw('Failed to parse SQL')
  }

  // extract table name
  obj.table = tree.from[0].table

  // look for exceptions
  if (tree.type !== 'select') {
    throw new Error('must be select')
  }
  if (tree.distinct !== null) {
    throw new Error('distinct not allowed')
  }
  if (tree.groupby !== null) {
    throw new Error('groupby not allowed')
  }
  if (tree.having !== null) {
    throw new Error('having not allowed')
  }
  if (tree.collate !== null) {
    throw new Error('collate not allowed')
  }

  // extract the field list
  if (tree.columns) {
    obj.fields = []
    for (const i in tree.columns) {
      const field = tree.columns[i]
      if (field.as) {
        throw new Error('as not allowed')
      }
      if (field.expr.table !== null) {
        throw new Error('table.column not allowed')
      }
      if (field.expr.type === 'column_ref') {
        if (field.expr.column !== '*') {
          obj.fields.push(field.expr.column)
        }
      }
    }
    if (obj.fields.length === 0) {
      delete obj.fields
    }
  }

  // extract where clauses by recursively walking the tree
  if (tree.where) {
    obj.selector = selector({}, tree.where)
  }

  // extract order by and convert to mango syntax
  if (tree.orderby) {
    obj.sort = []
    let lastorder = null
    for (const i in tree.orderby) {
      const t = tree.orderby[i]
      const s = {}
      s[t.expr.column] = (t.type === 'DESC') ? 'desc' : 'asc'
      if (lastorder != null && s[t.expr.column] !== lastorder) {
        throw new Error('ORDER BY must be either all ASC or all DESC, not mixed')
      }
      lastorder = s[t.expr.column]
      obj.sort.push(s)
    }
  }

  // skip and limit
  if (tree.limit) {
    obj.limit = tree.limit.value[0].value
    if (tree.limit.value.length > 1) {
      obj.skip = tree.limit.value[0].value
      obj.limit = tree.limit.value[1].value
    }
  }

  return obj
}
