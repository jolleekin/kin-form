import { assertEquals, assertStrictEquals } from "@std/assert";
import { FormApi } from "@kintools/form-core";
import { DevtoolsRegistry } from "./DevtoolsRegistry.ts";

// `DevtoolsRegistry.register` takes `FormApi<unknown>`; a concretely-typed
// `FormApi<T>` isn't structurally assignable to that (same contravariance
// as `AnyNode` in `types.ts`), so tests go through this cast helper
// instead of repeating it at every callsite.
function registerForm<T>(
  registry: DevtoolsRegistry,
  form: FormApi<T>,
  name?: string,
): VoidFunction {
  return registry.register(form as unknown as FormApi<unknown>, name);
}

Deno.test("DevtoolsRegistry", async (t) => {
  await t.step("starts with no forms and version 0", () => {
    const registry = new DevtoolsRegistry();

    assertEquals(registry.forms.size, 0);
    assertEquals(registry.getVersion(), 0);
  });

  await t.step("register adds the form, keyed by its id", () => {
    const registry = new DevtoolsRegistry();
    const form = new FormApi({ initialValue: { name: "a" } });

    registerForm(registry, form);

    assertEquals(registry.forms.size, 1);
    assertStrictEquals(registry.forms.get(form.id), form);
  });

  await t.step(
    "getFormName returns the given name, or undefined if none was given",
    () => {
      const registry = new DevtoolsRegistry();
      const named = new FormApi({ initialValue: { name: "a" } });
      const unnamed = new FormApi({ initialValue: { name: "b" } });

      registerForm(registry, named, "checkout");
      registerForm(registry, unnamed);

      assertEquals(registry.getFormName(named.id), "checkout");
      assertEquals(registry.getFormName(unnamed.id), undefined);
    },
  );

  await t.step("register bumps the version and notifies subscribers", () => {
    const registry = new DevtoolsRegistry();
    const form = new FormApi({ initialValue: { name: "a" } });
    let calls = 0;
    registry.subscribe(() => calls++);

    registerForm(registry, form);

    assertEquals(registry.getVersion(), 1);
    assertEquals(calls, 1);
  });

  await t.step(
    "the function returned by register removes the form and its name, and notifies again",
    () => {
      const registry = new DevtoolsRegistry();
      const form = new FormApi({ initialValue: { name: "a" } });
      let calls = 0;
      registry.subscribe(() => calls++);

      const unregister = registerForm(registry, form, "checkout");
      unregister();

      assertEquals(registry.forms.size, 0);
      assertEquals(registry.getFormName(form.id), undefined);
      assertEquals(registry.getVersion(), 2);
      assertEquals(calls, 2);
    },
  );

  await t.step("notifies every subscribed listener", () => {
    const registry = new DevtoolsRegistry();
    const form = new FormApi({ initialValue: { name: "a" } });
    let calls1 = 0;
    let calls2 = 0;
    registry.subscribe(() => calls1++);
    registry.subscribe(() => calls2++);

    registerForm(registry, form);

    assertEquals(calls1, 1);
    assertEquals(calls2, 1);
  });

  await t.step(
    "the function returned by subscribe stops further notifications",
    () => {
      const registry = new DevtoolsRegistry();
      const form1 = new FormApi({ initialValue: { name: "a" } });
      const form2 = new FormApi({ initialValue: { name: "b" } });
      let calls = 0;
      const unsubscribe = registry.subscribe(() => calls++);

      registerForm(registry, form1);
      unsubscribe();
      registerForm(registry, form2);

      assertEquals(calls, 1);
    },
  );

  await t.step("tracks multiple forms independently", () => {
    const registry = new DevtoolsRegistry();
    const form1 = new FormApi({ initialValue: { name: "a" } });
    const form2 = new FormApi({ initialValue: { name: "b" } });

    registerForm(registry, form1);
    registerForm(registry, form2);

    assertEquals(registry.forms.size, 2);

    const unregister1 = registerForm(registry, form1);
    unregister1();

    assertEquals(registry.forms.size, 1);
    assertStrictEquals(registry.forms.get(form2.id), form2);
  });
});
