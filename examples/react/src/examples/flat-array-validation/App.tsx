import { useCallback } from "react";
import { useForm, Watch } from "@kin-form/react";
import { useFormDevtools } from "@kin-form/react-devtools";
import { toSchemaValidator } from "@kin-form/validators";
import { z } from "zod";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";

// Stable per-guest identity for React's list `key`.
//
// This is a symbol, so it's ignored by `JSON.stringify`. No submit-time
// filtering needed to keep it off the wire.
const GUEST_KEY = Symbol("guestKey");
let guestKey = 0;

const registrationSchema = z.object({
  contact: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Enter a valid email address"),
  }),
  guests: z.array(
    z.object({
      [GUEST_KEY]: z.number(),
      name: z.string().min(1, "Name is required"),
      email: z.email("Enter a valid email address"),
    }),
  ).min(1, "Add at least one guest"),
});

type Registration = z.infer<typeof registrationSchema>;

export default function App() {
  const form = useForm<Registration>({
    initialValue: { contact: { name: "", email: "" }, guests: [] },
    schemaValidator: toSchemaValidator(registrationSchema),
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));

      alert(`Registered ${form.value.guests.length + 1} attendee(s).`);
    },
  });

  useFormDevtools(form);

  const addGuest = useCallback(() => {
    form.pushItem("guests", {
      name: "",
      email: "",
      [GUEST_KEY]: ++guestKey,
    });
  }, [form]);

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">
        Event registration
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Every field below is a flat dotted path straight off <code>form</code>
        {" "}
        — no <code>FieldGroup</code>, for the nested <code>contact</code>{" "}
        object or the dynamic <code>guests</code>{" "}
        array. One Zod schema validates the whole tree via{" "}
        <code>toSchemaValidator()</code>, and each field, even inside the array,
        picks up its own message automatically.
      </p>

      <form
        className="mt-6 space-y-6"
        onSubmit={form.handleSubmit}
        noValidate
      >
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-gray-700">
            Your details
          </legend>

          <TextField api={form.field("contact.name")} label="Name" />
          <TextField api={form.field("contact.email")} label="Email" />
        </fieldset>

        <Watch api={form} select={(api) => api.value.guests}>
          {(_form, guests) => (
            <fieldset>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Guests
                </span>
                <button
                  type="button"
                  onClick={addGuest}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  + Add guest
                </button>
              </div>

              <div className="mt-2 space-y-3">
                {guests.map((guest, index) => (
                  <div
                    key={guest[GUEST_KEY]}
                    className="flex items-start gap-2"
                  >
                    <div className="flex-1 space-y-2">
                      <TextField
                        api={form.field(`guests.${index}.name`)}
                        placeholder="Guest name"
                      />
                      <TextField
                        api={form.field(`guests.${index}.email`)}
                        placeholder="Guest email"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => form.removeItem("guests", index)}
                      className="mt-1 text-xs text-red-500 hover:text-red-600"
                      aria-label="Remove guest"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {guests.length === 0 && (
                  <p className="text-sm text-gray-400">No guests yet.</p>
                )}
              </div>

              {
                // `guests.min(1, ...)` is an issue on the array itself, not on
                // any one guest's `name`/`email`. Its `schemaErrorMap` key is
                // `"guests"`, with no field of that exact name ever registered,
                // so it's surfaced here instead of through a `TextField`. */
              }
              <Watch api={form} select={(f) => f.schemaErrorMap?.guests}>
                {(_form, msg) =>
                  msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
              </Watch>
            </fieldset>
          )}
        </Watch>

        <SubmitButton
          api={form}
          className="w-full"
          pendingLabel="Registering…"
        >
          Register
        </SubmitButton>
      </form>
    </div>
  );
}
