import { useForm } from "@kintools/form-react";
import { useFormDevtools } from "@kintools/form-devtools-react";
import { email, required } from "@kintools/form-validators";
import { ArrayField } from "./components/ArrayField.tsx";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";

// Stable per-member identity for React's list `key` (see `ArrayField`'s
// `itemKey`), carried on the member object itself under this symbol.
// Symbol-keyed, so `JSON.stringify` ignores it — no submit-time filtering
// needed to keep it off the wire.
const TEAM_MEMBER_ID = Symbol();
let nextTeamMemberId = 0;

type TeamMember = { name: string; email: string; [TEAM_MEMBER_ID]: number };

type Profile = {
  displayName: string;
  skills: string[];
  teamMembers: TeamMember[];
};

export default function App() {
  const form = useForm<Profile>({
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

  useFormDevtools(form);

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">Team profile</h1>
      <p className="mt-1 text-sm text-gray-500">
        <code>skills</code> (primitive items) and <code>teamMembers</code>{" "}
        (object items) are both edited by the same <code>ArrayField</code>{" "}
        component.
      </p>

      <form
        className="mt-6 space-y-6"
        onSubmit={form.handleSubmit}
        noValidate
      >
        <TextField
          api={form.field("displayName", {
            validators: required("Display name is required"),
          })}
          label="Display name"
          required
        />

        <ArrayField
          api={form.field("skills")}
          label="Skills"
          itemKey={(skill) => skill}
          newItem={() => ""}
        >
          {(api, index) => (
            <TextField
              api={api.field(`${index}`, {
                validators: required("Can't be empty"),
              })}
              placeholder="e.g. TypeScript"
            />
          )}
        </ArrayField>

        <ArrayField
          api={form.field("teamMembers")}
          label="Team members"
          itemKey={(member) => member[TEAM_MEMBER_ID]}
          newItem={() => ({
            name: "",
            email: "",
            [TEAM_MEMBER_ID]: ++nextTeamMemberId,
          })}
        >
          {(group, index) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField
                api={group.field(`${index}.name`, {
                  validators: [required("Required")],
                })}
                placeholder="Name"
              />
              <TextField
                api={group.field(`${index}.email`, {
                  validators: [required("Required"), email("Invalid email")],
                })}
                placeholder="Email"
              />
            </div>
          )}
        </ArrayField>

        <SubmitButton api={form} className="w-full" pendingLabel="Saving…">
          Save profile
        </SubmitButton>
      </form>
    </div>
  );
}
