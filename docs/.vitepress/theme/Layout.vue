<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import FrameworkSwitcher from "./FrameworkSwitcher.vue";

// Every page, including the homepage, gets the full DefaultTheme.Layout
// (nav bar, sidebar, TOC, prev/next, mobile nav, search), plus the
// framework switcher above the sidebar nav. The homepage has no sidebar
// registered in config.ts, so that slot simply doesn't render there.
</script>

<template>
  <DefaultTheme.Layout>
    <template #sidebar-nav-before>
      <FrameworkSwitcher />
    </template>
  </DefaultTheme.Layout>
</template>
