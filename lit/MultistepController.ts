/**
 * A `ReactiveController` that orchestrates a multi-step ("wizard") form on
 * top of one step per named {@linkcode FieldApi}, via
 * {@linkcode MultistepController}.
 *
 * @module
 */

import type { ReactiveController, ReactiveControllerHost } from "lit";
import { shallowEqual } from "@kintools/form-core";
import type {
  DeepKey,
  DeepValue,
  FieldApi,
  FormApi,
  PromiseOr,
} from "@kintools/form-core";
import { SelectSubscription } from "./_select-subscription.ts";

/** Options for {@linkcode MultistepController}. */
export type MultistepControllerOptions<
  TValue,
  TSteps extends readonly (DeepKey<TValue> | null)[],
> = {
  /** Which step to start on. Defaults to `0`. */
  initialStep?: number;
  /**
   * Runs after the current step's own field passes validation but before
   * the step actually advances: the hook to persist progress (e.g. save a
   * draft to the server) alongside the transition, or to branch: returning
   * a step name (or `null`, for a step with no field) redirects `next()`
   * there instead of the next linear index.
   *
   * Returning `false` cancels the advance, leaving `stepIndex` unchanged.
   *
   * Should not throw: a thrown error still propagates as a rejected
   * `next()` promise for the caller to handle, but catch it here and return
   * `false` instead where possible.
   */
  onBeforeNext?: (
    ctx: {
      form: FormApi<TValue>;

      /** The current step index. */
      stepIndex: number;

      /** The current step name. */
      stepName: TSteps[number];
    },
  ) => PromiseOr<boolean | void | TSteps[number]>;
  /**
   * Runs after `stepIndex` actually changes, from `next()`, `back()`, or
   * `jump()` alike. Purely informational: unlike `onBeforeNext`, it can't
   * cancel anything.
   */
  onStepChanged?: (
    ctx: {
      form: FormApi<TValue>;
      /** The previous step index. */
      prevStepIndex: number;
      /** The previous step name. */
      prevStepName: TSteps[number];
      /** The current step index. */
      stepIndex: number;
      /** The current step name. */
      stepName: TSteps[number];
    },
  ) => void;
};

// One member per possible `stepNames` entry: `null` narrows `field` to
// `undefined`, and each `TName` narrows it to that step's own field type.
// `TName` is bare in the conditional, so this distributes automatically when
// instantiated with a union (e.g. `TSteps[number]`), the same trick
// `DeepKey`/`DeepValue` themselves rely on (core/types.ts), producing one
// union member per step instead of a single type with `field` typed as the
// union of every step's value type.
type Step<TValue, TName extends DeepKey<TValue> | null> = TName extends null ? {
    stepName: null;
    stepField: null;
  }
  : {
    /** The current step name. */
    stepName: TName;
    /** The current step's {@linkcode FieldApi}. */
    stepField: FieldApi<DeepValue<TValue, TName>, TValue>;
  };

/** Return type of `new MultistepController(...)`. */
export type MultistepController<
  TValue,
  TSteps extends readonly (DeepKey<TValue> | null)[],
> =
  & {
    /**
     * The current step index.
     */
    readonly stepIndex: number;
    /**
     * The number of steps, i.e. `stepNames.length`.
     */
    readonly stepCount: number;
    /**
     * Whether an async {@linkcode MultistepControllerOptions.onBeforeNext
     * onBeforeNext} triggered by `next()` is currently pending.
     */
    readonly isTransitioning: boolean;
    /**
     * Whether {@linkcode MultistepController.stepIndex stepIndex} is `0`.
     */
    readonly isFirstStep: boolean;
    /**
     * Whether {@linkcode MultistepController.stepIndex stepIndex} is the
     * last index in `stepNames`.
     */
    readonly isLastStep: boolean;
    /**
     * Validates the current step's field (touching it so errors on
     * never-blurred fields become visible),
     * runs {@linkcode MultistepControllerOptions.onBeforeNext onBeforeNext},
     * and advances {@linkcode MultistepController.stepIndex stepIndex} only
     * if both pass. Resolves to whether it advanced.
     */
    next: () => Promise<boolean>;
    /**
     * Moves to the previous step, if any; never validates.
     */
    back: () => void;
    /**
     * Jumps to an arbitrary step, by index or by step name; never
     * validates.
     *
     * Throws if given an index out of range or a step name not present in
     * `stepNames`.
     */
    jump: (target: number | TSteps[number]) => void;
  }
  & Step<TValue, TSteps[number]>;

