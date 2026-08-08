import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import FrameworkSnippet from "./FrameworkSnippet.vue";
import SideBySide from "./SideBySide.vue";
import FeatureMatrix from "./FeatureMatrix.vue";
import BundleSizeChart from "./BundleSizeChart.vue";
import PerformanceCharts from "./PerformanceCharts.vue";
import PerformanceHighlight from "./PerformanceHighlight.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout,
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
