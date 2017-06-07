# sqltomango

A simple Node.js library that converts Structured Query Language (SQL) into CouchDB Mango / Cloudant Query JSON objects.

## Installation

Use *sqltomango* in your project with:

```sh
npm install --save sqltomango
```

Import the library into your code:

```js
const sqltomango = require('sqltomango');
```

## Usage

The *sqltomango* library is a single function that accepts one argument - a string containing the SQL you wish to convert to a query object:

```js
var q = sqltomango("SELECT * FROM dogs WHERE owner = 'glynn'")
```

It returns an object which can be used to to query a CouchDB or Cloudant database:

```js
{
 "fields": null,
 "selector": {
  "owner": {
   "$eq": "glynn"
  }
 }
}
```

This works for more complex queries too:

```js
var q = sqltomango("SELECT _id, age, breed FROM dogs WHERE owner = 'glynn' OR (name='towser' AND colour='white') ORDER BY age DESC LIMIT 500,1500")
// produces...
{
 "fields": [
  "_id",
  "age",
  "breed"
 ],
 "selector": {
  "$or": {
   "owner": {
    "$eq": "glynn"
   },
   "$and": {
    "name": {
     "$eq": "towser"
    },
    "colour": {
     "$eq": "white"
    }
   }
  }
 },
 "sort": [
  {
   "age": "desc"
  }
 ],
 "limit": 1500,
 "skip": 500
}
```

## Errors

An exception is thrown if the SQL does not parse or contains SQL features not supported by Mango including:

- GROUP BY
- SUM/COUNT/DISTINCT
- UNION
- JOIN
