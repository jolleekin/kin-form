/**
 * Common contract every library's harness (`*.harness.tsx`) implements, plus
 * the scenario names `speed-bench.ts` drives them through. Each method mounts
 * a fresh form (flat fields, a nested address group, an item array), performs
 * one scenario's burst, unmounts, and returns raw (single-trial) metrics;
 * `speed-bench.ts` is what repeats a method across trials and takes the
 * median (see `runTrials` in `scenario.ts`).
 */

import { allLeafKeys, type Metrics, UPDATE_BURST_SIZE } from "./scenario.ts";

/** Every `SpeedHarness` method that runs a scenario: everything but the display `name`. */
export type ScenarioKey = Exclude<keyof SpeedHarness, "name">;

export interface SpeedHarness {
  /** Display name, as it should appear in printed output. */
  name: string;
  /** Scenario 1: mounts the full form, returns `{ wallMs }`. */
  mount(): Promise<Metrics>;
  /** Scenario 2: a burst of updates on one top-level flat field. */
  updateFlatField(): Promise<Metrics>;
  /** Scenario 3: a burst of updates on the deepest nested field (`address.geo.lat`). */
  updateNestedField(): Promise<Metrics>;
  /** Scenario 4: a burst of array-item swaps. */
  mutateArray(): Promise<Metrics>;
  /** Scenario 5: a burst of array-item insert/remove pairs at the array's midpoint. */
  insertRemoveArray(): Promise<Metrics>;
  /** Scenario 6: scenario 2's burst, but every flat field also carries a sync validator. */
  syncValidation(): Promise<Metrics>;
  /** Scenario 7: a burst of updates on one field with a debounced async validator attached. */
  asyncDebounce(): Promise<Metrics>;
  /** Scenario 8: one whole-form zod schema, triggered via the library's submit path. */
  schemaValidation(): Promise<Metrics>;
}

export const SCENARIOS: ReadonlyArray<
  { key: ScenarioKey; label: string }
> = [
  { key: "mount", label: `Initial mount (${allLeafKeys().length} fields)` },
  {
    key: "updateFlatField",
    label: `Flat field update burst (${UPDATE_BURST_SIZE}x)`,
  },
  {
    key: "updateNestedField",
    label: `Nested field update burst (${UPDATE_BURST_SIZE}x)`,
  },
  { key: "mutateArray", label: `Array swap burst (${UPDATE_BURST_SIZE}x)` },
  {
    key: "insertRemoveArray",
    label: `Array insert/remove burst (${UPDATE_BURST_SIZE}x)`,
  },
  {
    key: "syncValidation",
    label: `Flat field update burst + sync validator (${UPDATE_BURST_SIZE}x)`,
  },
  {
    key: "asyncDebounce",
    label: `Debounced async validation (${UPDATE_BURST_SIZE} rapid updates)`,
  },
  {
    key: "schemaValidation",
    label: "Whole-form zod schema validation (on submit)",
  },
];
