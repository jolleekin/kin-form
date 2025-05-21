/**
 * This module defines the generic `<kin-field-group>` custom element.
 * @module
 */

import { property } from "lit/decorators.js";
import { __decorate } from "tslib";

import { FieldGroup } from "../field-group.ts";

/**
 * A generic field group element that accepts a custom {@linkcode template}
 * function.
 *
 * Mainly used in one-off situations to group a bunch of form fields, allowing
 * adding validators to the group.
 *
 * For reusable field groups, consider extending {@linkcode FieldGroup} instead.
 *
 * @example
 * ```ts
 * interface Model {
 *   name: string;
 *   age: number | null;
 * }
 *
 * html`
 * <kin-field-group
 *   .template=${(group: KinFieldGroup<Model>) => html`
 *     <text-field ${group.field('name')}></text-field>
 *     <number-field ${group.field('age')}></number-field>
 *   `}
 * ></kin-field-group>
 * `
 * ```
 */
// @customElement("kin-field-group")
export class KinFieldGroup<TValue, TParentValue = never> extends FieldGroup<
  TValue,
  TParentValue
> {
  /**
   * The function that renders the content for this field group.
   */
  // @property({ attribute: false })
  declare template: ((field: this) => unknown) | null;

  constructor() {
    super();
    this.template = null;
  }

  protected override render(): unknown {
    return this.template?.(this);
  }
}

__decorate(
  [property({ attribute: false })],
  KinFieldGroup.prototype,
  "template"
);

customElements.define("kin-field-group", KinFieldGroup);
