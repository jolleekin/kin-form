/**
 * The form tree's root ({@linkcode FormApi}), submit handling, and
 * resetting the whole tree or a single field.
 *
 * @module
 */

import { FieldApi, type FieldApiOptions } from "./FieldApi.ts";
import type { DeepKey, DeepValue, PromiseOr } from "./types.ts";
import { getIn, setIn } from "./utils/immutable.ts";

/** Constructor/`updateOptions` options for a {@linkcode FormApi}. */
export interface FormApiOptions<TValue> extends
  FieldApiOptions<
    TValue,
    never
  > {
  initialValue: TValue;
  /** Called instead of {@linkcode onSubmit} when the form is invalid at submit time. */
  onSubmitInvalid?: (form: FormApi<TValue>) => PromiseOr<void>;
  /** Called with the (settled-valid) form on submit. */
  onSubmit?: (form: FormApi<TValue>) => PromiseOr<void>;
  /** Called if {@linkcode onSubmit} throws/rejects. */
  onSubmitError?: (form: FormApi<TValue>, error: unknown) => PromiseOr<void>;
}

/**
 * The form tree's root (similar to `Document` in the DOM tree).
 *
 * A {@linkcode FieldApi} with `parent === null`, `name === ""`, plus reset and
 * submission logic.
 *
 * @example
 * ```ts
 * const form = new FormApi({
 *   initialValue: { email: "", password: "" },
 *   onSubmit: async (form) => {
 *     await login(form.value);
 *   },
 *   onSubmitError: (form, error) => {
 *     toast.error("Failed to log in");
 *   },
 * });
 *
 * const email = form.field("email", {
 *   validators: [required("Email is required")],
 * });
 * ```
 */
export class FormApi<TValue = unknown> extends FieldApi<TValue> {
  /** Whether the form is currently submitting. */
  get submitting(): boolean {
    return this.#submitting;
  }

  /**
   * Submits the form.
   *
   * This is an arrow field so it can be passed by reference.
   *
   * If given an `event` with a `preventDefault` method, calls it first. Bind
   * directly to a `<form>`'s `onSubmit`, no wrapper arrow function needed:
   *
   * @example
   * ```ts
   * <form onSubmit={form.handleSubmit}>
   * ```
   *
   * `event` is untyped on purpose: it's never assumed to have
   * `preventDefault` (only checked for one at runtime), so `handleSubmit`
   * stays assignable to whatever single-argument event-callback shape the
   * caller's framework uses, including one with no `preventDefault` at all,
   * like React Native Button's `onPress`.
   *
   * Waits out any pending validation, then:
   * - Calls {@linkcode FormApiOptions.onSubmitInvalid onSubmitInvalid} if the
   *   form turns out invalid.
   * - Otherwise calls {@linkcode FormApiOptions.onSubmit onSubmit} (tracked
   *   via {@linkcode submitting}), falling back to
   *   {@linkcode FormApiOptions.onSubmitError onSubmitError} on failure.
   *
   * A no-op re-entrant call while already submitting.
   */
  readonly handleSubmit = async (event?: unknown): Promise<void> => {
    (event as { preventDefault?(): void } | undefined)?.preventDefault?.();

    if (this.#submitting) return;
    if (this.validating) await this.waitForValidation();

    if (this.invalid) {
      this.touched = true;
      await this.#onSubmitInvalid?.(this);
      return;
    }

    try {
      this.#setSubmitting(true);
      await this.#onSubmit?.(this);
    } catch (error) {
      await this.#onSubmitError?.(this, error);
    } finally {
      this.#setSubmitting(false);
    }
  };

  #setSubmitting(v: boolean): void {
    if (v === this.#submitting) return;
    this.#submitting = v;
    this.notify();
  }

  /**
   * Narrows {@linkcode FieldApi.initialValue} back down to `TValue`: a root
   * (`parent === null`) always has a real baseline, stored directly by
   * {@linkcode FieldApi}'s constructor, never derived through a `parent`
   * that might itself lack one.
   */
  protected override get initialValue(): TValue {
    return super.initialValue as TValue;
  }

  protected override set initialValue(value: TValue) {
    super.initialValue = value;
  }

  /**
   * Resets the form to {@linkcode value}.
   *
   * Clears {@linkcode touched} throughout the tree, and sets this form's value
   * and initial value to {@linkcode value}, cascading down the form tree.
   *
   * {@linkcode value} defaults to the {@linkcode initialValue}.
   *
   * @example
   * ```ts
   * // Discard edits, back to the original initial value.
   * form.reset();
   *
   * // Set a new baseline after a successful submission.
   * const saved = await save(form.value);
   * form.reset(saved);
   * ```
   */
  reset(value: TValue = this.initialValue): void {
    this.batch(() => {
      this.initialValue = value;
      this.touched = false;
      this.value = value;
    });
  }

  /**
   * Resets the field at {@linkcode name} to {@linkcode value}.
   *
   * Doesn't register a new field just to reset it: if one is already
   * registered at `name`, its {@linkcode FieldApi.touched} is also cleared;
   * otherwise only the value and initial value move, ready for whenever a field
   * does get registered there.
   *
   * @example
   * ```ts
   * // Discard edits to just this one field.
   * form.resetField("email");
   *
   * // Reset and set a new baseline.
   * form.resetField("email", "new@example.com");
   * ```
   */
  resetField<TName extends DeepKey<TValue>>(
    name: TName,
    value: DeepValue<TValue, TName> = getIn(
      this.initialValue,
      name,
      undefined,
    ),
  ): void {
    this.batch(() => {
      this.initialValue = setIn(this.initialValue, name, value);
      this.value = setIn(this.value, name, value);
      const field = FormApi.#findRegisteredField(
        this as FieldApi<unknown>,
        name,
      );
      if (field) field.touched = false;
    });
  }

