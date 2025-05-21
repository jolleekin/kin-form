/**
 * This module defines the base class {@linkcode FormField} and related types.
 * @module
 */

import { LitElement, type PropertyValues, notEqual } from "lit";
import { property } from "lit/decorators.js";
import { __decorate } from "tslib";

import type { FieldGroup } from "./field-group.ts";
import type { DeepKey, PromiseOr, ValidationError } from "./types.ts";
import { asyncFind } from "./utils/async.ts";
import { fire } from "./utils/event.ts";

/**
 * The function that validates a form field.
 */
export type Validator<TValue, TParentValue = never> = (
  field: FormField<TValue, TParentValue>
) => PromiseOr<ValidationError>;

/**
 * The function that formats the value of a form field for display in the UI.
 */
export type ValueFormatter<TValue, TParentValue = never> = (
  value: TValue,
  field: FormField<TValue, TParentValue>
) => string;

/**
 * The function that parses a string into a value for a form field.
 */
export type ValueParser<TValue, TParentValue = never> = (
  string: string,
  field: FormField<TValue, TParentValue>
) => TValue;

/**
 * Base class that defines a common API for a form field.
 *
 * A form field is usually used in a form context but can also be used as a
 * stand-alone element. To support the second use case, subclasses should
 * initialize {@linkcode value} to a defined value in their constructors.
 *
 * Subclasses may also override the following methods/properties
 * - {@linkcode valueParser}
 * - {@linkcode valueFormatter}
 * - {@linkcode sanitizeValue}
 *
 * @attr {boolean} invalid - Set when the field itself or any child fields is
 * invalid.
 * @attr {boolean} touched - Set when the field itself or any child fields has
 * been touched by the user.
 * @attr {boolean} validating - Set when the field itself or any child fields is
 * being validated.
 *
 * @event status-changed Fired when the {@linkcode invalid} or
 * {@linkcode validating} property has changed.
 * @event touched-changed Fired when the {@linkcode touched} property has changed.
 * @event value-changed Fired when the {@linkcode value} property has changed.
 */
export abstract class FormField<
  TValue = unknown,
  TParentValue = never
