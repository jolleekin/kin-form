import { assertEquals } from "@std/assert";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { BaseApi } from "./BaseApi.ts";

class TestApi extends BaseApi {
  notifyPublic() {
    this.notify();
  }
}

// Simulates a `FieldApi`-style tree (without pulling in `FieldApi` itself)
// so batching's root-scoping can be tested at the `BaseApi` level.
class RootedTestApi extends BaseApi {
  constructor(private parentApi?: RootedTestApi) {
    super();
  }

  notifyPublic(): void {
    this.notify();
  }

  override get root(): BaseApi {
    return this.parentApi?.root ?? this;
  }
}

Deno.test("BaseApi", async (t) => {
  await t.step("should subscribe and call callback when notified", () => {
    const api = new TestApi();
    const callback = spy();

    api.subscribe(callback);
    api.notifyPublic();

    assertSpyCalls(callback, 1);
  });

  await t.step("should support multiple subscribers", () => {
    const api = new TestApi();
    const callback1 = spy();
    const callback2 = spy();
    const callback3 = spy();

    api.subscribe(callback1);
    api.subscribe(callback2);
    api.subscribe(callback3);
    api.notifyPublic();

    assertSpyCalls(callback1, 1);
    assertSpyCalls(callback2, 1);
    assertSpyCalls(callback3, 1);
  });

  await t.step("should return unsubscribe function", () => {
    const api = new TestApi();
    const callback = spy();

    const unsubscribe = api.subscribe(callback);
    api.notifyPublic();
    assertSpyCalls(callback, 1);

    unsubscribe();
    api.notifyPublic();
    assertSpyCalls(callback, 1); // Not called again after unsubscribe
  });

  await t.step("should handle unsubscribe and resubscribe", () => {
    const api = new TestApi();
    const callback = spy();

    const unsubscribe = api.subscribe(callback);
    unsubscribe();

    const callback2 = spy();
    api.subscribe(callback2);
    api.notifyPublic();

    assertSpyCalls(callback, 0);
    assertSpyCalls(callback2, 1);
  });

  await t.step("should handle notifications without subscribers", () => {
    const api = new TestApi();
    api.notifyPublic();
  });

  await t.step(
    "should coalesce multiple notify() calls inside batch() into one",
    () => {
      const api = new TestApi();
      const callback = spy();
      api.subscribe(callback);

      api.batch(() => {
        api.notifyPublic();
        api.notifyPublic();
        api.notifyPublic();
      });

      assertSpyCalls(callback, 1);
    },
  );

  await t.step("should not defer notify() outside of batch()", () => {
    const api = new TestApi();
    const callback = spy();
    api.subscribe(callback);

    api.notifyPublic();
    api.notifyPublic();

    assertSpyCalls(callback, 2);
  });

  await t.step("should default root to itself", () => {
    const api = new TestApi();
    assertEquals(api.root, api);
  });

  await t.step("should resolve root to the ultimate ancestor", () => {
    const root = new RootedTestApi();
    const child = new RootedTestApi(root);
    const grandchild = new RootedTestApi(child);

    assertEquals(root.root, root);
    assertEquals(child.root, root);
    assertEquals(grandchild.root, root);
  });

  await t.step(
    "should coalesce notify() across instances that share a batch root",
    () => {
      const root = new RootedTestApi();
      const child = new RootedTestApi(root);
      const rootCallback = spy();
      const childCallback = spy();
      root.subscribe(rootCallback);
      child.subscribe(childCallback);

      // Calling batch() on the child still defers via the shared root.
      child.batch(() => {
        child.notifyPublic();
        root.notifyPublic();
        child.notifyPublic();
      });

      assertSpyCalls(rootCallback, 1);
      assertSpyCalls(childCallback, 1);
    },
  );

  await t.step(
    "should not let batch() on one tree defer notify() on an unrelated tree",
    () => {
      const api1 = new RootedTestApi();
      const api2 = new RootedTestApi(); // Its own, unrelated root.
      const order: string[] = [];
      api1.subscribe(() => order.push("api1"));
      api2.subscribe(() => order.push("api2"));

      api1.batch(() => {
        api2.notifyPublic(); // Unrelated tree, fires immediately.
        order.push("mid-batch");
        api1.notifyPublic(); // Deferred until this batch() call returns.
      });

      assertEquals(order, ["api2", "mid-batch", "api1"]);
    },
  );

  await t.step("should only flush after the outermost batch() returns", () => {
    const api = new TestApi();
    const callback = spy();
    api.subscribe(callback);

    api.batch(() => {
      api.batch(() => {
        api.notifyPublic();
      });
      assertSpyCalls(callback, 0);
      api.notifyPublic();
    });

    assertSpyCalls(callback, 1);
  });
});
