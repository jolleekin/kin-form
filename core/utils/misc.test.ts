import { assertEquals } from "@std/assert";
import {
  identityFn,
  isArray,
  isDigit,
  isNullOrEmpty,
  makeArray,
} from "./misc.ts";

Deno.test("identityFn", async (t) => {
  await t.step("should return the input as is", () => {
    assertEquals(identityFn(42), 42);
    assertEquals(identityFn("test"), "test");
    assertEquals(identityFn(true), true);
    assertEquals(identityFn(null), null);
    assertEquals(identityFn(undefined), undefined);
  });

  await t.step("should work with objects", () => {
    const obj = { a: 1 };
    assertEquals(identityFn(obj), obj);
  });

  await t.step("should work with arrays", () => {
    const arr = [1, 2, 3];
    assertEquals(identityFn(arr), arr);
  });
});

Deno.test("isDigit", async (t) => {
  await t.step("should identify digit character codes", () => {
    assertEquals(isDigit("0".charCodeAt(0)), true);
    assertEquals(isDigit("5".charCodeAt(0)), true);
    assertEquals(isDigit("9".charCodeAt(0)), true);
  });

  await t.step("should reject non-digit character codes", () => {
    assertEquals(isDigit("a".charCodeAt(0)), false);
    assertEquals(isDigit("z".charCodeAt(0)), false);
    assertEquals(isDigit(" ".charCodeAt(0)), false);
    assertEquals(isDigit(".".charCodeAt(0)), false);
  });

  await t.step("should use ASCII ranges", () => {
    // 0 = 48, 9 = 57
    assertEquals(isDigit(48), true); // 0
    assertEquals(isDigit(57), true); // 9
    assertEquals(isDigit(47), false); // /
    assertEquals(isDigit(58), false); // :
  });
});

Deno.test("isNullOrEmpty", async (t) => {
  await t.step("should return true for null", () => {
    assertEquals(isNullOrEmpty(null), true);
  });

  await t.step("should return true for undefined", () => {
    assertEquals(isNullOrEmpty(undefined), true);
  });

  await t.step("should return true for empty string", () => {
    assertEquals(isNullOrEmpty(""), true);
  });

  await t.step("should return true for empty array", () => {
    assertEquals(isNullOrEmpty([]), true);
  });

  await t.step("should return false for non-empty string", () => {
    assertEquals(isNullOrEmpty("test"), false);
  });

  await t.step("should return false for non-empty array", () => {
    assertEquals(isNullOrEmpty([1, 2, 3]), false);
  });

  await t.step("should return false for zero", () => {
    assertEquals(isNullOrEmpty(0), false);
  });

  await t.step("should return false for false", () => {
    assertEquals(isNullOrEmpty(false), false);
  });

  await t.step("should return false for objects", () => {
    assertEquals(isNullOrEmpty({}), false);
    assertEquals(isNullOrEmpty({ length: 0 }), true);
  });
});

Deno.test("isArray", async (t) => {
  await t.step("should identify arrays", () => {
    assertEquals(isArray([]), true);
    assertEquals(isArray([1, 2, 3]), true);
    assertEquals(isArray(["a", "b"]), true);
  });

  await t.step("should reject non-arrays", () => {
    assertEquals(isArray({}), false);
    assertEquals(isArray("test"), false);
    assertEquals(isArray(123), false);
    assertEquals(isArray(null), false);
    assertEquals(isArray(undefined), false);
  });

  await t.step("should use Array.isArray", () => {
    assertEquals(isArray, Array.isArray);
  });
});

Deno.test("makeArray", async (t) => {
  await t.step("should return array as is", () => {
    const arr = [1, 2, 3];
    assertEquals(makeArray(arr), arr);
  });

  await t.step("should wrap single value in array", () => {
    assertEquals(makeArray(42), [42]);
    assertEquals(makeArray("test"), ["test"]);
    assertEquals(makeArray(true), [true]);
  });

  await t.step("should return empty array for undefined", () => {
    assertEquals(makeArray(undefined), []);
  });

  await t.step("should handle null", () => {
    assertEquals(makeArray(null), [null]);
  });

  await t.step("should handle objects", () => {
    const obj = { a: 1 };
    assertEquals(makeArray(obj), [obj]);
  });

  await t.step("should handle zero", () => {
    assertEquals(makeArray(0), [0]);
  });

  await t.step("should handle false", () => {
    assertEquals(makeArray(false), [false]);
  });

  await t.step("should handle empty string", () => {
    assertEquals(makeArray(""), [""]);
  });
});
