/**
 * This module defines asynchronous utility functions.
 * @module
 */

/**
 * Eagerly finds the first promise whose result satisfies {@linkcode predicate}.
 *
 * Returns the result of the promise if found, otherwise `undefined`.
 *
 * {@linkcode promises} is assumed to be non-empty.
 */
export function asyncFind<T>(
  promises: Promise<T>[],
  predicate: (value: T) => boolean,
  isAborted: () => boolean
): Promise<T | undefined> {
  return new Promise<T | undefined>((resolve, reject) => {
    let n = promises.length;

    function onValue(value: T): void {
      if (n === 0) return;
      if (isAborted()) {
        n = 0;
        resolve(undefined);
      } else if (predicate(value)) {
        n = 0;
        resolve(value);
      } else {
        if (--n === 0) resolve(undefined);
      }
    }

    function onError(reason?: unknown): void {
      n = 0;
      if (!isAborted()) reject(reason);
    }

    for (const p of promises) {
      p.then(onValue).catch(onError);
    }
  });
}
