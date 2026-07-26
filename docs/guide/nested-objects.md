# Nested Objects

A nested object in your form's value is represented by the same `FieldApi` (see
[Concepts](/guide/concepts)), decomposed into its own lazily-populated registry
of child fields instead of edited as one atomic value.

```ts
const form = new FormApi({
  initialValue: { email: "", address: { line1: "", city: "" } },
});

const address = form.field("address");
const line1 = address.field("line1");
```

## Resolve the intermediate field first

`field` resolves **relative to the field it's called on**, not the whole form.
For a field nested under an object, resolve the parent field before the child:

```ts
const address = form.field("address");
const line1 = address.field("line1");
```

You only _have_ to do this if something needs `"address"` as its own node — its
own `validators`/`schemaValidator`, or its own aggregated `touched`/`invalid`.
Otherwise, addressing the nested value directly by its flat dotted path
(`form.field("address.line1")`) is fine — the normal shape for
[schema-validated forms](/guide/schema-validation#flat-trees-no-intermediate-fields-needed),
which don't need an intermediate field per nesting level.

What's **not** allowed is registering the same path both ways — resolving
`"address"` as its own node and _also_ addressing something under it as a flat
field directly on `form`:

```ts
// Throws: "address" is already registered on `form`, so a flat field at
// "address.line1" would leave two disconnected nodes tracking overlapping
// (not identical) slices of value.
form.field("address");
form.field("address.line1");
```

This collision is caught explicitly rather than silently creating an orphaned
duplicate — use whichever form you reach for consistently for that path.

## Binding to a nested field

`parent.field(name)` works the same way regardless of whether the path resolves
to a leaf or a nested object — a group `api` is passed into a reusable
component the same way a leaf `api` is, following the same shape as `TextField`
in [Basic](/guide/basic#promoting-to-a-reusable-textfield):

::: code-group

```tsx [React]
import type { ReactNode } from "react";
import type { FieldApi } from "@kin-form/react/index.ts";

export type AddressFieldProps<TParentValue> = {
  api: FieldApi<Address, TParentValue>;
};

export function AddressField<TParentValue>(
  { api }: AddressFieldProps<TParentValue>,
): ReactNode {
  return (
    <fieldset>
      <TextField api={api.field("line1")} label="Line 1" />
      <TextField api={api.field("city")} label="City" />
    </fieldset>
  );
}
```

:::

## Aggregated state

A node's `touched`/`invalid`/`validating` reflect **itself or any registered
child**:

```ts
address.invalid; // true if `address` itself has a node-level error,
// OR any field registered under it does
```

Setting `touched` cascades to every registered child. `handleBlur`/
`handleChange` still make sense on a node with children — bind them directly to
a custom control that edits the whole nested object atomically (e.g. a
date-range picker backed by `{ start, end }`), same as for a leaf. Avoid calling
`handleBlur` on a node you're _also_ decomposing into individually-focusable
child inputs — that forces every descendant `touched` for what wasn't really a
single control's blur event.

## The child registry

`children` is the `Map` of every child field created so far via `field`,
populated lazily — a field never requested (e.g. its input never rendered) won't
appear yet:

```ts
for (const [name, field] of form.children) {
  console.log(name, field.value, field.invalid);
}
```

`onChildrenChanged(cb)` notifies when the _set_ of children changes (a field
registered or unregistered), not when an existing child's state changes. It's a
separate channel from the ordinary `subscribe`/`notify` path (see
[Reactivity](/guide/reactivity)), meant for introspection tooling (like the
[devtools panel](/guide/devtools)) rather than typical `useWatch` consumers.

A child is unregistered automatically once its path stops existing in its
parent's value — from [`removeItem`](/guide/dynamic-arrays) or any other value
change — cancelling its pending debounced validation and unregistering its own
children first.

## What's next

- [Dynamic Arrays](/guide/dynamic-arrays) — the array-specific half of the child
  registry
- [Flat vs. Nested Structure](/guide/flat-vs-nested) — choosing nested fields
  vs. flat dotted paths, level by level
- [`FieldApi`](https://jsr.io/@kin-form/core/doc/index.ts/~/FieldApi) — full
  reference on JSR
