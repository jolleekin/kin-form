# @kintools/form-devtools-react

[![JSR @kintools/form-devtools-react](https://jsr.io/badges/@kintools/form-devtools-react)](https://jsr.io/@kintools/form-devtools-react)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat)

An inspector panel for visualizing a
[`@kintools/form-react`](../react/README.md) form's live tree state during
development: every registered field/group's `value`, `error`, `touched`, and
`validating`, as they change.

## Install

```sh [npm]
npm add @kintools/form-devtools-react
```

```sh [pnpm]
pnpm add @kintools/form-devtools-react
```

```sh [deno]
deno add jsr:@kintools/form-devtools-react
```

## Setup

Mount `DevtoolsProvider` once, near the root of your app, typically only in
development:

```tsx
import { DevtoolsProvider } from "@kintools/form-devtools-react";

function App() {
  return (
    <DevtoolsProvider>
      <CheckoutForm />
    </DevtoolsProvider>
  );
}
```

Then opt each form in with `useFormDevtools`, right next to `useForm`:

```tsx
import { useForm } from "@kintools/form-react";
import { useFormDevtools } from "@kintools/form-devtools-react";

function CheckoutForm() {
  const form = useForm({ initialValue: { email: "", items: [] } });
  useFormDevtools(form, "checkout");

  return <form onSubmit={form.handleSubmit}>{/* ... */}</form>;
}
```

The optional `name` (`"checkout"` above) is shown in the panel's form selector
instead of the form's numeric id, useful once more than one form is registered
at a time.

`useFormDevtools` is a genuine no-op without an ancestor `DevtoolsProvider`: no
subscriber is ever added to the form's tree, so it's safe to leave the call in
place and only conditionally mount `DevtoolsProvider` based on environment:

```tsx
function App() {
  const children = <CheckoutForm />;
  return import.meta.env.DEV
    ? <DevtoolsProvider>{children}</DevtoolsProvider>
    : children;
}
```

## Docking the panel

The panel docks to a corner of the viewport (`"top-left"`, `"top-right"`,
`"bottom-left"`, or `"bottom-right"`), defaulting to `"bottom-right"`. Set a
different default with `initialPosition`, or let the user reposition it from the
panel itself (the choice persists across reloads):

```tsx
<DevtoolsProvider initialPosition="top-right">
  <App />
</DevtoolsProvider>;
```

## Learn more

- [Devtools guide](../docs/devtools/index.md)
- [`@kintools/form-react`](../react/README.md) — the hooks this panel inspects
