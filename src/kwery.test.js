import createKwery, { query, mutate } from "./kwery";
import { Kwery } from "./data";

function sleep(seconds, result) {
  return new Promise(resolve => setTimeout(resolve, seconds, result));
}

function nightmare(seconds, result) {
  return new Promise((_resolve, reject) => setTimeout(reject, seconds, result));
}

describe("kwery", () => {
  let { STATUSES } = Kwery;

  afterEach(() => {
    Kwery.clear();
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
      notCalled: jest.fn(() => "this one was not called"),
    };

    let client;
    beforeAll(() => {
      client = createKwery({ queries });
    });

    test("only calls functions when called", () => {
      query(kweries => kweries.called);

      expect(queries.called).toHaveBeenCalled();
      expect(queries.notCalled).not.toHaveBeenCalled();

      query(kweries => kweries.notCalled);
      expect(queries.notCalled).toHaveBeenCalled();
    });

    test("all queries passed to config are available on query method returned from client", () => {
      client.query(kweries => {
        expect(kweries.requests.data).toEqual(queries.requests());
        expect(kweries.request("person").data).toEqual(queries.request("person"));
        expect(kweries.clients.data).toEqual(queries.clients());
      });
    });

    test("all queries passed to config are available on query method from import", () => {
      query(kweries => {
        expect(kweries.requests.data).toEqual(queries.requests());
        expect(kweries.request("person").data).toEqual(queries.request("person"));
        expect(kweries.clients.data).toEqual(queries.clients());
      });
    });

    test("kweries are updated when promise is resolved", async () => {
      let data = "This has resolved";
      function resolvedRequest() {
        return sleep(500, data);
      }

      let client = createKwery({ queries: { resolvedRequest } });

      let resp = client.query(kweries => kweries.resolvedRequest);

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

      let client = createKwery({ queries: { rejectedRequest } });

      let resp = client.query(kweries => kweries.rejectedRequest);

      expect(resp.status).toEqual(STATUSES.pending);

      await rejectedRequest().catch(error => error);

      expect(resp.status).toEqual(STATUSES.error);
      expect(resp.data).toEqual(data);
    });

    test("will fetch first time and pull from cache sequential requests", () => {
      let queries = {
        cachedRequest: jest.fn(() => "cached request message"),
      };

      let client = createKwery({ queries });

      let res = client.query(kweries => kweries.cachedRequest);
      let res1 = client.query(kweries => kweries.cachedRequest);

      expect(res).toEqual(res1);
      expect(queries.cachedRequest).toHaveBeenCalledTimes(1);
    });

    test("refetch will call query twice", () => {
      let queries = {
        multipleCalledRequest: jest.fn(() => "cached request message"),
      };

      let client = createKwery({ queries });

      let res = client.query(kweries => kweries.multipleCalledRequest);
      res.refetch();

      expect(queries.multipleCalledRequest).toHaveBeenCalledTimes(2);
    });

    test("refetch will call query twice with parameters", () => {
      let queries = {
        mutlCalledReqWithParams: jest.fn(message => message),
      };

      let client = createKwery({ queries });

      let message1 = "message1";
      let message2 = "message2";
      let res = client.query(kweries => kweries.mutlCalledReqWithParams(message1));
      res.refetch(message2);

      expect(res.data).toEqual(message2);
      expect(queries.mutlCalledReqWithParams).toHaveBeenCalledTimes(2);
    });

    test("refetch will reset status to pending while data is being fetched", async () => {
      let queries = {
        longRefetchRequest(message) {
          return sleep(500, message);
        },
      };

      createKwery({ queries });

      let message1 = "message1";
      let message2 = "message2";
      let res = query(kweries => kweries.longRefetchRequest(message1));

      expect(res.status).toEqual(STATUSES.pending);

      await queries.longRefetchRequest();

      expect(res.data).toEqual(message1);
      expect(res.status).toEqual(STATUSES.success);

      res.refetch(message2);

      expect(res.status).toEqual(STATUSES.pending);

      await queries.longRefetchRequest();

      expect(res.data).toEqual(message2);
      expect(res.status).toEqual(STATUSES.success);
    });

    test("should not add resolvers to kweries if not a function", () => {
      let notAFunction = "not a function";

      createKwery({ queries: { notAFunction } });

      query(kweries => expect(kweries.notAFunction).toBeUndefined());
    });

    describe("instance methods", () => {
      let queries = {
        needsRefetching: jest.fn((key, message) => [key, message]),
      };

      beforeAll(() => {
        createKwery({ queries });
      });

      test("refetch will use old args if none are passed and they were passed on original query", () => {
        let res = query(kweries => kweries.needsRefetching("key", "message"));
        expect(res.data).toEqual(["key", "message"]);
        res.refetch();

        expect(queries.needsRefetching).toHaveBeenCalledTimes(2);
        expect(res.data).toEqual(["key", "message"]);

        res.refetch("new key", "new message");
        expect(res.data).toEqual(["new key", "new message"]);
      });

      test("interval will call refetch at specified interval", async () => {
        let res = query(kweries => kweries.needsRefetching("id", "user"));
        res.refetch = jest.fn(() => {
          res.refetch.bind(res);
        });
        let interval = 100;
        res.interval(interval);

        let timeout = 1100;
        await sleep(timeout);

        res.stopInterval();
        expect(res.refetch).toHaveBeenCalledTimes(timeout / interval - 1);
      });
    });

    describe("options", () => {
      let queries = {
        queryWithDefaultValue() {
          return sleep(500, "message");
        },
      };

      beforeAll(() => {
        createKwery({ queries });
      });

      test("should set default value on instance", async () => {
        let res = query(queries => queries.queryWithDefaultValue).default([]);

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
        return {
          ...input,
          id,
        };
      },
    };

    let client;
    beforeEach(() => {
      client = createKwery({ mutations });
    });

    test("all mutatiions passed to config are available in client returned function", () => {
      client.mutate(meutasions => {
        expect(meutasions.createRequest("hello").data).toEqual(mutations.createRequest("hello"));
        expect(meutasions.updateRequest("id", { data: "hello" }).data).toEqual(
          mutations.updateRequest("id", { data: "hello" }),
        );
      });
    });

    test("all mutations passed to config are available mutate function import", () => {
      mutate(meutasions => {
        expect(meutasions.createRequest("hello").data).toEqual(mutations.createRequest("hello"));
        expect(meutasions.updateRequest("id", { data: "hello" }).data).toEqual(
          mutations.updateRequest("id", { data: "hello" }),
        );
      });
    });

    test("mutation updates when resolved", async () => {
      let message = "resolved";
      let mutations = {
        resolvedMutation(data) {
          return sleep(500, data);
        },
      };

      let client = createKwery({ mutations });

      let resp = client.mutate(mutations => mutations.resolvedMutation(message));

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
        },
      };

      let client = createKwery({ mutations });

      let resp = client.mutate(mutations => mutations.rejectedMutation(message));

      expect(resp.status).toEqual(STATUSES.pending);

      await mutations.rejectedMutation().catch(error => error);

      expect(resp.status).toEqual(STATUSES.error);
      expect(resp.data).toEqual(message);
    });

    describe("instances", () => {
      let querySym = "query_key";
      let mutationSym = "mutation_key";

      let queries = {
        [querySym](message) {
          return message;
        },
      };

      let mutations = {
        [mutationSym](message) {
          return message;
        },
        longMutation(message) {
          return sleep(500, message);
        },
      };

      createKwery({ mutations, queries });

      test("mutation instance update will update query store", () => {
        let queryRes = query(kweries => kweries[querySym]("query"));

        expect(queryRes.data).toEqual("query");

        let mutRes = mutate(mutations => mutations[mutationSym]("mutation"));

        expect(mutRes.data).toEqual("mutation");

        mutRes.update(querySym, value => (value.data += " something else"));

        expect(queryRes.data).toEqual("query something else");
      });

      test("mutation instance update will update query store after success", async () => {
        let queryRes = query(kweries => kweries[querySym]("query"));

        expect(queryRes.data).toEqual("query");

        let mut = "this is a message from the future";
        let mutRes = mutate(mutations => mutations.longMutation("this is a message from the future")).update(
          querySym,
          value => (value.data += mutRes.data),
        );

        await mutations.longMutation();

        expect(mutRes.data).toEqual(mut);

        expect(queryRes.data).toEqual("query" + mut);
      });

      test("mutations instance invalidate will force a refetch", () => {
        let queryRes = query(kweries => kweries[querySym]("query"));

        expect(queryRes.data).toEqual("query");

        let mutRes = mutate(mutations => mutations[mutationSym]("mutation"));

        expect(mutRes.data).toEqual("mutation");

        mutRes.invalidate(querySym);

        expect(queryRes.data).toEqual(null);
        expect(Kwery.store.has(querySym)).toBe(false);
      });
    });
  });
});
