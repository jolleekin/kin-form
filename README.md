# Kin Form

[![JSR @kin-form/core](https://jsr.io/badges/@kin-form/core)](https://jsr.io/@kin-form/core)
[![CI](https://github.com/jolleekin/kin-form/actions/workflows/ci.yml/badge.svg)](https://github.com/jolleekin/kin-form/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jolleekin/kin-form/branch/main/graph/badge.svg)](https://codecov.io/gh/jolleekin/kin-form)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat)
![Framework-agnostic](https://img.shields.io/badge/Framework--agnostic-166534?style=flat)
![Tiny footprint](https://img.shields.io/badge/Tiny%20footprint-166534?style=flat)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat)
![Zero dependencies](https://img.shields.io/badge/Zero%20dependencies-166534?style=flat)

[Documentation](https://kin-form.pages.dev) ·
[Get Started](https://kin-form.pages.dev/guide/getting-started)

Build your field components once. Reuse them everywhere.

A framework-agnostic form state library for TypeScript.

## The payoff

```tsx
<form onSubmit={form.handleSubmit}>
  <TextField api={form.field("email")} label="Email" />
  <AddressField api={form.field("shipping")} />
  <AddressField api={form.field("billing")} />
  <ItemsField api={form.field("items")} />
  <SubmitButton api={form}>Place order</SubmitButton>
</form>;
```

Each component receives a resolved `FieldApi`, not a path or form context.
Define the UI and behavior once, then mount it anywhere its value type fits. Kin
Form keeps that component independently subscribed, so a change only updates the
part of the form that depends on it. See
[Form Composition](https://kin-form.pages.dev/guide/form-composition) for the
full pattern.

## Feature matrix

|                                           | **Kin Form** | React Hook Form | Formik | TanStack Form |
| ----------------------------------------- | :----------: | :-------------: | :----: | :-----------: |
| Zero dependencies                         |      ✅      |       ✅        |   ❌   |      ⚠️       |
| Framework-agnostic core                   |      ✅      |       ❌        |   ❌   |      ✅       |
| Type-safe nested field paths              |      ✅      |       ✅        |   ❌   |      ✅       |
| Standard Schema support                   |      ⚠️      |       ⚠️        |   ❌   |      ✅       |
| Nested groups/arrays as first-class nodes |      ✅      |       ⚠️        |   ⚠️   |      ✅       |
| Selective re-rendering                    |      ✅      |       ✅        |   ⚠️   |      ✅       |
| Built-in async-validation debounce        |      ✅      |       ❌        |   ❌   |      ✅       |
| Declarative cross-field revalidation      |      ✅      |       ⚠️        |   ❌   |      ✅       |

✅ full support · ⚠️ partial, conditional, or requires an extra package · ❌ not
supported

## Bundle size

Each package's full public API, bundled and minified the same way (rolldown)
then gzipped. Reproduce with `deno task --cwd scripts bundle-size`. Not directly
comparable to Bundlephobia, which uses a different minifier (terser).

```text
@kin-form/core                                   ██████░░░░░░░░░░░░░░░░░░    4.4 KB
@kin-form/react (bindings only)                  █░░░░░░░░░░░░░░░░░░░░░░░    0.8 KB
@kin-form/validators                             █░░░░░░░░░░░░░░░░░░░░░░░    0.7 KB

Kin Form (core + react)                          ███████░░░░░░░░░░░░░░░░░    5.0 KB
React Hook Form                                  █████████████████░░░░░░░   13.0 KB
Formik                                           ██████████████████░░░░░░   13.9 KB
Tanstack Form (core + react)                     ████████████████████████   18.5 KB
```

## Performance

Flat field update, 800x burst, wall-clock median in Happy DOM: **1.39 ms** for
Kin Form vs 66.55 ms (React Hook Form), 3.30 ms (Formik), 564.24 ms (TanStack
Form). One scenario from a shared ~84-field benchmark form driven through the
same update plan against each library. Reproduce with
`deno task --cwd scripts speed-bench`.

See the [full comparison](https://kin-form.pages.dev/comparison/) for the
complete scenario breakdown (nested/array updates, validation, mount cost),
methodology notes, and code-by-code comparisons.

## Packages

| Package                                         | Description                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [`@kin-form/core`](./core/)                     | `FieldApi`, `FormApi` — the framework-agnostic form engine                                                                      |
| [`@kin-form/react`](./react/)                   | `useForm`, `useWatch`, `useMultistep`, `Watch` — React bindings                                                                 |
| [`@kin-form/lit`](./lit/)                       | `watch`, `WatchController`, `MultistepController` — Lit bindings                                                                |
| [`@kin-form/validators`](./validators/)         | `required`, `minLength`, `maxLength`, `min`, `max`, `url`, `email`, `pattern`, `maxFileSize`, `password`, `toSchemaValidator()` |
| [`@kin-form/react-devtools`](./react-devtools/) | `DevtoolsProvider`, `useFormDevtools` — inspector panel for a form's live tree state during development                         |
