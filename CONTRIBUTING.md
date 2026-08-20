# Contributing

Kin Form is a [Deno](https://deno.com) workspace; there's no separate build step
for development. You'll need Deno installed
([deno.land/manual/getting_started/installation](https://docs.deno.com/runtime/getting_started/installation/)).

```sh
git config core.hooksPath .git-hooks   # enables the pre-commit fmt/lint/test hook
```

## Project layout

- `core/` (`@kintools/form-core`), the framework-agnostic form engine
- `react/` (`@kintools/form-react`), React bindings
- `devtools-react/` (`@kintools/form-devtools-react`), a dev-only inspector
  panel
- `validators/` (`@kintools/form-validators`), common validator factories
- `docs/`, the VitePress documentation site
- `examples/react/`, a runnable example app

See [CLAUDE.md](./CLAUDE.md) for the full architecture writeup.

## Running things

From the repo root:

```sh
# Run all tests in a package
deno test core/

# Run a single test file
deno test core/FieldApi.test.ts

# Run a single test/step by name
deno test core/FieldApi.test.ts --filter "should update value"

# react/ tests need --allow-env (a "test" task wraps this)
deno task --cwd react test

# Type-check
deno check core/index.ts
deno check react/index.ts

# Lint / format
deno lint
deno fmt --check
```

`deno fmt --check`, `deno lint`, and
`deno test -A core react devtools-react
validators` are what CI runs on every
push and pull request; the pre-commit hook runs the same checks (skipping the
test run unless the commit touches `core/`, `react/`, `devtools-react/`, or
`validators/`) and will block a commit that fails them.

## Making a change

1. Open an issue first for anything beyond a small fix, so the approach can be
   discussed before you invest time in it.
2. Keep the change scoped: a bug fix shouldn't carry unrelated refactors.
3. Add or update tests alongside the change. Every existing module has a
   companion `*.test.ts`/`*.test.tsx` file; new modules should too.
4. Follow the conventions in [CLAUDE.md](./CLAUDE.md) (member ordering, comment
   style, doc-comment phrasing).
5. If the change is user-facing, add an entry to the affected package's
   `CHANGELOG.md`.

## Pull requests

- Reference the issue it addresses, if any.
- CI (lint + test) must pass before a PR is merged.
- Small, focused PRs are easier to review than large ones; feel free to split a
  bigger change into a stacked series.

## Reporting bugs / requesting features

Use the issue templates. For security issues, see [SECURITY.md](./SECURITY.md)
instead of opening a public issue.
