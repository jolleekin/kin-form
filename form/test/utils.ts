import { FieldGroup as _FieldGroup } from "../field-group.ts";
import { FormController as _FormController } from "../form-controller.ts";
import type { FormField as _FormField } from "../form-field.ts";
import type { DeepKey, DeepValue } from "../types.ts";

class FormField<TValue, TParentValue> {
  name: DeepKey<TParentValue>;
  error: string | null;
  invalid: boolean;
  touched: boolean;
  validating: boolean;
  value: TValue;

  constructor(field: _FormField<TValue, TParentValue>) {
    this.name = field.name;
    this.error = field.error;
    this.invalid = field.invalid;
    this.touched = field.touched;
    this.validating = field.validating;
    this.value = field.value;
  }
}

class FieldCollection<TValue, TParentValue> extends FormField<
  TValue,
  TParentValue
> {
  fields: Map<string, FormField<DeepValue<TValue, DeepKey<TValue>>, TValue>>;

  constructor(field: _FieldGroup<TValue, TParentValue>) {
    super(field);

    const fields = new Map();
    for (const [name, child] of field.fields) {
      fields.set(name, getFieldState(child));
    }
    this.fields = fields;
  }
}

class FormController<TValue> extends FieldCollection<TValue, never> {
  dirty: boolean;

  constructor(field: _FormController<TValue>) {
    super(field);
    this.dirty = field.dirty;
  }
}

export function getFieldState<TValue, TParentValue>(
  field: _FormField<TValue, TParentValue>
) {
  // Use named classes instead of plain objects
  return field instanceof _FormController
    ? new FormController(field)
    : field instanceof _FieldGroup
    ? new FieldCollection(field)
    : new FormField(field);
}
