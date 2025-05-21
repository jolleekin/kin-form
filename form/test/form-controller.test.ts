import { assertEquals } from "@std/assert";
import { LitElement } from "lit";

import { FormController } from "../form-controller.ts";
import { FormField, type Validator } from "../form-field.ts";
import type { DeepKey, DeepValue } from "../types.ts";
import { getIn } from "../utils/immutable.ts";

interface FormValue {
  name: string;
  age: number | null;
}

class Host extends LitElement {}

// Dummy field simulating FormField.
class DummyField<
  TFormValue,
  TName extends DeepKey<TFormValue>
> extends FormField<DeepValue<TFormValue, TName>, TFormValue> {}

function createField<TFormValue, TName extends DeepKey<TFormValue>>(
  form: FormController<TFormValue>,
  name: TName,
  options: {
    validators?: Validator<DeepValue<TFormValue, TName>, TFormValue>[];
    dependents?: DeepKey<TFormValue>[];
  } = {}
) {
  const field = new DummyField<TFormValue, TName>();
  field.name = name;
  field._setParent(form);
  if (options.validators) field.validators = options.validators;
  if (options.dependents) field.dependents = options.dependents;

  field.value = getIn(form.value, name);
  return field;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.test("should initialize with the correct initial value", () => {
  const host = new Host();
  const form = new FormController<FormValue>(host, {
    initialValue: { name: "", age: null },
    onSubmit: async () => {},
  });
  assertEquals(form.value, { name: "", age: null });
  assertEquals(form.dirty, false);
});

Deno.test("should update value and mark field as touched on change", () => {
  const host = new Host();
  const form = new FormController<FormValue>(host, {
    initialValue: { name: "", age: null },
    onSubmit: async () => {},
  });

  const nameField = createField(form, "name");

  nameField.value = "John";

  assertEquals(form.value, { name: "John", age: null });
  assertEquals(nameField.touched, false);
  assertEquals(form.dirty, true);

  nameField.touched = true;
  assertEquals(nameField.touched, true);
});

Deno.test("should mark all fields as touched", () => {
  const host = new Host();
  const form = new FormController<FormValue>(host, {
    initialValue: { name: "", age: null },
    onSubmit: async () => {},
  });

  const nameField = createField(form, "name");
  const ageField = createField(form, "age");

  form.touched = true;

  assertEquals(nameField.touched, true);
  assertEquals(ageField.touched, true);
});

Deno.test("should reset the form", () => {
  const host = new Host();
  const form = new FormController<FormValue>(host, {
    initialValue: { name: "John", age: 30 },
    onSubmit: async () => {},
  });

  const ageField = createField(form, "age");
  ageField.value = 25;

  form.reset({ initialValue: { name: "Alice", age: 20 } });

  assertEquals(form.value, { name: "Alice", age: 20 });
  assertEquals(form.dirty, false);
});

Deno.test("should perform synchronous form-level validation", async () => {
  const host = new Host();
  const form = new FormController<FormValue>(host, {
    initialValue: { name: "", age: 20 },
    onSubmit: async () => {},
    validators: (form) => {
      if (!form.value.name) return "Name is required";
      return null;
    },
  });
  await form.validate();
  assertEquals(form.error, "Name is required");

  // Set name and revalidate
  const nameField = createField(form, "name");
  nameField.value = "Alice";
  await form.validate();
  assertEquals(form.error, null);
});

Deno.test("should perform asynchronous form-level validation", async () => {
  const host = new Host();
  const form = new FormController<FormValue>(host, {
    initialValue: { name: "", age: 20 },
    onSubmit: async () => {},
    validators: async (form) => {
      await delay(5);
      if (!form.value.name) return "Name is required";
      return null;
    },
  });

  const promise = form.validate();
  assertEquals(form.validating, true);
  await promise;
  assertEquals(form.validating, false);
  assertEquals(form.error, "Name is required");

  // Set name and revalidate
  const nameField = createField(form, "name");
  nameField.value = "Bob";
  await form.validate();
  assertEquals(form.error, null);
});

Deno.test(
  "should perform synchronous field-level validation using validators",
  async () => {
    const host = new Host();
    const form = new FormController<FormValue>(host, {
      initialValue: { name: "", age: 30 },
      onSubmit: async () => {},
    });
    const nameField = createField(form, "name", {
      validators: [
        ({ value }) => (value === "" ? "Field is required" : null),
        ({ value }) => (value === "bad" ? "Field is invalid" : null),
      ],
    });
    // Validate with empty value.
    await nameField.validate();
    assertEquals(nameField.error, "Field is required");

    // Update value to trigger second validator.
    nameField.value = "bad";
    await nameField.validate();
    assertEquals(nameField.error, "Field is invalid");

    // Update value to a valid value.
    nameField.value = "good";
    await nameField.validate();
    assertEquals(nameField.error, null);
  }
);

Deno.test(
  "should perform asynchronous field-level validation using validators",
  async () => {
    const host = new Host();
    const form = new FormController<FormValue>(host, {
      initialValue: { name: "notBad", age: 30 },
      onSubmit: async () => {},
    });
    const nameField = createField(form, "name", {
      validators: [
        async ({ value }) => {
          await delay(5);
          return value === "" ? "Field is required" : null;
        },
        async ({ value }) => {
          await delay(5);
          return value === "bad" ? "Field is invalid" : null;
        },
      ],
    });
    // Set value to trigger async validator error.
    nameField.value = "bad";
    const promise = nameField.validate();
    assertEquals(nameField.validating, true);
    assertEquals(form.validating, true);
    await promise;
    assertEquals(nameField.validating, false);
    assertEquals(form.validating, false);
    assertEquals(nameField.error, "Field is invalid");
    assertEquals(form.invalid, true);

    // Change value and revalidate.
    nameField.value = "good";
    await nameField.validate();
    assertEquals(nameField.error, null);
    assertEquals(form.invalid, false);
  }
);

Deno.test("should perform synchronous cross-field validation", async () => {
  const host = new Host();
  const form = new FormController<FormValue>(host, {
    initialValue: { name: "", age: 18 },
    onSubmit: async () => {},
  });

  const nameField = createField(form, "name", {
    validators: [
      ({ value }) =>
        form.value.age! >= 18
          ? value === "Adult"
            ? null
            : 'Name must be "Adult" when age >= 18'
          : form.value.age! >= 13
          ? value === "Teen"
            ? null
            : 'Name must be "Teen" when 13 <= age < 18'
          : value === "Kid"
          ? null
          : 'Name must be "Kid" when age < 13',
    ],
  });

  const ageField = createField(form, "age", { dependents: ["name"] });

  await form.validate();

  assertEquals(nameField.error, 'Name must be "Adult" when age >= 18');

  // Changing nameField doesn't trigger validation since it's not connected to a
  // document.
  // Hence, we need to explicitly call validate().
  nameField.value = "Adult";
  await nameField.validate();
  assertEquals(nameField.error, null);

  ageField.value = 15;
  assertEquals(nameField.error, 'Name must be "Teen" when 13 <= age < 18');

  nameField.value = "Teen";
  await nameField.validate();
  assertEquals(nameField.error, null);

  ageField.value = 10;
  assertEquals(nameField.error, 'Name must be "Kid" when age < 13');

  nameField.value = "Kid";
  await nameField.validate();
  assertEquals(nameField.error, null);
});

Deno.test("should perform asynchronous cross-field validation", async () => {
  const host = new Host();
  const form = new FormController<FormValue>(host, {
    initialValue: { name: "", age: 18 },
    onSubmit: async () => {},
  });

  const nameField = createField(form, "name", {
    validators: [
      async ({ value }) => {
        await delay(5);
        return form.value.age! >= 18
          ? value === "Adult"
            ? null
            : 'Name must be "Adult" when age >= 18'
          : form.value.age! >= 13
          ? value === "Teen"
            ? null
            : 'Name must be "Teen" when 13 <= age < 18'
          : value === "Kid"
          ? null
          : 'Name must be "Kid" when age < 13';
      },
    ],
  });

  const ageField = createField(form, "age", { dependents: ["name"] });

  await nameField.validate();
  assertEquals(nameField.error, 'Name must be "Adult" when age >= 18');

  // Changing nameField doesn't trigger validation since it's not connected to a
  // document.
  // Hence, we need to explicitly call validate().
  nameField.value = "Adult";
  await nameField.validate();
  assertEquals(nameField.error, null);

  ageField.value = 15;
  await nameField.validate();
  assertEquals(nameField.error, 'Name must be "Teen" when 13 <= age < 18');

  nameField.value = "Teen";
  await nameField.validate();
  assertEquals(nameField.error, null);

  ageField.value = 10;
  await nameField.validate();
  assertEquals(nameField.error, 'Name must be "Kid" when age < 13');

  nameField.value = "Kid";
  await nameField.validate();
  assertEquals(nameField.error, null);
});
