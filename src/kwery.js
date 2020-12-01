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

const kweries = {};
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
      kweries[key] = function (...args) {
        return resolve(key, () => cb(...args));
      };
    } else {
      kweries[key] = resolve(key, cb);
    }
  }
}

export function query(cb) {
  return cb(kweries);
}

function createKwery({ queries, client }) {
  addToKweries(client, queries);

  return {
    query,
  };
}

export default createKwery;
