"use strict";

var _vue = _interopRequireDefault(require("vue"));

var _kwery = _interopRequireWildcard(require("./kwery"));

var _data = require("./data");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sleep(seconds, result) {
  return new Promise(resolve => setTimeout(resolve, seconds, result));
}

function nightmare(seconds, result) {
  return new Promise((_resolve, reject) => setTimeout(reject, seconds, result));
}

describe("kwery", () => {
  let {
    STATUSES
  } = _data.Kwery;
  afterEach(() => {
    _data.Kwery.clear();

    jest.clearAllMocks();
  });
  describe("kweries", () => {
    let queries = {
      requests() {
        return "hello all";
      },

      request(id) {
        return "hello " + id;
      },

      clients() {
        return "this is a client";
      },

      called: jest.fn(() => "this one was called"),
      notCalled: jest.fn(() => "this one was not called")
    };
    let client;
    beforeAll(() => {
      client = (0, _kwery.default)({
        queries,
        Vue: _vue.default
      });
    });
    test("only calls functions when called", () => {
      (0, _kwery.query)("called");
      expect(queries.called).toHaveBeenCalled();
      expect(queries.notCalled).not.toHaveBeenCalled();
    });
    test("all queries passed to config are available on query method returned from client", () => {
      let requests = client.query("requests");
      let request = client.query("request", ["person"]);
      let clients = client.query("clients");
      expect(requests.data).toEqual(queries.requests());
      expect(request.data).toEqual(queries.request("person"));
      expect(clients.data).toEqual(queries.clients());
    });
    test("all queries passed to config are available on query method from import", () => {
      let requests = (0, _kwery.query)("requests");
      let request = (0, _kwery.query)("request", ["person"]);
      let clients = (0, _kwery.query)("clients");
      expect(requests.data).toEqual(queries.requests());
      expect(request.data).toEqual(queries.request("person"));
      expect(clients.data).toEqual(queries.clients());
    });
    test("kweries are updated when promise is resolved", async () => {
      let data = "This has resolved";

      function resolvedRequest() {
        return sleep(500, data);
      }

      let client = (0, _kwery.default)({
        queries: {
          resolvedRequest
        },
        Vue: _vue.default
      });
      let resp = client.query("resolvedRequest");
      expect(resp.status).toEqual(STATUSES.pending);
      await resolvedRequest();
      expect(resp.status).toEqual(STATUSES.success);
      expect(resp.data).toEqual(data);
    });
    test("kweries are updated when promise is rejected", async () => {
      let data = "This has rejected";

      function rejectedRequest() {
        return nightmare(500, data);
      }

      let client = (0, _kwery.default)({
        queries: {
          rejectedRequest
        },
        Vue: _vue.default
      });
      let resp = client.query("rejectedRequest");
      expect(resp.status).toEqual(STATUSES.pending);
      await rejectedRequest().catch(error => error);
      expect(resp.status).toEqual(STATUSES.error);
      expect(resp.error).toEqual(data);
    });
    test("will fetch first time and pull from cache sequential requests", () => {
      let queries = {
        cachedRequest: jest.fn(() => "cached request message")
      };
      let client = (0, _kwery.default)({
        queries,
        Vue: _vue.default
      });
      let res = client.query("cachedRequest");
      let res1 = client.query("cachedRequest");
      expect(res.data).toEqual(res1.data);
      expect(queries.cachedRequest).toHaveBeenCalledTimes(1);
    });
    test("refetch will call query twice", () => {
      let queries = {
        multipleCalledRequest: jest.fn(() => "cached request message")
      };
      let client = (0, _kwery.default)({
        queries,
        Vue: _vue.default
      });
      let res = client.query("multipleCalledRequest");
      res.refetch();
      expect(queries.multipleCalledRequest).toHaveBeenCalledTimes(2);
    });
    test("refetch will call query twice with parameters", () => {
      let queries = {
        mutlCalledReqWithParams: jest.fn(message => message)
      };
      let client = (0, _kwery.default)({
        queries,
        Vue: _vue.default
      });
      let message1 = "message1";
      let message2 = "message2";
      let res = client.query("mutlCalledReqWithParams", [message1]);
      res.refetch(message2);
      expect(res.data).toEqual(message2);
      expect(queries.mutlCalledReqWithParams).toHaveBeenCalledTimes(2);
    });
    test("refetch will reset status to pending while data is being fetched", async () => {
      let queries = {
        longRefetchRequest(message) {
          return sleep(500, message);
        }

      };
      (0, _kwery.default)({
        queries,
        Vue: _vue.default
      });
      let message1 = "message1";
      let message2 = "message2";
      let res = (0, _kwery.query)("longRefetchRequest", [message1]);
      expect(res.status).toEqual(STATUSES.pending);
      await queries.longRefetchRequest();
      expect(res.data).toEqual(message1);
      expect(res.status).toEqual(STATUSES.success);
      res.refetch(message2);
      expect(res.status).toEqual(STATUSES.pending);
      await queries.longRefetchRequest();
      expect(res.data).toEqual(message2);
      expect(res.status).toEqual(STATUSES.success);
    }); // TODO: fix this test

    test("should not add resolvers to kweries if not a function", () => {
      let notAFunction = "not a function";
      (0, _kwery.default)({
        queries: {
          notAFunction
        },
        Vue: _vue.default
      });

      function shouldThrow() {
        (0, _kwery.query)("notAFunction");
      }

      expect(shouldThrow).toThrow();
    });
    describe("instance methods", () => {
      let queries = {
        needsRefetching: jest.fn((key, message) => [key, message]),

        queryWithDefaultValue() {
          return sleep(500, "message");
        }

      };
      beforeAll(() => {
        (0, _kwery.default)({
          queries,
          Vue: _vue.default
        });
      });
      test("refetch will use old args if none are passed and they were passed on original query", () => {
        let res = (0, _kwery.query)("needsRefetching", ["key", "message"]);
        expect(res.data).toEqual(["key", "message"]);
        res.refetch();
        expect(queries.needsRefetching).toHaveBeenCalledTimes(2);
        expect(res.data).toEqual(["key", "message"]);
        res.refetch("new key", "new message");
        expect(res.data).toEqual(["new key", "new message"]);
      });
      test("interval will call refetch at specified interval", async () => {
        let interval = 100;
        let res = (0, _kwery.query)("needsRefetching", ["id", "user"], {
          interval
        });
        let timeout = 1000;
        await sleep(timeout);
        res.stopInterval();
        expect(queries.needsRefetching).toHaveBeenCalledTimes(timeout / interval);
      });
      test("should set default value on instance", async () => {
        let res = (0, _kwery.query)("queryWithDefaultValue", {
          default: []
        });
        expect(res.data).toEqual([]);
        await sleep(500);
        expect(res.data).toEqual("message");
      });
    });
  });
  describe("meutasions", () => {
    let mutations = {
      createRequest(input) {
        return input;
      },

      updateRequest(id, input) {
        return { ...input,
          id
        };
      }

    };
    let client;
    beforeEach(() => {
      client = (0, _kwery.default)({
        mutations,
        Vue: _vue.default
      });
    });
    test("all mutatiions passed to config are available in client returned function", () => {
      let createdRequest = client.mutate("createRequest", ["hello"]);
      let updatedRequest = client.mutate("updateRequest", ["id", {
        data: "hello"
      }]);
      expect(createdRequest.data).toEqual(mutations.createRequest("hello"));
      expect(updatedRequest.data).toEqual(mutations.updateRequest("id", {
        data: "hello"
      }));
    });
    test("all mutations passed to config are available mutate function import", () => {
      let createdRequest = (0, _kwery.mutate)("createRequest", ["hello"]);
      let updatedRequest = (0, _kwery.mutate)("updateRequest", ["id", {
        data: "hello"
      }]);
      expect(createdRequest.data).toEqual(mutations.createRequest("hello"));
      expect(updatedRequest.data).toEqual(mutations.updateRequest("id", {
        data: "hello"
      }));
    });
    test("mutation updates when resolved", async () => {
      let message = "resolved";
      let mutations = {
        resolvedMutation(data) {
          return sleep(500, data);
        }

      };
      let client = (0, _kwery.default)({
        mutations,
        Vue: _vue.default
      });
      let resp = client.mutate("resolvedMutation", [message]);
      expect(resp.status).toEqual(STATUSES.pending);
      await mutations.resolvedMutation();
      expect(resp.status).toEqual(STATUSES.success);
      expect(resp.data).toEqual(message);
    });
    test("mutation updates when rejected", async () => {
      let message = "rejected";
      let mutations = {
        rejectedMutation(data) {
          return nightmare(500, data);
        }

      };
      let client = (0, _kwery.default)({
        mutations,
        Vue: _vue.default
      });
      let resp = client.mutate("rejectedMutation", [message]);
      expect(resp.status).toEqual(STATUSES.pending);
      await mutations.rejectedMutation().catch(error => error);
      expect(resp.status).toEqual(STATUSES.error);
      expect(resp.error).toEqual(message);
    });
    describe("instances", () => {
      let querySym = "query_key";
      let mutationSym = "mutation_key";
      let queries = {
        [querySym](message) {
          return message;
        }

      };
      let mutations = {
        [mutationSym](message) {
          return message;
        },

        longMutation(message) {
          return sleep(500, message);
        },

        longRejectedMut(message) {
          return nightmare(500, message);
        }

      };
      (0, _kwery.default)({
        mutations,
        queries,
        Vue: _vue.default
      });
      test("mutation instance update will update query store", () => {
        let queryRes = (0, _kwery.query)(querySym, ["query"]);
        expect(queryRes.data).toEqual("query");
        let mutRes = (0, _kwery.mutate)(mutationSym, ["mutation"], {
          onSuccess(data) {
            _kwery.query.setQueryData(querySym, data + " updated");
          }

        });
        expect(mutRes.data).toEqual("mutation");
        expect(queryRes.data).toEqual("mutation updated");
      });
      test("mutation instance update will update query store after success", async () => {
        let queryRes = (0, _kwery.query)(querySym, ["query"]);
        expect(queryRes.data).toEqual("query");
        let mut = "this is a message from the future";
        let appended = ", jk this is the past";
        let mutRes = (0, _kwery.mutate)("longMutation", ["this is a message from the future"], {
          onSuccess(data) {
            _kwery.query.setQueryData(querySym, data + appended);
          }

        });
        await mutations.longMutation();
        expect(mutRes.data).toEqual(mut);
        expect(queryRes.data).toEqual(mut + appended);
      });
      test("mutations instance invalidate will force a refetch", () => {
        let queryRes = (0, _kwery.query)(querySym, ["query"]);
        expect(queryRes.data).toEqual("query");
        let mutRes = (0, _kwery.mutate)(mutationSym, ["mutation"], {
          onSuccess() {
            _kwery.query.invalidateQuery(querySym);
          }

        });
        expect(mutRes.data).toEqual("mutation");
        expect(queryRes.data).toBeUndefined();
        expect(_data.Kwery.store.has(querySym)).toBe(false);
      });
      test("mutations instance will invalidate on error", async () => {
        let queryRes = (0, _kwery.query)(querySym, ["query"]);
        expect(queryRes.data).toEqual("query");
        let mutRes = (0, _kwery.mutate)("longRejectedMut", ["mutation"], {
          onError() {
            _kwery.query.invalidateQuery(querySym);
          }

        });
        await mutations.longRejectedMut().catch(error => error);
        expect(mutRes.error).toEqual("mutation");
        expect(queryRes.data).toBeUndefined();
        expect(_data.Kwery.store.has(querySym)).toBe(false);
      });
    });
  });
});