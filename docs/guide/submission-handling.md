# Submission Handling

::: code-group

```tsx [React]
function LoginForm() {
  const form = useForm({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      await login(form.value);
    },
    onSubmitError: (form, error) => {
      toast.error("Failed to log in");
    },
  });

  return <form onSubmit={form.handleSubmit}>{/* ... */}</form>;
}
```

```ts [Lit]
@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      await login(form.value);
    },
    onSubmitError: (form, error) => {
      toast.error("Failed to log in");
    },
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        <!-- ... -->
      </form>
    `;
  }
}
```

:::

`handleSubmit`:

1. Waits out any pending validation.
2. If the form is invalid, marks it `touched` (so errors on never-blurred fields
   become visible) and calls `onSubmitInvalid`, then returns.
3. Otherwise sets `submitting` to `true`, calls `onSubmit`, and falls back to
   `onSubmitError` if it throws/rejects.

A no-op on a re-entrant call while already `submitting`. The `event` parameter
is optional and used only for `preventDefault()`, so the same call works from a
React Native `onPress`, any caller with no event, or a web `<form onSubmit>` as
shown above.

## Disabling the submit button while submitting

`submitting` (and `dirty`, for a "nothing to save" state) are ordinary reactive
state, so gate the button like any other field property:

::: code-group

```tsx [React]
<Watch api={form} select={(f) => [f.submitting, f.dirty] as const}>
  {(form, [submitting, dirty]) => (
    <button type="submit" disabled={submitting || !dirty}>
      Save
    </button>
  )}
</Watch>;
```

```ts [Lit]
watch(
  form,
  (f) => [f.submitting, f.dirty] as const,
  (_form, [submitting, dirty]) =>
    html`
      <button type="submit" ?disabled=${submitting || !dirty}>Save</button>
    `,
);
```

:::

## Disabling the whole form while submitting

Set `form.disabled = true` around `onSubmit`'s work.
[`disabled`](https://jsr.io/@kin-form/core/doc/index.ts/~/FieldApi.disabled)
cascades from a field down through every already-registered descendant, so
`form.disabled = true` reaches every field in the tree without watching
`submitting` anywhere:

::: code-group

```tsx [React]
const form = useForm({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    form.disabled = true;
    try {
      await login(form.value);
    } finally {
      form.disabled = false;
    }
  },
});
```

```ts [Lit]
#form = new FormApi({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    form.disabled = true;
    try {
      await login(form.value);
    } finally {
      form.disabled = false;
    }
  },
});
```

:::

<FrameworkText>
<template #react>

`disabled` on its own only skips validation; it doesn't reach the DOM by itself.
For it to actually disable an input, the component rendering that input has to
read its own field's `disabled` and fold it into whatever `disabled` prop the
caller passed in, the same way `TextField` does (see [Basic](/guide/basic)):

</template>
<template #lit>

`disabled` on its own only skips validation; it doesn't reach the DOM by itself.
For it to actually disable an input, the component rendering that input has to
read its own field's `disabled` and fold it into whatever `disabled` property
the caller set, the same way `text-field` does (see [Basic](/guide/basic)):

</template>
</FrameworkText>

::: code-group

```tsx [React]
const isDisabled = disabled || field.disabled;
```

```ts [Lit]
const isDisabled = this.disabled || field.disabled;
```

:::

<FrameworkText>
<template #react>

Each `TextField` is already subscribed to just its own field via `useWatch`, so
disabling a 50-field form during submit re-renders only the fields whose
`disabled` actually flipped, not `LoginForm` itself.

</template>
<template #lit>

Each `text-field` is already subscribed to just its own field via
`WatchController`, so disabling a 50-field form during submit updates only the
fields whose `disabled` actually flipped, not `login-form` itself.

</template>
</FrameworkText>

## What's next

- [`FormApi`](https://jsr.io/@kin-form/core/doc/index.ts/~/FormApi) — full
  reference on JSR
