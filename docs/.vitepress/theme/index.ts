import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import FrameworkSnippet from "./FrameworkSnippet.vue";
import FrameworkSwitcher from "./FrameworkSwitcher.vue";
import SideBySide from "./SideBySide.vue";
import FeatureMatrix from "./FeatureMatrix.vue";
import BundleSizeChart from "./BundleSizeChart.vue";
import PerformanceCharts from "./PerformanceCharts.vue";
import PerformanceHighlight from "./PerformanceHighlight.vue";
import HomeSnippets from "./home-snippets.md";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "sidebar-nav-before": () => h(FrameworkSwitcher),
      "home-features-before": () => h(HomeSnippets),
    });
  },
  // deno-lint-ignore no-explicit-any
  enhanceApp({ app }: any) {
    app.component("FrameworkSnippet", FrameworkSnippet);
    app.component("SideBySide", SideBySide);
    app.component("FeatureMatrix", FeatureMatrix);
    app.component("BundleSizeChart", BundleSizeChart);
    app.component("PerformanceCharts", PerformanceCharts);
    app.component("PerformanceHighlight", PerformanceHighlight);
  },
};
