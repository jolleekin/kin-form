---
layout: home
# Opts out of VPHomeContent's `.vp-doc` prose wrapper (link underlines,
# paragraph spacing, table display, etc.) — this page's markdown supplies
# all its own styling via style.css.
markdownStyles: false
---

<div class="home">

<section class="hero">
  <h1 class="section-header">Kin Form</h1>
  <p class="lede">Build your field components once. Reuse them everywhere.</p>
  <p class="prose">A framework-agnostic form state library for TypeScript.</p>
  <div class="actions">
    <a class="btn-primary" href="/guide/getting-started">Get Started</a>
    <a class="btn-secondary" href="https://github.com/kintools-dev/form">View on GitHub</a>
  </div>
</section>

<section class="reuse">
<h2 class="section-header">The payoff</h2>
<p class="lede">Forms read like composition, not wiring.</p>

::: code-group

```tsx [React]
<form onSubmit={form.handleSubmit}>
  <TextField api={form.field("email")} label="Email" />
  <AddressField api={form.field("shipping")} />
  <AddressField api={form.field("billing")} />
  <ItemsField api={form.field("items")} />
  <SubmitButton api={form}>Place order</SubmitButton>
</form>;
```

```ts [Lit]
html`
  <form @submit=${form.handleSubmit}>
    <text-field .api=${form.field("email")} label="Email"></text-field>
    <address-field .api=${form.field("shipping")}></address-field>
    <address-field .api=${form.field("billing")}></address-field>
    <items-field .api=${form.field("items")}></items-field>
    <submit-button .api=${form}>Place order</submit-button>
  </form>
`;
```

:::

<p class="prose">Each component receives a resolved <code>FieldApi</code>, not a path or form context. Define the UI and behavior once, then mount it anywhere its value type fits. Kin Form keeps that component independently subscribed, so a change only updates the part of the form that depends on it.</p>
<p><a class="cta" href="/guide/form-composition">Build reusable field components →</a></p>
</section>

<section class="why">
<h2 class="section-header">Why it exists</h2>
<p class="prose">Reusable field components <a class="cta" href="/comparison/react-hook-form#nested-group-field">become awkward</a> when a library treats the form as the only stateful object and fields as proxies into it. Nested objects, arrays, and shared validation then need their own special mechanisms.</p>
<p class="prose">Kin Form treats a form as a tree where every node (leaf, group, or the form itself) is the same thing, with its own state, configuration, and subscribers. That is why one component pattern works at every level.</p>
<p class="prose">Nothing forces one shape on a given value. Same <code>{ email, address: { line1, line2 } }</code>, three valid trees:</p>
<div class="why-trees">

<div class="tree-example">
<svg class="tree-diagram" viewBox="0 0 232 100" role="img" aria-labelledby="tree-one-title">
  <title id="tree-one-title">Form with two fields: email, and address as a single leaf.</title>
  <g class="tree-edge">
    <path d="M60,50 H74 V30 H88" />
    <path d="M60,50 H74 V70 H88" />
  </g>
  <g class="tree-node">
    <rect x="6" y="39" width="54" height="22" rx="4" />
    <rect x="88" y="19" width="54" height="22" rx="4" />
    <rect x="88" y="59" width="54" height="22" rx="4" />
  </g>
  <g class="tree-label">
    <text x="33" y="50">form</text>
    <text x="115" y="30">email</text>
    <text x="115" y="70">address</text>
  </g>
</svg>
<p class="tree-caption"><strong>Leaf.</strong> Any path in the value shape can be treated as a single leaf field. Here, <code>address</code> is.</p>
</div>

<div class="tree-example">
<svg class="tree-diagram" viewBox="0 0 232 100" role="img" aria-labelledby="tree-two-title">
  <title id="tree-two-title">Form with three flat fields: email, address.line1, and address.line2, all direct children of the form.</title>
  <g class="tree-edge">
    <path d="M60,50 H74 V20 H88" />
    <path d="M60,50 H74 V50 H88" />
    <path d="M60,50 H74 V80 H88" />
  </g>
  <g class="tree-node">
    <rect x="6" y="39" width="54" height="22" rx="4" />
    <rect x="88" y="9" width="54" height="22" rx="4" />
    <rect x="88" y="39" width="110" height="22" rx="4" />
    <rect x="88" y="69" width="110" height="22" rx="4" />
  </g>
  <g class="tree-label">
    <text x="33" y="50">form</text>
    <text x="115" y="20">email</text>
    <text x="143" y="50">address.line1</text>
    <text x="143" y="80">address.line2</text>
  </g>
