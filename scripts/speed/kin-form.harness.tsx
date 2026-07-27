/**
 * Kin Form's speed-benchmark harness; see `harness.ts` for the contract and
 * `speed-bench.ts` for how these methods get driven and averaged.
 */

// deno-lint-ignore-file no-explicit-any require-await -- internal measurement
// script: field-name generics aren't worth fighting here, and every
// SpeedHarness method is `async` uniformly even where a given library's path
// happens not to need an `await` for that particular scenario.

import { memo } from "react";
import { act, cleanup, render } from "@testing-library/react";
import {
  DeepKey,
  type FieldApi,
  FormApi,
  type SchemaValidator,
} from "@kin-form/core/index.ts";
import { useWatch } from "@kin-form/react/index.ts";
import { toSchemaValidator } from "@kin-form/validators/index.ts";
import {
  ADDRESS_LEAF_KEYS,
  allLeafKeys,
  ARRAY_ITEM_COUNT,
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

// Takes an already-resolved, already-configured `api` (validators/
// asyncValidator/debounce are set by the caller via `parent.field(name,
// options)`); this component's only job is the render+subscribe half.
function Leaf(
  { api, counters, countKey }: {
    api: FieldApi<any, any>;
    counters: Counters;
    countKey: string;
  },
) {
  bump(counters, countKey);
  useWatch(api);
  return null;
}

function leafOptions(
  validate: boolean | undefined,
  asyncValidate: ((value: string) => Promise<string | null>) | undefined,
  debounceMs: number | undefined,
) {
  return {
    validators: validate
      ? [(f: FieldApi<any, any>) => syncValidate(f.value as string)]
      : undefined,
    asyncValidator: asyncValidate
      ? (f: FieldApi<any, any>) => asyncValidate(f.value as string)
      : undefined,
    validationDebounceMs: debounceMs,
  };
}

function AddressGroup(
  { form, counters }: { form: FormApi<FormValue>; counters: Counters },
) {
  bump(counters, "address");
  const address = form.field("address");
  return (
    <>
      <Leaf
        api={address.field("line1")}
        counters={counters}
        countKey="address.line1"
      />
      <Leaf
        api={address.field("line2")}
        counters={counters}
        countKey="address.line2"
      />
      <GeoGroup parent={address} counters={counters} />
    </>
  );
}

function GeoGroup(
  { parent, counters }: { parent: FieldApi<any, any>; counters: Counters },
) {
  bump(counters, "address.geo");
  const geo = parent.field("geo");
  return (
    <>
      <Leaf
        api={geo.field("lat")}
        counters={counters}
        countKey="address.geo.lat"
      />
      <Leaf
        api={geo.field("lng")}
        counters={counters}
        countKey="address.geo.lng"
      />
    </>
  );
}

function Items(
  { form, counters }: { form: FormApi<FormValue>; counters: Counters },
) {
  const items = useWatch(form.field<"items">("items"));
  return (
    <>
      {items.value.map((item, i) => {
        const [codeKey, qtyKey, noteKey] = itemFieldKeys(i);
        return (
          <Item
            // Keyed by the item's own embedded id (not its array index) so a
            // swap moves the same component instance rather than remounting
            // two new ones; see the array-swap-burst methodology note.
            key={item.id}
            parent={items}
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
// being unchanged after a sibling swap actually skips re-invoking it;
// without this, the `Items` wrapper re-rendering (required to read the
// array's current length/order) would re-invoke every item regardless of
// whether *that* item's own data changed, masking whatever benefit stable
// identity provides.
const Item = memo(function Item(
  { parent, index, counters, codeKey, qtyKey, noteKey }: {
    parent: FieldApi<any, any>;
    index: number;
    counters: Counters;
    codeKey: string;
    qtyKey: string;
    noteKey: string;
  },
) {
  return (
    <>
      <Leaf
        api={parent.field(`${index}.code`)}
        counters={counters}
        countKey={codeKey}
      />
      <Leaf
        api={parent.field(`${index}.qty`)}
        counters={counters}
        countKey={qtyKey}
      />
      <Leaf
        api={parent.field(`${index}.note`)}
        counters={counters}
        countKey={noteKey}
      />
    </>
  );
});

function SubmitStatus(
  { form, counters }: { form: FormApi<FormValue>; counters: Counters },
) {
  bump(counters, "submit");
  useWatch(form, (f) => [f.dirty, f.invalid] as const);
  return null;
}

function App(
  { form, counters, syncValidateAll, asyncDebounceTarget }: {
    form: FormApi<FormValue>;
    counters: Counters;
    syncValidateAll?: boolean;
    asyncDebounceTarget?: {
      key: string;
      validate: (v: string) => Promise<string | null>;
      delayMs: number;
    };
  },
) {
  return (
    <>
      {FLAT_FIELD_NAMES.map((name) => {
        const key = fieldKey(name) as DeepKey<FormValue>;
        const isDebounceTarget = asyncDebounceTarget?.key === key;
        return (
          <Leaf
            key={name}
            api={form.field(
              key as any,
              leafOptions(
                syncValidateAll,
                isDebounceTarget ? asyncDebounceTarget.validate : undefined,
                isDebounceTarget ? asyncDebounceTarget.delayMs : undefined,
              ),
            )}
            counters={counters}
            countKey={key}
          />
        );
      })}
      <AddressGroup form={form} counters={counters} />
      <Items form={form} counters={counters} />
      <SubmitStatus form={form} counters={counters} />
    </>
  );
}

const TARGET_FLAT_KEY = fieldKey(FLAT_FIELD_NAMES[0]);

export const kinFormHarness: SpeedHarness = {
  name: "Kin Form",

  async mount(): Promise<Metrics> {
    const form = new FormApi({ initialValue: makeInitialValue() });
    const counters = makeCounterMap(counterKeys());
    const start = performance.now();
    const { unmount } = render(<App form={form} counters={counters} />);
    const wallMs = performance.now() - start;
    unmount();
    cleanup();
    return { wallMs };
  },

  async updateFlatField(): Promise<Metrics> {
    const form = new FormApi({ initialValue: makeInitialValue() });
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(<App form={form} counters={counters} />);
    const target = form.field(TARGET_FLAT_KEY as any);
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) target.handleChange(`v${i}`);
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
    const form = new FormApi({ initialValue: makeInitialValue() });
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(<App form={form} counters={counters} />);
    const target = form.field("address").field("geo").field("lat");
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) target.handleChange(`v${i}`);
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
    const form = new FormApi({ initialValue: makeInitialValue() });
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(<App form={form} counters={counters} />);
    const items = form.field("items");
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      // Cycles through adjacent pairs rather than swapping the same two
      // repeatedly: an even-length repeat of the same swap is a no-op
      // permutation, which (combined with React's automatic batching of a
      // synchronous burst into one final render) would trivially collapse
      // to "nothing changed" and measure a batching artifact instead of
      // real reorder cost.
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        const a = i % (ARRAY_ITEM_COUNT - 1);
        items.swapItems("", a, a + 1);
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
    const form = new FormApi({ initialValue: makeInitialValue() });
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(<App form={form} counters={counters} />);
    const items = form.field("items");
    const mid = Math.floor(ARRAY_ITEM_COUNT / 2);
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      // Inserts a freshly-tagged item at the front, then removes one from
      // the middle: keeps the array's length constant at ARRAY_ITEM_COUNT
      // while exercising the re-key path on both ends (every item shifts
      // identity on the insert; everything past `mid` shifts again on the
      // remove). Front insert + middle remove, not insert-then-remove-at-the-
      // same-spot: repeating the same index pair is a net no-op permutation
      // after enough iterations, which (combined with React's automatic
      // batching of a synchronous burst into one final render) would
      // trivially collapse to "nothing changed", the same trap
      // `mutateArray`'s adjacent-pair cycling avoids for swaps.
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) {
        items.insertItem("", 0, makeInsertedItem(i));
        items.removeItem("", mid);
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
    const form = new FormApi({ initialValue: makeInitialValue() });
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(
      <App form={form} counters={counters} syncValidateAll />,
    );
    const target = form.field(TARGET_FLAT_KEY as any);
    resetCounters(counters);

    const start = performance.now();
    act(() => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) target.handleChange(`v${i}`);
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
    const form = new FormApi({ initialValue: makeInitialValue() });
    const counters = makeCounterMap(counterKeys());
    const async_ = makeAsyncValidate(5);
    const { unmount } = render(
      <App
        form={form}
        counters={counters}
        asyncDebounceTarget={{
          key: TARGET_FLAT_KEY,
          validate: async_.validate,
          delayMs: 50,
        }}
      />,
    );
    const target = form.field(TARGET_FLAT_KEY as any);

    const start = performance.now();
    await act(async () => {
      for (let i = 0; i < UPDATE_BURST_SIZE; i++) target.handleChange(`v${i}`);
      await target.waitForValidation();
    });
    const wallMs = performance.now() - start;

    unmount();
    cleanup();
    return { wallMs, validatorCalls: async_.callCount() };
  },

  async schemaValidation(): Promise<Metrics> {
    const schemaValidator: SchemaValidator<FormValue, never> =
      toSchemaValidator(wholeFormSchema);
    const form = new FormApi({
      initialValue: makeInitialValue(),
      schemaValidator,
      onSubmit: async () => {},
    });
    const counters = makeCounterMap(counterKeys());
    const { unmount } = render(<App form={form} counters={counters} />);
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
