import { observable } from "vue";

const store = new Map();

export const STATUSES = {
  pending: "PENDING",
  error: "ERROR",
  success: "SUCCESS",
};

function resolve(key, cb) {
  if (store.has(key)) {
    return store.get(key);
  }

  let data = observable({ status: STATUSES.pending, data: null });

  let result = cb();

  if (typeof result.then === "function") {
    result
      .then((response) => {
        data.status = STATUSES.success;
        data.data = response;
      })
      .catch((error) => {
        data.status = STATUSES.error;
        data.data = error;
      });
  } else {
    data.status === STATUSES.success;
    data.data = result;
  }

  store.set(key, data);

  return store.get(key);
}

const kweries = new Map();
function addToKweries(client, queries) {
  for (let key in queries) {
    let cb;
    let _cb = queries[key];
    let argsCount = _cb.length;

    if (client) {
      argsCount -= 1;
      cb = function (...args) {
        return _cb(client, ...args);
      };
    } else {
      cb = _cb;
    }

    if (argsCount > 0) {
      function kwery(...args) {
        return resolve(key, () => cb(...args));
      }

      kweries.set(key, kwery);
    } else {
      kweries.set(key, resolve(key, cb));
    }
  }
}

export function query(cb) {
  return cb(Object.fromEntries(kweries));
}

function statelessResolve(cb) {
  let data = observable({ status: STATUSES.pending, data: null });

  let result = cb();

  if (typeof result.then === "function") {
    result
      .then((response) => {
        data.status = STATUSES.success;
        data.data = response;
      })
      .catch((error) => {
        data.status = STATUSES.error;
        data.data = error;
      });
  } else {
    data.status = STATUSES.success;
    data.data = result;
  }

  return data;
}

const meutasions = new Map();
function addToMutations(client, mutations) {
  for (let key in mutations) {
    let mutation = mutations[key];

    function mutationWrapper(...args) {
      if (client) {
        return statelessResolve(() => mutation(client, ...args));
      }
      return statelessResolve(() => mutation(...args));
    }

    meutasions.set(key, mutationWrapper);
  }
}

export function mutate(cb) {
  return cb(Object.fromEntries(meutasions));
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
