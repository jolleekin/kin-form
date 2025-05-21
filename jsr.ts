/**
 * A utility script that generates/updates JSR json files.
 *
 * Based on https://github.com/oscarotero/jsr-pub
 *
 * Some modifications are made to make it more flexible.
 *
 * ```sh
 * cd path/to/package
 * deno run -A path/to/jsr.ts [OPTIONS]
 * ```
 *
 * @param --name
 * The package name. Required if no package JSON file exists.
 *
 * @param --version
 * The package version. Required if no version exists in the package JSON file
 * or git tags.
 *
 * @param --exports
 * The comma separated list of glob patterns of exported files.
 * If not provided, all `.ts` files excluding those with special file/folder
 * names will be exported. See {@linkcode mustBeIgnored}.
 *
 * @module
 */

/**
 * MIT License
 *
 * Copyright (c) 2024 Óscar Otero
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { expandGlob } from "jsr:@std/fs@1/expand-glob";
import { join } from "jsr:@std/path@1/join";
import { parseArgs } from "jsr:@std/cli@1/parse-args";

interface JSR {
  name?: string;
  version: string;
  exports: string | Record<string, string>;
}

interface Options {
  name?: string;
  version?: string;
  exports?: string;
  ignored?: string;
}

export async function main(options: Options): Promise<void> {
  const [file, config] = getConfig();
  const data = await jsr(options, config);
  if (!data.name) {
    console.error(
      "Missing package name. " +
        "Either pass a package name using --name=<PKG_NAME> or " +
        "specify it in deno.json or jsr.json."
    );
    return;
  }
  Object.assign(config, data);
  await Deno.writeTextFile(file, JSON.stringify(config, null, 2));

  console.log(`Updated ${file}`);
}

export async function jsr(
  options: Options,
  config: Partial<JSR>
): Promise<JSR> {
  return {
    name: options.name ?? config.name,
    version: await getVersion(options.version ?? config.version),
    exports: await getExports(options.exports?.split(",") || ["./**/*.ts"]),
  };
}

async function getVersion(version?: string): Promise<string> {
  const v = version?.trim() || (await getLatestTag());

  if (!v) throw new Error("No version found");

  return v.startsWith("v") ? v.slice(1) : v;
}

async function getExports(paths: string[]): Promise<Record<string, string>> {
  const exports: [string, string][] = [];
  const root = Deno.cwd();

  for (const path of paths) {
    for await (const entry of expandGlob(path, { root })) {
      if (entry.isDirectory) continue;

      const name =
        "." + join("/", entry.path.slice(root.length)).replaceAll("\\", "/");

      if (!mustBeIgnored(name)) {
        exports.push([name, name]);

        if (name.match(/^\.\/mod\.\w+$/)) {
          exports.push([".", name]);
        }
      }
    }
  }

  exports.sort(([a], [b]) => a.localeCompare(b));

  return Object.fromEntries(exports);
}

const extensions = new Set([".ts", ".js", ".tsx", ".jsx", ".mjs"]);

function mustBeIgnored(path: string): boolean {
  const fileExtension = path.slice(path.lastIndexOf("."));

  if (!extensions.has(fileExtension)) return true;

  return (
    path.includes("/global") ||
    path.includes("/tests/") ||
    path.includes("/test/") ||
    path.includes("/docs/") ||
    path.includes("/deps.") ||
    path.includes("/deps/") ||
    path.includes("/node_modules/") ||
    // path.endsWith(".d.ts") ||
    path.includes("/test.") ||
    path.includes(".test.") ||
    path.includes("_test.") ||
    path.includes("/bench.") ||
    path.includes(".bench.") ||
    path.includes("_bench.") ||
    path.includes("/.") ||
    path.includes("/_")
  );
}

async function getLatestTag(): Promise<string | undefined> {
  const command = new Deno.Command("git", {
    args: ["describe", "--tags", "--abbrev=0"],
  });

  const { stdout } = await command.output();
  const tag = new TextDecoder().decode(stdout).trim();

  if (tag.match(/^v?\d+\.\d+\.\d+$/)) {
    return tag;
  }
}

function getConfig(): [string, Record<string, unknown>] {
  const files = ["deno.json", "jsr.json"];

  for (const file of files) {
    try {
      const content = Deno.readTextFileSync(file);
      return [file, JSON.parse(content)];
    } catch {
      // Ignore
    }
  }

  return ["deno.json", {}];
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["name", "version", "exports"],
  });

  await main({
    name: args.name,
    version: args.version,
    exports: args.exports,
  });
}
