/**
 * A field in the form's tree ({@linkcode FieldApi}): value/error/touched/
 * validating/validators, `handleBlur`/`handleChange` for binding directly to
 * a single control, and (if used to hold a nested object/array) a
 * lazily-populated registry of child fields with array mutation helpers and
 * aggregation up from them. Rooted by {@linkcode FormApi}.
 *
 * @module
 */

import { BaseApi } from "./BaseApi.ts";
import {
  kChildInvalidChanged,
  kChildTouchedChanged,
  kChildValidatingChanged,
  kChildValueChanged,
  kDestroy,
  kParentInitialValueChanged,
  kParentSchemaErrorsChanged,
  kParentValueChanged,
  kResolveSchemaError,
  kSetName,
} from "./FieldApi.internal.ts";
import type {
  ArrayOr,
  DeepKey,
  DeepKeyOrRoot,
  DeepValue,
  PromiseOr,
  ValidationError,
  ValidatorResult,
} from "./types.ts";
import { DebouncedTask } from "./utils/debounced-task.ts";
import { deepEqual } from "./utils/deep-equal.ts";
import {
  arrayInsert,
  arrayMove,
  arrayPush,
  arrayRemove,
  arrayReplace,
  arraySwap,
  existsIn,
  getIn,
  getInOr,
  setIn,
  splitFirstSegment,
  updateIn,
} from "./utils/immutable.ts";
import { makeArray } from "./utils/misc.ts";
import { shallowEqual } from "./utils/shallow-equal.ts";

/**
 * A function run against a {@linkcode FieldApi} to check its current
 * {@linkcode FieldApi.value}, returning a falsy result when valid. Runs
 * immediately, synchronously, on every value change; for a check that's
 * expensive or needs debouncing, see {@linkcode AsyncValidator} instead.
 *
 * Must not throw; return a {@linkcode ValidatorResult} instead. A thrown
 * error is treated as passing and logged, not a supported error signal.
 */
export type Validator<TValue, TParentValue = never> = (
  field: FieldApi<TValue, TParentValue>,
) => ValidatorResult;

/**
 * A function run against a {@linkcode FieldApi} to check its current
 * {@linkcode FieldApi.value}, asynchronously: debounced by this field's own
 * {@linkcode FieldApiOptions.validationDebounceMs validationDebounceMs}, and
 * only run once every entry in {@linkcode FieldApiOptions.validators validators}
 * has already passed, so an expensive check never fires for a value already known
 * invalid by a cheap one.
 *
 * Singular: one per field, not an array like {@linkcode Validator}s. If more
 * than one async check is needed, combine them inside this one function with
 * full control over ordering/concurrency instead, e.g.
 * `async (field) => (await checkA(field)) ?? (await checkB(field))`.
 *
 * Must not throw/reject; return/resolve a {@linkcode ValidatorResult}
 * instead. A thrown/rejected error is treated as passing and logged, not a
 * supported error signal.
 * Doesn't actually have to be `async`: a validator placed here that happens
 * to resolve synchronously still goes through the debounced path, which is
 * the point of putting it here instead of in {@linkcode FieldApiOptions.validators}
 * (e.g. throttling an expensive-but-synchronous check without needing an
 * `async` wrapper).
 */
export type AsyncValidator<TValue, TParentValue = never> = (
  field: FieldApi<TValue, TParentValue>,
) => PromiseOr<ValidatorResult>;

/**
 * A function run against a {@linkcode FieldApi} to check its current
 * {@linkcode FieldApi.value} as a whole, producing a flat, dot-joined
 * path -> message map instead of a single message (unlike
 * {@linkcode Validator}), for whole-group/whole-form validation where one
 * schema is the single source of truth for every field under this field,
 * rather than duplicating rules per field.
 *
 * Must not throw/reject; return/resolve `null`/`undefined` for "no errors".
 * A thrown/rejected error is treated as "no errors" and logged, not a
 * supported error signal. See
 * `@kin-form/validators`'s `toSchemaValidator()` for a ready-made adapter from
 * any Standard Schema-compliant library.
 */
export type SchemaValidator<TValue, TParentValue = never> = (
  field: FieldApi<TValue, TParentValue>,
) => PromiseOr<
  Partial<Record<DeepKeyOrRoot<TValue>, ValidationError>> | null | undefined
>;

let nextId = 0;

/**
 * Constructor/{@linkcode FieldApi.updateOptions} options for a
 * {@linkcode FieldApi}.
 *
 * @example
 * ```ts
 * form.field("email", {
 *   validators: [required("Email is required"), email("Enter a valid email")],
 *   validationDebounceMs: 300,
 * });
 * ```
 */
export type FieldApiOptions<TValue, TParentValue = never> = {
  /**
   * Sibling field paths (relative to this field's parent) to re-validate
   * whenever *this* field's value changes: for cross-field rules like
   * "confirm password must match password" or "check-out must be after
   * check-in".
   *
   * Accepts a single path directly, without wrapping it in an array. See
   * {@linkcode FieldApi.dependents}.
   */
  dependents?: ArrayOr<DeepKey<TParentValue>>;

  /**
   * Whether this field starts out {@linkcode FieldApi.disabled}. Defaults to
   * `false`, or to {@linkcode FieldApi.parent}'s current `disabled` if unset
   * and `parent` is already disabled.
   */
  disabled?: boolean;

  /**
   * Synchronous validator(s) for this field.
   *
   * Validators run in order, immediately, on every value change; the first
   * truthy result wins. Never debounced; see {@linkcode asyncValidator} for
   * a check that needs to be (expensive, network-calling, or otherwise worth
   * throttling while the user is still typing).
   *
   * Accepts a single validator directly, without wrapping it in an array.
   * Doing so always allocates a fresh one-element array underneath, though:
   * if this field's validators rarely change and you want reassigning the
   * same set to be a cheap no-op, cache the array yourself (e.g. a
   * module-level constant, or `useMemo`) and pass that instead. See
   * {@linkcode FieldApi.validators}.
   */
  validators?: ArrayOr<Validator<TValue, TParentValue>>;

  /**
   * An asynchronous validator for this field, run only once every
   * {@linkcode validators} entry has already passed, and debounced by
   * {@linkcode validationDebounceMs}. See {@linkcode AsyncValidator}.
   */
  asyncValidator?: AsyncValidator<TValue, TParentValue>;

  /**
   * A whole-field validator producing a flat path -> message map (see
   * {@linkcode SchemaValidator}) instead of a single message, populating
   * {@linkcode FieldApi.schemaErrorMap}.
   *
   * Singular: one per field, not an array like {@linkcode validators}.
   * There's no real use case for stacking multiple whole-field schemas on the
   * same field the way there is for stacking small per-field rules; combine
   * schemas yourself (e.g. Zod's `.and()`/`.merge()`) before passing one in.
   *
   * Debounced using this field's own {@linkcode validationDebounceMs};
   * there's no separate delay knob for this.
   */
  schemaValidator?: SchemaValidator<TValue, TParentValue>;

  /**
   * This field's starting {@linkcode FieldApi.validationDebounceMs}. Defaults
   * to `0`.
   */
  validationDebounceMs?: number;

  /**
   * Called whenever this field's `value` settles to something new, from any
   * source but not for the initial value seeded at construction.
   *
   * See {@linkcode FieldApi.updateOptions} for how this stays in sync across
   * repeated calls (e.g. a React re-render passing a fresh closure).
   *
   * For side effects that aren't validation (validation belongs in
   * {@linkcode validators}/{@linkcode dependents}), e.g. clearing a
   * dependent field:
   *
   * ```ts
   * form.field("country", {
   *   onValueChanged: () => {
   *     form.field("province").value = "";
   *   },
   * });
   * ```
   */
  onValueChanged?: (field: FieldApi<TValue, TParentValue>) => void;
};

