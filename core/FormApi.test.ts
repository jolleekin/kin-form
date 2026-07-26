import { assertEquals, assertGreater } from "@std/assert";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock";
import { FormApi } from "./FormApi.ts";

Deno.test("FormApi", async (t) => {
  await t.step("should initialize with initial value", () => {
    const form = new FormApi({
      initialValue: { name: "John" },
    });

    assertEquals(form.value, { name: "John" });
  });

  await t.step("should have correct initial state", () => {
    const form = new FormApi({
      initialValue: { name: "John" },
    });

    assertEquals(form.dirty, false);
    assertEquals(form.submitting, false);
    assertEquals(form.invalid, false);
  });

  await t.step("should be dirty when value changes", () => {
    const form = new FormApi({
      initialValue: { name: "John" },
    });

    form.value = { name: "Jane" };
    assertEquals(form.dirty, true);
  });

  await t.step("should be clean when value returns to initial", () => {
    const form = new FormApi({
      initialValue: { name: "John" },
    });

    form.value = { name: "Jane" };
    assertEquals(form.dirty, true);

    form.value = { name: "John" };
    assertEquals(form.dirty, false);
  });

  await t.step("should have submitting state", async () => {
    const onSubmit = spy();

    const form = new FormApi({
      initialValue: { name: "John" },
      onSubmit,
    });

    assertEquals(form.submitting, false);
    const p = form.handleSubmit();
    assertEquals(form.submitting, true);
    await p;
    assertEquals(form.submitting, false);
  });

  await t.step("should call onSubmitInvalid when form is invalid", async () => {
    const onSubmitInvalid = spy();

    const form = new FormApi({
      initialValue: { name: "" },
      validators: [() => "Name is required"],
      onSubmitInvalid,
    });

    await form.validate();
    await form.handleSubmit();

    assertSpyCall(onSubmitInvalid, 0, { args: [form] });
  });

  await t.step("should set touched on submit invalid", async () => {
    const form = new FormApi({
      initialValue: { name: "" },
      validators: [() => "Error"],
    });

    assertEquals(form.touched, false);
    await form.validate();
    await form.handleSubmit();
    assertEquals(form.touched, true);
  });

  await t.step("should call onSubmit when form is valid", async () => {
    const onSubmit = spy();

    const form = new FormApi({
      initialValue: { name: "John" },
      onSubmit,
    });

    await form.handleSubmit();

    assertSpyCall(onSubmit, 0, { args: [form] });
  });

  await t.step(
    "should call event.preventDefault when given an event",
    async () => {
      const form = new FormApi({
        initialValue: { name: "John" },
      });
      const preventDefault = spy();

      await form.handleSubmit({ preventDefault });

      assertSpyCalls(preventDefault, 1);
    },
  );

  await t.step(
    "should not reset dirty after a successful submit",
    async () => {
      const onSubmit = spy();

      const form = new FormApi({
        initialValue: { name: "John" },
        onSubmit,
      });
      const nameField = form.field("name" as never);

      form.value = { name: "Jane" };
      assertEquals(form.dirty, true);
      assertEquals(nameField.dirty, true);

      await form.handleSubmit();
      assertEquals(form.dirty, true);
      assertEquals(nameField.dirty, true);
    },
  );

  await t.step(
    "should let onSubmit opt into moving the baseline via reset",
    async () => {
      const form = new FormApi<{ name: string }>({
        initialValue: { name: "John" },
        onSubmit: (form) => {
          form.reset(form.value);
        },
      });

      form.value = { name: "Jane" };
      assertEquals(form.dirty, true);

      await form.handleSubmit();
      assertEquals(form.dirty, false);
    },
  );

  await t.step("should call onSubmitError on error", async () => {
    const onSubmitError = spy();
    const onSubmit = spy(() => Promise.reject(new Error("Submit failed")));

    const form = new FormApi({
      initialValue: { name: "John" },
      onSubmit,
      onSubmitError,
    });

    await form.handleSubmit();

    assertSpyCalls(onSubmitError, 1);
    assertEquals(onSubmitError.calls[0].args[0], form);
    assertEquals(
      (onSubmitError.calls[0].args[1] as Error).message,
      "Submit failed",
    );
  });

  await t.step("should not submit when validating", async () => {
    const onSubmit = spy();

    const form = new FormApi({
      initialValue: { name: "John" },
      asyncValidator: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return null;
      },
      onSubmit,
    });

    const submitPromise = form.handleSubmit();
    await submitPromise;

    assertSpyCalls(onSubmit, 1);
  });

  await t.step(
    "should call onSubmitInvalid after pending validation fails",
    async () => {
      const onSubmitInvalid = spy();

      const form = new FormApi({
        initialValue: { name: "John" },
        asyncValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return "Error";
        },
        onSubmitInvalid,
      });

      await form.handleSubmit();

      assertSpyCall(onSubmitInvalid, 0, { args: [form] });
    },
  );

  await t.step("should not submit when already submitting", async () => {
    const onSubmit = spy(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const form = new FormApi({
      initialValue: { name: "John" },
      onSubmit,
    });

    const promise1 = form.handleSubmit();
    await form.handleSubmit(); // Try submit while already submitting

    await promise1;

    assertSpyCalls(onSubmit, 1);
  });

  await t.step("should get field by name", () => {
    const form = new FormApi({
      initialValue: { name: "John", age: 30 },
    });

    const nameField = form.field("name" as never);
    assertEquals(nameField.value, "John");
  });

  await t.step("should track touched state", () => {
    const form = new FormApi({
      initialValue: { name: "John" },
    });

    const nameField = form.field("name" as never);
    nameField.touched = true;

    assertEquals(form.touched, true);
  });

  await t.step("should track invalid state", async () => {
    const form = new FormApi({
      initialValue: { name: "" },
    });

    const nameField = form.field("name" as never);
    nameField.validators = [() => "Error"];

    await nameField.validate(true); // Reassigning while idle doesn't auto-run.
    assertEquals(form.invalid, true);
  });

  await t.step(
    "should not move the dirty baseline via updateOptions",
    () => {
      const form = new FormApi({
        initialValue: { name: "John" },
      });

      form.updateOptions({});

      assertEquals(form.dirty, false);
      form.value = { name: "Jane" };
      assertEquals(form.dirty, true);
    },
  );

  await t.step("should refresh onSubmit via updateOptions", async () => {
    const staleOnSubmit = spy();
    const freshOnSubmit = spy();

    const form = new FormApi({
      initialValue: { name: "John" },
      onSubmit: staleOnSubmit,
    });

    form.updateOptions({ onSubmit: freshOnSubmit });

    await form.handleSubmit();

    assertSpyCalls(staleOnSubmit, 0);
    assertSpyCalls(freshOnSubmit, 1);
  });

  await t.step("should handle async onSubmit", async () => {
    const onSubmit = spy(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const form = new FormApi({
      initialValue: { name: "John" },
      onSubmit,
    });

    await form.handleSubmit();
    assertGreater(onSubmit.calls.length, 0);
  });

  await t.step("should not reset dirty on error", async () => {
    const onSubmit = spy(() => Promise.reject(new Error("Error")));

    const form = new FormApi({
      initialValue: { name: "John" },
      onSubmit,
    });

    form.value = { name: "Jane" };
    assertEquals(form.dirty, true);

    await form.handleSubmit();
    assertEquals(form.dirty, true);
  });

  await t.step("should notify subscribers on value change", () => {
    const form = new FormApi({
      initialValue: { name: "John" },
    });

    const callback = spy();
    form.subscribe(callback);

    form.value = { name: "Jane" };
    assertGreater(callback.calls.length, 0);
  });

  await t.step("should restore value and clear dirty on reset", () => {
    const form = new FormApi({
      initialValue: { name: "John" },
    });

    form.value = { name: "Jane" };
    assertEquals(form.dirty, true);

    form.reset();
    assertEquals(form.value, { name: "John" });
    assertEquals(form.dirty, false);
  });

  await t.step("should clear touched on reset", () => {
    const form = new FormApi({
      initialValue: { name: "John" },
    });

    const nameField = form.field("name" as never);
    nameField.touched = true;
    assertEquals(form.touched, true);

    form.reset();
    assertEquals(form.touched, false);
    assertEquals(nameField.touched, false);
  });

  await t.step(
    "should re-validate against the restored value on reset",
    async () => {
      const form = new FormApi({
        initialValue: { name: "John" },
        validators: [(field) => (field.value.name ? null : "Name is required")],
      });

      form.value = { name: "" };
      await form.validate();
      assertEquals(form.invalid, true);

      form.reset();
      await form.validate();
      assertEquals(form.invalid, false);
    },
  );

  await t.step(
    "should move the dirty baseline to an explicit reset value",
    () => {
      const form = new FormApi({
        initialValue: { name: "John" },
      });

      form.value = { name: "Jane" };
      form.reset({ name: "Jane" });
      assertEquals(form.dirty, false);

      form.value = { name: "John" };
      assertEquals(form.dirty, true);
    },
  );

  await t.step(
    "resetField: should restore just one field's value, defaulting to its own slice of the baseline",
    () => {
      const form = new FormApi<{ name: string; age: number }>({
        initialValue: { name: "John", age: 30 },
      });

      const nameField = form.field("name");
      const ageField = form.field("age");
      nameField.value = "Jane";
      ageField.value = 31;

      form.resetField("name");

      assertEquals(nameField.value, "John");
      // Untouched by a reset scoped to a different field.
      assertEquals(ageField.value, 31);
    },
  );

  await t.step(
    "resetField: should clear touched for just that field, leaving the rest of the tree untouched",
    () => {
      const form = new FormApi<{ name: string; age: number }>({
        initialValue: { name: "John", age: 30 },
      });

      const nameField = form.field("name");
      const ageField = form.field("age");
      nameField.touched = true;
      ageField.touched = true;

      form.resetField("name");

      assertEquals(nameField.touched, false);
      assertEquals(ageField.touched, true);
      assertEquals(form.touched, true);
    },
  );

  await t.step(
    "resetField: should move just that field's slice of the dirty baseline when given an explicit value",
    () => {
      const form = new FormApi<{ name: string; age: number }>({
        initialValue: { name: "John", age: 30 },
      });

      const nameField = form.field("name");
      nameField.value = "Jane";

      form.resetField("name", "Jane");
      assertEquals(form.dirty, false);

      nameField.value = "John";
      assertEquals(form.dirty, true);
    },
  );

  await t.step(
    "resetField: should not register a field just to reset it",
    () => {
      const form = new FormApi<{ name: string; age: number }>({
        initialValue: { name: "John", age: 30 },
      });

      form.resetField("name");

      assertEquals(form.children.has("name"), false);
    },
  );

  await t.step(
    "resetField: should still move the baseline for an unregistered field, ready for whenever it does get registered",
    () => {
      const form = new FormApi<{ name: string; age: number }>({
        initialValue: { name: "John", age: 30 },
      });

      form.value = { name: "Jane", age: 30 };
      form.resetField("name", "Jane");

      // No field was ever registered for "name" to reset directly, but the
      // baseline still moved, so a field registered *now* starts out clean.
      const nameField = form.field("name");
      assertEquals(nameField.dirty, false);
    },
  );

  await t.step(
    "resetField: should move the value too for an unregistered field, not just the baseline",
    () => {
      const form = new FormApi<{ name: string; age: number }>({
        initialValue: { name: "John", age: 30 },
      });

      form.value = { name: "Jane", age: 30 };
      form.resetField("name", "Saved");

      // No field was ever registered for "name", but `value` itself must
      // still move, not just the baseline — otherwise a field registered
      // *now* would read the stale pre-reset value at construction.
      assertEquals(form.value, { name: "Saved", age: 30 });
      const nameField = form.field("name");
      assertEquals(nameField.value, "Saved");
      assertEquals(nameField.dirty, false);
    },
  );

  await t.step(
    "resetField: should find a field registered through an intermediate group, without creating a duplicate",
    () => {
      const form = new FormApi<{ address: { line1: string } }>({
        initialValue: { address: { line1: "1 Main St" } },
      });
      const address = form.field("address");
      const line1 = address.field("line1");
      line1.value = "2 Main St";
      line1.touched = true;

      form.resetField("address.line1");

      assertEquals(line1.value, "1 Main St");
      assertEquals(line1.touched, false);
      // Didn't register a second, disconnected "address.line1" field.
      assertEquals(address.children.has("line1"), true);
      assertEquals(address.children.size, 1);
    },
  );

  await t.step(
    "should have already settled dirty and child values by the time subscribers are notified",
    () => {
      const form = new FormApi<{ child: { name: string } }>({
        initialValue: { child: { name: "John" } },
      });

      const childField = form.field("child").field("name");

      let dirtyDuringNotify: boolean | undefined;
      let childValueDuringNotify: string | undefined;
      form.subscribe(() => {
        dirtyDuringNotify = form.dirty;
        childValueDuringNotify = childField.value;
      });

      form.value = { child: { name: "Jane" } };

      assertEquals(dirtyDuringNotify, true);
      assertEquals(childValueDuringNotify, "Jane");
    },
  );

  await t.step(
    "should call onValueChanged whenever any nested field changes, for persisting the whole form value",
    () => {
      type Model = { name: string; child: { age: number } };
      const persisted: Model[] = [];
      const form = new FormApi<Model>({
        initialValue: { name: "John", child: { age: 30 } },
        onValueChanged: (f) => persisted.push(f.value),
      });
      const nameField = form.field("name");
      const ageField = form.field("child").field("age");

      nameField.value = "Jane";
      ageField.value = 31;

      assertEquals(persisted, [
        { name: "Jane", child: { age: 30 } },
        { name: "Jane", child: { age: 31 } },
      ]);
    },
  );
});
