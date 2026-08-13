import { html, LitElement } from "lit";
import {
  type FieldApi,
  FormApi,
  MultistepController,
  type Validator,
} from "@kin-form/lit";
import { email, minLength, required } from "@kin-form/validators";
import "./components/SubmitButton.ts";
import "./components/TextField.ts";

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

// Index-aligned with `STEP_LABELS` below. `null` marks the Review step: it
// has no `FieldApi` of its own, so `MultistepController` treats it as
// always valid.
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

const STORAGE_KEY = "multistep-draft-lit";

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

// This example is `examples/lit`'s one real `LitElement`: `MultistepController`
// (like `WatchController`) needs an actual `ReactiveControllerHost` to
// call `requestUpdate()` on, which only a genuine custom element provides -
// every other example here is plain functions using the `watch()` directive
// instead. `createRenderRoot` returns `this` (light DOM, no shadow root),
// matching the rest of the app so Tailwind's global stylesheet still
// cascades in normally.
class MultistepWizard extends LitElement {
  #loaded = false;

  #form = new FormApi<Signup>({
    initialValue: emptyValue,
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));

      localStorage.removeItem(STORAGE_KEY);
      alert(`Welcome, ${form.value.profile.firstName}! Your account is ready.`);

      form.reset(emptyValue);
      this.#wizard.jump(0);
    },
  });

  #wizard: MultistepController<Signup, typeof STEP_NAMES> =
    new MultistepController(
      this,
      this.#form,
      STEP_NAMES,
      {
        onBeforeNext: async ({ form, stepName }) => {
          if (stepName === null) return;

          this.#saveError = null;
          try {
            await saveDraft(form.value);
            this.#lastSavedAt = new Date();
          } catch {
            this.#saveError = "Couldn't save your progress. Try again.";
            return false;
          }

          // Conditional jump: a "personal" account has no Company step, so
          // redirect straight to Profile instead of the next linear index.
          if (
            stepName === "account" && form.value.account.type === "personal"
          ) {
            return "profile";
          }
        },
      },
    );

  #saveError: string | null = null;
  #lastSavedAt: Date | null = null;

  // `wizard.back()` always moves to `stepIndex - 1`, which would land a
  // "personal" account on the skipped Company step. Route around it here
  // instead - `MultistepController` intentionally stays a thin index
  // sequencer with no memory of how a step was reached, so branch-aware
  // back-navigation is the caller's job, not the controller's.
  readonly #handleBack = (): void => {
    const accountType = this.#form.field("account").field("type").value;
    if (this.#wizard.stepName === "profile" && accountType === "personal") {
      this.#wizard.jump("account");
    } else {
      this.#wizard.back();
    }
  };

  override createRenderRoot(): this {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    loadDraft().then((initialValue) => {
      this.#form.reset(initialValue);
      this.#loaded = true;
      this.requestUpdate();
    });
  }

  #accountTypeField(parent: FieldApi<Account, Signup>): unknown {
    const field = parent.field("type");

    return html`
      <div>
        <span class="block text-sm font-medium text-gray-700">
          Account type
        </span>
        <div class="mt-1 flex gap-4 text-sm text-gray-600">
          ${(["personal", "business"] as const).map((option) =>
            html`
              <label class="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="accountType"
                  .checked=${field.value === option}
                  @change=${() => field.handleChange(option)}
                  class="h-4 w-4 border-gray-300"
                >
                ${option === "personal" ? "Personal" : "Business"}
              </label>
            `
          )}
        </div>
      </div>
    `;
  }

  #review(value: Signup): unknown {
    return html`
      <dl class="space-y-2 text-sm">
        <div class="flex justify-between">
          <dt class="text-gray-500">Email</dt>
          <dd class="text-gray-900">${value.account.email}</dd>
        </div>
        ${value.account.type === "business"
          ? html`
            <div class="flex justify-between">
              <dt class="text-gray-500">Company</dt>
              <dd class="text-gray-900">${value.company.name}</dd>
            </div>
          `
          : ""}
        <div class="flex justify-between">
          <dt class="text-gray-500">Name</dt>
          <dd class="text-gray-900">
            ${value.profile.firstName} ${value.profile.lastName}
          </dd>
        </div>
      </dl>
    `;
  }

  // Business accounts show all four dots; personal accounts skip the
  // Company dot entirely, rather than rendering it as a
  // permanently-unfilled step.
  #stepIndicator(current: number, accountType: Account["type"]): unknown {
    const visibleSteps = accountType === "business" ? [0, 1, 2, 3] : [0, 2, 3];
    const currentPosition = visibleSteps.indexOf(current);

    return html`
      <ol class="mt-4 flex items-center text-xs font-medium text-gray-400">
        ${visibleSteps.map((stepIndex, position) =>
          html`
            <li class="flex items-center">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${position <=
                    currentPosition
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300"}"
              >
                ${position + 1}
              </span>
              <span
                class="ml-1.5 ${position <= currentPosition
                  ? "text-blue-600"
                  : ""}"
              >
                ${STEP_LABELS[stepIndex]}
              </span>
              ${position < visibleSteps.length - 1
                ? html`<span class="mx-2 h-px w-4 bg-gray-200"></span>`
                : ""}
            </li>
          `
        )}
      </ol>
    `;
  }

  override render(): unknown {
    if (!this.#loaded) {
      return html`
        <div class="px-6 py-8 text-sm text-gray-400">Loading…</div>
      `;
    }

    const form = this.#form;
    const wizard = this.#wizard;
    const accountType = form.field("account").field("type").value;

    return html`
      <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 class="text-xl font-semibold text-gray-900">Create account</h1>
        <p class="mt-1 text-sm text-gray-500">
          Business accounts get an extra <em>Company</em> step; personal
          accounts skip straight to <em>Profile</em>.
        </p>
        ${this.#stepIndicator(wizard.stepIndex, accountType)}

        <form
          class="mt-6 space-y-4"
          @submit=${form.handleSubmit}
          novalidate
        >
          ${wizard.stepName === "account"
            ? html`
              <multistep-text-field
                .api=${wizard.stepField.field("email", {
                  validators: emailValidators,
                })}
                type="email"
                label="Email"
                required
                autocomplete="email"
              ></multistep-text-field>
              <multistep-text-field
                .api=${wizard.stepField.field("password", {
                  validators: passwordValidators,
                })}
                type="password"
                label="Password"
                required
                autocomplete="new-password"
              ></multistep-text-field>
              ${this.#accountTypeField(wizard.stepField)}
            `
            : ""}

          ${wizard.stepName === "company"
            ? html`
              <multistep-text-field
                .api=${wizard.stepField.field("name", {
                  validators: companyValidators,
                })}
                label="Company name"
                required
              ></multistep-text-field>
              <multistep-text-field
                .api=${wizard.stepField.field("taxId", {
                  validators: companyValidators,
                })}
                label="Tax ID"
                required
              ></multistep-text-field>
            `
            : ""}

          ${wizard.stepName === "profile"
            ? html`
              <multistep-text-field
                .api=${wizard.stepField.field("firstName", {
                  validators: nameValidators,
                })}
                label="First name"
                required
                autocomplete="given-name"
              ></multistep-text-field>
              <multistep-text-field
                .api=${wizard.stepField.field("lastName", {
                  validators: nameValidators,
                })}
                label="Last name"
                required
                autocomplete="family-name"
              ></multistep-text-field>
            `
            : ""}

          ${wizard.stepName === null ? this.#review(form.value) : ""}

          ${this.#saveError
            ? html`<p class="text-xs text-red-600">${this.#saveError}</p>`
            : this.#lastSavedAt
            ? html`
              <p class="text-xs text-gray-400">
                Progress saved ${this.#lastSavedAt.toLocaleTimeString()}
              </p>
            `
            : ""}

          <div class="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              @click=${this.#handleBack}
              ?disabled=${wizard.isFirstStep}
              class="rounded-md px-3 py-2 text-sm font-semibold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>

            ${wizard.isLastStep
              ? html`
                <multistep-submit-button
                  .api=${form}
                  pending-label="Creating…"
                  label="Create account"
                ></multistep-submit-button>
              `
              : html`
                <button
                  type="button"
                  @click=${wizard.next}
                  ?disabled=${wizard.isTransitioning ||
                    wizard.stepField?.validating}
                  class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  ${wizard.isTransitioning ? "Saving..." : "Next"}
                </button>
              `}
          </div>
        </form>
      </div>
    `;
  }
}

customElements.define("multistep-wizard", MultistepWizard);

export default function App(): unknown {
  return html`<multistep-wizard></multistep-wizard>`;
}
