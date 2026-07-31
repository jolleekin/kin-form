import type { ReactNode } from "react";
import {
  type AsyncValidator,
  type FormApi,
  useForm,
  useWatch,
} from "@kin-form/react";
import { useFormDevtools } from "@kin-form/react-devtools";
import { email, required } from "@kin-form/validators";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";

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
// passed — an empty username never reaches the (simulated) network call.
const checkUsernameAvailable: AsyncValidator<string, SignupValues> = async (
  field,
) => {
  // Simulate a network round-trip to a server.
  await new Promise((resolve) => setTimeout(resolve, 600));
  return TAKEN_USERNAMES.has(field.value.toLowerCase())
    ? "That username is taken"
    : null;
};

export default function App() {
  const form = useForm<SignupValues>({
    initialValue: { username: "", email: "" },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(`Welcome, ${form.value.username}!`);
    },
  });

  useFormDevtools(form);

  return (
    <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
      <p className="mt-1 text-sm text-gray-500">
        Checks availability against a simulated server as you type.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit}
        noValidate
      >
        <UsernameField form={form} />

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

        <SubmitButton api={form} className="w-full" pendingLabel="Creating…">
          Create account
        </SubmitButton>
      </form>
    </div>
  );
}

function UsernameField({ form }: { form: FormApi<SignupValues> }): ReactNode {
  const {
    error,
    value,
    validating,
    touched,
    invalid,
    handleBlur,
    handleChange,
  } = useWatch(form.field("username", {
    validators: [required("Username is required")],
    asyncValidator: checkUsernameAvailable,
    validationDebounceMs: 400,
  }));

  const showError = !validating && invalid && (touched || value !== "");
  const showValid = !validating && !invalid && value !== "";

  return (
    <div>
      <label
        htmlFor="username"
        className="block text-sm font-medium text-gray-700"
      >
        Username
      </label>
      <div className="relative">
        <input
          id="username"
          value={value}
          onBlur={handleBlur}
          onChange={(event) => handleChange(event.target.value)}
          className={inputClasses(showError)}
        />
        {showValid && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500">
            ✓
          </span>
        )}
      </div>
      {validating && <p className="mt-1 text-sm">Checking availability...</p>}
      {showError && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
