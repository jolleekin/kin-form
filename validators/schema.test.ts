import { assertEquals } from "@std/assert";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { FieldApi } from "@kintools/form-core";
import { toSchemaValidator } from "./schema.ts";

function fakeObjectSchema<T>(
  validate: (
    value: unknown,
  ) =>
    | StandardSchemaV1.Result<T>
    | Promise<StandardSchemaV1.Result<T>>,
): StandardSchemaV1<T> {
  return {
    "~standard": {
      version: 1,
      vendor: "test",
      validate,
    },
  };
}

type Model = {
  address: { line1: string };
  answers: { value: string }[];
};

Deno.test("toSchemaValidator", async (t) => {
  await t.step("returns null on a success result (no issues)", async () => {
    const group = new FieldApi<Model>(null, "", {
      initialValue: { address: { line1: "1 Main St" }, answers: [] },
      schemaValidator: toSchemaValidator(
        fakeObjectSchema<Model>((value) => ({ value: value as Model })),
      ),
    });

    await group.waitForValidation();
    assertEquals(group.schemaErrorMap, null);
  });

  await t.step(
    "maps a single issue's path to a dot-joined key",
    async () => {
      const group = new FieldApi<Model>(null, "", {
        initialValue: { address: { line1: "" }, answers: [] },
        schemaValidator: toSchemaValidator(
          fakeObjectSchema<Model>(() => ({
            issues: [{ message: "Required", path: ["address", "line1"] }],
          })),
        ),
      });

      await group.waitForValidation();
      assertEquals(group.schemaErrorMap, { "address.line1": "Required" });
    },
  );

  await t.step(
    "maps a nested/array path given as raw PropertyKey segments",
    async () => {
      const group = new FieldApi<Model>(null, "", {
        initialValue: { address: { line1: "ok" }, answers: [{ value: "" }] },
        schemaValidator: toSchemaValidator(
          fakeObjectSchema<Model>(() => ({
            issues: [{ message: "Required", path: ["answers", 0, "value"] }],
          })),
        ),
      });

      await group.waitForValidation();
      assertEquals(group.schemaErrorMap, { "answers.0.value": "Required" });
    },
  );

  await t.step(
    "maps a nested/array path given as PathSegment objects",
    async () => {
      const group = new FieldApi<Model>(null, "", {
        initialValue: { address: { line1: "ok" }, answers: [{ value: "" }] },
        schemaValidator: toSchemaValidator(
          fakeObjectSchema<Model>(() => ({
            issues: [{
              message: "Required",
              path: [{ key: "answers" }, { key: 0 }, { key: "value" }],
            }],
          })),
        ),
      });

      await group.waitForValidation();
      assertEquals(group.schemaErrorMap, { "answers.0.value": "Required" });
    },
  );

  await t.step(
    'maps an issue with no path to the "" key (this group\'s own value as a whole)',
    async () => {
      const group = new FieldApi<Model>(null, "", {
        initialValue: { address: { line1: "ok" }, answers: [] },
        schemaValidator: toSchemaValidator(
          fakeObjectSchema<Model>(() => ({
            issues: [{ message: "At least one answer is required" }],
          })),
        ),
      });

      await group.waitForValidation();
      assertEquals(group.schemaErrorMap, {
        "": "At least one answer is required",
      });
    },
  );

  await t.step(
    "keeps the last issue's message when two issues share the same path",
    async () => {
      const group = new FieldApi<Model>(null, "", {
        initialValue: { address: { line1: "" }, answers: [] },
        schemaValidator: toSchemaValidator(
          fakeObjectSchema<Model>(() => ({
            issues: [
              { message: "Too short", path: ["address", "line1"] },
              { message: "Required", path: ["address", "line1"] },
            ],
          })),
        ),
      });

      await group.waitForValidation();
      assertEquals(group.schemaErrorMap, { "address.line1": "Required" });
    },
  );

  await t.step("supports a schema whose validate is asynchronous", async () => {
    const group = new FieldApi<Model>(null, "", {
      initialValue: { address: { line1: "" }, answers: [] },
      schemaValidator: toSchemaValidator(
        fakeObjectSchema<Model>(async () => {
          await Promise.resolve();
          return {
            issues: [{
              message: "Required (async)",
              path: ["address", "line1"],
            }],
          };
        }),
      ),
    });

    await group.waitForValidation();
    assertEquals(group.schemaErrorMap, { "address.line1": "Required (async)" });
  });
});
