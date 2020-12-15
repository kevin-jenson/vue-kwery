import Vue from "vue";
import VueKwery from "../index";

import { Kwery } from "../data";
import { sleep, nightmare } from "./helpers";

let queries = {
  longRequest() {
    return sleep(500, "hello world");
  },
  longRejectedRequest() {
    return nightmare(500, "goodbye world");
  },
};

Vue.use(VueKwery, { queries });

describe("usage in vue components", () => {
  afterEach(() => {
    Kwery.clear();
  });
  describe("queries", () => {
    test("will recieve proper updates", async () => {
      let component = new Vue({
        computed: {
          longRequest() {
            return this.$kwery.query("longRequest");
          },
        },
      });

      expect(component.longRequest.data).toBeNull();
      expect(component.longRequest.status).toEqual(Kwery.STATUSES.pending);

      await sleep(500);
      await component.$nextTick();

      expect(component.longRequest.data).toEqual("hello world");
      expect(component.longRequest.status).toEqual(Kwery.STATUSES.success);
    });

    test("can use status in other computed properties -- isLoading", async () => {
      let component = new Vue({
        computed: {
          longRequest() {
            return this.$kwery.query("longRequest");
          },
          isLoading() {
            return this.longRequest.status === this.$kwery.STATUSES.pending;
          },
        },
      });

      expect(component.longRequest.status).toEqual(Kwery.STATUSES.pending);
      expect(component.isLoading).toBe(true);

      await sleep(500);
      await component.$nextTick();

      expect(component.longRequest.status).toEqual(Kwery.STATUSES.success);
      expect(component.isLoading).toBe(false);
    });

    test("can use status in other computed properties -- hasError", async () => {
      let component = new Vue({
        computed: {
          longRequest() {
            return this.$kwery.query("longRejectedRequest");
          },
          hasError() {
            return this.longRequest.status === this.$kwery.STATUSES.error;
          },
        },
      });

      expect(component.longRequest.status).toEqual(Kwery.STATUSES.pending);
      expect(component.hasError).toBe(false);

      await sleep(500);
      await component.$nextTick();

      expect(component.longRequest.status).toEqual(Kwery.STATUSES.error);
      expect(component.hasError).toBe(true);
    });
  });
});
