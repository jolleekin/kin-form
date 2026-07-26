/**
 * This module defines the {@linkcode deepEqual} function.
 * @module
 */

import { isArray } from "./misc.ts";

const { keys } = Object;
const objectValueOf = Object.prototype.valueOf;
const objectToString = Object.prototype.toString;

/**
 * Checks if {@linkcode a} and {@linkcode b} are deeply equal.
 *
 * This function handles the following cases
 * - Primitives (using {@linkcode Object.is})
 * - Arrays
 * - Objects with custom `valueOf` (e.g. Date)
 * - Objects with custom `toString` (e.g. RegExp, URL)
 * - Plain objects
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (
    a !== null &&
    b !== null &&
    typeof a === "object" &&
    typeof b === "object"
  ) {
    if (a.constructor !== b.constructor) return false;

    if (isArray(a)) {
      const n = a.length;
      if (n !== (b as Array<unknown>).length) return false;
      for (let i = 0; i < n; ++i) {
        if (!deepEqual(a[i], (b as Array<unknown>)[i])) return false;
      }
      return true;
    }

    if (a.valueOf !== objectValueOf) {
      return a.valueOf() === b.valueOf();
    }

    if (a.toString !== objectToString) {
      return a.toString() === b.toString();
    }

    // Two objects.
    const aKeys = keys(a) as Array<keyof typeof a>;
    const n = aKeys.length;
    if (n !== keys(b).length) return false;
    for (let i = 0; i < n; ++i) {
      const key = aKeys[i];
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}
