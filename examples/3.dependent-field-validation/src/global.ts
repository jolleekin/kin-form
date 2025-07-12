/**
 * This module augments the global interfaces {@linkcode HTMLElementEventMap}
 * and {@linkcode HTMLElementTagNameMap} with events and tag names defined in
 * this package.
 *
 * Due to [JSR's restrictions][1], this file is not exported. Application should
 * copy and import this file where these events and tag names are used.
 *
 * [1]: https://jsr.io/docs/about-slow-types#typescript-restrictions
 *
 * @module
 */

import type { KinFieldGroup } from "@kin/form/elements/kin-field-group.ts";
import type { KinField } from "@kin/form/elements/kin-field.ts";
// deno-lint-ignore no-unused-vars
import type { FormField } from "@kin/form/form-field.ts";

declare global {
  interface HTMLElementEventMap {
    /**
     * Fired by a {@linkcode FormField} when its
     * {@linkcode FormField.invalid invalid} or
     * {@linkcode FormField.validating validating} property has changed.
     */
    "status-changed": CustomEvent;
    /**
     * Fired by a {@linkcode FormField} when its
     * {@linkcode FormField.touched touched} property has changed.
     */
    "touched-changed": CustomEvent;
    /**
     * Fired by a {@linkcode FormField} when its
     * {@linkcode FormField.value value} property has changed.
     */
    "value-changed": CustomEvent;
  }

  interface HTMLElementTagNameMap {
    "kin-field-group": KinFieldGroup<unknown>;
    "kin-field": KinField<unknown>;
  }
}
