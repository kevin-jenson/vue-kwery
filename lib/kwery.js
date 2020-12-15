"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.query = query;
exports.mutate = mutate;
exports.default = void 0;

var _data = require("./data");

let _reactive;

const kweries = new Map();

function addToKweries(client, queries) {
  for (let key in queries) {
    let query = queries[key];
    let type = typeof query;

    if (type !== "function") {
      console.warn(`query resolver must of type function recieved ${type} for ${key}`);
      continue;
    }

    if (client) {
      query = (...args) => query(client, ...args);
    }

    kweries.set(key, query);
  }
}

function query(key, args, options) {
  let resolver = kweries.get(key);

  if (!resolver) {
    throw new Error(`Query ${key} not registered`);
  }

  if (!Array.isArray(args)) {
    options = args;
    args = [];
  }

  let kwery = new _data.Kwery({
    key,
    resolver
  });

  if (options) {
    kwery._setOptions(options);
  }

  return _reactive(kwery.fetchData(...args));
}

query.invalidateQuery = _data.Kwery.invalidateQuery;
query.setQueryData = _data.Kwery.updateStore;
const meutasions = new Map();

function addToMutations(client, mutations) {
  for (let key in mutations) {
    let mutation = mutations[key];

    if (client) {
      mutation = (...args) => mutation(client, ...args);
    }

    meutasions.set(key, mutation);
  }
}

function mutate(key, args, options) {
  let resolver = meutasions.get(key);

  if (!resolver) {
    throw new Error(`Query ${key} not registered`);
  }

  if (!Array.isArray(args)) {
    args = options;
    args = [];
  }

  let mutation = new _data.Mutation({
    key,
    resolver
  });

  if (options) {
    mutation._setOptions(options);
  }

  return _reactive(mutation.fetchData(...args));
}

function createKwery({
  queries,
  mutations,
  client,
  Vue
}) {
  _reactive = Vue.observable ? Vue.observable : Vue.reactive;
  addToKweries(client, queries);
  addToMutations(client, mutations);
  return {
    query,
    mutate
  };
}

var _default = createKwery;
exports.default = _default;