/**
 * A field in the form tree (similar to a `Node` in the DOM tree).
 *
 * A field holds
 *
 * - State: {@linkcode value}, {@linkcode dirty}, {@linkcode touched},
 *   {@linkcode validating}, {@linkcode error}, {@linkcode schemaError},
 *   {@linkcode validators}, {@linkcode asyncValidator},
 *   {@linkcode schemaValidator}.
 *
 * - Event handlers: {@linkcode handleBlur}/{@linkcode handleChange}, for
 *   binding directly to a single UI control.
 *
 * - Children: a lazily-populated registry of child fields
 *   ({@linkcode children}, populated via {@linkcode field}), for when this
 *   field's value is a nested object/array decomposed into sub-fields
 *   instead.
 *
 * - Array helpers: mutation methods on {@linkcode children}.
 *
 * - Child aggregation: `touched`/`invalid`/`validating` bubbled up from
 *   `children`.
 *
 * Whether a given object/array-valued field is treated as one atomic leaf
 * (bind `handleChange` straight to a custom control) or decomposed into
 * children (call {@linkcode field} for each sub-path) is entirely up to the
 * caller; nothing here enforces one or the other.
 */
export class FieldApi<TValue, TParentValue = never> extends BaseApi {
  /** This field's current value. */
  get value(): TValue {
    return this.#value;
  }

