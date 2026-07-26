import {
  assertEquals,
  assertNotStrictEquals,
  assertStrictEquals,
  assertThrows,
} from "@std/assert";
import {
  arrayInsert,
  arrayMove,
  arrayPush,
  arrayRemove,
  arrayReplace,
  arraySwap,
  existsIn,
  getIn,
  setIn,
  splitFirstSegment,
  splitPath,
  updateIn,
} from "./immutable.ts";

Deno.test("splitPath", async (t) => {
  await t.step("should split simple path", () => {
    assertEquals(splitPath("a.b.c"), ["a", "b", "c"]);
  });

  await t.step("should parse numeric keys", () => {
    assertEquals(splitPath("a.0.b"), ["a", 0, "b"]);
    assertEquals(splitPath("0.1.2"), [0, 1, 2]);
  });

  await t.step("should handle single key", () => {
    assertEquals(splitPath("a"), ["a"]);
  });

  await t.step("should handle empty path", () => {
    assertEquals(splitPath(""), [""]);
  });

  await t.step("should handle numeric strings", () => {
    assertEquals(splitPath("123"), [123]);
    assertEquals(splitPath("a.456.b"), ["a", 456, "b"]);
  });
});

Deno.test("splitFirstSegment", async (t) => {
  await t.step(
    "should split off the first segment, keeping the dot on rest",
    () => {
      assertEquals(splitFirstSegment("a.1.b"), ["a", ".1.b"]);
    },
  );

  await t.step("should return an empty rest for a single segment", () => {
    assertEquals(splitFirstSegment("a"), ["a", ""]);
  });

  await t.step("should return an empty rest for the empty path", () => {
    assertEquals(splitFirstSegment(""), ["", ""]);
  });

  await t.step("should round-trip back to the original path", () => {
    const [first, rest] = splitFirstSegment("items.1.label");
    assertEquals(first + rest, "items.1.label");
  });
});

Deno.test("getIn", async (t) => {
  await t.step("should get value from object", () => {
    const obj = { a: { b: { c: 42 } } };
    assertEquals(getIn(obj, "a.b.c"), 42);
  });

  await t.step("should get value from array", () => {
    const obj = { items: [1, 2, 3] };
    assertEquals(getIn(obj, "items.1"), 2);
  });

  await t.step("should handle empty path", () => {
    const obj = { a: 1 };
    assertEquals(getIn(obj, ""), obj);
  });

  await t.step("should return undefined for a missing optional leaf", () => {
    const obj: { a: { b?: number } } = { a: {} };
    assertEquals(getIn(obj, "a.b"), undefined);
  });

  await t.step("should return a single missing optional segment", () => {
    const obj: { a?: number } = { a: undefined };
    assertEquals(getIn(obj, "a"), undefined);
  });

  await t.step(
    "should throw when an intermediate segment is undefined",
    () => {
      const obj: { a?: { b?: { c: number } } } = { a: undefined };
      assertThrows(() => getIn(obj, "a.b.c"));
    },
  );

  await t.step("should throw when an intermediate segment is null", () => {
    const obj: { a: { b: number } | null } = { a: null };
    assertThrows(() => getIn(obj, "a.b"));
  });

  await t.step("should get nested array values", () => {
    const obj = {
      data: [
        [1, 2],
        [3, 4],
      ],
    };
    assertEquals(getIn(obj, "data.0.1"), 2);
  });
});

