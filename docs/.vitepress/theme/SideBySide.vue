<script setup lang="ts">
import { ref } from 'vue';

const container = ref<HTMLElement | null>(null);

function toggle(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    container.value?.requestFullscreen();
  }
}
</script>

<template>
  <div ref="container" class="side-by-side">
    <button class="fs-btn" aria-label="Toggle fullscreen" @click="toggle">
      <span class="expand">View side by side</span>
      <span class="compress">Exit</span>
    </button>
    <slot />
  </div>
</template>

<style scoped>
/* ── Toggle button ────────────────────────────────────────────────────────── */
.fs-btn {
  position: absolute;
  top: 7px;
  right: 8px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding-inline: 8px;
  border: none;
  border-radius: 5px;
  background: var(--vp-c-brand-1);
  color: var(--vp-button-brand-text, #fff);
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}

.fs-btn:hover  { background: var(--vp-c-brand-2); }
.fs-btn:active { transform: scale(0.95); }

.compress { display: none }

/* ── Container ────────────────────────────────────────────────────────────── */
.side-by-side {
  position: relative;
}

.side-by-side::backdrop {
  background: var(--vp-c-bg);
}

/* ── Fullscreen state ─────────────────────────────────────────────────────── */
.side-by-side:fullscreen {
  overflow-y: auto;
  background: var(--vp-c-bg);
}

.side-by-side:fullscreen .fs-btn {
  position: fixed;
  top: 18px;
  right: 28px;
}

.side-by-side:fullscreen .compress { display: block; }
.side-by-side:fullscreen .expand   { display: none; }

/**/

.side-by-side:fullscreen :deep(.vp-code-group) { margin-top: 0; }

.side-by-side:fullscreen :deep(.vp-code-group .tabs) {
  position: fixed;
  z-index: 10;
  top: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  overflow: visible;
  background: var(--vp-c-bg-elv);
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 8px 0;
  margin-bottom: 8px;
}

.side-by-side:fullscreen :deep(.vp-code-group .tabs label) {
  display: block;
  padding: 2px 24px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: var(--vp-c-text-2);
  cursor: default;
  background: transparent;
  border-bottom: none;
  border-radius: 0;
}

.side-by-side:fullscreen :deep(.vp-code-group input:checked + label::after) {
  background-color: transparent;
}

.side-by-side:fullscreen :deep(.vp-code-group .tabs label:hover),
.side-by-side:fullscreen :deep(.vp-code-group .tabs input:checked + label) {
  color: var(--vp-c-text-2) !important;
  background: transparent;
  border-bottom: none !important;
}

.side-by-side:fullscreen :deep(.vp-code-group .blocks) {
  margin-top: 69px;
  display: grid !important;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.side-by-side:fullscreen :deep(.vp-code-group .blocks > div) {
  display: block !important;
  margin: 0 !important;
  border-radius: 8px;
  overflow: hidden;
}

.side-by-side:fullscreen :deep(.vp-code-group .blocks > div pre) {
  overflow-x: auto;
  margin: 0;
}
</style>
