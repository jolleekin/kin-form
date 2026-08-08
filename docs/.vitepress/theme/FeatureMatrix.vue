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
      kin: 'Via toSchemaValidator() from @kin-form/validators package.',
      rhf: 'Via standardSchemaResolver() from @hookform/resolvers package.',
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
    kin: '✅', rhf: '⚠️', formik: '⚠️', tanstack: '✅',
    notes: {
      rhf: 'useWatch(name) subscribes to a whole field path only',
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
  <div class="feature-matrix">
    <table class="matrix-table">
      <thead>
        <tr>
          <th>Features</th>
          <th class="kin">Kin Form</th>
          <th>React Hook Form</th>
          <th>Formik</th>
          <th>TanStack Form</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in visibleRows" :key="row.label">
          <td>{{ row.label }}</td>
          <td class="kin" :class="{ noted: !!row.notes?.kin }" :title="row.notes?.kin">{{ row.kin }}</td>
          <td :class="{ na: row.rhf === '—', noted: !!row.notes?.rhf }" :title="row.notes?.rhf">{{ row.rhf }}</td>
          <td :class="{ na: row.formik === '—', noted: !!row.notes?.formik }" :title="row.notes?.formik">{{ row.formik }}</td>
          <td :class="{ na: row.tanstack === '—', noted: !!row.notes?.tanstack }" :title="row.notes?.tanstack">{{ row.tanstack }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="feature-matrix-legend">✅ full support · ⚠️ partial or conditional · ❌ not supported</p>
</template>

<style scoped>
.feature-matrix {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.5;
  background-color: white;
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

.feature-matrix-legend {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
}
</style>
