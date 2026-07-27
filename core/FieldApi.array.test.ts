import { assertEquals } from "@std/assert";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { FieldApi } from "./FieldApi.ts";
import { kDestroy } from "./FieldApi.internal.ts";

Deno.test("FieldApi array helpers", async (t) => {
  await t.step("should push item to array field", () => {
    const group = new FieldApi<{ items: string[] }>(null, "", {
      initialValue: { items: ["a", "b"] },
    });

    group.pushItem("items", "c");
    assertEquals(group.value.items, ["a", "b", "c"]);
  });

  await t.step("should insert item at index", () => {
    const group = new FieldApi<{ items: string[] }>(null, "", {
      initialValue: { items: ["a", "b", "c"] },
    });

    group.insertItem("items", 1, "x");
    assertEquals(group.value.items, ["a", "x", "b", "c"]);
  });

  await t.step("should remove item at index", () => {
    const group = new FieldApi<{ items: string[] }>(null, "", {
      initialValue: { items: ["a", "b", "c"] },
    });

    group.removeItem("items", 1);
    assertEquals(group.value.items, ["a", "c"]);
  });

  await t.step("should swap items in array", () => {
    const group = new FieldApi<{ items: string[] }>(null, "", {
      initialValue: { items: ["a", "b", "c", "d"] },
    });

    group.swapItems("items", 1, 2);
    assertEquals(group.value.items, ["a", "c", "b", "d"]);
  });

  await t.step(
    "should keep registered fields in sync with their new index after swapping",
    () => {
      const group = new FieldApi<{ items: string[] }>(null, "", {
        initialValue: { items: ["a", "b", "c", "d"] },
      });

      const field1 = group.field("items.1");
      const field2 = group.field("items.2");

      group.swapItems("items", 1, 2);

      assertEquals(group.value.items, ["a", "c", "b", "d"]);
      // The field registered at each slot now reports that slot's actual
      // array value...
      assertEquals(group.field("items.1").value, "c");
      assertEquals(group.field("items.2").value, "b");
      // ...because field identity follows the item, not the slot: field1
      // ("b") relocated to items.2, field2 ("c") relocated to items.1, each
      // keeping its own original value.
      assertEquals(field1.value, "b");
      assertEquals(field1.name, "items.2");
      assertEquals(field2.value, "c");
      assertEquals(field2.name, "items.1");
    },
  );

  await t.step("should move item in array, shifting items in between", () => {
    const group = new FieldApi<{ items: string[] }>(null, "", {
      initialValue: { items: ["a", "b", "c", "d", "e"] },
    });

    group.moveItem("items", 1, 3);
    // Not a swap: "b" relocates to index 3, and "c"/"d" each shift down one
    // slot to close the gap left behind; "e" is untouched throughout.
    assertEquals(group.value.items, ["a", "c", "d", "b", "e"]);
  });

  await t.step("should move item backwards, shifting items in between", () => {
    const group = new FieldApi<{ items: string[] }>(null, "", {
      initialValue: { items: ["a", "b", "c", "d", "e"] },
    });

    group.moveItem("items", 3, 1);
    assertEquals(group.value.items, ["a", "d", "b", "c", "e"]);
  });

  await t.step(
    "should keep registered fields in sync with their new index after moving",
    () => {
      const group = new FieldApi<{ items: string[] }>(null, "", {
        initialValue: { items: ["a", "b", "c", "d", "e"] },
      });

      const movedField = group.field("items.1"); // "b"
      const shiftedField1 = group.field("items.2"); // "c"
      const shiftedField2 = group.field("items.3"); // "d"
      const untouchedField = group.field("items.4"); // "e"

      group.moveItem("items", 1, 3);

      assertEquals(group.value.items, ["a", "c", "d", "b", "e"]);
      assertEquals(movedField.value, "b");
      assertEquals(movedField.name, "items.3");
      assertEquals(shiftedField1.value, "c");
      assertEquals(shiftedField1.name, "items.1");
      assertEquals(shiftedField2.value, "d");
      assertEquals(shiftedField2.name, "items.2");
      assertEquals(untouchedField.value, "e");
      assertEquals(untouchedField.name, "items.4");
    },
  );

  await t.step("should keep each field's id stable across a swap", () => {
    const group = new FieldApi<{ items: string[] }>(null, "", {
      initialValue: { items: ["a", "b", "c", "d"] },
    });

    const field1 = group.field("items.1");
    const field2 = group.field("items.2");
    const id1 = field1.id;
    const id2 = field2.id;

    group.swapItems("items", 1, 2);

    // Same instances, so the same ids, even though their names swapped.
    assertEquals(group.field("items.1").id, id2);
    assertEquals(group.field("items.2").id, id1);
  });

  await t.step("should keep each field's id stable across a move", () => {
    const group = new FieldApi<{ items: string[] }>(null, "", {
      initialValue: { items: ["a", "b", "c", "d", "e"] },
    });

    const movedField = group.field("items.1"); // "b"
    const shiftedField = group.field("items.2"); // "c"

    group.moveItem("items", 1, 3);

    assertEquals(group.field("items.3").id, movedField.id);
    assertEquals(group.field("items.1").id, shiftedField.id);
  });

  await t.step(
    "should recompute invalid/touched/validating after removing the child that caused it",
    async () => {
      const group = new FieldApi<{ items: string[] }>(null, "", {
        initialValue: { items: ["a", "b"] },
      });

      const badField = group.field("items.1");
      badField.validators = [() => "Error"];
      await badField.validate(true); // Reassigning while idle doesn't auto-run.
      assertEquals(group.invalid, true);

      group.removeItem("items", 1);

      assertEquals(group.invalid, false);
    },
  );

  await t.step(
    "should not call onChildrenChanged when array items are only re-keyed (swap/move), since the set of fields is unchanged",
    () => {
      const group = new FieldApi<{ items: string[] }>(null, "", {
        initialValue: { items: ["a", "b", "c"] },
      });

      group.field("items.0");
      group.field("items.1");
      group.field("items.2");

      const callback = spy();
      group.onChildrenChanged(callback);

      group.swapItems("items", 0, 1);
      group.moveItem("items", 2, 0);

      assertSpyCalls(callback, 0);
    },
  );

  await t.step(
    "should destroy a flat-registered item field left out of bounds by a raw (non-helper) array shrink",
    () => {
      const group = new FieldApi<{ items: string[] }>(null, "", {
        initialValue: { items: ["a", "b", "c"] },
      });

      group.field("items.0");
      group.field("items.1");
      const last = group.field("items.2");
      const destroySpy = spy(last, kDestroy);

      // Bypasses `removeItem` entirely; nothing re-keys `#children` for this.
      group.value = { items: ["a", "b"] };

      assertSpyCalls(destroySpy, 1);
      assertEquals(group.children.has("items.2"), false);
    },
  );

  await t.step(
    "should destroy every nested child under a dropped array item, not just the item field itself",
    () => {
      const group = new FieldApi<{ items: { label: string }[] }>(
        null,
        "",
        { initialValue: { items: [{ label: "a" }, { label: "b" }] } },
      );

      const item1 = group.field("items.1");
      const label = item1.field("label");
      const destroySpy = spy(label, kDestroy);

      group.value = { items: [{ label: "a" }] };

      // `label` is destroyed as part of `item1`'s own recursive `_destroy()`;
      // `item1` itself is what `group` finds out of bounds and destroys.
      assertSpyCalls(destroySpy, 1);
      assertEquals(group.children.has("items.1"), false);
      assertEquals(item1.children.has("label"), false);
    },
  );

  await t.step(
    "should destroy an orphaned child of a self-addressed array, too",
    () => {
      const itemsField = new FieldApi<string[]>(null, "", {
        initialValue: ["a", "b"],
      });

      const last = itemsField.field("1");
      const destroySpy = spy(last, kDestroy);

      itemsField.value = ["a"];

      assertSpyCalls(destroySpy, 1);
      assertEquals(itemsField.children.has("1"), false);
    },
  );

  await t.step(
    "should keep registered fields in sync with their new index after swapping on a self-addressed array",
    () => {
      const itemsField = new FieldApi<string[]>(null, "", {
        initialValue: ["a", "b", "c", "d"],
      });

      const field1 = itemsField.field("1");
      const field2 = itemsField.field("2");

      itemsField.swapItems("", 1, 2);

      assertEquals(itemsField.value, ["a", "c", "b", "d"]);
      assertEquals(field1.value, "b");
      assertEquals(field1.name, "2");
      assertEquals(field2.value, "c");
      assertEquals(field2.name, "1");
    },
  );

  await t.step(
    "should keep registered fields in sync with their new index after moving on a self-addressed array",
    () => {
      const itemsField = new FieldApi<string[]>(null, "", {
        initialValue: ["a", "b", "c", "d", "e"],
      });

      const movedField = itemsField.field("1"); // "b"
      const shiftedField1 = itemsField.field("2"); // "c"
      const shiftedField2 = itemsField.field("3"); // "d"
      const untouchedField = itemsField.field("4"); // "e"

      itemsField.moveItem("", 1, 3);

      assertEquals(itemsField.value, ["a", "c", "d", "b", "e"]);
      assertEquals(movedField.value, "b");
      assertEquals(movedField.name, "3");
      assertEquals(shiftedField1.value, "c");
      assertEquals(shiftedField1.name, "1");
      assertEquals(shiftedField2.value, "d");
      assertEquals(shiftedField2.name, "2");
      assertEquals(untouchedField.value, "e");
      assertEquals(untouchedField.name, "4");
    },
  );

  await t.step(
    "should keep registered fields in sync with their new index after inserting on a self-addressed array",
    () => {
      const itemsField = new FieldApi<string[]>(null, "", {
        initialValue: ["a", "b", "c"],
      });

      const shiftedField = itemsField.field("1"); // "b"

      itemsField.insertItem("", 1, "x");

      assertEquals(itemsField.value, ["a", "x", "b", "c"]);
      assertEquals(shiftedField.value, "b");
      assertEquals(shiftedField.name, "2");
    },
  );

  await t.step(
    "should destroy the removed item's own field, not just an orphaned trailing one, on a self-addressed array",
    () => {
      const itemsField = new FieldApi<string[]>(null, "", {
        initialValue: ["a", "b", "c"],
      });

      const removed = itemsField.field("1"); // "b"
      const shiftedField = itemsField.field("2"); // "c"
      const destroySpy = spy(removed, kDestroy);

      itemsField.removeItem("", 1);

      assertEquals(itemsField.value, ["a", "c"]);
      assertSpyCalls(destroySpy, 1);
      assertEquals(shiftedField.value, "c");
      assertEquals(shiftedField.name, "1");
    },
  );

  await t.step(
    "should not destroy a surviving item field after a raw array shrink, and should resync its value",
    () => {
      const group = new FieldApi<{ items: string[] }>(null, "", {
        initialValue: { items: ["a", "b", "c"] },
      });

      const first = group.field("items.0");

      group.value = { items: ["x"] };

      assertEquals(group.children.has("items.0"), true);
      assertEquals(first.value, "x");
    },
  );

  await t.step(
    "should not destroy a child whose own value is legitimately undefined, as opposed to genuinely missing",
    () => {
      const group = new FieldApi<{ a?: string }>(null, "", {
        initialValue: { a: "x" },
      });

      const a = group.field("a");
      const destroySpy = spy(a, kDestroy);

      group.value = { a: undefined };

      assertSpyCalls(destroySpy, 0);
      assertEquals(group.children.has("a"), true);
      assertEquals(a.value, undefined);
    },
  );
});