/**
 * Orchestrates a wizard's `stepIndex` state on top of one step per named
 * {@linkcode FieldApi}: validating the current step, waiting for it to
 * settle, and gating the advance, so a hand-rolled wizard doesn't have to
 * repeat that per step.
 *
 * The `useMultistep` equivalent for Lit: `host` is typically the
 * `ReactiveElement` calling this from a field initializer, so `stepIndex`
 * and friends stay in sync with `render()` the same way `WatchController`
 * does.
 *
 * `stepNames` entries are the `DeepKey<TValue>` of each step's own field, or
 * `null` for a step with no field of its own (e.g. a final review screen).
 * `next()` treats a `null` step as always valid, skipping straight to
 * {@linkcode MultistepControllerOptions.onBeforeNext}.
 *
 * If `stepNames` is stored in a variable rather than passed as an inline
 * array literal, declare that variable with `as const` to keep it
 * type-safe.
 *
 * @example
 * ```ts
 * class MyWizard extends LitElement {
 *   #form = new FormApi({
 *     initialValue: { account: { email: "" }, profile: { name: "" } },
 *   });
 *   #step = new MultistepController(this, this.#form, ["account", "profile"]);
 *
 *   override render() {
 *     return html`
 *       <span>Step ${this.#step.stepIndex + 1} of ${this.#step.stepCount}</span>
 *       <button @click=${this.#step.back} ?disabled=${this.#step.isFirstStep}>
 *         Back
 *       </button>
 *       <button @click=${this.#step.next}>
 *         ${this.#step.isLastStep ? "Submit" : "Next"}
 *       </button>
 *     `;
 *   }
 * }
 * ```
 */
// A construct-signature interface rather than a real generic class's own
// constructor, for the same reason `WatchController` (WatchController.ts)
// is: the precise `Step`-discriminated return shape isn't one a class's own
// constructor overloads can bind its type parameters to (they can only bind
// to what appears directly in the matched overload's params).
// `MultistepController` is declared against this interface instead and
// `MultistepControllerImpl` is cast into place below.
interface MultistepControllerCtor {
  new <TValue, const TSteps extends readonly (DeepKey<TValue> | null)[]>(
    host: ReactiveControllerHost,
    form: FormApi<TValue>,
    stepNames: TSteps,
    options?: MultistepControllerOptions<TValue, TSteps>,
  ): MultistepController<TValue, TSteps>;
}

// The internal, type-erased counterpart of `MultistepControllerOptions`:
// `stepName`/`prevStepName` widen to `unknown` and the callbacks' return
// types widen accordingly, since `MultistepControllerImpl` (below) has no
// concrete `TValue`/`TSteps` to stay precise against. `MultistepController`
// casts a caller's `MultistepControllerOptions<TValue, TSteps>` down to this
// at the boundary.
type AnyMultistepOptions = {
  initialStep?: number;
  onBeforeNext?: (
    // deno-lint-ignore no-explicit-any
    ctx: { form: FormApi<any>; stepIndex: number; stepName: unknown },
  ) => PromiseOr<boolean | void | unknown>;
  onStepChanged?: (
    ctx: {
      // deno-lint-ignore no-explicit-any
      form: FormApi<any>;
      prevStepIndex: number;
      prevStepName: unknown;
      stepIndex: number;
      stepName: unknown;
    },
  ) => void;
};

// Loosely typed internally, for the same reason `WatchControllerImpl`
// (WatchController.ts) is: the precise `Step`-discriminated shape isn't one
// a single implementation can satisfy without erasing it first, so
// `MultistepController` is declared against `MultistepControllerCtor` above
// and this class is cast into place at the bottom of the file instead.
class MultistepControllerImpl implements ReactiveController {
  get stepIndex(): number {
    return this.#stepIndex;
  }

  get stepCount(): number {
    return this.#stepNames.length;
  }

  get stepName(): unknown {
    return this.#stepNames[this.#stepIndex];
  }

  // deno-lint-ignore no-explicit-any
  get stepField(): FieldApi<any, any> | null {
    const name = this.#stepNames[this.#stepIndex];
    // deno-lint-ignore no-explicit-any
    return name === null ? null : this.#form.field(name as never) as any;
  }

