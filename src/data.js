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
      result.then(this._success.bind(this)).catch(this._error.bind(this));
    } else {
      this._success(result);
    }

    return this;
  }

  _success(result) {
    this.status = Base.STATUSES.success;
    this.data = result;
  }

  _error(error) {
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

    this._args = null;
    this._intervalId = null;
  }

  fetchData(...args) {
    let { key } = this;
    let { store } = Kwery;

    if (store.has(key)) {
      return store.get(key);
    }

    this._args = args;
    this.baseFetch(...args);

    store.set(key, this);

    return this;
  }

  refetch(...args) {
    Kwery.store.delete(this.key);
    if (args.length) {
      this._args = args;
    }

    return this.fetchData(...(this._args || []));
  }

  interval(interval) {
    this.stopInterval();

    this._intervalId = setInterval(this.refetch, interval);
  }

  stopInterval() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }
  }
}

export class Mutation extends Base {
  constructor({ defaultValue, key, resolver }) {
    super({ defaultValue, key, resolver });
    this.onSuccessQueue = new Set();
  }

  fetchData(...args) {
    this.baseFetch(...args);

    return this;
  }

  _success(result) {
    super._success(result);
    this.onSuccessQueue.forEach(cb => cb());
    this.onSuccessQueue.clear();
  }

  update(key, updater) {
    let cb = () => Kwery.updateStore(key, updater);

    if (this.status === Base.STATUSES.success) {
      cb();
    } else {
      this.onSuccessQueue.add(cb);
    }

    return this;
  }

  invalidate(key) {
    let cb = () => Kwery.invalidateInstance(key);
    if (this.status === Base.STATUSES.success) {
      cb();
    } else {
      this.onSuccessQueue.add(cb);
    }
  }
}
