<script setup lang="ts">
import BarChart from './BarChart.vue';
import type { BarChartEntry } from './BarChart.vue';

// Sorted ascending. Regenerate via `deno task --cwd scripts bundle-size` and
// keep in sync with readme.md's "Bundle size" table/breakdown.
const bars: BarChartEntry[] = [
  { label: 'Kin Form', full: 'Kin Form (core + react)', value: 4.8, formatted: '4.8 KB', highlight: true },
  { label: 'React Hook Form', value: 13.0, formatted: '13.0 KB' },
  { label: 'Formik', value: 13.9, formatted: '13.9 KB' },
  { label: 'TanStack Form', full: '@tanstack/react-form', value: 18.5, formatted: '18.5 KB' },
];
</script>

<template>
  <div class="bundle-size-chart">
    <BarChart :bars="bars" />
    <p class="bundle-size-caption">
      React usage, minified + gzipped, same toolchain for every library.
    </p>
  </div>
</template>

<style scoped>
.bundle-size-chart {
  margin: 32px 0;
}

.bundle-size-caption {
  color: var(--vp-c-text-3);
  margin-top: 10px;
  font-size: 13px;
  line-height: 16px;
  text-align: center;
}
</style>
