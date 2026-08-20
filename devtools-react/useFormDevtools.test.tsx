import "./_test-setup.ts";
import { assertEquals, assertStrictEquals } from "@std/assert";
import { cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormApi } from "@kintools/form-core";
import { DevtoolsContext } from "./DevtoolsProvider.tsx";
import { DevtoolsRegistry } from "./DevtoolsRegistry.ts";
import { useFormDevtools } from "./useFormDevtools.ts";

type Person = { name: string };

function withRegistry(registry: DevtoolsRegistry) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <DevtoolsContext value={registry}>{children}</DevtoolsContext>;
  };
}

Deno.test("useFormDevtools", async (t) => {
  await t.step(
    "is a no-op without an ancestor DevtoolsProvider",
    () => {
      try {
        const form = new FormApi<Person>({ initialValue: { name: "a" } });

        renderHook(() => useFormDevtools(form));
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "registers the form into the ancestor registry, keyed by the form's id",
    () => {
      try {
        const registry = new DevtoolsRegistry();
        const form = new FormApi<Person>({ initialValue: { name: "a" } });

        renderHook(() => useFormDevtools(form), {
          wrapper: withRegistry(registry),
        });

        assertStrictEquals(registry.forms.get(form.id), form);
      } finally {
        cleanup();
      }
    },
  );

  await t.step("passes the given name through to the registry", () => {
    try {
      const registry = new DevtoolsRegistry();
      const form = new FormApi<Person>({ initialValue: { name: "a" } });

      renderHook(() => useFormDevtools(form, "checkout"), {
        wrapper: withRegistry(registry),
      });

      assertEquals(registry.getFormName(form.id), "checkout");
    } finally {
      cleanup();
    }
  });

  await t.step("unregisters the form on unmount", () => {
    try {
      const registry = new DevtoolsRegistry();
      const form = new FormApi<Person>({ initialValue: { name: "a" } });

      const { unmount } = renderHook(() => useFormDevtools(form), {
        wrapper: withRegistry(registry),
      });

      assertEquals(registry.forms.size, 1);
      unmount();
      assertEquals(registry.forms.size, 0);
    } finally {
      cleanup();
    }
  });

  await t.step(
    "re-registers under the new form when the form instance changes",
    () => {
      try {
        const registry = new DevtoolsRegistry();
        const form1 = new FormApi<Person>({ initialValue: { name: "a" } });
        const form2 = new FormApi<Person>({ initialValue: { name: "b" } });

        const { rerender } = renderHook(
          ({ form }: { form: FormApi<Person> }) => useFormDevtools(form),
          { wrapper: withRegistry(registry), initialProps: { form: form1 } },
        );

        assertEquals(registry.forms.size, 1);
        assertStrictEquals(registry.forms.get(form1.id), form1);

        rerender({ form: form2 });

        assertEquals(registry.forms.size, 1);
        assertEquals(registry.forms.has(form1.id), false);
        assertStrictEquals(registry.forms.get(form2.id), form2);
      } finally {
        cleanup();
      }
    },
  );
});
