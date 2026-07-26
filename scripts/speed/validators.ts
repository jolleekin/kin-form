/**
 * Shared validation rules for the speed benchmark's validation scenarios —
 * one sync rule, one artificially slow async rule, and one whole-form zod
 * schema, reused identically across every library's harness so the
 * validation *cost* being measured is the same in every case.
 */

import { z } from "zod";
import { ARRAY_ITEM_COUNT, FLAT_FIELD_NAMES } from "./scenario.ts";

/** Mimics `required` + `minLength(2)`'s cost for the sync-validation scenario. */
export function syncValidate(value: string): string | null {
  if (!value) return "Required";
  if (value.length < 2) return "Too short";
  return null;
}

/**
 * An artificially slow async validator, for the debounce scenario — counts
 * how many times it actually ran and timestamps the most recent settle, so a
 * caller can measure "time to settle" as `lastSettledAt() - start` after
 * waiting a generous (but otherwise irrelevant) buffer, rather than that
 * buffer itself leaking into the measured number.
 */
export function makeAsyncValidate(delayMs: number): {
  validate: (value: string) => Promise<string | null>;
  callCount: () => number;
  lastSettledAt: () => number;
} {
  let calls = 0;
  let lastSettledAt = 0;
  return {
    validate: async (value: string) => {
      calls++;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      lastSettledAt = performance.now();
      return value ? null : "Required";
    },
    callCount: () => calls,
    lastSettledAt: () => lastSettledAt,
  };
}

/**
 * A classic `setTimeout`-based trailing debounce — the hand-rolled wrapper a
 * React Hook Form or Formik user reaches for since neither has a built-in
 * per-field debounce option (see `docs/comparison/react-hook-form.md`'s
 * `lodash/debounce` example). Used to give those two libraries' debounce
 * scenario a realistic number instead of only their raw, undebounced one.
 */
export function debounce<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  delayMs: number,
): (...args: TArgs) => Promise<TResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: TArgs) =>
    new Promise<TResult>((resolve, reject) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn(...args).then(resolve, reject);
      }, delayMs);
    });
}

const arrayItemSchema = z.object({
  id: z.string(),
  code: z.string().min(1, "Required"),
  qty: z.number().min(0),
  note: z.string(),
});

export const wholeFormSchema = z.object({
  fields: z.object(
    Object.fromEntries(
      FLAT_FIELD_NAMES.map((name) => [name, z.string().min(1, "Required")]),
    ),
  ),
  address: z.object({
    line1: z.string().min(1, "Required"),
    line2: z.string(),
    geo: z.object({ lat: z.string(), lng: z.string() }),
  }),
  items: z.array(arrayItemSchema).length(ARRAY_ITEM_COUNT),
});

/**
 * Turns a flat list of dotted-path issues (zod's native `issue.path`, or a
 * Standard Schema issue's `path`) into the nested per-field error object
 * React Hook Form's `Resolver` and Formik's `validate` function both expect —
 * `makeLeaf` controls the leaf shape, since RHF wants `{ type, message }` and
 * Formik just wants the message string.
 */
export function issuesToNestedErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
  makeLeaf: (message: string) => unknown,
): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const issue of issues) {
    let node = root;
    const path = issue.path;
    for (let i = 0; i < path.length - 1; i++) {
      const key = String(path[i]);
      node = (node[key] ??= {}) as Record<string, unknown>;
    }
    const lastKey = String(path[path.length - 1] ?? "_root");
    node[lastKey] = makeLeaf(issue.message);
  }
  return root;
}
