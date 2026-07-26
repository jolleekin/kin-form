/**
 * Measures render/update-speed and validation overhead for @kin-form/react
 * against React Hook Form, Formik, and TanStack Form, all mounted into a real
 * (Happy DOM) React tree via @testing-library/react, using one shared
 * ~84-field form shape and update plan (see `speed/scenario.ts`) so every
 * library does the exact same work. Run from the repo root:
 *
 *   deno task --cwd scripts speed-bench
 *
 * (`scripts/` has its own deno.json rather than being a workspace member —
 * see `bundle-size.ts`'s module comment for why. `--node-modules-dir` is
 * required so @testing-library/react and Happy DOM can see a real
 * node_modules tree.)
 *
 * Every number here is Happy DOM (JS-only, no layout/paint) — a proxy for
 * each library's own state-management overhead, not a browser-realistic
 * timing. React Hook Form is measured via `Controller`/`useController`
 * (controlled), not idiomatic `register()`, so it's on the same
 * controlled-input basis as the other three — see the readme's "Performance"
 * section for the full methodology note. Numbers will shift as dependencies
 * update; reproduce locally before quoting them elsewhere.
 */

import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();

import { kinFormHarness } from "./speed/kin-form.harness.tsx";
import { reactHookFormHarness } from "./speed/react-hook-form.harness.tsx";
import { formikHarness } from "./speed/formik.harness.tsx";
import { tanstackFormHarness } from "./speed/tanstack-form.harness.tsx";
import { SCENARIOS, type SpeedHarness } from "./speed/harness.ts";
import {
  type Metrics,
  runTrials,
  TRIAL_COUNT,
  UPDATE_BURST_SIZE,
} from "./speed/scenario.ts";

const harnesses: SpeedHarness[] = [
  kinFormHarness,
  reactHookFormHarness,
  formikHarness,
  tanstackFormHarness,
];

function formatValue(key: string, value: number | undefined): string {
  if (value === undefined) return "n/a";
  if (key === "wallMs") return `${value.toFixed(2)} ms`;
  return String(Math.round(value));
}

function metricLabel(key: string): string {
  switch (key) {
    case "wallMs":
      return "wall-clock";
    case "updatedRenders":
      return "updated field renders";
    case "siblingRenders":
      return "untouched sibling renders";
    case "submitRenders":
      return "submit-status renders";
    case "groupRenders":
      return "ancestor group renders";
    case "itemRenders":
      return "array item renders (aggregate)";
    case "validatorCalls":
      return "validator calls";
    case "fieldErrorRenders":
      return "field renders on error";
    default:
      return key;
  }
}

console.log(
  `\nKin Form speed benchmark — ${TRIAL_COUNT} trials/scenario (median), ${UPDATE_BURST_SIZE}x update bursts, Happy DOM.\n`,
);

for (const scenario of SCENARIOS) {
  console.log(`## ${scenario.label}\n`);

  const results: Array<{ name: string; metrics: Metrics }> = [];
  for (const harness of harnesses) {
    const metrics = await runTrials(() =>
      harness[scenario.key]() as Promise<Metrics>
    );
    results.push({ name: harness.name, metrics });
  }

  const keys = Array.from(
    new Set(results.flatMap((r) => Object.keys(r.metrics))),
  );
  // `wallMs` always leads; the rest keep the order the first harness that has them reports them.
  keys.sort((a, b) => (a === "wallMs" ? -1 : b === "wallMs" ? 1 : 0));

  const nameWidth = Math.max(...results.map((r) => r.name.length));
  const colWidths = keys.map((key) =>
    Math.max(
      metricLabel(key).length,
      ...results.map((r) => formatValue(key, r.metrics[key]).length),
    )
  );

  console.log(
    "  " + "".padEnd(nameWidth) + "  " +
      keys.map((key, i) => metricLabel(key).padStart(colWidths[i])).join("  "),
  );
  for (const r of results) {
    console.log(
      "  " + r.name.padEnd(nameWidth) + "  " +
        keys.map((key, i) =>
          formatValue(key, r.metrics[key]).padStart(colWidths[i])
        ).join("  "),
    );
  }
  console.log();
}
