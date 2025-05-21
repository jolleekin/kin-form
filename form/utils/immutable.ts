/**
 * This module defines utility functions for working with immutable objects.
 * @module
 */

import type { DeepKey, DeepValue, Updater } from "../types.ts";
import { isDigit } from "./misc.ts";

/**
 * Splits a path string into an array of keys.
 *
 * Keys starting with a digit are parsed as numbers.
 *
 * @example
 * ```ts
 * splitPath("a.1.b") // ["a", 1, "b"]
 * ```
 */
export function splitPath(path: string): Array<string | number> {
  return path
    .split(".")
    .map((p) => (isDigit(p.charCodeAt(0)) ? parseInt(p) : p));
}

/**
 * Immutably gets a value from an object at a given path.
 *
 * Returns {@linkcode defaultValue} if the path is not found or the value is
 * `undefined`.
 */
export function getIn<T, TPath extends DeepKey<T>>(
  obj: T,
  path: TPath,
  defaultValue?: DeepValue<T, TPath>
): DeepValue<T, TPath> {
  if (path === "") return obj as DeepValue<T, TPath>;

  const parts = splitPath(path as string);
  const n = parts.length;
  let i = 0;
  // deno-lint-ignore no-explicit-any
  let node: any = obj;
  while (node && i < n) {
    node = node[parts[i++]];
  }
  return node !== undefined ? node : defaultValue!;
}

/**
 * Immutably sets a value in an object at a given path.
 */
export function setIn<T, TPath extends DeepKey<T>>(
  obj: T,
  path: TPath,
  value: DeepValue<T, TPath>
): T {
  return updateIn(obj, path, () => value);
}

/**
 * Immutably updates a value in an object at a given path.
 */
export function updateIn<T, TPath extends DeepKey<T>>(
  obj: T,
  path: TPath,
  updater: Updater<DeepValue<T, TPath>>
): T {
  if (path === "") return updater(obj as DeepValue<T, TPath>) as T;

  obj = clone(obj);

  // deno-lint-ignore no-explicit-any
  let node: any = obj;
  const parts = splitPath(path as string);
  const n_1 = parts.length - 1;
  const lastPart = parts[n_1];
  for (let i = 0; i < n_1; ++i) {
    const part = parts[i];
    node = node[part] =
      part in node
        ? clone(node[part])
        : typeof parts[i + 1] === "number"
        ? []
        : {};
  }
  node[lastPart] = updater(node[lastPart]);
  return obj;
}

/**
 * Shalowly clones an object or array.
 */
export function clone<T>(o: T): T {
  return Array.isArray(o) ? ([...o] as T) : ({ ...o } as T);
}
