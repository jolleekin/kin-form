/**
 * This modules defines the utility function {@linkcode getFieldState},
 * which extracts the states of a form field and its descendants for display by
 * an `<ix-object-inspector>`.
 * @module
 */

import { FieldGroup as FieldGroup } from "@kin/form/field-group.ts";
import { FormController as FormController } from "@kin/form/form-controller.ts";
import { FormField as FormField } from "@kin/form/form-field.ts";
import { DeepKey, DeepValue } from "@kin/form/types.ts";

class FormFieldState<TValue, TParentValue> {
  disabled: boolean;
  error: string | null;
  invalid: boolean;
  name: DeepKey<TParentValue>;
  touched: boolean;
  validating: boolean;
  value: TValue;

  constructor(field: FormField<TValue, TParentValue>) {
    this.disabled = field.disabled;
    this.error = field.error;
    this.invalid = field.invalid;
    this.name = field.name;
    this.touched = field.touched;
    this.validating = field.validating;
    this.value = field.value;
  }
}

class FieldGroupState<TValue, TParentValue> extends FormFieldState<
  TValue,
  TParentValue
> {
  fields: Map<
    string,
    FormFieldState<DeepValue<TValue, DeepKey<TValue>>, TValue>
  >;

  constructor(field: FieldGroup<TValue, TParentValue>) {
    super(field);

    const fields = new Map();
    for (const [name, child] of field.fields) {
      fields.set(name, getFieldState(child));
    }
    this.fields = fields;
  }
}

class FormControllerState<TValue> extends FieldGroupState<TValue, never> {
  dirty: boolean;

  constructor(field: FormController<TValue>) {
    super(field);
    this.dirty = field.dirty;
  }
}

/**
 * Extracts the states of a form field and its descendants for display by an
 * `<ix-object-inspector>`.
 */
export function getFieldState<TValue, TParentValue>(
  field: FormField<TValue, TParentValue>
):
  | FormFieldState<TValue, TParentValue>
  | FieldGroupState<TValue, TParentValue>
  | FormControllerState<TValue> {
  // Use named classes instead of plain objects to aid object inspection.
  return field instanceof FormController
    ? new FormControllerState<TValue>(field)
    : field instanceof FieldGroup
    ? new FieldGroupState<TValue, TParentValue>(field)
    : new FormFieldState<TValue, TParentValue>(field);
}
