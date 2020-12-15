class Base {
  static STATUSES = {
    uninitialized: "uninitialized",
    pending: "pending",
    error: "error",
    success: "success",
  };

  constructor({ key, resolver }) {
    this.defaultValue = null;
    this._data = null;
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
    this._data = result;
  }

  _error(error) {
    this.status = Base.STATUSES.error;
    this._data = error;
  }
}

export class Kwery extends Base {
  static store = new Map();

  static updateStore(key, updater) {
    let instance = Kwery.store.get(key);

    let ref = { data: instance.data };
    updater(ref);

    instance._data = ref.data;

    Kwery.store.set(key, instance);
  }

  static invalidateInstance(key) {
    let { store, STATUSES } = Kwery;

    let instance = store.get(key);

    instance._data = instance.defaultValue;
    instance.status = STATUSES.uninitialized;

    store.set(key, instance);
    store.delete(key);
  }

  static clear() {
    Kwery.store.clear();
  }

  constructor({ key, resolver }) {
    super({ key, resolver });

    this._args = null;
    this._intervalId = null;
    this._successQueue = new Set();
  }

  get data() {
    let { status } = this;
    let { STATUSES } = Kwery;

    if (status === STATUSES.pending || status === STATUSES.uninitialized) {
      return this.defaultValue;
    }

    return this._data;
  }

  _success(result) {
    super._success(result);
    Kwery.store.set(this.key, result);
    this._successQueue.forEach(cb => cb());
    this._successQueue.clear();
  }

  fetchData(...args) {
    let { key } = this;
    let { store } = Kwery;

    if (!store.has(key)) {
      this._args = args;
      this.baseFetch(...args);
    } else {
      this._success(store.get(key));
    }

    return this;
  }

  refetch(...args) {
    Kwery.store.delete(this.key);
    if (args.length) {
      this._args = args;
    }

    // console.log("this:", this);
    return this.fetchData(...(this._args || []));
  }

  _interval(interval) {
    this.stopInterval();

    this._intervalId = setInterval(this.refetch.bind(this), interval);
  }

  stopInterval() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }
  }

  _setOptions(options) {
    if (options.interval) {
      this._successQueue.add(() => this._interval(options.interval));
    }

    if (options.default || options.defaultValue) {
      this.defaultValue = options.default || options.defaultValue;
    }
  }
}

export class Mutation extends Base {
  constructor({ defaultValue, key, resolver }) {
    super({ defaultValue, key, resolver });
    this._successQueue = new Set();
  }

  get data() {
    return this._data;
  }

  fetchData(...args) {
    this.baseFetch(...args);

    return this;
  }

  _success(result) {
    super._success(result);
    this._successQueue.forEach(cb => cb());
    this._successQueue.clear();
  }

  update(key, updater) {
    let cb = () => Kwery.updateStore(key, updater);

    if (this.status === Base.STATUSES.success) {
      cb();
    } else {
      this._successQueue.add(cb);
    }

    return this;
  }

  invalidate(key) {
    let cb = () => Kwery.invalidateInstance(key);
    if (this.status === Base.STATUSES.success) {
      cb();
    } else {
      this._successQueue.add(cb);
    }
  }
}
