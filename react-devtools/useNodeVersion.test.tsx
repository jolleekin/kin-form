import "./_test-setup.ts";
import { assertEquals } from "@std/assert";
import { act, cleanup, renderHook } from "@testing-library/react";
import { FormApi } from "@kin-form/core";
import { useNodeVersion } from "./useNodeVersion.ts";
import type { AnyNode } from "./types.ts";

type Person = { name: string; tags: string[] };

// `FormApi<TValue>` (`TParentValue = never`) isn't structurally assignable
// to `AnyNode`; see `types.ts`'s comment on the same contravariance
// issue that `DevtoolsPanel.tsx` casts around.
function asNode<T>(node: T): AnyNode {
  return node as unknown as AnyNode;
}

Deno.test("useNodeVersion", async (t) => {
  await t.step("re-renders when the node's own state changes", async () => {
    try {
      const form = new FormApi<Person>({
        initialValue: { name: "a", tags: [] },
      });
      const field = form.field("name");
      let renders = 0;

      renderHook(() => {
        useNodeVersion(field);
        renders++;
      });

      assertEquals(renders, 1);

      await act(async () => {
        field.value = "b";
        await Promise.resolve();
      });

      assertEquals(renders, 2);
    } finally {
      cleanup();
    }
  });

  await t.step(
    "for a group, re-renders when a child field is registered (onChildrenChanged), not just on subscribe",
    async () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", tags: [] },
        });
        let renders = 0;

        renderHook(() => {
          useNodeVersion(asNode(form));
          renders++;
        });

        assertEquals(renders, 1);

        await act(async () => {
          form.field("name");
          await Promise.resolve();
        });

        assertEquals(renders, 2);
      } finally {
        cleanup();
      }
    },
  );

  await t.step("stops re-rendering after unmount", async () => {
    try {
      const form = new FormApi<Person>({
        initialValue: { name: "a", tags: [] },
      });
      const field = form.field("name");
      let renders = 0;

      const { unmount } = renderHook(() => {
        useNodeVersion(field);
        renders++;
      });

      assertEquals(renders, 1);
      unmount();

      await act(async () => {
        field.value = "b";
        await Promise.resolve();
      });

      assertEquals(renders, 1);
    } finally {
      cleanup();
    }
  });

  await t.step("resubscribes when the node prop changes", async () => {
    try {
      const form = new FormApi<Person>({
        initialValue: { name: "a", tags: [] },
      });
      const field1 = form.field("name");
      const field2 = form.field("tags" as never);
      let renders = 0;

      const { rerender } = renderHook(
        ({ node }: { node: typeof field1 }) => {
          useNodeVersion(node);
          renders++;
        },
        { initialProps: { node: field1 as never } },
      );

      rerender({ node: field2 as never });
      const rendersAfterSwap = renders;

      await act(async () => {
        field1.value = "b";
        await Promise.resolve();
      });

      // `field1` is no longer subscribed to after the swap.
      assertEquals(renders, rendersAfterSwap);
    } finally {
      cleanup();
    }
  });
});
