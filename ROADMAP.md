# Roadmap

Where Kin Form is headed, and roughly in what order. This is the public summary;
day-to-day tracking happens in [TODO.md](./TODO.md) and the issue tracker.

Guiding principle: everything shipped either teaches a concept or builds trust.
The engine and API are the settled part; making them legible and trustworthy
from outside is the current work.

## In progress: trust and clarity

- Governance basics: `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, issue/PR
  templates (this file included)
- CI running on every push and pull request, not only on release tags
- Docs homepage rewritten to lead with why the library exists, not the
  feature/benchmark grid
- `llms.txt`, a sitemap, and standard meta tags on the docs site

## Next: teach and prove

- Honest, dedicated comparison pages against React Hook Form and TanStack Form
- A regular cadence of engineering articles about the underlying problems (forms
  as trees, stable identity, controlled vs. uncontrolled, API design you don't
  have to memorize), not product marketing
- Next.js/RSC, shadcn/ui, and MUI integration guides and examples
- An SSR guide
- Migration guides from React Hook Form and Formik
- Benchmarks reproduced in a real browser, not only in Happy DOM

## Later: scale

- Publishing to npm alongside JSR, once the above is real (see
  [TODO.md](./TODO.md) for why this is deliberately sequenced later)
- Additional framework bindings (Vue/Solid) on top of the already
  framework-agnostic `core`, once there's a real reason to, not to look active
- Expanding `@kin-form/validators` based on real issues filed, not speculative
  gaps

## Explicitly not a priority

- Chasing benchmark wins as the pitch
- Copying every competitor feature
- Spinning up new packages for their own sake
- Treating GitHub stars as a goal rather than a byproduct

Have an idea that isn't here? Open an issue with the "Feature request" template.
