/**
 * React Hook Form's speed-benchmark harness. Measured via `Controller`/
 * `useController` throughout (never idiomatic `register()`), so RHF is on
 * the same controlled-input basis as the other three libraries — see the
 * "RHF fairness" decision in the benchmark plan. Field updates are driven
 * programmatically via `methods.setValue`, not simulated keystrokes.
 */

// deno-lint-ignore-file require-await -- every SpeedHarness method is
// `async` uniformly, even where this library's path for a given scenario
// happens not to need an `await`.

import { memo } from "react";
import { act, cleanup, render } from "@testing-library/react";
import {
  type Control,
  type Resolver,
  useController,
  useFieldArray,
  useForm,
  type UseFormReturn,
  useFormState,
} from "react-hook-form";
import {
  ADDRESS_LEAF_KEYS,
  allLeafKeys,
  ARRAY_ITEM_COUNT,
  type ArrayItem,
  fieldKey,
  FLAT_FIELD_NAMES,
  type FormValue,
  itemFieldKeys,
  makeInitialValue,
  makeInsertedItem,
  type Metrics,
  UPDATE_BURST_SIZE,
} from "./scenario.ts";
import {
  debounce,
  issuesToNestedErrors,
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
  return [...allLeafKeys(), "submit"];
}

/** The array-mutation methods `mutateArray`/`insertRemoveArray` drive, surfaced out of `useFieldArray` via a ref since those methods run outside React's render. */
type ItemsApi = {
  swap: (a: number, b: number) => void;
  insert: (index: number, item: ArrayItem) => void;
  remove: (index: number) => void;
};

function Leaf(
  { control, name, counters, countKey, validate, asyncValidate }: {
    control: Control<FormValue>;
    name: string;
    counters: Counters;
    countKey: string;
    validate?: boolean;
    asyncValidate?: (value: string) => Promise<string | null>;
  },
) {
  bump(counters, countKey);
  const { fieldState } = useController({
    control,
    name: name as never,
    rules: asyncValidate
      ? { validate: async (v: string) => (await asyncValidate(v)) ?? true }
      : validate
      ? { validate: (v: string) => syncValidate(v) ?? true }
      : undefined,
  });
  // Reading `.error` (even unused) is what registers RHF's proxy-based
  // subscription to this field's error state — without it, error-only
  // changes wouldn't re-render this component at all.
  void fieldState.error;
  return null;
}

