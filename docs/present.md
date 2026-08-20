---
layout: false
title: Kin Form — Presentation
description: Kin Form, one section per screen.
head:
  - - meta
    - name: robots
      content: noindex
---

<a class="present-exit" href="/" title="Exit presentation">✕</a>

<div class="home present">

<section class="hero">
  <h1 class="section-header">Kin Form</h1>
  <p class="lede">Build your field components once. Reuse them everywhere.</p>
  <div class="actions">
    <a class="btn-primary" href="/guide/getting-started">Get Started</a>
    <a class="btn-secondary" href="https://github.com/kintools-dev/form">View on GitHub</a>
  </div>
  <p class="present-byline">Man Hoang (Kin)</p>
</section>

<section class="reuse">
<h2 class="section-header">The payoff</h2>
<p class="lede">Forms read like composition, not wiring.</p>

```tsx
<form onSubmit={form.handleSubmit}>
  <TextField api={form.field("email")} label="Email" />
  <AddressField api={form.field("shipping")} />
  <AddressField api={form.field("billing")} />
  <ItemsField api={form.field("items")} />
  <SubmitButton api={form}>Place order</SubmitButton>
</form>;
```

<p class="prose">Each component receives a resolved <code>FieldApi</code>, not a path or form context, so it mounts anywhere its value type fits and stays independently subscribed.</p>
<p class="reuse-cta"><a href="/guide/form-composition">Build reusable field components →</a></p>
</section>

<section class="why">
<h2 class="section-header">Why it exists</h2>
<p class="prose">Kin Form treats a form as a tree: every node (leaf, group, or the form itself) is the same thing.</p>
<p class="prose">Kin Form is flexible: same <code>{ email, address: { line1, line2 } }</code>, three valid trees:</p>
<div class="why-trees">

<div class="tree-example">
<svg class="tree-diagram" viewBox="0 0 232 100" role="img" aria-labelledby="tree-one-title-p">
  <title id="tree-one-title-p">Form with two fields: email, and address as a single leaf.</title>
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
<svg class="tree-diagram" viewBox="0 0 232 100" role="img" aria-labelledby="tree-two-title-p">
  <title id="tree-two-title-p">Form with three flat fields: email, address.line1, and address.line2, all direct children of the form.</title>
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
<svg class="tree-diagram" viewBox="0 0 232 100" role="img" aria-labelledby="tree-three-title-p">
  <title id="tree-three-title-p">Form with email as a leaf and address as a group, with line1 and line2 registered underneath it.</title>
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
  <p class="numbers-cta">Full comparison, including where Kin Form isn't the right fit: <a href="/comparison/">see the details →</a></p>
</section>

<section class="demo">
  <h2 class="section-header">See it for yourself</h2>

::: code-group

```tsx{12-13,28-29} [1. Form with Watch]
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

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

```tsx{12} [3. Reusable SubmitButton]
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

```tsx{11-15} [4. Form with reusable components]
import { required } from "@kintools/form-validators";

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

</section>

</div>

<style scoped>
/* Turns the homepage's own section flow into one fullscreen slide per
   section, scroll-snapped, without redeclaring any of the typography,
   color, or spacing rules `style.css` already gives these same classes
   on the regular homepage. */
.present {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
}

.present > section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow-y: auto;
  padding: 3rem 1rem 0;
}
  .present > section:first-child {
    justify-content: center;
  }
  .present > section:last-child {
    padding-top: 1rem;
  }

.present-exit {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--code-bg);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1;
}

.present-exit:hover {
  color: var(--text);
  border-color: var(--text);
}

.present-byline {
  margin: 24px 0 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-muted);
}
</style>