  set value(v: TValue) {
    if (v === this.#value) return;
    this.#value = v;
    // Batch: `valueChanged()` can itself synchronously flip `validating`,
    // so one edit should coalesce into a single notification, not two.
    this.batch(() => this.valueChanged());
  }

  /**
   * Whether {@linkcode value} currently differs from its
   * {@linkcode initialValue}.
   *
   * Computed by a deep-equality check. An edit that's undone by hand
   * (typed, then typed back to the original) makes `dirty` `false` again.
   *
   * {@linkcode value} and {@linkcode initialValue} are both whole-subtree
   * snapshots at whatever level of the tree this field sits at, so this one
   * comparison already reflects every descendant too, so no separate
   * aggregation from {@linkcode children} is needed, unlike {@linkcode touched}/
   * {@linkcode invalid}/{@linkcode validating}.
   *
   * Cached rather than recomputed on every read.
   */
  get dirty(): boolean {
    return this.#dirty;
  }

  /**
   * This field's dirty-comparison baseline (see {@linkcode dirty}): this
   * field's own slice of {@linkcode parent}'s own baseline, or, for a field
   * constructed with no `parent` (only `FormApi` legitimately is), the
   * value it was constructed with.
   *
   * `undefined` if `name` doesn't resolve within `parent`'s own baseline at
   * all, e.g. a field registered under an array index pushed after the
   * baseline was last moved: there's no corresponding slot to derive a
   * baseline from, so the field is simply dirty against `undefined` rather
   * than throwing. A root (`parent === null`) always has a real baseline, so
   * `FormApi` casts this back down to `TValue` at its own read sites instead
   * of narrowing the accessor itself.
   *
   * Assignable only so `FormApi.reset`/`FormApi.resetField` can move it;
   * not part of the public surface otherwise. Only ever assigned on a field
   * with no `parent`: every other field's `initialValue` is purely derived,
   * so assigning it there would just be stored and never read.
   */
  protected get initialValue(): TValue | undefined {
    if (!this.parent) return this.#initialValue;
    return getInOr(this.parent.initialValue, this.name, undefined) as
      | TValue
      | undefined;
  }

  protected set initialValue(value: TValue) {
    this.#initialValue = value;
    this.#recomputeDirty();
    for (const child of this.#children.values()) {
      child[kParentInitialValueChanged]();
    }
  }

  /**
   * The result of this field's most recently settled validation run.
   * `null` if valid.
   */
  get error(): ValidationError {
    return this.#error;
  }

  /**
   * Whether this field is invalid: its own {@linkcode error}, its
   * {@linkcode schemaError}, any of {@linkcode children}, or its own
   * {@linkcode schemaErrorMap}.
   *
   * Always `false` while {@linkcode disabled}, regardless of any of the
   * above.
   */
  get invalid(): boolean {
    return !this.disabled && (!!this.#error || !!this.schemaError ||
      this.#anyChildInvalid || this.#schemaErrorMap !== null);
  }

  /**
   * This field's own resolved schema error.
   *
   * Prefers this field's own {@linkcode schemaErrorMap}'s `""` entry
   * (from its own {@linkcode schemaValidator}), since that's more specific than
   * one attached higher up. Otherwise falls back to this field's slice of the
   * nearest ancestor's `schemaErrorMap`, walking up past {@linkcode parent} if needed, to
   * whichever ancestor has its own `schemaValidator` first, since that one
   * takes precedence over anything further up.
   *
   * The value is cached, so reading is O(1).
   */
  get schemaError(): ValidationError {
    return this.#schemaError;
  }

  /**
   * Whether this field itself or any of {@linkcode children} has been
   * blurred/touched by the user.
   *
   * Setting this property affects the whole subtree rooted at this field.
   */
  get touched(): boolean {
    return this.#touched || this.#anyChildTouched;
  }

  set touched(t: boolean) {
    if (t !== this.#touched) {
      this.#touched = t;
      this.touchedChanged();
    }
    for (const f of this.#children.values()) {
      f.touched = t;
    }
  }

  /**
   * Whether this field is disabled.
   *
   * When `true`, {@linkcode invalid} is always `false` and
   * {@linkcode validators}/{@linkcode asyncValidator}/
   * {@linkcode schemaValidator} are never run.
   *
   * Setting this property affects the whole subtree rooted at this field, and a
   * child registered later (via {@linkcode field}) starts out disabled if
   * {@linkcode parent} currently is.
   */
  get disabled(): boolean {
    return this.#disabled;
  }

  set disabled(d: boolean) {
    if (d !== this.#disabled) {
      const oldInvalid = this.invalid;
      const oldValidating = this.validating;
      this.#disabled = d;
      this.batch(() => {
        this.#scheduleValidation();
        this.#scheduleSchemaValidation();
        if (this.invalid !== oldInvalid) this.invalidChanged();
        if (this.validating !== oldValidating) this.validatingChanged();
        this.notify();
      });
    }
    for (const f of this.#children.values()) {
      f.disabled = d;
    }
  }

  /**
   * Whether this field's {@linkcode asyncValidator} or
   * {@linkcode schemaValidator} is currently pending/in-flight, or any of
   * {@linkcode children} is.
   *
   * {@linkcode validators} never contributes here; they run synchronously,
   * immediately, so there's never anything pending from them alone.
   */
  get validating(): boolean {
    return this.#asyncValidatorTask.pending ||
      this.#schemaValidationTask.pending || this.#anyChildValidating;
  }

  /**
   * The synchronous validators for this field.
   *
   * Validators must not throw.
   *
   * Safe to pass a freshly-constructed array on every call, e.g. from
   * validator factories (`required('...')`, `maxLength(20, '...')`).
   * Reassigning doesn't itself trigger a run, beyond clearing this field's
   * sync contribution to {@linkcode error} if the new array is empty, so a
   * conditionally-different array takes effect on the next value change or
   * explicit {@linkcode validate} call (`force: true` if only something the
   * validators read, not the value or validators themselves, changed).
   *
   * Also accepts a single validator for convenience, which allocates a
   * fresh one-element array underneath. Cache the array yourself (e.g. a
   * module-level constant or `useMemo`) if you want reassigning the same
   * set to be a cheap no-op.
   */
  get validators(): Array<Validator<TValue, TParentValue>> {
    return this.#validators;
  }

  set validators(v: ArrayOr<Validator<TValue, TParentValue>>) {
    v = makeArray(v);
    if (v === this.#validators) return;

    this.#validators = v;

    if (v.length === 0) {
      this.#syncError = null;
      this.#setError(this.#asyncValidatorTask.lastResult);
    }
  }

  /**
   * A value that uniquely and stably identifies this field instance for as
   * long as it lives, independent of its current {@linkcode name}.
   *
   * Unlike `name`, this doesn't change when an array item it belongs to is
   * moved/swapped/re-keyed. Suitable for use as a React `key` when rendering
   * a list of array items.
   */
  readonly id: number;

  /**
   * This field's path relative to {@linkcode parent} (`""` for the tree root).
   */
  get name(): DeepKeyOrRoot<TParentValue> {
    return this.#name;
  }

  /** This field's parent, or `null` for the tree root. */
  readonly parent: FieldApi<TParentValue> | null;

  /**
   * Sibling field paths (relative to {@linkcode parent}) to re-validate
   * whenever this field's own value changes.
   *
   * See {@linkcode FieldApiOptions["dependents"]}.
   *
   * @example
   * ```ts
   * // Re-check "confirm password" whenever "password" changes.
   * form.field("password", {
   *   dependents: ["confirmPassword"],
   *   validators: [required("Password is required")],
   * });
   * form.field("confirmPassword", {
   *   validators: [(field) =>
   *     field.value !== form.value.password ? "Passwords must match" : null],
   * });
   * ```
   */
  dependents: Array<DeepKey<TParentValue>>;

  /**
   * The ultimate ancestor of this field: its {@linkcode parent}'s
   * {@linkcode root}, or itself if it has no parent.
   */
  override get root(): BaseApi {
    return this.parent?.root ?? this;
  }

  /**
   * The registry of child fields created so far via {@linkcode field},
   * populated lazily, so a field that's never been requested (e.g. because
   * its input never rendered) won't appear here yet.
   *
   * @example
   * ```ts
   * for (const [name, field] of form.children) {
   *   console.log(name, field.value, field.invalid);
   * }
   * ```
   */
  get children(): ReadonlyMap<
    DeepKey<TValue>,
    FieldApi<DeepValue<TValue, DeepKey<TValue>>, TValue>
  > {
    return this.#children;
  }

  /**
   * A flat, dot-joined path -> message map produced by this field's
   * {@linkcode schemaValidator}, or `null` if none is configured or it
   * currently reports nothing (an empty-object result is normalized to
   * `null` the same way).
   *
   * Distinct from {@linkcode error}:
   *
   * - `error` is this field's own single message (from a regular
   * {@linkcode validators} entry and {@linkcode asyncValidator}) and is never
   * distributed to children.
   *
   * - `schemaErrorMap` is a flat map, typically from one whole-field
   * Standard Schema (see `@kin-form/validators`'s `toSchemaValidator()`), keyed
   * by the path of the field each issue belongs to. It is *not* automatically
   * copied onto the individual child fields' own `.error`; a child field that
   * wants to surface its slice of this map reads it via its own
   * {@linkcode schemaError}.
   */
  get schemaErrorMap():
    | Partial<Record<DeepKeyOrRoot<TValue>, ValidationError>>
    | null {
    return this.#schemaErrorMap;
  }

  /**
   * This field's {@linkcode SchemaValidator}, if any.
   *
   * Same reassignment semantics as {@linkcode validators}: reassigning doesn't
   * itself trigger a run (beyond clearing to `null` if unset);
   * a conditionally-different validator takes effect on the next trigger
   * (a value change, or calling `validate(true)`).
   */
  get schemaValidator(): SchemaValidator<TValue, TParentValue> | undefined {
    return this.#schemaValidator;
  }

  set schemaValidator(v: SchemaValidator<TValue, TParentValue> | undefined) {
    if (v === this.#schemaValidator) return;
    this.#schemaValidator = v;
    if (!v) {
      this.#schemaValidationTask.settle(null);
    }
  }

  /**
   * This field's {@linkcode AsyncValidator}, if any.
   *
   * Same reassignment semantics as {@linkcode schemaValidator}: reassigning
   * doesn't itself trigger a run (beyond settling to `null` if unset); a
   * conditionally-different validator takes effect on the next  trigger
   * (a value change, or calling `validate(true)`).
   */
  get asyncValidator(): AsyncValidator<TValue, TParentValue> | undefined {
    return this.#asyncValidator;
  }

  set asyncValidator(v: AsyncValidator<TValue, TParentValue> | undefined) {
    if (v === this.#asyncValidator) return;
    this.#asyncValidator = v;
    if (!v) {
      this.#asyncValidatorTask.settle(null);
    }
  }

  /**
   * How long (in milliseconds) to wait after the last change before running
   * {@linkcode asyncValidator} and {@linkcode schemaValidator}, so rapid
   * successive changes (e.g. fast typing) don't each trigger their own run.
   * Defaults to `0`.
   *
   * Has no effect on {@linkcode validators}: those always run immediately,
   * undebounced.
   *
   * Reassigning only affects future debounced runs, same as
   * {@linkcode DebouncedTask.setDelay}'s own caveat: it doesn't reschedule a
   * timer already ticking down from a previous change.
   */
  get validationDebounceMs(): number {
    return this.#validationDebounceMs;
  }

  set validationDebounceMs(ms: number) {
    this.#validationDebounceMs = ms;
    this.#asyncValidatorTask.setDelay(ms);
    this.#schemaValidationTask.setDelay(ms);
  }

  #name: DeepKeyOrRoot<TParentValue>;
  #value!: TValue;
  // Only meaningful when `parent` is null; see the `initialValue`
  // accessor below.
  #initialValue!: TValue;
  // Always `false` at construction: `value` starts out equal to
  // `initialValue` either way (seeded from it directly, or, for a child,
  // synced from `parent.value`, which is itself no different at that point).
  // Kept in sync by `#recomputeDirty` from then on.
  #dirty = false;
  #error: ValidationError = null;
  #touched = false;
  #disabled = false;
  #validators: Array<Validator<TValue, TParentValue>>;
  // The last result #runSyncValidators() produced. Kept in sync by
  // #scheduleValidation (every value change) and the `validators` setter's
  // empty-array clear. Lets #asyncValidatorTask's `onSettled` below favor it
  // over a stale/irrelevant async result, without re-running validators.
  // (`run()` from the settle path can't safely trigger validators: a fresh
  // sync failure needs to *stay* visible through a settle that only ever
  // carries an async result.)
  #syncError: ValidationError = null;
  #onValueChanged?: FieldApiOptions<TValue, TParentValue>["onValueChanged"];

  #notifiesParent = true;
  #bubblingFromChild = false;
  #constructing = true;
  #destroyed = false;
  #asyncValidator: AsyncValidator<TValue, TParentValue> | undefined;
  #asyncValidatorTask: DebouncedTask<ValidationError>;
  #validationDebounceMs = 0;

  #anyChildInvalid = false;
  #anyChildTouched = false;
  #anyChildValidating = false;
  #children = new Map<
    DeepKey<TValue>,
    FieldApi<DeepValue<TValue, DeepKey<TValue>>, TValue>
  >();
  #childrenChangeListeners = new Set<VoidFunction>();

  #schemaError: ValidationError = null;
  #schemaErrorMap:
    | Partial<Record<DeepKeyOrRoot<TValue>, ValidationError>>
    | null = null;
  #schemaValidator: SchemaValidator<TValue, TParentValue> | undefined;
  #schemaValidationTask: DebouncedTask<
    Partial<Record<DeepKeyOrRoot<TValue>, ValidationError>> | null
  >;

  constructor(
    parent: FieldApi<TParentValue> | null,
    name: DeepKeyOrRoot<TParentValue>,
    // `initialValue` isn't part of the public `FieldApiOptions` a child
    // field's `options` accepts (see `field`); a child always reads its
    // initial value from `parent` instead. It's still accepted here,
    // internally, for a field constructed with no `parent` at all: only
    // `FormApi` legitimately does that (via its own required
    // `FormApiOptions.initialValue`).
    options: FieldApiOptions<TValue, TParentValue> & { initialValue?: TValue } =
      {},
  ) {
    super();
    this.id = ++nextId;
    this.parent = parent;
    this.#name = name;
    this.#disabled = options.disabled ?? parent?.disabled ?? false;
    // A parent's schemaValidator may have already settled before this field
    // was constructed (e.g. a group resolved lazily, after the form's own
    // schema already ran), so compute the current value instead of assuming
    // `null` until some future change happens to trigger a refresh.
    this.#schemaError = this.#computeSchemaError();
    this.#validators = makeArray(options.validators);
    this.dependents = makeArray(options.dependents);
    this.#onValueChanged = options.onValueChanged;

    this.#asyncValidator = options.asyncValidator;
    this.#validationDebounceMs = options.validationDebounceMs ?? 0;
    this.#asyncValidatorTask = new DebouncedTask(
      () => this.#runAsyncValidator(),
      null,
      {
        delayMs: this.#validationDebounceMs,
        // A settle can flip both `error` and (via `wasPending`) `validating`
        // at once, so batch them into a single notification instead of two.
        // Favors `#syncError` over this settle's own result: a settle can
        // arrive here purely to reset pending state (e.g. sync validators
        // just failed, so this task was settled to `null` without actually
        // running `asyncValidator`), and applying that `null` unconditionally
        // would clobber a fresher sync error with a stale/irrelevant one.
        onSettled: (error, wasPending) => {
          this.batch(() => {
            this.#setError(this.#syncError || error);
            if (wasPending) this.validatingChanged();
          });
        },
        onPending: () => this.validatingChanged(),
      },
    );

    this.#schemaValidator = options.schemaValidator;
    this.#schemaValidationTask = new DebouncedTask(
      () => this.#runSchemaValidator(),
      null,
      {
        delayMs: this.#validationDebounceMs,
        onSettled: (result, wasPending) => {
          this.batch(() => {
            this.#setSchemaErrors(result);
            if (wasPending) this.validatingChanged();
          });
        },
        onPending: () => this.validatingChanged(),
      },
    );

    // Setting value last as it triggers validation.
    if (parent) {
      // Seeding this field's own initial state isn't a "this field changed"
      // event the parent needs to react to.
      this.#setValueNoParentNotify(getIn(parent.value, this.name) as TValue);
    } else if (options.initialValue !== undefined) {
      this.#initialValue = options.initialValue;
      this.value = options.initialValue;
    } else {
      throw new Error("FieldApi must have a parent or an initial value");
    }

    this.#constructing = false;
  }

  /**
   * @internal
   *
   * Destroys the field: cancels any pending debounced validation (this
   * field's own {@linkcode asyncValidator} and its
   * {@linkcode schemaValidator}'s), then unregisters and destroys its own
   * children.
   *
   * Idempotent: a second call is a no-op, so it's safe for a parent's
   * {@linkcode unregisterField} and this field's own recursive teardown of
   * its children to each reach the same field without double-destroying it.
   *
   * Called automatically whenever a child's path stops existing in its
   * parent's value, on every value change, not just through helpers like
   * {@linkcode removeItem}.
   */
  [kDestroy](): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    for (const name of Array.from(this.#children.keys())) {
      this.unregisterField(name);
    }
    this.#asyncValidatorTask.cancel();
    this.#schemaValidationTask.cancel();
    (this as { parent: FieldApi<TParentValue> | null }).parent = null;
  }

  /**
   * Applies a fresh set of {@linkcode FieldApiOptions} to this field:
   * `disabled`, `validators`, `asyncValidator`, `dependents`,
   * `validationDebounceMs`, `onValueChanged`, and `schemaValidator`, if
   * present, without touching {@linkcode value}.
   *
   * Called every time {@linkcode field} resolves an already-registered field,
   * so option props/closures stay in sync with the latest render.
   *
   * Each option is checked for presence in {@linkcode opts} (`"key" in
   * opts`), not truthiness. An omitted key leaves the current state untouched;
   * an explicit `undefined` resets it to that option's own default.
   */
  updateOptions(opts: FieldApiOptions<TValue, TParentValue>): void {
    if ("disabled" in opts) this.disabled = opts.disabled ?? false;
    if ("dependents" in opts) this.dependents = makeArray(opts.dependents);
    if ("validators" in opts) this.validators = opts.validators ?? [];
    if ("onValueChanged" in opts) this.#onValueChanged = opts.onValueChanged;
    if ("asyncValidator" in opts) this.asyncValidator = opts.asyncValidator;
    if ("schemaValidator" in opts) this.schemaValidator = opts.schemaValidator;
    if ("validationDebounceMs" in opts) {
      this.validationDebounceMs = opts.validationDebounceMs ?? 0;
    }
  }

  /**
   * Marks this field as touched and immediately flushes any pending debounced
   * validation: this field's own {@linkcode asyncValidator} and its
   * {@linkcode schemaValidator}'s.
   *
   * Bind directly to an input's `onBlur`.
   *
   * @example
   * ```ts
   * const email = form.field("email");
   * inputEl.addEventListener("blur", email.handleBlur);
   * ```
   */
  readonly handleBlur = (): void => {
    this.touched = true;
    this.#asyncValidatorTask.flush();
    this.#schemaValidationTask.flush();
  };

  /**
   * Sets {@linkcode value}.
   *
   * Bind directly to an input's `onChange`. `handleChange` takes the new value
   * directly (not a DOM event), so a plain `<input>` needs a one-line adapter
   * to pull `.value`/`.checked` out of the event first. This keeps `core/`
   * free of any DOM dependency.
   *
   * @example
   * ```ts
   * const email = form.field("email");
   * inputEl.addEventListener(
   *   "input",
   *   (e) => email.handleChange((e.target as HTMLInputElement).value),
   * );
   * ```
   */
  readonly handleChange = (value: TValue): void => {
    this.value = value;
  };

  /**
   * Validates this field.
   *
   * Re-runs {@linkcode validators} immediately (they're synchronous, so
   * there's nothing to wait on there), then runs (or joins an
   * already-running, or already up to date, run of) {@linkcode asyncValidator}
   * and {@linkcode schemaValidator}, resolving once both have settled. Read
   * {@linkcode error}/{@linkcode schemaErrorMap} (or just {@linkcode invalid})
   * afterward.
   *
   * Safe to call concurrently and redundantly: each async validator is
   * invoked at most once per generation of the state it reads
   * ({@linkcode value}/{@linkcode asyncValidator} for the former,
   * {@linkcode value}/{@linkcode schemaValidator} for the latter), unless
   * {@linkcode force} is `true`. `asyncValidator` is never forced (or even
   * run) when {@linkcode validators} currently reports an error: an
   * already-known-invalid value has nothing left to check asynchronously.
   *
   * Pass `force: true` when something a validator reads, but that isn't
   * reflected in this field's own {@linkcode value}, {@linkcode validators},
   * {@linkcode asyncValidator}, or {@linkcode schemaValidator}, changed out
   * of band, e.g. a sibling field this one isn't declared as a
   * {@linkcode dependents} target of, or some external state entirely.
   * Without it, calling `validate()` on a field that's already settled just
   * resolves against the cached result, since nothing this field can see has
   * changed.
   *
   * @example
   * ```ts
   * const email = form.field("email");
   * await email.validate();
   * if (email.invalid) { ... }
   *
   * // Re-check "available" against a username that's tracked outside the
   * // form tree entirely, so a plain `validate()` would just settle against
   * // the cached (possibly stale) result.
   * await form.field("username").validate(true);
   * ```
   */
  async validate(force = false): Promise<void> {
    // A disabled field is always valid and never runs any validator.
    if (this.disabled) return;
    // Only actually re-run `validators` when forced: they already ran
    // synchronously on the last genuine trigger (a value change, or a prior
    // `force` call), so re-running them here unconditionally would silently
    // break "safe to call concurrently and redundantly" for the sync case.
    // `#scheduleValidation()` also (re)schedules/settles the async task as a
    // side effect, matching `#syncError`'s freshly-recomputed state.
    const asyncValidatorRelevant = force
      ? this.#scheduleValidation()
      : !this.#syncError && !!this.#asyncValidator;
    await Promise.all([
      asyncValidatorRelevant
        ? (force
          ? this.#asyncValidatorTask.forceRun()
          : this.#asyncValidatorTask.run())
        : this.#asyncValidatorTask.wait(),
      // Only actually force the schema task when there's a schemaValidator
      // to re-check; otherwise it's already settled to `null` (see
      // `#scheduleSchemaValidation`), and forcing it anyway would flip
      // `validating` true for no reason.
      force && this.#schemaValidator
        ? this.#schemaValidationTask.forceRun()
        : this.#schemaValidationTask.run(),
    ]);
  }

  #runSyncValidators(): ValidationError {
    for (const v of this.#validators) {
      try {
        const error = v(this);
        if (error) return error;
      } catch (thrown) {
        this.#warnValidatorThrew("validators", thrown);
      }
    }
    return null;
  }

  async #runAsyncValidator(): Promise<ValidationError> {
    if (!this.#asyncValidator) return null;
    try {
      return (await this.#asyncValidator(this)) || null;
    } catch (thrown) {
      this.#warnValidatorThrew("asyncValidator", thrown);
      return null;
    }
  }

  // Validators must not throw (see the `validators`/`asyncValidator`/
  // `schemaValidator` doc comments), but a thrown/rejected one shouldn't be
  // able to break the rest of this field's validation or its batch. Treated
  // as "no error from this validator" rather than a validation failure, so a
  // buggy validator can't permanently block submission for reasons the user
  // can't see or fix; surfaced loudly instead, so the actual bug isn't
  // silently swallowed.
  #warnValidatorThrew(kind: string, thrown: unknown): void {
    console.error(
      `[kin-form] a ${kind} on field ${JSON.stringify(this.name)} threw ` +
        `instead of returning a result. Treating it as passing for now, ` +
        `but validators must not throw.`,
      thrown,
    );
  }

  /** Resolves once this field's own validation, its {@linkcode schemaValidator}'s, and every registered child's have settled. */
  async waitForValidation(): Promise<void> {
    const waiters: Promise<unknown>[] = [
      this.#asyncValidatorTask.wait(),
      this.#schemaValidationTask.wait(),
    ];

    for (const field of this.#children.values()) {
      waiters.push(field.waitForValidation());
    }

    await Promise.all(waiters);
  }

  #setError(e: ValidationError): void {
    if (e === this.#error) return;
    const oldInvalid = this.invalid;
    this.#error = e;
    if (this.invalid !== oldInvalid) this.invalidChanged();
  }

  /**
   * Called synchronously when {@linkcode invalid} has changed.
   *
   * {@linkcode immediate} is `false` when the source of the change is a
   * descendant field under construction; {@linkcode #doNotify} defers the
   * {@linkcode BaseApi.notify} call instead of making it directly in that
   * case.
   */
  protected invalidChanged(immediate = true): void {
    this.parent?.[kChildInvalidChanged](
      this,
      immediate && !this.#constructing,
    );
    this.#doNotify(immediate);
  }

  /**
   * Called synchronously when {@linkcode touched} has changed. See
   * {@linkcode invalidChanged} for why {@linkcode immediate} is gated on
   * {@linkcode #constructing}.
   */
  protected touchedChanged(immediate = true): void {
    this.parent?.[kChildTouchedChanged](
      this,
      immediate && !this.#constructing,
    );
    this.#doNotify(immediate);
  }

  /**
   * Called synchronously when {@linkcode validating} has changed. See
   * {@linkcode invalidChanged} for why {@linkcode immediate} is gated on
   * {@linkcode #constructing}.
   */
  validatingChanged(immediate = true): void {
    this.parent?.[kChildValidatingChanged](
      this,
      immediate && !this.#constructing,
    );
    this.#doNotify(immediate);
  }

  /**
   * Calls {@linkcode notify}, either synchronously or, if {@linkcode
   * immediate} is `false`, on a microtask instead.
   *
   * The deferred branch is used by {@linkcode invalidChanged}/
   * {@linkcode touchedChanged}/{@linkcode validatingChanged} for an ancestor
   * whose aggregate flipped because some descendant field bubbled a change up
   * to it while still constructing. That ancestor may already have subscribers
   * of its own (e.g. a submit button watching {@linkcode invalid}) from an
   * earlier render, and a synchronous `notify()` here would update those
   * subscribers in the middle of rendering the component that's constructing
   * the descendant field that triggered this. Deferring, rather than
   * dropping the notification outright, still lets those subscribers pick up
   * the change, just a tick later instead of mid-render.
   */
  #doNotify(immediate: boolean): void {
    if (immediate) {
      this.notify();
    } else {
      queueMicrotask(() => this.notify());
    }
  }

  /**
   * Called synchronously when {@linkcode value} has changed.
   */
  protected valueChanged(): void {
    this.#recomputeDirty();

    // Sync children down *before* scheduling this field's own
    // validation/notifying, so subscribers see a fully-settled tree by the
    // time `notify()` fires.
    if (!this.#bubblingFromChild) {
      for (const child of Array.from(this.#children.values())) {
        if (existsIn(this.value, child.name)) {
          child[kParentValueChanged]();
        } else {
          this.unregisterField(child.name as DeepKey<TValue>);
        }
      }
    }

    this.#scheduleValidation();
    this.#scheduleSchemaValidation();

    if (this.#notifiesParent) {
      this.parent?.[kChildValueChanged](this);
    }

    if (!this.#constructing) {
      this.#onValueChanged?.(this);
      this.notify();
    }
  }

  /**
   * Runs {@linkcode validators} immediately and sets {@linkcode error} from
   * the result. If every one passed and {@linkcode asyncValidator} is
   * configured, schedules it (debounced) and returns `true`; otherwise
   * settles it to `null`, discarding a stale in-flight/pending run from a
   * previous, faster generation so it can't later overwrite a fresher sync
   * error, and returns `false`.
   *
   * Runs nothing and settles straight to `null` while {@linkcode disabled}:
   * a disabled field is always valid.
   */
  #scheduleValidation(): boolean {
    if (this.disabled) {
      this.#syncError = null;
      this.#setError(null);
      this.#asyncValidatorTask.settle(null);
      return false;
    }

    this.#syncError = this.#runSyncValidators();
    this.#setError(this.#syncError);
    if (!this.#syncError && this.#asyncValidator) {
      this.#asyncValidatorTask.schedule();
      return true;
    }

    this.#asyncValidatorTask.settle(null);
    return false;
  }

  #scheduleSchemaValidation(): void {
    if (!this.disabled && this.#schemaValidator) {
      this.#schemaValidationTask.schedule();
    } else {
      this.#schemaValidationTask.settle(null);
    }
  }

  async #runSchemaValidator(): Promise<
    Partial<Record<DeepKeyOrRoot<TValue>, ValidationError>> | null
  > {
    if (!this.#schemaValidator) return null;
    try {
      return (await this.#schemaValidator(this)) ?? null;
    } catch (thrown) {
      this.#warnValidatorThrew("schemaValidator", thrown);
      return null;
    }
  }

  #setSchemaErrors(
    map: Partial<Record<DeepKeyOrRoot<TValue>, ValidationError>> | null,
  ): void {
    const normalized = map && Object.keys(map).length > 0 ? map : null;
    if (shallowEqual(normalized, this.#schemaErrorMap)) return;

    this.#schemaErrorMap = normalized;

    this.#refreshSchemaError();

    for (const child of this.#children.values()) {
      child[kParentSchemaErrorsChanged]();
    }
  }

  /**
   * Returns the {@linkcode FieldApi} registered under {@linkcode name}.
   *
   * Creating it (seeded from the corresponding slice of this field's
   * {@linkcode value}) on first call. On later calls with the same `name`,
   * applies {@linkcode options} (if given) to the existing field via
   * {@linkcode updateOptions} instead of creating a new one.
   *
   * `name` must be this field's path *relative to this field*: a
   * multi-segment path that bypasses an already-registered intermediate
   * field throws instead of silently registering a disconnected duplicate;
   * resolve the intermediate field first in that case.
   *
   * @example
   * ```ts
   * const email = form.field("email", {
   *   validators: [required("Email is required")],
   * });
   *
   * // A field nested under another: resolve the parent first, don't
   * // address "address.line1" directly from `form`.
   * const address = form.field("address");
   * const line1 = address.field("line1");
   * ```
   */
  field<TName extends DeepKey<TValue>>(
    name: TName,
    options?: FieldApiOptions<DeepValue<TValue, TName>, TValue>,
  ): FieldApi<DeepValue<TValue, TName>, TValue> {
    let f = this.#children.get(name) as
      | FieldApi<DeepValue<TValue, TName>, TValue>
      | undefined;

    if (!f) {
      this.#assertNoPathCollision(name);
      f = new FieldApi<DeepValue<TValue, TName>, TValue>(
        this as never,
        name,
        options,
      );
      this.#children.set(name, f as never);
      this.#notifyChildrenChanged();
    } else if (options) {
      f.updateOptions(options);
    }

    return f;
  }

  /**
   * Throws if registering a new entry under {@linkcode name} would collide
   * with an existing entry whose key is a dot-prefix of {@linkcode name}, or
   * vice versa: the two ways a dotted path can bypass (or be bypassed by)
   * an already-registered intermediate field, leaving two disconnected fields
   * tracking the same slice of value (e.g. calling `field("address.line1")`
   * directly after `field("address")` already registered `"address"`, or
   * vice versa). Only relevant when creating a new entry; an exact-match
   * lookup of an existing key is the normal re-fetch path and never reaches
   * here.
   */
  #assertNoPathCollision(name: string): void {
    for (const key of this.#children.keys() as Iterable<string>) {
      if (name.startsWith(`${key}.`)) {
        throw new Error(
          `Cannot register a child field at "${name}": "${key}" is already ` +
            `registered on this field. Resolve the intermediate field ` +
            `first, e.g. field("${key}").field(...), instead of ` +
            `addressing "${name}" directly.`,
        );
      }
      if (key.startsWith(`${name}.`)) {
        throw new Error(
          `Cannot register a child field at "${name}": "${key}" is already ` +
            `registered on this field as a flat path nested under "${name}". ` +
            `Register through "${key}" directly instead of creating an ` +
            `intermediate field at "${name}".`,
        );
      }
    }
  }

  /**
   * Registers {@linkcode cb} to be called whenever a field is registered
   * into or unregistered from {@linkcode children} (i.e. the *set* of
   * children changes).
   *
   * Doesn't trigger when an existing child's state changes, and not when array
   * re-keying (`swapItems`/`moveItem`) merely relabels existing children
   * without adding or removing any.
   *
   * This is meant for introspection tooling (e.g. devtools) that wants to know
   * when to re-walk {@linkcode children}. For normal state change subscription,
   * use {@linkcode subscribe}.
   *
   * Returns a function that unregisters {@linkcode cb}.
   *
   * @example
   * ```ts
   * const unsubscribe = form.onChildrenChanged(() => {
   *   console.log("children registry changed:", [...form.children.keys()]);
   * });
   * ```
   */
  onChildrenChanged(cb: VoidFunction): VoidFunction {
    this.#childrenChangeListeners.add(cb);
    return () => {
      this.#childrenChangeListeners.delete(cb);
    };
  }

  /**
   * Unregisters the field at {@linkcode name}: the counterpart to
   * {@linkcode field}.
   *
   * Destroys the field (cancelling its own pending debounced
   * validation and recursively destroying its own nested children, if any)
   * and removing it from {@linkcode children}.
   *
   * A no-op if nothing is registered at `name`, so it's safe to call
   * redundantly, e.g. from a `useEffect` cleanup that may run more than once.
   */
  unregisterField(name: DeepKey<TValue>): void {
    const child = this.#children.get(name);
    if (!child) return;

    child[kDestroy]();
    this.#children.delete(name);
    this.#notifyChildrenChanged();
    this.#recomputeChildAggregates();
  }

  #notifyChildrenChanged(): void {
    for (const cb of this.#childrenChangeListeners) cb();
  }

  //#region Array helpers
  // Every method below takes `name: DeepKeyOrRoot<TValue>`, not just names
  // of array-typed *fields* on this field, but also `""`, meaning "this
  // field's own value" (see `DeepKeyOrRoot`'s doc comment in `types.ts`).
  // Both forms are shown together on `pushItem` below; the rest work the
  // same way, just with different arguments after `name`.

  /**
   * Inserts {@linkcode item} at {@linkcode index} in the array at
   * {@linkcode name}, shifting later items up.
   *
   * `name` can be `""` to address this field's own value; see
   * {@linkcode pushItem}'s example.
   */
  insertItem<TName extends DeepKeyOrRoot<TValue>>(
    name: TName,
    index: DeepValue<TValue, TName> extends Array<unknown> ? number : never,
    item: DeepValue<TValue, TName> extends Array<infer E> ? E : never,
  ): void {
    // Re-key first so that when this assignment cascades into every
    // registered field's `kParentValueChanged`, each field's `.name` already
    // points at its new index and picks up the right slot of the new array.
    this.#rekeyArrayFields(name, (i) => i < index ? null : i + 1);

    this.value = updateIn(
      this.value,
      name,
      (prev) =>
        arrayInsert(prev as [], index, item) as DeepValue<TValue, TName>,
    );
  }

  /**
   * Moves the item at {@linkcode fromIndex} to {@linkcode toIndex}, shifting
   * every item strictly between the two indices one slot the other way to
   * close/open the gap, the same result as `Array#splice`-ing the item out
   * and back in elsewhere, unlike {@linkcode swapItems}, which only touches
   * the two endpoints.
   *
   * `name` can be `""` to address this field's own value; see
   * {@linkcode pushItem}'s example.
   */
  moveItem<TName extends DeepKeyOrRoot<TValue>>(
    name: TName,
    fromIndex: DeepValue<TValue, TName> extends Array<unknown> ? number : never,
    toIndex: DeepValue<TValue, TName> extends Array<unknown> ? number : never,
  ): void {
    const lo = Math.min(fromIndex, toIndex);
    const hi = Math.max(fromIndex, toIndex);
    const delta = fromIndex < toIndex ? -1 : 1;

    this.#rekeyArrayFields(name, (index) => {
      if (index < lo || index > hi) return null;
      return index === fromIndex ? toIndex : index + delta;
    });

    this.value = updateIn(
      this.value,
      name,
      (prev) =>
        arrayMove(prev as [], fromIndex, toIndex) as DeepValue<TValue, TName>,
    );
  }

  /**
   * Appends {@linkcode item} to the end of the array at {@linkcode name}.
   *
   * `name` can address a named array field on this field, or, pass `""`,
   * this field's own value, when the field itself already *is* the array. The
   * latter is what a reusable "array field" component built around a
   * `FieldApi<Item[]>` uses, so it stays generic over where in the tree it's
   * actually mounted.
   *
   * @example
   * ```ts
   * // Addressing a named array field from its parent:
   * form.pushItem("items", newItem);
   *
   * // Addressing this field's own value, when the field itself already IS
   * // the array, e.g. inside a reusable component that only ever
   * // receives a `FieldApi<Item[]>`, regardless of where it's mounted:
   * const itemsField = form.field("items");
   * itemsField.pushItem("", newItem);
   * ```
   */
  pushItem<TName extends DeepKeyOrRoot<TValue>>(
    name: TName,
    item: DeepValue<TValue, TName> extends Array<infer E> ? E : never,
  ): void {
    this.value = updateIn(
      this.value,
      name,
      (prev) => arrayPush(prev as [], item) as DeepValue<TValue, TName>,
    );
  }

  /**
   * Removes the item at {@linkcode index} from the array at {@linkcode name},
   * destroying its field(s) and shifting later items down.
   *
   * `name` can be `""` to address this field's own value; see
   * {@linkcode pushItem}'s example.
   */
  removeItem<TName extends DeepKeyOrRoot<TValue>>(
    name: TName,
    index: DeepValue<TValue, TName> extends Array<unknown> ? number : never,
  ): void {
    this.#destroyArrayItemChildren(name, index);
    this.#rekeyArrayFields(name, (i) => i <= index ? null : i - 1);
    this.value = updateIn(
      this.value,
      name,
      (prev) => arrayRemove(prev as [], index) as DeepValue<TValue, TName>,
    );
  }

  /**
   * Replaces the item at {@linkcode index} in the array at {@linkcode name}
   * with {@linkcode newItem}.
   *
   * `name` can be `""` to address this field's own value; see
   * {@linkcode pushItem}'s example.
   */
  replaceItem<TName extends DeepKeyOrRoot<TValue>>(
    name: TName,
    index: DeepValue<TValue, TName> extends Array<unknown> ? number : never,
    newItem: DeepValue<TValue, TName> extends Array<infer E> ? E : never,
  ): void {
    this.value = updateIn(
      this.value,
      name,
      (prev) =>
        arrayReplace(prev as [], index, newItem) as DeepValue<
          TValue,
          TName
        >,
    );
  }

  /**
   * Swaps the items at {@linkcode index1} and {@linkcode index2},
   * leaving every item in between untouched.
   *
   * `name` can be `""` to address this field's own value; see
   * {@linkcode pushItem}'s example.
   *
   * For a shift-based reorder (remove from one slot, insert at another,
   * shifting everything in between) use {@linkcode moveItem} instead.
   */
  swapItems<TName extends DeepKeyOrRoot<TValue>>(
    name: TName,
    index1: DeepValue<TValue, TName> extends Array<unknown> ? number : never,
    index2: DeepValue<TValue, TName> extends Array<unknown> ? number : never,
  ): void {
    this.#rekeyArrayFields(name, (i) => {
      return i === index1 ? index2 : i === index2 ? index1 : null;
    });

