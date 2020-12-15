"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Mutation = exports.Kwery = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Base {
  constructor({
    key,
    resolver
  }) {
    this._error;
    this.defaultValue = null;
    this._data = null;
    this.status = Base.STATUSES.uninitialized;
    this.key = key;
    this.resolver = resolver;
  }

  get error() {
    if (this.status === Kwery.STATUSES.error) {
      return this._error;
    }

    return undefined;
  }

  baseFetch(...args) {
    let {
      STATUSES
    } = Base;
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
    this._error = error;
  }

}

_defineProperty(Base, "STATUSES", {
  uninitialized: "uninitialized",
  pending: "pending",
  error: "error",
  success: "success"
});

class Kwery extends Base {
  static updateStore(key, data) {
    Kwery.store.set(key, data);
  }

  static invalidateQuery(key) {
    Kwery.store.delete(key);
  }

  static clear() {
    Kwery.store.clear();
  }

  constructor({
    key,
    resolver
  }) {
    super({
      key,
      resolver
    });
    this._args = null;
    this._intervalId = null;
    this._successQueue = new Set();
  }

  get data() {
    let {
      status,
      defaultValue,
      key
    } = this;
    let {
      STATUSES
    } = Kwery;

    if ((status === STATUSES.pending || status === STATUSES.uninitialized) && defaultValue !== undefined) {
      return defaultValue;
    }

    return Kwery.store.get(key);
  }

  _success(result) {
    super._success(result);

    Kwery.store.set(this.key, result);

    this._successQueue.forEach(cb => cb());

    this._successQueue.clear();
  }

  fetchData(...args) {
    let {
      key
    } = this;
    let {
      store
    } = Kwery;

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
    } // console.log("this:", this);


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

exports.Kwery = Kwery;

_defineProperty(Kwery, "store", new Map());

class Mutation extends Base {
  constructor({
    defaultValue,
    key,
    resolver
  }) {
    super({
      defaultValue,
      key,
      resolver
    });
    this._successQueue = new Set();
    this._errorQueue = new Set();
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

exports.Mutation = Mutation;