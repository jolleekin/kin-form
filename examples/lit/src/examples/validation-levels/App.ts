import { html } from "lit";
import { FormApi, type Validator, watch } from "@kintools/form-lit";
import { required } from "@kintools/form-validators";
import "./components/SubmitButton.ts";
import "./components/TextField.ts";

type Stay = { startDate: string; endDate: string };

type Booking = {
  email: string;
  phone: string;
  stay: Stay;
};

// Lives on the `stay` group itself, not on either date field: it only makes
// sense as a statement about the *pair*.
const stayValidators: Validator<Stay, Booking>[] = [
  (group) => {
    const { startDate, endDate } = group.value;
    return startDate && endDate && endDate <= startDate
      ? "Check-out must be after check-in"
      : null;
  },
];

// Lives on the form itself: neither `email` nor `phone` is individually
// required, but at least one of them must be present.
const contactValidators: Validator<Booking, never>[] = [
  (form) =>
    form.value.email.trim() || form.value.phone.trim()
      ? null
      : "Provide an email or a phone number so we can reach you",
];

export default function App(): unknown {
  const form = new FormApi<Booking>({
    initialValue: {
      email: "",
      phone: "",
      stay: { startDate: "", endDate: "" },
    },
    validators: contactValidators,
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(
        `Booked ${form.value.stay.startDate} to ${form.value.stay.endDate}!`,
      );
    },
  });

  return html`
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">Book a stay</h1>
      <p class="mt-1 text-sm text-gray-500">
        <em>Check-out</em> is validated against <em>Check-in</em> on their
        shared <code>stay</code> group; "how to reach you" is validated on
        the form as a whole.
      </p>

      <form class="mt-6 space-y-4" @submit=${form.handleSubmit} novalidate>
        <validation-levels-text-field
          .api=${form.field("email")}
          label="Email"
          type="email"
        ></validation-levels-text-field>
        <validation-levels-text-field
          .api=${form.field("phone")}
          label="Phone"
          type="tel"
        ></validation-levels-text-field>

        ${StayFields(form)}

        ${FormError(form)}

        <validation-levels-submit-button
          .api=${form}
          button-class="w-full"
          pending-label="Booking…"
          label="Book"
        ></validation-levels-submit-button>
      </form>
    </div>
  `;
}

const dateValidators: Validator<string, Stay>[] = [required("Required")];

function StayFields(form: FormApi<Booking>): unknown {
  return watch(
    form.field("stay", { validators: stayValidators }),
    (group) => {
      const showError = group.invalid && group.touched;

      return html`
        <fieldset class="space-y-2">
          <legend class="text-sm font-medium text-gray-700">
            Stay dates
          </legend>
          <div class="grid grid-cols-2 gap-2">
            <validation-levels-text-field
              .api=${group.field("startDate", { validators: dateValidators })}
              type="date"
              label="Check-in"
            ></validation-levels-text-field>
            <validation-levels-text-field
              .api=${group.field("endDate", { validators: dateValidators })}
              type="date"
              label="Check-out"
            ></validation-levels-text-field>
          </div>
          ${showError
            ? html`<p class="text-sm text-red-600">${group.error}</p>`
            : ""}
        </fieldset>
      `;
    },
  );
}

function FormError(form: FormApi<Booking>): unknown {
  return watch(
    form,
    (f) => [f.error, f.touched] as const,
    (_form, [error, touched]) =>
      touched && error
        ? html`<p class="text-sm text-red-600">${error}</p>`
        : "",
  );
}
