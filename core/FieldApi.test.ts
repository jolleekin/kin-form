import { assertEquals, assertGreater, assertThrows } from "@std/assert";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { FieldApi } from "./FieldApi.ts";
import type { AsyncValidator, Validator } from "./FieldApi.ts";
import { kParentValueChanged } from "./FieldApi.internal.ts";
import type { ValidationError } from "./types.ts";

Deno.test("FieldApi", async (t) => {
  await t.step("should handle blur", () => {
    const field = new FieldApi<string>(null, "", { initialValue: "test" });
    assertEquals(field.touched, false);

    field.handleBlur();
    assertEquals(field.touched, true);
  });

  await t.step(
    "should flush pending validation on blur, bypassing the debounce delay",
    async () => {
      const field = new FieldApi<string>(null, "", {
        initialValue: "ok",
        asyncValidator: (f) => (f.value === "bad" ? "Error" : null),
        validationDebounceMs: 10_000,
      });
      await field.validate(); // Force the initial run now, not after 10s.

      field.value = "bad";
      assertEquals(field.validating, true);
      assertEquals(field.error, null); // Not yet re-checked.

      field.handleBlur();
      await field.waitForValidation();

      assertEquals(field.validating, false);
      assertEquals(field.error, "Error");
    },
  );

  await t.step("should handle change with value", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });

    field.handleChange("newValue");
    assertEquals(field.value, "newValue");
  });

  await t.step("should initialize with initial value", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });
    assertEquals(field.value, "test");
  });

  await t.step("should have correct initial state", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });
    assertEquals(field.value, "test");
    assertEquals(field.error, null);
    assertEquals(field.invalid, false);
    assertEquals(field.touched, false);
    assertEquals(field.validating, false);
  });

  await t.step("should update value", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });
    field.value = "updated";
    assertEquals(field.value, "updated");
  });

  await t.step("should not update if value is identical", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });
    const callback = spy();
    field.subscribe(callback);

    field.value = "test";
    assertSpyCalls(callback, 0);
  });

  await t.step("should set touched state", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });

    field.touched = true;
    assertEquals(field.touched, true);

    field.touched = false;
    assertEquals(field.touched, false);
  });

  await t.step("should validate with no validators", async () => {
    const field = new FieldApi(null, "", { initialValue: "test" });

    await field.validate();
    assertEquals(field.error, null);
  });

  await t.step("should validate with passing validator", async () => {
    const validator: Validator<string> = () => null;

    const field = new FieldApi(null, "", {
      initialValue: "test",
      validators: [validator],
    });

    await field.validate();
    assertEquals(field.error, null);
  });

  await t.step("should validate with failing validator", async () => {
    const validator: Validator<string> = () => "Error message";

    const field = new FieldApi(null, "", {
      initialValue: "test",
      validators: [validator],
    });

    await field.validate();
    assertEquals(field.error, "Error message");
    assertEquals(field.invalid, true);
  });

  await t.step("should stop validation on first error", async () => {
    const validator1 = spy((): string => "Error 1");
    const validator2 = spy((): string => "Error 2");

    const field = new FieldApi(null, "", {
      initialValue: "test",
      validators: [validator1, validator2],
    });

    await field.validate();
    assertEquals(field.error, "Error 1");
    assertSpyCalls(validator1, 1);
    assertSpyCalls(validator2, 0);
  });

  await t.step("should handle async validator", async () => {
    const validator: AsyncValidator<string> = () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(null), 10);
      });
    };

    const field = new FieldApi(null, "", {
      initialValue: "test",
      asyncValidator: validator,
    });

    await field.validate();
    assertEquals(field.error, null);
  });

  await t.step(
    "should not re-invoke asyncValidator for concurrent validate() calls when nothing changed",
    async () => {
      const validator = spy((): Promise<ValidationError> =>
        new Promise((resolve) => setTimeout(() => resolve(null), 10))
      );

      const field = new FieldApi(null, "", {
        initialValue: "test",
        asyncValidator: validator,
      });

      await Promise.all([
        field.validate(),
        field.validate(),
      ]);

      assertEquals(field.error, null);
      assertSpyCalls(validator, 1);
    },
  );

  await t.step(
    "should resolve concurrent validate() calls to the latest state's result",
    async () => {
      const validator: AsyncValidator<string> = (field) =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve(field.value === "invalid" ? "Error" : null),
            10,
          )
        );

      const field = new FieldApi(null, "", {
        initialValue: "test",
        asyncValidator: validator,
      });

      const firstValidate = field.validate();
      field.value = "invalid";
      const secondValidate = field.validate();

      await Promise.all([firstValidate, secondValidate]);

      assertEquals(field.error, "Error");
    },
  );

  await t.step("should update validators", async () => {
    const field = new FieldApi<string, never>(null, "", {
      initialValue: "test",
    });

    const validator: Validator<string> = () => "Error";
    field.validators = [validator];
    // Reassigning validators on an idle field doesn't auto-run them (see the
    // `validators` setter's own doc comment for why); force a check.
    await field.validate(true);
    assertEquals(field.error, "Error");
  });

  await t.step("should call notify on value change", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });
    const callback = spy();
    field.subscribe(callback);

    field.value = "new";
    assertGreater(callback.calls.length, 0);
  });

  await t.step("should call notify on touched change", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });
    const callback = spy();
    field.subscribe(callback);

    field.touched = true;
    assertGreater(callback.calls.length, 0);
  });

  await t.step("should not be dirty right after construction", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });
    assertEquals(field.dirty, false);
  });

  await t.step(
    "should be dirty once value differs from its initial value",
    () => {
      const field = new FieldApi(null, "", { initialValue: "test" });
      field.value = "updated";
      assertEquals(field.dirty, true);
    },
  );

  await t.step(
    "should be clean again once value is reverted by hand, even without a reset",
    () => {
      const field = new FieldApi(null, "", { initialValue: "test" });
      field.value = "updated";
      assertEquals(field.dirty, true);

      field.value = "test";
      assertEquals(field.dirty, false);
    },
  );

  await t.step("should not be dirty merely because it's touched", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });
    field.touched = true;
    assertEquals(field.dirty, false);
  });

  await t.step(
    "should reflect a descendant's value change on every ancestor's own dirty",
    () => {
      const group = new FieldApi<{ address: { line1: string } }>(
        null,
        "",
        {
          initialValue: { address: { line1: "1 Main St" } },
        },
      );
      const address = group.field("address");
      const line1 = address.field("line1");

      line1.value = "2 Main St";

      assertEquals(line1.dirty, true);
      assertEquals(address.dirty, true);
      assertEquals(group.dirty, true);
    },
  );

  await t.step("should have parent reference", () => {
    const group = new FieldApi<{ test: string }>(null, "", {
      initialValue: { test: "value" },
    });

    const field = group.field("test");
    assertEquals(field.parent, group);
  });

  await t.step("should resolve root to itself when there is no parent", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });
    assertEquals(field.root, field);
  });

  await t.step("should resolve root through nested fields", () => {
    const grandparent = new FieldApi<{ child: { name: string } }>(
      null,
      "",
      { initialValue: { child: { name: "John" } } },
    );
    const parent = grandparent.field("child");
    const field = parent.field("name");

    assertEquals(field.root, grandparent);
    assertEquals(parent.root, grandparent);
    assertEquals(grandparent.root, grandparent);
  });

  await t.step("should have name property", () => {
    const field = new FieldApi(null, "fieldName", {
      initialValue: "test",
    });

    assertEquals(field.name, "fieldName");
  });

  await t.step("should support dependents", () => {
    const field = new FieldApi<
      string,
      { field1: string; field2: string; field3: string }
    >(null, "field1", {
      initialValue: "test",
      dependents: ["field2", "field3"],
    });

    assertEquals(field.dependents, ["field2", "field3"]);
  });

  await t.step("should update dependents with updateOptions", () => {
    const field = new FieldApi<string, { field1: string; field2: string }>(
      null,
      "field1",
      { initialValue: "test" },
    );

    field.updateOptions({
      dependents: ["field2"],
    });

    assertEquals(field.dependents, ["field2"]);
  });

  await t.step("should accept a single dependent without an array", () => {
    const field = new FieldApi<string, { field1: string; field2: string }>(
      null,
      "field1",
      {
        initialValue: "test",
        dependents: "field2",
      },
    );

    assertEquals(field.dependents, ["field2"]);
  });

  await t.step("should call onValueChanged when value changes", () => {
    const onValueChanged = spy();
    const field = new FieldApi(null, "field1", {
      initialValue: "test",
      onValueChanged,
    });

    field.value = "updated";

    assertSpyCalls(onValueChanged, 1);
    assertEquals(onValueChanged.calls[0].args, [field]);
  });

  await t.step(
    "should not call onValueChanged when set to the same value",
    () => {
      const onValueChanged = spy();
      const field = new FieldApi(null, "field1", {
        initialValue: "test",
        onValueChanged,
      });

      field.value = "test";

      assertSpyCalls(onValueChanged, 0);
    },
  );

  await t.step(
    "should not call onValueChanged for the initial value",
    () => {
      const onValueChanged = spy();
      new FieldApi(null, "field1", {
        initialValue: "test",
        onValueChanged,
      });

      assertSpyCalls(onValueChanged, 0);
    },
  );

  await t.step("should update onValueChanged with updateOptions", () => {
    const first = spy();
    const second = spy();
    const field = new FieldApi(null, "field1", {
      initialValue: "test",
      onValueChanged: first,
    });

    field.updateOptions({ onValueChanged: second });
    field.value = "updated";

    assertSpyCalls(first, 0);
    assertSpyCalls(second, 1);
  });

  await t.step(
    "should accept a single validator without an array",
    async () => {
      const field = new FieldApi<string>(null, "", {
        initialValue: "",
        validators: () => "Required",
      });

      assertEquals(field.validators.length, 1);
      await field.validate();
      assertEquals(field.error, "Required");
    },
  );

  await t.step("should set validating state during validation", async () => {
    const validatingStates: boolean[] = [];

    const validator: AsyncValidator<string> = async () => {
      validatingStates.push(true); // During validation
      await new Promise((resolve) => setTimeout(resolve, 10));
      return null;
    };

    const field = new FieldApi(null, "", {
      initialValue: "test",
      asyncValidator: validator,
    });

    const callback = spy(() => {
      validatingStates.push(field.validating);
    });
    field.subscribe(callback);

    await field.validate();

    assertEquals(field.validating, false);
    assertGreater(validatingStates.length, 0);
  });

  await t.step("should never flip validating for sync-only validators", () => {
    const field = new FieldApi(null, "", {
      initialValue: "test",
      validators: [() => "Error"],
    });

    const callback = spy(() => {
      assertEquals(field.validating, false);
    });
    field.subscribe(callback);

    field.value = "updated"; // Reschedules validation synchronously.

    assertEquals(field.error, "Error");
    assertEquals(field.validating, false);
    assertGreater(callback.calls.length, 0);
  });

  await t.step(
    "should batch a value change and the validating flip it triggers into one notification",
    async () => {
      const field = new FieldApi(null, "", {
        initialValue: "test",
        asyncValidator: () => "Error",
      });
      await field.waitForValidation(); // Settle the initial run first.

      const callback = spy();
      field.subscribe(callback);

      field.value = "updated"; // Reschedules validation synchronously, flipping `validating` too.

      assertSpyCalls(callback, 1);
    },
  );

  await t.step(
    "should immediately clear to valid when validators is reassigned to an empty array",
    () => {
      const field = new FieldApi(null, "", {
        initialValue: "test",
        validators: [() => "Error"],
      });
      assertEquals(field.error, "Error");

      field.validators = [];
      assertEquals(field.error, null);
    },
  );

  await t.step(
    "should not invoke asyncValidator at all when a sync validator already failed",
    async () => {
      const asyncValidator = spy((): ValidationError => "Async error");

      const field = new FieldApi(null, "", {
        initialValue: "test",
        validators: [() => "Sync error"],
        asyncValidator,
      });
      await field.waitForValidation();

      assertEquals(field.error, "Sync error");
      assertEquals(field.validating, false); // Never even scheduled.
      assertSpyCalls(asyncValidator, 0);
    },
  );

  await t.step(
    "should run asyncValidator once every sync validator has passed",
    async () => {
      const field = new FieldApi(null, "", {
        initialValue: "valid",
        validators: [(f) => (f.value ? null : "Required")],
        asyncValidator: (f) => (f.value === "taken" ? "Taken" : null),
      });
      await field.waitForValidation();
      assertEquals(field.error, null);

      field.value = "taken";
      await field.waitForValidation();
      assertEquals(field.error, "Taken");
    },
  );

  await t.step(
    "should immediately settle to valid when asyncValidator is unset, even mid-flight",
    async () => {
      const field = new FieldApi(null, "", {
        initialValue: "test",
        asyncValidator: () => "Error",
      });
      await field.waitForValidation();
      assertEquals(field.error, "Error");

      field.validate(true); // Force a fresh run, leave it pending.
      assertEquals(field.validating, true);

      field.asyncValidator = undefined; // Nothing left to check, regardless
      // of what the now-irrelevant in-flight run eventually decides.
      assertEquals(field.error, null);
      assertEquals(field.validating, false);
    },
  );

  await t.step(
    "should not restart validation when re-assigned synchronously, before the debounced run has started",
    async () => {
      // Simulates an async validator built inline (a fresh closure on every
      // call/render), reassigned several times in the same synchronous tick
      // (like React batching multiple renders), before the debounce timer
      // has even fired once. Each task resolves to a distinct result so we
      // can tell exactly which one (if any) actually ran.
      const tasks = [0, 1, 2, 3].map((i) =>
        spy(
          (): Promise<ValidationError> =>
            new Promise((resolve) =>
              setTimeout(() => resolve(`Error-${i}`), 10)
            ),
        )
      );

      const field = new FieldApi(null, "", {
        initialValue: "test",
        asyncValidator: () => tasks[0](),
      });
      assertEquals(field.validating, true);

      field.asyncValidator = () => tasks[1]();
      field.asyncValidator = () => tasks[2]();
      field.asyncValidator = () => tasks[3]();

      await field.waitForValidation();

      // None of this happened with an `await` in between, so the debounce
      // timer hasn't fired yet by the time any of these run; the pending
      // run starts only once control yields (at `waitForValidation()`
      // above), by which point `#asyncValidator` already holds the *last*
      // reassignment. Only that one is ever actually invoked.
      assertEquals(field.error, "Error-3");
      assertSpyCalls(tasks[0], 0);
      assertSpyCalls(tasks[1], 0);
      assertSpyCalls(tasks[2], 0);
      assertSpyCalls(tasks[3], 1);
    },
  );

  await t.step(
    "should not change the outcome of an already-invoked validator when reassigned mid-flight",
    async () => {
      // Unlike the previous test, this reassigns *after* the debounced run
      // has genuinely started (and already invoked the first validator),
      // simulated with a real delay safely inside the task's own delay, so
      // there's no risk of it having already settled by the time we get
      // there. `#runAsyncValidator` only ever reads `this.#asyncValidator`
      // once, at the moment it starts, so reassigning afterwards can't affect
      // an invocation that already happened.
      const task1 = spy(
        (): Promise<ValidationError> =>
          new Promise((resolve) => setTimeout(() => resolve("Error-1"), 10)),
      );
      const task2 = spy(
        (): Promise<ValidationError> =>
          new Promise((resolve) => setTimeout(() => resolve("Error-2"), 10)),
      );

      const field = new FieldApi(null, "", {
        initialValue: "test",
        asyncValidator: () => task1(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3));
      assertEquals(field.validating, true); // Still safely mid-flight.

      field.asyncValidator = () => task2();

      await field.waitForValidation();

      assertEquals(field.error, "Error-1");
      assertSpyCalls(task1, 1);
      assertSpyCalls(task2, 0);
    },
  );

  await t.step(
    "should not automatically run when asyncValidator is reassigned after the previous one already settled",
    async () => {
      // Unlike reassigning while still pending (previous tests), an idle
      // field never auto-schedules on reassignment alone: a component
      // passing an inline validator reassigns on literally every render, and
      // auto-scheduling on that alone would create a self-sustaining
      // notify/re-render/reschedule loop (see the `validators` setter's own
      // comment; the same reasoning applies here). The fresh validator only
      // takes effect on the next genuine trigger: a value change, or an
      // explicit `validate(true)` call.
      const task1 = spy(
        (): Promise<ValidationError> =>
          new Promise((resolve) => setTimeout(() => resolve("Error-1"), 5)),
      );
      const task2 = spy(
        (): Promise<ValidationError> =>
          new Promise((resolve) => setTimeout(() => resolve("Error-2"), 5)),
      );

      const field = new FieldApi(null, "", {
        initialValue: "test",
        asyncValidator: () => task1(),
      });
      await field.waitForValidation();
      assertEquals(field.error, "Error-1");
      assertEquals(field.validating, false);

      field.asyncValidator = () => task2();
      assertEquals(field.validating, false); // Not auto-scheduled.
      assertEquals(field.error, "Error-1"); // Still stale.

      await field.validate(true); // Force the fresh validator to actually run.

      assertEquals(field.error, "Error-2");
      assertSpyCalls(task1, 1);
      assertSpyCalls(task2, 1);
    },
  );

  await t.step(
    "should batch an async validator's settle (error + validating) into one notification",
    async () => {
      const field = new FieldApi<string>(null, "", {
        initialValue: "ok",
        asyncValidator: async (f) => {
          await new Promise((r) => setTimeout(r, 5));
          return f.value === "bad" ? "Error" : null;
        },
      });
      await field.waitForValidation(); // Settle with error=null first.

      field.value = "bad"; // Reschedules; the async run below settles later.

      const callback = spy();
      field.subscribe(callback);

      await field.waitForValidation(); // error null->"Error" AND validating true->false together.

      assertEquals(field.error, "Error");
      assertEquals(field.validating, false);
      assertSpyCalls(callback, 1);
    },
  );

  await t.step("should have null schemaError with no parent", () => {
    const field = new FieldApi(null, "", { initialValue: "test" });
    assertEquals(field.schemaError, null);
  });

  await t.step(
    "should have null schemaError when the parent's schemaErrorMap is empty",
    async () => {
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "" },
      });
      const field = group.field("a");
      await group.waitForValidation();

      assertEquals(field.schemaError, null);
    },
  );

  await t.step(
    "should reflect a hit in the parent's schemaErrorMap under this field's exact name",
    async () => {
      const group = new FieldApi<{ a: string; b: string }>(null, "", {
        initialValue: { a: "", b: "" },
        schemaValidator: () => ({ a: "Required" }),
      });
      const fieldA = group.field("a");
      const fieldB = group.field("b");
      await group.waitForValidation();

      assertEquals(fieldA.schemaError, "Required");
      // A different key in the same map doesn't leak onto this field.
      assertEquals(fieldB.schemaError, null);
    },
  );

  await t.step(
    "should see an outer group's schema result when registered through an intermediate group with no schemaValidator of its own",
    async () => {
      const form = new FieldApi<{ address: { line1: string } }>(null, "", {
        initialValue: { address: { line1: "" } },
        schemaValidator: () => ({ "address.line1": "Required" }),
      });
      const address = form.field("address");
      const line1 = address.field("line1");
      await form.waitForValidation();

      // The form's own schemaErrorMap has the full-path key...
      assertEquals(form.schemaErrorMap, { "address.line1": "Required" });
      // ...and `line1`'s *direct* parent (`address`) never ran a schema of
      // its own, so the walk climbs past it and finds `form`'s entry.
      assertEquals(line1.schemaError, "Required");
    },
  );

  await t.step(
    "should stop at an intermediate group's own schemaValidator instead of climbing further",
    async () => {
      const form = new FieldApi<{ address: { line1: string } }>(null, "", {
        initialValue: { address: { line1: "" } },
        schemaValidator: () => ({ "address.line1": "Required" }),
      });
      const address = form.field("address", {
        // Its own schemaValidator reports nothing for "line1"...
        schemaValidator: () => null,
      });
      const line1 = address.field("line1");
      await form.waitForValidation();

      // ...so `line1.schemaError` reflects that, not `form`'s entry for
      // "address.line1": `address` owns the verdict for everything under it.
      assertEquals(line1.schemaError, null);
    },
  );

  await t.step(
    "should report invalid via schemaError even with no own validators, and clear once unset",
    async () => {
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "" },
        schemaValidator: () => ({ a: "Required" }),
      });
      const field = group.field("a");
      await group.waitForValidation();

      assertEquals(field.error, null);
      assertEquals(field.schemaError, "Required");
      assertEquals(field.invalid, true);

      group.schemaValidator = undefined;
      assertEquals(field.invalid, false);
    },
  );

  await t.step(
    "should notify the field's own subscribers when the parent's schemaErrorMap changes its key",
    async () => {
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "" },
      });
      const field = group.field("a");
      await group.waitForValidation();

      const callback = spy();
      field.subscribe(callback);

      // Reassigning `schemaValidator` alone doesn't auto-trigger a run
      // (same reassignment semantics as `validators`); a value change
      // (a fresh object reference, so it doesn't short-circuit on `===`)
      // is what actually kicks off the new validator here.
      group.schemaValidator = () => ({ a: "Required" });
      group.value = { a: "" };
      await group.waitForValidation();

      assertGreater(callback.calls.length, 0);
      assertEquals(field.invalid, true);
    },
  );

  await t.step(
    "should notify a field registered through an intermediate group when an outer ancestor's schemaErrorMap changes its full path",
    async () => {
      const form = new FieldApi<{ address: { line1: string } }>(null, "", {
        initialValue: { address: { line1: "" } },
      });
      const address = form.field("address");
      const line1 = address.field("line1");
      await form.waitForValidation();

      const callback = spy();
      line1.subscribe(callback);

      form.schemaValidator = () => ({ "address.line1": "Required" });
      form.value = { address: { line1: "" } }; // Fresh reference to trigger a run.
      await form.waitForValidation();

      assertGreater(callback.calls.length, 0);
      assertEquals(line1.invalid, true);
    },
  );

  await t.step("should have empty fields initially", () => {
    const group = new FieldApi<{ name: string }>(null, "", {
      initialValue: { name: "John" },
    });

    assertEquals(group.children.size, 0);
  });

  await t.step("should get field by name", () => {
    const group = new FieldApi<{ name: string; age: number }>(null, "", {
      initialValue: { name: "John", age: 30 },
    });

    const nameField = group.field("name");
    assertEquals(nameField.value, "John");
  });

  await t.step("should cache field instances", () => {
    const group = new FieldApi<{ name: string }>(null, "", {
      initialValue: { name: "John" },
    });

    const field1 = group.field("name");
    const field2 = group.field("name");

    assertEquals(field1, field2);
  });

  await t.step("should register field in fields map", () => {
    const group = new FieldApi<{ name: string; age: number }>(null, "", {
      initialValue: { name: "John", age: 30 },
    });

    group.field("name");
    group.field("age");

    assertEquals(group.children.size, 2);
  });

  await t.step("should unregister field", () => {
    const group = new FieldApi<{ name: string }>(null, "", {
      initialValue: { name: "John" },
    });

    group.field("name");
    assertEquals(group.children.size, 1);

    group.unregisterField("name");
    assertEquals(group.children.size, 0);
  });

  await t.step(
    "should throw when field is called with a flat dotted path that bypasses an already-registered intermediate field",
    () => {
      const group = new FieldApi<{ address: { line1: string } }>(
        null,
        "",
        { initialValue: { address: { line1: "1 Main St" } } },
      );

      group.field("address");

      assertThrows(
        () => group.field("address.line1"),
        Error,
        '"address" is already registered',
      );
    },
  );

  await t.step(
    "should throw when field is called with a name that a flat dotted field is already registered under",
    () => {
      const group = new FieldApi<{ address: { line1: string } }>(
        null,
        "",
        { initialValue: { address: { line1: "1 Main St" } } },
      );

      group.field("address.line1");

      assertThrows(
        () => group.field("address"),
        Error,
        '"address.line1" is already registered',
      );
    },
  );

  await t.step(
    "should not throw for sibling array item fields registered with dotted index keys",
    () => {
      const group = new FieldApi<{ items: string[] }>(null, "", {
        initialValue: { items: ["a", "b"] },
      });

      group.field("items.0");
      group.field("items.1");

      assertEquals(group.children.size, 2);
    },
  );

  await t.step(
    "should return the same instance when field() is called twice for the same exact name, no longer a field/group collision, since there's only one node type",
    () => {
      const group = new FieldApi<{ address: { line1: string } }>(
        null,
        "",
        { initialValue: { address: { line1: "1 Main St" } } },
      );

      const first = group.field("address");
      const second = group.field("address");

      assertEquals(first, second);
    },
  );

  await t.step(
    "should call onChildrenChanged when a field is registered",
    () => {
      const group = new FieldApi<{ name: string; age: number }>(null, "", {
        initialValue: { name: "John", age: 30 },
      });

      const callback = spy();
      group.onChildrenChanged(callback);

      group.field("name");
      assertSpyCalls(callback, 1);

      // A second registration of a different field fires again...
      group.field("age");
      assertSpyCalls(callback, 2);

      // ...but re-fetching an already-registered field does not, since the
      // *set* of fields hasn't changed.
      group.field("name");
      assertSpyCalls(callback, 2);
    },
  );

  await t.step(
    "should call onChildrenChanged when a nested field is registered",
    () => {
      const group = new FieldApi<{ child: { name: string } }>(null, "", {
        initialValue: { child: { name: "John" } },
      });

      const callback = spy();
      group.onChildrenChanged(callback);

      group.field("child");
      assertSpyCalls(callback, 1);
    },
  );

  await t.step(
    "should call onChildrenChanged when a field is unregistered",
    () => {
      const group = new FieldApi<{ name: string }>(null, "", {
        initialValue: { name: "John" },
      });

      group.field("name");
      const callback = spy();
      group.onChildrenChanged(callback);

      group.unregisterField("name");
      assertSpyCalls(callback, 1);
    },
  );

  await t.step(
    "should stop calling onChildrenChanged after unsubscribing",
    () => {
      const group = new FieldApi<{ name: string; age: number }>(null, "", {
        initialValue: { name: "John", age: 30 },
      });

      const callback = spy();
      const unsubscribe = group.onChildrenChanged(callback);
      unsubscribe();

      group.field("name");
      assertSpyCalls(callback, 0);
    },
  );

  await t.step("should update field with options", () => {
    const group = new FieldApi<{ name: string }>(null, "", {
      initialValue: { name: "John" },
    });

    const field1 = group.field("name");
    const field2 = group.field("name", {
      validators: [() => "Error"],
    });

    assertEquals(field1, field2);
    assertEquals(field2.validators.length, 1);
  });

  await t.step("should track touched state across children", () => {
    const group = new FieldApi<{ name: string; age: number }>(null, "", {
      initialValue: { name: "John", age: 30 },
    });

    const nameField = group.field("name");
    assertEquals(group.touched, false);

    nameField.touched = true;
    assertEquals(group.touched, true);
  });

  await t.step("should set touched on all children", () => {
    const group = new FieldApi<{ name: string; age: number }>(null, "", {
      initialValue: { name: "John", age: 30 },
    });

    const nameField = group.field("name");
    const ageField = group.field("age");

    group.touched = true;

    assertEquals(nameField.touched, true);
    assertEquals(ageField.touched, true);
  });

  await t.step("should track invalid state across children", async () => {
    const group = new FieldApi<{ name: string; age: number }>(null, "", {
      initialValue: { name: "John", age: 30 },
    });

    const nameField = group.field("name");
    nameField.validators = [() => "Error"];
    await nameField.validate(true); // Reassigning while idle doesn't auto-run.
    assertEquals(group.invalid, true);
  });

  await t.step("should track validating state across children", async () => {
    const group = new FieldApi<{ name: string }>(null, "", {
      initialValue: { name: "John" },
    });

    const nameField = group.field("name");
    nameField.asyncValidator = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return null;
    };

    const validatePromise = nameField.validate(true); // Reassigning while idle doesn't auto-run.
    assertEquals(group.validating, true);

    await validatePromise;
    assertEquals(group.validating, false);
  });

  await t.step(
    "should settle a newly-registered child's sync validators immediately, with no pending state at all",
    () => {
      const group = new FieldApi<{ name: string }>(null, "", {
        initialValue: { name: "" },
      });

      const nameField = group.field("name", {
        validators: [(f) => (f.value ? null : "Required")],
      });

      // The field runs its sync validators synchronously as part of its own
      // constructor; this must be visible on the group's aggregate right
      // away, with no pending/validating state ever, or a caller that checks
      // `group.validating`/`group.invalid` in the same tick a step/group is
      // first mounted (e.g. a wizard's `next()`) would race it.
      assertEquals(group.validating, false);
      assertEquals(group.invalid, true);
      assertEquals(nameField.error, "Required");
    },
  );

  await t.step(
    "should reflect a newly-registered child's pending asyncValidator immediately, without waiting a tick",
    async () => {
      const group = new FieldApi<{ name: string }>(null, "", {
        initialValue: { name: "" },
      });

      const nameField = group.field("name", {
        asyncValidator: (f) => (f.value ? null : "Required"),
      });

      // The field schedules its own async validation synchronously as part
      // of its constructor; this must be visible on the group's aggregate
      // right away (not just after the async settle), or a caller that
      // checks `group.validating`/`group.invalid` in the same tick a
      // step/group is first mounted (e.g. a wizard's `next()`) would race
      // it.
      assertEquals(group.validating, true);
      assertEquals(group.invalid, false); // Not yet settled.

      await nameField.waitForValidation();
      assertEquals(group.validating, false);
      assertEquals(group.invalid, true);
    },
  );

  await t.step("should always be valid while disabled", () => {
    const field = new FieldApi<string>(null, "", {
      initialValue: "",
      validators: [() => "Required"],
    });
    assertEquals(field.invalid, true);

    field.disabled = true;
    assertEquals(field.invalid, false);

    field.disabled = false;
    assertEquals(field.invalid, true);
  });

  await t.step("should not run validators while disabled", () => {
    const validator = spy(() => "Error");
    const field = new FieldApi<string>(null, "", {
      initialValue: "ok",
      validators: [validator as Validator<string>],
    });
    assertSpyCalls(validator, 1); // Ran once, on construction.

    field.disabled = true;
    field.value = "changed";
    assertSpyCalls(validator, 1); // Not re-run while disabled.
    assertEquals(field.invalid, false);
  });

  await t.step(
    "should settle any pending asyncValidator immediately when disabled",
    () => {
      const field = new FieldApi<string>(null, "", {
        initialValue: "ok",
        asyncValidator: () =>
          new Promise((resolve) => setTimeout(() => resolve("Error"), 10)),
      });
      assertEquals(field.validating, true);

      field.disabled = true;
      assertEquals(field.validating, false);
      assertEquals(field.invalid, false);
    },
  );

  await t.step(
    "should disable every registered child when set on the parent",
    () => {
      const group = new FieldApi<{ name: string; age: number }>(null, "", {
        initialValue: { name: "John", age: 30 },
      });

      const nameField = group.field("name");
      const ageField = group.field("age");

      group.disabled = true;

      assertEquals(nameField.disabled, true);
      assertEquals(ageField.disabled, true);

      group.disabled = false;

      assertEquals(nameField.disabled, false);
      assertEquals(ageField.disabled, false);
    },
  );

  await t.step(
    "should start a newly-registered child disabled if its parent already is",
    () => {
      const group = new FieldApi<{ name: string }>(null, "", {
        initialValue: { name: "John" },
        disabled: true,
      });

      const nameField = group.field("name");
      assertEquals(nameField.disabled, true);
    },
  );

  await t.step("should give every field a unique id", () => {
    const group = new FieldApi<{ items: string[] }>(null, "", {
      initialValue: { items: ["a", "b"] },
    });

    const field0 = group.field("items.0");
    const field1 = group.field("items.1");

    assertGreater(field1.id, field0.id);
    assertGreater(group.id, 0);
  });

  await t.step(
    "should batch invalid/touched aggregate recompute into a single notification",
    async () => {
      const group = new FieldApi<{ name: string; age: number }>(null, "", {
        initialValue: { name: "John", age: 30 },
      });

      const badField = group.field("name");
      badField.validators = [() => "Error"];
      await badField.validate(true); // Reassigning while idle doesn't auto-run.
      badField.touched = true;
      assertEquals(group.invalid, true);
      assertEquals(group.touched, true);

      const callback = spy();
      group.subscribe(callback);

      group.unregisterField("name"); // Flips both `invalid` and `touched` at once.

      assertEquals(group.invalid, false);
      assertEquals(group.touched, false);
      assertSpyCalls(callback, 1);
    },
  );

  await t.step(
    "should coalesce the aggregate recompute across a grandparent too",
    async () => {
      const grandparent = new FieldApi<{ child: { name: string } }>(
        null,
        "",
        { initialValue: { child: { name: "John" } } },
      );
      const parent = grandparent.field("child");
      const badField = parent.field("name");
      badField.validators = [() => "Error"];
      await badField.waitForValidation();
      badField.touched = true;

      const parentCallback = spy();
      const grandparentCallback = spy();
      parent.subscribe(parentCallback);
      grandparent.subscribe(grandparentCallback);

      parent.unregisterField("name");

      assertEquals(grandparent.invalid, false);
      assertEquals(grandparent.touched, false);
      assertSpyCalls(parentCallback, 1);
      assertSpyCalls(grandparentCallback, 1);
    },
  );

  await t.step(
    "should not let one field's batched recompute defer an unrelated field's notification",
    async () => {
      const groupA = new FieldApi<{ items: string[] }>(null, "", {
        initialValue: { items: ["a", "b"] },
      });
      const groupB = new FieldApi<{ name: string }>(null, "", {
        initialValue: { name: "x" },
      });

      const badField = groupA.field("items.1");
      badField.validators = [() => "Error"];
      await badField.waitForValidation();

      const order: string[] = [];
      groupB.subscribe(() => order.push("groupB"));
      groupA.subscribe(() => order.push("groupA"));

      groupA.batch(() => {
        groupB.value = { name: "y" }; // Unrelated tree, not deferred.
        order.push("mid-batch");
        groupA.removeItem("items", 1); // Triggers groupA's own batched recompute.
      });

      assertEquals(order, ["groupB", "mid-batch", "groupA"]);
    },
  );

  await t.step("should notify on change", () => {
    const group = new FieldApi<{ name: string }>(null, "", {
      initialValue: { name: "John" },
    });

    const callback = spy();
    group.subscribe(callback);

    group.value = { name: "Jane" };
    assertGreater(callback.calls.length, 0);
  });

  await t.step("should handle nested fields", () => {
    const parent = new FieldApi<{
      child: { name: string };
    }>(null, "", { initialValue: { child: { name: "John" } } });

    const childField = parent.field("child");
    assertEquals(childField.value, { name: "John" });
  });

  await t.step(
    "should skip the redundant kParentValueChanged sync when a value change bubbles up from a child",
    () => {
      const group = new FieldApi<{ name: string; age: number }>(null, "", {
        initialValue: { name: "John", age: 30 },
      });

      const nameField = group.field("name");
      const ageField = group.field("age");
      const ageSpy = spy(ageField, kParentValueChanged);

      nameField.value = "Jane";

      assertSpyCalls(ageSpy, 0);
    },
  );

  await t.step(
    "should leave sibling fields untouched when one field's change bubbles up",
    () => {
      const group = new FieldApi<{ name: string; age: number }>(null, "", {
        initialValue: { name: "John", age: 30 },
      });

      const nameField = group.field("name");
      const ageField = group.field("age");

      nameField.value = "Jane";

      assertEquals(ageField.value, 30);
      assertEquals(group.value, { name: "Jane", age: 30 });
    },
  );

  await t.step(
    "should still sync children when the group's own value is replaced wholesale",
    () => {
      const group = new FieldApi<{ name: string; age: number }>(null, "", {
        initialValue: { name: "John", age: 30 },
      });

      const nameField = group.field("name");
      const ageField = group.field("age");

      group.value = { name: "Jane", age: 31 };

      assertEquals(nameField.value, "Jane");
      assertEquals(ageField.value, 31);
    },
  );

  await t.step(
    "should still sync grandchildren when a value change is pushed down from a grandparent",
    () => {
      const grandparent = new FieldApi<{
        child: { name: string; age: number };
      }>(null, "", { initialValue: { child: { name: "John", age: 30 } } });

      const child = grandparent.field("child");
      const nameField = child.field("name");
      const ageField = child.field("age");

      grandparent.value = { child: { name: "Jane", age: 31 } };

      assertEquals(nameField.value, "Jane");
      assertEquals(ageField.value, 31);
    },
  );

  await t.step(
    "should force a dependent sibling to re-run its validators even if it was already settled",
    async () => {
      // Mutual "at least one of these two is required" validation: each
      // field's validator reads the *other* field's value, and each
      // declares the other as a `dependents` target so changing one
      // re-checks the other even though the other's own value didn't
      // change.
      const group = new FieldApi<{ firstName: string; lastName: string }>(
        null,
        "",
        { initialValue: { firstName: "", lastName: "" } },
      );

      const firstName = group.field("firstName", {
        dependents: ["lastName"],
        validators: [
          (f) =>
            f.value.trim() || f.parent!.value.lastName.trim()
              ? null
              : "At least one name is required",
        ],
      });
      const lastName = group.field("lastName", {
        dependents: ["firstName"],
        validators: [
          (f) =>
            f.value.trim() || f.parent!.value.firstName.trim()
              ? null
              : "At least one name is required",
        ],
      });

      await group.waitForValidation();
      assertEquals(firstName.error, "At least one name is required");
      assertEquals(lastName.error, "At least one name is required");

      firstName.value = "Ada";
      await group.waitForValidation();
      // `lastName`'s own value never changed, but `firstName`'s `dependents`
      // forces it to re-run and see that `firstName` now covers it.
      assertEquals(lastName.error, null);

      firstName.value = "";
      await group.waitForValidation();
      // Same in reverse: clearing `firstName` makes `lastName` invalid again
      // even though `lastName`'s own value is still untouched.
      assertEquals(lastName.error, "At least one name is required");
    },
  );

  await t.step(
    "should run onValueChanged as a side effect of a sibling's value change",
    () => {
      // `country`'s onValueChanged clears `province`, the same shape as
      // tanstack/form's `listeners.onChange` example. Unlike `dependents`,
      // which can only force sibling validators to re-run, this can push a
      // new value.
      const group = new FieldApi<{ country: string; province: string }>(
        null,
        "",
        { initialValue: { country: "US", province: "CA" } },
      );

      const province = group.field("province");
      group.field("country", {
        onValueChanged: () => {
          province.value = "";
        },
      });

      group.field("country").value = "FR";

      assertEquals(province.value, "");
    },
  );

  await t.step(
    "should call a field's own onValueChanged after its children's",
    () => {
      // Pushing a new value down from the field (not bubbling up from a
      // child): `valueChanged` re-syncs every child before scheduling its
      // own validation/notifying, so the children's `onValueChanged` must
      // fire before the parent's own.
      const calls: string[] = [];
      const group = new FieldApi<{ name: string }>(
        null,
        "",
        {
          initialValue: { name: "John" },
          onValueChanged: () => calls.push("group"),
        },
      );
      group.field("name", {
        onValueChanged: () => calls.push("name"),
      });

      group.value = { name: "Jane" };

      assertEquals(calls, ["name", "group"]);
    },
  );

  await t.step(
    "should have null schemaErrorMap and be valid with no schemaValidator",
    async () => {
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "" },
      });
      await group.waitForValidation();

      assertEquals(group.schemaErrorMap, null);
      assertEquals(group.invalid, false);
    },
  );

  await t.step(
    "should populate schemaErrorMap from a configured schemaValidator",
    async () => {
      const group = new FieldApi<{ a: string; b: string }>(null, "", {
        initialValue: { a: "", b: "ok" },
        schemaValidator: (g) => (g.value.a ? null : { a: "Required" }),
      });
      await group.waitForValidation();

      assertEquals(group.schemaErrorMap, { a: "Required" });
    },
  );

  await t.step("should fold schemaErrorMap into invalid", async () => {
    const group = new FieldApi<{ a: string }>(null, "", {
      initialValue: { a: "" },
      schemaValidator: () => ({ a: "Required" }),
    });
    await group.waitForValidation();

    assertEquals(group.error, null); // No own plain validator.
    assertEquals(group.invalid, true); // Via schemaErrorMap instead.
  });

  await t.step(
    "should reflect the schema-errors task in validating",
    async () => {
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "" },
        schemaValidator: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ a: "Required" }), 10)
          ),
      });

      // Scheduled synchronously as part of the group's own constructor.
      assertEquals(group.validating, true);

      await group.waitForValidation();
      assertEquals(group.validating, false);
    },
  );

  await t.step(
    "should not call invalidChanged again when a schemaValidator's fresh-but-equal result settles",
    async () => {
      // A settle's `validating` pending->settled transition notifies every
      // time regardless (same as the plain `error` pipeline already does);
      // that's not what `shallowEqual` is for. What it *does* prevent
      // is a redundant `invalidChanged()` call specifically when the
      // resettled map's content didn't actually change, even though the
      // validator (like any validator-factory pattern in this codebase)
      // returns a fresh object reference every run.
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "x" },
        schemaValidator: () => ({ a: "Required" }), // Fresh object every call.
      });
      await group.waitForValidation();

      const invalidChangedSpy = spy(
        group as unknown as { invalidChanged(): void },
        "invalidChanged",
      );

      group.value = { a: "y" }; // Different value, same (shallowly) result.
      await group.waitForValidation();

      assertSpyCalls(invalidChangedSpy, 0);
      assertEquals(group.schemaErrorMap, { a: "Required" });
    },
  );

  await t.step(
    "should only notify the direct child whose own schemaErrorMap key actually changed",
    async () => {
      const group = new FieldApi<{ a: string; b: string }>(null, "", {
        initialValue: { a: "", b: "" },
      });
      const fieldA = group.field("a");
      const fieldB = group.field("b");
      await group.waitForValidation();

      const callbackA = spy();
      const callbackB = spy();
      fieldA.subscribe(callbackA);
      fieldB.subscribe(callbackB);

      group.schemaValidator = () => ({ a: "Required" });
      group.value = { a: "", b: "" }; // Fresh reference to trigger a run.
      await group.waitForValidation();

      assertGreater(callbackA.calls.length, 0);
      assertSpyCalls(callbackB, 0);
    },
  );

  await t.step(
    "should wait for both a slow asyncValidator and a slow schemaValidator together",
    async () => {
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "" },
        asyncValidator: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve("Group error"), 15)
          ),
        schemaValidator: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ a: "Required" }), 5)
          ),
      });

      await group.waitForValidation();

      assertEquals(group.error, "Group error");
      assertEquals(group.schemaErrorMap, { a: "Required" });
    },
  );

  await t.step(
    "should debounce schemaValidator using the field's own validationDebounceMs",
    async () => {
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "x" },
        validationDebounceMs: 20,
        schemaValidator: () => ({ a: "Required" }),
      });

      group.value = { a: "y" }; // Reschedules within the debounce window.
      assertEquals(group.schemaErrorMap, null); // Not yet settled.

      await group.waitForValidation();
      assertEquals(group.schemaErrorMap, { a: "Required" });
    },
  );

  await t.step(
    "should flush pending schemaValidator on blur, bypassing the debounce delay",
    async () => {
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "ok" },
        schemaValidator: (g) => g.value.a === "bad" ? { a: "Required" } : null,
      });
      await group.waitForValidation(); // Settle the initial run before switching to a slow debounce.
      group.updateOptions({ validationDebounceMs: 10_000 });

      group.value = { a: "bad" };
      assertEquals(group.validating, true);
      assertEquals(group.schemaErrorMap, null); // Not yet re-checked.

      group.handleBlur();
      await group.waitForValidation();

      assertEquals(group.validating, false);
      assertEquals(group.schemaErrorMap, { a: "Required" });
    },
  );

  await t.step(
    "should normalize an empty-object schemaValidator result to null",
    async () => {
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "" },
        schemaValidator: () => ({}),
      });
      await group.waitForValidation();

      assertEquals(group.schemaErrorMap, null);
      assertEquals(group.invalid, false);
    },
  );

  await t.step(
    "should immediately settle to null when schemaValidator is unset, even mid-flight",
    () => {
      const group = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "" },
        validationDebounceMs: 50,
        schemaValidator: () => ({ a: "Required" }),
      });
      // Still inside the debounce window from construction.
      assertEquals(group.validating, true);

      group.schemaValidator = undefined;

      assertEquals(group.schemaErrorMap, null);
      assertEquals(group.validating, false);
    },
  );

  await t.step("should refresh schemaValidator via updateOptions", async () => {
    const group = new FieldApi<{ a: string }>(null, "", {
      initialValue: { a: "" },
    });
    await group.waitForValidation();
    assertEquals(group.schemaErrorMap, null);

    group.updateOptions({ schemaValidator: () => ({ a: "Required" }) });
    group.value = { a: "" }; // Fresh reference to trigger the newly-set validator.
    await group.waitForValidation();

    assertEquals(group.schemaErrorMap, { a: "Required" });
  });

  await t.step(
    "should not synchronously notify an already-subscribed parent when constructing a child field with a schemaValidator, but should still notify it on a microtask",
    async () => {
      const parent = new FieldApi<{ address: { line1: string } }>(
        null,
        "",
        { initialValue: { address: { line1: "" } } },
      );

      const callback = spy();
      parent.subscribe(callback);

      // Constructing this child schedules its schema-errors task, whose
      // `onPending` callback would (without the `#constructing` guard)
      // synchronously call `parent[kChildValidatingChanged](this, true)`,
      // notifying `parent`'s subscribers mid-construction: exactly the class
      // of React "update during render" warning `#constructing` exists to
      // prevent.
      parent.field("address", {
        schemaValidator: () => ({ line1: "Required" }),
      });

      assertSpyCalls(callback, 0);

      // The notification isn't dropped, only deferred: an already-mounted
      // subscriber (e.g. a submit button watching `parent.validating`) must
      // still learn about it, just not mid-render.
      await Promise.resolve(); // Flushes the microtask queue.
      assertSpyCalls(callback, 1);
    },
  );

  await t.step(
    "should defer, not drop, notifying an already-subscribed parent when a lazily-constructed child starts out invalid",
    async () => {
      const parent = new FieldApi<{ address: { line1: string } }>(
        null,
        "",
        { initialValue: { address: { line1: "" } } },
      );

      const callback = spy();
      parent.subscribe(callback);

      // `line1`'s validator fails immediately against its initial (empty)
      // value, flipping `parent.invalid` from `false` to `true` while this
      // child is still under construction.
      const child = parent.field("address.line1", {
        validators: [(f) => (f.value ? null : "Required")],
      });

      assertEquals(child.invalid, true);
      assertEquals(parent.invalid, true);
      assertSpyCalls(callback, 0);

      await Promise.resolve(); // Flushes the microtask queue.
      assertSpyCalls(callback, 1);
    },
  );

  await t.step(
    "should let a field have both its own schemaErrorMap and its own schemaError, independently",
    async () => {
      const form = new FieldApi<{ group: { a: string } }>(null, "", {
        initialValue: { group: { a: "" } },
        schemaValidator: () => ({ group: "Required" }),
      });
      const group = form.field("group", {
        schemaValidator: () => ({ a: "Nested required" }),
      });
      await form.waitForValidation();

      // `group`'s own schemaErrorMap, from its own schemaValidator.
      assertEquals(group.schemaErrorMap, { a: "Nested required" });
      // `group`'s own schemaError falls back to a lookup into *its* parent
      // (`form`)'s schemaErrorMap under its own name ("group"), independent
      // of the above, since group's own schemaValidator never produced a
      // "" entry (it only ever flagged "a"), so there's nothing of group's
      // own to prefer here.
      assertEquals(group.schemaError, "Required");
    },
  );

  await t.step(
    "should fall back to its own schemaErrorMap's \"\" entry when there's no parent slice",
    async () => {
      // At the root, there's no `parent` to assign a slice at all; this is
      // the only way a whole-form `.refine()`-style check (no `path`) can
      // ever surface through `schemaError`.
      const form = new FieldApi<{ a: string }>(null, "", {
        initialValue: { a: "" },
        schemaValidator: () => ({ "": "Passwords must match" }),
      });
      await form.waitForValidation();

      assertEquals(form.schemaError, "Passwords must match");
    },
  );

  await t.step(
    'should prefer its own "" entry over the parent\'s slice when both are set',
    async () => {
      const form = new FieldApi<{ group: { a: string } }>(null, "", {
        initialValue: { group: { a: "" } },
        schemaValidator: () => ({ group: "Required" }),
      });
      const group = form.field("group", {
        schemaValidator: () => ({ "": "Nested whole-group issue" }),
      });
      await form.waitForValidation();

      // group's own schemaValidator is a more specific source for group's
      // own value than form's, which only mentions "group" in passing.
      assertEquals(group.schemaError, "Nested whole-group issue");
    },
  );
});
