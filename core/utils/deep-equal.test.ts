import { assertEquals } from "@std/assert";
import { deepEqual } from "./deep-equal.ts";

Deno.test("deepEqual", async (t) => {
  await t.step("should return true for identical primitives", () => {
    assertEquals(deepEqual(1, 1), true);
    assertEquals(deepEqual("test", "test"), true);
    assertEquals(deepEqual(true, true), true);
  });

  await t.step("should return false for different primitives", () => {
    assertEquals(deepEqual(1, 2), false);
    assertEquals(deepEqual("test", "other"), false);
    assertEquals(deepEqual(true, false), false);
  });

  await t.step("should handle null and undefined", () => {
    assertEquals(deepEqual(null, null), true);
    assertEquals(deepEqual(undefined, undefined), true);
    assertEquals(deepEqual(null, undefined), false);
  });

  await t.step("should compare arrays", () => {
    assertEquals(deepEqual([1, 2, 3], [1, 2, 3]), true);
    assertEquals(deepEqual([1, 2, 3], [1, 2, 4]), false);
    assertEquals(deepEqual([1, 2], [1, 2, 3]), false);
  });

  await t.step("should compare nested arrays", () => {
    assertEquals(
      deepEqual(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 2],
          [3, 4],
        ],
      ),
      true,
    );
    assertEquals(
      deepEqual(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 2],
          [3, 5],
        ],
      ),
      false,
    );
  });

  await t.step("should compare plain objects", () => {
    assertEquals(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
    assertEquals(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 }), false);
  });

  await t.step("should compare nested objects", () => {
    const obj1 = { a: { b: { c: 1 } } };
    const obj2 = { a: { b: { c: 1 } } };
    const obj3 = { a: { b: { c: 2 } } };

    assertEquals(deepEqual(obj1, obj2), true);
    assertEquals(deepEqual(obj1, obj3), false);
  });

  await t.step("should handle Date objects", () => {
    const date1 = new Date("2024-01-01");
    const date2 = new Date("2024-01-01");
    const date3 = new Date("2024-01-02");

    assertEquals(deepEqual(date1, date2), true);
    assertEquals(deepEqual(date1, date3), false);
  });

  await t.step("should handle RegExp objects", () => {
    const regex1 = /test/gi;
    const regex2 = /test/gi;
    const regex3 = /other/gi;

    assertEquals(deepEqual(regex1, regex2), true);
    assertEquals(deepEqual(regex1, regex3), false);
  });

  await t.step("should handle URL objects", () => {
    const url1 = new URL("https://example.com");
    const url2 = new URL("https://example.com");
    const url3 = new URL("https://other.com");

    assertEquals(deepEqual(url1, url2), true);
    assertEquals(deepEqual(url1, url3), false);
  });

  await t.step("should handle different constructor types", () => {
    assertEquals(deepEqual([], {}), false);
    assertEquals(deepEqual(new Date(), {}), false);
  });

  await t.step("should handle arrays with objects", () => {
    const arr1 = [{ a: 1 }, { b: 2 }];
    const arr2 = [{ a: 1 }, { b: 2 }];
    const arr3 = [{ a: 1 }, { b: 3 }];

    assertEquals(deepEqual(arr1, arr2), true);
    assertEquals(deepEqual(arr1, arr3), false);
  });

  await t.step("should handle objects with arrays", () => {
    const obj1 = { a: [1, 2], b: [3, 4] };
    const obj2 = { a: [1, 2], b: [3, 4] };
    const obj3 = { a: [1, 2], b: [3, 5] };

    assertEquals(deepEqual(obj1, obj2), true);
    assertEquals(deepEqual(obj1, obj3), false);
  });

  await t.step("should handle empty arrays and objects", () => {
    assertEquals(deepEqual([], []), true);
    assertEquals(deepEqual({}, {}), true);
  });

  await t.step("should use Object.is for primitives", () => {
    assertEquals(deepEqual(NaN, NaN), true);
    assertEquals(deepEqual(0, -0), false);
    assertEquals(deepEqual("", ""), true);
  });

  await t.step("should handle complex nested structures", () => {
    const obj1 = {
      a: [1, 2, { b: 3 }],
      c: { d: new Date("2024-01-01"), e: /test/i },
    };
    const obj2 = {
      a: [1, 2, { b: 3 }],
      c: { d: new Date("2024-01-01"), e: /test/i },
    };
    const obj3 = {
      a: [1, 2, { b: 4 }],
      c: { d: new Date("2024-01-01"), e: /test/i },
    };

    assertEquals(deepEqual(obj1, obj2), true);
    assertEquals(deepEqual(obj1, obj3), false);
  });

  await t.step("should handle sparse arrays", () => {
    const arr1 = [1, , 3];
    const arr2 = [1, , 3];
    const arr3 = [1, undefined, 3];

    assertEquals(deepEqual(arr1, arr2), true);
    assertEquals(deepEqual(arr1, arr3), true);
  });
});
