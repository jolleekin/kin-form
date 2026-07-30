# Devtools

::: info

React only for now: other framework bindings are planned.

:::

`@kin-form/react-devtools` is an inspector panel for visualizing a
`@kin-form/react` form's live tree state during development: every registered
field/group's `value`, `error`, `touched`, and `validating` as they change.

## Install

::: code-group

```sh [npm]
npx jsr add @kin-form/react-devtools
```

```sh [pnpm]
pnpm add jsr:@kin-form/react-devtools
```

```sh [deno]
deno add jsr:@kin-form/react-devtools
```

:::

## Setup

Mount `DevtoolsProvider` once, near the root of your app, typically only in
development:

```tsx
import { DevtoolsProvider } from "@kin-form/react-devtools/index.ts";

function App() {
  return import.meta.env.DEV
    ? (
      <StrictMode>
        <DevtoolsProvider>
          <CheckoutForm />
        </DevtoolsProvider>
      </StrictMode>
    )
    : <CheckoutForm />;
}
```

Then opt each form in with `useFormDevtools`, right next to `useForm`:

```tsx
import { useForm } from "@kin-form/react/index.ts";
import { useFormDevtools } from "@kin-form/react-devtools/index.ts";

function CheckoutForm() {
  const form = useForm({ initialValue: { email: "", items: [] } });
  useFormDevtools(form, "checkout");

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField api={form.field("email")} label="Email" />
    </form>
  );
}
```

The optional `name` (`"checkout"` above) is shown in the panel's form selector
instead of the form's numeric id, useful once more than one form is registered.

`useFormDevtools` is a no-op without an ancestor `DevtoolsProvider`: no
subscriber is added to the form's tree, so it's safe to leave the call in place
and mount `DevtoolsProvider` conditionally based on environment.

## Docking the panel

The panel docks to a corner of the viewport (`"top-left"`, `"top-right"`,
`"bottom-left"`, or `"bottom-right"`), defaulting to `"bottom-right"`. Set a
different default with `initialPosition`, or let the user reposition it from the
panel (the choice persists across reloads):

```tsx
<DevtoolsProvider initialPosition="top-right">
  <CheckoutForm />
</DevtoolsProvider>;
```
