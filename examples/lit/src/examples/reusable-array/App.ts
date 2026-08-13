import { html } from "lit";
import { type FieldApi, FormApi } from "@kin-form/lit";
import { email, required } from "@kin-form/validators";
import "./components/ArrayField.ts";
import "./components/SubmitButton.ts";
import "./components/TextField.ts";

// Stable per-member identity for `repeat()`'s key (see `ArrayField`'s
// `.itemKey`), carried on the member object itself under this symbol.
// Symbol-keyed, so `JSON.stringify` ignores it - no submit-time filtering
// needed to keep it off the wire.
const TEAM_MEMBER_ID = Symbol();
let nextTeamMemberId = 0;

type TeamMember = { name: string; email: string; [TEAM_MEMBER_ID]: number };

type Profile = {
  displayName: string;
  skills: string[];
  teamMembers: TeamMember[];
};

export default function App(): unknown {
  const form = new FormApi<Profile>({
    initialValue: {
      displayName: "",
      skills: [],
      teamMembers: [],
    },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(
        `Saved ${form.value.skills.length} skill(s) and ${form.value.teamMembers.length} team member(s).`,
      );
    },
  });

  return html`
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">Team profile</h1>
      <p class="mt-1 text-sm text-gray-500">
        <code>skills</code> (primitive items) and <code>teamMembers</code>
        (object items) are both edited by the same <code>array-field</code>
        element.
      </p>

      <form class="mt-6 space-y-6" @submit=${form.handleSubmit} novalidate>
        <reusable-array-text-field
          .api=${form.field("displayName", {
            validators: required("Display name is required"),
          })}
          label="Display name"
          required
        ></reusable-array-text-field>

        <reusable-array-array-field
          .api=${form.field("skills")}
          label="Skills"
          .itemKey=${(skill: string) => skill}
          .newItem=${() => ""}
          .renderItem=${(api: FieldApi<string[], Profile>, index: number) =>
            html`
              <reusable-array-text-field
                .api=${api.field(`${index}`, {
                  validators: required("Can't be empty"),
                })}
                placeholder="e.g. TypeScript"
              ></reusable-array-text-field>
            `}
        ></reusable-array-array-field>

        <reusable-array-array-field
          .api=${form.field("teamMembers")}
          label="Team members"
          .itemKey=${(member: TeamMember) => member[TEAM_MEMBER_ID]}
          .newItem=${() => ({
            name: "",
            email: "",
            [TEAM_MEMBER_ID]: ++nextTeamMemberId,
          })}
          .renderItem=${(
            group: FieldApi<TeamMember[], Profile>,
            index: number,
          ) =>
            html`
              <div class="grid grid-cols-2 gap-2">
                <reusable-array-text-field
                  .api=${group.field(`${index}.name`, {
                    validators: [required("Required")],
                  })}
                  placeholder="Name"
                ></reusable-array-text-field>
                <reusable-array-text-field
                  .api=${group.field(`${index}.email`, {
                    validators: [required("Required"), email("Invalid email")],
                  })}
                  placeholder="Email"
                ></reusable-array-text-field>
              </div>
            `}
        ></reusable-array-array-field>

        <reusable-array-submit-button
          .api=${form}
          button-class="w-full"
          pending-label="Saving…"
          label="Save profile"
        ></reusable-array-submit-button>
      </form>
    </div>
  `;
}
