import { html } from "lit";

export type ExampleEntry = {
  slug: string;
  title: string;
  description: unknown;
  load: () => Promise<{ default: () => unknown }>;
};

// Order matches examples/react's registry — roughly increasing concept
// complexity, not alphabetical.
export const examples: ExampleEntry[] = [
  {
    slug: "basic",
    title: "Basic",
    description: html`
      A login form built with the raw <code>watch</code> directive: manual
      input wiring, inline validators, no extraction.
    `,
    load: () => import("./examples/basic/App.ts"),
  },
  {
    slug: "reusable-fields",
    title: "Reusable fields",
    description: html`
      The same login form as <em>Basic</em>, but with a reusable
      <code>TextField</code> function wrapping <code>watch</code> — the
      label/input/error boilerplate lives once, not per field.
    `,
    load: () => import("./examples/reusable-fields/App.ts"),
  },
  {
    slug: "reusable-group",
    title: "Reusable group",
    description: html`
      A shipping/billing form where one reusable <code>AddressField</code> — a
      <code>FieldApi</code>-bound nested field — is mounted twice.
      <em>Same as billing</em> assigns a whole nested field's value at once.
    `,
    load: () => import("./examples/reusable-group/App.ts"),
  },
  {
    slug: "reusable-array",
    title: "Reusable array",
    description: html`
      A profile form with two array fields — <code>skills</code> (strings)
      and <code>teamMembers</code> (objects) — both edited by the same
      generic <code>ArrayField</code> function via the group's own self-key.
    `,
    load: () => import("./examples/reusable-array/App.ts"),
  },
  {
    slug: "multistep",
    title: "Multistep",
    description: html`
      A sign-up wizard driven by <code>MultistepController</code>, with each
      step modeled as its own <code>FieldApi</code>. <em>Next</em> gates on
      the current step's field being valid; <code>onBeforeNext</code>
      persists a draft, can cancel the transition, and conditionally jumps
      business accounts through an extra <em>Company</em> step.
    `,
    load: () => import("./examples/multistep/App.ts"),
  },
  {
    slug: "nested-vs-flat",
    title: "Nested vs. flat",
    description: html`
      The same value shape and fields, composed two ways side by side: flat
      dotted paths straight off the form, versus explicit nested
      <code>FieldApi</code> fields. Both submit to an identical JSON preview.
    `,
    load: () => import("./examples/nested-vs-flat/App.ts"),
  },
  {
    slug: "conditional-fields",
    title: "Conditional fields",
    description: html`
      An attribute editor combining conditional rendering (plain template
      branching) with <code>dependents</code>, so switching a sibling
      <code>type</code> field re-validates <code>defaultValue</code>
      immediately.
    `,
    load: () => import("./examples/conditional-fields/App.ts"),
  },
  {
    slug: "validation-levels",
    title: "Validation levels",
    description: html`
      A booking form showing that validators work on any
      <code>FieldApi</code>, not just leaf fields — a nested-field-level
      date-range check and a form-level <em>at least one contact method</em>
      check.
    `,
    load: () => import("./examples/validation-levels/App.ts"),
  },
  {
    slug: "schema-validation",
    title: "Schema validation",
    description: html`
      A sign-up form mixing hand-written field validators for
      <code>email</code>/<code>password</code> with a whole-form Zod
      <code>refine()</code> check — via <code>@kin-form/validators</code>'s
      <code>toSchemaValidator()</code> adapter — for the
      password-confirmation invariant no single field can express.
    `,
    load: () => import("./examples/schema-validation/App.ts"),
  },
  {
    slug: "async-validation",
    title: "Async validation",
    description: html`
      A username field that checks availability against a simulated server on
      every change, debounced, with <code>field.validating</code> driving a
      spinner.
    `,
    load: () => import("./examples/async-validation/App.ts"),
  },
  {
    slug: "flat-array-validation",
    title: "Flat array validation",
    description: html`
      A registration form with a nested <code>contact</code> object and a
      dynamic <code>guests</code> array, every field a flat dotted path off
      <code>form</code> — no group. One whole-form Zod schema via
      <code>toSchemaValidator()</code> reports messages straight onto each
      field, even inside the array, since a flat field's <code>name</code> is
      already <code>toSchemaValidator()</code>'s key.
    `,
    load: () => import("./examples/flat-array-validation/App.ts"),
  },
  {
    slug: "virtual-list",
    title: "Virtual list",
    description: html`
      A 10,000-row contact directory windowed with
      <code>@tanstack/lit-virtual</code>, one <code>FieldApi</code> per row.
      Scrolling a row out of view unmounts it, but its value, touched, and
      error state live in the field tree, not the DOM node, so scroll back
      and they're still there.
    `,
    load: () => import("./examples/virtual-list/App.ts"),
  },
];
