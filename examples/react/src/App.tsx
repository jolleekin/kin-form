import { type ReactNode, Suspense, useEffect, useState } from "react";
import { examples } from "./registry.tsx";

function readSlugFromHash(): string {
  const slug = globalThis.location.hash.slice(1);
  return examples.some((example) => example.slug === slug)
    ? slug
    : examples[0].slug;
}

export default function App(): ReactNode {
  const [slug, setSlug] = useState(readSlugFromHash);

  useEffect(() => {
    const onHashChange = () => setSlug(readSlugFromHash());
    globalThis.addEventListener("hashchange", onHashChange);
    return () => globalThis.removeEventListener("hashchange", onHashChange);
  }, []);

  const selected = examples.find((example) => example.slug === slug)!;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <nav className="w-64 shrink-0 border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Kin Form Examples
          </h2>
        </div>
        <ul className="py-2">
          {examples.map((example, index) => (
            <li key={example.slug}>
              <a
                href={`#${example.slug}`}
                className={`flex items-center gap-2 px-4 py-2 text-sm ${
                  example.slug === selected.slug
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-xs tabular-nums text-gray-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {example.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="min-w-0 flex-1 flex flex-col">
        <div className="border-b border-gray-200 bg-white px-12 py-4">
          <h1 className="text-3xl font-semibold text-gray-900">
            {selected.title}
          </h1>
          <p className="mt-2 max-w-2xl text-gray-600">{selected.description}</p>
        </div>
        <div className="flex-1 flex items-start p-12">
          <Suspense
            key={selected.slug}
            fallback={
              <div className="px-6 py-8 text-sm text-gray-400">Loading…</div>
            }
          >
            <selected.Component />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
