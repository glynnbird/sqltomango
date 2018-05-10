# sqltomango

[![Build Status](https://travis-ci.org/ibm-cds-labs/sqltomango.svg?branch=master)](https://travis-ci.org/ibm-cds-labs/sqltomango) [![npm version](https://badge.fury.io/js/sqltomango.svg)](https://badge.fury.io/js/sqltomango)

A simple Node.js library that converts Structured Query Language (SQL) into CouchDB Mango / Cloudant Query JSON objects. Mango is the code name for the query language used in Apache CouchDB and IBM Cloudant. It uses JSON to represent queries. This tool converts SQL strings into Mango objects, to allow users to interact with CouchDB/Cloudant database with SQL queries.

## Installation

Use *sqltomango* in your project with:

```sh
npm install --save sqltomango
```

Import the library into your code:

```js
var sqltomango = require('sqltomango');
```

## Usage

The *sqltomango* library is a single function that accepts one argument - a string containing the SQL you wish to convert to a query object:

```js
var q = sqltomango.parse("SELECT * FROM dogs WHERE owner = 'glynn'")
```

It returns an object which can be used to to query a CouchDB or Cloudant database:

```js
{
 "selector": {
  "owner": {
   "$eq": "glynn"
  }
 }
}
```

This works for more complex queries too:

```js
var q = sqltomango.parse("SELECT _id, age, breed FROM dogs WHERE owner = 'glynn' OR (name='towser' AND colour='white') ORDER BY age DESC LIMIT 500,1500")
// produces...
{
 "fields": [
  "_id",
  "age",
  "breed"
 ],
 "selector": {
  "$or": [
   {
    "owner": {
     "$eq": "glynn"
    }
   },
   {
    "$and": [
     {
      "name": {
       "$eq": "towser"
      }
     },
     {
      "colour": {
       "$eq": "white"
      }
     }
    ]
   }
  ]
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
- SUM/COUNT/AVG/DISTINCT
- UNION
- JOIN

