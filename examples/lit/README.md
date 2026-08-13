# Kin Form examples (Lit)

One Vite app, twelve patterns — pick one from the sidebar. Each example's form
code lives in its own file under `src/examples/<slug>/`, self-contained
(including any local components), so it can be copy-pasted out as a starting
point on its own.

This is the Lit port of `examples/react`: same patterns, same value shapes, same
Tailwind styling, `@kin-form/lit`'s `watch`/`WatchController`/
`MultistepController` in place of `@kin-form/react`'s
`Watch`/`useWatch`/`useMultistep`. `virtual-list` uses `@tanstack/lit-virtual`
in place of `@tanstack/react-virtual`, and (unlike the React version) uses a
fixed row height rather than per-row dynamic measurement — see
`ContactList.ts`'s own doc comment for why.

Every reusable piece (text fields, submit buttons, array/address fields, the app
shell itself) is a real custom element, not a plain template function: elements
are queryable/inspectable in devtools the way plain `<div>`s from a function
aren't, which is worth more here than the generics a function component could
carry (lit-html's tag syntax has no mechanism to infer a custom element's
TypeScript generics from a usage site the way JSX does —
`.api=${x}`/`.renderItem=${fn}` property bindings on a tag aren't type-checked
by `tsc`/`deno check` at all, generic or not; catching typos there is what a
lit-html-aware editor plugin like `ts-lit-plugin` is for). Properties that only
ever hold a primitive (`label`, `required`, `type`, ...) are declared as real
Lit attributes instead, so those call sites are plain, static HTML attributes
(`label="Email"`, `required`) rather than property bindings.

Since a custom element registry is global and every example lives in one SPA
session (no full page reload between them), same-named components in different
example folders register their tag under a unique, folder-prefixed name
(`reusable-fields-text-field`, `schema-validation-text-field`, etc.) even where
the underlying implementation happens to be identical — never a
shared/consolidated tag name across folders, to keep every folder genuinely
self-contained and avoid `customElements.define()` collisions on navigation.

## Running

You need to have Deno v2.0.0 or later installed to run this repo.

Start a dev server:

```bash
$ deno task dev
```

## Deploy

Build production assets:

```bash
$ deno task build
```
