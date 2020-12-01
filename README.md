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
query(callback: (queries: Object) => Any)

// usage with imports
import { query } from 'vue-kwery';

let users = query(queries => queries.users);

// usage in vue component
export default {
	methods: {
		getUsers() {
			return this.$query(queries => queries.users);
		}
	}
};
```

## mutation

Provides mutation resolves and returns reactive object updated by resolver

```JavaScript
mutation(callback: (mutation: Object) => Any)

// usage with imports
import { mutation } from 'vue-kwery';

let userId = 42;
let updatedUser = mutation(mutations => mutations.updateUser(42));

// usage in vue component
export default {
	data: {
		userId: 42
	},
	methods: {
		updateUser() {
			return this.$mutations(mutations => mutations updateUser(this.userId));
		}
	}
};
```
