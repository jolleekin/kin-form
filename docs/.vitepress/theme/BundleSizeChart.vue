<script setup lang="ts">
import BarChart from './BarChart.vue';
import type { BarChartEntry } from './BarChart.vue';

withDefaults(defineProps<{ title?: string }>(), {});

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
    <h4 v-if="title" class="bundle-size-title">{{ title }}</h4>
    <BarChart :bars="bars" />
  </div>
</template>

<style scoped>
.bundle-size-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 10px;
}
</style>
