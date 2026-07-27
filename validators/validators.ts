/**
 * Common validator factories for `@kin-form`.
 *
 * Every factory takes an optional trailing `message`, returned as the
 * `ValidationError` when the check fails. It defaults to the factory's own
 * name (`"required"`, `"minLength"`, `"maxLength"`, `"min"`, `"max"`,
 * `"url"`, `"email"`, `"pattern"`, `"maxFileSize"`, `"password"`) instead of
 * an English sentence, so the default doubles as a stable i18n lookup key
 * rather than display text:
 *
 * ```tsx
 * {field.invalid && field.touched && <span>{t(field.error)}</span>}
 * ```
 *
 * Pass an explicit `message` to skip localization and show literal text
 * instead, e.g. `required("This field is required")`.
 *
 * @module
 */

import type { Validator } from "@kin-form/core/index.ts";

// The same regex WHATWG specifies for `<input type="email">`, so validation
// here matches what a native email input would already accept.
// https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Flags a missing value: `null`/`undefined`, an all-whitespace string, or an
 * empty array.
 *
 * The format-specific validators below ({@linkcode url}, {@linkcode email},
 * {@linkcode pattern}) deliberately pass an empty value through instead of
 * also flagging it. Combine them with `required()` for a mandatory field,
 * or use them alone for a field that's optional but must be well-formed when
 * present.
 */
export function required<TValue, TParentValue = never>(
  message = "required",
): Validator<TValue, TParentValue> {
  return (f) => (isEmpty(f.value) ? message : null);
}

/**
 * Flags a value (string or array) shorter than {@linkcode min}.
 */
export function minLength<
  TValue extends { readonly length: number },
  TParentValue = never,
>(
  min: number,
  message = "minLength",
): Validator<TValue, TParentValue> {
  return (f) => (f.value.length >= min ? null : message);
}

/**
 * Flags a value (string or array) longer than {@linkcode max}.
 */
export function maxLength<
  TValue extends { readonly length: number },
  TParentValue = never,
>(
  max: number,
  message = "maxLength",
): Validator<TValue, TParentValue> {
  return (f) => (f.value.length <= max ? null : message);
}

/**
 * Flags a number smaller than {@linkcode min}.
 */
export function min<TParentValue = never>(
  min: number,
  message = "min",
): Validator<number, TParentValue> {
  return (f) => (f.value >= min ? null : message);
}

/**
 * Flags a number larger than {@linkcode max}.
 */
export function max<TParentValue = never>(
  max: number,
  message = "max",
): Validator<number, TParentValue> {
  return (f) => (f.value <= max ? null : message);
}

/**
 * Flags a non-empty string that isn't a valid URL (per the `URL`
 * constructor).
 */
export function url<TParentValue = never>(
  message = "url",
): Validator<string, TParentValue> {
  return (f) => {
    if (isEmpty(f.value)) return null;
    try {
      new URL(f.value);
      return null;
    } catch {
      return message;
    }
  };
}

/**
 * Flags a non-empty string that isn't a valid email address.
 */
export function email<TParentValue = never>(
  message = "email",
): Validator<string, TParentValue> {
  return (f) => (isEmpty(f.value) || EMAIL_RE.test(f.value) ? null : message);
}

/**
 * Flags a non-empty string that doesn't match {@linkcode regex}.
 */
export function pattern<TParentValue = never>(
  regex: RegExp,
  message = "pattern",
): Validator<string, TParentValue> {
  return (f) => (isEmpty(f.value) || regex.test(f.value) ? null : message);
}

/**
 * Flags a `File` larger than {@linkcode bytes}.
 *
 * Passes through a missing file; combine with {@linkcode required} to make
 * the upload mandatory.
 */
export function maxFileSize<TParentValue = never>(
  bytes: number,
  message = "maxFileSize",
): Validator<File | null | undefined, TParentValue> {
  return (f) => (!f.value || f.value.size <= bytes ? null : message);
}

/** Rules enabled for {@linkcode password}; a rule left `undefined` isn't checked. */
export interface PasswordOptions {
  /** Minimum string length. */
  minLength?: number;
  /** Maximum string length. */
  maxLength?: number;
  /** Require at least one digit (`0`-`9`). */
  digit?: boolean;
  /** Require at least one uppercase letter. */
  upper?: boolean;
  /** Require at least one lowercase letter. */
  lower?: boolean;
  /** Require at least one non-alphanumeric character. */
  symbol?: boolean;
}

/**
 * Flags a non-empty string that doesn't meet every rule enabled in
 * {@linkcode options} (length bounds, and/or containing a digit/uppercase/
 * lowercase/symbol character).
 *
 * Unlike the single-rule validators above, this reports one shared `message`
 * for any failing rule rather than identifying which one: pair it with a
 * requirements checklist in the UI (rendered from the same `options`)
 * rather than relying on `message` to explain what's missing.
 */
export function password<TParentValue = never>(
  options: PasswordOptions,
  message = "password",
): Validator<string, TParentValue> {
  const { minLength, maxLength, digit, upper, lower, symbol } = options;

  return (f) => {
    if (isEmpty(f.value)) return null;

    const value = f.value;
    if (minLength !== undefined && value.length < minLength) return message;
    if (maxLength !== undefined && value.length > maxLength) return message;
    if (digit && !/\d/.test(value)) return message;
    if (upper && !/[A-Z]/.test(value)) return message;
    if (lower && !/[a-z]/.test(value)) return message;
    if (symbol && !/[^a-zA-Z0-9]/.test(value)) return message;

    return null;
  };
}
