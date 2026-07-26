/**
 * React hook that orchestrates a multi-step ("wizard") form on top of one
 * step per named {@linkcode FieldApi}, via {@linkcode useMultistep}.
 *
 * @module
 */

import { useState } from "react";
import type {
  DeepKey,
  DeepValue,
  FieldApi,
  FormApi,
  PromiseOr,
} from "@kin-form/core/index.ts";
import { type FieldSelector, useWatch } from "./useWatch.ts";

/** Options for {@linkcode useMultistep}. */
export type UseMultistepOptions<
  TValue,
  TSteps extends readonly (DeepKey<TValue> | null)[],
> = {
  /** Which step to start on. Defaults to `0`. */
  initialStep?: number;
  /**
   * Runs after the current step's own field passes validation but before
   * the step actually advances — the hook to persist progress (e.g. save a
   * draft to the server) alongside the transition, or to branch: returning
   * a step name (or `null`, for a step with no field) redirects `next()`
   * there instead of the next linear index.
   *
   * Returning `false` cancels the advance, leaving `stepIndex` unchanged.
   * 
   * Should not throw — a thrown error still propagates as a rejected
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
   * `jump()` alike. Purely informational — unlike `onBeforeNext`, it can't
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
// instantiated with a union (e.g. `TSteps[number]`) — the same trick
// `DeepKey`/`DeepValue` themselves rely on (core/types.ts) — producing one
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

/** Return type of {@linkcode useMultistep}. */
export type Multistep<
  TValue,
  TSteps extends readonly (DeepKey<TValue> | null)[],
> =
  & {
    /**
     * The current step index.
     */
    stepIndex: number;
    /**
     * The number of steps, i.e. `stepNames.length`.
     */
    stepCount: number;
    /**
     * Whether an async {@linkcode UseMultistepOptions.onBeforeNext onBeforeNext}
     * triggered by `next()` is currently pending.
     */
    isTransitioning: boolean;
    /**
     * Whether {@linkcode Multistep.stepIndex stepIndex} is `0`.
     */
    isFirstStep: boolean;
    /**
     * Whether {@linkcode Multistep.stepIndex stepIndex} is the last index in
     * `stepNames`.
     */
    isLastStep: boolean;
    /**
     * Validates the current step's field (touching it so errors on
     * never-blurred fields become visible),
     * runs {@linkcode UseMultistepOptions.onBeforeNext onBeforeNext}, and
     * advances {@linkcode Multistep.stepIndex stepIndex} only if both pass.
     * Resolves to whether it advanced.
     */
    next: () => Promise<boolean>;
    /**
     * Moves to the previous step, if any — never validates.
     */
    back: () => void;
    /**
     * Jumps to an arbitrary step — by index or by step name — never
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
 * {@linkcode FieldApi} — validating the current step, waiting for it to
 * settle, and gating the advance, so a hand-rolled wizard doesn't have to
 * repeat that per step.
 *
 * {@linkcode stepNames} entries are the `DeepKey<TValue>` of each step's own
 * field, or `null` for a step with no field of its own (e.g. a final review
 * screen) — `next()` treats a `null` step as always valid, skipping straight
 * to {@linkcode UseMultistepOptions.onBeforeNext}.
 *
 * If `stepNames` is stored in a variable rather than passed as an inline
 * array literal, declare that variable with `as const` to keep it type-safe.
 */
export function useMultistep<
  TValue,
  const TSteps extends readonly (DeepKey<TValue> | null)[],
>(
  form: FormApi<TValue>,
  stepNames: TSteps,
  options: UseMultistepOptions<TValue, TSteps> = {},
): Multistep<TValue, TSteps> {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stepIndex, setStepIndex] = useState(options.initialStep ?? 0);
  const stepName = stepNames[stepIndex] as TSteps[number];
  const stepField = stepName === null ? null : form.field(stepName);

  type StepValue = DeepValue<TValue, TSteps[number]>;

  const select: FieldSelector<StepValue, TValue, [boolean, boolean] | null> =
    stepField ? (f) => [f.invalid, f.validating] : () => null;

  // Re-render when the *current* step's own field flips invalid/validating
  // (e.g. to disable "Next"). `() => null` is an inert selector for a `null`
  // step.
  //
  // The cast is needed as the union of `FieldApi<...>`/`FormApi<TValue>` this
  // can hold isn't one any single overload accepts, but every concrete case the
  // union covers is individually valid.
  useWatch((stepField ?? form) as FieldApi<StepValue, TValue>, select);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === stepNames.length - 1;

  const moveTo = (to: number): void => {
    setStepIndex(to);
    options.onStepChanged?.({
      form,
      prevStepIndex: stepIndex,
      prevStepName: stepName,
      stepIndex: to,
      stepName: stepNames[to],
    });
  };

  const next = async (): Promise<boolean> => {
    if (stepField) {
      if (stepField.validating) {
        await stepField.waitForValidation();
      }
      if (stepField.invalid) {
        stepField.touched = true;
        return false;
      }
    }

    let decision = options.onBeforeNext?.({ form, stepIndex, stepName });

    if (decision instanceof Promise) {
      setIsTransitioning(true);
      try {
        decision = await decision;
      } finally {
        setIsTransitioning(false);
      }
    }

    if (decision === false) return false;

    // Anything other than `true`/`undefined` (`void`) is a step name (or
    // `null`) to redirect to, rather than "proceed to the next linear index".
    if (decision !== undefined && decision !== true) {
      jump(decision);
      return true;
    }

    if (isLastStep) return false;

    moveTo(stepIndex + 1);
    return true;
  };

  const jump = (target: number | TSteps[number]): void => {
    const to = typeof target === "number" ? target : stepNames.indexOf(target);
    if (to < 0 || to >= stepNames.length) {
      throw new Error(
        typeof target === "number"
          ? `Step index ${target} is out of range (0-${stepNames.length - 1}).`
          : `Unknown step name "${String(target)}".`,
      );
    }
    if (to !== stepIndex) moveTo(to);
  };

  const back = (): void => {
    if (!isFirstStep) jump(stepIndex - 1);
  };

  // The branches above compute `stepName`/`stepField` as a plain
  // (non-discriminated) pairing, not TS-provably one of `Step`'s
  // union members — same reason `useWatch`'s cast above is needed.
  return {
    stepIndex,
    stepCount: stepNames.length,
    stepName,
    stepField,
    isTransitioning,
    isFirstStep,
    isLastStep,
    next,
    back,
    jump,
  } as unknown as Multistep<TValue, TSteps>;
}
