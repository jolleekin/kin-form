/**
 * Measures minified + gzipped bundle size for @kin-form packages and a set
 * of comparable form libraries, using one bundler/minifier configuration for
 * everyone so the numbers in the root readme's feature matrix are fair and
 * reproducible. Run from the repo root:
 *
 *   deno task --cwd scripts bundle-size
 *
 * (`scripts/` has its own deno.json rather than being a workspace member, so
 * it can pull in the competing npm packages below without polluting the
 * workspace's own dependency graph. `--node-modules-dir` is required so
 * rolldown, a Node-resolution bundler, can see a real node_modules tree for
 * them.) Prints an ASCII bar chart that can be pasted straight into the
 * readme.
 */

import { type OutputChunk, type Plugin, rolldown } from "rolldown";

const SCRIPTS_DIR = new URL(".", import.meta.url).pathname.slice(1);
const CORE_ENTRY = new URL("../core/index.ts", import.meta.url).pathname
  .slice(1);
const REACT_ENTRY = new URL("../react/index.ts", import.meta.url).pathname
  .slice(1);
const VALIDATORS_ENTRY = new URL("../validators/index.ts", import.meta.url)
  .pathname.slice(1);

const CORE_SPECIFIER = "@kintools/form-core";

/** Serves an in-memory entry so subjects can be described as strings instead of temp files. */
function virtualEntryPlugin(id: string, code: string): Plugin {
  return {
    name: "virtual-entry",
    resolveId(source: string) {
      if (source === id) return id;
    },
    load(source: string) {
      if (source === id) return code;
    },
  };
}

interface Subject {
  name: string;
  group: "kin-form" | "other";
  input: string;
  plugins?: Plugin[];
  external?: string[];
  /** Resolves a bare specifier to a real file instead of leaving it external. */
  alias?: Record<string, string>;
}

function virtualSubject(
  name: string,
  group: Subject["group"],
  code: string,
  external: string[],
): Subject {
  const id = `\0${name}`;
  return {
    name,
    group,
    input: id,
    plugins: [virtualEntryPlugin(id, code)],
    external,
  };
}

const subjects: Subject[] = [
  { name: "@kintools/form-core", group: "kin-form", input: CORE_ENTRY },
  {
    name: "@kintools/form-react (bindings only, on top of core)",
    group: "kin-form",
    input: REACT_ENTRY,
    // Core is measured on its own above; externalize it here so this row
    // isolates the weight of the React bindings themselves.
    external: [CORE_SPECIFIER, "react"],
  },
  {
    name: "@kintools/form-validators",
    group: "kin-form",
    input: VALIDATORS_ENTRY,
  },
  {
    ...virtualSubject(
      "@kin-form (core + react, typical usage)",
      "kin-form",
      `export * from "${CORE_ENTRY}";\nexport * from "${REACT_ENTRY}";`,
      ["react"],
    ),
    // Dedupe the bindings' internal "@kintools/form-core" import with
    // the same file already pulled in directly above, instead of leaving it
    // as a second, unresolved external import.
    alias: { [CORE_SPECIFIER]: CORE_ENTRY },
  },
  virtualSubject(
    "react-hook-form",
    "other",
    `export * from "react-hook-form";`,
    ["react", "react-dom"],
  ),
  virtualSubject("formik", "other", `export * from "formik";`, [
    "react",
    "react-dom",
  ]),
  virtualSubject(
    "@tanstack/react-form",
    "other",
    `export * from "@tanstack/react-form";`,
    ["react", "react-dom"],
  ),
  virtualSubject(
    "final-form + react-final-form",
    "other",
    `export * from "final-form";\nexport * from "react-final-form";`,
    ["react", "react-dom"],
  ),
];

async function gzipSize(code: string): Promise<number> {
  const stream = new Blob([code]).stream().pipeThrough(
    new CompressionStream("gzip"),
  );
  const buf = await new Response(stream).arrayBuffer();
  return buf.byteLength;
}

function formatKB(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} KB`;
}

interface Result {
  name: string;
  group: Subject["group"];
  min: number;
  gzip: number;
}

const results: Result[] = [];

for (const subject of subjects) {
  const bundle = await rolldown({
    input: subject.input,
    external: subject.external,
    plugins: subject.plugins,
    cwd: SCRIPTS_DIR,
    resolve: subject.alias ? { alias: subject.alias } : undefined,
  });
  const { output } = await bundle.generate({ format: "esm", minify: true });
  await bundle.close();

  const code = output
    .filter((chunk): chunk is OutputChunk => chunk.type === "chunk")
    .map((chunk) => chunk.code)
    .join("");
  results.push({
    name: subject.name,
    group: subject.group,
    min: new TextEncoder().encode(code).byteLength,
    gzip: await gzipSize(code),
  });
}

// --- render an ASCII bar chart (gzip size), scaled to the largest result ---

const BAR_WIDTH = 24;
const maxGzip = Math.max(...results.map((r) => r.gzip));
const nameWidth = Math.max(...results.map((r) => r.name.length));

function bar(gzip: number): string {
  const filled = Math.max(1, Math.round((gzip / maxGzip) * BAR_WIDTH));
  return "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
}

console.log();
console.log("```text");
for (const group of ["kin-form", "other"] as const) {
  for (const r of results.filter((x) => x.group === group)) {
    console.log(
      `${r.name.padEnd(nameWidth)}  ${bar(r.gzip)}  ${
        formatKB(r.gzip).padStart(8)
      } gzip (${formatKB(r.min)} min)`,
    );
  }
  console.log();
}
console.log("```");
