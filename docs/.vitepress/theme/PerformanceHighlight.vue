<script setup lang="ts">
import BarChart from './BarChart.vue';
import type { BarChartEntry } from './BarChart.vue';

withDefaults(defineProps<{ title?: string }>(), {});

// Wall-clock, ms, burst=800x, Happy DOM — the "Flat field update burst"
// scenario from PerformanceCharts.vue, kept in sync with it (reproduce via
// `deno task --cwd scripts speed-bench`).
const bars: BarChartEntry[] = [
  { label: 'Kin Form', value: 1.39, formatted: '1.39 ms', highlight: true },
  { label: 'React Hook Form', value: 66.55, formatted: '66.55 ms' },
  { label: 'Formik', value: 3.30, formatted: '3.30 ms' },
  { label: 'TanStack Form', value: 564.24, formatted: '564.24 ms' },
];
</script>

<template>
  <div class="performance-highlight">
    <h4 v-if="title" class="performance-highlight-title">{{ title }}</h4>
    <BarChart :bars="bars" />
  </div>
</template>

<style scoped>
.performance-highlight-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 10px;
}
</style>
