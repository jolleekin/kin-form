/**
 * Standard Schema (https://standardschema.dev) adapter for `@kin-form`.
 * @module
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type {
  DeepKeyOrRoot,
  SchemaValidator,
  ValidationError,
} from "@kin-form/core/index.ts";

/**
 * Converts a Standard Schema `Issue`'s `path` into `@kin-form`'s dot-joined
 * path convention (see `DeepKeyOrRoot`).
 *
 * For example, `[{ key: "items" }, 0, { key: "name" }]`
 * (or the equivalent plain `["items", 0, "name"]`) becomes `"items.0.name"`.
 *
 * An issue with no `path` (or an empty one) maps to `""` — this group's own
 * value as a whole, matching `DeepKeyOrRoot`'s `""` meaning "this node
 * itself" (e.g. a schema-level `.refine()`/cross-field check with no
 * specific field attached).
 */
function joinIssuePath(
  path: ReadonlyArray<PropertyKey | StandardSchemaV1.PathSegment> | undefined,
): string {
  if (!path || path.length === 0) return "";
  return path
    .map((segment) =>
      String(typeof segment === "object" ? segment.key : segment)
    )
    .join(".");
}

/**
 * Adapts any Standard-Schema-compliant validation library (zod v4+, valibot
 * v1+, arktype, ...) into a {@linkcode SchemaValidator}.
 *
 * Every issue's `path` becomes a key in the resulting map (see
 * {@linkcode joinIssuePath}); if two issues share the same path, the *last*
 * one wins.
 */
export function toSchemaValidator<TValue, TParentValue = never>(
  schema: StandardSchemaV1<TValue>,
): SchemaValidator<TValue, TParentValue> {
  return async (group) => {
    const { issues } = await schema["~standard"].validate(group.value);
    if (!issues) return null;

    const errors: Partial<Record<DeepKeyOrRoot<TValue>, ValidationError>> = {};
    for (const issue of issues) {
      errors[joinIssuePath(issue.path) as DeepKeyOrRoot<TValue>] =
        issue.message;
    }
    return errors;
  };
}
