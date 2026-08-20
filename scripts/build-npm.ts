/**
 * Builds an npm-compatible package for one @kintools/form-* workspace member,
 * using dnt to transpile its Deno/TypeScript source into a hybrid ESM+CJS npm
 * package. Run from the repo root:
 *
 *   deno task --cwd scripts build-npm core
 *
 * (`scripts/` has its own deno.json rather than being a workspace member, so
 * it can pull in dnt without polluting the workspace's own dependency
 * graph.) Type-checking and tests already run separately via `deno check`
 * and `deno test` elsewhere in CI, so both are skipped here to keep this
 * step focused on producing the npm artifact.
 */

import { build, emptyDir } from "@deno/dnt";

interface Mapping {
  name: string;
  version: string;
  peerDependency?: boolean;
}

// Bare specifiers (resolved via each package's own deno.json "imports") that
// dnt can't infer a package.json dependency kind for on its own.
const MAPPINGS: Record<string, Record<string, Mapping>> = {
  react: {
    react: { name: "react", version: "^19.2.7", peerDependency: true },
  },
  "devtools-react": {
    react: { name: "react", version: "^19.2.7", peerDependency: true },
  },
  lit: {
    lit: { name: "lit", version: "^3.3.3", peerDependency: true },
  },
  validators: {
    "@standard-schema/spec": {
      name: "@standard-schema/spec",
      version: "^1.1.0",
    },
  },
};

// Only devtools-react ships .tsx source (a rendered inspector panel); the
// other packages' shipped code is plain .ts, so they need no JSX transform.
const JSX_PACKAGES = new Set(["devtools-react"]);

const pkg = Deno.args[0];
if (!pkg) {
  console.error("Usage: deno task --cwd scripts build-npm <package>");
  Deno.exit(1);
}

const pkgDir = `../${pkg}`;
const outDir = `${pkgDir}/npm`;
const denoJson = JSON.parse(await Deno.readTextFile(`${pkgDir}/deno.json`));

await emptyDir(outDir);

await build({
  entryPoints: [`${pkgDir}/index.ts`],
  outDir,
  shims: {},
  test: false,
  typeCheck: false,
  mappings: MAPPINGS[pkg],
  compilerOptions: JSX_PACKAGES.has(pkg)
    ? { jsx: "react-jsx", jsxImportSource: "react" }
    : undefined,
  package: {
    name: denoJson.name,
    version: denoJson.version,
    description: denoJson.description,
    license: denoJson.license,
    repository: {
      type: "git",
      url: "git+https://github.com/kintools-dev/form.git",
      directory: pkg,
    },
    bugs: { url: "https://github.com/kintools-dev/form/issues" },
    homepage: "https://kintools.dev/form",
  },
  postBuild() {
    Deno.copyFileSync("../LICENSE", `${outDir}/LICENSE`);
    Deno.copyFileSync(`${pkgDir}/README.md`, `${outDir}/README.md`);
  },
});
