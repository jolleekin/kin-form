# Changelog

## 0.1.5 - 2026-08-15

- Add a JSR `description` for the package listing.

## 0.1.4 - 2026-08-14

- Fixed `useWatch` (and by extension `Watch`/`useForm`) missing a
  `getServerSnapshot` argument to `useSyncExternalStore`, which made React log
  `Missing getServerSnapshot` and fall back to client-only rendering under
  Next.js SSR. `getSnapshot` already reads `api` synchronously with no
  browser-only API involved, so it now doubles as `getServerSnapshot` too.
- Renamed `Watch.tsx` to `Watch.ts`: the file has no actual JSX syntax (it only
  returns `ReactNode` via plain function calls), so the `.tsx` extension was
  unnecessary. JSR's npm-compatibility build was silently dropping this file
  from the published package (`Watch.js`/`Watch.d.ts` missing from
  `node_modules`, breaking `Watch` for any npm/Node consumer, e.g. Next.js),
  while the plain `.ts` files published fine. No behavioral change.

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
