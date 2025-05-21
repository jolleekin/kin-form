import { off, on } from "./event.ts";

export interface GenericEventListener<T extends Event = Event> {
  (event: T): void;
}

export type GenericEventListenerOrEventListenerObject<T extends Event = Event> =
  GenericEventListener<T> | EventListenerObject;

type Record = {
  target: EventTarget;
  type: keyof HTMLElementEventMap;
  listener: GenericEventListenerOrEventListenerObject;
  useCapture?: boolean;
};

export class EventTracker {
  get isEmpty(): boolean {
    return this.#records.length === 0;
  }

  #records: Record[] = [];

  /**
   * Adds an event.
   * @param target The event target.
   * @param type The event type.
   * @param listener The event listener.
   * @param useCapture Whether to use capture.
   */
  add<T extends Event>(
    target: EventTarget,
    type: keyof HTMLElementEventMap,
    listener: GenericEventListenerOrEventListenerObject<T>,
    useCapture?: boolean
  ): void {
    on(target, type, listener, useCapture);
    this.#records.push({
      target,
      type,
      listener: listener as never,
      useCapture,
    });
  }

  clear(): void {
    for (const { target, type, listener, useCapture } of this.#records) {
      off(target, type, listener, useCapture);
    }
    this.#records.length = 0;
  }
}
