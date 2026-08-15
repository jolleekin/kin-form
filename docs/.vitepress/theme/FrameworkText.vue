<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { selectedFramework } from './store.ts';

const slots = useSlots();

const activeSlot = computed(() => {
  if (slots[selectedFramework.value]) {
    return selectedFramework.value;
  }
  // Fallback to first available slot if none match.
  const availableSlots = Object.keys(slots).filter(key => key !== '_');
  return availableSlots.length > 0 ? availableSlots[0] : 'default';
});
</script>

<template>
  <slot :name="activeSlot"></slot>
</template>
