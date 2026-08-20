import "./_test-setup.ts";
import { assertEquals, assertStrictEquals } from "@std/assert";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import { FieldApi, FormApi } from "@kintools/form-core";
import { WatchController } from "./WatchController.ts";

class TestHost implements ReactiveControllerHost {
  readonly updateComplete: Promise<boolean> = Promise.resolve(true);
  readonly controllers: ReactiveController[] = [];
  updateCount = 0;

  addController(controller: ReactiveController): void {
    this.controllers.push(controller);
  }

  removeController(controller: ReactiveController): void {
    const index = this.controllers.indexOf(controller);
    if (index >= 0) this.controllers.splice(index, 1);
  }

  requestUpdate(): void {
    this.updateCount++;
  }
}

Deno.test("WatchController", async (t) => {
  await t.step(
    "requests an update on any change by default (no select)",
    () => {
      const field = new FieldApi<string>(null, "", { initialValue: "a" });
      const host = new TestHost();
      const watched = new WatchController(host, field);

      assertStrictEquals(watched.value, field);
      assertEquals(host.updateCount, 0);

      field.touched = true;
      assertEquals(host.updateCount, 1);

      field.value = "b";
      assertEquals(host.updateCount, 2);
    },
  );

  await t.step(
    "a select requests an update only when the selected value changes",
    () => {
      const field = new FieldApi<string>(null, "", { initialValue: "a" });
      const host = new TestHost();
      const watched = new WatchController(host, field, (f) => f.value);

      assertEquals(watched.value, "a");
      assertEquals(host.updateCount, 0);

      // Not selected: shouldn't request an update.
      field.touched = true;
      assertEquals(host.updateCount, 0);

      // Selected: should request an update.
      field.value = "b";
      assertEquals(host.updateCount, 1);
      assertEquals(watched.value, "b");
    },
  );

  await t.step("a select defaults to shallow equality", () => {
    const field = new FieldApi<{ a: number }>(null, "", {
      initialValue: { a: 1 },
    });
    const host = new TestHost();
    const watched = new WatchController(host, field, (f) => ({ a: f.value.a }));

    assertEquals(watched.value, { a: 1 });

    // A fresh object with the same `a` -> no update requested.
    field.value = { a: 1 };
    assertEquals(host.updateCount, 0);

    field.value = { a: 2 };
    assertEquals(host.updateCount, 1);
    assertEquals(watched.value, { a: 2 });
  });

  await t.step("honors a custom equal function", () => {
    const field = new FieldApi<{ a: number; b: number }>(null, "", {
      initialValue: { a: 1, b: 1 },
    });
    const host = new TestHost();
    const watched = new WatchController(
      host,
      field,
      (f) => f.value,
      (a, b) => a.a === b.a,
    );
    const firstValue = watched.value;

    // `b` changed but `equal` only compares `a` -> no update, cached selected
    // reference preserved.
    field.value = { a: 1, b: 2 };
    assertEquals(host.updateCount, 0);
    assertStrictEquals(watched.value, firstValue);

    field.value = { a: 2, b: 2 };
    assertEquals(host.updateCount, 1);
    assertEquals(watched.value, { a: 2, b: 2 });
  });

  await t.step(
    "re-subscribes when the api getter returns a different instance",
    () => {
      const fieldA = new FieldApi<string>(null, "", { initialValue: "a" });
      const fieldB = new FieldApi<string>(null, "", { initialValue: "z" });
      let current = fieldA;
      const host = new TestHost();
      const watched = new WatchController(host, () => current);

      assertStrictEquals(watched.value, fieldA);

      current = fieldB;
      // Simulates the host update pass that would pick up a reassigned
      // `.api`-style property, without needing a real Lit element.
      host.controllers[0].hostUpdate?.();
      assertStrictEquals(watched.value, fieldB);

      host.updateCount = 0;
      fieldA.value = "changed"; // no longer subscribed
      assertEquals(host.updateCount, 0);

      fieldB.value = "changed";
      assertEquals(host.updateCount, 1);
    },
  );

  await t.step("value is correct even before hostConnected has run", () => {
    const field = new FieldApi<string>(null, "", { initialValue: "a" });
    const host = new TestHost();
    const watched = new WatchController(host, field);

    // No lifecycle hook invoked yet, unlike a real `ReactiveElement`.
    assertStrictEquals(watched.value, field);
  });

  await t.step("hostDisconnected unsubscribes", () => {
    const field = new FieldApi<string>(null, "", { initialValue: "a" });
    const host = new TestHost();
    const watched = new WatchController(host, field);
    void watched.value; // Triggers the initial subscribe.

    host.controllers[0].hostDisconnected?.();

    host.updateCount = 0;
    field.value = "b";
    assertEquals(host.updateCount, 0);
  });

  await t.step("supports a FormApi directly", () => {
    const form = new FormApi<{ a: string }>({ initialValue: { a: "x" } });
    const host = new TestHost();
    const watched = new WatchController(host, form, (f) => f.value.a);

    assertEquals(watched.value, "x");

    form.value = { a: "y" };
    assertEquals(host.updateCount, 1);
    assertEquals(watched.value, "y");
  });
});
