import kwery from "./kwery";

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
    client = kwery({ queries });
  });

  test("all queries passed to config are available on query method", () => {
    client.query((kweries) => {
      expect(kweries.requests.data).toEqual(queries.requests());
      expect(kweries.request("person").data).toEqual(queries.request("person"));
      expect(kweries.clients.data).toEqual(queries.clients());
    });
  });
});
