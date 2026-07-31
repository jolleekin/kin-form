import "./_test-setup.ts";
import { assert, assertEquals } from "@std/assert";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { FormApi } from "@kin-form/core";
import { DevtoolsPanel } from "./DevtoolsPanel.tsx";
import { DevtoolsRegistry } from "./DevtoolsRegistry.ts";

const STORAGE_KEY = "kin-form-devtools:position";

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

Deno.test("DevtoolsPanel", async (t) => {
  await t.step(
    "the toggle shows the current registered form count, live",
    () => {
      try {
        const registry = new DevtoolsRegistry();

        render(<DevtoolsPanel registry={registry} />);
        screen.getByRole("button", { name: "Kin Form (0)" });

        act(() => {
          registerForm(registry, new FormApi({ initialValue: { name: "a" } }));
        });

        screen.getByRole("button", { name: "Kin Form (1)" });
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "is closed by default, and opens/closes on clicking the toggle",
    () => {
      try {
        const registry = new DevtoolsRegistry();

        render(<DevtoolsPanel registry={registry} />);
        assertEquals(screen.queryByText(/No form has called/), null);

        fireEvent.click(screen.getByRole("button", { name: "Kin Form (0)" }));
        screen.getByText(/No form has called useFormDevtools yet\./);

        fireEvent.click(screen.getByRole("button", { name: "Kin Form (0)" }));
        assertEquals(screen.queryByText(/No form has called/), null);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "lists registered forms by name (or #id) in the select, with dirty/submitting flags",
    () => {
      try {
        const registry = new DevtoolsRegistry();
        const named = new FormApi({ initialValue: { name: "a" } });
        const unnamed = new FormApi({ initialValue: { count: 0 } });
        registerForm(registry, named, "checkout");
        registerForm(registry, unnamed);

        act(() => {
          unnamed.value = { count: 1 }; // Makes it dirty.
        });

        render(<DevtoolsPanel registry={registry} />);
        fireEvent.click(screen.getByRole("button", { name: "Kin Form (2)" }));

        screen.getByText("checkout");
        screen.getByText(`#${unnamed.id} (dirty)`);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "selecting a different form in the dropdown switches the displayed tree",
    () => {
      try {
        const registry = new DevtoolsRegistry();
        const form1 = new FormApi({ initialValue: { alpha: "x" } });
        const form2 = new FormApi({ initialValue: { beta: "y" } });
        form1.field("alpha" as never);
        form2.field("beta" as never);
        registerForm(registry, form1, "first");
        registerForm(registry, form2, "second");

        render(<DevtoolsPanel registry={registry} />);
        fireEvent.click(screen.getByRole("button", { name: "Kin Form (2)" }));

        screen.getByText("alpha");
        assertEquals(screen.queryByText("beta"), null);

        fireEvent.change(screen.getByDisplayValue("first"), {
          target: { value: String(form2.id) },
        });

        screen.getByText("beta");
        assertEquals(screen.queryByText("alpha"), null);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "shows the empty-registry placeholder even while open, until a form registers",
    () => {
      try {
        const registry = new DevtoolsRegistry();

        render(<DevtoolsPanel registry={registry} />);
        fireEvent.click(screen.getByRole("button", { name: "Kin Form (0)" }));
        screen.getByText(/No form has called/);

        act(() => {
          registerForm(registry, new FormApi({ initialValue: { name: "a" } }));
        });

        assertEquals(screen.queryByText(/No form has called/), null);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "clicking a dock corner repositions the toggle and persists the choice to localStorage",
    () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        const registry = new DevtoolsRegistry();

        render(
          <DevtoolsPanel registry={registry} initialPosition="bottom-right" />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Kin Form (0)" }));

        fireEvent.click(screen.getByTitle("Dock top-left"));

        const toggle = screen.getByRole("button", { name: "Kin Form (0)" });
        assertEquals(toggle.style.top, "12px");
        assertEquals(toggle.style.left, "12px");
        assertEquals(localStorage.getItem(STORAGE_KEY), "top-left");
      } finally {
        localStorage.removeItem(STORAGE_KEY);
        cleanup();
      }
    },
  );

  await t.step(
    "a stored position overrides initialPosition on the next mount",
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, "top-left");
        const registry = new DevtoolsRegistry();

        render(
          <DevtoolsPanel registry={registry} initialPosition="bottom-right" />,
        );

        const toggle = screen.getByRole("button", { name: "Kin Form (0)" });
        assertEquals(toggle.style.top, "12px");
        assertEquals(toggle.style.left, "12px");
      } finally {
        localStorage.removeItem(STORAGE_KEY);
        cleanup();
      }
    },
  );

  await t.step(
    "falls back to another registered form if the selected one unregisters",
    () => {
      try {
        const registry = new DevtoolsRegistry();
        const form1 = new FormApi({ initialValue: { alpha: "x" } });
        const form2 = new FormApi({ initialValue: { beta: "y" } });
        form2.field("beta" as never);
        const unregister1 = registerForm(registry, form1, "first");
        registerForm(registry, form2, "second");

        render(<DevtoolsPanel registry={registry} />);
        fireEvent.click(screen.getByRole("button", { name: "Kin Form (2)" }));

        assertEquals(screen.queryByText("beta"), null);

        act(() => {
          unregister1();
        });

        screen.getByText("beta");
      } finally {
        cleanup();
      }
    },
  );

  await t.step("assigns each dock corner a distinct accessible title", () => {
    try {
      const registry = new DevtoolsRegistry();

      render(<DevtoolsPanel registry={registry} />);
      fireEvent.click(screen.getByRole("button", { name: "Kin Form (0)" }));

      for (
        const title of [
          "Dock top-left",
          "Dock top-right",
          "Dock bottom-left",
          "Dock bottom-right",
        ]
      ) {
        assert(screen.getByTitle(title) != null);
      }
    } finally {
      cleanup();
    }
  });
});
