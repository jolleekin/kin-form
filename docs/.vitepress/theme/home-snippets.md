<div class="home-snippets">
<div class="vp-doc">

<FrameworkSnippet>
<template #react>

::: code-group

```tsx{12-13,28-29} [1. Form with Watch]
import { useForm, Watch } from "@kin-form/react";
import { required } from "@kin-form/validators";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* Only re-render when the email field changes. */}
      <Watch api={form.field("email", { validators: required("Required") })}>
        {(field) => (
          <label>
            Email
            <input
              value={field.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.touched && field.error && (
              <span>{field.error ?? field.schemaError}</span>
            )}
          </label>
        )}
      </Watch>

      {/* Only re-render when `form.submitting` flips. */}
      <Watch api={form} select={(f) => f.submitting}>
        {(_form, submitting) => (
          <button type="submit" disabled={submitting}>Log in</button>
        )}
      </Watch>
    </form>
  );
}
```

```tsx{13} [2. Reusable TextField]
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

```tsx{12} [3. Reusable SubmitButton]
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

```tsx{9-10} [4. Form with reusable components]
function LoginForm() {
  const form = useForm({
    initialValue: { email: "" },
    onSubmit: async (form) => await login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField api={form.field("email")} label="Email" />
      <SubmitButton api={form}>Log in</SubmitButton>
    </form>
  );
}
```

:::

</template>
</FrameworkSnippet>

</div>
</div>

<style>
.home-snippets {
  padding: 0 24px;
}
@media (min-width: 640px) {
  .home-snippets {
      padding: 0 48px;
  }
}
@media (min-width: 960px) {
  .home-snippets {
    padding: 0 64px;
  }
}

.vp-doc {
  max-width: 1152px;
  margin: 0 auto;
}
</style>