</svg>
<p class="tree-caption"><strong>Flat.</strong> Every scalar is its own field, addressed by its full path.</p>
</div>

<div class="tree-example">
<svg class="tree-diagram" viewBox="0 0 232 100" role="img" aria-labelledby="tree-three-title">
  <title id="tree-three-title">Form with email as a leaf and address as a group, with line1 and line2 registered underneath it.</title>
  <g class="tree-edge">
    <path d="M60,42 H74 V20 H88" />
    <path d="M60,42 H74 V65 H88" />
    <path d="M142,65 H156 V50 H170" />
    <path d="M142,65 H156 V80 H170" />
  </g>
  <g class="tree-node">
    <rect x="6" y="31" width="54" height="22" rx="4" />
    <rect x="88" y="9" width="54" height="22" rx="4" />
    <rect x="88" y="54" width="54" height="22" rx="4" />
    <rect x="170" y="39" width="54" height="22" rx="4" />
    <rect x="170" y="69" width="54" height="22" rx="4" />
  </g>
  <g class="tree-label">
    <text x="33" y="42">form</text>
    <text x="115" y="20">email</text>
    <text x="115" y="65">address</text>
    <text x="197" y="50">line1</text>
    <text x="197" y="80">line2</text>
  </g>
</svg>
<p class="tree-caption"><strong>Grouped.</strong> <code>address</code> becomes an intermediate node, with <code>line1</code>/<code>line2</code> registered underneath it.</p>
</div>

</div>
</section>

<section class="system">
  <h2 class="section-header">What it does differently</h2>
  <div class="system-card principle-grid">
    <div class="principle"><h3 class="lede">One state machine, not two</h3><p>A nested group and a leaf field are the same class, not a special case bolted onto it.</p></div>
    <div class="principle"><h3 class="lede">Type-safe paths</h3><p><code>field("items.0.code")</code> type-checks against your value type, so a typo'd path is a compile error.</p></div>
    <div class="principle"><h3 class="lede">No special-case array API</h3><p>Push, insert, move, swap, and remove live on the same class every field already has, not a separate <code>useFieldArray</code> hook.</p></div>
    <div class="principle"><h3 class="lede">Declarative cross-field rules</h3><p>List <code>dependents</code> on a field to re-validate siblings, instead of wiring a manual subscription.</p></div>
    <div class="principle"><h3 class="lede">Selective re-rendering</h3><p>A change propagates only to the nodes it affects, so each subscriber re-renders only when the field, or selected state, it's watching actually changed.</p></div>
    <div class="principle"><h3 class="lede">Composable fields</h3><p>Your reusable <code>TextField</code>, <code>AddressField</code>, and <code>SubmitButton</code> each take a <code>FieldApi</code>, so they work the same way whether bound to a leaf, a subtree, or the whole form.</p></div>
  </div>
</section>

<section class="fit">
<h2 class="section-header">Is Kin Form a fit?</h2>
<div class="fit-card">
<div>
<h3 class="lede">Use it when forms become reusable UI.</h3>
<ul>
  <li>You maintain field components across forms or apps.</li>
  <li>Your forms have nested groups, repeatable rows, or multiple steps.</li>
  <li>You need stable array item identity and narrowly scoped re-renders.</li>
  <li>Field state must survive UI unmounts and remounts, such as rows in a virtual list.</li>
  <li>You want typed field paths without a separate array API.</li>
  <li>You need sync or async validation, scoped per field or subtree.</li>
</ul>
</div>
<div>
<h3 class="lede">Skip it when the simple thing is enough.</h3>
<ul>
  <li>The form is a small, one-off contact or login form.</li>
  <li>Component-local state is already simpler.</li>
  <li>Your team has a form-library standard that is working well and no pain worth migrating for.</li>
</ul>
</div>
</div>
</section>

<section class="numbers">
  <h2 class="section-header">How it compares</h2>
  <FeatureMatrix full />
  <div class="numbers-grid">
    <div class="system-card">
      <BundleSizeChart title="Bundle size (React usage, gzip)" />
    </div>
    <div class="system-card">
      <PerformanceHighlight title="Flat field update burst (800×)" />
    </div>
  </div>
  <p style="margin-top: 24px">Full comparison, including where Kin Form isn't the right fit: <a class="cta" href="/comparison/">see the details →</a></p>
</section>

<section class="demo">
  <h2 class="section-header">See it for yourself</h2>

