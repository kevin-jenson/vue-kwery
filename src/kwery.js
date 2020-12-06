import { observable } from "vue";
import Data from "./data";

const store = new Map();

function resolve(key, cb) {
  if (store.has(key)) {
    return store.get(key);
  }

  let data = observable(new Data());

  let result = cb();

  if (typeof result.then === "function") {
    result
      .then((response) => {
        data.status = Data.STATUSES.success;
        data.data = response;
      })
      .catch((error) => {
        data.status = Data.STATUSES.error;
        data.data = error;
      });
  } else {
    data.status === Data.STATUSES.success;
    data.data = result;
  }

  store.set(key, data);

  return store.get(key);
}

const kweries = {};
function addToKweries(client, queries) {
  for (let key in queries) {
    let query = queries[key];
    let argsCount = query.length;

    if (client) {
      query = (...args) => query(client, ...args);
      argsCount -= 1;
    }

    Object.defineProperty(kweries, key, {
      get() {
        if (argsCount > 0) {
          return function (...args) {
            return resolve(key, () => query(...args));
          };
        }

        return resolve(key, query);
      },
    });
  }
}

export function query(cb) {
  return cb(kweries);
}

function statelessResolve(cb) {
  let data = observable({ status: Data.STATUSES.pending, data: null });

  let result = cb();

  if (typeof result.then === "function") {
    result
      .then((response) => {
        data.status = Data.STATUSES.success;
        data.data = response;
      })
      .catch((error) => {
        data.status = Data.STATUSES.error;
        data.data = error;
      });
  } else {
    data.status = Data.STATUSES.success;
    data.data = result;
  }

  return data;
}

const meutasions = {};
function addToMutations(client, mutations) {
  for (let key in mutations) {
    let mutation = mutations[key];

    function mutationWrapper(...args) {
      if (client) {
        return statelessResolve(() => mutation(client, ...args));
      }
      return statelessResolve(() => mutation(...args));
    }

    meutasions[key] = mutationWrapper;
  }
}

export function mutate(cb) {
  return cb(meutasions);
}

function createKwery({ queries, mutations, client }) {
  addToKweries(client, queries);
  addToMutations(client, mutations);

  return {
    query,
    mutate,
  };
}

export default createKwery;
