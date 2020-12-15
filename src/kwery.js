import { Kwery, Mutation } from "./data";

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

export function query(key, args, options) {
  let resolver = kweries.get(key);

  if (!resolver) {
    throw new Error(`Query ${key} not registered`);
  }

  if (!Array.isArray(args)) {
    options = args;
    args = [];
  }

  let kwery = new Kwery({ key, resolver });

  if (options) {
    kwery._setOptions(options);
  }

  return _reactive(kwery.fetchData(...args));
}

const meutasions = new Map();
function addToMutations(client, mutations) {
  for (let key in mutations) {
    let mutation = mutations[key];

    if (client) {
      mutation = (...args) => mutation(client, ...args);
    }

    let mut = new Mutation({ key, resolver: mutation });
    meutasions.set(key, mut);
  }
}

export function mutate(cb) {
  return _reactive(cb(meutasions));
}

function createKwery({ queries, mutations, client, Vue }) {
  _reactive = Vue.observable ? Vue.observable : Vue.reactive;
  addToKweries(client, queries);
  addToMutations(client, mutations);

  return {
    query,
    mutate,
  };
}

export default createKwery;
