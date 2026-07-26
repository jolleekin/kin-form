/**
 * Types used in `@kin-form`.
 * @module
 */

/**
 * Union of `Array<T>` and `T`.
 */
export type ArrayOr<T> = Array<T> | T;

/**
 * Union of `Promise<T>` and `T`.
 */
export type PromiseOr<T> = Promise<T> | T;

/** A function that derives a new value of `T` from the previous one. */
export type Updater<T> = (prev: T) => T;

/**
 * A field's settled validation state: a message string means invalid,
 * `null` means valid.
 */
export type ValidationError = string | null;

/**
 * What a {@linkcode Validator} may return — {@linkcode ValidationError}, plus
 * `false`/`undefined` as convenient falsy shorthands for "valid" (e.g. a
 * `condition && "message"` expression, or a validator with no `else` branch).
 *
 * Normalized down to {@linkcode ValidationError} before being stored as a
 * field's `error`.
 */
export type ValidatorResult = ValidationError | false | undefined;

/**
 * Registry of object types that {@linkcode NonemptyDeepKey} should treat as
 * opaque leaves instead of traversing into their properties.
 *
 * Consumers can add their own leaf types via declaration merging:
 * @example
 * ```ts
 * declare module "@kin-form/core" {
 *   interface LeafTypeMap {
 *     Money: Money;
 *     URL: URL;
 *   }
 * }
 * ```
 */
export interface LeafTypeMap {
  Date: Date;
  File: File;
}

// https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object/58436959#58436959
type PathJoin<A extends string, B extends string | number | never> = B extends
  never ? `${A}`
  : B extends "" ? `${A}`
  : `${A}.${B}`;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * The union of all non-empty paths of {@linkcode T} up to {@linkcode Depth}
 * levels deep — what `field()`/`useField()` and most other APIs accept for a
 * field name, since addressing "this node itself" (see
 * {@linkcode DeepKeyOrRoot}) doesn't make sense for them.
 *
 * {@linkcode Depth} defaults to, and is capped at, 9 for performance reasons.
 *
 * Object types registered in {@linkcode LeafTypeMap} (e.g. `Date`, `File`) are
 * treated as opaque leaves instead of being traversed into.
 *
 * @example
 * ```ts
 * interface User {
 *   name: string;
 *   age: number;
 *   address: {
 *     line1: string;
 *   };
 *   fields: {
 *     code: string;
 *     value: string | number;
 *   }[];
 * };
 *
 * function f(_p: DeepKey<User>) {}
 *
 * f("address.line1");
 * f("fields.1.code");
 * f(""); // Error.
 * f("fields."); // Error.
 * f("address..line1"); // Error
 * f("fields.a"); // Error.
 * f("fields.x"); // Error.
 * f("address.line3"); // Error.
 * ```
 */
export type DeepKey<
  T,
  Depth extends number = 9,
> = Depth extends never ? never
  : T extends LeafTypeMap[keyof LeafTypeMap] ? never
  : T extends ReadonlyArray<infer E>
    ? `${number}` | PathJoin<`${number}`, DeepKey<E, Prev[Depth]>>
  : T extends object ? {
      [K in keyof T]: K extends string
        ? `${K}` | PathJoin<K, DeepKey<T[K], Prev[Depth]>>
        : never;
    }[keyof T]
  : never;

/**
 * Union of `""` and {@linkcode DeepKey}.
 *
 * `""` means "this node itself" rather than a path *into* it — every
 * `FieldApi`'s array methods (`pushItem`, `insertItem`, `swapItems`,
 * `moveItem`, `removeItem`, `replaceItem`, all in `core/FieldApi.ts`)
 * take a `name: DeepKeyOrRoot<TValue>` precisely so they can either address a
 * named array field on this node (`group.pushItem("items", newItem)`) *or*
 * this node's own value, when the node itself already *is* the array
 * (`itemsGroup.pushItem("", newItem)`) — the latter is what lets a reusable
 * "array field" component stay generic over where it's mounted: it only
 * ever needs a `FieldApi<Item[]>`, not the dotted path leading to it.
 * See {@linkcode FieldApi.pushItem}'s example for both forms side by
 * side.
 */
export type DeepKeyOrRoot<T> = "" | DeepKey<T>;

/**
 * Infer the type of a deeply nested property within an object or an array.
 */
export type DeepValue<T, Key> = Key extends "" ? T
  : T extends object
    ? Key extends `${infer A}.${infer B}` ? DeepValue<DeepValue<T, A>, B>
    : Key extends keyof T ? T[Key]
    : T extends ReadonlyArray<unknown> ? T[Key & number]
    : never
  : never;
