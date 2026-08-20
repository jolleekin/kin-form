import type { NextConfig } from "next";
import path from "node:path";

// Turbopack's `resolveAlias` rejects an absolute Windows path ("windows
// imports are not implemented yet"), even with forward slashes, so this is a
// plain project-root-relative string instead.
const kinFormPackages = ["core", "react", "validators"] as const;

const turbopackAliases = Object.fromEntries(
  kinFormPackages.map((
    name,
  ) => [`@kintools/form-${name}`, `../../${name}/index.ts`]),
);

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: turbopackAliases,
    // `next`/`react`/etc. live in the Deno workspace root's node_modules
    // (hoisted, not this package's own), so Turbopack needs to be told the
    // real workspace root to find them.
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
