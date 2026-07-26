<script setup lang="ts">
import BarChart from './BarChart.vue';
import type { BarChartEntry } from './BarChart.vue';

interface Scenario {
  title: string;
  bars: BarChartEntry[];
}

function lib(label: string, value: number, highlight = false): BarChartEntry {
  return { label, value, formatted: `${value.toFixed(2)} ms`, highlight };
}

function renders(label: string, value: number, highlight = false): BarChartEntry {
  return { label, value, formatted: `${value}`, highlight };
}

// Wall-clock, ms, burst=800x, Happy DOM. Each number is the median of 5 full
// benchmark runs (run-to-run variance swamps the 15-trial in-run median — see
// readme.md's "Performance" section for why). Keep in sync with readme.md
// (reproduce via `deno task --cwd scripts speed-bench`).
const scenarios: Scenario[] = [
  {
    title: 'Initial mount (84 fields)',
    bars: [
      lib('Kin Form', 2.87, true),
      lib('React Hook Form', 5.14),
      lib('Formik', 2.38),
      lib('TanStack Form', 9.50),
    ],
  },
  {
    title: 'Flat field update burst (800x)',
    bars: [
      lib('Kin Form', 1.39, true),
      lib('React Hook Form', 66.55),
      lib('Formik', 3.30),
      lib('TanStack Form', 564.24),
    ],
  },
  {
    title: 'Nested field update burst (800x)',
    bars: [
      lib('Kin Form', 3.68, true),
      lib('React Hook Form', 166.63),
      lib('Formik', 6.36),
      lib('TanStack Form', 574.47),
    ],
  },
  {
    title: 'Array swap burst (800x, cycling adjacent pairs)',
    bars: [
      lib('Kin Form', 72.29, true),
      lib('React Hook Form', 221.32),
      lib('Formik', 11.99),
      lib('TanStack Form', 1514.68),
    ],
  },
  {
    title: 'Array insert/remove burst (800x)',
    bars: [
      lib('Kin Form', 33.40, true),
      lib('React Hook Form', 434.70),
      lib('Formik', 5.10),
      lib('TanStack Form', 1608.80),
    ],
  },
  {
    title: 'Flat field update burst + sync validator (800x)',
    bars: [
      lib('Kin Form', 3.42, true),
      lib('React Hook Form', 160.25),
      lib('Formik', 67.66),
      lib('TanStack Form', 709.82),
    ],
  },
  {
    title: 'Debounced async validation (800 updates, 50ms debounce)',
    bars: [
      lib('Kin Form', 90.56, true),
      lib('React Hook Form', 221.59),
      lib('Formik', 98.79),
      lib('TanStack Form', 952.59),
    ],
  },
  {
    title: 'Whole-form zod schema validation (on submit)',
    bars: [
      lib('Kin Form', 2.07, true),
      lib('React Hook Form', 4.98),
      lib('Formik', 2.84),
      lib('TanStack Form', 29.95),
    ],
  },
];

// Untouched-sibling re-render counts, for the two scenarios where "how many
// other fields re-rendered" is a clean, isolated number — unlike the array
// swap scenario, whose render count includes every touched item too, so it
// doesn't isolate untouched work the same way. Kept in sync with readme.md's
// "Selective re-rendering, quantified" section.
const rerenderScenarios: Scenario[] = [
  {
    title: 'Flat field update burst (800x)',
    bars: [
      renders('Kin Form', 0, true),
      renders('React Hook Form', 0),
      renders('Formik', 19),
      renders('TanStack Form', 0),
    ],
  },
  {
    title: 'Nested field update burst (800x)',
    bars: [
      renders('Kin Form', 0, true),
      renders('React Hook Form', 0),
      renders('Formik', 3),
      renders('TanStack Form', 3),
    ],
  },
];
</script>

<template>
  <h3 class="performance-group-title">Smaller is better.</h3>
  <div class="performance-charts">
    <div v-for="scenario in scenarios" :key="scenario.title" class="performance-scenario">
      <h4 class="performance-scenario-title">{{ scenario.title }}</h4>
      <BarChart :bars="scenario.bars" />
    </div>
    <div class="performance-scenario" style="height: 0; padding: 0; background-color: transparent;"></div>
  </div>
  <h3 class="performance-group-title">Untouched sibling re-renders (800 updates)</h3>
  <div class="performance-charts">
    <div v-for="scenario in rerenderScenarios" :key="scenario.title" class="performance-scenario">
      <h4 class="performance-scenario-title">{{ scenario.title }}</h4>
      <BarChart :bars="scenario.bars" />
    </div>
    <div class="performance-scenario" style="height: 0; padding: 0; background-color: transparent;"></div>
  </div>
</template>

<style scoped>
.performance-charts {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 24px;
}

.performance-scenario {
  flex: 1 1 280px;
  min-width: 280px;
  padding: 16px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.performance-scenario-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 12px;
}

.performance-group-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 12px 0;
}
</style>
