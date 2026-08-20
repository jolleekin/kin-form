# Changelog

## 0.1.6 - 2026-08-20

- Renamed from `@kin-form/core` to `@kintools/form-core`. Now also published to
  npm.

## 0.1.5 - 2026-08-17

- Fix: setting `disabled` on a field that was already valid and not validating
  silently skipped notifying subscribers, since only `invalid`/`validating`
  changes triggered a notify. `useWatch`/`Watch` (and any other subscriber) now
  always sees a `disabled` change.

## 0.1.4 - 2026-08-15

- Add a JSR `description` for the package listing.
- Update the README to credit `@kin-form/lit` alongside `@kin-form/react`.

## 0.1.3 - 2026-08-14

- Fix: a field's `initialValue` now returns `undefined` instead of throwing when
  its baseline slot doesn't exist yet (e.g. a field registered under an array
  index pushed after the baseline was last moved).

## 0.1.2 - 2026-07-31

- Fix: `validators`, `asyncValidator`, and `schemaValidator` are documented as
  must-not-throw, but nothing enforced it. A throwing/rejecting one is now
  caught, treated as passing (no errors, for `schemaValidator`), and logged via
  `console.error` instead of breaking the rest of validation.
- Fix: corrected a stale doc comment that referenced `DeepKey` where it meant
  `LeafTypeMap`.
- Drop the `/index.ts` suffix from the package's own internal imports (added a
  `"."` export alongside `"./index.ts"`). No change to the public API.

## 0.1.1 - 2026-07-27

- Fix: `invalid`/`touched`/`validating` changes bubbling up from a
  still-constructing descendant field now notify on a microtask instead of being
  dropped, so an already-mounted subscriber (e.g. a submit button watching
  `invalid`) doesn't go stale.
- Comment cleanup, no behavioral change.

## 0.1.0 - Initial release
