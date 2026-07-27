/**
 * Formik's speed-benchmark harness. Field updates are driven programmatically
 * via `formik.setFieldValue`, not simulated keystrokes.
 */

// deno-lint-ignore-file require-await -- every SpeedHarness method is
// `async` uniformly, even where this library's path for a given scenario
// happens not to need an `await`.

import { memo } from "react";
import { act, cleanup, render } from "@testing-library/react";
import {
  FieldArray,
  FormikProvider,
  useField,
  useFormik,
  useFormikContext,
} from "formik";
import type { FormikProps } from "formik";
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

/** The array-mutation methods `mutateArray`/`insertRemoveArray` drive, surfaced out of `FieldArray`'s render-prop `helpers` via a ref since those methods run outside React's render. */
type ItemsApi = {
  swap: (a: number, b: number) => void;
  insert: (index: number, item: ArrayItem) => void;
  remove: (index: number) => void;
};

function Leaf(
  { name, counters, countKey, validate, asyncValidate }: {
    name: string;
    counters: Counters;
    countKey: string;
    validate?: boolean;
    asyncValidate?: (value: string) => Promise<string | null>;
  },
) {
  bump(counters, countKey);
  const [, meta] = useField<string>({
    name,
    validate: asyncValidate
      ? async (v: string) => (await asyncValidate(v)) ?? undefined
      : validate
      ? (v: string) => syncValidate(v) ?? undefined
      : undefined,
  });
  void meta.error;
  return null;
}

