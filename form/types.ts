/**
 * This modules defines various types used in this packages.
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

export type Updater<T> = (prev: T) => T;

export type ValidationError = undefined | false | null | string;

/**
 * A helper type that joins two paths by a `'.'`.
 */
// https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object/58436959#58436959
export type PathJoin<A, B> = A extends string | number
  ? B extends string | number
    ? `${A}${B extends "" ? "" : "."}${B}`
    : never
  : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * The union of all paths of {@linkcode T} up to {@linkcode Depth} levels deep.
 * Properties of type {@linkcode Function} are not included.
 *
 * {@linkcode Depth} defaults to 5 and is limited to 9 for performance reasons.
 *
 * {@linkcode TObjectLeaf} specifies a union of object types that should be
 * treated as leaf types. It defaults to `Date | File`.
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
 * f("");
 * f("address.line1");
 * f("fields.1.code");
 * f("fields."); // Error.
 * f("address..line1"); // Error
 * f("fields.a"); // Error.
 * f("fields.x"); // Error.
 * f("address.line3"); // Error.
 * ```
 */
export type NonemptyDeepKey<
  T,
  Depth extends number = 5,
  TObjectLeaf = Date | File
> = Depth extends never
  ? never
  : T extends TObjectLeaf
  ? never
  : T extends ReadonlyArray<infer E>
  ? number | PathJoin<number, NonemptyDeepKey<E, Prev[Depth]>>
  : T extends object
  ? {
      [K in keyof T]: K extends string
        ? `${K}` | PathJoin<K, NonemptyDeepKey<T[K], Prev[Depth]>>
        : never;
    }[keyof T]
  : never;

/**
 * Union of `""` and {@linkcode NonemptyDeepKey}.
 *
 * The empty key is needed to support array operations with flattened keys.
 */
export type DeepKey<T, Depth extends number = 5, TObjectLeaf = Date | File> =
  | ""
  | NonemptyDeepKey<T, Depth, TObjectLeaf>;

/**
 * Infer the type of a deeply nested property within an object or an array.
 */
export type DeepValue<T, Key> = Key extends ""
  ? T
  : T extends object
  ? Key extends `${infer A}.${infer B}`
    ? DeepValue<DeepValue<T, A>, B>
    : Key extends keyof T
    ? T[Key]
    : T extends ReadonlyArray<unknown>
    ? T[Key & number]
    : never
  : never;
