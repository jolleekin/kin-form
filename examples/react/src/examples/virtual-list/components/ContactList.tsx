import { type KeyboardEvent, type ReactNode, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { FieldApi } from "@kin-form/react";
import { type Contact, ContactRow } from "./ContactRow.tsx";

const ROW_HEIGHT = 56;

export type ContactListProps<TParentValue> = {
  api: FieldApi<Contact[], TParentValue>;
  count: number;
};

/**
 * A virtualized rendering of `api`'s array, built on `@tanstack/react-virtual`.
 *
 * Owns the scroll-offset state itself, so scrolling only re-renders this
 * subtree, not whatever else is mounted alongside it (e.g. `App.tsx`'s submit
 * button).
 */
export function ContactList<TParentValue>(
  { api, count }: ContactListProps<TParentValue>,
): ReactNode {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const jumpToRow = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      const row = Number(event.currentTarget.value);
      if (row >= 1 && row <= count) {
        virtualizer.scrollToIndex(row - 1, { align: "center" });
      }
    },
    [virtualizer, count],
  );

  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <label className="text-sm text-gray-600" htmlFor="jump-to-row">
          Jump to row
        </label>
        <input
          id="jump-to-row"
          type="number"
          min={1}
          max={count}
          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
          onKeyDown={jumpToRow}
        />
        <span className="text-xs text-gray-400">then press Enter</span>
      </div>

      <div
        ref={scrollRef}
        className="mt-4 h-112 overflow-auto rounded-md border border-gray-200"
      >
        <div
          className="relative"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <ContactRow
                api={api.field(`${virtualRow.index}`)}
                index={virtualRow.index}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
