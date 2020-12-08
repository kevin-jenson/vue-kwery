import createKwery, * as VueKwery from "./src/kwery";

function install(Vue, { queries, mutations, client }) {
  warnings({ queries, mutations });

  let { query, mutate } = createKwery({ queries, mutations, client });

  Vue.prototype.$query = query;
  Vue.prototype.$mutate = mutate;
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
