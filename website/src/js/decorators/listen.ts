import { LitElement } from "lit";

import { on } from "../dom/event.ts";

export function listen(
  eventType: keyof HTMLElementEventMap | keyof WindowEventHandlersEventMap,
  options?: AddEventListenerOptions,
) {
  return <ElemClass extends LitElement>(
    proto: ElemClass,
    decoratedFnName: string,
  ) => {
    (proto.constructor as typeof LitElement).addInitializer((instance) => {
      on(
        instance,
        eventType,
        proto[decoratedFnName as keyof ElemClass] as EventListener,
        options,
      );
    });
  };
}
