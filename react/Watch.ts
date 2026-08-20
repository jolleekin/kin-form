/**
 * A `useWatch`-in-render-prop-form component, via {@linkcode Watch}.
 *
 * @module
 */

import type { ReactNode } from "react";
import type { FieldApi, FormApi } from "@kintools/form-core";
import {
  type EqualFn as EqualFn,
  type FieldSelector,
  type FormSelector,
  useWatch,
} from "./useWatch.ts";

/** Props for the plain `Watch` overload on a {@linkcode FormApi}. */
export type WatchFormProps<TValue> = {
  api: FormApi<TValue>;
  select?: undefined;
  children: (form: FormApi<TValue>) => ReactNode;
};

/** Props for the plain `Watch` overload on a {@linkcode FieldApi}. */
export type WatchFieldProps<TValue, TParentValue> = {
  api: FieldApi<TValue, TParentValue>;
  select?: undefined;
  children: (field: FieldApi<TValue, TParentValue>) => ReactNode;
};

/**
 * Selector variant of {@linkcode WatchFormProps}: `select` narrows the
 * subscription down to a selected value (e.g. `f => f.value.length`) instead
 * of re-rendering on every change, and `children`'s second argument receives
 * that selected value.
 */
export type WatchFormSelectProps<TValue, TSelected> = {
  api: FormApi<TValue>;
  select: FormSelector<TValue, TSelected>;
  equal?: EqualFn<TSelected>;
  children: (form: FormApi<TValue>, selected: TSelected) => ReactNode;
};

/** Selector variant of {@linkcode WatchFieldProps}; see {@linkcode WatchFormSelectProps}. */
export type WatchFieldSelectProps<TValue, TParentValue, TSelected> = {
  api: FieldApi<TValue, TParentValue>;
  select: FieldSelector<TValue, TParentValue, TSelected>;
  equal?: EqualFn<TSelected>;
  children: (
    field: FieldApi<TValue, TParentValue>,
    selected: TSelected,
  ) => ReactNode;
};

/**
 * A helper component that subscribes to a `FieldApi`/`FormApi`, without
 * writing a custom component around `useWatch`.
 *
 * Calls `useWatch(api, select, equal)` and renders `children` with `api` as
 * the first argument, always, so `children` can read/act on the api itself
 * the way `array.map((item, i) => ...)` callbacks can always reach `item`
 * even when they only care about `i`. `api` is resolved beforehand,
 * typically via `parent.field(name, options)`, which applies `options` to an
 * already-registered field the same way on every call, so it's safe to call
 * inline in JSX on every render:
 *
 * @example
 * ```tsx
 * <Watch api={form.field("email", { validators: [required()] })}>
 *   {(field) => (
 *     <input value={field.value} onChange={(e) => field.handleChange(e.target.value)} />
 *   )}
 * </Watch>
 * ```
 *
 * With `select` ({@linkcode FieldSelector}/{@linkcode FormSelector}), the
 * subscription narrows to a selected value instead of re-rendering on every
 * change, and `children` receives that selected value as its second
 * argument:
 *
 * ```tsx
 * <Watch api={itemsField} select={(f) => f.value.length}>
 *   {(_field, count) => <span>{count} items</span>}
 * </Watch>
 * ```
 */
// Overloaded rather than one generic component with a `select` type
// conditional on `TApi`, for the same reason `useWatch` is (see its comment
// in useWatch.ts): the shared bound needed for a single type parameter
// isn't actually satisfiable here.
export function Watch<TValue>(props: WatchFormProps<TValue>): ReactNode;
export function Watch<TValue, TParentValue>(
  props: WatchFieldProps<TValue, TParentValue>,
): ReactNode;
export function Watch<TValue, TSelected>(
  props: WatchFormSelectProps<TValue, TSelected>,
): ReactNode;
export function Watch<TValue, TParentValue, TSelected>(
  props: WatchFieldSelectProps<TValue, TParentValue, TSelected>,
): ReactNode;
export function Watch(
  // `unknown` rather than one of the four overloads' prop types, for the same
  // reason `useWatch`'s implementation is: no precise shared type here is
  // actually satisfiable, and this body is only ever reached via the four
  // overloads above. The cast just below picks a loosely-typed stand-in
  // shape (`select` optional, `children` taking an optional second
  // argument) to destructure through: `api`, `select`, `equal`, and
  // `children` are only ever passed straight through to
  // `useWatch`/`children(...)`, never inspected, so which of the four actual
  // shapes gets asserted doesn't matter here.
  props: unknown,
): ReactNode {
  const { api, select, equal, children } = props as {
    // deno-lint-ignore no-explicit-any
    api: any;
    // deno-lint-ignore no-explicit-any
    select?: (api: any) => unknown;
    equal?: EqualFn<unknown>;
    children: (api: unknown, selected?: unknown) => ReactNode;
  };
  // deno-lint-ignore no-explicit-any
  const selected = useWatch(api, select as any, equal);
  return select ? children(api, selected) : children(api);
}
