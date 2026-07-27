/**
 * Shared form shape, sizing constants, and trial-running helper for the speed
 * benchmark: one source of truth so every library's harness
 * (`*.harness.tsx`) measures the exact same workload. See `speed-bench.ts`
 * for how this gets driven.
 */

export const FLAT_FIELD_COUNT = 20;
export const ARRAY_ITEM_COUNT = 20;
// Empirically tuned: with a smaller, more realistic FLAT_FIELD_COUNT, the
// O(field count) fan-out scenarios (RHF/Formik) do less total work per burst
// than they did at 100 fields, so a burst that was plenty at that size drops
// back under the noise floor (clock resolution, GC, OS scheduling) here. 800
// brought every library's run-to-run swing down to a few percent across
// three consecutive full runs, confirmed back-to-back.
export const UPDATE_BURST_SIZE = 800;
export const TRIAL_COUNT = 15;

export interface ArrayItem {
  /**
   * A userland-embedded stable id, travelling with the item through
   * reorders: the workaround Formik and TanStack Form users reach for
   * since neither library generates one itself (unlike Kin Form's
   * `field.id` or React Hook Form's `fields[i].id`). Every harness keys its
   * per-item React component by this so a swap is measured as "the same
   * item, moved" rather than "two positions changed value."
   */
  id: string;
  code: string;
  qty: number;
  note: string;
}

export interface FormValue {
  fields: Record<string, string>;
  address: {
    line1: string;
    line2: string;
    geo: { lat: string; lng: string };
  };
  items: ArrayItem[];
}

export const FLAT_FIELD_NAMES: readonly string[] = Array.from(
  { length: FLAT_FIELD_COUNT },
  (_, i) => `f${i}`,
);

export function makeInitialValue(): FormValue {
  const fields: Record<string, string> = {};
  for (const name of FLAT_FIELD_NAMES) fields[name] = "";
  // Distinct per-item values (not all blank): a swap between two
  // structurally-identical blank items would produce no observable value
  // change at either position, making "did this leaf re-render for the
  // right reason" unmeasurable regardless of how correct a library's
  // selective-update behavior actually is.
  const items: ArrayItem[] = Array.from(
    { length: ARRAY_ITEM_COUNT },
    (_, i) => ({
      id: `item-${i}`,
      code: `code-${i}`,
      qty: i,
      note: `note-${i}`,
    }),
  );
  return {
    fields,
    address: { line1: "", line2: "", geo: { lat: "", lng: "" } },
    items,
  };
}

/** A freshly-tagged array item, for the insert/remove burst scenario. */
export function makeInsertedItem(tag: number): ArrayItem {
  return {
    id: `inserted-${tag}`,
    code: `inserted-code-${tag}`,
    qty: tag,
    note: `inserted-note-${tag}`,
  };
}

/** The dotted path (also used as its render-counter key) of flat field `name`. */
export function fieldKey(name: string): string {
  return `fields.${name}`;
}

/** The three leaf paths (also render-counter keys) of array item `index`. */
export function itemFieldKeys(index: number): string[] {
  return [`items.${index}.code`, `items.${index}.qty`, `items.${index}.note`];
}

export const ADDRESS_LEAF_KEYS: readonly string[] = [
  "address.line1",
  "address.line2",
  "address.geo.lat",
  "address.geo.lng",
];

/** Every leaf field's dotted path across the whole form: flat fields, the nested address group, and every array item. */
export function allLeafKeys(): string[] {
  return [
    ...FLAT_FIELD_NAMES.map(fieldKey),
    ...ADDRESS_LEAF_KEYS,
    ...Array.from({ length: ARRAY_ITEM_COUNT }, (_, i) => i).flatMap(
      itemFieldKeys,
    ),
  ];
}

/** A scenario's raw measurements: keys vary per scenario, values are always numeric. */
export type Metrics = Record<string, number>;

/**
 * Runs `runOnce` `TRIAL_COUNT + 1` times, discards the first (JIT/cache
 * warmup), and returns the per-key median across the rest, resistant to a
 * single GC-pause outlier the way a mean isn't.
 */
export async function runTrials(
  runOnce: () => Metrics | Promise<Metrics>,
): Promise<Metrics> {
  const samples: Metrics[] = [];
  for (let i = 0; i < TRIAL_COUNT + 1; i++) {
    samples.push(await runOnce());
  }
  samples.shift(); // discard warmup

  const result: Metrics = {};
  for (const key of Object.keys(samples[0])) {
    const values = samples.map((s) => s[key]).sort((a, b) => a - b);
    result[key] = values[Math.floor(values.length / 2)];
  }
  return result;
}
