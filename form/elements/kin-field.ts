/**
 * This module defines the generic `<kin-field>` custom element.
 * @module
 */

import { property } from "lit/decorators.js";
import { __decorate } from "tslib";

import { FormField } from "../form-field.ts";

/**
 * A generic form field element that accepts a custom {@linkcode template}
 * function.
 *
 * Mainly used in one-off situations.
 *
 * For reusable form fields, extend {@linkcode FormField} instead.
 *
 * @example
 * // The backslash is used to work around a JSDoc issue.
 * ```ts
 * html`
 *   <kin-field
 *     .template=${(f: KinField<string>) => html`
 *       <input
 *         .value=${f.value}
 *         \@blur=${f.handleBlur}
 *         \@change=${f.handleChange} />
 *     `}
 *   ></kin-field
 * `
 *
 * html`
 *   <kin-field
 *     .template=${(f: KinField<Date | null>) => html`
 *       <input
 *         type="date"
 *         .valueAsDate=${f.value}
 *         \@blur=${f.handleBlur}
 *         \@change=${(evt) => f.handleChange(evt, evt.target.valueAsDate)} />
 *     `}
 *   ></kin-field
 * `
 * ```
 */
// @customElement("kin-field")
export class KinField<TValue, TParentValue = never> extends FormField<
  TValue,
  TParentValue
> {
  /**
   * The function that renders the content for this field.
   */
  // @property({ attribute: false })
  declare template: ((field: this) => unknown) | null;

  constructor() {
    super();
    this.template = null;
  }

  /**
   * The `change` event listener.
   *
   * This event listener sets {@linkcode value} to {@linkcode valueOverride} if
   * provided. Otherwise, it will set {@linkcode value} to
   * `event.currentTarget.value`.
   *
   * This event listner is bound to the field instance.
   * @bound
   */
  readonly handleChange = (event: Event, valueOverride?: TValue): void => {
    this.value =
      valueOverride ??
      (event.currentTarget as unknown as { value: TValue }).value;
  };

  protected override render(): unknown {
    return this.template?.(this);
  }
}

__decorate([property({ attribute: false })], KinField.prototype, "template");

customElements.define("kin-field", KinField);
