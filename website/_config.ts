import lume from "lume/mod.ts";
import { tailwindCSS } from "lume/plugins/tailwindcss.ts";
import { esbuild } from "lume/plugins/esbuild.ts";
import { lightningCSS } from "lume/plugins/lightningcss.ts";
// import { minifyHTML } from "lume/plugins/minify_html.ts";
import { modifyUrls } from "lume/plugins/modify_urls.ts";

import { prism } from "lume/plugins/prism.ts";
import toc from "lume_markdown_plugins/toc.ts";

import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-js-templates.js";
import "prismjs/components/prism-typescript.js";

const site = lume({ src: "./src", prettyUrls: false });

site.use(
  modifyUrls({
    fn: (url: string) => (url.endsWith(".html") ? url.slice(0, -5) : url),
  })
);

site.add("global.css");
site.add("css/");
site.add("img/");
site.add("js/copy-button.ts");
site.add("js/tab-view.ts");

site.use(tailwindCSS());

site.use(lightningCSS());

site.use(toc());

site.use(
  prism({
    cssSelector: "code",
    theme: { name: "okaidia", cssFile: "code-dark.css" },
  })
);

// This plugin has a bug.
// site.use(minifyHTML());

site.use(
  esbuild({
    options: {
      chunkNames: "js/[hash]",
      minify: true,
      splitting: true,
      target: "es2022",
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          useDefineForClassFields: false,
        },
      },
    },
  })
);

export default site;
