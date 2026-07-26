# @kin-form/react

[![JSR @kin-form/react](https://jsr.io/badges/@kin-form/react)](https://jsr.io/@kin-form/react)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat)

React bindings for [`@kin-form/core`](../core/README.md): `useForm` to create a
form, `Watch` (or the underlying `useWatch` hook) to subscribe a component to an
already-resolved `FieldApi`/`FormApi` — resolved via
`parent.field(name,
options)` directly, no separate hook for that.
`@kin-form/react` depends on and re-exports everything from `@kin-form/core`, so
no need to install it separately.

## Install

```sh [npm]
npx jsr add @kin-form/react
```

```sh [pnpm]
pnpm add jsr:@kin-form/react
```

```sh [deno]
deno add jsr:@kin-form/react
```

## Quick start

```tsx
import { useForm, Watch } from "@kin-form/react/index.ts";
import { required } from "@kin-form/validators/index.ts";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => await login(form.value),
    onSubmitError: () => toast.error("Failed to log in"),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Watch
        api={form.field("email", { validators: required("Email is required") })}
      >
        {(field) => (
          <>
            <input
              value={field.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.invalid && field.touched && <span>{field.error}</span>}
          </>
        )}
      </Watch>

      <Watch api={form} select={(f) => f.submitting}>
        {(_form, submitting) => (
          <button type="submit" disabled={submitting}>Log in</button>
        )}
      </Watch>
    </form>
  );
}
```

## `useForm`

Creates a `FormApi` once and calls `updateOptions` on it every render, so
`onSubmit`/`onSubmitInvalid`/`onSubmitError` (and validators/dependents) stay in
sync with the latest render's closures instead of going stale. Doesn't itself
subscribe the calling component — pass the returned instance to `Watch` for
that.

## Resolving a field

`parent.field(name, options)` (see [`@kin-form/core`](../core/README.md)) gets
(creating on first call) the `FieldApi` registered under `name` on `parent` —
for a leaf value, a nested object/array, or an array item alike, the same
accessor either way. It's safe to call inline in JSX on every render: on an
already-registered field, `options` is applied via `updateOptions` the same way
every time, so re-calling it doesn't re-create anything. For an array, the
field's own _value_ is the array, so array methods are called on it with `""`.

There's no separate hook for this — `field()` is a plain method, and inferring
its `name` argument from a string literal works reliably without one.

## `Watch`

A render-prop component that subscribes to any already-resolved
`FieldApi`/`FormApi`, without writing a custom component around `useWatch`
yourself:

```tsx
function EmailInput({ parent }: { parent: FieldApi<{ email: string }> }) {
  return (
    <Watch
      api={parent.field("email", {
        validators: [(f) => (f.value ? null : "Email is required")],
      })}
    >
      {(field) => (
        <input
          value={field.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
    </Watch>
  );
}
```

`children` always receives `api` as its first argument — pass `select` to
additionally narrow the subscription down to a derived slice, passed as the
second argument, instead of re-rendering on every change:

```tsx
<Watch api={itemsField} select={(f) => f.value.length}>
  {(_field, count) => <span>{count} items</span>}
</Watch>;
```

Works the same way for a nested object or array — resolve the parent field
first, then call `field`/`Watch` again on it:

```tsx
<Watch api={form.field("address")}>
  {(address) => (
    <Watch api={address.field("city")}>{(f) => <input /* ... */ />}</Watch>
  )}
</Watch>;
```

For an array, a field's own _value_ is the array, so array methods are called on
it with `""` — this stays generic over where in the tree it's mounted:

```tsx
function ArrayField<Item>(
  { api, newItem }: { api: FieldApi<Item[]>; newItem: () => Item },
) {
  return <button onClick={() => api.pushItem("", newItem())}>Add</button>;
}
```

For a field that appears in multiple places, define a reusable component around
`Watch` (or `useWatch` directly) instead (e.g. `TextField`, `AddressField`)
rather than repeating a `<Watch>` render prop everywhere — see
[Form Composition](../docs/guide/form-composition.md).

## `useMultistep`

Orchestrates a wizard's current-step state on top of one step per named
`FieldApi` — validating the current step, waiting for it to settle, and gating
the advance:

```tsx
const wizard = useMultistep(form, ["shipping", "payment", null]);

wizard.stepName; // "shipping" | "payment" | null
wizard.next(); // validates the current step, then advances
wizard.back();
wizard.jump("payment");
```

See [Multistep Forms](../docs/guide/multistep.md) for branching, persisting
progress mid-wizard, and `onStepChanged`.

## Learn more

- [Reactivity](../docs/guide/reactivity.md) — `useWatch`/`Watch` in depth,
  including `select` for controlling re-renders
- [`useForm`](https://jsr.io/@kin-form/react/doc/index.ts/~/useForm),
  [`useWatch`](https://jsr.io/@kin-form/react/doc/index.ts/~/useWatch), and
  [`Watch`](https://jsr.io/@kin-form/react/doc/index.ts/~/Watch) — full
  reference on JSR
- [Form Composition](../docs/guide/form-composition.md) — building reusable
  `TextField`/`AddressField`/`ItemsField`/`SubmitButton` components
- [Multistep Forms](../docs/guide/multistep.md) — `useMultistep` for
  wizard-style forms
- [`@kin-form/validators`](../validators/README.md) — `required`, `email`,
  `minLength`, and a `toSchemaValidator()` adapter for zod/valibot
- [`@kin-form/react-devtools`](../react-devtools/README.md) — an inspector panel
  for a form's live tree state
