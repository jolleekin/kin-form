# @kin-form/core

[![JSR @kin-form/core](https://jsr.io/badges/@kin-form/core)](https://jsr.io/@kin-form/core)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat)
![Framework-agnostic](https://img.shields.io/badge/Framework--agnostic-166534?style=flat)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat)
![Zero dependencies](https://img.shields.io/badge/Zero%20dependencies-166534?style=flat)

The framework-agnostic core of Kin Form.

## Design principles

### One state machine, one shape

A form is a tree, and every node in it (leaf input, nested object/array, or the
form itself) is the same kind of thing: a `FieldApi`, holding
`value`/`error`/`touched`/`validating` and a lazily-populated registry of its
own child fields. Whether a given object/array-valued field is treated as one
atomic leaf (bind `handleChange` straight to a custom control) or decomposed
into children (call `field()` for each sub-path) is entirely up to the caller;
nothing in the engine forces one or the other. `FormApi` is just the `FieldApi`
at the tree's root (`parent` `null`, `name` `""`), with
`submitting`/`dirty`/`handleSubmit` added on top.

### Type-safe paths, not string soup

`DeepKey<T>` computes every dot-joined path into `T` (through objects and arrays
alike) as a literal string union; `DeepValue<T, Key>` resolves the value type at
that path. `form.field("address.line1")` or `form.field("items.0.code")`
type-check against your form's actual value type: a typo'd path is a compile
error, not a silent `undefined` at runtime.

### Stable array item identity

`pushItem`/`insertItem`/`moveItem`/`swapItems`/`removeItem` update the immutable
value and re-key the field registry together, so a field's identity follows its
item through a reorder, not whatever value now happens to sit at its old index.
Every field also carries a stable `id`, independent of `name`, that survives the
same reorders: the right list key for a list of array items (`key={field.id}` in
React, or `lit-html`'s `repeat` directive keyed on `field.id` in Lit) instead of
the index.

---

## Install

```sh [npm]
npx jsr add @kin-form/core
```

```sh [pnpm]
pnpm add jsr:@kin-form/core
```

```sh [deno]
deno add jsr:@kin-form/core
```

## Quick start

```ts
import { FormApi } from "@kin-form/core";

const form = new FormApi({
  initialValue: { email: "", address: { line1: "" }, items: [{ code: "" }] },
  onSubmit: async (form) => {
    await login(form.value);
  },
});

const emailField = form.field("email", {
  validators: [(f) => (f.value ? null : "Email is required")],
});

emailInput.addEventListener(
  "input",
  (e) => emailField.handleChange((e.target as HTMLInputElement).value),
);
emailInput.addEventListener("blur", emailField.handleBlur);
formEl.addEventListener("submit", form.handleSubmit);
```

Nested fields resolve relative to the field they're called on:

```ts
const address = form.field("address");
const line1 = address.field("line1");
```

Arrays keep field identity through a reorder:

```ts
form.pushItem("items", { code: "" });
form.swapItems("items", 0, 2);
form.removeItem("items", 1);
```

## Cross-field validation

Declare `dependents` to re-validate sibling fields whenever _this_ field's value
changes:

```ts
form.field("password", {
  dependents: ["confirmPassword"],
  validators: [(f) => (f.value ? null : "Password is required")],
});
form.field("confirmPassword", {
  validators: [
    (f) => f.value !== form.value.password ? "Passwords must match" : null,
  ],
});
```

Whenever `password` changes, `confirmPassword` is force-validated automatically,
with no manual subscriptions.

## Class hierarchy

```
BaseApi                         pub/sub
   |
   V
FieldApi<TValue, TParentValue>  state, configuration, event handlers,
   |                            child registry, array helpers
   V                            
FormApi<TValue>                 root: submission, reset
```

Mirrors the DOM's own `EventTarget → Node → Document` shape: one node type with
optional children, not a separate class per leaf/container distinction.

## Learn more

- [Why Kin Form?](../docs/guide/index.md) — the design rationale in full
- [Getting Started](../docs/guide/getting-started.md)
- [`FieldApi`](https://jsr.io/@kin-form/core/doc/index.ts/~/FieldApi) and
  [`FormApi`](https://jsr.io/@kin-form/core/doc/index.ts/~/FormApi) — full
  reference on JSR
- [`@kin-form/react`](../react/README.md) — React bindings
- [`@kin-form/lit`](../lit/README.md) — Lit bindings
- [`@kin-form/validators`](../validators/README.md) — `required`, `email`, a
  `toSchemaValidator()` adapter for zod/valibot, and more
