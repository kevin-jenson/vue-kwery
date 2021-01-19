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

    let queryFn = client
      ? (...args) => query(client, ...args)
      : query;

    kweries.set(key, queryFn);
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

query.invalidateQuery = Kwery.invalidateQuery;
query.setQueryData = Kwery.updateStore;

const meutasions = new Map();
function addToMutations(client, mutations) {
  for (let key in mutations) {
    let mutation = mutations[key];

    let mutationFn = client
      ? (...args) => mutation(client, ...args)
      : mutation;

    meutasions.set(key, mutationFn);
  }
}

export function mutate(key, args, options) {
  let resolver = meutasions.get(key);

  if (!resolver) {
    throw new Error(`Query ${key} not registered`);
  }

  if (!Array.isArray(args)) {
    args = options;
    args = [];
  }

  let mutation = new Mutation({ key, resolver });

  if (options) {
    mutation._setOptions(options);
  }

  return _reactive(mutation.fetchData(...args));
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

export const STATUSES = Kwery.STATUSES;

export default createKwery;
