/**
 * `useSyncExternalStore`-based subscription to a `FieldApi`,
 * shared by `useForm`/`Watch`.
 *
 * @module
 */

import { useRef, useSyncExternalStore } from "react";
import { shallowEqual } from "@kin-form/core";
import type { FieldApi, FormApi } from "@kin-form/core";

/**
 * Narrows a {@linkcode useWatch} subscription down to a selected value (e.g.
 * `f => f.value.length`) instead of re-rendering on every change to `api`.
 */
export type FieldSelector<TValue, TParentValue, TSelected> = (
  api: FieldApi<TValue, TParentValue>,
) => TSelected;

/** Like {@linkcode FieldSelector}, for a {@linkcode FormApi}. */
export type FormSelector<TValue, TSelected> = (
  api: FormApi<TValue>,
) => TSelected;

/**
 * Compares two selector results to decide whether a re-render is needed.
 *
 * Defaults to a shallow equality check (own-enumerable-key comparison for a
 * plain object, index-by-index for an array, `Object.is` otherwise), so a
 * selector can return a fresh tuple/record literal on every call (e.g.
 * `f => [f.value, f.touched] as const`) without forcing a re-render on every
 * notify. Pass one of these to compare some other way, e.g. deep equality.
 */
export type EqualFn<TSelected> = (a: TSelected, b: TSelected) => boolean;

/**
 * Subscribes the calling component to {@linkcode api} via
 * `useSyncExternalStore`.
 *
 * With no `select`, re-renders on any change (matching `api.getVersion`'s
 * coarse snapshot) and returns `api` itself. With `select`
 * ({@linkcode FieldSelector}/{@linkcode FormSelector}), only re-renders when
 * the selected value changes (compared via `equal`, see
 * {@linkcode EqualFn}) and returns that selected value instead of `api`.
 *
 * `getSnapshot` doubles as `getServerSnapshot`: both just read `api`
 * synchronously (no browser-only API involved), so this renders on the
 * server without React's "Missing getServerSnapshot" warning.
 *
 * Public so consumers can build their own low-level components subscribed to
 * a `FieldApi`/`FormApi` (e.g. a shared `TextField`, or an `ActionButtons`
 * reading `dirty`/`submitting`); `useForm` deliberately doesn't subscribe by
 * itself, to avoid re-rendering the whole form on every keystroke.
 */
// Overloaded rather than one generic function with a `select` type
// conditional on the argument, since that shape needs a shared upper bound
// like `FieldApi<any, any>` to constrain the single type parameter, but
// `any`/`unknown` for `FieldApi`'s own type arguments isn't actually
// assignable from a concrete instance (the mismatch surfaces through
// `validators`/`handleChange` contravariance). Overloads dodge this because
// each signature is checked independently against the concrete argument.
export function useWatch<TValue>(
  api: FormApi<TValue>,
  select?: never,
): FormApi<TValue>;
export function useWatch<TValue, TParentValue>(
  api: FieldApi<TValue, TParentValue>,
  select?: never,
): FieldApi<TValue, TParentValue>;
export function useWatch<TValue, TSelected>(
  api: FormApi<TValue>,
  select: FormSelector<TValue, TSelected>,
  equal?: EqualFn<TSelected>,
): TSelected;
export function useWatch<TValue, TParentValue, TSelected>(
  api: FieldApi<TValue, TParentValue>,
  select: FieldSelector<TValue, TParentValue, TSelected>,
  equal?: EqualFn<TSelected>,
): TSelected;
export function useWatch(
  // Loosely typed on purpose, for the same reason `Watch`'s implementation
  // is: no precise shared type here is actually satisfiable, and this body
  // is only ever reached via the four overloads above.
  // deno-lint-ignore no-explicit-any
  api: any,
  // deno-lint-ignore no-explicit-any
  select?: (api: any) => unknown,
  equal: EqualFn<unknown> = shallowEqual,
): unknown {
  const selectedRef = useRef<unknown | undefined>(undefined);

  const getSnapshot: () => unknown | number = select
    ? () => {
      const next = select(api);
      const prev = selectedRef.current;
      if (prev !== undefined && equal(prev, next)) return prev;

      selectedRef.current = next;
      return next;
    }
    : api.getVersion;

  const selected = useSyncExternalStore(
    api.subscribe,
    getSnapshot,
    getSnapshot,
  );

  return select ? selected : api;
}
