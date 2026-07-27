import { lazy, type LazyExoticComponent, type ReactNode } from "react";

export type ExampleEntry = {
  slug: string;
  title: string;
  description: ReactNode;
  Component: LazyExoticComponent<() => ReactNode>;
};

// Order matches the original numbered example folders — roughly increasing
// concept complexity, not alphabetical.
export const examples: ExampleEntry[] = [
  {
    slug: "basic",
    title: "Basic",
    description: (
      <>
        A login form built with the raw <code>Watch</code>{" "}
        render-prop: manual input wiring, inline validators, no extraction.
      </>
    ),
    Component: lazy(() => import("./examples/basic/App.tsx")),
  },
  {
    slug: "reusable-fields",
    title: "Reusable fields",
    description: (
      <>
        The same login form as <em>Basic</em>, but with a reusable{" "}
        <code>TextField</code> component wrapping <code>useWatch</code>{" "}
        — the label/input/error boilerplate lives once, not per field.
      </>
    ),
    Component: lazy(() => import("./examples/reusable-fields/App.tsx")),
  },
  {
    slug: "reusable-group",
    title: "Reusable group",
    description: (
      <>
        A shipping/billing form where one reusable <code>AddressField</code> — a
        {" "}
        <code>FieldApi</code>-bound nested field — is mounted twice.{" "}
        <em>Same as billing</em> assigns a whole nested field's value at once.
      </>
    ),
    Component: lazy(() => import("./examples/reusable-group/App.tsx")),
  },
  {
    slug: "reusable-array",
    title: "Reusable array",
    description: (
      <>
        A profile form with two array fields — <code>skills</code> (strings) and
        {" "}
        <code>teamMembers</code> (objects) — both edited by the same generic
        {" "}
        <code>ArrayField</code> component via the group's own self-key.
      </>
    ),
    Component: lazy(() => import("./examples/reusable-array/App.tsx")),
  },
  {
    slug: "multistep",
    title: "Multistep",
    description: (
      <>
        A sign-up wizard driven by{" "}
        <code>useMultistep</code>, with each step modeled as its own{" "}
        <code>FieldApi</code>. <em>Next</em>{" "}
        gates on the current step's field being valid; <code>onBeforeNext</code>
        {" "}
        persists a draft, can cancel the transition, and conditionally jumps
        business accounts through an extra <em>Company</em> step.
      </>
    ),
    Component: lazy(() => import("./examples/multistep/App.tsx")),
  },
  {
    slug: "nested-vs-flat",
    title: "Nested vs. flat",
    description: (
      <>
        The same value shape and fields, composed two ways side by side: flat
        dotted paths straight off the form, versus explicit nested{" "}
        <code>FieldApi</code> fields. Both submit to an identical JSON preview.
      </>
    ),
    Component: lazy(() => import("./examples/nested-vs-flat/App.tsx")),
  },
  {
    slug: "conditional-fields",
    title: "Conditional fields",
    description: (
      <>
        An attribute editor combining conditional rendering (plain JSX
        branching) with <code>dependents</code>, so switching a sibling{" "}
        <code>type</code> field re-validates <code>defaultValue</code>{" "}
        immediately.
      </>
    ),
    Component: lazy(() => import("./examples/conditional-fields/App.tsx")),
  },
  {
    slug: "validation-levels",
    title: "Validation levels",
    description: (
      <>
        A booking form showing that validators work on any{" "}
        <code>FieldApi</code>, not just leaf fields — a nested-field-level
        date-range check and a form-level <em>at least one contact method</em>
        {" "}
        check.
      </>
    ),
    Component: lazy(() => import("./examples/validation-levels/App.tsx")),
  },
  {
    slug: "schema-validation",
    title: "Schema validation",
    description: (
      <>
        A sign-up form mixing hand-written field validators for{" "}
        <code>email</code>/<code>password</code> with a whole-form Zod{" "}
        <code>refine()</code> check — via <code>@kin-form/validators</code>'s
        {" "}
        <code>toSchemaValidator()</code>{" "}
        adapter — for the password-confirmation invariant no single field can
        express.
      </>
    ),
    Component: lazy(() => import("./examples/schema-validation/App.tsx")),
  },
  {
    slug: "async-validation",
    title: "Async validation",
    description: (
      <>
        A username field that checks availability against a simulated server on
        every change, debounced, with <code>field.validating</code>{" "}
        driving a spinner.
      </>
    ),
    Component: lazy(() => import("./examples/async-validation/App.tsx")),
  },
  {
    slug: "flat-array-validation",
    title: "Flat array validation",
    description: (
      <>
        A registration form with a nested <code>contact</code>{" "}
        object and a dynamic <code>guests</code>{" "}
        array, every field a flat dotted path off <code>form</code> — no{" "}
        group. One whole-form Zod schema via <code>toSchemaValidator()</code>
        {" "}
        reports messages straight onto each field, even inside the array, since
        a flat field's <code>name</code> is already{" "}
        <code>toSchemaValidator()</code>'s key.
      </>
    ),
    Component: lazy(() => import("./examples/flat-array-validation/App.tsx")),
  },
  {
    slug: "virtual-list",
    title: "Virtual list",
    description: (
      <>
        A 10,000-row contact directory windowed with{" "}
        <code>@tanstack/react-virtual</code>, one <code>FieldApi</code>{" "}
        per row. Scrolling a row out of view unmounts it, but its value,
        touched, and error state live in the field tree, not the DOM node, so
        scroll back and they're still there.
      </>
    ),
    Component: lazy(() => import("./examples/virtual-list/App.tsx")),
  },
];
