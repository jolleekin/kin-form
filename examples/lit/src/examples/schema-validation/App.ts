import { html } from "lit";
import { FormApi } from "@kin-form/lit";
import { email, required, toSchemaValidator } from "@kin-form/validators";
import { z } from "zod";
import "./components/SubmitButton.ts";
import "./components/TextField.ts";

type Signup = {
  email: string;
  password: string;
  confirmPassword: string;
};

// `refine` needs to see `password` and `confirmPassword` together, which no
// single field's own validators can express - that's what `schemaValidator`
// is for. `email`/`password`'s own formats are checked by hand-written field
// validators instead (below): a schema and a field validator on the same
// field would just invite the two to disagree.
const signupSchema = z
  .object({
    email: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function App(): unknown {
  const form = new FormApi<Signup>({
    initialValue: { email: "", password: "", confirmPassword: "" },
    schemaValidator: toSchemaValidator(signupSchema),
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(`Welcome, ${form.value.email}!`);
    },
  });

  return html`
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">Create account</h1>
      <p class="mt-1 text-sm text-gray-500">
        <code>email</code>/<code>password</code> use hand-written field
        validators; <code>confirmPassword</code> gets its message from a
        whole-form Zod <code>refine()</code> check via
        <code>toSchemaValidator()</code>.
      </p>

      <form class="mt-6 space-y-4" @submit=${form.handleSubmit} novalidate>
        <schema-validation-text-field
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
        ></schema-validation-text-field>
        <schema-validation-text-field
          .api=${form.field("password", {
            validators: [required("Password is required")],
          })}
          type="password"
          label="Password"
          required
          autocomplete="new-password"
        ></schema-validation-text-field>
        <schema-validation-text-field
          .api=${form.field("confirmPassword", {
            validators: [required("Please confirm your password")],
          })}
          type="password"
          label="Confirm password"
          required
          autocomplete="new-password"
        ></schema-validation-text-field>

        <schema-validation-submit-button
          .api=${form}
          button-class="w-full"
          pending-label="Creating…"
          label="Create account"
        ></schema-validation-submit-button>
      </form>
    </div>
  `;
}
