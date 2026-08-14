# Kin Form + Next.js SSR example

A minimal Next.js (App Router) app whose only page is a server component
rendering `LoginForm`, a client component built with `@kin-form/react`
(`useForm`/`Watch`) plus a reusable `TextField`. Exists to exercise Kin Form's
React bindings under real SSR, not just Vite's client-only dev server the other
`examples/*` apps use.

Imports `@kin-form/core`/`@kin-form/react`/`@kin-form/validators` straight from
this repo's workspace source (`tsconfig.json` `paths` + a `next.config.ts`
Turbopack `resolveAlias`), not the published JSR/npm packages, so it always
reflects the current state of `core/`/`react/`/`validators/`.

## Running

You need Deno v2.0.0 or later installed.

```bash
$ deno task dev
```

Then open http://localhost:5555 and check the page source (or the browser
console) for a "Missing getServerSnapshot" warning — that's the regression this
example exists to catch.

## Build

`deno task build` currently fails on this repo's layout: Next 16.3.0's
page-data-collection build workers can't find the workspace's hoisted
`node_modules` (everything else resolves fine via `turbopack.root`, just not
those workers), even for the stock `/_not-found` page with no custom code.
Confirmed as specific to the hoisted-`node_modules` monorepo layout, not
anything in this app: a standalone Next 16 project with its own local
`node_modules` builds fine. `dev` is unaffected and is what this example relies
on for now.
