<script setup lang="ts">
import { selectedFramework } from './store.ts';
import { frameworks } from './codeGroupSync.ts';
</script>

<template>
  <div class="framework-switcher">
    <label for="framework-select">Framework:</label>
    <select id="framework-select" v-model="selectedFramework">
      <option v-for="fw in frameworks" :key="fw.id" :value="fw.id">
        {{ fw.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.framework-switcher {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.framework-switcher label {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
}

.framework-switcher select {
  width: 100%;
  padding: 0 10px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-border);
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.25s;
  appearance: auto;
}

.framework-switcher select:hover {
  border-color: var(--vp-c-brand-1);
}

.framework-switcher select:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}
</style>