    this.value = updateIn(
      this.value,
      name,
      (prev) =>
        arraySwap(prev as [], index1, index2) as DeepValue<TValue, TName>,
    );
  }

  /**
   * The prefix a registered field's key must start with to be one of
   * {@linkcode base}'s own array items (or a nested child of one): `""`
   * itself (not `"."`) when `base` is `""`, since a self-addressed array's
   * item keys are the bare index (`"0"`, `"0.label"`), with no leading dot.
   */
  #arrayKeyPrefix(base: DeepKeyOrRoot<TValue>): string {
    return base === "" ? "" : `${base}.`;
  }

  /**
   * Re-keys every registered field under {@linkcode base} (including nested
   * children registered under a deeper path, e.g. `items.1.label`) whose own
   * array index is mapped to a new one determined by {@linkcode remapIndex}.
   *
   * Used by {@linkcode insertItem}, {@linkcode moveItem},
   * {@linkcode removeItem}, and {@linkcode swapItems}, which differ only in
   * what `remapIndex` does: return the field's new index, or `null` to leave it
   * untouched (out of the affected range).
   */
  #rekeyArrayFields(
    base: DeepKeyOrRoot<TValue>,
    remapIndex: (index: number) => number | null,
  ): void {
    const updated = new Map<
      DeepKey<TValue>,
      FieldApi<DeepValue<TValue, DeepKey<TValue>>, TValue>
    >();
    const prefix = this.#arrayKeyPrefix(base);

    for (const field of this.#children.values()) {
      const key = field.name as DeepKey<TValue>;
      if (!(key as string).startsWith(prefix)) {
        updated.set(key, field);
        continue;
      }

      const [segment, suffix] = splitFirstSegment(
        (key as string).slice(prefix.length),
      );
      const index = Number(segment);
      const newIndex = Number.isInteger(index) ? remapIndex(index) : null;

      if (newIndex === null) {
        updated.set(key, field);
        continue;
      }

      const newKey = `${prefix}${newIndex}${suffix}`;
      updated.set(newKey as DeepKey<TValue>, field);
      field[kSetName](newKey as DeepKey<TValue>);
    }

    this.#children = updated;
  }

  /**
   * Destroys the field registered for the array item at {@linkcode index}
   * (and any of its nested children registered under a deeper path), so it
   * doesn't collide with {@linkcode removeItem}'s own re-keying shifting the
   * following items down into its slot.
   */
  #destroyArrayItemChildren(base: DeepKeyOrRoot<TValue>, index: number): void {
    const itemKey = `${this.#arrayKeyPrefix(base)}${index}`;
    const itemKeyPrefix = `${itemKey}.`;

    for (const field of Array.from(this.#children.values())) {
      const key = field.name as string;
      if (key === itemKey || key.startsWith(itemKeyPrefix)) {
        this.unregisterField(key as DeepKey<TValue>);
      }
    }
  }

  //#endregion

  //#region Methods called by children to notify of their changes.

  /**
   * @internal
   *
   * Called by a child when its {@linkcode invalid} property has changed.
   *
   * {@linkcode immediate} is `false` when the source of the change is a
   * descendant field under construction.
   */
  [kChildInvalidChanged]<ChildValue>(
    child: FieldApi<ChildValue, TValue>,
    immediate = true,
  ): void {
    const oldInvalid = this.invalid;
    this.#anyChildInvalid = child.invalid || this.#anyChild((f) => f.invalid);
    if (this.invalid !== oldInvalid) this.invalidChanged(immediate);
  }

  /**
   * @internal
   *
   * Called by a child when its {@linkcode touched} property has changed. See
   * {@linkcode kChildInvalidChanged} for why {@linkcode immediate} is
   * sometimes `false`.
   */
  [kChildTouchedChanged]<ChildValue>(
    child: FieldApi<ChildValue, TValue>,
    immediate = true,
  ): void {
    const oldTouched = this.touched;
    this.#anyChildTouched = child.touched || this.#anyChild((f) => f.touched);
    if (this.touched !== oldTouched) this.touchedChanged(immediate);
  }

  /**
   * @internal
   *
   * Called by a child when its {@linkcode validating} property has changed.
   * See {@linkcode kChildInvalidChanged} for why {@linkcode immediate} is
   * sometimes `false`.
   */
  [kChildValidatingChanged]<ChildValue>(
    child: FieldApi<ChildValue, TValue>,
    immediate = true,
  ): void {
    const oldValidating = this.validating;
    this.#anyChildValidating = child.validating ||
      this.#anyChild((f) => f.validating);
    if (this.validating !== oldValidating) this.validatingChanged(immediate);
  }

  /**
   * @internal
   *
   * Called by a child when its {@linkcode value} property has changed.
   */
  [kChildValueChanged]<ChildValue>(
    child: FieldApi<ChildValue, TValue>,
  ): void {
    const prevBubbling = this.#bubblingFromChild;
    this.#bubblingFromChild = true;
    this.value = setIn(this.value, child.name, child.value as never);
    this.#bubblingFromChild = prevBubbling;

    this.#validateDependents(child);
  }

  #anyChild(
    predicate: (
      f: FieldApi<DeepValue<TValue, DeepKey<TValue>>, TValue>,
    ) => boolean,
  ): boolean {
    for (const f of this.#children.values()) {
      if (predicate(f)) return true;
    }
    return false;
  }

  #validateDependents<ChildValue>(
    child: FieldApi<ChildValue, TValue>,
  ): void {
    for (const name of child.dependents) {
      this.#children.get(name)?.validate(true);
    }
  }

  /**
   * Recomputes {@linkcode invalid}/{@linkcode touched}/{@linkcode validating}
   * from the current set of {@linkcode children}, notifying for whichever of
   * them actually changed as a result.
   *
   * Used when a child is removed from the registry.
   */
  #recomputeChildAggregates(): void {
    const oldInvalid = this.invalid;
    const oldTouched = this.touched;
    const oldValidating = this.validating;

    this.#anyChildInvalid = this.#anyChild((f) => f.invalid);
    this.#anyChildTouched = this.#anyChild((f) => f.touched);
    this.#anyChildValidating = this.#anyChild((f) => f.validating);

    // Up to three independent flags can flip here; batch them so
    // subscribers (this instance's and, via propagation to `parent`, any
    // ancestor's) see one notification instead of up to three synchronous
    // ones for what is a single logical change.
    this.batch(() => {
      if (this.invalid !== oldInvalid) this.invalidChanged();
      if (this.touched !== oldTouched) this.touchedChanged();
      if (this.validating !== oldValidating) this.validatingChanged();
    });
  }
  //#endregion

  /**
   * @internal
   *
   * Called by the parent when its own value changes, to keep this field's
   * value in sync with the corresponding slice of the parent's value (e.g.
   * after a wholesale `parent.value = ...` replacement, not just edits
   * originating from this field itself).
   */
  [kParentValueChanged](): void {
    this.#setValueNoParentNotify(
      getIn(this.parent!.value, this.name) as TValue,
    );
  }

  /**
   * @internal
   *
   * Called by {@linkcode parent} when its own `initialValue` has changed.
   *
   * Recomputes {@linkcode dirty} and cascades down to children.
   */
  [kParentInitialValueChanged](): void {
    this.#recomputeDirty();
    for (const child of this.#children.values()) {
      child[kParentInitialValueChanged]();
    }
  }

  /**
   * Recomputes {@linkcode dirty} and, if it actually changed, updates the
   * cache and notifies.
   */
  #recomputeDirty(): void {
    const dirty = !deepEqual(this.value, this.initialValue);
    if (dirty === this.#dirty) return;
    this.#dirty = dirty;
    this.notify();
  }

  /**
   * @internal
   *
   * Called by {@linkcode parent} when its own `schemaErrorMap` has changed.
   *
   * Refreshes {@linkcode schemaError} and cascades downs to children.
   */
  [kParentSchemaErrorsChanged](): void {
    this.#refreshSchemaError();
    for (const child of this.#children.values()) {
      child[kParentSchemaErrorsChanged]();
    }
  }

  /**
   * Recomputes {@linkcode schemaError} and, if it actually changed, updates
   * the cache and notifies.
   */
  #refreshSchemaError(): void {
    const schemaError = this.#computeSchemaError();
    if (schemaError === this.#schemaError) return;

    const oldInvalid = this.invalid;
    this.#schemaError = schemaError;
    if (this.invalid !== oldInvalid) {
      this.invalidChanged();
    } else {
      this.notify();
    }
  }

  #computeSchemaError(): ValidationError {
    return this.#schemaErrorMap?.[""] ??
      this.parent?.[kResolveSchemaError](this.name) ?? null;
  }

  /**
   * @internal
   *
   * Resolves `path` (dot-joined, relative to this field) against this
   * field's own {@linkcode schemaErrorMap} if a {@linkcode schemaValidator}
   * is configured here: a configured validator at this level always wins
   * over one further up, even if its last result was clean.
   *
   * Otherwise climbs into {@linkcode parent} with `path` prefixed by this
   * field's own `name`, returning `undefined` once it reaches the root with
   * no owning ancestor found.
   */
  [kResolveSchemaError](path: string): ValidationError | undefined {
    return this.#schemaValidator
      ? this.#schemaErrorMap?.[path as never] ?? null
      : this.parent?.[kResolveSchemaError](`${this.name}.${path}`);
  }

  /**
   * @internal
   *
   * Should only be called by this class's own array methods.
   */
  [kSetName](name: DeepKey<TParentValue>): void {
    this.#name = name;
  }

  /**
   * @internal
   *
   * Sets {@linkcode value} without notifying the parent of the change.
   *
   * Used when the parent itself is the source of the update (its
   * `kParentValueChanged` handler), to avoid a redundant round-trip back
   * into the parent's own value.
   *
   * Saves/restores the previous flag value (rather than unconditionally
   * resetting it) so a reentrant, genuinely user-driven edit triggered
   * synchronously by this one (e.g. a subscriber clamping/normalizing the
   * value) still correctly notifies the parent.
   */
  #setValueNoParentNotify(v: TValue): void {
    const prevNotifiesParent = this.#notifiesParent;
    this.#notifiesParent = false;
    this.value = v;
    this.#notifiesParent = prevNotifiesParent;
  }
}
