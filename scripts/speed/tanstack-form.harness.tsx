/**
 * TanStack Form's speed-benchmark harness. Field updates are driven
 * programmatically via `form.setFieldValue`, not simulated keystrokes.
 *
 * TanStack Form's own React bindings carry an unusually heavy generic
 * signature (12+ type parameters, inferred from options at every call site).
 * Fighting that here would buy nothing: this is an internal measurement
 * script, not a public API surface, so `form`/`field` are treated as `any`
 * throughout rather than threading its generics through every helper.
 */

// deno-lint-ignore-file no-explicit-any require-await -- see module comment
// above for `any`; every SpeedHarness method is `async` uniformly, even
// where this library's path for a given scenario happens not to need an
// `await`.

import { memo } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import {
  ADDRESS_LEAF_KEYS,
  allLeafKeys,
  ARRAY_ITEM_COUNT,
  type ArrayItem,
  fieldKey,
  FLAT_FIELD_NAMES,
  itemFieldKeys,
  makeInitialValue,
  makeInsertedItem,
  type Metrics,
  UPDATE_BURST_SIZE,
} from "./scenario.ts";
import {
  makeAsyncValidate,
  syncValidate,
  wholeFormSchema,
} from "./validators.ts";
import {
  bump,
  type Counters,
  makeCounterMap,
  postMountRenders,
  resetCounters,
  sumPostMountRenders,
} from "./render-count.ts";
import type { SpeedHarness } from "./harness.ts";

function counterKeys(): string[] {
  return [...allLeafKeys(), "address", "address.geo", "submit"];
}

/** The array-mutation methods `mutateArray`/`insertRemoveArray` drive, surfaced out of the array-mode `FormField`'s render-prop `field` via a ref since those methods run outside React's render. */
type ItemsApi = {
  swap: (a: number, b: number) => void;
  insert: (index: number, item: ArrayItem) => void;
  remove: (index: number) => void;
};

function Leaf(
  { form, name, counters, countKey, validate, asyncValidate }: {
    form: any;
    name: string;
    counters: Counters;
    countKey: string;
    validate?: boolean;
    asyncValidate?: (value: string) => Promise<string | null>;
  },
) {
  const FormField = form.Field;
  const validators = asyncValidate
    ? {
      onChangeAsync: async ({ value }: { value: string }) =>
        (await asyncValidate(value)) ?? undefined,
      // Matches Kin Form's validationDebounceMs=50 for this same scenario;
      // TanStack's debounce is opt-in per event rather than one field-level
      // setting (see the readme's "Validators: when they run" section).
      onChangeAsyncDebounceMs: 50,
    }
    : validate
    ? {
      onChange: ({ value }: { value: string }) =>
        syncValidate(value) ?? undefined,
    }
    : undefined;
  return (
    <FormField name={name} validators={validators}>
      {(field: any) => {
        bump(counters, countKey);
        void field.state.meta.errors;
        return null;
      }}
    </FormField>
  );
}

function AddressGroup({ form, counters }: { form: any; counters: Counters }) {
  const FormField = form.Field;
  return (
    <FormField name="address">
      {(_field: any) => {
        bump(counters, "address");
        return (
          <>
            <Leaf
              form={form}
              name="address.line1"
              counters={counters}
              countKey="address.line1"
            />
            <Leaf
              form={form}
              name="address.line2"
              counters={counters}
              countKey="address.line2"
            />
            <GeoGroup form={form} counters={counters} />
          </>
        );
      }}
    </FormField>
  );
}

function GeoGroup({ form, counters }: { form: any; counters: Counters }) {
  const FormField = form.Field;
  return (
    <FormField name="address.geo">
      {(_field: any) => {
        bump(counters, "address.geo");
        return (
          <>
            <Leaf
              form={form}
              name="address.geo.lat"
              counters={counters}
              countKey="address.geo.lat"
            />
            <Leaf
              form={form}
              name="address.geo.lng"
              counters={counters}
              countKey="address.geo.lng"
            />
          </>
        );
      }}
    </FormField>
  );
}

