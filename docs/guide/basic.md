# Basic

[Concepts](/guide/concepts) covered the state machine in the abstract; this page
builds an actual form with it, starting with the simplest way to bind an input,
then promoting that into a reusable `TextField`. The rest of these guides assume
a component like it exists.

## A login form

::: code-group

```tsx [React]
import { useForm, Watch } from "@kin-form/react";

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

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi, watch } from "@kin-form/lit";

@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      await login(form.value);
    },
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        ${watch(
          this.#form.field("email"),
          (field) =>
            html`
              <input
                .value=${field.value}
                @blur=${field.handleBlur}
                @input=${(e: Event) =>
                  field.handleChange((e.target as HTMLInputElement).value)}
              >
            `,
        )}

        ${watch(
          this.#form.field("password"),
          (field) =>
            html`
              <input
                type="password"
                .value=${field.value}
                @blur=${field.handleBlur}
                @input=${(e: Event) =>
                  field.handleChange((e.target as HTMLInputElement).value)}
              >
            `,
        )}

        ${watch(
          this.#form,
          (f) => f.submitting,
          (_form, submitting) =>
            html`
              <button type="submit" ?disabled=${submitting}>Log in</button>
            `,
        )}
      </form>
    `;
  }
}
```

:::

::: tip Highlight

Selective subscription and re-rendering is explicit.

<FrameworkText>
<template #react>

Each `Watch` only re-renders when the state it reads changes.

</template>
<template #lit>

Each `watch` call only re-renders the part it's bound to when the state it reads
changes.

</template>
</FrameworkText>

:::

`form.field(name, options)` resolves (creating on first call) the `FieldApi`
registered on `form` — see [Concepts](/guide/concepts#getting-a-field) for what
that resolution does.

<FrameworkText>
<template #react>

Safe to call inline in JSX on every render: `options` gets applied to an
already-registered field the same way every time, so re-calling it doesn't
re-create anything. `Watch` then subscribes the calling component to whatever
`api` it's given.

</template>
<template #lit>

Safe to call inline in a template on every render: `options` gets applied to an
already-registered field the same way every time, so re-calling it doesn't
re-create anything. `watch` then subscribes just that part of the template to
whatever `api` it's given.

</template>
</FrameworkText>

## Promoting to a reusable `TextField`

The `email`/`password` fields above are nearly identical: only the field name
and `type` differ. That repetition is the signal to extract a component:

::: code-group

```tsx [React]
import type { ReactNode } from "react";
import { type FieldApi, useWatch } from "@kin-form/react";

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

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FieldApi, WatchController } from "@kin-form/lit";

@customElement("text-field")
export class TextField extends LitElement {
  @property({ attribute: false })
  accessor api!: FieldApi<string, unknown>;

  @property()
  accessor label = "";

  @property()
  accessor type = "text";

  #watch = new WatchController(this, () => this.api);

  override render() {
    const field = this.#watch.value;
    return html`
      <label>
        ${this.label}
        <input
          type=${this.type}
          .value=${field.value}
          @blur=${field.handleBlur}
          @input=${(e: Event) =>
            field.handleChange((e.target as HTMLInputElement).value)}
        >
      </label>
      ${field.touched && field.invalid
        ? html`<span>${field.error ?? field.schemaError}</span>`
        : ""}
    `;
  }
}
```

:::

<FrameworkText>
<template #react>

Note the swap from `Watch` to `useWatch`. That's the general rule, not specific
to this example: `Watch` is for a shape that appears once; once it's a named,
reused component, call the hook directly instead of wrapping a render prop
around it.

`TextField` also takes an already-resolved `api` rather than `parent`+`name`:
the caller resolves the field (and its options) once, at the call site, the same
way it already does for `Watch` above. `TextField` only needs to know it's
rendering _some_ `FieldApi<string, TParentValue>`, not where in the tree it
lives or how it was configured.

</template>
<template #lit>

Note the swap from `watch` to `WatchController`. That's the general rule, not
specific to this example: `watch` is for a shape that appears once, inline in a
template; once it's a named, reused component, subscribe its own `render()` via
`WatchController` instead of wrapping it in `watch`.

`TextField` also takes an already-resolved `.api` property rather than
`parent`+`name`: the caller resolves the field (and its options) once, at the
call site, the same way it already does for `watch` above. `TextField` only
needs to know it's rendering _some_ `FieldApi<string, unknown>`, not where in
the tree it lives or how it was configured.

</template>
</FrameworkText>

## Promoting to a reusable `SubmitButton`

<FrameworkText>
<template #react>

The submit button's `Watch` follows the same shape as the fields above. Pull it
into a component that calls `useWatch` directly, and every form in the app
agrees on when submission is disabled:

</template>
<template #lit>

The submit button's `watch` follows the same shape as the fields above. Pull it
into a component that subscribes via `WatchController` directly, and every form
in the app agrees on when submission is disabled:

</template>
</FrameworkText>

::: code-group

```tsx [React]
import type { ReactNode } from "react";
import { type FormApi, useWatch } from "@kin-form/react";

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

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FormApi, WatchController } from "@kin-form/lit";

@customElement("submit-button")
export class SubmitButton extends LitElement {
  @property({ attribute: false })
  accessor api!: FormApi<unknown>;

  #watch = new WatchController(this, () => this.api, (f) => f.submitting);

  override render() {
    const submitting = this.#watch.value;
    return html`
      <button type="submit" ?disabled=${submitting}>
        <slot></slot>
      </button>
    `;
  }
}
```

:::

## The same form with reusable components

With the new `TextField` and `SubmitButton`, `LoginForm` collapses to:

::: code-group

```tsx [React]
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

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi } from "@kin-form/lit";
import "./text-field.ts";
import "./submit-button.ts";

@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => await login(form.value),
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        <text-field
          .api=${this.#form.field("email")}
          label="Email"
        ></text-field>

        <text-field
          .api=${this.#form.field("password")}
          label="Password"
          type="password"
        ></text-field>

        <submit-button .api=${this.#form}>Log in</submit-button>
      </form>
    `;
  }
}
```

:::

<FrameworkText>
<template #react>

In the same way, a `SelectField`, `AddressField`, `ItemsField`, or a wrapper
around any third-party input all follow this shape: an already-resolved `api`
in, `useWatch` to subscribe, whatever markup and value-parsing that input needs
in between. Write each one once per app and every call site collapses to a
single component call, typed against whatever value shape it's mounted on.

</template>
<template #lit>

In the same way, a `SelectField`, `AddressField`, `ItemsField`, or a wrapper
around any third-party input all follow this shape: an already-resolved `.api`
in, `WatchController` to subscribe, whatever markup and value-parsing that input
needs in between. Write each one once per app and every call site collapses to a
single custom element, typed against whatever value shape it's mounted on.

</template>
</FrameworkText>

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
