# Multistep Forms

<FrameworkText>
<template #react>

`useMultistep` orchestrates a wizard's current-step state on top of one step per
named `FieldApi`. It validates the current step, waits for it to settle, and
gates the advance, so a hand-rolled multistep form doesn't repeat that per step.

</template>
<template #lit>

`MultistepController` orchestrates a wizard's current-step state on top of one
step per named `FieldApi`. It validates the current step, waits for it to
settle, and gates the advance, so a hand-rolled multistep form doesn't repeat
that per step.

</template>
</FrameworkText>

::: code-group

```tsx [React]
import { useForm, useMultistep, Watch } from "@kin-form/react";

type Checkout = {
  shipping: { address: string; city: string };
  payment: { cardNumber: string };
};

function CheckoutWizard() {
  const form = useForm<Checkout>({
    initialValue: {
      shipping: { address: "", city: "" },
      payment: { cardNumber: "" },
    },
  });

  const {
    stepName,
    stepField,
    isFirstStep,
    isLastStep,
    isTransitioning: isBusy,
    back,
    next,
  } = useMultistep(form, ["shipping", "payment", null]);

  return (
    <div>
      {stepName === "shipping" && <ShippingStep api={stepField} />}
      {stepName === "payment" && <PaymentStep api={stepField} />}
      {stepName === null && <ReviewStep form={form} />}

      {!isFirstStep && <button onClick={back}>Back</button>}
      {!isLastStep && <button onClick={next} disabled={isBusy}>Next</button>}
      {isLastStep && <SubmitButton api={form}>Submit</SubmitButton>}
    </div>
  );
}
```

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi, MultistepController } from "@kin-form/lit";
import "./shipping-step.ts";
import "./payment-step.ts";
import "./review-step.ts";
import "./submit-button.ts";

type Checkout = {
  shipping: { address: string; city: string };
  payment: { cardNumber: string };
};

@customElement("checkout-wizard")
class CheckoutWizard extends LitElement {
  #form = new FormApi<Checkout>({
    initialValue: {
      shipping: { address: "", city: "" },
      payment: { cardNumber: "" },
    },
  });

  #wizard = new MultistepController(
    this,
    this.#form,
    ["shipping", "payment", null],
  );

  override render() {
    const {
      stepName,
      stepField,
      isFirstStep,
      isLastStep,
      isTransitioning: isBusy,
      back,
      next,
    } = this.#wizard;

    return html`
      <div>
        ${stepName === "shipping"
          ? html`<shipping-step .api=${stepField}></shipping-step>`
          : ""}
        ${stepName === "payment"
          ? html`<payment-step .api=${stepField}></payment-step>`
          : ""}
        ${stepName === null
          ? html`<review-step .form=${this.#form}></review-step>`
          : ""}

        ${!isFirstStep ? html`<button @click=${back}>Back</button>` : ""}
        ${!isLastStep
          ? html`<button @click=${next} ?disabled=${isBusy}>Next</button>`
          : ""}
        ${isLastStep
          ? html`
            <submit-button .api=${this.#form}>Submit</submit-button>
          `
          : ""}
      </div>
    `;
  }
}
```

:::

## Step names

<FrameworkText>
<template #react>

Each entry in the second argument of `useMultistep` (`stepNames`) is the
`DeepKey` of that step's own `FieldApi`, or `null` for a step with no `FieldApi`
(e.g. a final review screen that only reads other steps' values). `next()`
treats a `null` step as always valid, skipping straight to `onBeforeNext`.

</template>
<template #lit>

Each entry in `MultistepController`'s third constructor argument (`stepNames`)
is the `DeepKey` of that step's own `FieldApi`, or `null` for a step with no
`FieldApi` (e.g. a final review screen that only reads other steps' values).
`next()` treats a `null` step as always valid, skipping straight to
`onBeforeNext`.

</template>
</FrameworkText>

## `next()`

1. If the current step has a `FieldApi`, waits for its validation to settle. If
   invalid, marks it `touched` (so errors on never-blurred fields become
   visible) and returns `false` without advancing.
2. Calls `onBeforeNext`, if given.
3. Advances to the next linear index, unless `onBeforeNext` redirected elsewhere
   (see below).

## Branching and persisting progress

`onBeforeNext` runs after the current step passes validation but before it
advances: the hook for persisting progress (e.g. saving a draft) or branching to
a non-linear next step:

::: code-group

```tsx [React]
const wizard = useMultistep(form, ["account", "shipping", "billing", null], {
  onBeforeNext: async ({ form, stepName }) => {
    await saveDraft(form.value);

    if (stepName === "account" && form.value.shipping.sameAsBilling) {
      return "billing"; // Skip the shipping step entirely.
    }
    // Returning nothing (or `true`) proceeds to the next linear index.
  },
});
```

```ts [Lit]
#wizard = new MultistepController(
  this,
  this.#form,
  ["account", "shipping", "billing", null],
  {
    onBeforeNext: async ({ form, stepName }) => {
      await saveDraft(form.value);

      if (stepName === "account" && form.value.shipping.sameAsBilling) {
        return "billing"; // Skip the shipping step entirely.
      }
      // Returning nothing (or `true`) proceeds to the next linear index.
    },
  },
);
```

:::

Returning `false` (or throwing) cancels the advance, leaving `stepIndex`
unchanged. Returning a step name (or `null`) redirects there instead.

## `back()` and `jump()`

Neither validates: they're for navigation the user triggers directly (a step
list, a "Skip" control), not for the current step's own "Next" action:

```tsx
wizard.back(); // Previous step.
wizard.jump(0); // By index, clamped to range.
wizard.jump("payment"); // By step name.
```

## `onStepChanged`

Runs after `stepIndex` actually changes, from `next()`, `back()`, or `jump()`
alike. Purely informational: it can't cancel anything.

::: code-group

```tsx [React]
useMultistep(form, steps, {
  onStepChanged: ({ stepIndex }) => trackWizardStep(stepIndex),
});
```

```ts [Lit]
#wizard = new MultistepController(this, this.#form, steps, {
  onStepChanged: ({ stepIndex }) => trackWizardStep(stepIndex),
});
```

:::