function Items(
  { form, counters, apiRef }: {
    form: any;
    counters: Counters;
    apiRef: { current?: ItemsApi };
  },
) {
  const FormField = form.Field;
  return (
    <FormField name="items" mode="array">
      {(field: any) => {
        apiRef.current = {
          swap: field.swapValues,
          insert: field.insertValue,
          remove: field.removeValue,
        };
        // TanStack Form has no built-in per-item id (unlike Kin Form's
        // `field.id` or React Hook Form's `fields[i].id`); reading `.id`
        // off the current value itself is the realistic workaround, kept
        // consistent with the other three harnesses' keying strategy (see
        // scenario.ts's `ArrayItem.id` doc comment).
        return (
          <>
            {field.state.value.map((item: { id: string }, i: number) => {
              const [codeKey, qtyKey, noteKey] = itemFieldKeys(i);
              return (
                <Item
                  key={item.id}
                  form={form}
                  index={i}
                  counters={counters}
                  codeKey={codeKey}
                  qtyKey={qtyKey}
                  noteKey={noteKey}
                />
              );
            })}
          </>
        );
      }}
    </FormField>
  );
}

// Memoized so an unrelated item's props (index, and thus its field paths)
// being unchanged after a sibling swap actually skips re-invoking it;
// without this, the array-mode `FormField`'s render prop re-running
// (required to read the array's current length/order) would re-invoke every
// item regardless of whether *that* item's own data changed.
const Item = memo(function Item(
  { form, index, counters, codeKey, qtyKey, noteKey }: {
    form: any;
    index: number;
    counters: Counters;
    codeKey: string;
    qtyKey: string;
    noteKey: string;
  },
) {
  return (
    <div>
      <Leaf
        form={form}
        name={`items.${index}.code`}
        counters={counters}
        countKey={codeKey}
      />
      <Leaf
        form={form}
        name={`items.${index}.qty`}
        counters={counters}
        countKey={qtyKey}
      />
      <Leaf
        form={form}
        name={`items.${index}.note`}
        counters={counters}
        countKey={noteKey}
      />
    </div>
  );
});

function SubmitStatus({ form, counters }: { form: any; counters: Counters }) {
  const Subscribe = form.Subscribe;
  return (
    <Subscribe
      selector={(state: any) => [state.canSubmit, state.isDirty] as const}
    >
      {([canSubmit, isDirty]: readonly [boolean, boolean]) => {
        bump(counters, "submit");
        void canSubmit;
        void isDirty;
        return null;
      }}
    </Subscribe>
  );
}

function App(
  {
    formRef,
    counters,
    itemsApiRef,
    syncValidateAll,
    asyncDebounceTarget,
    useSchema,
  }: {
    formRef: { current?: any };
    counters: Counters;
    itemsApiRef: { current?: ItemsApi };
    syncValidateAll?: boolean;
    asyncDebounceTarget?: {
      key: string;
      validate: (v: string) => Promise<string | null>;
    };
    useSchema?: boolean;
  },
) {
  const form: any = useForm({
    defaultValues: makeInitialValue(),
    onSubmit: async () => {},
    validators: useSchema ? { onChange: wholeFormSchema } : undefined,
  });
  formRef.current = form;

  return (
    <>
      {FLAT_FIELD_NAMES.map((name) => {
        const key = fieldKey(name);
        const isDebounceTarget = asyncDebounceTarget?.key === key;
        return (
          <Leaf
            key={name}
            form={form}
            name={key}
            counters={counters}
            countKey={key}
            validate={syncValidateAll}
            asyncValidate={isDebounceTarget
              ? asyncDebounceTarget.validate
              : undefined}
          />
        );
      })}
      <AddressGroup form={form} counters={counters} />
      <Items form={form} counters={counters} apiRef={itemsApiRef} />
      <SubmitStatus form={form} counters={counters} />
    </>
  );
}

const TARGET_FLAT_KEY = fieldKey(FLAT_FIELD_NAMES[0]);

