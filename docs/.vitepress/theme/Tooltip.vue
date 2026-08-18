<script setup lang="ts">
import { ref, useId } from 'vue';

defineProps<{ html?: string }>();

const bubbleId = useId();
const triggerEl = ref<HTMLElement | null>(null);
const visible = ref(false);
const bubbleTop = ref(0);
const bubbleLeft = ref(0);
const arrowLeft = ref(0);

const BUBBLE_WIDTH = 260;
const VIEWPORT_MARGIN = 8;

// Positions the teleported bubble in viewport space (not the table's own
// scroll container), so it can't be clipped by the table's overflow-x: auto.
function show(): void {
  const rect = triggerEl.value?.getBoundingClientRect();
  if (!rect) return;

  const centerX = rect.left + rect.width / 2;
  bubbleLeft.value = Math.min(
    Math.max(centerX - BUBBLE_WIDTH / 2, VIEWPORT_MARGIN),
    window.innerWidth - BUBBLE_WIDTH - VIEWPORT_MARGIN,
  );
  bubbleTop.value = rect.top;
  arrowLeft.value = centerX - bubbleLeft.value;
  visible.value = true;
}

function hide(): void {
  visible.value = false;
}
</script>

<template>
  <span
    v-if="html"
    ref="triggerEl"
    class="tooltip"
    tabindex="0"
    :aria-describedby="bubbleId"
    @mouseenter="show"
    @mouseleave="hide"
    @focus="show"
    @blur="hide"
  >
    <slot />
  </span>
  <slot v-else />

  <Teleport to="body">
    <span
      v-if="html"
      :id="bubbleId"
      class="tooltip-bubble"
      :class="{ visible }"
      role="tooltip"
      :style="{
        top: `${bubbleTop}px`,
        left: `${bubbleLeft}px`,
        '--arrow-left': `${arrowLeft}px`,
      }"
      v-html="html"
    />
  </Teleport>
</template>

<style scoped>
.tooltip {
  cursor: help;
}

.tooltip-bubble {
  position: fixed;
  z-index: 100;
  width: max-content;
  max-width: 260px;
  padding: 8px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
  color: var(--vp-c-text-1);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  text-align: left;
  white-space: normal;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translate(0, calc(-100% - 8px + 4px));
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.tooltip-bubble :deep(code) {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--vp-code-bg);
  color: var(--vp-code-color);
  font-size: 11px;
  font-family: var(--vp-font-family-mono);
}

.tooltip-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: var(--arrow-left);
  border: 5px solid transparent;
  border-top-color: var(--vp-c-bg-elv);
  transform: translateX(-50%);
}

.tooltip-bubble.visible {
  opacity: 1;
  visibility: visible;
  pointer-events: none;
  transform: translate(0, calc(-100% - 8px));
}
</style>