  /**
   * Finds the field already registered at `name`, without registering one
   * that isn't (unlike {@linkcode FieldApi.field}).
   *
   * Walks {@linkcode FieldApi.children} down from {@linkcode node}: `name`
   * may address a field registered directly at this level, or one nested
   * through an already-registered intermediate field (mirroring how
   * {@linkcode FieldApi.field} itself resolves a dotted path against
   * `#assertNoPathCollision`'s invariant: at any level, at most one of "the
   * exact key" or "a registered key that's a dot-prefix of it" can exist).
   */
  static #findRegisteredField(
    node: FieldApi<unknown>,
    name: string,
  ): FieldApi<unknown> | undefined {
    const children = node.children as unknown as ReadonlyMap<
      string,
      FieldApi<unknown>
    >;
    const exact = children.get(name);
    if (exact) return exact;

    let prefixKey: string | undefined;
    for (const key of children.keys()) {
      if (name.startsWith(`${key}.`)) {
        prefixKey = key;
        break;
      }
    }
    if (prefixKey === undefined) return undefined;

    return FormApi.#findRegisteredField(
      children.get(prefixKey)!,
      name.slice(prefixKey.length + 1),
    );
  }

  #onSubmitInvalid?: FormApiOptions<TValue>["onSubmitInvalid"];
  #onSubmit?: FormApiOptions<TValue>["onSubmit"];
  #onSubmitError?: FormApiOptions<TValue>["onSubmitError"];

  #submitting = false;

  constructor(opts: FormApiOptions<TValue>) {
    super(null, "", opts);
    this.#onSubmitInvalid = opts.onSubmitInvalid;
    this.#onSubmit = opts.onSubmit;
    this.#onSubmitError = opts.onSubmitError;
  }

  /**
   * Refreshes this form's options.
   *
   * Updates {@linkcode FormApiOptions.onSubmit},
   * {@linkcode FormApiOptions.onSubmitInvalid}, and
   * {@linkcode FormApiOptions.onSubmitError} (and any validators/dependents,
   * via {@linkcode FieldApi.updateOptions}), so callers that recreate their
   * options object every call (e.g. a React hook re-rendering with fresh
   * closures) don't get stuck invoking stale callbacks captured at
   * construction time.
   */
  override updateOptions(
    opts: Omit<FormApiOptions<TValue>, "initialValue">,
  ): void {
    super.updateOptions(opts);
    this.#onSubmitInvalid = opts.onSubmitInvalid;
    this.#onSubmit = opts.onSubmit;
    this.#onSubmitError = opts.onSubmitError;
  }
}
