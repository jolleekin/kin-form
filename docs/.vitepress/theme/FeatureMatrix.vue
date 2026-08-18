<script setup lang="ts">
import { computed } from 'vue';
import Tooltip from './Tooltip.vue';

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
      formik: 'Depends on <code>lodash</code>, <code>deepmerge</code>, <code>hoist-non-react-statics</code>, and more.',
      tanstack: '<code>form-core</code> depends on <code>@tanstack/store</code> for its reactivity model.',
    },
  },
  { label: 'Framework-agnostic core', kin: '✅', rhf: '❌', formik: '❌', tanstack: '✅' },
  {
    label: 'Type-safe nested field paths',
    kin: '✅', rhf: '⚠️', formik: '❌', tanstack: '✅',
    trimmed: true,
    notes: {
      rhf: '<code>Path&lt;T&gt;</code> checks literal names at the call site, but composing reusable components across generic parents needs <code>FieldPathByValue</code> casts.',
      formik: '<code>name</code> is a plain string — no compile-time path checking.',
    },
  },
  {
    label: 'Standard Schema support',
    kin: '⚠️', rhf: '⚠️', formik: '❌', tanstack: '✅',
    notes: {
      kin: 'Via <code>toSchemaValidator()</code> from <code>@kin-form/validators</code> package.',
      rhf: 'Via <code>standardSchemaResolver()</code> from <code>@hookform/resolvers</code> package.',
    },
  },
  {
    label: 'Nested groups/arrays as first-class nodes',
    kin: '✅', rhf: '⚠️', formik: '⚠️', tanstack: '⚠️',
    notes: {
      rhf: '<code>useFieldArray</code> manages array items with no distinct group node.',
      formik: '<code>FieldArray</code> manages array items with no distinct group node.',
      tanstack: '<code>FieldApi</code>/<code>FieldGroupApi</code> are proxies over a single shared store, not independently-stateful nodes.',
    },
  },
  {
    label: 'Selective re-rendering',
    kin: '✅', rhf: '⚠️', formik: '⚠️', tanstack: '✅',
    notes: {
      rhf: '<code>useWatch(name)</code> subscribes to a whole field path only',
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
      rhf: 'Possible via <code>watch()</code> + <code>trigger()</code>, but wired up by hand, not declared.',
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
          <td class="kin">
            <Tooltip :html="row.notes?.kin">{{ row.kin }}</Tooltip>
          </td>
          <td :class="{ na: row.rhf === '—' }">
            <Tooltip :html="row.notes?.rhf">{{ row.rhf }}</Tooltip>
          </td>
          <td :class="{ na: row.formik === '—' }">
            <Tooltip :html="row.notes?.formik">{{ row.formik }}</Tooltip>
          </td>
          <td :class="{ na: row.tanstack === '—' }">
            <Tooltip :html="row.notes?.tanstack">{{ row.tanstack }}</Tooltip>
          </td>
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
