import { observable } from "vue";
import { Kwery, Mutation } from "./data";

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
        let kwery = observable(new Kwery({ key, resolver: query }));

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

export function query(cb, options) {
  Kwery.addOptionsToInstance(options);
  return cb(kweries);
}

const meutasions = {};
function addToMutations(client, mutations) {
  for (let key in mutations) {
    let mutation = mutations[key];

    if (client) {
      mutation = (...args) => mutation(client, ...args);
    }

    function mutationWrapper(...args) {
      let mut = observable(new Mutation({ key, resolver: mutation }));

      return mut.fetchData(...args);
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
