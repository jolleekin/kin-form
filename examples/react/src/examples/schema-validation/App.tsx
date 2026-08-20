import { useForm } from "@kintools/form-react";
import { useFormDevtools } from "@kintools/form-devtools-react";
import { email, required, toSchemaValidator } from "@kintools/form-validators";
import { z } from "zod";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";

type Signup = {
  email: string;
  password: string;
  confirmPassword: string;
};

// `refine` needs to see `password` and `confirmPassword` together, which no
// single field's own validators can express — that's what `schemaValidator`
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

export default function App() {
  const form = useForm<Signup>({
    initialValue: { email: "", password: "", confirmPassword: "" },
    schemaValidator: toSchemaValidator(signupSchema),
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(`Welcome, ${form.value.email}!`);
    },
  });

  useFormDevtools(form);

  return (
    <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
      <p className="mt-1 text-sm text-gray-500">
        <code>email</code>/<code>password</code>{" "}
        use hand-written field validators; <code>confirmPassword</code>{" "}
        gets its message from a whole-form Zod <code>refine()</code> check via
        {" "}
        <code>toSchemaValidator()</code>.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit}
        noValidate
      >
        <TextField
          api={form.field("email", {
            validators: [
              required("Email is required"),
              email("Enter a valid email address"),
            ],
          })}
          type="email"
          label="Email"
          required
          autoComplete="email"
        />
        <TextField
          api={form.field("password", {
            validators: [required("Password is required")],
          })}
          type="password"
          label="Password"
          required
          autoComplete="new-password"
        />
        <TextField
          api={form.field("confirmPassword", {
            validators: [required("Please confirm your password")],
          })}
          type="password"
          label="Confirm password"
          required
          autoComplete="new-password"
        />

        <SubmitButton api={form} className="w-full" pendingLabel="Creating…">
          Create account
        </SubmitButton>
      </form>
    </div>
  );
}
