import { assertEquals } from "@std/assert";
import { shallowEqual } from "./shallow-equal.ts";

Deno.test("shallowEqual", async (t) => {
  await t.step("should return true for two nulls", () => {
    assertEquals(shallowEqual(null, null), true);
  });

  await t.step("should return true for the same reference", () => {
    const a = { x: "1" };
    assertEquals(shallowEqual(a, a), true);
  });

  await t.step("should return false when only one side is null", () => {
    assertEquals(shallowEqual(null, { x: "1" }), false);
    assertEquals(shallowEqual({ x: "1" }, null), false);
  });

  await t.step(
    "should return true for different references with the same keys/values",
    () => {
      assertEquals(
        shallowEqual({ x: "1", y: "2" }, { x: "1", y: "2" }),
        true,
      );
    },
  );

  await t.step("should return false when a value differs", () => {
    assertEquals(
      shallowEqual({ x: "1", y: "2" }, { x: "1", y: "3" }),
      false,
    );
  });

  await t.step("should return false when the key counts differ", () => {
    assertEquals(
      shallowEqual({ x: "1" }, { x: "1", y: "2" }),
      false,
    );
  });

  await t.step(
    "should return false when key sets differ but counts match",
    () => {
      assertEquals(shallowEqual({ x: "1" }, { y: "1" }), false);
    },
  );

  await t.step("should return true for equal primitives", () => {
    assertEquals(shallowEqual("a", "a"), true);
    assertEquals(shallowEqual(1, 1), true);
    assertEquals(shallowEqual(NaN, NaN), true);
  });

  await t.step("should return false for unequal primitives", () => {
    assertEquals(shallowEqual("a", "b"), false);
    assertEquals(shallowEqual(1, 2), false);
  });

  await t.step(
    "should return false when one side is a primitive and the other an object",
    () => {
      assertEquals(shallowEqual("a", { a: "a" }), false);
    },
  );

  await t.step(
    "should return true for different array references with the same items",
    () => {
      assertEquals(shallowEqual([1, "a"], [1, "a"]), true);
    },
  );

  await t.step("should return false when an array item differs", () => {
    assertEquals(shallowEqual([1, "a"], [1, "b"]), false);
  });

  await t.step("should return false when array lengths differ", () => {
    assertEquals(shallowEqual([1], [1, 2]), false);
  });
});
