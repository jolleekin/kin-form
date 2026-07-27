import { useForm } from "@kin-form/react/index.ts";
import { useFormDevtools } from "@kin-form/react-devtools/index.ts";
import type { Contact } from "./components/ContactRow.tsx";
import { ContactList } from "./components/ContactList.tsx";
import { SubmitButton } from "./components/SubmitButton.tsx";

const ROW_COUNT = 10_000;

function createContacts(count: number): Contact[] {
  return Array.from({ length: count }, () => ({ name: "", email: "" }));
}

export default function App() {
  const form = useForm({
    initialValue: { contacts: createContacts(ROW_COUNT) },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(`Saved ${form.value.contacts.length} contacts.`);
    },
  });

  useFormDevtools(form);

  return (
    <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">
        Contact directory
      </h1>

      <form className="mt-6" onSubmit={form.handleSubmit} noValidate>
        <ContactList api={form.field("contacts")} count={ROW_COUNT} />

        <SubmitButton
          api={form}
          className="mt-6 w-full"
          pendingLabel="Saving…"
        >
          Save directory
        </SubmitButton>
      </form>
    </div>
  );
}
