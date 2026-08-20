/**
 * A `ReactiveController` subscription to a `FieldApi`/`FormApi`, via
 * {@linkcode WatchController}, for a reusable component to subscribe its
 * whole `render()` without going through {@linkcode watch} (`./Watch.ts`).
 *
 * @module
 */

import type { ReactiveController, ReactiveControllerHost } from "lit";
import { shallowEqual } from "@kintools/form-core";
import type { FieldApi, FormApi } from "@kintools/form-core";
import { SelectSubscription } from "./_select-subscription.ts";

/**
 * Narrows a {@linkcode WatchController}/{@linkcode watch} subscription down
 * to a selected value (e.g. `f => f.value.length`) instead of triggering a
 * host update on every change to `api`.
 */
export type FieldSelector<TValue, TParentValue, TSelected> = (
  api: FieldApi<TValue, TParentValue>,
) => TSelected;

/** Like {@linkcode FieldSelector}, for a {@linkcode FormApi}. */
export type FormSelector<TValue, TSelected> = (
  api: FormApi<TValue>,
) => TSelected;

/**
 * Compares two selector results to decide whether a host update is needed.
 *
 * Defaults to a shallow equality check (own-enumerable-key comparison for a
 * plain object, index-by-index for an array, `Object.is` otherwise), so a
 * selector can return a fresh tuple/record literal on every call (e.g.
 * `f => [f.value, f.touched] as const`) without forcing an update on every
 * notify. Pass one of these to compare some other way, e.g. deep equality.
 */
export type EqualFn<TSelected> = (a: TSelected, b: TSelected) => boolean;

/**
 * Exposes the current value a {@linkcode WatchController} subscription
 * resolved to: `api` itself with no `select`, or the selected value.
 */
export interface WatchController<TSelected> {
  readonly value: TSelected;
}

/**
 * Subscribes `host` to `api` (or, if `api` is a function, to whatever it
 * currently returns, re-checked on every host update so a reassigned `.api`
 * property is picked up without the caller having to do anything).
 *
 * With no `select`, calls `host.requestUpdate()` on any change and
 * `value` reads back `api` itself. With `select`
 * ({@linkcode FieldSelector}/{@linkcode FormSelector}), only requests an
 * update when the selected value changes (compared via `equal`, see
 * {@linkcode EqualFn}), and `value` reads back that selected value instead.
 *
 * The `useWatch` equivalent for a reusable Lit component that wants its own
 * `render()` to update on `api` changes, without wrapping its whole output
 * in {@linkcode watch} (`./Watch.ts`):
 *
 * @example
 * ```ts
 * class MyTextField extends LitElement {
 *   @property({ attribute: false })
 *   accessor api!: FieldApi<string, unknown>;
 *
 *   #watch = new WatchController(this, () => this.api);
 *
 *   override render() {
 *     const field = this.#watch.value;
 *     return html`
 *       <input
 *         .value=${field.value}
 *         @blur=${field.handleBlur}
 *         @input=${(e: InputEvent) =>
 *           field.handleChange((e.target as HTMLInputElement).value)}
 *       >
 *     `;
 *   }
 * }
 * ```
 */
// A construct-signature interface rather than one generic constructor with a
// `select` type conditional on the argument, for the same reason `useWatch`
// (react/) is: that shape needs a shared upper bound like `FieldApi<any,
// any>` to constrain a single type parameter, but `any`/`unknown` for
// `FieldApi`'s own type arguments isn't actually assignable from a concrete
// instance (the mismatch surfaces through `validators`/`handleChange`
// contravariance). A real class's own constructor overloads can't work
// around this either: they can only bind the class's type parameter to
// something that appears directly in the matched overload's params, and the
// no-`select` overloads' `value` is the api itself, not a `TSelected` derived
// from one, so nothing to unify against. `WatchController` is declared
// against this interface instead and `WatchControllerImpl` is cast into
// place below.
interface WatchControllerCtor {
  new <TValue>(
    host: ReactiveControllerHost,
    api: FormApi<TValue> | (() => FormApi<TValue>),
  ): WatchController<FormApi<TValue>>;
  new <TValue, TParentValue>(
    host: ReactiveControllerHost,
    api:
      | FieldApi<TValue, TParentValue>
      | (() => FieldApi<TValue, TParentValue>),
  ): WatchController<FieldApi<TValue, TParentValue>>;
  new <TValue, TSelected>(
    host: ReactiveControllerHost,
    api: FormApi<TValue> | (() => FormApi<TValue>),
    select: FormSelector<TValue, TSelected>,
    equal?: EqualFn<TSelected>,
  ): WatchController<TSelected>;
  new <TValue, TParentValue, TSelected>(
    host: ReactiveControllerHost,
    api:
      | FieldApi<TValue, TParentValue>
      | (() => FieldApi<TValue, TParentValue>),
    select: FieldSelector<TValue, TParentValue, TSelected>,
    equal?: EqualFn<TSelected>,
  ): WatchController<TSelected>;
}

class WatchControllerImpl
  implements ReactiveController, WatchController<unknown> {
  get value(): unknown {
    return this.#subscription.value;
  }

  readonly #subscription: SelectSubscription;

  constructor(
    host: ReactiveControllerHost,
    // Loosely typed on purpose, for the same reason `useWatch`'s
    // implementation is: no precise shared type here is actually
    // satisfiable, and this constructor is only ever reached, with a precise
    // type, via the four `WatchControllerCtor` signatures above.
    // deno-lint-ignore no-explicit-any
    api: any,
    // deno-lint-ignore no-explicit-any
    select?: (api: any) => unknown,
    equal: EqualFn<unknown> = shallowEqual,
  ) {
    this.#subscription = new SelectSubscription(() => host.requestUpdate());
    this.#subscription.configure(
      typeof api === "function" ? api : () => api,
      select,
      equal,
    );
    host.addController(this);
  }

  hostConnected(): void {
    this.#subscription.sync();
  }

  hostUpdate(): void {
    this.#subscription.sync();
  }

  hostDisconnected(): void {
    this.#subscription.unsubscribe();
  }
}

export const WatchController =
  WatchControllerImpl as unknown as WatchControllerCtor;
