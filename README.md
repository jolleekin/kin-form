# Kin Form

[![JSR @kin-form/core](https://jsr.io/badges/@kin-form/core)](https://jsr.io/@kin-form/core)
[![CI](https://github.com/jolleekin/kin-form/actions/workflows/ci.yml/badge.svg)](https://github.com/jolleekin/kin-form/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jolleekin/kin-form/branch/main/graph/badge.svg)](https://codecov.io/gh/jolleekin/kin-form)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat)
![Framework-agnostic](https://img.shields.io/badge/Framework--agnostic-166534?style=flat)
![Tiny footprint](https://img.shields.io/badge/Tiny%20footprint-166534?style=flat)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat)
![Zero dependencies](https://img.shields.io/badge/Zero%20dependencies-166534?style=flat)

Form state that stays out of your way.

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
@kin-form/core                                   █████░░░░░░░░░░░░░░░░░░░    4.2 KB
@kin-form/react (bindings only)                  █░░░░░░░░░░░░░░░░░░░░░░░    0.8 KB
@kin-form/validators                             █░░░░░░░░░░░░░░░░░░░░░░░    0.7 KB

Kin Form (core + react)                          ██████░░░░░░░░░░░░░░░░░░    4.8 KB
React Hook Form                                  █████████████████░░░░░░░   13.0 KB
Formik                                           ██████████████████░░░░░░   13.9 KB
Tanstack Form (core + react)                     ████████████████████████   18.5 KB
```

## Performance

One shared ~84-field form (20 flat fields, a nested group, a 20-item array)
driven through the same update plan against React Hook Form, Formik, and
TanStack Form. Reproduce with `deno task --cwd scripts speed-bench`. Numbers are
wall-clock medians in Happy DOM (JS-only, no layout/paint) — a proxy for
state-management overhead, not browser-realistic timing.

| Scenario (800x burst)        | Kin Form | React Hook Form |   Formik | TanStack Form |
| ---------------------------- | -------: | --------------: | -------: | ------------: |
| Flat field update            |  1.39 ms |        66.55 ms |  3.30 ms |     564.24 ms |
| Nested field update          |  3.68 ms |       166.63 ms |  6.36 ms |     574.47 ms |
| Array swap                   | 72.29 ms |       221.32 ms | 11.99 ms |    1514.68 ms |
| Array insert/remove          | 33.40 ms |       434.70 ms |  5.10 ms |    1608.80 ms |
| Sync-validated field update  |  3.42 ms |       160.25 ms | 67.66 ms |     709.82 ms |
| Debounced async validation   | 90.56 ms |       221.59 ms | 98.79 ms |     952.59 ms |
| Whole-form schema validation |  2.07 ms |         4.98 ms |  2.84 ms |      29.95 ms |
| Initial mount (84 fields)    |  2.87 ms |         5.14 ms |  2.38 ms |       9.50 ms |

Notes:

- React Hook Form is measured via `Controller`/`useController`, not `register()`
  — real apps using `register()` see fewer re-renders than this implies.
- Debounce is native for Kin Form/TanStack Form, hand-rolled (`setTimeout`) for
  React Hook Form/Formik, to compare like for like.
- Kin Form and React Hook Form hold untouched sibling re-renders at 0 for flat
  and nested updates; Formik re-renders its whole context (19 siblings);
  TanStack re-renders the ancestor group.

See [`scripts/speed-bench.ts`](./scripts/speed-bench.ts) for full methodology.

See [`docs/comparison/`](./docs/comparison/) for full code-by-code comparisons,
including React Hook Form and Formik.

## Packages

| Package                                         | Description                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [`@kin-form/core`](./core/)                     | `FieldApi`, `FormApi` — the framework-agnostic form engine                                                                      |
| [`@kin-form/react`](./react/)                   | `useForm`, `useWatch`, `useMultistep`, `Watch` — React bindings                                                                 |
| [`@kin-form/validators`](./validators/)         | `required`, `minLength`, `maxLength`, `min`, `max`, `url`, `email`, `pattern`, `maxFileSize`, `password`, `toSchemaValidator()` |
| [`@kin-form/react-devtools`](./react-devtools/) | `DevtoolsProvider`, `useFormDevtools` — inspector panel for a form's live tree state during development                         |
