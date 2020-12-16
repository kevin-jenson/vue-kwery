import { keyHash } from "./utils";

class Base {
  static STATUSES = {
    uninitialized: "uninitialized",
    pending: "pending",
    error: "error",
    success: "success",
  };

  _dataError;
  _data = null;
  defaultValue = null;
  status = Base.STATUSES.uninitialized;
  constructor({ key, resolver }) {
    this.key = key;
    this.resolver = resolver;
  }

  get error() {
    if (this.status === Kwery.STATUSES.error) {
      return this._dataError;
    }

    return undefined;
  }

  baseFetch(...args) {
    let { STATUSES } = Base;

    this.status = STATUSES.pending;

    let result = this.resolver(...args);

    if (typeof result?.then === "function") {
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
    this._dataError = error;
  }
}

export class Kwery extends Base {
  static store = new Map();

  static updateStore(key, data) {
    Kwery.store.set(key, data);
  }

  static invalidateQuery(key) {
    Kwery.store.delete(key);
  }

  static clear() {
    Kwery.store.clear();
  }

  _args = null;
  _intervalId = null;
  _successQueue = new Set();
  _keepPreviousData = false;
  constructor({ key, resolver }) {
    super({ key, resolver });
  }

  get data() {
    let { status, defaultValue, key } = this;
    let { STATUSES } = Kwery;

    if ((status === STATUSES.pending || status === STATUSES.uninitialized) && defaultValue !== undefined) {
      return defaultValue;
    }

    return Kwery.store.get(key);
  }

  _success(result) {
    super._success(result);

    let key = this.key;
    if (this._keepPreviousData) {
      if (!this._args?.length) {
        throw new Error("Arguments must be provided if keepPreviousData option is true");
      }

      key = keyHash([key, this._args]);
    }

    Kwery.store.set(key, result);
    this._successQueue.forEach(cb => cb());
    this._successQueue.clear();
  }

  fetchData(...args) {
    let { key } = this;
    let { store } = Kwery;

    if (this._keepPreviousData) {
      key = keyHash([key, args]);
    }

    this._args = args;
    if (!store.has(key)) {
      store.set(key, this.defaultValue);
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

    if (options.keepPreviousData) {
      this._keepPreviousData = options.keepPreviousData;
    }
  }
}

export class Mutation extends Base {
  _successQueue = new Set();
  _errorQueue = new Set();
  constructor({ defaultValue, key, resolver }) {
    super({ defaultValue, key, resolver });
  }

  get data() {
    return this._data;
  }

  fetchData(...args) {
    return this.baseFetch(...args);
  }

  _success(result) {
    super._success(result);
    this._successQueue.forEach(cb => cb(result));
    this._successQueue.clear();
  }

  _error(error) {
    super._error(error);
    this._errorQueue.forEach(cb => cb(error));
    this._errorQueue.clear();
  }

  _setOptions(options) {
    if (options.onSuccess) {
      this._successQueue.add(options.onSuccess);
    }

    if (options.onError) {
      this._errorQueue.add(options.onError);
    }
  }
}
