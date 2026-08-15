# Getting Started

## Install

::: code-group

```sh [React]
npx  jsr add @kin-form/react
pnpm add jsr:@kin-form/react
yarn add jsr:@kin-form/react
deno add jsr:@kin-form/react
```

```sh [Lit]
npx  jsr add @kin-form/lit
pnpm add jsr:@kin-form/lit
yarn add jsr:@kin-form/lit
deno add jsr:@kin-form/lit
```

:::

`@kin-form/react` and `@kin-form/lit` re-export `@kin-form/core`.

To add common validators or the schema validation adapter:

::: code-group

```sh [npm]
npx jsr add @kin-form/validators
```

```sh [pnpm]
pnpm add jsr:@kin-form/validators
```

```sh [yarn]
yarn add jsr:@kin-form/validators
```

```sh [deno]
deno add jsr:@kin-form/validators
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
