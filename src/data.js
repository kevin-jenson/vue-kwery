class Kwery {
  static store = new Map();

  static STATUSES = {
    uninitialized: "UNINITIALIZED",
    pending: "PENDING",
    error: "ERROR",
    success: "SUCCESS",
  };

  constructor({ initialValue = null, key, resolver }) {
    this.data = initialValue;
    this.status = Kwery.STATUSES.uninitialized;
    this.key = key;
    this.resolver = resolver;
  }

  fetchData(...args) {
    let { key } = this;
    let { STATUSES, store } = Kwery;

    if (store.has(key)) {
      return store.get(key);
    }

    this.status = STATUSES.pending;

    let result = this.resolver(...args);

    if (typeof result.then === "function") {
      result
        .then(response => {
          this.status = STATUSES.success;
          this.data = response;
        })
        .catch(error => {
          this.status = STATUSES.error;
          this.data = error;
        });
    } else {
      this.status = STATUSES.success;
      this.data = result;
    }

    store.set(key, this);

    return store.get(key);
  }

  refetch(...args) {
    Kwery.store.delete(this.key);
    return this.fetchData(...args);
  }
}

export default Kwery;
