import { html } from "lit";
import { type AsyncValidator, FormApi, watch } from "@kin-form/lit";
import { email, required } from "@kin-form/validators";
import "./components/SubmitButton.ts";
import "./components/TextField.ts";

type SignupValues = {
  username: string;
  email: string;
};

const TAKEN_USERNAMES = new Set(["admin", "root", "kin-form"]);

const inputClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 pr-9 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

// Only ever runs once the sync `required` validator below has already
// passed - an empty username never reaches the (simulated) network call.
const checkUsernameAvailable: AsyncValidator<string, SignupValues> = async (
  field,
) => {
  // Simulate a network round-trip to a server.
  await new Promise((resolve) => setTimeout(resolve, 600));
  return TAKEN_USERNAMES.has(field.value.toLowerCase())
    ? "That username is taken"
    : null;
};

export default function App(): unknown {
  const form = new FormApi<SignupValues>({
    initialValue: { username: "", email: "" },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(`Welcome, ${form.value.username}!`);
    },
  });

  return html`
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">Create account</h1>
      <p class="mt-1 text-sm text-gray-500">
        Checks availability against a simulated server as you type.
      </p>

      <form class="mt-6 space-y-4" @submit=${form.handleSubmit} novalidate>
        ${UsernameField(form)}

        <async-validation-text-field
          .api=${form.field("email", {
            validators: [
              required("Email is required"),
              email("Enter a valid email address"),
            ],
          })}
          type="email"
          label="Email"
          required
          autocomplete="email"
        ></async-validation-text-field>

        <async-validation-submit-button
          .api=${form}
          button-class="w-full"
          pending-label="Creating…"
          label="Create account"
        ></async-validation-submit-button>
      </form>
    </div>
  `;
}

function UsernameField(form: FormApi<SignupValues>): unknown {
  return watch(
    form.field("username", {
      validators: [required("Username is required")],
      asyncValidator: checkUsernameAvailable,
      validationDebounceMs: 400,
    }),
    (field) => {
      const {
        error,
        value,
        validating,
        touched,
        invalid,
        handleBlur,
        handleChange,
      } = field;
      const showError = !validating && invalid && (touched || value !== "");
      const showValid = !validating && !invalid && value !== "";

      return html`
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700">
            Username
          </label>
          <div class="relative">
            <input
              id="username"
              .value=${value}
              @blur=${handleBlur}
              @input=${(event: Event) =>
                handleChange((event.target as HTMLInputElement).value)}
              class=${inputClasses(showError)}
            >
            ${showValid
              ? html`
                <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500">
                  ✓
                </span>
              `
              : ""}
          </div>
          ${validating
            ? html`<p class="mt-1 text-sm">Checking availability...</p>`
            : ""}
          ${showError
            ? html`<p class="mt-1 text-sm text-red-600">${error}</p>`
            : ""}
        </div>
      `;
    },
  );
}
