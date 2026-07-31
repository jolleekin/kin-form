import type { ReactNode } from "react";
import {
  type FormApi,
  useForm,
  useWatch,
  type Validator,
  Watch,
} from "@kin-form/react";
import { useFormDevtools } from "@kin-form/react-devtools";
import { required } from "@kin-form/validators";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";

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

export default function App() {
  const form = useForm<Booking>({
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

  useFormDevtools(form);

  return (
    <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">Book a stay</h1>
      <p className="mt-1 text-sm text-gray-500">
        <em>Check-out</em> is validated against <em>Check-in</em>{" "}
        on their shared <code>stay</code>{" "}
        group; "how to reach you" is validated on the form as a whole.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit}
        noValidate
      >
        <TextField api={form.field("email")} label="Email" type="email" />
        <TextField api={form.field("phone")} label="Phone" type="tel" />

        <StayFields form={form} />

        <FormError form={form} />

        <SubmitButton api={form} className="w-full" pendingLabel="Booking…">
          Book
        </SubmitButton>
      </form>
    </div>
  );
}

const dateValidators: Validator<string, Stay>[] = [required("Required")];

function StayFields({ form }: { form: FormApi<Booking> }): ReactNode {
  const group = useWatch(
    form.field("stay", { validators: stayValidators }),
  );
  const showError = group.invalid && group.touched;

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700">Stay dates</legend>
      <div className="grid grid-cols-2 gap-2">
        <TextField
          api={group.field("startDate", { validators: dateValidators })}
          type="date"
          label="Check-in"
        />
        <TextField
          api={group.field("endDate", { validators: dateValidators })}
          type="date"
          label="Check-out"
        />
      </div>
      {showError && <p className="text-sm text-red-600">{group.error}</p>}
    </fieldset>
  );
}

function FormError({ form }: { form: FormApi<Booking> }): ReactNode {
  return (
    <Watch api={form} select={(f) => [f.error, f.touched] as const}>
      {(_form, [error, touched]) =>
        touched && error
          ? <p className="text-sm text-red-600">{error}</p>
          : null}
    </Watch>
  );
}
