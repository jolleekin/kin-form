/**
 * A simple SSG file server.
 * 
 * ```sh
 * deno run -ENR ssg-file-server.ts
 * ```
 *
 * @env ROOT - The root directory. Default is ".".
 *
 * @module
 */

import { existsSync } from "jsr:@std/fs@1/exists";
import { walk } from "jsr:@std/fs@1/walk";
import { join } from "jsr:@std/path@1/join";
import { resolve } from "jsr:@std/path@1/resolve";
import { serveFile } from "jsr:@std/http@1/file-server";

/**
 * Mappings from pathname to local filesystem path.
 */
const files = new Map<string, string>();

/**
 * The root directory.
 */
const root = resolve(Deno.env.get("ROOT") ?? ".");

function normalize(path: string): string {
  return path.replace(/\\/g, "/").normalize();
}

for await (const file of walk(root)) {
  const pathname = normalize(file.path.slice(root.length));

  if (file.isFile) {
    files.set(pathname, file.path);

    if (pathname.endsWith(".html")) {
      // Support clean URLs, i.e. "/a/b/c" maps to "/a/b/c.html".
      files.set(pathname.slice(0, -5), file.path);

      if (pathname === "/index.html") {
        files.set("/", file.path);
      }
    }
  } else if (file.isDirectory) {
    const indexPath = join(file.path, "index.html");

    if (existsSync(indexPath)) {
      files.set(pathname, indexPath);
      files.set(pathname + "/", indexPath);
    }
  }
}

Deno.serve((req) => {
  const { pathname } = new URL(req.url);
  const fsPath = files.get(pathname);

  return fsPath
    ? serveFile(req, fsPath)
    : new Response("Not Found", { status: 404 });
});
