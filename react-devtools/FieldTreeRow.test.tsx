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
import { FieldTreeRow } from "./FieldTreeRow.tsx";
import type { AnyNode } from "./types.ts";

type Person = { name: string; age: number; tags: string[] };

// `FormApi<TValue>` (`TParentValue = never`) isn't structurally assignable
// to `AnyNode`; see `types.ts`'s comment on the same issue for
// `FieldTreeRow`'s own `selected as unknown as AnyNode` cast in
// `DevtoolsPanel.tsx`.
function asNode<T>(node: T): AnyNode {
  return node as unknown as AnyNode;
}

Deno.test("FieldTreeRow", async (t) => {
  await t.step("renders a leaf field's name and JSON-formatted value", () => {
    try {
      const form = new FormApi<Person>({
        initialValue: { name: "a", age: 1, tags: [] },
      });
      const field = form.field("name");

      render(<FieldTreeRow node={field} depth={0} />);

      screen.getByText("name");
      screen.getByText('"a"');
    } finally {
      cleanup();
    }
  });

  await t.step('shows "(root)" for a node with an empty name', () => {
    try {
      const form = new FormApi<Person>({
        initialValue: { name: "a", age: 1, tags: [] },
      });

      render(<FieldTreeRow node={asNode(form)} depth={0} />);

      screen.getByText("(root)");
    } finally {
      cleanup();
    }
  });

  await t.step(
    "a group renders its registered children, but not a value of its own",
    () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", age: 1, tags: [] },
        });
        form.field("name");
        form.field("age");

        const { container } = render(
          <FieldTreeRow node={asNode(form)} depth={0} />,
        );

        screen.getByText("name");
        screen.getByText("age");
        // Only leaves show a formatted value; the root group itself doesn't.
        assertEquals(container.textContent?.includes('{"name"'), false);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "the disclosure button collapses and re-expands a group's children",
    () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", age: 1, tags: [] },
        });
        form.field("name");

        render(<FieldTreeRow node={asNode(form)} depth={0} />);

        screen.getByText("name");
        fireEvent.click(screen.getByLabelText("Collapse"));
        assertEquals(screen.queryByText("name"), null);

        fireEvent.click(screen.getByLabelText("Expand"));
        screen.getByText("name");
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "sorts an array field's children by their numeric index, not by field registry insertion/iteration order",
    () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", age: 1, tags: ["a", "b", "c"] },
        });
        const tags = form.field("tags");
        tags.field("0");
        tags.field("1");
        tags.field("2");

        // Re-keys the field registry in place; per `FieldApi`, this can
        // leave the underlying `Map`'s iteration order out of sync with the
        // current numeric index order.
        tags.swapItems("", 0, 1);

        const { container } = render(<FieldTreeRow node={tags} depth={0} />);
        const text = container.textContent ?? "";

        // Values follow the swap ("b" is now at index 0, "a" at index 1),
        // but rows must still be laid out in ascending index order.
        const i0 = text.indexOf('0"b"');
        const i1 = text.indexOf('1"a"');
        const i2 = text.indexOf('2"c"');

        assert(i0 >= 0 && i1 >= 0 && i2 >= 0);
        assert(i0 < i1);
        assert(i1 < i2);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "keeps a plain object group's children in registration order",
    () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", age: 1, tags: [] },
        });
        form.field("age");
        form.field("name");

        const { container } = render(
          <FieldTreeRow node={asNode(form)} depth={0} />,
        );
        const text = container.textContent ?? "";

        assert(text.indexOf("age") < text.indexOf("name"));
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "shows a touched badge once the field becomes touched",
    async () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", age: 1, tags: [] },
        });
        const field = form.field("name");

        render(<FieldTreeRow node={field} depth={0} />);

        assertEquals(screen.queryByText("touched"), null);

        await act(async () => {
          field.touched = true;
          await Promise.resolve();
        });

        screen.getByText("touched");
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "shows an invalid badge and the error message immediately, for a sync validator",
    () => {
      try {
        // `validators` run synchronously at construction, no `validate()`
        // call or `act()` wrapping needed to see the badge; that's the whole
        // point of them being immediate rather than debounced.
        const form = new FormApi<Person>({
          initialValue: { name: "", age: 1, tags: [] },
        });
        const field = form.field("name", {
          validators: [(f) => (f.value ? null : "Required")],
        });

        render(<FieldTreeRow node={field} depth={0} />);

        screen.getByText("invalid");
        screen.getByText("Required");
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "shows a validating badge while an async validator is in flight",
    async () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", age: 1, tags: [] },
        });
        const field = form.field("name", {
          asyncValidator: () =>
            new Promise<null>((r) => setTimeout(() => r(null), 5)),
        });

        render(<FieldTreeRow node={field} depth={0} />);

        field.validate(true); // Sets `validating` synchronously, before it settles.
        assertEquals(field.validating, true);

        await act(async () => {
          await Promise.resolve();
        });
        screen.getByText("validating");

        await act(async () => {
          await field.waitForValidation();
        });
        assertEquals(screen.queryByText("validating"), null);
      } finally {
        cleanup();
      }
    },
  );

  await t.step("formats a Date value as an ISO string", () => {
    try {
      const date = new Date("2024-01-01T00:00:00.000Z");
      const form = new FormApi<{ createdAt: Date }>({
        initialValue: { createdAt: date },
      });
      const field = form.field("createdAt");

      render(<FieldTreeRow node={field} depth={0} />);

      screen.getByText(date.toISOString());
    } finally {
      cleanup();
    }
  });

  await t.step(
    "shows a dirty badge once the field's value diverges from its initial value",
    async () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", age: 1, tags: [] },
        });
        const field = form.field("name");

        render(<FieldTreeRow node={field} depth={0} />);

        assertEquals(screen.queryByText("dirty"), null);

        await act(async () => {
          field.value = "b";
          await Promise.resolve();
        });

        screen.getByText("dirty");
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "the details toggle reveals a node's full state, independent of the children disclosure",
    () => {
      try {
        const form = new FormApi<Person>({
          initialValue: { name: "a", age: 1, tags: [] },
        });
        form.field("name");

        render(<FieldTreeRow node={asNode(form)} depth={0} />);

        assertEquals(screen.queryByText("validators:"), null);

        // Both the root and its "name" child render their own "Show
        // details" toggle; the root's is first in document order.
        fireEvent.click(screen.getAllByLabelText("Show details")[0]);
        screen.getByText("validators:");
        screen.getByText("children:");
        // Collapsing children doesn't hide the details block.
        fireEvent.click(screen.getByLabelText("Collapse"));
        screen.getByText("validators:");

        fireEvent.click(screen.getByLabelText("Hide details"));
        assertEquals(screen.queryByText("validators:"), null);
      } finally {
        cleanup();
      }
    },
  );

  await t.step("formats a File value as File(name)", () => {
    try {
      const file = new File(["contents"], "photo.png");
      const form = new FormApi<{ avatar: File }>({
        initialValue: { avatar: file },
      });
      const field = form.field("avatar");

      render(<FieldTreeRow node={field} depth={0} />);

      screen.getByText("File(photo.png)");
    } finally {
      cleanup();
    }
  });
});
