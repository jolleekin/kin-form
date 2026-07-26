<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ full?: boolean }>(), { full: false });

type Notes = Partial<Record<'kin' | 'rhf' | 'formik' | 'tanstack', string>>;

const rows: Array<{
  label: string;
  kin: string;
  rhf: string;
  formik: string;
  tanstack: string;
  trimmed?: boolean;
  notes?: Notes;
}> = [
  {
    label: 'Zero dependencies',
    kin: '✅', rhf: '✅', formik: '❌', tanstack: '⚠️',
    trimmed: true,
    notes: {
      formik: 'Depends on lodash, deepmerge, hoist-non-react-statics, and more.',
      tanstack: 'form-core depends on @tanstack/store for its reactivity model.',
    },
  },
  { label: 'Framework-agnostic core', kin: '✅', rhf: '❌', formik: '❌', tanstack: '✅' },
  {
    label: 'Type-safe nested field paths',
    kin: '✅', rhf: '✅', formik: '❌', tanstack: '✅',
    trimmed: true,
    notes: {
      formik: '`name` is a plain string — no compile-time path checking.',
    },
  },
  {
    label: 'Standard Schema support',
    kin: '⚠️', rhf: '⚠️', formik: '❌', tanstack: '✅',
    notes: {
      kin: 'Via toSchemaValidator() from the separate @kin-form/validators package — a generic ~15-line adapter, not a per-schema-library one.',
      rhf: 'Via standardSchemaResolver() from the separate @hookform/resolvers package.',
    },
  },
  {
    label: 'Nested groups/arrays as first-class nodes',
    kin: '✅', rhf: '⚠️', formik: '⚠️', tanstack: '✅',
    notes: {
      rhf: 'useFieldArray manages array items with no distinct group node.',
      formik: 'FieldArray manages array items with no distinct group node.',
    },
  },
  {
    label: 'Selective re-rendering',
    kin: '✅', rhf: '✅', formik: '⚠️', tanstack: '✅',
    notes: {
      formik: 'Field-level optimization exists, but the default context re-renders more broadly.',
    },
  },
  {
    label: 'Built-in async-validation debounce',
    kin: '✅', rhf: '❌', formik: '❌', tanstack: '✅',
    trimmed: true,
  },
  {
    label: 'Declarative cross-field revalidation',
    kin: '✅', rhf: '⚠️', formik: '❌', tanstack: '✅',
    notes: {
      rhf: 'Possible via watch() + trigger(), but wired up by hand, not declared.',
    },
  },
];

const visibleRows = computed(() =>
  props.full ? rows : rows.filter((r) => r.trimmed),
);
</script>

<template>
  <section class="feature-matrix" :class="{ 'is-full': full }">
    <div class="feature-matrix-inner">
      <h2 v-if="!full" class="feature-matrix-heading">How it compares</h2>
      <div class="matrix-wrapper">
        <table class="matrix-table">
          <thead>
            <tr>
              <th></th>
              <th class="kin">Kin Form</th>
              <th>React Hook Form</th>
              <th>Formik</th>
              <th>TanStack Form</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visibleRows" :key="row.label">
              <td>
                <a v-if="!full" href="/comparison/" class="row-link">{{ row.label }}</a>
                <template v-else>{{ row.label }}</template>
              </td>
              <td v-if="row.kin === 'bundle'" class="kin">
                <div class="size-grid">
                  <span class="size-line">4.7 KB</span><span class="size-label">core + react</span>
                </div>
              </td>
              <td v-else class="kin" :class="{ noted: !!row.notes?.kin }" :title="row.notes?.kin">{{ row.kin }}</td>
              <td :class="{ na: row.rhf === '—', noted: !!row.notes?.rhf }" :title="row.notes?.rhf">{{ row.rhf }}</td>
              <td :class="{ na: row.formik === '—', noted: !!row.notes?.formik }" :title="row.notes?.formik">{{ row.formik }}</td>
              <td :class="{ na: row.tanstack === '—', noted: !!row.notes?.tanstack }" :title="row.notes?.tanstack">{{ row.tanstack }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="feature-matrix-legend">✅ full support · ⚠️ partial or conditional · ❌ not supported</p>
    </div>
  </section>
</template>

<style scoped>
.feature-matrix {
  padding: 0 24px;
}

.feature-matrix.is-full {
  padding: 0;
}

.feature-matrix-inner {
  max-width: 740px;
  margin: 0 auto;
}

.feature-matrix.is-full .feature-matrix-inner {
  max-width: 100%;
}

.feature-matrix-heading {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24px;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.matrix-wrapper {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.5;
}

.matrix-table th,
.matrix-table td {
  padding: 9px 16px;
  text-align: center;
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.matrix-table th:first-child,
.matrix-table td:first-child {
  text-align: left;
  white-space: normal;
  color: var(--vp-c-text-2);
}

.matrix-table thead th {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  border-bottom: 2px solid var(--vp-c-divider);
  padding-bottom: 10px;
}

.matrix-table th.kin,
.matrix-table td.kin {
  color: var(--vp-c-brand-3);
  font-weight: 700;
}

.matrix-table tbody tr:last-child td {
  border-bottom: none;
}

.na {
  color: var(--vp-c-text-3);
}

.noted {
  cursor: help;
}

.row-link {
  color: inherit;
  text-decoration: none;
}

.row-link:hover {
  color: var(--vp-c-brand-3);
  text-decoration: underline;
}

.size-grid {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0 8px;
}

.size-line {
  text-align: right;
  line-height: 20px;
}

.size-label {
  font-size: 12px;
  font-weight: 400;
  color: var(--vp-c-text-2);
  line-height: 20px;
  text-align: left;
}

.feature-matrix-legend {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