export const tanstackFormHarness: SpeedHarness = {
  name: "TanStack Form",

  async mount(): Promise<Metrics> {
    const formRef: { current?: any } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const start = performance.now();
    const { unmount } = render(
      <App formRef={formRef} counters={counters} itemsApiRef={itemsApiRef} />,
    );
    const wallMs = performance.now() - start;
    unmount();
    cleanup();
    return { wallMs };
  },

  async updateFlatField(): Promise<Metrics> {
    const formRef: { current?: any } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App formRef={formRef} counters={counters} itemsApiRef={itemsApiRef} />,
    );
    const form = formRef.current!;
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        form.setFieldValue(TARGET_FLAT_KEY, `v${i}`);
      }
    });
    const wallMs = performance.now() - start;

    const updatedRenders = postMountRenders(counters, TARGET_FLAT_KEY);
    const siblingRenders = sumPostMountRenders(
      counters,
      FLAT_FIELD_NAMES.map(fieldKey).filter((k) => k !== TARGET_FLAT_KEY),
    );
    const submitRenders = postMountRenders(counters, "submit");

    unmount();
    cleanup();
    return { wallMs, updatedRenders, siblingRenders, submitRenders };
  },

  async updateNestedField(): Promise<Metrics> {
    const formRef: { current?: any } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App formRef={formRef} counters={counters} itemsApiRef={itemsApiRef} />,
    );
    const form = formRef.current!;
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        form.setFieldValue("address.geo.lat", `v${i}`);
      }
    });
    const wallMs = performance.now() - start;

    const updatedRenders = postMountRenders(counters, "address.geo.lat");
    const siblingRenders = sumPostMountRenders(
      counters,
      ADDRESS_LEAF_KEYS.filter((k) => k !== "address.geo.lat"),
    );
    const groupRenders = postMountRenders(counters, "address") +
      postMountRenders(counters, "address.geo");

    unmount();
    cleanup();
    return { wallMs, updatedRenders, siblingRenders, groupRenders };
  },

  async mutateArray(): Promise<Metrics> {
    const formRef: { current?: any } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App formRef={formRef} counters={counters} itemsApiRef={itemsApiRef} />,
    );
    const items = itemsApiRef.current!;
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      // Cycles through adjacent pairs rather than swapping the same two
      // repeatedly; see the Kin Form harness's mutateArray for why.
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        const a = i % (ARRAY_ITEM_COUNT - 1);
        items.swap(a, a + 1);
      }
    });
    const wallMs = performance.now() - start;

    const itemRenders = sumPostMountRenders(
      counters,
      Array.from({ length: ARRAY_ITEM_COUNT }, (_, i) => i).flatMap(
        itemFieldKeys,
      ),
    );

    unmount();
    cleanup();
    return { wallMs, itemRenders };
  },

  async insertRemoveArray(): Promise<Metrics> {
    const formRef: { current?: any } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App formRef={formRef} counters={counters} itemsApiRef={itemsApiRef} />,
    );
    const items = itemsApiRef.current!;
    const mid = Math.floor(ARRAY_ITEM_COUNT / 2);
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      // Inserts at the front, then removes from the middle; see the Kin
      // Form harness's insertRemoveArray for why (avoids the same
      // batching-collapses-to-a-no-op trap as a fixed insert+remove index).
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        items.insert(0, makeInsertedItem(i));
        items.remove(mid);
      }
    });
    const wallMs = performance.now() - start;

    const itemRenders = sumPostMountRenders(
      counters,
      Array.from({ length: ARRAY_ITEM_COUNT }, (_, i) => i).flatMap(
        itemFieldKeys,
      ),
    );

    unmount();
    cleanup();
    return { wallMs, itemRenders };
  },

  async syncValidation(): Promise<Metrics> {
    const formRef: { current?: any } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App
        formRef={formRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
        syncValidateAll
      />,
    );
    const form = formRef.current!;
    resetCounters(counters);

    const start = performance.now();
    await act(async () => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        await form.setFieldValue(TARGET_FLAT_KEY, `v${i}`);
      }
    });
    const wallMs = performance.now() - start;

    const updatedRenders = postMountRenders(counters, TARGET_FLAT_KEY);
    const siblingRenders = sumPostMountRenders(
      counters,
      FLAT_FIELD_NAMES.map(fieldKey).filter((k) => k !== TARGET_FLAT_KEY),
    );

    unmount();
    cleanup();
    return { wallMs, updatedRenders, siblingRenders };
  },

  async asyncDebounce(): Promise<Metrics> {
    const formRef: { current?: any } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const async_ = makeAsyncValidate(5);
    const { unmount } = render(
      <App
        formRef={formRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
        asyncDebounceTarget={{
          key: TARGET_FLAT_KEY,
          validate: async_.validate,
        }}
      />,
    );
    const form = formRef.current!;

    const start = performance.now();
    await act(async () => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        form.setFieldValue(TARGET_FLAT_KEY, `v${i}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    const wallMs = async_.lastSettledAt() - start;

    unmount();
    cleanup();
    return { wallMs, validatorCalls: async_.callCount() };
  },

  async schemaValidation(): Promise<Metrics> {
    const formRef: { current?: any } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App
        formRef={formRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
        useSchema
      />,
    );
    const form = formRef.current!;
    resetCounters(counters);

    const start = performance.now();
    await act(async () => {
      await form.handleSubmit();
    });
    const wallMs = performance.now() - start;

    const fieldErrorRenders = sumPostMountRenders(
      counters,
      FLAT_FIELD_NAMES.map(fieldKey),
    );

    unmount();
    cleanup();
    return { wallMs, fieldErrorRenders };
  },
};
