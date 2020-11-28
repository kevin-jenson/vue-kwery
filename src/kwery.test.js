import createKwery, { query, STATUSES } from "./kwery";

describe("kwery", () => {
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
  };

  let client;
  beforeEach(() => {
    client = createKwery({ queries });
  });

  test("all queries passed to config are available on query method returned from client", () => {
    client.query((kweries) => {
      expect(kweries.requests.data).toEqual(queries.requests());
      expect(kweries.request("person").data).toEqual(queries.request("person"));
      expect(kweries.clients.data).toEqual(queries.clients());
    });
  });

  test("all queries passed to config are available on query method from import", () => {
    query((kweries) => {
      expect(kweries.requests.data).toEqual(queries.requests());
      expect(kweries.request("person").data).toEqual(queries.request("person"));
      expect(kweries.clients.data).toEqual(queries.clients());
    });
  });

  test("kweries are updated when promise is resolved", async () => {
    let data = "This has resolved";
    function resolvedRequest() {
      return new Promise((resolve) => {
        setTimeout(resolve, 1000, data);
      });
    }

    let client = createKwery({ queries: { resolvedRequest } });

    let resp = client.query((kweries) => kweries.resolvedRequest);

    expect(resp.status).toEqual(STATUSES.pending);

    await resolvedRequest();

    expect(resp.status).toEqual(STATUSES.success);
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

    let resp = client.query((kweries) => kweries.rejectedRequest);

    expect(resp.status).toEqual(STATUSES.pending);

    await rejectedRequest().catch((error) => error);

    expect(resp.status).toEqual(STATUSES.error);
    expect(resp.data).toEqual(data);
  });
});
