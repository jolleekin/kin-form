# Changelog

## 0.1.2 - 2026-07-31

- Fix: `validators`, `asyncValidator`, and `schemaValidator` are documented as
  must-not-throw, but nothing enforced it. A throwing/rejecting one is now
  caught, treated as passing (no errors, for `schemaValidator`), and logged
  via `console.error` instead of breaking the rest of validation.
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
