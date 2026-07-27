/**
 * This module defines {@linkcode BaseApi} - a pub/sub primitive served as the
 * foundation of Kin Form.
 * @module
 */

/**
 * A pub/sub primitive: subscribe to {@linkcode subscribe} and be notified on
 * every {@linkcode notify} call, with {@linkcode batch} available to coalesce
 * multiple notifications into one flush.
 */
export abstract class BaseApi {
  /**
   * The ultimate ancestor of `this`: the instance whose {@linkcode batch}
   * bookkeeping a {@linkcode notify} on `this` should use.
   *
   * Defaults to `this`. `FieldApi` overrides this to walk up to its
   * ultimate `parent`, so every field/group in one tree shares the same
   * root (typically the `FormApi`) regardless of which one `batch()` is
   * called on.
   */
  get root(): BaseApi {
    return this;
  }

  /**
   * Returns a monotonically increasing counter, bumped on every
   * {@linkcode notify}.
   *
   * Exists so consumers (e.g. `useSyncExternalStore`) can use it as a cheap,
   * `Object.is`-stable snapshot without needing a full immutable state object.
   *
   * This is an arrow field so it can be passed by reference,
   * e.g. `useSyncExternalStore(field.subscribe, field.getVersion)`, without
   * allocating a wrapper closure on every render.
   */
  readonly getVersion = (): number => {
    return this.#version;
  };

  /**
   * Registers {@linkcode cb} to be called on every future {@linkcode notify}.
   *
   * Pass `immediate: true` to also call {@linkcode cb} synchronously right
   * away, instead of only on future changes.
   *
   * This is an arrow field so it can be passed by reference,
   * e.g. `useSyncExternalStore(field.subscribe, ...)`.
   */
  readonly subscribe = (
    cb: VoidFunction,
    immediate?: boolean,
  ): VoidFunction => {
    this.#cloneSubscribersIfNeeded();
    this.#subscribers.add(cb);
    if (immediate) cb();

    return () => {
      this.#cloneSubscribersIfNeeded();
      this.#subscribers.delete(cb);
    };
  };

  // Meaningful only on whichever instance `root` resolves to; keying
  // batching off the root (not a single process-wide counter) is what keeps
  // two unrelated trees from coalescing each other's notifications.
  #batchDepth = 0;
  // Lazily created since most instances never call `batch()`.
  #pending?: Set<BaseApi>;

  #subscribers = new Set<() => void>();

  // Counts reentrant flushes (e.g. a subscriber synchronously triggering
  // another change to the same instance). While > 0, subscribe/unsubscribe
  // clone `#subscribers` so an in-progress flush keeps iterating its
  // original snapshot.
  #notifyDepth = 0;

  #version = 0;

  /**
   * Runs {@linkcode fn}, deferring every {@linkcode notify} triggered on
   * `this` instance's tree during the call so each affected instance fires
   * its subscribers at most once, after {@linkcode fn} returns, instead of
   * once per `notify()` call.
   *
   * Scoped to `this`'s tree (see {@linkcode root}): calling this on one
   * form has no effect on an unrelated form's notifications, even if the
   * two happen to be mutated within the same synchronous call.
   *
   * Safe to nest: only the outermost `batch()` call on a given tree flushes.
   */
  batch(fn: VoidFunction): void {
    const root = this.root;
    ++root.#batchDepth;
    try {
      fn();
    } finally {
      if (--root.#batchDepth === 0 && root.#pending) {
        const pending = root.#pending;
        root.#pending = undefined;
        for (const api of pending) api.#flush();
      }
    }
  }

  /**
   * Bumps {@linkcode getVersion} and calls every subscriber registered via
   * {@linkcode subscribe}, unless a {@linkcode batch} on this instance's
   * tree is in progress, in which case the flush is deferred until it ends.
   */
  protected notify(): void {
    ++this.#version;
    const root = this.root;

    if (root.#batchDepth === 0) {
      this.#flush();
    } else {
      (root.#pending ??= new Set()).add(this);
    }
  }

  #cloneSubscribersIfNeeded(): void {
    if (this.#notifyDepth > 0) {
      this.#subscribers = new Set(this.#subscribers);
    }
  }

  #flush(): void {
    ++this.#notifyDepth;
    for (const cb of this.#subscribers) cb();
    --this.#notifyDepth;
  }
}
