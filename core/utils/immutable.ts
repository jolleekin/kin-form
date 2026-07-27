/**
 * This module defines utility functions for working with immutable objects.
 * @module
 */

import type { DeepKeyOrRoot, DeepValue, Updater } from "../types.ts";
import { isArray, isDigit } from "./misc.ts";

/**
 * Splits a path string into an array of segments.
 *
 * Segments starting with a digit are parsed as numbers.
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
 * Splits `path` into its first segment and everything after it, dot
 * included (so `first + rest === path`). `rest` is `""` when `path` has
 * only one segment.
 *
 * Unlike {@linkcode splitPath}, this doesn't parse keys as numbers or split
 * the remainder any further, so a caller that only cares about the first
 * segment (and wants to pass the rest through as-is) avoids splitting into
 * every segment just to rejoin all but the first back together.
 *
 * @example
 * ```ts
 * splitFirstSegment("a.1.b") // ["a", ".1.b"]
 * splitFirstSegment("a") // ["a", ""]
 * ```
 */
export function splitFirstSegment(path: string): [first: string, rest: string] {
  const dot = path.indexOf(".");
  return dot === -1 ? [path, ""] : [path.slice(0, dot), path.slice(dot)];
}

/**
 * Immutably gets a value from an object at a given path.
 *
 * The resolved value itself may be `null`/`undefined` (e.g. an optional or
 * nullable field that hasn't been populated); that's a legitimate result.
 * Throws instead if a segment *before* the last one resolves to
 * `null`/`undefined`, since there's then no object left to read the next
 * segment from.
 */
export function getIn<T, TPath extends DeepKeyOrRoot<T>>(
  obj: T,
  path: TPath,
): DeepValue<T, TPath> {
  if (path === "") return obj as DeepValue<T, TPath>;

  const parts = splitPath(path as string);
  const n = parts.length;
  // deno-lint-ignore no-explicit-any
  let node: any = obj;
  for (let i = 0; i < n; i++) {
    if (node == null) {
      throw new Error(
        `getIn: cannot read "${parts[i]}" (from path "${path}") of ${node}`,
      );
    }
    node = node[parts[i]];
  }
  return node;
}

/**
 * Reports whether every segment of `path` actually exists in `obj`: an
 * object key that's genuinely present, or an array index within bounds,
 * as opposed to merely resolving to `undefined` via {@linkcode getIn} (a
 * legitimate value for an optional/nullable field). A missing segment
 * partway through means everything nested under it is gone too, so the
 * remaining segments are never even checked.
 */
export function existsIn<T, TPath extends DeepKeyOrRoot<T>>(
  obj: T,
  path: TPath,
): boolean {
  if (path === "") return true;

  // deno-lint-ignore no-explicit-any
  let node: any = obj;
  for (const part of splitPath(path as string)) {
    if (node === null || typeof node !== "object") return false;
    if (typeof part === "number") {
      if (!isArray(node) || part < 0 || part >= node.length) return false;
    } else if (!(part in node)) {
      return false;
    }
    node = node[part];
  }
  return true;
}

/**
 * Immutably sets a value in an object at a given path.
 */
export function setIn<T, TPath extends DeepKeyOrRoot<T>>(
  obj: T,
  path: TPath,
  value: DeepValue<T, TPath>,
): T {
  return updateIn(obj, path, () => value);
}

/**
 * Immutably updates a value in an object at a given path.
 */
export function updateIn<T, TPath extends DeepKeyOrRoot<T>>(
  obj: T,
  path: TPath,
  updater: Updater<DeepValue<T, TPath>>,
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
    node =
      node[part] =
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
 * Shallowly clones an object or array.
 */
export function clone<T>(o: T): T {
  return isArray(o) ? ([...o] as T) : ({ ...o } as T);
}

/**
 * Immutably appends `item` to the end of `array`.
 */
export function arrayPush<T>(array: readonly T[], item: T): T[] {
  return [...array, item];
}

/**
 * Immutably inserts `item` at `index` in `array`, shifting later items up.
 */
export function arrayInsert<T>(
  array: readonly T[],
  index: number,
  item: T,
): T[] {
  const a = array.slice();
  a.splice(index, 0, item);
  return a;
}

/**
 * Immutably removes the item at `index` from `array`, shifting later items
 * down.
 */
export function arrayRemove<T>(array: readonly T[], index: number): T[] {
  return array.filter((_, i) => i !== index);
}

/**
 * Immutably replaces the item at `index` in `array` with `newItem`.
 */
export function arrayReplace<T>(
  array: readonly T[],
  index: number,
  newItem: T,
): T[] {
  return array.map((item, i) => (i === index ? newItem : item));
}

/**
 * Immutably swaps the items at `indexA` and `indexB` in `array`, leaving
 * every item in between untouched. For a shift-based reorder (remove from
 * one slot, insert at another, shifting everything in between) see
 * {@linkcode arrayMove} instead.
 */
export function arraySwap<T>(
  array: readonly T[],
  indexA: number,
  indexB: number,
): T[] {
  const a = array.slice();
  const tmp = a[indexA];
  a[indexA] = a[indexB];
  a[indexB] = tmp;
  return a;
}

/**
 * Immutably moves the item at `fromIndex` to `toIndex` in `array`, shifting
 * every item strictly between the two indices one slot the other way to
 * close/open the gap, the same result as `Array#splice`-ing the item out
 * and back in elsewhere, unlike {@linkcode arraySwap}, which only touches the
 * two endpoints.
 */
export function arrayMove<T>(
  array: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const a = array.slice();
  const [item] = a.splice(fromIndex, 1);
  a.splice(toIndex, 0, item);
  return a;
}
