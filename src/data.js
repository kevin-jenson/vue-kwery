class Base {
  static STATUSES = {
    uninitialized: "uninitialized",
    pending: "pending",
    error: "error",
    success: "success",
  };

  constructor({ defaultValue = null, key, resolver }) {
    this.defaultValue = defaultValue;
    this.data = defaultValue;
    this.status = Base.STATUSES.uninitialized;
    this.key = key;
    this.resolver = resolver;
  }

  baseFetch(...args) {
    let { STATUSES } = Base;

    this.status = STATUSES.pending;

    let result = this.resolver(...args);

    if (result && typeof result.then === "function") {
      result.then(this.success.bind(this)).catch(this.error.bind(this));
    } else {
      this.success(result);
    }

    return this;
  }

  success(result) {
    this.status = Base.STATUSES.success;
    this.data = result;
  }

  error(error) {
    this.status = Base.STATUSES.error;
    this.data = error;
  }
}

export class Kwery extends Base {
  static store = new Map();

  static updateStore(key, updater) {
    let instance = Kwery.store.get(key);

    let ref = { data: instance.data };
    updater(ref);

    instance.data = ref.data;

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

  static addOptionsToInstance(options) {
    let { store } = Kwery;

    for (let key in options) {
      if (!store.has(key)) {
        continue;
      } else {
        let instance = store.get(key);
        let { default: defaultValue } = options[key];

        instance.defaultValue = defaultValue;
      }
    }
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
    this.onSuccessQueue = [];
  }

  fetchData(...args) {
    this.baseFetch(...args);

    return this;
  }

  success(result) {
    super.success(result);
    this.onSuccessQueue.forEach(cb => cb());
  }

  update(key, updater) {
    let cb = () => Kwery.updateStore(key, updater);

    if (this.status === Base.STATUSES.success) {
      cb();
    } else {
      this.onSuccessQueue.push(cb);
    }

    return this;
  }

  invalidate(key) {
    Kwery.invalidateInstance(key);
  }
}
