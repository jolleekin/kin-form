import "./_test-setup.ts";
import { assertEquals, assertStrictEquals } from "@std/assert";
import { act, cleanup, renderHook } from "@testing-library/react";
import { FieldApi } from "@kin-form/core/index.ts";
import { useWatch } from "./useWatch.ts";

Deno.test("useWatch", async (t) => {
  await t.step("re-renders on any change by default (no select)", () => {
    try {
      const field = new FieldApi<string>(null, "", { initialValue: "a" });
      let renders = 0;

      renderHook(() => {
        renders++;
        return useWatch(field);
      });

      assertEquals(renders, 1);

      act(() => {
        field.touched = true;
      });
      assertEquals(renders, 2);

      act(() => {
        field.value = "b";
      });
      assertEquals(renders, 3);
    } finally {
      cleanup();
    }
  });

  await t.step(
    "a select re-renders only when the selected property changes",
    () => {
      try {
        const field = new FieldApi<string>(null, "", {
          initialValue: "a",
        });
        let renders = 0;

        renderHook(() => {
          renders++;
          return useWatch(field, (f) => f.value);
        });

        assertEquals(renders, 1);

        // Not selected: shouldn't cause a re-render.
        act(() => {
          field.touched = true;
        });
        assertEquals(renders, 1);

        // Selected: should cause a re-render.
        act(() => {
          field.value = "b";
        });
        assertEquals(renders, 2);
      } finally {
        cleanup();
      }
    },
  );

  await t.step("returns the api itself when select is omitted", () => {
    try {
      const field = new FieldApi<string>(null, "", { initialValue: "a" });
      const { result } = renderHook(() => useWatch(field));
      assertStrictEquals(result.current, field);
    } finally {
      cleanup();
    }
  });

  await t.step(
    "a select re-renders only when the selected slice changes",
    () => {
      try {
        const field = new FieldApi<string>(null, "", {
          initialValue: "ab",
        });
        let renders = 0;

        const { result } = renderHook(() => {
          renders++;
          return useWatch(field, (f) => f.value.length);
        });

        assertEquals(renders, 1);
        assertEquals(result.current, 2);

        // Same length -> selector result unchanged -> no re-render.
        act(() => {
          field.value = "cd";
        });
        assertEquals(renders, 1);

        // Different length -> re-render with the new slice.
        act(() => {
          field.value = "efg";
        });
        assertEquals(renders, 2);
        assertEquals(result.current, 3);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "a select defaults to shallow equality for an array result",
    () => {
      try {
        const field = new FieldApi<string>(null, "", {
          initialValue: "a",
        });
        let renders = 0;

        const { result } = renderHook(() => {
          renders++;
          return useWatch(field, (f) => [f.value, f.touched] as const);
        });

        assertEquals(renders, 1);

        // A fresh array with the same contents -> no re-render.
        act(() => {
          field.value = "a";
        });
        assertEquals(renders, 1);

        act(() => {
          field.value = "b";
        });
        assertEquals(renders, 2);
        assertEquals(result.current, ["b", false]);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "a select defaults to shallow equality for an object result",
    () => {
      try {
        const field = new FieldApi<{ a: number }>(null, "", {
          initialValue: { a: 1 },
        });
        let renders = 0;

        const { result } = renderHook(() => {
          renders++;
          return useWatch(field, (f) => ({ a: f.value.a }));
        });

        assertEquals(renders, 1);

        // A fresh object with the same `a` -> no re-render.
        act(() => {
          field.value = { a: 1 };
        });
        assertEquals(renders, 1);

        act(() => {
          field.value = { a: 2 };
        });
        assertEquals(renders, 2);
        assertEquals(result.current, { a: 2 });
      } finally {
        cleanup();
      }
    },
  );

  await t.step("a select honors a custom equal function", () => {
    try {
      const field = new FieldApi<{ a: number; b: number }>(null, "", {
        initialValue: { a: 1, b: 1 },
      });
      let renders = 0;

      const { result } = renderHook(() => {
        renders++;
        return useWatch(
          field,
          (f) => f.value,
          (a, b) => a.a === b.a,
        );
      });

      const firstValue = result.current;
      assertEquals(renders, 1);

      // `b` changed but `equal` only compares `a` -> no re-render, and the
      // cached slice reference is preserved.
      act(() => {
        field.value = { a: 1, b: 2 };
      });
      assertEquals(renders, 1);
      assertStrictEquals(result.current, firstValue);

      act(() => {
        field.value = { a: 2, b: 2 };
      });
      assertEquals(renders, 2);
      assertEquals(result.current, { a: 2, b: 2 });
    } finally {
      cleanup();
    }
  });

  await t.step(
    "returns the group itself when select is omitted",
    () => {
      try {
        const group = new FieldApi<{ a: string }>(null, "", {
          initialValue: { a: "x" },
        });
        const { result } = renderHook(() => useWatch(group, undefined));
        assertStrictEquals(result.current, group);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "a select on a nested field re-renders when schemaErrorMap changes",
    async () => {
      try {
        const group = new FieldApi<{ a: string }>(null, "", {
          initialValue: { a: "x" },
        });
        let renders = 0;

        renderHook(() => {
          renders++;
          return useWatch(group, (g) => g.schemaErrorMap);
        });

        assertEquals(renders, 1);

        await act(async () => {
          group.schemaValidator = () => ({ a: "Required" });
          group.value = { a: "y" };
          await group.waitForValidation();
        });

        assertEquals(renders, 2);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "a select on a leaf field re-renders when its own schemaError changes",
    async () => {
      try {
        const group = new FieldApi<{ a: string; b: string }>(null, "", {
          initialValue: { a: "", b: "" },
        });
        const fieldA = group.field("a");
        let renders = 0;

        renderHook(() => {
          renders++;
          return useWatch(fieldA, (f) => f.schemaError);
        });

        assertEquals(renders, 1);

        await act(async () => {
          group.schemaValidator = () => ({ a: "Required" });
          group.value = { a: "", b: "changed" };
          await group.waitForValidation();
        });

        assertEquals(renders, 2);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "a FieldSelector on a nested field re-renders only when the selected slice changes",
    async () => {
      try {
        const group = new FieldApi<{ a: string }>(null, "", {
          initialValue: { a: "" },
        });
        let renders = 0;

        const { result } = renderHook(() => {
          renders++;
          return useWatch(
            group,
            (g) => Object.keys(g.schemaErrorMap ?? {}).length,
          );
        });

        assertEquals(renders, 1);
        assertEquals(result.current, 0);

        await act(async () => {
          group.schemaValidator = () => ({ a: "Required" });
          group.value = { a: "y" };
          await group.waitForValidation();
        });

        assertEquals(renders, 2);
        assertEquals(result.current, 1);
      } finally {
        cleanup();
      }
    },
  );
});
