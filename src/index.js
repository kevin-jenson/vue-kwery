import createKwery, * as VueKwery from "./kwery";

function install(Vue, { queries, mutations, client }) {
  warnings({ queries, mutations });

  let { query, mutate } = createKwery({ queries, mutations, client, Vue });

  Vue.prototype.$kwery = { query, mutate, STATUSES: VueKwery.STATUSES };
}

function warnings({ queries = {}, mutations = {} }) {
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

export const { query, STATUSES } = VueKwery;
export default { install };
