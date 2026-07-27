/**
 * Shared render-counting registry for the speed benchmark: every field
 * component in every harness bumps one entry of this map once per render, so
 * re-render counts are comparable across libraries without each harness
 * reinventing the same bookkeeping.
 */

export type Counters = Map<string, { current: number }>;

/** A fresh counter map, one zeroed entry per key, ready for a new mount. */
export function makeCounterMap(keys: Iterable<string>): Counters {
  const map: Counters = new Map();
  for (const key of keys) map.set(key, { current: 0 });
  return map;
}

/** Increments the counter for `key`. Call once per render of the component that owns `key`. */
export function bump(counters: Counters, key: string): void {
  const counter = counters.get(key);
  if (!counter) throw new Error(`No counter registered for "${key}"`);
  counter.current++;
}

/**
 * Zeroes every counter. Call once mount has fully settled (some libraries,
 * React Hook Form's `useController` among them, render a field more than
 * once at mount, via an effect-driven subscription resync, before any user
 * interaction), and before a burst starts, so `postMountRenders`/
 * `sumPostMountRenders` reflect only renders the burst itself caused, not an
 * artifact of however many times a library happens to render at mount.
 */
export function resetCounters(counters: Counters): void {
  for (const counter of counters.values()) counter.current = 0;
}

/** Sums renders across every key in `keys` present in `counters`, since the last `resetCounters` call. */
export function sumPostMountRenders(
  counters: Counters,
  keys: Iterable<string>,
): number {
  let sum = 0;
  for (const key of keys) {
    const counter = counters.get(key);
    if (counter) sum += counter.current;
  }
  return sum;
}

/** One counter's render count since the last `resetCounters` call; 0 if it never mounted (a library with no addressable node for this key). */
export function postMountRenders(counters: Counters, key: string): number {
  const counter = counters.get(key);
  return counter ? counter.current : 0;
}
