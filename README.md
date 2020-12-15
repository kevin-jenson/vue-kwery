# Installation

```bash
$ npm install vue-kwery
or
$ yarn add vue-kwery
```

## Getting Started

```JavaScript
import Vue from 'vue';
import VueKwery from 'vue-kwery';

Vue.use(VueKwery, { queries, mutations });
```

## Resolvers

A definition of how to retrieve desired data

```JavaScript
function users() {
	return fetch('/users').then(res => res.json());
}

function updateUser(id) {
	return fetch(`/users/${id}`, { method: 'POST' }).then(res => res.json());
}

export const queries = { users };
export const mutations = { updateUser };
```

## Options

```TypeScript
interface Options {
	mutations: Object
	queries: Object
	client: HttpClient
}
```

if client is passed to options, it is then passed as the first argument to all resolvers.

```JavaScript
function users(axios) {
	return axios.get('/users')
}
```

# Methods

## query

Provides query resolvers and returns a reactive object updated by resolver

```JavaScript
query(queryKey: String): Query

// usage with imports
import { query } from 'vue-kwery';

let users = query('queryKey');

// usage in vue component
export default {
	computed: {
		users() {
			return this.$kwery.query('queryKey');
		}
	}
};
```

### query Options

options available to the query method are

```TypeScript
interface Options {
	default: Any // the default value to be used for the query data,
	interval: Number // if set will call query at set interval
}
```

### reactive instance

There will be some utilities available on the reactive instance returned from query.

#### refetch

Will invalidate cached data for key and will reset the status to `pending`;

```JavaScript
let userId = 1;

export default {
	computed: {
		user() {
			return this.$kwery.query("user", [userId]);
		}
	},
	methods: {
		getNextUser(id) {
			this.user.refetch(id);
		}
	}
}
```

## mutation

Provides mutation resolves and returns reactive object updated by resolver

```JavaScript
mutation(mutationKey: String): Mutation

// usage with imports
import { mutation } from 'vue-kwery';

let userId = 42;
let updatedUser = mutation("updateUser", [42]);

// usage in vue component
export default {
	data() {
		return {
			userId: 42
		}
	},
	methods: {
		updateUser() {
			return this.$mutations("updateUser", [this.userId]);
		}
	}
};
```

### mutation options

Options available to the mutation methods

```TypeScript
interface Options {
	onSuccess: (data: MutationData) => void, // success callback used for side effects
	onError: (error: MutationError) => void, // error callback used for side effects
}
```

#### update query data on mutation result

Gives access directly to the cache to update a value at a specific key based on mutation;

```JavaScript
export default {
	computed: {
		todos() {
			return this.$kwery.query("todos");
		}
	},
	methods() {
		addTodo() {
			let newTodo = this.$kwery.mutate("addTodo", {
				onSuccess(data) {
					this.$kwery.query.setQueryData("todos", [...this.todos, data]);
				}
			});
		}
	}
}
```

#### invalidate query on mutation result

Will remove the instance from the cache based on the key and force a refetch of that query next use.

```JavaScript
export default {
	methods() {
		invalidateTodos() {
			let newTodo = this.$kwery.mutate("addTodo", {
				onSuccess() {
					this.$kwery.query.invalidateQuery("todos");
				}
			});
		}
	}
}
```