function ItemsController(
  { control, counters, apiRef }: {
    control: Control<FormValue>;
    counters: Counters;
    apiRef: { current?: ItemsApi };
  },
) {
  // `keyName: "rhfKey"` moves React Hook Form's own auto-generated id off
  // the default `id` key, so it doesn't clobber our data's own `id` field —
  // `fields[i].id` below is ours, kept consistent with the other three
  // harnesses' keying strategy (see scenario.ts's `ArrayItem.id` doc comment).
  const { fields, swap, insert, remove } = useFieldArray({
    control,
    name: "items" as never,
    keyName: "rhfKey",
  });
  apiRef.current = {
    swap,
    insert: (index, item) => insert(index, item as never),
    remove,
  };
  return (
    <>
      {fields.map((field, i) => {
        const [codeKey, qtyKey, noteKey] = itemFieldKeys(i);
        return (
          <Item
            key={(field as unknown as { id: string }).id}
            control={control}
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
}

// Memoized so an unrelated item's props (index, and thus its field paths)
// being unchanged after a sibling swap actually skips re-invoking it —
// without this, `ItemsController` re-rendering (required to read the
// array's current length/order) would re-invoke every item regardless of
// whether *that* item's own data changed.
const Item = memo(function Item(
  { control, index, counters, codeKey, qtyKey, noteKey }: {
    control: Control<FormValue>;
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
        control={control}
        name={`items.${index}.code`}
        counters={counters}
        countKey={codeKey}
      />
      <Leaf
        control={control}
        name={`items.${index}.qty`}
        counters={counters}
        countKey={qtyKey}
      />
      <Leaf
        control={control}
        name={`items.${index}.note`}
        counters={counters}
        countKey={noteKey}
      />
    </div>
  );
});

function SubmitStatus(
  { control, counters }: { control: Control<FormValue>; counters: Counters },
) {
  bump(counters, "submit");
  const { isDirty } = useFormState({ control });
  void isDirty;
  return null;
}

function App(
  {
    formRef,
    counters,
    itemsApiRef,
    syncValidateAll,
    asyncDebounceTarget,
    resolver,
  }: {
    formRef: { current?: UseFormReturn<FormValue> };
    counters: Counters;
    itemsApiRef: { current?: ItemsApi };
    syncValidateAll?: boolean;
    asyncDebounceTarget?: {
      key: string;
      validate: (v: string) => Promise<string | null>;
    };
    resolver?: Resolver<FormValue>;
  },
) {
  const methods = useForm<FormValue>({
    defaultValues: makeInitialValue() as never,
    mode: "onChange",
    resolver,
  });
  formRef.current = methods;
  const { control } = methods;

  return (
    <>
      {FLAT_FIELD_NAMES.map((name) => {
        const key = fieldKey(name);
        const isDebounceTarget = asyncDebounceTarget?.key === key;
        return (
          <Leaf
            key={name}
            control={control}
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
      {ADDRESS_LEAF_KEYS.map((key) => (
        <Leaf
          key={key}
          control={control}
          name={key}
          counters={counters}
          countKey={key}
        />
      ))}
      <ItemsController
        control={control}
        counters={counters}
        apiRef={itemsApiRef}
      />
      <SubmitStatus control={control} counters={counters} />
    </>
  );
}

const TARGET_FLAT_KEY = fieldKey(FLAT_FIELD_NAMES[0]);

const rhfResolver: Resolver<FormValue> = async (values) => {
  const result = wholeFormSchema.safeParse(values);
  if (result.success) return { values: result.data as never, errors: {} };
  const errors = issuesToNestedErrors(
    result.error.issues,
    (message) => ({ type: "custom", message }),
  );
  return { values: {}, errors: errors as never };
};

export const reactHookFormHarness: SpeedHarness = {
  name: "React Hook Form",

  async mount(): Promise<Metrics> {
    const formRef: { current?: UseFormReturn<FormValue> } = {};
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
    const formRef: { current?: UseFormReturn<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App formRef={formRef} counters={counters} itemsApiRef={itemsApiRef} />,
    );
    const methods = formRef.current!;
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        methods.setValue(TARGET_FLAT_KEY as never, `v${i}` as never, {
          shouldDirty: true,
        });
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
    const formRef: { current?: UseFormReturn<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App formRef={formRef} counters={counters} itemsApiRef={itemsApiRef} />,
    );
    const methods = formRef.current!;
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        methods.setValue("address.geo.lat" as never, `v${i}` as never, {
          shouldDirty: true,
        });
      }
    });
    const wallMs = performance.now() - start;

    const updatedRenders = postMountRenders(counters, "address.geo.lat");
    const siblingRenders = sumPostMountRenders(
      counters,
      ADDRESS_LEAF_KEYS.filter((k) => k !== "address.geo.lat"),
    );
    // React Hook Form has no addressable group node for "address" — see the
    // plan's note on this structural asymmetry. No `groupRenders` reported.

    unmount();
    cleanup();
    return { wallMs, updatedRenders, siblingRenders };
  },

  async mutateArray(): Promise<Metrics> {
    const formRef: { current?: UseFormReturn<FormValue> } = {};
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
      // repeatedly — see the Kin Form harness's mutateArray for why.
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
    const formRef: { current?: UseFormReturn<FormValue> } = {};
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
      // Inserts at the front, then removes from the middle — see the Kin
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
    const formRef: { current?: UseFormReturn<FormValue> } = {};
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
    const methods = formRef.current!;
    resetCounters(counters);

    const start = performance.now();
    await act(async () => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        await methods.setValue(TARGET_FLAT_KEY as never, `v${i}` as never, {
          shouldValidate: true,
        });
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
    const formRef: { current?: UseFormReturn<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const async_ = makeAsyncValidate(5);
    // React Hook Form has no built-in per-field debounce (see the feature
    // matrix's "Built-in async-validation debounce" row) — hand-rolled here
    // the same way a real app would (see docs/comparison/react-hook-form.md's
    // lodash/debounce example), so this reports the realistic cost of
    // reaching parity rather than the (uninteresting) undebounced number.
    const debouncedValidate = debounce(async_.validate, 50);
    const { unmount } = render(
      <App
        formRef={formRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
        asyncDebounceTarget={{
          key: TARGET_FLAT_KEY,
          validate: debouncedValidate,
        }}
      />,
    );
    const methods = formRef.current!;

    const start = performance.now();
    await act(async () => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        methods.setValue(TARGET_FLAT_KEY as never, `v${i}` as never, {
          shouldValidate: true,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    const wallMs = async_.lastSettledAt() - start;

    unmount();
    cleanup();
    return { wallMs, validatorCalls: async_.callCount() };
  },

  async schemaValidation(): Promise<Metrics> {
    const formRef: { current?: UseFormReturn<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App
        formRef={formRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
        resolver={rhfResolver}
      />,
    );
    const methods = formRef.current!;
    resetCounters(counters);

    const start = performance.now();
    await act(async () => {
      await methods.handleSubmit(() => {})();
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
