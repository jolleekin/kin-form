import { defineConfig } from "vitepress";

export default defineConfig({
  cleanUrls: true,
  title: "Kin Form",
  description:
    "Fast, lightweight, framework-agnostic form state library for TypeScript. Zero-dependencies core, 100% type-safe field paths, React bindings built in.",

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
  ],

  markdown: {
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