function ItemsArray(
  { counters, apiRef }: {
    counters: Counters;
    apiRef: { current?: ItemsApi };
  },
) {
  return (
    <FieldArray name="items">
      {(helpers) => {
        apiRef.current = {
          swap: helpers.swap,
          insert: (index, item) => helpers.insert(index, item),
          remove: helpers.remove,
        };
        // Formik has no built-in per-item id (unlike Kin Form's `field.id` or
        // React Hook Form's `fields[i].id`); reading `.id` off the current
        // value itself is the realistic workaround, kept consistent with the
        // other three harnesses' keying strategy (see scenario.ts's
        // `ArrayItem.id` doc comment).
        const items = helpers.form.values.items as FormValue["items"];
        return (
          <>
            {items.map((item, i) => {
              const [codeKey, qtyKey, noteKey] = itemFieldKeys(i);
              return (
                <Item
                  key={item.id}
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
    </FieldArray>
  );
}

// Memoized so an unrelated item's props (index, and thus its field paths)
// being unchanged after a sibling swap actually skips re-invoking it;
// without this, `ItemsArray`'s render-prop re-running (required to read the
// array's current length/order) would re-invoke every item regardless of
// whether *that* item's own data changed.
const Item = memo(function Item(
  { index, counters, codeKey, qtyKey, noteKey }: {
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
        name={`items.${index}.code`}
        counters={counters}
        countKey={codeKey}
      />
      <Leaf
        name={`items.${index}.qty`}
        counters={counters}
        countKey={qtyKey}
      />
      <Leaf
        name={`items.${index}.note`}
        counters={counters}
        countKey={noteKey}
      />
    </div>
  );
});

function SubmitStatus({ counters }: { counters: Counters }) {
  bump(counters, "submit");
  const { dirty, isValid } = useFormikContext<FormValue>();
  void dirty;
  void isValid;
  return null;
}

function App(
  {
    formikRef,
    counters,
    itemsApiRef,
    syncValidateAll,
    asyncDebounceTarget,
    useSchema,
  }: {
    formikRef: { current?: FormikProps<FormValue> };
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
  const formik = useFormik<FormValue>({
    initialValues: makeInitialValue(),
    validate: useSchema
      ? (values) => {
        const result = wholeFormSchema.safeParse(values);
        return result.success
          ? {}
          : issuesToNestedErrors(result.error.issues, (m) => m);
      }
      : undefined,
    onSubmit: () => {},
  });
  formikRef.current = formik;

  return (
    <FormikProvider value={formik}>
      {FLAT_FIELD_NAMES.map((name) => {
        const key = fieldKey(name);
        const isDebounceTarget = asyncDebounceTarget?.key === key;
        return (
          <Leaf
            key={name}
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
        <Leaf key={key} name={key} counters={counters} countKey={key} />
      ))}
      <ItemsArray counters={counters} apiRef={itemsApiRef} />
      <SubmitStatus counters={counters} />
    </FormikProvider>
  );
}

const TARGET_FLAT_KEY = fieldKey(FLAT_FIELD_NAMES[0]);

export const formikHarness: SpeedHarness = {
  name: "Formik",

  async mount(): Promise<Metrics> {
    const formikRef: { current?: FormikProps<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const start = performance.now();
    const { unmount } = render(
      <App
        formikRef={formikRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
      />,
    );
    const wallMs = performance.now() - start;
    unmount();
    cleanup();
    return { wallMs };
  },

  async updateFlatField(): Promise<Metrics> {
    const formikRef: { current?: FormikProps<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App
        formikRef={formikRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
      />,
    );
    const formik = formikRef.current!;
    resetCounters(counters);

    const start = performance.now();
    await act(async () => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        await formik.setFieldValue(TARGET_FLAT_KEY, `v${i}`, false);
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
    const formikRef: { current?: FormikProps<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App
        formikRef={formikRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
      />,
    );
    const formik = formikRef.current!;
    resetCounters(counters);

    const start = performance.now();
    await act(async () => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        await formik.setFieldValue("address.geo.lat", `v${i}`, false);
      }
    });
    const wallMs = performance.now() - start;

    const updatedRenders = postMountRenders(counters, "address.geo.lat");
    const siblingRenders = sumPostMountRenders(
      counters,
      ADDRESS_LEAF_KEYS.filter((k) => k !== "address.geo.lat"),
    );
    // Formik has no addressable group node for "address" either, same
    // asymmetry noted for React Hook Form. No `groupRenders` reported.

    unmount();
    cleanup();
    return { wallMs, updatedRenders, siblingRenders };
  },

  async mutateArray(): Promise<Metrics> {
    const formikRef: { current?: FormikProps<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App
        formikRef={formikRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
      />,
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
    const formikRef: { current?: FormikProps<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App
        formikRef={formikRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
      />,
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
    const formikRef: { current?: FormikProps<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App
        formikRef={formikRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
        syncValidateAll
      />,
    );
    const formik = formikRef.current!;
    resetCounters(counters);

    const start = performance.now();
    await act(async () => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        await formik.setFieldValue(TARGET_FLAT_KEY, `v${i}`, true);
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
    const formikRef: { current?: FormikProps<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const async_ = makeAsyncValidate(5);
    // Formik has no built-in per-field debounce (see the feature matrix's
    // "Built-in async-validation debounce" row); hand-rolled here the way a
    // real app would, so this reports the realistic cost of reaching parity
    // rather than the (uninteresting) undebounced number.
    const debouncedValidate = debounce(async_.validate, 50);
    const { unmount } = render(
      <App
        formikRef={formikRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
        asyncDebounceTarget={{
          key: TARGET_FLAT_KEY,
          validate: debouncedValidate,
        }}
      />,
    );
    const formik = formikRef.current!;

    const start = performance.now();
    await act(async () => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        formik.setFieldValue(TARGET_FLAT_KEY, `v${i}`, true);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    const wallMs = async_.lastSettledAt() - start;

    unmount();
    cleanup();
    return { wallMs, validatorCalls: async_.callCount() };
  },

  async schemaValidation(): Promise<Metrics> {
    const formikRef: { current?: FormikProps<FormValue> } = {};
    const itemsApiRef: { current?: ItemsApi } = {};
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App
        formikRef={formikRef}
        counters={counters}
        itemsApiRef={itemsApiRef}
        useSchema
      />,
    );
    const formik = formikRef.current!;
    resetCounters(counters);

    const start = performance.now();
    await act(async () => {
      await formik.submitForm();
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