Deno.test("existsIn", async (t) => {
  await t.step("should return true for a present object key", () => {
    const obj = { a: { b: 1 } };
    assertEquals(existsIn(obj, "a.b"), true);
  });

  await t.step("should return true for an in-bounds array index", () => {
    const obj = { items: [1, 2, 3] };
    assertEquals(existsIn(obj, "items.1"), true);
  });

  await t.step("should return true for the empty path", () => {
    assertEquals(existsIn({ a: 1 }, ""), true);
  });

  await t.step(
    "should return true for a key genuinely present but set to undefined",
    () => {
      const obj: { a?: number } = { a: undefined };
      assertEquals(existsIn(obj, "a"), true);
    },
  );

  await t.step("should return false for a missing object key", () => {
    const obj: { a: { b?: number } } = { a: {} };
    assertEquals(existsIn(obj, "a.b"), false);
  });

  await t.step("should return false for an out-of-bounds array index", () => {
    const obj = { items: [1, 2] };
    assertEquals(existsIn(obj, "items.2"), false);
  });

  await t.step(
    "should return false for a negative array index",
    () => {
      const obj = { items: [1, 2] };
      assertEquals(existsIn(obj, "items.-1" as never), false);
    },
  );

  await t.step(
    "should return false for everything nested under a missing intermediate segment",
    () => {
      const obj: { a?: { b: { c: number } } } = {};
      assertEquals(existsIn(obj, "a.b.c"), false);
    },
  );

  await t.step(
    "should return false when an intermediate segment is null",
    () => {
      const obj: { a: { b: number } | null } = { a: null };
      assertEquals(existsIn(obj, "a.b"), false);
    },
  );
});

Deno.test("setIn", async (t) => {
  await t.step("should set value in object", () => {
    const obj = { a: { b: 1 } };
    const result = setIn(obj, "a.b", 42);

    assertEquals(result, { a: { b: 42 } });
    assertEquals(obj, { a: { b: 1 } }); // Original unchanged
  });

  await t.step("should set array value", () => {
    const obj = { items: [1, 2, 3] };
    const result = setIn(obj, "items.1", 99);

    assertEquals(result, { items: [1, 99, 3] });
  });

  await t.step("should handle empty path", () => {
    const obj = { a: 1 };
    const result = setIn(obj, "", { a: 2 });

    assertEquals(result, { a: 2 });
  });

  await t.step("should preserve other properties", () => {
    const obj = { a: 1, b: { c: 2, d: 3 } };
    const result = setIn(obj, "b.c", 99);

    assertEquals(result, { a: 1, b: { c: 99, d: 3 } });
  });

  await t.step("should handle deep nested structures", () => {
    const obj = {
      level1: { level2: { level3: { value: 1 } } },
    };
    const result = setIn(obj, "level1.level2.level3.value", 42);

    assertEquals(result, {
      level1: { level2: { level3: { value: 42 } } },
    });
  });
});

Deno.test("updateIn", async (t) => {
  await t.step("should update value with function", () => {
    const obj = { a: { b: 5 } };
    const result = updateIn(obj, "a.b", (v) => v * 2);

    assertEquals(result, { a: { b: 10 } });
    assertEquals(obj, { a: { b: 5 } }); // Original unchanged
  });

  await t.step("should update array values", () => {
    const obj = { items: [1, 2, 3] };
    const result = updateIn(obj, "items.1", (v) => v + 10);

    assertEquals(result, { items: [1, 12, 3] });
  });

  await t.step("should handle empty path", () => {
    const obj = { a: 1 };
    const result = updateIn(obj, "", (v) => ({ ...v, b: 2 }));

    assertEquals(result as { a: number; b: number }, { a: 1, b: 2 });
  });

  await t.step("should receive current value to updater", () => {
    const obj = { a: [1, 2, 3] };
    const result = updateIn(obj, "a", (arr) => [...arr, 4]);

    assertEquals(result, { a: [1, 2, 3, 4] });
  });

  await t.step("should preserve other properties", () => {
    const obj = { a: 1, b: { c: 2, d: 3 } };
    const result = updateIn(obj, "b.c", (v) => v * 10);

    assertEquals(result, { a: 1, b: { c: 20, d: 3 } });
  });

  await t.step("should work with complex types", () => {
    const obj = { data: [{ id: 1, name: "John" }] };
    const result = updateIn(obj, "data.0.name", (n) => n.toUpperCase());

    assertEquals(result, {
      data: [{ id: 1, name: "JOHN" }],
    });
  });

  await t.step("should handle nested updates", () => {
    const obj = {
      users: [
        { id: 1, scores: [10, 20] },
        { id: 2, scores: [30, 40] },
      ],
    };
    const result = updateIn(obj, "users.1.scores.0", (v) => v + 5);

    assertEquals(result, {
      users: [
        { id: 1, scores: [10, 20] },
        { id: 2, scores: [35, 40] },
      ],
    });
  });
});

