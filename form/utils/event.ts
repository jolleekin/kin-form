/**
 * This module defines utility functions and types related to events.
 * @module
 */

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
  initData: CustomEventInit<DetailType<HTMLElementEventMap[T]>> = {}
): HTMLElementEventMap[T] {
  initData.bubbles ??= true;
  initData.cancelable ??= true;
  initData.composed ??= true;
  const event = new CustomEvent(type, initData);
  target.dispatchEvent(event);
  return event as HTMLElementEventMap[T];
}

/**
 * A helper type that returns the the type of the `detail` property of a
 * `CustomEvent` type.
 */
export type DetailType<E> = E extends CustomEvent<infer D> ? D : never;

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
  options?: boolean | AddEventListenerOptions
): void {
  target.removeEventListener(type, listener as EventListener, options);
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
  options?: boolean | AddEventListenerOptions
): void {
  target.addEventListener(type, listener as EventListener, options);
}
