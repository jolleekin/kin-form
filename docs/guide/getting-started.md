# Getting Started

## Install

::: code-group

```sh [React]
npm  add @kintools/form-react
pnpm add @kintools/form-react
yarn add @kintools/form-react
deno add jsr:@kintools/form-react
```

```sh [Lit]
npm  add @kintools/form-lit
pnpm add @kintools/form-lit
yarn add @kintools/form-lit
deno add jsr:@kintools/form-lit
```

:::

`@kintools/form-react` and `@kintools/form-lit` re-export `@kintools/form-core`.

To add common validators or the schema validation adapter:

::: code-group

```sh [npm]
npm add @kintools/form-validators
```

```sh [pnpm]
pnpm add @kintools/form-validators
```

```sh [yarn]
yarn add @kintools/form-validators
```

```sh [deno]
deno add jsr:@kintools/form-validators
```

:::

## What's next

- [Concepts](/guide/concepts) — the tree model, shared state, and typed paths
- [Basic](/guide/basic) — building `TextField` from `Watch`, the pattern the
  rest of these guides lean on
- [Per-node Validation](/guide/per-node-validation) — validators, debouncing,
  and running validation explicitly
- [Nested Objects](/guide/nested-objects) and
  [Dynamic Arrays](/guide/dynamic-arrays)
- [Validators](/validators/) — `required`, `email`, `minLength`, a
  `toSchemaValidator()` adapter for zod/valibot, and more
