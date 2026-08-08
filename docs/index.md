---
layout: home
# Opts out of VPHomeContent's `.vp-doc` prose wrapper (link underlines,
# paragraph spacing, table display, etc.) — this page's markdown supplies
# all its own styling via style.css.
markdownStyles: false
---

<div class="home">

<section class="hero">
  <h1>Kin Form</h1>
  <p class="tagline">A reactive form state library for TypeScript.<br/>Framework-agnostic core, type-safe field paths, React bindings built in.</p>
  <div class="actions">
    <a class="btn-primary" href="/guide/getting-started">Get Started</a>
    <a class="btn-secondary" href="https://github.com/jolleekin/kin-form">View on GitHub</a>
  </div>
</section>

<section class="why">
<p class="eyebrow">Why it exists</p>
<p class="why-lede">Every form library I'd used was either not type-safe, too heavy, or overcomplicated, often some combination of all three. Most treat the form and its fields as different things: the form owns the state, fields are just proxies into it.</p>
<p class="why-lede">Form state management doesn't need to be that heavy or complicated. A form is a tree, and every node in it, leaf field, group field, or the form itself, is the same thing, with its own state, configuration, and subscribers.</p>
<p class="why-lede">Nothing forces one shape on a given value. Same <code>{ email, address: { line1, line2 } }</code>, three valid trees:</p>
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
  <p class="eyebrow">What it does differently</p>
  <div class="system-card principle-grid">
    <div class="principle"><h4>One state machine, not two</h4><p>A nested group and a leaf field are the same class, not a special case bolted onto it.</p></div>
    <div class="principle"><h4>Type-safe paths</h4><p><code>field("items.0.code")</code> type-checks against your value type, so a typo'd path is a compile error.</p></div>
    <div class="principle"><h4>No special-case array API</h4><p>Push, insert, move, swap, and remove live on the same class every field already has, not a separate <code>useFieldArray</code> hook.</p></div>
    <div class="principle"><h4>Declarative cross-field rules</h4><p>List <code>dependents</code> on a field to re-validate siblings, instead of wiring a manual subscription.</p></div>
    <div class="principle"><h4>Localized subscriptions</h4><p>Each node notifies only its own subscribers, so <code>useWatch</code>/<code>select</code> narrows a re-render to exactly the field, or selected state, that changed.</p></div>
    <div class="principle"><h4>Composable fields</h4><p>Your reusable <code>TextField</code>, <code>AddressField</code>, and <code>SubmitButton</code> each take a <code>FieldApi</code>, so they work the same way whether bound to a leaf, a subtree, or the whole form.</p></div>
  </div>
</section>

<section class="numbers">
  <p class="eyebrow">How it compares</p>
  <FeatureMatrix />
  <div class="numbers-grid">
    <div class="system-card">
      <BundleSizeChart title="Bundle size (React usage, gzip)" />
    </div>
    <div class="system-card">
      <PerformanceHighlight title="Flat field update burst (800×)" />
    </div>
  </div>
  <p class="numbers-cta">Full comparison, including where Kin Form isn't the right fit: <a href="/comparison/">see the details →</a></p>
</section>

<section class="demo">
  <p class="eyebrow">See it for yourself</p>

<FrameworkSnippet>
<template #react>

<h3 class="demo-framework">React</h3>

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
        {/* Per-node validation and schema validation can co-exist. */}
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
  // Re-render only when submitting flips.
  const submitting = useWatch(api, (f) => f.submitting);

  return (
    <button type="submit" disabled={submitting}>
      {children}
    </button>
  );
}
```

```tsx{11-15} [4. Form with reusable components]
import { required } from "@kin-form/validators";

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

:::

</template>
</FrameworkSnippet>

</section>

</div>
