// Package-internal: the subscribe/select/equal/cache algorithm shared by
// `WatchControllerImpl` (WatchController.ts) and `WatchDirective` (Watch.ts),
// via `SelectSubscription`. Not exported from index.ts.

import { shallowEqual } from "@kin-form/core";
import type { EqualFn } from "./WatchController.ts";

/**
 * Tracks whichever api `getApi()` currently returns, re-subscribing when it
 * changes, and (with `select`) caches the selected value, recomputing it on
 * notify and calling `onChange` only when it actually differs (per `equal`).
 *
 * `getApi`/`select`/`equal` are refreshed via {@linkcode configure} rather
 * than fixed at construction, since `WatchDirective` gets fresh closures for
 * all three on every `render()` call but must keep reusing the same
 * subscription underneath (to avoid re-subscribing just because the closures
 * are new references).
 */
export class SelectSubscription {
  // deno-lint-ignore no-explicit-any
  get api(): any {
    this.sync();
    return this.#api;
  }

  get selected(): unknown {
    this.sync();
    if (!this.#selectedComputed) this.#recomputeSelected();
    return this.#selected;
  }

  get value(): unknown {
    return this.#select ? this.selected : this.api;
  }

  get hasSelect(): boolean {
    return this.#select !== undefined;
  }

  // deno-lint-ignore no-explicit-any
  #getApi?: () => any;
  #select?: (api: unknown) => unknown;
  #equal: EqualFn<unknown> = shallowEqual;
  readonly #onChange: VoidFunction;

  // deno-lint-ignore no-explicit-any
  #api?: any;
  #unsubscribe?: VoidFunction;
  #selectedComputed = false;
  #selected: unknown;

  constructor(onChange: VoidFunction) {
    this.#onChange = onChange;
  }

  configure(
    // deno-lint-ignore no-explicit-any
    getApi: () => any,
    select: ((api: unknown) => unknown) | undefined,
    equal: EqualFn<unknown>,
  ): void {
    this.#getApi = getApi;
    this.#select = select;
    this.#equal = equal;
  }

  // Re-subscribes if `#getApi()` now returns a different instance than the
  // one last subscribed to (e.g. a reassigned `.api` property), and
  // recomputes the selected value, if any, for the new instance. A no-op
  // otherwise, so it's safe to call redundantly from every lifecycle/render
  // entry point.
  sync(): void {
    const api = this.#getApi!();
    if (api === this.#api) return;

    this.#unsubscribe?.();
    this.#api = api;
    this.#selectedComputed = false;
    if (this.#select) this.#recomputeSelected();

    this.#unsubscribe = api.subscribe(() => {
      if (this.#select && !this.#recomputeSelected()) return;
      this.#onChange();
    });
  }

  // Also forgets the subscribed-to api (not just the subscription itself),
  // so a later `sync()` (e.g. from `AsyncDirective.reconnected`) always
  // re-subscribes and recomputes rather than seeing an unchanged api and
  // no-opping.
  unsubscribe(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    this.#api = undefined;
  }

  // Recomputes `#selected` from the current `#api`. Returns whether it
  // changed (per `#equal`), so `sync`'s notify callback knows whether to
  // call `#onChange`.
  #recomputeSelected(): boolean {
    const next = this.#select!(this.#api);
    if (this.#selectedComputed && this.#equal(this.#selected, next)) {
      return false;
    }

    this.#selectedComputed = true;
    this.#selected = next;
    return true;
  }
}
