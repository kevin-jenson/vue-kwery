class Base {
  static STATUSES = {
    uninitialized: "UNINITIALIZED",
    pending: "PENDING",
    error: "ERROR",
    success: "SUCCESS",
  };

  constructor({ defaultValue = null, key, resolver }) {
    this.defaultValue = defaultValue;
    this.data = defaultValue;
    this.status = Kwery.STATUSES.uninitialized;
    this.key = key;
    this.resolver = resolver;
  }

  baseFetch(...args) {
    let { STATUSES } = Base;

    this.status = STATUSES.pending;

    let result = this.resolver(...args);

    if (result && typeof result.then === "function") {
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

    return this;
  }
}

export class Kwery extends Base {
  static store = new Map();

  static updateStore(key, updater) {
    let instance = Kwery.store.get(key);

    let updated = updater(instance.data);

    instance.data = updated;
    Kwery.store.set(key, instance);
  }

  static invalidateInstance(key) {
    let { store, STATUSES } = Kwery;

    let instance = store.get(key);

    instance.data = instance.defaultValue;
    instance.status = STATUSES.uninitialized;

    store.set(key, instance);
    store.delete(key);
  }

  static clear() {
    Kwery.store.clear();
  }

  constructor({ defaultValue, key, resolver }) {
    super({ defaultValue, key, resolver });
  }

  fetchData(...args) {
    let { key } = this;
    let { store } = Kwery;

    if (store.has(key)) {
      return store.get(key);
    }

    this.baseFetch(...args);

    store.set(key, this);

    return store.get(key);
  }

  refetch(...args) {
    Kwery.store.delete(this.key);
    return this.fetchData(...args);
  }
}

export class Mutation extends Base {
  constructor({ defaultValue, key, resolver }) {
    super({ defaultValue, key, resolver });
  }

  fetchData(...args) {
    this.baseFetch(...args);

    return this;
  }

  update(key, updater) {
    Kwery.updateStore(key, updater);

    return this;
  }

  invalidate(key) {
    Kwery.invalidateInstance(key);
  }
}
