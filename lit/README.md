# @kin-form/lit

[![JSR @kin-form/lit](https://jsr.io/badges/@kin-form/lit)](https://jsr.io/@kin-form/lit)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat)

Lit bindings for [`@kin-form/core`](../core/README.md): the `watch` directive to
subscribe just one part of a template to an already-resolved
`FieldApi`/`FormApi`, `WatchController` to subscribe a whole component's
`render()`, and `MultistepController` for wizard-style forms. Resolve a field
via `parent.field(name, options)` directly, no separate helper for that.
`@kin-form/lit` depends on and re-exports everything from `@kin-form/core`, so
no need to install it separately.

## Install

```sh [npm]
npx jsr add @kin-form/lit
```

```sh [pnpm]
pnpm add jsr:@kin-form/lit
```

```sh [deno]
deno add jsr:@kin-form/lit
```

## Quick start

```ts
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi, watch } from "@kin-form/lit";
import { required } from "@kin-form/validators";

@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => await login(form.value),
    onSubmitError: () => toast.error("Failed to log in"),
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        ${watch(
          this.#form.field("email", {
            validators: required("Email is required"),
          }),
          (field) =>
            html`
              <input
                .value=${field.value}
                @blur=${field.handleBlur}
                @input=${(e: Event) =>
                  field.handleChange((e.target as HTMLInputElement).value)}
              >
              ${field.invalid && field.touched
                ? html`<span>${field.error}</span>`
                : ""}
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

## Resolving a field

`parent.field(name, options)` (see [`@kin-form/core`](../core/README.md)) gets
(creating on first call) the `FieldApi` registered under `name` on `parent`, for
a leaf value, a nested object/array, or an array item alike, the same accessor
either way. It's safe to call inline in a template on every render: on an
already-registered field, `options` is applied via `updateOptions` the same way
every time, so re-calling it doesn't re-create anything.

## `watch`

A directive that subscribes the containing part to `api`, re-rendering just that
part (not the whole host) on every change - the binding to reach for inside a
plain function or `render()` that isn't otherwise a `ReactiveElement` subscribed
via `WatchController`:

```ts
html`
  ${watch(
    form.field("email", { validators: [required()] }),
    (field) =>
      html`
        <input
          .value=${field.value}
          @blur=${field.handleBlur}
          @input=${(e: InputEvent) =>
            field.handleChange((e.target as HTMLInputElement).value)}
        >
      `,
  )}
`;
```

Pass a `select` between `api` and `render` to additionally narrow the
subscription down to a selected value, passed as `render`'s second argument,
instead of updating on every change:

```ts
watch(
  itemsField,
  (f) => f.value.length,
  (_field, count) => html`<span>${count} items</span>`,
);
```

Only valid in child (content) position, not as an attribute/property binding.

## `WatchController`

A `ReactiveController` subscription to a `FieldApi`/`FormApi`, for a reusable
component that wants its own `render()` to update on `api` changes, without
wrapping its whole output in `watch`:

```ts
class MyTextField extends LitElement {
  @property({ attribute: false })
  accessor api!: FieldApi<string, unknown>;

  #watch = new WatchController(this, () => this.api);

  override render() {
    const field = this.#watch.value;
    return html`
      <input
        .value=${field.value}
        @blur=${field.handleBlur}
        @input=${(e: InputEvent) =>
          field.handleChange((e.target as HTMLInputElement).value)}
      >
    `;
  }
}
```

With no `select`, calls `host.requestUpdate()` on any change and `value` reads
back `api` itself. With `select`, only requests an update when the selected
value changes, and `value` reads back that selected value instead.

## `MultistepController`

Orchestrates a wizard's `stepIndex` state on top of one step per named
`FieldApi`: validating the current step, waiting for it to settle, and gating
the advance, so a hand-rolled wizard doesn't have to repeat that per step.

```ts
class MyWizard extends LitElement {
  #form = new FormApi({
    initialValue: { account: { email: "" }, profile: { name: "" } },
  });
  #step = new MultistepController(this, this.#form, ["account", "profile"]);

  override render() {
    return html`
      <span>Step ${this.#step.stepIndex + 1} of ${this.#step.stepCount}</span>
      <button @click=${this.#step.back} ?disabled=${this.#step.isFirstStep}>
        Back
      </button>
      <button @click=${this.#step.next}>
        ${this.#step.isLastStep ? "Submit" : "Next"}
      </button>
    `;
  }
}
```

## Learn more

- [`examples/lit`](../examples/lit/) - twelve runnable patterns, from a basic
  login form through async validation, nested arrays, schema validation, and a
  virtualized list
- [`watch`](https://jsr.io/@kin-form/lit/doc/index.ts/~/watch),
  [`WatchController`](https://jsr.io/@kin-form/lit/doc/index.ts/~/WatchController),
  and
  [`MultistepController`](https://jsr.io/@kin-form/lit/doc/index.ts/~/MultistepController) -
  full reference on JSR
- [`@kin-form/validators`](../validators/README.md) - `required`, `email`,
  `minLength`, and a `toSchemaValidator()` adapter for zod/valibot
