# Basic

[Concepts](/guide/concepts) covered the state machine in the abstract; this page
builds an actual form with it — starting with `Watch`, the simplest way to bind
an input, then promoting that into a reusable `TextField`. The rest of these
guides assume a component like it exists.

## A login form with `Watch`

```tsx
import { useForm, Watch } from "@kin-form/react/index.ts";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      await login(form.value);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Watch api={form.field("email")}>
        {(field) => (
          <input
            value={field.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </Watch>

      <Watch api={form.field("password")}>
        {(field) => (
          <input
            type="password"
            value={field.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </Watch>

      <Watch api={form} select={(f) => f.submitting}>
        {(_form, submitting) => (
          <button type="submit" disabled={submitting}>
            Log in
          </button>
        )}
      </Watch>
    </form>
  );
}
```

::: tip Highlight

Selective subscription and re-rendering is explicit. Each `Watch` only
re-renders when the state it reads changes.

:::

`form.field(name, options)` resolves (creating on first call) the `FieldApi`
registered on `form` — see [Concepts](/guide/concepts#getting-a-field) for what
that resolution does. Safe to call inline in JSX on every render: `options` gets
applied to an already-registered field the same way every time, so re-calling it
doesn't re-create anything. `Watch` then subscribes the calling component to
whatever `api` it's given.

## Promoting to a reusable `TextField`

The `email`/`password` fields above are nearly identical — only the field name
and `type` differ. That repetition is the signal to extract a component, not a
`Watch` render prop:

```tsx
import type { ReactNode } from "react";
import { type FieldApi, useWatch } from "@kin-form/react/index.ts";

export type TextFieldProps<TParentValue> = {
  api: FieldApi<string, TParentValue>;
  label: string;
  type?: string;
};

export function TextField<TParentValue>(
  { api, label, type = "text" }: TextFieldProps<TParentValue>,
): ReactNode {
  const field = useWatch(api);

  return (
    <label>
      {label}
      <input
        type={type}
        value={field.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.touched && field.invalid && (
        <span>{field.error ?? field.schemaError}</span>
      )}
    </label>
  );
}
```

Note the swap from `Watch` to `useWatch` — the general rule, not specific to
this example: `Watch` is for a shape that appears once; once it's a named,
reused component, call the hook directly instead of wrapping a render prop
around it.

`TextField` also takes an already-resolved `api` rather than `parent`+`name` —
the caller resolves the field (and its options) once, at the call site, the same
way it already does for `Watch` above. `TextField` only needs to know it's
rendering _some_ `FieldApi<string, TParentValue>`, not where in the tree it
lives or how it was configured.

## Promoting to a reusable `SubmitButton`

The submit button's `Watch` follows the same shape as the fields above — pull it
into a component that calls `useWatch` directly, and every form in the app
agrees on when submission is disabled:

```tsx
import type { ReactNode } from "react";
import { type FormApi, useWatch } from "@kin-form/react/index.ts";

export type SubmitButtonProps<TValue> = {
  api: FormApi<TValue>;
  children: ReactNode;
};

export function SubmitButton<TValue>(
  { api, children }: SubmitButtonProps<TValue>,
): ReactNode {
  const submitting = useWatch(api, (f) => f.submitting);

  return (
    <button type="submit" disabled={submitting}>
      {children}
    </button>
  );
}
```

## The same form with reusable components

With the new `TextField` and `SubmitButton`, `LoginForm` collapses to:

```tsx
function LoginForm() {
  const form = useForm({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => await login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField api={form.field("email")} label="Email" />

      <TextField
        api={form.field("password")}
        label="Password"
        type="password"
      />

      <SubmitButton api={form}>Log in</SubmitButton>
    </form>
  );
}
```

In the same way, a `SelectField`, `AddressField`, `ItemsField`, or a wrapper
around any third-party input all follow this shape — an already-resolved `api`
in, `useWatch` to subscribe, whatever markup and value-parsing that input needs
in between. Write each one once per app and every call site collapses to a
single component call, typed against whatever value shape it's mounted on.

## What's next

- [Per-node Validation](/guide/per-node-validation) — validators, debouncing,
  running validation explicitly
- [Schema Validation](/guide/schema-validation) — validating a whole group/form
  with a Standard Schema library (zod, valibot, ...) instead
- [Form Composition](/guide/form-composition) — `AddressField`, `ItemsField`:
  reusable components for a nested group/array that owns its own state, building
  on `TextField`/`SubmitButton` from this page
- [Reactivity](/guide/reactivity) — `useWatch`/`Watch` in depth, including
  `select` for controlling re-renders
