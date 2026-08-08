import { defineConfig, type ThemeOptions } from "vitepress";
import llmstxt from "vitepress-plugin-llms";
import poimandresLight from "./theme/poimandres-light.json" with {
  type: "json",
};

// TODO: replace with the real docs hostname once hosting is decided (see
// ROADMAP.md). Everything below (sitemap.xml, canonical links, og:url) keys
// off this constant, so updating it here is the only change needed later.
const SITE_URL = "https://kin-form.pages.dev";

const description =
  "Fast, lightweight, framework-agnostic form state library for TypeScript. Zero-dependencies core, 100% type-safe field paths, React bindings built in.";

export default defineConfig({
  cleanUrls: true,
  // The whole theme (palette, Shiki theme) is light-only by design, with no
  // .dark counterpart defined anywhere — DefaultTheme's dark-mode toggle
  // would otherwise render but do nothing, since this theme's CSS overrides
  // are unconditional. Disabling it removes the dead toggle instead.
  appearance: false,
  title: "Kin Form",
  description,

  sitemap: {
    hostname: SITE_URL,
  },

  vite: {
    plugins: [
      // llms.txt itself is hand-written (docs/public/llms.txt); this only
      // preserves each page's raw Markdown alongside its rendered HTML.
      llmstxt({
        domain: SITE_URL,
        generateLLMsTxt: false,
        generateLLMsFullTxt: false,
        // The cast works around examples/react's vite@8 (a different
        // workspace member) getting hoisted over vitepress's own vite@5 in
        // this Deno workspace's shared node_modules, which leaves
        // vitepress-plugin-llms (no vite dependency of its own) typed
        // against the wrong instance of `Plugin`.
      }) as never,
    ],
  },

  transformHead: ({ pageData }) => {
    const path = pageData.relativePath
      .replace(/index\.md$/, "")
      .replace(/\.md$/, "");
    const canonicalUrl = `${SITE_URL}/${path}`;
    return [
      ["link", { rel: "canonical", href: canonicalUrl }],
      ["meta", { property: "og:url", content: canonicalUrl }],
    ];
  },

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href:
          "https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap",
      },
    ],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Kin Form" }],
    ["meta", { property: "og:title", content: "Kin Form" }],
    ["meta", { property: "og:description", content: description }],
    ["meta", { property: "og:image", content: `${SITE_URL}/logo.svg` }],
    ["meta", { name: "twitter:card", content: "summary" }],
    ["meta", { name: "twitter:title", content: "Kin Form" }],
    ["meta", { name: "twitter:description", content: description }],
    ["meta", { name: "twitter:image", content: `${SITE_URL}/logo.svg` }],
  ],

  markdown: {
    // poimandres has no official light variant, so this remaps its own
    // token colors (soft blue identifiers, teal keywords/strings, rose
    // for errors/null) onto a white background instead of picking an
    // unrelated light theme with a different color language.
    theme: poimandresLight as unknown as ThemeOptions,
    codeTransformers: [
      {
        name: "comment-lines",
        line(node, line) {
          const text = (this.tokens[line - 1] ?? [])
            .map((t) => t.content)
            .join("");
          if (text.trimStart().startsWith("//")) {
            this.addClassToHast(node, "comment-line");
          }
        },
      },
    ],
  },

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Validators", link: "/validators/" },
      { text: "Comparison", link: "/comparison/" },
      { text: "API Reference", link: "https://jsr.io/@kin-form" },
      { text: "Kin Store", link: "https://kinstore.dev" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Why Kin Form?", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Concepts", link: "/guide/concepts" },
            { text: "Basic", link: "/guide/basic" },
          ],
        },
        {
          text: "Guides",
          items: [
            { text: "Per-node Validation", link: "/guide/per-node-validation" },
            { text: "Schema Validation", link: "/guide/schema-validation" },
            { text: "Linked Fields", link: "/guide/linked-fields" },
            { text: "Listeners", link: "/guide/listeners" },
            { text: "Nested Objects", link: "/guide/nested-objects" },
            { text: "Dynamic Arrays", link: "/guide/dynamic-arrays" },
            {
              text: "Flat vs. Nested Structure",
              link: "/guide/flat-vs-nested",
            },
            {
              text: "Dirty Tracking & Reset",
              link: "/guide/dirty-tracking-and-reset",
            },
            { text: "Submission Handling", link: "/guide/submission-handling" },
            {
              text: "Async Initial Values",
              link: "/guide/async-initial-values",
            },
            { text: "Reactivity", link: "/guide/reactivity" },
            { text: "Form Composition", link: "/guide/form-composition" },
            { text: "Multistep Forms", link: "/guide/multistep" },
            { text: "Devtools", link: "/guide/devtools" },
          ],
        },
      ],
      "/validators/": [
        {
          text: "Validators",
          items: [
            { text: "Overview", link: "/validators/" },
          ],
        },
      ],
      "/comparison/": [
        {
          text: "Comparison",
          items: [
            { text: "Overview", link: "/comparison/" },
            { text: "vs React Hook Form", link: "/comparison/react-hook-form" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/jolleekin/kin-form" },
    ],

    search: {
      provider: "local",
    },

    footer: {
      message:
        "Released under the MIT License.<br/>Copyright &copy; 2026-present Man Hoang",
    },

    editLink: {
      pattern: "https://github.com/jolleekin/kin-form/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
