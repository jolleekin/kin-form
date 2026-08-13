/**
 * A `watch`-directive form of {@linkcode WatchController}, via
 * {@linkcode watch}, for one-off subscriptions inline in a template.
 *
 * @module
 */

import {
  AsyncDirective,
  directive,
  type DirectiveResult,
  type PartInfo,
  PartType,
} from "lit/async-directive.js";
import { shallowEqual } from "@kin-form/core";
import type { FieldApi, FormApi } from "@kin-form/core";
import { SelectSubscription } from "./_select-subscription.ts";
import type {
  EqualFn,
  FieldSelector,
  FormSelector,
} from "./WatchController.ts";

/**
 * Subscribes the containing part to `api`, re-rendering just that part (not
 * the whole host) on every change, via `render` (e.g. `(field) => html\`...\`\`).
 *
 * With `select` ({@linkcode FieldSelector}/{@linkcode FormSelector}), the
 * subscription narrows to a selected value instead of updating on every
 * change, and `render`'s second argument receives that selected value
 * (compared via `equal`, see {@linkcode EqualFn}):
 *
 * @example
 * ```ts
 * html`
 *   ${watch(
 *     form.field("email", { validators: [required()] }),
 *     (field) => html`
 *       <input
 *         .value=${field.value}
 *         @blur=${field.handleBlur}
 *         @input=${(e: InputEvent) =>
 *           field.handleChange((e.target as HTMLInputElement).value)}
 *       >
 *     `,
 *   )}
 *
 *   ${watch(
 *     itemsField,
 *     (f) => f.value.length,
 *     (_field, count) => html`<span>${count} items</span>`
 *   )}
 * `
 * ```
 *
 * `api` is typically resolved inline, via `parent.field(name, options)`,
 * which applies `options` to an already-registered field the same way on
 * every call, so it's safe to call inline in a template on every render.
 *
 * Only valid in child (content) position, not as an attribute/property
 * binding.
 */
// A call-signature interface rather than one generic function with a
// `select` type conditional on the argument, for the same reason
// `WatchController` is (see its comment in WatchController.ts): the shared
// bound needed for a single type parameter isn't actually satisfiable here.
// `directive()` types its result off `WatchDirective#render`'s own (loosely
// typed) signature, so `watch` is declared against this interface instead
// and cast into place below, rather than wrapping `directive(WatchDirective)`
// in a second forwarding function just to get the precise overloads.
interface WatchFn {
  <TValue>(
    api: FormApi<TValue>,
    render: (form: FormApi<TValue>) => unknown,
  ): DirectiveResult<typeof WatchDirective>;
  <TValue, TParentValue>(
    api: FieldApi<TValue, TParentValue>,
    render: (field: FieldApi<TValue, TParentValue>) => unknown,
  ): DirectiveResult<typeof WatchDirective>;
  <TValue, TSelected>(
    api: FormApi<TValue>,
    select: FormSelector<TValue, TSelected>,
    render: (form: FormApi<TValue>, selected: TSelected) => unknown,
    equal?: EqualFn<TSelected>,
  ): DirectiveResult<typeof WatchDirective>;
  <TValue, TParentValue, TSelected>(
    api: FieldApi<TValue, TParentValue>,
    select: FieldSelector<TValue, TParentValue, TSelected>,
    render: (
      field: FieldApi<TValue, TParentValue>,
      selected: TSelected,
    ) => unknown,
    equal?: EqualFn<TSelected>,
  ): DirectiveResult<typeof WatchDirective>;
}

class WatchDirective extends AsyncDirective {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD) {
      throw new Error("`watch` only supports child (content) bindings.");
    }
  }

  render(
    // deno-lint-ignore no-explicit-any
    api: any,
    // deno-lint-ignore no-explicit-any
    selectOrRender: (api: any) => unknown,
    // deno-lint-ignore no-explicit-any
    maybeRender?: (api: any, selected: unknown) => unknown,
    maybeEqual?: EqualFn<unknown>,
  ): unknown {
    this.#render = maybeRender ?? selectOrRender;
    const select = maybeRender ? selectOrRender : undefined;

    this.#subscription.configure(() => api, select, maybeEqual ?? shallowEqual);
    this.#subscription.sync();
    return this.#renderCurrent();
  }

  protected override disconnected(): void {
    this.#subscription.unsubscribe();
  }

  protected override reconnected(): void {
    this.#subscription.sync();
    this.setValue(this.#renderCurrent());
  }

  readonly #subscription = new SelectSubscription(() => {
    if (this.isConnected) this.setValue(this.#renderCurrent());
  });
  // deno-lint-ignore no-explicit-any
  #render!: (api: any, selected?: unknown) => unknown;

  #renderCurrent(): unknown {
    return this.#subscription.hasSelect
      ? this.#render(this.#subscription.api, this.#subscription.selected)
      : this.#render(this.#subscription.api);
  }
}

export const watch = directive(WatchDirective) as WatchFn;
