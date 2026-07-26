/**
 * This module defines miscellaneous utility functions.
 * @module
 */

/**
 * Returns the input {@linkcode x} as is.
 */
export function identityFn<T>(x: T): T {
  return x;
}

/**
 * Checks if {@linkcode charCode} is a digit.
 */
export function isDigit(charCode: number): boolean {
  return charCode >= 48 && charCode < 58;
}

/**
 * Checks if {@linkcode x} is `null`, `undefined`, or an empty string or array.
 */
export function isNullOrEmpty(x: unknown): boolean {
  return x == null || (x as { length: number }).length === 0;
}

/** Alias of `Array.isArray`. */
export const isArray: (x: unknown) => x is unknown[] = Array.isArray;

/** Normalizes {@linkcode x} to an array: passes an array through, wraps a single value, and turns `undefined` into `[]`. */
export function makeArray<T>(x: T[] | T | undefined): T[] {
  return isArray(x) ? x : x !== undefined ? [x] : [];
}
