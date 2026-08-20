import type { ReactNode } from "react";
import { use, useState } from "react";
import {
  type FieldApi,
  useForm,
  useMultistep,
  useWatch,
  type Validator,
  Watch,
} from "@kintools/form-react";
import { useFormDevtools } from "@kintools/form-devtools-react";
import { email, minLength, required } from "@kintools/form-validators";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";

type Signup = {
  account: {
    email: string;
    password: string;
    type: "personal" | "business";
  };
  company: { name: string; taxId: string };
  profile: { firstName: string; lastName: string };
};

type Account = Signup["account"];
type Company = Signup["company"];
type Profile = Signup["profile"];

// Index-aligned with `STEP_NAMES` below. `null` marks the Review step: it has
// no `FieldApi` of its own, so `useMultistep` treats it as always valid.
const STEP_LABELS = ["Account", "Company", "Profile", "Review"] as const;
const STEP_NAMES = ["account", "company", "profile", null] as const;

const emailValidators: Validator<string, Account>[] = [
  required("Email is required"),
  email("Enter a valid email address"),
];

const passwordValidators: Validator<string, Account>[] = [
  required("Password is required"),
  minLength(8, "Password must be at least 8 characters"),
];

const companyValidators: Validator<string, Company>[] = [
  required("This field is required"),
];

const nameValidators: Validator<string, Profile>[] = [
  required("This field is required"),
];

const STORAGE_KEY = "multistep-draft";

const emptyValue: Signup = {
  account: { email: "", password: "", type: "personal" },
  company: { name: "", taxId: "" },
  profile: { firstName: "", lastName: "" },
};

// Stands in for a real API call that persists the wizard's progress after
// each step passes validation, e.g. so a refreshed page can resume partway
// through.
async function saveDraft(value: Signup): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

async function loadDraft(): Promise<Signup> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const v = localStorage.getItem(STORAGE_KEY);
  return v ? (JSON.parse(v) as Signup) : emptyValue;
}

const promise = loadDraft();

