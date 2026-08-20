import { html } from "lit";
import { FormApi } from "@kintools/form-lit";
import type { Contact } from "./components/ContactRow.ts";
import "./components/ContactList.ts";
import "./components/SubmitButton.ts";

const ROW_COUNT = 10_000;

function createContacts(count: number): Contact[] {
  return Array.from({ length: count }, () => ({ name: "", email: "" }));
}

export default function App(): unknown {
  const form = new FormApi<{ contacts: Contact[] }>({
    initialValue: { contacts: createContacts(ROW_COUNT) },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(`Saved ${form.value.contacts.length} contacts.`);
    },
  });

  return html`
    <div class="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">
        Contact directory
      </h1>

      <form class="mt-6" @submit=${form.handleSubmit} novalidate>
        <contact-list
          .api=${form.field("contacts")}
          .count=${ROW_COUNT}
        ></contact-list>

        <virtual-list-submit-button
          .api=${form}
          button-class="mt-6 w-full"
          pending-label="Saving…"
          label="Save directory"
        ></virtual-list-submit-button>
      </form>
    </div>
  `;
}
