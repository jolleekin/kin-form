import "./_test-setup.ts";
import { assertEquals, assertStrictEquals } from "@std/assert";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { FieldApi, FormApi } from "@kin-form/core/index.ts";
import { Watch } from "./Watch.tsx";

type Person = { name: string; address: { city: string } };

Deno.test("Watch", async (t) => {
  await t.step(
    "field: renders the current field value and updates on change/blur",
    () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", address: { city: "" } },
        });

        render(
          <Watch api={form.field("name")}>
            {(field) => (
              <input
                data-testid="name"
                value={field.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            )}
          </Watch>,
        );

        const input = screen.getByTestId("name") as HTMLInputElement;
        assertEquals(input.value, "a");

        fireEvent.change(input, { target: { value: "b" } });
        assertEquals(form.field("name").value, "b");
        assertEquals(form.value.name, "b");

        assertEquals(form.field("name").touched, false);
        fireEvent.blur(input);
        assertEquals(form.field("name").touched, true);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "field: re-renders the render prop when the field's value changes externally",
    () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", address: { city: "" } },
        });

        render(
          <Watch api={form.field("name")}>
            {(field) => <span data-testid="out">{field.value}</span>}
          </Watch>,
        );

        assertEquals(screen.getByTestId("out").textContent, "a");

        act(() => {
          form.field("name").value = "c";
        });

        assertEquals(screen.getByTestId("out").textContent, "c");
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "group: nests a field under the group's own value, keyed by dot-path",
    () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "", address: { city: "NYC" } },
        });

        render(
          <Watch api={form.field("address")}>
            {(group) => (
              <Watch api={group.field("city")}>
                {(field) => (
                  <input
                    data-testid="city"
                    value={field.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </Watch>
            )}
          </Watch>,
        );

        const input = screen.getByTestId("city") as HTMLInputElement;
        assertEquals(input.value, "NYC");

        fireEvent.change(input, { target: { value: "LA" } });
        assertEquals(form.value.address.city, "LA");
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "group: re-renders the render prop when the group's value changes externally",
    () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "", address: { city: "NYC" } },
        });

        render(
          <Watch api={form.field("address")}>
            {(group) => <span data-testid="out">{group.value.city}</span>}
          </Watch>,
        );

        assertEquals(screen.getByTestId("out").textContent, "NYC");

        act(() => {
          form.field("address").value = { city: "SF" };
        });

        assertEquals(screen.getByTestId("out").textContent, "SF");
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "form overload: re-renders when the selected form property changes",
    () => {
      try {
        const form = new FormApi<{ name: string }>({
          initialValue: { name: "a" },
        });
        let renders = 0;

        render(
          <Watch api={form} select={(f) => f.dirty}>
            {(_form, dirty) => {
              renders++;
              return <span data-testid="out">{String(dirty)}</span>;
            }}
          </Watch>,
        );

        assertEquals(renders, 1);
        assertEquals(screen.getByTestId("out").textContent, "false");

        act(() => {
          form.value = { name: "b" };
        });

        assertEquals(renders, 2);
        assertEquals(screen.getByTestId("out").textContent, "true");
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "field overload: re-renders when the selected field property changes",
    () => {
      try {
        const field = new FieldApi<string>(null, "", {
          initialValue: "a",
        });
        let renders = 0;

        render(
          <Watch api={field} select={(f) => f.value}>
            {(_field, value) => {
              renders++;
              return <span data-testid="out">{String(value)}</span>;
            }}
          </Watch>,
        );

        assertEquals(renders, 1);

        act(() => {
          field.value = "b";
        });

        assertEquals(renders, 2);
        assertEquals(screen.getByTestId("out").textContent, "b");
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "form select overload: children receive the api and the selected slice",
    () => {
      try {
        const form = new FormApi<{ name: string }>({
          initialValue: { name: "ab" },
        });
        let renders = 0;

        render(
          <Watch api={form} select={(f) => f.value.name.length}>
            {(f, len) => {
              renders++;
              assertStrictEquals(f, form);
              return <span data-testid="out">{len}</span>;
            }}
          </Watch>,
        );

        assertEquals(renders, 1);
        assertEquals(screen.getByTestId("out").textContent, "2");

        // Same length -> no re-render.
        act(() => {
          form.value = { name: "cd" };
        });
        assertEquals(renders, 1);

        act(() => {
          form.value = { name: "efg" };
        });
        assertEquals(renders, 2);
        assertEquals(screen.getByTestId("out").textContent, "3");
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "field select overload: children receive the api and the selected slice",
    () => {
      try {
        const field = new FieldApi<string>(null, "", {
          initialValue: "abc",
        });
        let renders = 0;

        render(
          <Watch api={field} select={(f) => f.value.length}>
            {(f, len) => {
              renders++;
              assertStrictEquals(f, field);
              return <span data-testid="out">{len}</span>;
            }}
          </Watch>,
        );

        assertEquals(renders, 1);
        assertEquals(screen.getByTestId("out").textContent, "3");

        act(() => {
          field.value = "de";
        });
        assertEquals(renders, 2);
        assertEquals(screen.getByTestId("out").textContent, "2");
      } finally {
        cleanup();
      }
    },
  );
});