export default function App() {
  const initialValue = use(promise);

  const form = useForm({
    initialValue,
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));

      localStorage.removeItem(STORAGE_KEY);
      alert(`Welcome, ${form.value.profile.firstName}! Your account is ready.`);

      form.reset(emptyValue);
      wizard.jump(0);
    },
  });

  useFormDevtools(form);

  // Resolved via `form.field("account")` — not `wizard.stepField`, which
  // points at a *different* step's field once the wizard moves past Account
  // — so this stays live on every step. `field()`'s `name` doesn't split
  // dotted paths at runtime (only `DeepKey` makes `"account.type"`
  // *type-check* as one call), so `form.field("account.type")` would
  // silently create a second, disconnected field that never syncs with the
  // one `AccountTypeField` actually writes to — resolving `"account"` then
  // `"type"` as two calls is what keeps them the same instance. `field()`
  // returns the same cached instance every render, so only `useWatch` below
  // re-renders `App`, and only on an actual value change, not every
  // keystroke in the form.
  const accountType = useWatch(
    form.field("account").field("type"),
    (f) => f.value,
  );

  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const wizard = useMultistep(form, STEP_NAMES, {
    onBeforeNext: async ({ form, stepName }) => {
      if (stepName === null) return;

      setSaveError(null);
      try {
        await saveDraft(form.value);
        setLastSavedAt(new Date());
      } catch {
        setSaveError("Couldn't save your progress. Try again.");
        return false;
      }

      // Conditional jump: a "personal" account has no Company step, so
      // redirect straight to Profile instead of the next linear index.
      if (stepName === "account" && form.value.account.type === "personal") {
        return "profile";
      }
    },
  });

  // `wizard.back()` always moves to `stepIndex - 1`, which would land a
  // "personal" account on the skipped Company step. Route around it here
  // instead — `useMultistep` intentionally stays a thin index sequencer with
  // no memory of how a step was reached, so branch-aware back-navigation is
  // the caller's job, not the hook's.
  const handleBack = () => {
    if (wizard.stepName === "profile" && accountType === "personal") {
      wizard.jump("account");
    } else {
      wizard.back();
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
      <p className="mt-1 text-sm text-gray-500">
        Business accounts get an extra <em>Company</em>{" "}
        step; personal accounts skip straight to <em>Profile</em>.
      </p>
      <StepIndicator current={wizard.stepIndex} accountType={accountType} />

      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit}
        noValidate
      >
        {wizard.stepName === "account" && (
          <>
            <TextField
              api={wizard.stepField.field("email", {
                validators: emailValidators,
              })}
              type="email"
              label="Email"
              required
              autoComplete="email"
            />
            <TextField
              api={wizard.stepField.field("password", {
                validators: passwordValidators,
              })}
              type="password"
              label="Password"
              required
              autoComplete="new-password"
            />
            <AccountTypeField parent={wizard.stepField} />
          </>
        )}

        {wizard.stepName === "company" && (
          <>
            <TextField
              api={wizard.stepField.field("name", {
                validators: companyValidators,
              })}
              label="Company name"
              required
            />
            <TextField
              api={wizard.stepField.field("taxId", {
                validators: companyValidators,
              })}
              label="Tax ID"
              required
            />
          </>
        )}

        {wizard.stepName === "profile" && (
          <>
            <TextField
              api={wizard.stepField.field("firstName", {
                validators: nameValidators,
              })}
              label="First name"
              required
              autoComplete="given-name"
            />
            <TextField
              api={wizard.stepField.field("lastName", {
                validators: nameValidators,
              })}
              label="Last name"
              required
              autoComplete="family-name"
            />
          </>
        )}

        {wizard.stepName === null && (
          <Watch api={form} select={(f) => f.value}>
            {(_form, value) => (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900">{value.account.email}</dd>
                </div>
                {value.account.type === "business" && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Company</dt>
                    <dd className="text-gray-900">{value.company.name}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Name</dt>
                  <dd className="text-gray-900">
                    {value.profile.firstName} {value.profile.lastName}
                  </dd>
                </div>
              </dl>
            )}
          </Watch>
        )}

        {saveError ? <p className="text-xs text-red-600">{saveError}</p> : (
          lastSavedAt && (
            <p className="text-xs text-gray-400">
              Progress saved {lastSavedAt.toLocaleTimeString()}
            </p>
          )
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={wizard.isFirstStep}
            className="rounded-md px-3 py-2 text-sm font-semibold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>

          {wizard.isLastStep
            ? (
              <SubmitButton api={form} pendingLabel="Creating…">
                Create account
              </SubmitButton>
            )
            : (
              <button
                type="button"
                onClick={wizard.next}
                disabled={wizard.isTransitioning ||
                  wizard.stepField?.validating}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {wizard.isTransitioning ? "Saving..." : "Next"}
              </button>
            )}
        </div>
      </form>
    </div>
  );
}

function AccountTypeField({
  parent,
}: {
  parent: FieldApi<Account, Signup>;
}): ReactNode {
  const field = parent.field("type");
  useWatch(field, (f) => f.value);

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700">
        Account type
      </span>
      <div className="mt-1 flex gap-4 text-sm text-gray-600">
        {(["personal", "business"] as const).map((option) => (
          <label key={option} className="flex items-center gap-1.5">
            <input
              type="radio"
              name="accountType"
              checked={field.value === option}
              onChange={() =>
                field.handleChange(option)}
              className="h-4 w-4 border-gray-300"
            />
            {option === "personal" ? "Personal" : "Business"}
          </label>
        ))}
      </div>
    </div>
  );
}

// Business accounts show all four dots; personal accounts skip the Company
// dot entirely, rather than rendering it as a permanently-unfilled step.
function StepIndicator({
  current,
  accountType,
}: {
  current: number;
  accountType: Account["type"];
}): ReactNode {
  const visibleSteps = accountType === "business" ? [0, 1, 2, 3] : [0, 2, 3];
  const currentPosition = visibleSteps.indexOf(current);

  return (
    <ol className="mt-4 flex items-center text-xs font-medium text-gray-400">
      {visibleSteps.map((stepIndex, position) => (
        <li key={STEP_LABELS[stepIndex]} className="flex items-center">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
              position <= currentPosition
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300"
            }`}
          >
            {position + 1}
          </span>
          <span
            className={`ml-1.5 ${
              position <= currentPosition ? "text-blue-600" : ""
            }`}
          >
            {STEP_LABELS[stepIndex]}
          </span>
          {position < visibleSteps.length - 1 && (
            <span className="mx-2 h-px w-4 bg-gray-200" />
          )}
        </li>
      ))}
    </ol>
  );
}
