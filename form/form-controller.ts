/**
 * This module defines {@linkcode FormController}, a reactive controller for
 * form state management.
 * @module
 */

import type {
  PropertyDeclaration,
  ReactiveController,
  ReactiveControllerHost,
} from "lit";

import { FieldGroup } from "./field-group.ts";
import type { Validator } from "./form-field.ts";
import type { ArrayOr, PromiseOr, ValidationError } from "./types.ts";
import { deepEqual } from "./utils/deep-equal.ts";
import { makeArray } from "./utils/misc.ts";
import { on } from "./utils/event.ts";

export interface FormControllerOptions<TValue> {
  /**
   * The initial value of the form.
   */
  initialValue: TValue;
  /**
   * The callback to invoke when the form is submitted.
   * @param event The event that triggers the submission.
   */
  onSubmit: (form: FormController<TValue>, event?: Event) => PromiseOr<void>;
  /**
   * The callback to invoke when the form failed to submit due to validation
   * errors.
   */
  onSubmitInvalid?: (form: FormController<TValue>) => void;
  /**
   * The callback to invoke when the submission failed.
   */
  onSubmitError?: (form: FormController<TValue>, error: unknown) => void;
  /**
   * The function(s) that perform form-level validation.
   */
  validators?: ArrayOr<
    (form: FormController<TValue>) => PromiseOr<ValidationError>
  >;
}

/**
 * A reactive controller for form state management.
 *
 * @example
 * ```ts
 * interface Model {
 *   name: string;
 *   level: number | null;
 *   dateOfBith: Date | null;
 * }
 *
 * // The backslashes before @ are used to work around a JSDoc issue.
 * \@customElement("form-demo")
 * export class FormDemo extends LitElement {
 *   #form = new FormController<Model>(this, {
 *     initialValue: {
 *       name: "",
 *       level: null,
 *       dateOfBirth: null,
 *     },
 *     onSubmit: (form) => {
 *       console.log(form.value);
 *     },
 *   });
 *
 *   protected override render(): unknown {
 *     const { field, handleSubmit, submitting } = this.#form;
 *
 *     return html`
 *       <!-- Use custom elements that extend FormField -->
 *       <text-field label="Name" ${field("name")}></text-field>
 *       <number-field label="Level" ${field("level")}></number-field>
 *
 *       <!-- Use <kin-field> with a custom template -->
 *       <kin-field
 *         ${field("dateOfBirth")}
 *         .template=${(f: KinField<Date | null>) => html`
 *           <label>Date of birth</label>
 *           <input
 *             type="date"
 *             .valueAsDate=${f.value}
 *             \@blur=${f.handleBlur}
 *             \@change=${(evt: Event) => {
 *               f.handleChange(evt, (evt.target as HTMLInputElement).valueAsDate);
 *             }}
 *           />
 *           ${f.touched && f.error ? html`<div>${f.error}</div>` : nothing}
 *         `}
 *       ></kin-field>
 *
 *       <button .disabled=${submitting} @click=${handleSubmit}>Save</button>
 *     `;
 *   }
 * }
 * ```
 */
export class FormController<TValue>
  extends FieldGroup<TValue>
  implements ReactiveController
{
  /**
   * Whether {@linkcode value} has changed compared to the intial value.
   */
  get dirty(): boolean {
    return this.#dirty;
  }

  /**
   * Whether the form is being submitted.
   */
  get submitting(): boolean {
    return this.#submitting;
  }

  readonly #options: FormControllerOptions<TValue>;

  #dirty = false;
  #submitting = false;

  #initialValue!: TValue;

  private _host: ReactiveControllerHost;

  constructor(
    host: ReactiveControllerHost,
    options: FormControllerOptions<TValue>
  ) {
    super();
    this._host = host;
    this.#options = options;
    this.#initialValue = options.initialValue;
    this.validators = makeArray(options.validators) as Validator<TValue>[];
    this.value = options.initialValue;
    host.addController(this);
  }

  /**
   * Handles form reset.
   *
   * @example
   * ```ts
   * // The backslash is used to work around a JSDoc issue.
   * html`
   *   <button \@click=${form.handleReset}>Reset</button>
   * `
   * ```
   *
   * @bound
   */
  readonly handleReset = (): void => this.reset();

  /**
   * Handles the form submission.
   *
   * 1. If the form is not valid
   *    1. Mark all fields as touched
   *    2. Call {@linkcode FormControllerOptions.onSubmitInvalid onSubmitInvalid}
   *       if provided
   *    3. Return
   * 2. If the form is being validated/submitted, return
   * 3. Call {@linkcode FormControllerOptions.onSubmit onSubmit}. If an error
   *    happens, call {@linkcode FormControllerOptions.onSubmitError onSubmitError}
   *    if provided.
   *
   * @example
   * ```ts
   * // The backslash is used to work around a JSDoc issue.
   * html`
   *   <button \@click=${form.handleSubmit}>Submit</button>
   * `
   * ```
   *
   * @bound
   */
  readonly handleSubmit = async (event?: Event): Promise<void> => {
    if (this.invalid) {
      this.touched = true;
      this.#options.onSubmitInvalid?.(this);
      return;
    }

    if (this.validating || this.#submitting) return;

    this.#submitting = true;
    this._host.requestUpdate();

    try {
      await this.#options.onSubmit(this, event);
      this.#dirty = false;
    } catch (e) {
      this.#options.onSubmitError?.(this, e);
    }

    this.#submitting = false;
    this._host.requestUpdate();
  };

  hostConnected(): void {}

  /**
   * Resets the form.
   *
   * This method does the following
   * - Marks all fields as untouched
   * - Reset {@linkcode value} to the initial value passed to the constructor or
   *   {@linkcode options.initialValue} if provided, causing {@linkcode dirty}
   *   to be `false`.
   *
   * @param options.initialValue The new initial value.
   */
  reset(options: { initialValue?: TValue } = {}): void {
    if (options.initialValue !== undefined) {
      this.#initialValue = options.initialValue;
    }

    this.touched = false;
    this.value = this.#initialValue!;
  }

  override requestUpdate(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration
  ): void {
    super.requestUpdate(name, oldValue, options);
    
    // Still in the super constructor.
    if (!this._host) return;

    this._host.requestUpdate();

    // This class extends LitElement but is used as a reactive controller,
    // so `willUpdate` is never called. That's why we call `validate` here.
    if (name === "value" || name === "disabled") {
      this.validate();
    }
  }

  protected override valueChanged(): void {
    super.valueChanged();
    this.#dirty = !deepEqual(this.#initialValue, this.value);
  }
}

// This is needed so the class can be instantiated using the `new` keyword.
customElements.define("kin-form", FormController);