  get isTransitioning(): boolean {
    return this.#isTransitioning;
  }

  get isFirstStep(): boolean {
    return this.#stepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.#stepIndex === this.#stepNames.length - 1;
  }

  readonly next = async (): Promise<boolean> => {
    const stepIndex = this.#stepIndex;
    const stepName = this.#stepNames[stepIndex];
    const stepField = this.stepField;

    if (stepField) {
      if (stepField.validating) {
        await stepField.waitForValidation();
      }
      if (stepField.invalid) {
        stepField.touched = true;
        return false;
      }
    }

    let decision = this.#options.onBeforeNext?.({
      form: this.#form,
      stepIndex,
      stepName,
    });

    if (decision instanceof Promise) {
      this.#isTransitioning = true;
      this.#host.requestUpdate();
      try {
        decision = await decision;
      } finally {
        this.#isTransitioning = false;
        this.#host.requestUpdate();
      }
    }

    if (decision === false) return false;

    // Anything other than `true`/`undefined` (`void`) is a step name (or
    // `null`) to redirect to, rather than "proceed to the next linear index".
    if (decision !== undefined && decision !== true) {
      this.jump(decision);
      return true;
    }

    if (stepIndex === this.#stepNames.length - 1) return false;

    this.#moveTo(stepIndex + 1);
    return true;
  };

  readonly back = (): void => {
    if (!this.isFirstStep) this.jump(this.#stepIndex - 1);
  };

  readonly jump = (target: unknown): void => {
    const to = typeof target === "number"
      ? target
      : this.#stepNames.indexOf(target as never);
    if (to < 0 || to >= this.#stepNames.length) {
      throw new Error(
        typeof target === "number"
          ? `Step index ${target} is out of range (0-${
            this.#stepNames.length - 1
          }).`
          : `Unknown step name "${String(target)}".`,
      );
    }
    if (to !== this.#stepIndex) this.#moveTo(to);
  };

  readonly #host: ReactiveControllerHost;
  // deno-lint-ignore no-explicit-any
  readonly #form: FormApi<any>;
  readonly #stepNames: readonly unknown[];
  readonly #options: AnyMultistepOptions;
  readonly #subscription: SelectSubscription;

  #stepIndex: number;
  #isTransitioning = false;

  constructor(
    host: ReactiveControllerHost,
    // deno-lint-ignore no-explicit-any
    form: FormApi<any>,
    stepNames: readonly unknown[],
    options: AnyMultistepOptions = {},
  ) {
    this.#host = host;
    this.#form = form;
    this.#stepNames = stepNames;
    this.#options = options;
    this.#stepIndex = options.initialStep ?? 0;
    this.#subscription = new SelectSubscription(() => host.requestUpdate());
    this.#configureSubscription();
    host.addController(this);
  }

  hostConnected(): void {
    this.#subscription.sync();
  }

  // Re-checked on every host update, mirroring `WatchController`: the
  // current step's own field can change out from under this controller
  // (e.g. `stepIndex` moved via `next()`/`back()`/`jump()`), so the
  // subscription target is recomputed here rather than fixed once at
  // construction.
  hostUpdate(): void {
    this.#configureSubscription();
    this.#subscription.sync();
  }

  hostDisconnected(): void {
    this.#subscription.unsubscribe();
  }

  // Re-renders on the *current* step's own field flipping
  // invalid/validating (e.g. to disable "Next"). Subscribing to `#form`
  // with a constant `null` select is an inert stand-in for a `null` step,
  // matching `useMultistep`'s `useWatch(stepField ?? form, select)`.
  #configureSubscription(): void {
    const stepField = this.stepField;
    this.#subscription.configure(
      () => stepField ?? this.#form,
      stepField
        ? (
          api,
        ) => [
          (api as typeof stepField).invalid,
          (api as typeof stepField).validating,
        ]
        : () => null,
      shallowEqual,
    );
  }

  #moveTo(to: number): void {
    const prevStepIndex = this.#stepIndex;
    const prevStepName = this.#stepNames[prevStepIndex];
    this.#stepIndex = to;
    this.#host.requestUpdate();
    this.#options.onStepChanged?.({
      form: this.#form,
      prevStepIndex,
      prevStepName,
      stepIndex: to,
      stepName: this.#stepNames[to],
    });
  }
}

export const MultistepController =
  MultistepControllerImpl as unknown as MultistepControllerCtor;
