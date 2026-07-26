/**
 * This module defines the {@linkcode shallowEqual} function.
 * @module
 */

const { is, keys } = Object;

/**
 * Checks if {@linkcode a} and {@linkcode b} are shallowly equal.
 *
 * `Object.is`-equal outright, or both plain objects/arrays with exactly the
 * same set of keys/indices, each mapped to an `Object.is`-equal value.
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (is(a, b)) return true;

  if (a === null || b === null) return false;

  if (typeof a !== "object" || typeof b !== "object") return false;

  const aKeys = keys(a);
  const bKeys = keys(b);
  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) =>
    is(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    )
  );
}
