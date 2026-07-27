import type { ReactNode } from "react";
import {
  type FieldApi,
  FieldApiOptions,
  Watch,
} from "@kin-form/react/index.ts";
import { email, required } from "@kin-form/validators/index.ts";
import { TextField } from "./TextField.tsx";

export type Contact = {
  name: string;
  email: string;
};

const nameOptions: FieldApiOptions<string, Contact> = {
  validators: [required("Required")],
};
const emailOptions: FieldApiOptions<string, Contact> = {
  validators: [required("Required"), email("Invalid email")],
};

export type ContactRowProps<TParentValue> = {
  api: FieldApi<Contact, TParentValue>;
  index: number;
};

/**
 * One virtualized row's fields.
 *
 * Row height isn't fixed: an invalid+touched `TextField` grows the row with
 * an error message, so the virtualizer measures each row's real height via
 * `measureElement` (see `App.tsx`) instead of trusting its `estimateSize`
 * guess.
 */
export function ContactRow<TParentValue>(
  { api, index }: ContactRowProps<TParentValue>,
): ReactNode {
  return (
    <div className="flex items-start gap-3 border-b border-gray-100 px-3 py-2">
      <span className="w-10 shrink-0 pt-1.5 text-right text-xs tabular-nums text-gray-400">
        {index + 1}
      </span>
      <div className="grid flex-1 grid-cols-2 gap-2">
        <TextField api={api.field("name", nameOptions)} placeholder="Name" />
        <TextField api={api.field("email", emailOptions)} placeholder="Email" />
      </div>
      <Watch api={api} select={(f) => f.dirty}>
        {(_api, dirty) => (
          <span
            title={dirty ? "Edited, persists across scroll" : "Unedited"}
            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
              dirty ? "bg-blue-500" : "bg-gray-200"
            }`}
          />
        )}
      </Watch>
    </div>
  );
}
