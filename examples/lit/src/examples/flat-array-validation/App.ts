import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { FormApi, watch } from "@kintools/form-lit";
import { toSchemaValidator } from "@kintools/form-validators";
import { z } from "zod";
import "./components/SubmitButton.ts";
import "./components/TextField.ts";

// Stable per-guest identity for `repeat()`'s key.
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

export default function App(): unknown {
  const form = new FormApi<Registration>({
    initialValue: { contact: { name: "", email: "" }, guests: [] },
    schemaValidator: toSchemaValidator(registrationSchema),
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));

      alert(`Registered ${form.value.guests.length + 1} attendee(s).`);
    },
  });

  const addGuest = () => {
    form.pushItem("guests", {
      name: "",
      email: "",
      [GUEST_KEY]: ++guestKey,
    });
  };

  return html`
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">
        Event registration
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        Every field below is a flat dotted path straight off <code>form</code>
        — no group, for the nested <code>contact</code> object or the
        dynamic <code>guests</code> array. One Zod schema validates the
        whole tree via <code>toSchemaValidator()</code>, and each field, even
        inside the array, picks up its own message automatically.
      </p>

      <form class="mt-6 space-y-6" @submit=${form.handleSubmit} novalidate>
        <fieldset class="space-y-4">
          <legend class="text-sm font-medium text-gray-700">
            Your details
          </legend>

          <flat-array-validation-text-field
            .api=${form.field("contact.name")}
            label="Name"
          ></flat-array-validation-text-field>
          <flat-array-validation-text-field
            .api=${form.field("contact.email")}
            label="Email"
          ></flat-array-validation-text-field>
        </fieldset>

        ${watch(
          form,
          (api) => api.value.guests,
          (_form, guests) =>
            html`
              <fieldset>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Guests</span>
                  <button
                    type="button"
                    @click=${addGuest}
                    class="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    + Add guest
                  </button>
                </div>

                <div class="mt-2 space-y-3">
                  ${repeat(
                    guests,
                    (guest) => guest[GUEST_KEY],
                    (_guest, index) =>
                      html`
                        <div class="flex items-start gap-2">
                          <div class="flex-1 space-y-2">
                            <flat-array-validation-text-field
                              .api=${form.field(`guests.${index}.name`)}
                              placeholder="Guest name"
                            ></flat-array-validation-text-field>
                            <flat-array-validation-text-field
                              .api=${form.field(`guests.${index}.email`)}
                              placeholder="Guest email"
                            ></flat-array-validation-text-field>
                          </div>
                          <button
                            type="button"
                            @click=${() => form.removeItem("guests", index)}
                            class="mt-1 text-xs text-red-500 hover:text-red-600"
                            aria-label="Remove guest"
                          >
                            ✕
                          </button>
                        </div>
                      `,
                  )}
                  ${guests.length === 0
                    ? html`<p class="text-sm text-gray-400">No guests yet.</p>`
                    : nothing}
                </div>

                ${// `guests.min(1, ...)` is an issue on the array itself, not on
                // any one guest's `name`/`email`. Its `schemaErrorMap` key is
                // `"guests"`, with no field of that exact name ever registered,
                // so it's surfaced here instead of through a `TextField`.
                watch(
                  form,
                  (f) => f.schemaErrorMap?.guests,
                  (_form, message) =>
                    message
                      ? html`<p class="mt-2 text-sm text-red-600">${message}</p>`
                      : nothing,
                )}
              </fieldset>
            `,
        )}

        <flat-array-validation-submit-button
          .api=${form}
          button-class="w-full"
          pending-label="Registering…"
          label="Register"
        ></flat-array-validation-submit-button>
      </form>
    </div>
  `;
}
