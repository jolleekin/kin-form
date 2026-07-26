<script setup lang="ts">
import { computed } from 'vue';

export interface BarChartEntry {
  label: string;
  value: number;
  formatted: string;
  highlight?: boolean;
  /** Full name for the hover tooltip, if `label` is itself abbreviated. */
  full?: string;
}

const props = defineProps<{ bars: BarChartEntry[] }>();

const max = computed(() => Math.max(...props.bars.map((b) => b.value), 1e-9));

function heightOf(value: number): string {
  return `${(value / max.value) * 100}%`;
}
</script>

<template>
  <div class="bar-chart">
    <div class="bar-baseline" />
    <div
      v-for="bar in bars"
      :key="bar.label"
      class="bar-col"
      :title="`${bar.full ?? bar.label}: ${bar.formatted}`"
    >
      <div class="bar-track">
        <span class="bar-value">{{ bar.formatted }}</span>
        <div
          class="bar-fill"
          :class="{ accent: bar.highlight }"
          :style="{ height: heightOf(bar.value) }"
        />
      </div>
      <span class="bar-label">{{ bar.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.bar-chart {
  position: relative;
  display: flex;
  gap: 12px;
  height: 200px;
}

.bar-baseline {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 33px;
  height: 1px;
  background: var(--vp-c-divider);
}

.bar-col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-track {
  flex: 1;
  width: 100%;
  max-width: 40px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Packs value + fill to the bottom as one unit, so the value sits right
     above the bar's own tip instead of a fixed row shared by every column. */
  justify-content: flex-end;
}

.bar-value {
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  margin-bottom: 4px;
}

.bar-fill {
  width: 100%;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  background: color-mix(in srgb, var(--vp-c-text-1) 28%, transparent);
  transition: height 0.3s ease;
}

.bar-fill.accent {
  background: var(--vp-c-brand-1);
}

.bar-label {
  /* Fixed at 2 lines' worth of height regardless of actual line count, so
     every column's track ends at the same y — a label that happens to wrap
     must not shift its own bar's baseline relative to its neighbors'. */
  height: 28px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--vp-c-text-2);
  text-align: center;
  line-height: 14px;
  word-break: break-word;
}
</style>
