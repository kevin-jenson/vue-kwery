import { observable } from "vue";
import Kwery from "./data";

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
        let kwery = new Kwery({ key, resolver: query });

        if (argsCount > 0) {
          return function (...args) {
            return kwery.fetchData(...args);
          };
        }

        return kwery.fetchData();
      },
    });
  }
}

export function query(cb) {
  return cb(kweries);
}

function statelessResolve(cb) {
  let data = observable({ status: Kwery.STATUSES.pending, data: null });

  let result = cb();

  if (typeof result.then === "function") {
    result
      .then(response => {
        data.status = Kwery.STATUSES.success;
        data.data = response;
      })
      .catch(error => {
        data.status = Kwery.STATUSES.error;
        data.data = error;
      });
  } else {
    data.status = Kwery.STATUSES.success;
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
