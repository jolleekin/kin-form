# Changelog

## 0.1.1 - 2026-07-27

- Fix: `invalid`/`touched`/`validating` changes bubbling up from a
  still-constructing descendant field now notify on a microtask instead of being
  dropped, so an already-mounted subscriber (e.g. a submit button watching
  `invalid`) doesn't go stale.
- Comment cleanup, no behavioral change.

## 0.1.0 - Initial release
