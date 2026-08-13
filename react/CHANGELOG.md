# Changelog

## 0.1.3 - 2026-08-13

- Rename `useWatch`/`Watch`'s "slice" terminology to "selected value" throughout
  their JSDoc, type parameter (`TSlice` to `TSelected`), and internal ref, since
  a selector can return any transformed/derived value, not just a subset of the
  original state shape. No behavioral change.

## 0.1.2 - 2026-07-31

- Drop the `/index.ts` suffix from internal imports of `@kin-form/core`. No
  behavioral change.

## 0.1.1 - 2026-07-27

- Fixed a code snippet in the README.
- Comment cleanup, no behavioral change.

## 0.1.0 - Initial release
