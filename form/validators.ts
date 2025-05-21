/**
 * This module defines common field validators.
 * @module
 */

import type { Validator } from "./form-field.ts";
import { isNullOrEmpty } from "./utils/misc.ts";

const emailRE =
  /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

/**
 * Creates an `email` validator. `null` or empty value is ignored.
 */
export function email(msg: string): Validator<string> {
  return ({ value }) =>
    isNullOrEmpty(value) || emailRE.test(value) ? null : msg;
}

/**
 * Creates a `maxFileSize` validator. Non-file value is ignored.
 */
export function maxFileSize<TValue extends File | null>(
  size: number,
  msg: string
): Validator<TValue> {
  return ({ value }) =>
    value instanceof File && value.size > size ? msg : null;
}

/**
 * Creates a `max` validator.
 *
 * A value is considered valid if it's `null` or <= {@linkcode limit}.
 */
export function max<TValue>(
  limit: Exclude<TValue, null>,
  msg: string
): Validator<TValue> {
  return ({ value }) => (value == null || value <= limit ? null : msg);
}

/**
 * Creates a `maxLength` validator. `null` or empty value is ignored.
 */
export function maxLength<TValue extends string | []>(
  length: number,
  msg: string
): Validator<TValue> {
  return ({ value }) =>
    isNullOrEmpty(value) || value.length <= length ? null : msg;
}

/**
 * Creates a `min` validator.
 *
 * A value is considered valid if it's `null` or >= {@linkcode limit}.
 */
export function min<TValue>(
  limit: Exclude<TValue, null>,
  msg: string
): Validator<TValue> {
  return ({ value }) => (value == null || value >= limit ? null : msg);
}

/**
 * Creates a `minLength` validator. `null` or empty value is ignored.
 */
export function minLength<TValue extends string | []>(
  length: number,
  msg: string
): Validator<TValue> {
  return ({ value }) =>
    isNullOrEmpty(value) || value.length >= length ? null : msg;
}

/**
 * Creates a `required` validator.
 */
export function required<TValue>(msg: string): Validator<TValue> {
  return ({ value }) => (isNullOrEmpty(value) ? msg : null);
}
