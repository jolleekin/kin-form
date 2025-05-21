/**
 * Fires a custom event.
 *
 * `bubbles`, `cancelable`, and `composed` are `true` by default.
 *
 * @param target The event target.
 * @param type The event type.
 * @param initData Optional event initialization data.
 * @returns The fired custom event.
 */
export function fire<T extends keyof HTMLElementEventMap>(
  target: EventTarget,
  type: T,
  initData: CustomEventInit<DetailType<HTMLElementEventMap[T]>> = {},
): HTMLElementEventMap[T] {
  initData.bubbles ??= true;
  initData.cancelable ??= true;
  initData.composed ??= true;
  const event = new CustomEvent(type, initData);
  target.dispatchEvent(event);
  return event as any;
}

/**
 * A helper type that returns the the type of the `detail` property of a
 * `CustomEvent` type.
 */
export type DetailType<E> = E extends CustomEvent<infer D> ? D : {};

export type EventType =
  | keyof HTMLElementEventMap
  | keyof WindowEventHandlersEventMap
  | keyof AnimationEventMap;

/**
 * Removes an event listener from a target.
 *
 * See {@linkcode EventTarget.addEventListener}.
 */
export function off<T>(
  target: EventTarget,
  type: EventType,
  listener: ((event: T) => void) | EventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void {
  target.removeEventListener(type, listener as any, options);
}

/**
 * Adds an event listener to a target.
 *
 * See {@linkcode EventTarget.addEventListener}.
 */
export function on<T>(
  target: EventTarget,
  type: EventType,
  listener: ((event: T) => void) | EventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void {
  target.addEventListener(type, listener as any, options);
}

export const PASSIVE_LISTENER_OPTIONS: AddEventListenerOptions = {
  passive: true,
};

/**
 * Tests if an event can invoke a control.
 * @param event The event to test.
 * @param acceptsEnter Whether `Enter` can invoke a control.
 */
export function isKeyboardInvoke(
  event: KeyboardEvent,
  target: EventTarget,
  acceptsEnter: boolean,
): boolean {
  return (
    (event.key === " " || (acceptsEnter && event.key === "Enter")) &&
    target === event.composedPath()[0]
  );
}

/**
 * Returns a promise that resolves when an event of type {@linkcode eventType}
 * is fired on {@linkcode target}.
 * 
 * If {@linkcode timeoutMs} is provided, the promise will resolve after
 * approximately {@linkcode timeoutMs} milliseconds even if no event of type
 * {@linkcode eventType} is fired on {@linkcode target}.
 * 
 * For events such as `animationend` and `transitionend`, {@linkcode timeoutMs}
 * should be slightly (e.g. 50ms) longer than the animation/transition duration.
 */
export function waitForEvent(
  target: EventTarget,
  eventType: EventType,
  timeoutMs?: number,
): Promise<void> {
  return new Promise((resolve) => {
    let timerId = 0;

    function done(event: Event) {
      if (event.target === target) {
        clearTimeout(timerId);
        off(target, eventType, done);
        resolve();
      }
    }

    on(target, eventType, done);

    if (timeoutMs !== undefined) {
      timerId = setTimeout(done, timeoutMs, { target });
    }
  });
}