<h3 class="demo-step">1. A login form</h3>

::: code-group

```tsx{12-13,28-29} [React]
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>

      {/* Watch is great for one-off UI or prototyping. */}
      {/* Only re-render when the email field changes. */}
      <Watch api={form.field("email", { validators: required("Required") })}>
        {(field) => (
          <label>
            Email
            <input
              value={field.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.touched && field.error && <span>{field.error}</span>}
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

```ts{14-15,31-32} [Lit]
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi, watch } from "@kintools/form-lit";
import { required } from "@kintools/form-validators";

@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>

        <!-- watch is great for one-off UI or prototyping. -->
        <!-- Only re-render this part when the email field changes. -->
        ${watch(
          this.#form.field("email", { validators: required("Required") }),
          (field) => html`
            <label>
              Email
              <input
                .value=${field.value}
                @blur=${field.handleBlur}
                @input=${(e: Event) =>
                  field.handleChange((e.target as HTMLInputElement).value)}
              >
            </label>
            ${field.touched && field.error
              ? html`<span>${field.error}</span>`
              : ""}
          `,
        )}

        <!-- Only re-render this part when form.submitting flips. -->
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

<h3 class="demo-step">2. Reusable TextField</h3>

::: code-group

```tsx{13} [React]
import type { ReactNode } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

export type TextFieldProps<TParentValue> = {
  api: FieldApi<string, TParentValue>;
  label: string;
  type?: string;
};

export function TextField<TParentValue>(
  { api, label, type = "text" }: TextFieldProps<TParentValue>,
): ReactNode {
  // Re-renders when the api's state changes.
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
        // Per-node validation and schema validation can co-exist.
        <span>{field.error ?? field.schemaError}</span>
      )}
    </label>
  );
}
```

```ts{15} [Lit]
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FieldApi, WatchController } from "@kintools/form-lit";

@customElement("text-field")
export class TextField extends LitElement {
  @property({ attribute: false })
  accessor api!: FieldApi<string, unknown>;

  @property()
  accessor label = "";

  // Re-renders when the api's state changes.
  #watch = new WatchController(this, () => this.api);

  override render() {
    const field = this.#watch.value;
    return html`
      <label>
        ${this.label}
        <input
          .value=${field.value}
          @blur=${field.handleBlur}
          @input=${(e: Event) =>
            field.handleChange((e.target as HTMLInputElement).value)}
        >
      </label>
      ${field.touched && field.invalid
        // Per-node validation and schema validation can co-exist.
        ? html`<span>${field.error ?? field.schemaError}</span>`
        : ""}
    `;
  }
}
```

:::

<h3 class="demo-step">3. Reusable SubmitButton</h3>

::: code-group

```tsx{12} [React]
import type { ReactNode } from "react";
import { type FormApi, useWatch } from "@kintools/form-react";

export type SubmitButtonProps<TValue> = {
  api: FormApi<TValue>; // Subclass of FieldApi.
  children: ReactNode;
};

export function SubmitButton<TValue>(
  { api, children }: SubmitButtonProps<TValue>,
): ReactNode {
  // Re-render only when submitting flips.
  const submitting = useWatch(api, (f) => f.submitting);

  return (
    <button type="submit" disabled={submitting}>
      {children}
    </button>
  );
}
```

```ts{14} [Lit]
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FormApi, WatchController } from "@kintools/form-lit";

@customElement("submit-button")
export class SubmitButton extends LitElement {
  @property({ attribute: false })
  accessor api!: FormApi<unknown>; // Subclass of FieldApi.

  // Re-render only when submitting flips.
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

<h3 class="demo-step">4. Form with reusable components</h3>

::: code-group

```tsx{14-18} [React]
import { useForm } from "@kintools/form-react";
import { required } from "@kintools/form-validators";
import { TextField } from "./TextField.tsx";
import { SubmitButton } from "./SubmitButton.tsx";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField
        api={form.field("email", { validators: required("Required") })}
        label="Email"
      />
      <SubmitButton api={form}>Log in</SubmitButton>
    </form>
  );
}
```

```ts{13-16} [Lit]
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi } from "@kintools/form-lit";
import { required } from "@kintools/form-validators";
import "./text-field.ts";
import "./submit-button.ts";

@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        <text-field
          .api=${this.#form.field("email", {
            validators: required("Required"),
          })}
          label="Email"
        ></text-field>
        <submit-button .api=${this.#form}>Log in</submit-button>
      </form>
    `;
  }
}
```

:::

</section>

</div>
