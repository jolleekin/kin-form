import { defineConfig } from "vitepress";

// TODO: replace with the real docs hostname once hosting is decided (see
// ROADMAP.md). Everything below (sitemap.xml, canonical links, og:url) keys
// off this constant, so updating it here is the only change needed later.
const SITE_URL = "https://kin-form.pages.dev";

const description =
  "Fast, lightweight, framework-agnostic form state library for TypeScript. Zero-dependencies core, 100% type-safe field paths, React bindings built in.";

export default defineConfig({
  cleanUrls: true,
  title: "Kin Form",
  description,

  sitemap: {
    hostname: SITE_URL,
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
