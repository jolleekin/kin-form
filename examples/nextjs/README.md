# Kin Form + Next.js SSR example

A minimal Next.js (App Router) app whose only page is a server component
rendering `LoginForm`, a client component built with `@kin-form/react`
(`useForm`/`Watch`). Exists to exercise Kin Form's React bindings under real
SSR/static prerendering, not just Vite's client-only dev server the other
`examples/*` apps use.

Imports `@kin-form/core`/`@kin-form/react`/`@kin-form/validators` straight from
this repo's workspace source (`tsconfig.json` `paths` + a `next.config.ts`
webpack alias), not the published JSR/npm packages, so it always reflects the
current state of `core/`/`react/`/`validators/`.

## Running

You need Deno v2.0.0 or later installed.

```bash
$ deno task dev
```

Then open http://localhost:5556.

## Build

```bash
$ deno task build
$ deno task start
```

A successful `build` is the actual regression check: it statically prerenders
`/`, which runs `LoginForm` server-side. If `@kin-form/react`'s
`useSyncExternalStore` call is ever missing a `getServerSnapshot` argument
again, this build fails outright instead of just logging a console warning.
