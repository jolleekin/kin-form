# Submission Handling

::: code-group

```ts [Vanilla]
const form = new FormApi({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    await login(form.value);
  },
  onSubmitError: (form, error) => {
    toast.error("Failed to log in");
  },
});

formEl.addEventListener("submit", form.handleSubmit);
```

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

```ts [Vanilla]
form.subscribe(() => {
  submitButton.disabled = form.submitting || !form.dirty;
});
```

```tsx [React]
<Watch api={form} select={(f) => [f.submitting, f.dirty] as const}>
  {(form, [submitting, dirty]) => (
    <button type="submit" disabled={submitting || !dirty}>
      Save
    </button>
  )}
</Watch>;
```

:::

## What's next

- [`FormApi`](https://jsr.io/@kin-form/core/doc/index.ts/~/FormApi) — full
  reference on JSR
