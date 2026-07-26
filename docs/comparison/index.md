# Overview

## Feature matrix

<FeatureMatrix :full="true" />

## Bundle size (React usage)

<BundleSizeChart />

Every library above is measured directly with the same toolchain — rolldown and
its own built-in minifier, then gzip. That's not the same as Bundlephobia, which
minifies with terser by default and can produce different sizes for the same
source. Reproducible via `deno task --cwd scripts bundle-size`.

## Performance

<PerformanceCharts />

These are wall-clock numbers from one shared ~84-field form (flat fields, a
nested group, an array) in a real (Happy DOM) React tree, reproducible via
`deno task --cwd scripts speed-bench`.

The benchmark also counts re-renders per scenario — how many untouched sibling
fields re-render when one field updates, charted above for the two scenarios
where that count is clean and isolated.

## Detailed comparisons

- [vs React Hook Form](/comparison/react-hook-form)
