/**
 * Debouncing and coalescing of concurrent/repeated async runs, via
 * {@linkcode DebouncedTask}.
 *
 * @module
 */

import type { PromiseOr } from "../types.ts";

/**
 * Runs an async {@linkcode task}, debouncing and coalescing repeated
 * requests to run it so that, no matter how many times {@linkcode schedule}
 * or {@linkcode run} is called, the underlying `task` is invoked at most
 * once per "generation" (the state between two calls that actually change
 * anything).
 *
 * Every caller, whether it triggered the run itself or merely called in
 * while one was already in flight, resolves to the result of whichever run
 * turns out to be the last one requested, never a stale one abandoned
 * mid-flight.
 */
export class DebouncedTask<T> {
  #task: (isAborted: () => boolean) => PromiseOr<T>;
  #delayMs: number;
  #onSettled?: (result: T, wasPending: boolean) => void;
  #onPending?: () => void;

  #generation = 0;
  #settledGeneration = 0;
  #runningGeneration?: number;
  #lastResult: T;
  #timer?: ReturnType<typeof setTimeout>;
  #promise?: Promise<T>;
  #resolve?: (result: T) => void;

  constructor(
    task: (isAborted: () => boolean) => PromiseOr<T>,
    initialResult: T,
    options: {
      delayMs?: number;
      /**
       * Called synchronously exactly once whenever a run genuinely
       * completes (not when a call merely joins an already in-flight or
       * already-settled run).
       *
       * `wasPending` reflects whether {@linkcode pending} was `true` right
       * before this settle: i.e. whether this call is *also* the moment
       * `pending` flips back to `false`. Bundled into this single callback
       * (rather than firing as a separate `pending`-transition callback,
       * the way becoming pending does via `onPending`) so a caller that
       * needs to react to both the result and the `pending` transition can
       * do so in one place (e.g. batched together, instead of as two
       * separately-notifying callbacks), since a task can only stop being
       * pending by settling, the two always coincide.
       */
      onSettled?: (result: T, wasPending: boolean) => void;
      /** Called synchronously when {@linkcode pending} flips to `true`, i.e. a fresh generation starts. */
      onPending?: () => void;
    } = {},
  ) {
    this.#task = task;
    this.#lastResult = initialResult;
    this.#delayMs = options.delayMs ?? 0;
    this.#onSettled = options.onSettled;
    this.#onPending = options.onPending;
  }

  /** Whether a run is currently scheduled (debouncing) or in flight. */
  get pending(): boolean {
    return this.#settledGeneration !== this.#generation;
  }

  /** The result of the last run to settle (or {@linkcode initialResult} if none has yet). */
  get lastResult(): T {
    return this.#lastResult;
  }

  /**
   * Marks the input as changed: starts a new generation and (re)schedules a
   * debounced call to {@linkcode run}.
   */
  schedule(): void {
    clearTimeout(this.#timer);
    // Must read `pending` before bumping `#generation` below; once bumped,
    // `#settledGeneration !== #generation` unconditionally, so `pending`
    // would just read back `true` regardless of what it actually was.
    const wasPending = this.pending;
    this.#generation++;
    if (!wasPending) this.#onPending?.();

    this.#promise ??= new Promise((resolve) => {
      this.#resolve = resolve;
    });

    this.#timer = setTimeout(() => this.run(), this.#delayMs);
  }

  /**
   * Bypasses running {@linkcode task}, immediately settling the current
   * generation with {@linkcode result} instead, for callers that already
   * know the outcome out-of-band (e.g. "there's nothing configured to
   * check"), without waiting out the debounce delay.
   */
  settle(result: T): void {
    clearTimeout(this.#timer);
    // Same ordering constraint as `schedule()` above: snapshot `pending`
    // before bumping `#generation`, or it'll just read back `true`.
    const wasPending = this.pending;
    this.#generation++;
    this.#applySettled(result, wasPending);
  }

  /** Cancels any pending debounced run without settling it. */
  cancel(): void {
    clearTimeout(this.#timer);
  }

  /**
   * Updates the debounce delay used by future {@linkcode schedule} calls.
   * Does not affect a timer already ticking down from a previous
   * `schedule()` call.
   */
  setDelay(delayMs: number): void {
    this.#delayMs = delayMs;
  }

  /**
   * Runs (or joins an already-running or already-settled) {@linkcode task}
   * for the current generation. Safe to call redundantly and concurrently:
   * `task` is invoked at most once per generation.
   */
  async run(): Promise<T> {
    if (this.#settledGeneration === this.#generation) {
      return this.#lastResult;
    }

    // Capture the shared promise now, rather than re-reading `#promise`
    // after the `await` below, since a concurrent call settling this same
    // generation first would have already cleared it.
    const pending = this.#promise;

    if (this.#runningGeneration === this.#generation) {
      return pending as Promise<T>;
    }

    const generation = this.#generation;
    this.#runningGeneration = generation;
    const isAborted = () => generation !== this.#generation;

    const result = await this.#task(isAborted);

    if (isAborted()) {
      return pending as Promise<T>;
    }

    // Reaching here (past the early-return above) means this generation
    // wasn't already settled, i.e. it was genuinely pending.
    this.#applySettled(result, true);
    return result;
  }

  /**
   * Cancels the debounce delay and immediately runs (or joins an
   * already-running, or already-settled) {@linkcode task} for the current
   * generation: same as {@linkcode run}, but without waiting out
   * {@linkcode delayMs} first.
   *
   * Use this for triggers that are themselves naturally infrequent (e.g. a
   * blur event), where the debounce serves no coalescing purpose and only
   * adds latency.
   */
  flush(): Promise<T> {
    clearTimeout(this.#timer);
    return this.run();
  }

  /**
   * Forces a fresh run even if the current generation has already
   * settled, unlike {@linkcode run}, which just returns
   * {@linkcode lastResult} in that case. Still debounced by
   * {@linkcode delayMs} like any other {@linkcode schedule} call; use
   * {@linkcode flush} too if the caller also wants to bypass that.
   *
   * For a caller that knows something {@linkcode task} depends on changed
   * out of band: a value {@linkcode task} reads but that isn't reflected in
   * whatever normally triggers {@linkcode schedule}.
   */
  forceRun(): Promise<T> {
    this.schedule();
    return this.#promise!;
  }

  /** Resolves once the outstanding run (if any) settles. */
  wait(): Promise<T> {
    return this.#promise ?? Promise.resolve(this.#lastResult);
  }

  #applySettled(result: T, wasPending: boolean): void {
    this.#settledGeneration = this.#generation;
    this.#runningGeneration = undefined;
    this.#lastResult = result;
    const resolve = this.#resolve;
    this.#promise = undefined;
    this.#onSettled?.(result, wasPending);
    resolve?.(result);
  }
}
