# Getting Started

## Install

::: code-group

```sh [Vanilla]
npx  jsr add @kin-form/core
pnpm add jsr:@kin-form/core
yarn add jsr:@kin-form/core
deno add jsr:@kin-form/core
```

```sh [React]
npx  jsr add @kin-form/react
pnpm add jsr:@kin-form/react
yarn add jsr:@kin-form/react
deno add jsr:@kin-form/react
```

:::

`@kin-form/react` includes `@kin-form/core`.

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

## Quick start

::: code-group

```ts [Vanilla]
import { FormApi } from "@kin-form/core/index.ts";
import { email, required } from "@kin-form/validators/index.ts";

const form = new FormApi({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    await login(form.value);
  },
});

const emailField = form.field("email", {
  validators: [required("Email is required"), email("Enter a valid email")],
});

emailInput.addEventListener(
  "input",
  (e) => emailField.handleChange((e.target as HTMLInputElement).value),
);
emailInput.addEventListener("blur", emailField.handleBlur);
formEl.addEventListener("submit", form.handleSubmit);
```

```tsx [React]
import { useForm, Watch } from "@kin-form/react/index.ts";
import { email, required } from "@kin-form/validators/index.ts";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      await login(form.value);
    },
    onSubmitError: () => toast.error("Failed to log in"),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Watch
        api={form.field("email", {
          validators: [
            required("Email is required"),
            email("Enter a valid email"),
          ],
        })}
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
