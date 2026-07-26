# Concepts

Every node in a Kin Form tree — a leaf input, a nested object, a nested array,
or the form itself — is the same class, `FieldApi`:

```
BaseApi → FieldApi<TValue, TParentValue> → FormApi<TValue>
```

| Class                             | Description                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `BaseApi`                        | `subscribe` / `notify` — the pub/sub primitive everything else builds on                                                            |
| `FieldApi<TValue, TParentValue>` | `value` / `error` / `touched` / `validating` / `dirty` / `validators`, `handleBlur` / `handleChange`, child registry, array helpers |
| `FormApi<TValue>`                | root: `parent=null`, `name=""`, + `submit`/`reset`                                                                                  |

This mirrors the DOM's own `EventTarget → Node → Document` shape: one node type
with optional children, not a separate class per leaf/container. Whether an
object/array-valued field is treated as one atomic leaf (bind `handleChange`
straight to a custom control) or decomposed into children (call `field()` per
sub-path) is entirely up to you — nothing in the engine forces either.
`FormApi` is just the `FieldApi` at the tree's root, with `parent` `null` and
`name` `""`, plus `submitting`/`reset`/`resetField`/`handleSubmit` added on
top.

## Shared state

Every node — leaf, nested field, or form — exposes:

| Property         | Type                            | Meaning                                                                                                                                                                   |
| ---------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`          | `TValue`                        | The node's current value. Setting it bubbles up into the parent's value; setting it on a node with registered children cascades down to each of them.                    |
| `error`          | `string \| null`                 | The result of the most recently settled validation run. `null` if valid.                                                                                                 |
| `schemaError`    | `string \| null`                 | This node's own slice of its parent's [`schemaErrorMap`](/guide/schema-validation) map, if any.                                                                          |
| `schemaErrorMap` | `Partial<Record<...>> \| null`   | A flat, dot-joined path -> message map produced by this node's own [`schemaValidator`](/guide/schema-validation), if any.<br/>A child reads its slice via its own `schemaError`. |
| `invalid`        | `boolean`                       | `true` if `error` or `schemaError` is set. Also `true` if any registered child is invalid, or this node's own [`schemaErrorMap`](/guide/schema-validation) is non-empty. |
| `touched`        | `boolean`                       | Whether the user has blurred this node. Also `true` if any registered child is touched.                                                                                  |
| `validating`     | `boolean`                       | Whether a validation run is currently pending/in-flight, for this node or any registered child.                                                                          |
| `dirty`          | `boolean`                       | Whether `value` differs from the reset baseline — see [Dirty Tracking & Reset](/guide/dirty-tracking-and-reset).                                                         |
| `name`           | `string`                        | This node's path relative to its parent (`""` at the form root).                                                                                                         |
| `id`             | `number`                        | A stable identity for this instance, independent of `name` — survives [array re-keying](/guide/dynamic-arrays).                                                          |

Every node also has `handleBlur`/`handleChange`, convenience handlers for
binding to a single control — meaningful whether that node is a leaf input or a
whole nested object/array edited atomically as one control (see
[Nested Objects](/guide/nested-objects)).

## Getting a field

`field` is called **relative to the node it's called on**, not the whole form,
and is idempotent — calling it again with the same name returns the same
instance, applying the given options instead of creating a new one:

```ts
const form = new FormApi({
  initialValue: { email: "", address: { line1: "" }, items: [{ code: "" }] },
});

const email = form.field("email");
const address = form.field("address");
const line1 = address.field("line1");
const firstItemCode = form.field("items.0.code");
```

It's fully typed against the form's value: `DeepKey<T>` computes every
dot-joined path into `T` (objects and arrays alike) as a literal string union,
and `DeepValue<T, Key>` resolves the value type at that path. A typo'd path is
a compile error, not a silent `undefined` at runtime.

## What's next

- [Basic](/guide/basic) — putting `field` to work in an actual form, and the
  `TextField` pattern the rest of these guides build on
- [Per-node Validation](/guide/per-node-validation) — validators, debouncing,
  running validation explicitly
- [Nested Objects](/guide/nested-objects) and
  [Dynamic Arrays](/guide/dynamic-arrays) — everything the child registry adds
- [Linked Fields](/guide/linked-fields) and [Listeners](/guide/listeners) —
  reacting to a value changing
- [`FieldApi`](https://jsr.io/@kin-form/core/doc/index.ts/~/FieldApi) and
  [`FormApi`](https://jsr.io/@kin-form/core/doc/index.ts/~/FormApi) — full
  reference on JSR
