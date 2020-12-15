"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.STATUSES = exports.query = void 0;

var VueKwery = _interopRequireWildcard(require("./kwery"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function install(Vue, {
  queries,
  mutations,
  client
}) {
  warnings({
    queries,
    mutations
  });
  let {
    query,
    mutate
  } = (0, VueKwery.default)({
    queries,
    mutations,
    client,
    Vue
  });
  Vue.prototype.$kwery.query = query;
  Vue.prototype.$kwery.mutate = mutate;
}

function warnings({
  queries = {},
  mutations = {}
}) {
  if (Object.keys(queries).length + Object.keys(mutations) === 0) {
    console.warn("Must provide at least one query or mutation to the options object");
  }

  if (typeof queries !== "object") {
    console.warn("queries must be an object");
  }

  if (typeof mutations !== "object") {
    console.warn("mutations must be an object");
  }
}

const {
  query,
  STATUSES
} = VueKwery;
exports.STATUSES = STATUSES;
exports.query = query;
var _default = {
  install
};
exports.default = _default;