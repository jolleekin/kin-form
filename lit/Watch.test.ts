import "./_test-setup.ts";
import { assertEquals, assertThrows } from "@std/assert";
import { html, render } from "lit";
import { FieldApi, FormApi } from "@kintools/form-core";
import { watch } from "./Watch.ts";

Deno.test("watch", async (t) => {
  await t.step(
    "updates just the part on any change by default (no select), without re-invoking the host template",
    () => {
      const field = new FieldApi<string>(null, "", { initialValue: "a" });
      const container = document.createElement("div");
      let templateCalls = 0;

      const hostTemplate = () => {
        templateCalls++;
        return html`<span>${watch(field, (f) => f.value)}</span>`;
      };

      render(hostTemplate(), container);
      assertEquals(container.textContent, "a");
      assertEquals(templateCalls, 1);

      field.value = "b";
      assertEquals(container.textContent, "b");
      // Only the directive's own part updated; the host template itself
      // wasn't re-invoked.
      assertEquals(templateCalls, 1);
    },
  );

  await t.step("a select updates only when the selected value changes", () => {
    const field = new FieldApi<string>(null, "", { initialValue: "ab" });
    const container = document.createElement("div");
    let renderCalls = 0;

    render(
      html`<span>${
        watch(field, (f) => f.value.length, (_f, length) => {
          renderCalls++;
          return length;
        })
      }</span>`,
      container,
    );
    assertEquals(container.textContent, "2");
    assertEquals(renderCalls, 1);

    // Same length -> selector result unchanged -> no re-render.
    field.value = "cd";
    assertEquals(container.textContent, "2");
    assertEquals(renderCalls, 1);

    // Different length -> re-renders with the new selected value.
    field.value = "efg";
    assertEquals(container.textContent, "3");
    assertEquals(renderCalls, 2);
  });

  await t.step("honors a custom equal function", () => {
    const field = new FieldApi<{ a: number; b: number }>(null, "", {
      initialValue: { a: 1, b: 1 },
    });
    const container = document.createElement("div");
    let renderCalls = 0;

    render(
      html`<span>${
        watch(field, (f) => f.value, (_f, v) => {
          renderCalls++;
          return v.a;
        }, (a, b) => a.a === b.a)
      }</span>`,
      container,
    );
    assertEquals(container.textContent, "1");
    assertEquals(renderCalls, 1);

    // `b` changed but `equal` only compares `a` -> no re-render.
    field.value = { a: 1, b: 2 };
    assertEquals(renderCalls, 1);

    field.value = { a: 2, b: 2 };
    assertEquals(container.textContent, "2");
    assertEquals(renderCalls, 2);
  });

  await t.step("supports a FormApi directly", () => {
    const form = new FormApi<{ a: string }>({ initialValue: { a: "x" } });
    const container = document.createElement("div");

    render(html`<span>${watch(form, (f) => f.value.a)}</span>`, container);
    assertEquals(container.textContent, "x");

    form.value = { a: "y" };
    assertEquals(container.textContent, "y");
  });

  await t.step("unsubscribes when the part is cleared", () => {
    const field = new FieldApi<string>(null, "", { initialValue: "a" });
    const container = document.createElement("div");
    let unsubscribed = 0;
    const originalSubscribe = field.subscribe;
    (field as unknown as { subscribe: typeof field.subscribe }).subscribe = (
      (cb, immediate) => {
        const unsubscribe = originalSubscribe(cb, immediate);
        return () => {
          unsubscribed++;
          unsubscribe();
        };
      }
    ) as typeof field.subscribe;

    render(html`<span>${watch(field, (f) => f.value)}</span>`, container);
    assertEquals(unsubscribed, 0);

    render(html`<span></span>`, container);
    assertEquals(unsubscribed, 1);
  });

  await t.step(
    "resubscribes and refreshes on reconnect, ignoring changes while disconnected",
    () => {
      const field = new FieldApi<string>(null, "", { initialValue: "a" });
      const container = document.createElement("div");

      const rootPart = render(
        html`<span>${watch(field, (f) => f.value)}</span>`,
        container,
      );
      assertEquals(container.textContent, "a");

      rootPart.setConnected(false);
      // Changes while disconnected shouldn't reach the DOM...
      field.value = "b";
      assertEquals(container.textContent, "a");

      rootPart.setConnected(true);
      // ...but reconnecting immediately reflects the current value, not a
      // stale cached one.
      assertEquals(container.textContent, "b");

      // And the subscription is live again, not just a one-time catch-up.
      field.value = "c";
      assertEquals(container.textContent, "c");
    },
  );

  await t.step("throws when bound to an attribute instead of content", () => {
    const field = new FieldApi<string>(null, "", { initialValue: "a" });
    const container = document.createElement("div");

    assertThrows(() => {
      render(
        html`<div class=${watch(field, (f) => f.value)}></div>`,
        container,
      );
    });
  });
});