> extends LitElement {
  /**
   * Names of the form fields that depend on this field.
   *
   * Whenever this field's {@linkcode value} changes, {@linkcode parent} will
   * call {@linkcode validate} on the dependent fields.
   *
   * Default is an empty array.
   */
  // @property({ type: Array })
  declare dependents: DeepKey<TParentValue>[];

  /**
   * Whether the field is disabled.
   *
   * Default is `false`.
   */
  // @property({ type: Boolean, reflect: true })
  declare disabled: boolean;

  /**
   * The current validation error.
   *
   * The value is normalized to a non-empty string or `null`.
   *
   * This property reflects the result of the last finished validation.
   * When using async validators, application should check if
   * {@linkcode validating} is `false` before reading this property.
   */
  get error(): string | null {
    return this.#error;
  }

  /**
   * Name of the form field.
   *
   * In the context of a {@linkcode FieldGroup}, this is a deep key of the
   * form group's value.
   *
   * Default is an empty string.
   *
   * See {@linkcode FieldGroup.field}.
   */
  // @property({ reflect: true })
  declare name: DeepKey<TParentValue>;

  /**
   * The parent form field.
   *
   * Application should not set this property.
   */
  get parent(): FieldGroup<TParentValue> | null {
    return this.#parent;
  }

  /**
   * The top level ancestor of this field.
   *
   * This is computed on the fly.
   */
  get root(): FormField {
    let root = this as FormField;
    while (root.#parent) root = root.#parent as unknown as FormField;
    return root;
  }

  /**
   * Whether the field has been touched by user.
   */
  get touched(): boolean {
    return this.#touched;
  }
  set touched(v: boolean) {
    if (this.#touched !== v) {
      this.#touched = v;
      this.touchedChanged();
    }
  }

  /**
   * Whether the field is invalid.
   *
   * This property reflects the result of the last finished validation.
   * When using async validators, application should check if
   * {@linkcode validating} is `false` before reading this property.
   */
  get invalid(): boolean {
    return this.error !== null;
  }

  /**
   * Whether the field is being validated.
   *
   * Application should not set this property.
   */
  get validating(): boolean {
    return this.#validating;
  }

  /**
   * The validator array.
   *
   * Since validation happens automatically when {@linkcode disabled},
   * {@linkcode validators}, or {@linkcode value} changes, application
   * **should** cache the value for this property in a top level variable or
   * class field to avoid redundant rendering.
   *
   * Default is an empty array.
   */
  // @property({ attribute: false })
  declare validators: Validator<TValue, TParentValue>[];

  /**
   * The value of the form field.
   *
   * Subclasses that may be used as standalone elements (without a form context)
   * should intialize this property to a defined value in their constructors.
   * Otherwise, reading this property will throw an {@linkcode Error} if the
   * value is `undefined`.
   *
   * Subclasses may also need to override {@linkcode sanitizeValue} to ensure
   * only good values can be set as this field's value.
   */
  get value(): TValue {
    if (this.#value === undefined) {
      throw new Error(`${this.debugName}: value has not been initialized.`);
    }
    return this.#value;
  }
  set value(v: TValue) {
    if (v === undefined) {
      throw new Error(
        `${this.debugName}: value cannot be set to undefined.
 In a form context, you may want to specify a default value via the field() directive.`
      );
    }

    v = this.sanitizeValue(v);

    const oldValue = this.#value;
    if (notEqual(v, oldValue)) {
      this.#value = v;
      this.valueChanged();
    }
  }

  /**
   * The string representation of {@linkcode value}.
   *
   * This property can be used to serialize the value for use in URLs, for
   * example.
   *
   * Reading this property will call {@linkcode valueFormatter}.
   *
   * Setting this property will call {@linkcode valueParser}.
   */
  get valueAsString(): string {
    return this.valueFormatter(this.value, this);
  }
  set valueAsString(v: string) {
    if (!this.valueParser) {
      throw new Error(`${this.debugName}: missing valueParser.`);
    }
    this.value = this.valueParser(v, this);
  }

  /**
   * The function that formats {@linkcode value} as a string.
   *
   * Used together with {@linkcode valueParser} to allow custom value
   * formatting and parsing.
   *
   * This property defaults to {@linkcode String}.
   */
  // @property({ attribute: false })
  declare valueFormatter: ValueFormatter<TValue, TParentValue>;

  /**
   * The function that parses a string into a value.
   *
   * The string may come from the UI, an attribute or serialized data. For
   * example,
   * - For a number field, the string may come from an `input` element.
   * - In a list page/screen, the field is used as a filter and the string may
   *   come from a query parameter.
   *
   * Used together with {@linkcode valueFormatter} to allow custom value
   * formatting and parsing.
   */
  declare valueParser: ValueParser<TValue, TParentValue> | null;

  protected get debugName(): string {
    const { localName, name } = this;
    return name ? `${localName}[name=${name}]` : localName;
  }

  #error: string | null = null;
  #notifiesParent = true;
  #parent: FieldGroup<TParentValue> | null = null;
  #touched = false;
  #validating = false;
  #value?: TValue;
  #validationCounter = 0;

  constructor() {
    super();
    this.dependents = [];
    this.disabled = false;
    this.name = "";
    this.validators = [];
    this.valueFormatter = String;
    this.valueParser = null;
  }

  override disconnectedCallback(): void {
    this.#parent?._unregisterChild(this);
    this.#parent = null;
    super.disconnectedCallback();
  }

  /**
   * The `blur` event listener.
   *
   * This method marks the field itself as touched.
   *
   * This method is bound to the form field.
   */
  readonly handleBlur = (_event: FocusEvent): void => {
    this.touched = true;
  };

  /**
   * Validates the field.
   *
   * The validation stops eagerly when an error is found.
   *
   * This method is called automatically and asynchronously when
   * {@linkcode disabled}, {@linkcode validators}, or {@linkcode value} has
   * changed.
   */
  async validate(): Promise<void> {
    if (this.disabled) {
      this.#setValidating(false);
      this.#setError(null);
      return;
    }

    const promises: Promise<ValidationError>[] = [];

    for (const v of this.validators) {
      const error = v(this);
      if (error instanceof Promise) {
        promises.push(error);
      } else if (error) {
        this.#setValidating(false);
        this.#setError(error);
        return;
      }
    }

    if (!promises.length) {
      this.#setValidating(false);
      this.#setError(null);
      return;
    }

    const counter = ++this.#validationCounter;
    this.#setValidating(true);
    const isAborted = () => counter < this.#validationCounter;
    const error = await asyncFind(promises, (err) => !!err, isAborted);
    if (!isAborted()) {
      this.#setValidating(false);
      this.#setError(error);
    }
  }

  /**
   * Sanitizes {@linkcode value} before it can be set as this form field's value.
   *
   * By default, this method returns the value as is.
   */
  protected sanitizeValue(value: TValue): TValue {
    return value;
  }

  protected override willUpdate(changedProperties: PropertyValues<this>): void {
    if (
      changedProperties.has("disabled") ||
      changedProperties.has("validators") ||
      changedProperties.has("value")
    ) {
      this.validate();
    }
  }

  /**
   * Called synchronously when {@linkcode invalid} has changed.
   *
   * @mustCallSuper
   */
  protected invalidChanged(): void {
    this.toggleAttribute("invalid", this.invalid);
    this.requestUpdate();
    this.#parent?._childInvalidChanged(this);
    fire(this, "status-changed");
  }

  /**
   * Called synchronously when {@linkcode touched} has changed.
   *
   * @mustCallSuper
   */
  protected touchedChanged(): void {
    this.toggleAttribute("touched", this.touched);
    this.requestUpdate();
    this.#parent?._childTouchedChanged(this);
    fire(this, "touched-changed");
  }

  /**
   * Called synchronously when {@linkcode validating} has changed.
   *
   * @mustCallSuper
   */
  protected validatingChanged(): void {
    this.toggleAttribute("validating", this.validating);
    this.requestUpdate();
    this.#parent?._childValidatingChanged(this);
    fire(this, "status-changed");
  }

  /**
   * Called synchronously when {@linkcode value} has changed.
   *
   * @mustCallSuper
   */
  protected valueChanged(): void {
    if (this.#notifiesParent) {
      this.#parent?._childValueChanged(this);
    }
    // Need the name so `willUpdate` can trigger validation.
    this.requestUpdate("value");
    fire(this, "value-changed");
  }

  /**
   * Sets the parent form field.
   *
   * Internal use only.
   */
  _setParent(parent: FieldGroup<TParentValue> | null) {
    const old = this.#parent;
    if (old !== parent) {
      old?._unregisterChild(this);
      parent?._registerChild(this);
      this.#parent = parent;
    }
  }

  /**
   * Sets {@linkcode value} to {@linkcode v} without notifying the parent.
   *
   * Internal use only.
   */
  _setValueNoNotify(v: TValue): void {
    this.#notifiesParent = false;
    this.value = v;
    this.#notifiesParent = true;
  }

  #setError(error: ValidationError) {
    error ||= null;
    if (this.#error !== error) {
      this.#error = error;
      this.invalidChanged();
    }
  }

  #setValidating(v: boolean): void {
    if (this.#validating !== v) {
      this.#validating = v;
      this.validatingChanged();
    }
  }
}

const proto = FormField.prototype;
__decorate([property({ type: Array })], proto, "dependents");
__decorate([property({ type: Boolean, reflect: true })], proto, "disabled");
__decorate([property({ reflect: true })], proto, "name");
__decorate([property({ attribute: false })], proto, "validators");
__decorate([property({ attribute: false })], proto, "valueFormatter");
