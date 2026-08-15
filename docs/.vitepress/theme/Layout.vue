<script setup lang="ts">
import { onMounted } from "vue";
import DefaultTheme from "vitepress/theme";
import FrameworkSwitcher from "./FrameworkSwitcher.vue";
import { setupCodeGroupSync } from "./codeGroupSync.ts";

// Every page, including the homepage, gets the full DefaultTheme.Layout
// (nav bar, sidebar, TOC, prev/next, mobile nav, search), plus the
// framework switcher above the sidebar nav. The homepage has no sidebar
// registered in config.ts, so that slot simply doesn't render there.
//
// Code-group tab sync is wired up here, unconditionally, rather than inside
// `FrameworkSwitcher`: this component mounts once for the whole site, so a
// tab click on the homepage's code-groups (which has no switcher UI) still
// updates `selectedFramework` for pages that read it later.
onMounted(setupCodeGroupSync);
</script>

<template>
  <DefaultTheme.Layout>
    <template #sidebar-nav-before>
      <FrameworkSwitcher />
    </template>
  </DefaultTheme.Layout>
</template>
