/**
 * This module defines the base class {@linkcode FieldGroup} and related types.
 * @module
 */

import { noChange } from "lit";
import {
  directive,
  Directive,
  type DirectiveParameters,
  type DirectiveResult,
  type ElementPart,
  type PartInfo,
  PartType,
} from "lit/async-directive.js";

import { FormField } from "./form-field.ts";
import type { DeepKey, DeepValue } from "./types.ts";
import { getIn, setIn, updateIn } from "./utils/immutable.ts";

export interface FieldOptions<
  TParentValue,
  TName extends DeepKey<TParentValue>
> {
  /**
   * Names of the form fields within the same group that depend on this field.
   *
   * Dependents can be set directly on a form field without type safety through
   * the {@linkcode FormField.dependents} property. This option enables type safety.
   */
  dependents?: DeepKey<TParentValue>[];
  /**
   * The default value for this field.
   *
   * Used when the value for this field is missing from the
   * {@linkcode FieldGroup.value}.
   */
  defaultValue?: DeepValue<TParentValue, TName>;
}

/**
 * A form field that manages a group of child form fields.
 *
 * This class also contains an array API for manipulating arrays.
 */
export abstract class FieldGroup<
  TValue,
  TParentValue = never
> extends FormField<TValue, TParentValue> {
  /**
   * Child fields managed by this field group.
   */
  get fields(): ReadonlyMap<
    DeepKey<TValue>,
    FormField<DeepValue<TValue, DeepKey<TValue>>, TValue>
  > {
    return this.#fields;
  }

  /**
   * Whether the field group itself or any child {@linkcode fields} has been
   * touched by the user.
   *
   * Setting this property will affect all child fields.
   */
  override get touched(): boolean {
    return super.touched || this.#anyChildTouched;
  }
  override set touched(v: boolean) {
    super.touched = v;
    for (const f of this.#fields.values()) {
      f.touched = v;
    }
  }

  /**
   * Whether the field group itself or any child {@linkcode fields} is invalid.
   */
  override get invalid(): boolean {
    return super.invalid || this.#anyChildInvalid;
  }

  /**
   * Whether the field group itself or any child {@linkcode fields} is being
   * validated.
   *
   * Application should not set this property.
   */
  override get validating(): boolean {
    return super.validating || this.#anyChildValidating;
  }

  readonly #fields = new Map<
    DeepKey<TValue>,
    FormField<DeepValue<TValue, DeepKey<TValue>>, TValue>
  >();

  #anyChildInvalid = false;
  #anyChildTouched = false;
  #anyChildValidating = false;

  /**
   * A directive that registers a child {@linkcode FormField} with this
   * {@linkcode FieldGroup}.
   *
   * The directive will set the following properties on the child field
   * - {@linkcode dependents} (if provided)
   * - {@linkcode disabled}
   * - {@linkcode name}
   * - {@linkcode FormField.parent parent}
   * - {@linkcode value}
   *
   * To override {@linkcode disabled} or {@linkcode value}, set them after this
   * directive.
   *
   * @param options.defaultValue The value to use in case the value for
   * the form field is missing from {@link FieldGroup.value}.
   * @param options.dependents Names of the form fields that depend on this field.
   *
   * @bound
   */
  readonly field = <TName extends DeepKey<TValue>>(
    name: TName,
    options?: FieldOptions<TValue, TName>
  ): DirectiveResult<typeof FieldDirective> => {
    return fieldDirective(this as never, name as never, options as never);
  };

  /**
   * The `blur` event listener.
   *
   * This listener should not be added to any child field since a child field
   * always notifies its parent when its {@linkcode touched} has changed.
   *
   * This listener may be added to any other focusable element within the field
   * group that will mark the field group as touched when that focusable element
   * loses focus.
   */
  override readonly handleBlur = (_event: FocusEvent): void => {
    // Only mark self as touched.
    super.touched = true;
  };

  //#region Array API

  /**
   * Inserts an item into an array at a specific index.
   * @param name The deep key pointing to the array.
   * @param index The index at which to insert the new value.
   * @param item The item to insert.
   */
  insertItem<TName extends DeepKey<TValue>>(
    name: TName,
    index: DeepValue<TValue, TName> extends Array<unknown> | null
      ? number
      : never,
    item: DeepValue<TValue, TName> extends Array<infer E> ? E : never
  ): void {
    this.#updateArrayPath(name, (array) => {
      array = array.slice();
      array.splice(index, 0, item);
      return array;
    });
  }

  /**
   * Moves an item in an array.
   * @param name The deep key pointing to the array.
   * @param fromIndex The index of the item to move.
   * @param toIndex The index to move the item to.
   */
  moveItem<TName extends DeepKey<TValue>>(
    name: TName,
    fromIndex: DeepValue<TValue, TName> extends Array<unknown> | null
      ? number
      : never,
    toIndex: DeepValue<TValue, TName> extends Array<unknown> | null
      ? number
      : never
  ): void {
    this.#updateArrayPath(name, (array) => {
      array = array.slice();
      array.splice(toIndex, 0, ...array.splice(fromIndex, 1));
      return array;
    });
  }

  /**
   * Appends an item to an array.
   * @param name The deep key pointing to the array.
   * @param item The value to append.
   */
  pushItem<TName extends DeepKey<TValue>>(
    name: TName,
    item: DeepValue<TValue, TName> extends Array<infer E> | null ? E : never
  ): void {
    this.#updateArrayPath(name, (array) => [...array, item as never]);
  }

  /**
   * Removes an item at a specific index from an array.
   * @param name The deep key pointing to the array.
   * @param index The index of the item to remove.
   */
  removeItem<TName extends DeepKey<TValue>>(
    name: TName,
    index: DeepValue<TValue, TName> extends Array<unknown> ? number : never
  ): void {
    this.#updateArrayPath(name, (array) => array.filter((_, i) => i !== index));
  }

  replaceItem<TName extends DeepKey<TValue>>(
    name: TName,
    index: DeepValue<TValue, TName> extends Array<unknown> ? number : never,
    newItem: DeepValue<TValue, TName> extends Array<infer E> ? E : never
  ): void {
    this.#updateArrayPath(name, (array) =>
      array.map((item, i) => (i !== index ? item : newItem))
    );
  }

  #updateArrayPath<TName extends DeepKey<TValue>>(
    name: TName,
    // deno-lint-ignore no-explicit-any
    updater: (old: any[]) => any[]
  ): void {
    this.value = updateIn(this.value, name, updater as never);
  }

  //#endregion

  //#region Internal child API.

  /**
   * Called synchronously by a child {@linkcode FormField} when its
   * {@linkcode FormField.invalid invalid} property has changed.
   *
   * Internal use only.
   */
  _childInvalidChanged<TChildValue>(
    child: FormField<TChildValue, TValue>
  ): void {
    const oldInvalid = this.invalid;

    this.#anyChildInvalid = child.invalid || this.#anyChild((f) => f.invalid);

    if (this.invalid !== oldInvalid) this.invalidChanged();
  }

  /**
   * Called synchronously by a child {@linkcode FormField} when its
   * {@linkcode FormField.touched touched} property has changed.
   *
   * Internal use only.
   */
  _childTouchedChanged<TChildValue>(
    child: FormField<TChildValue, TValue>
  ): void {
    const oldTouched = this.touched;

    this.#anyChildTouched = child.touched || this.#anyChild((f) => f.touched);

    if (this.touched !== oldTouched) this.touchedChanged();
  }

  /**
   * Called synchronously by a child {@linkcode FormField} when its
   * {@linkcode FormField.validating validating} property has changed.
   *
   * Internal use only.
   */
  _childValidatingChanged<TChildValue>(
    child: FormField<TChildValue, TValue>
  ): void {
    const oldValidating = this.validating;

    this.#anyChildValidating =
      child.validating || this.#anyChild((f) => f.validating);

    if (this.validating !== oldValidating) this.validatingChanged();
  }

  /**
   * Called synchronously by a child {@linkcode FormField} when its
   * {@linkcode FormField.value value} property has changed.
   *
   * Internal use only.
   */
  _childValueChanged<TChildValue>(child: FormField<TChildValue, TValue>): void {
    this.value = setIn(
      this.value,
      child.name as DeepKey<TValue>,
      child.value as never
    );

    this.#validateDependents(child);
  }

  /**
   * Called by a {@linkcode FormField} to register itself with this field
   * group.
   *
   * Internal use only.
   */
  _registerChild<TChildValue>(child: FormField<TChildValue, TValue>): void {
    this.#fields.set(child.name as DeepKey<TValue>, child as never);
    this.#validateDependents(child);
  }

  /**
   * Called by a {@linkcode FormField} to unregister itself from this field
   * group.
   *
   * Internal use only.
   */
  _unregisterChild<TChildValue>(child: FormField<TChildValue, TValue>): void {
    this.#fields.delete(child.name);
  }

  //#endregion

  #anyChild(
    predicate: <TChildValue>(child: FormField<TChildValue, TValue>) => boolean
  ): boolean {
    for (const child of this.#fields.values()) {
      if (predicate(child)) return true;
    }
    return false;
  }

  #validateDependents<TChildValue>(
    child: FormField<TChildValue, TValue>
  ): void {
    for (const dependent of child.dependents) {
      this.#fields.get(dependent as DeepKey<TValue>)?.validate();
    }
  }
}

class FieldDirective<
  TParentValue,
  TName extends DeepKey<TParentValue>
> extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error("The `field` directive must be used as an element part.");
    }
  }

  override render(
    _form: FieldGroup<TParentValue>,
    _name: TName,
    _fieldOptions?: FieldOptions<TParentValue, TName>
  ): void {
  }

  override update(
    part: ElementPart,
    [parent, name, fieldOptions = EMPTY_OBJECT]: DirectiveParameters<this>
  ): typeof noChange {
    const field = part.element as FormField<
      DeepValue<TParentValue, TName>,
      TParentValue
    >;
    const value = getIn(parent.value, name);

    // These orders matter.
    // - name -> parent -> value.
    // - dependents -> value.

    if (fieldOptions.dependents) {
      field.dependents = fieldOptions.dependents;
    }
    field.disabled = parent.disabled;
    field.name = name;
    field._setParent(parent);
    field._setValueNoNotify(
      value !== undefined ? value : fieldOptions.defaultValue!
    );

    return noChange;
  }
}

const EMPTY_OBJECT = {};

const fieldDirective = directive(FieldDirective);
