import createKwery, { query, mutate } from "./kwery";
import Data from "./data";

describe("kwery", () => {
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
        return new Promise(resolve => {
          setTimeout(resolve, 1000, data);
        });
      }

      let client = createKwery({ queries: { resolvedRequest } });

      let resp = client.query(kweries => kweries.resolvedRequest);

      expect(resp.status).toEqual(Data.STATUSES.pending);

      await resolvedRequest();

      expect(resp.status).toEqual(Data.STATUSES.success);
      expect(resp.data).toEqual(data);
    });

    test("kweries are updated when promise is rejected", async () => {
      let data = "This has rejected";
      function rejectedRequest() {
        return new Promise((_resolve, reject) => {
          setTimeout(reject, 1000, data);
        });
      }

      let client = createKwery({ queries: { rejectedRequest } });

      let resp = client.query(kweries => kweries.rejectedRequest);

      expect(resp.status).toEqual(Data.STATUSES.pending);

      await rejectedRequest().catch(error => error);

      expect(resp.status).toEqual(Data.STATUSES.error);
      expect(resp.data).toEqual(data);
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
          return new Promise(resolve => {
            setTimeout(resolve, 1000, data);
          });
        },
      };

      let client = createKwery({ mutations });

      let resp = client.mutate(mutations => mutations.resolvedMutation(message));

      expect(resp.status).toEqual(Data.STATUSES.pending);

      await mutations.resolvedMutation();

      expect(resp.status).toEqual(Data.STATUSES.success);
      expect(resp.data).toEqual(message);
    });

    test("mutation updates when rejected", async () => {
      let message = "rejected";
      let mutations = {
        rejectedMutation(data) {
          return new Promise((_resolve, reject) => {
            setTimeout(reject, 1000, data);
          });
        },
      };

      let client = createKwery({ mutations });

      let resp = client.mutate(mutations => mutations.rejectedMutation(message));

      expect(resp.status).toEqual(Data.STATUSES.pending);

      await mutations.rejectedMutation().catch(error => error);

      expect(resp.status).toEqual(Data.STATUSES.error);
      expect(resp.data).toEqual(message);
    });
  });
});