Deno.test("immutability", async (t) => {
  await t.step("setIn should not mutate original object", () => {
    const obj = { a: { b: 1 } };
    const original = JSON.parse(JSON.stringify(obj));

    setIn(obj, "a.b", 42);

    assertEquals(obj, original);
  });

  await t.step("updateIn should not mutate original object", () => {
    const obj = { a: { b: 1 } };
    const original = JSON.parse(JSON.stringify(obj));

    updateIn(obj, "a.b", (v) => v * 2);

    assertEquals(obj, original);
  });

  await t.step("should create new object references", () => {
    const obj = { a: { b: 1 } };
    const result = setIn(obj, "a.b", 2);

    assertNotStrictEquals(result, obj);
    assertNotStrictEquals(result.a, obj.a);
  });

  await t.step("should preserve unchanged branches", () => {
    const obj = { a: { b: 1 }, c: { d: 2 } };
    const result = setIn(obj, "a.b", 99);

    assertStrictEquals(result.c, obj.c);
  });
});

Deno.test("arrayPush", async (t) => {
  await t.step("should append the item to the end", () => {
    const a = ["a", "b"];
    assertEquals(arrayPush(a, "c"), ["a", "b", "c"]);
    assertEquals(a, ["a", "b"]); // Original unchanged
  });
});

Deno.test("arrayInsert", async (t) => {
  await t.step("should insert the item at the given index", () => {
    const a = ["a", "b", "c"];
    assertEquals(arrayInsert(a, 1, "x"), ["a", "x", "b", "c"]);
    assertEquals(a, ["a", "b", "c"]); // Original unchanged
  });

  await t.step("should insert at the end when index is the length", () => {
    assertEquals(arrayInsert(["a", "b"], 2, "c"), ["a", "b", "c"]);
  });
});

Deno.test("arrayRemove", async (t) => {
  await t.step("should remove the item at the given index", () => {
    const a = ["a", "b", "c"];
    assertEquals(arrayRemove(a, 1), ["a", "c"]);
    assertEquals(a, ["a", "b", "c"]); // Original unchanged
  });
});

Deno.test("arrayReplace", async (t) => {
  await t.step("should replace the item at the given index", () => {
    const a = ["a", "b", "c"];
    assertEquals(arrayReplace(a, 1, "x"), ["a", "x", "c"]);
    assertEquals(a, ["a", "b", "c"]); // Original unchanged
  });
});

Deno.test("arraySwap", async (t) => {
  await t.step("should swap the two indices, leaving others untouched", () => {
    const a = ["a", "b", "c", "d"];
    assertEquals(arraySwap(a, 1, 2), ["a", "c", "b", "d"]);
    assertEquals(a, ["a", "b", "c", "d"]); // Original unchanged
  });
});

Deno.test("arrayMove", async (t) => {
  await t.step(
    "should move the item forward, shifting items in between down",
    () => {
      const a = ["a", "b", "c", "d", "e"];
      assertEquals(arrayMove(a, 1, 3), ["a", "c", "d", "b", "e"]);
      assertEquals(a, ["a", "b", "c", "d", "e"]); // Original unchanged
    },
  );

  await t.step(
    "should move the item backward, shifting items in between up",
    () => {
      assertEquals(
        arrayMove(["a", "b", "c", "d", "e"], 3, 1),
        ["a", "d", "b", "c", "e"],
      );
    },
  );
});
