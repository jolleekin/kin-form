import { LitElement } from "lit";

type ChangeHandler = (newValue?: unknown, oldValue?: unknown) => void;

// type UpdateHandlerFunctionKeys<T extends object> = keyof {
//   [K in keyof T]: T[K] extends ChangeHandler ? K : never;
// };

interface WatchOptions {
  /**
   * If true, will only start watching after the initial update/render
   */
  waitUntilFirstUpdate?: boolean;
}

/**
 * Runs when observed properties change, e.g. @property or @state, but before the component updates. To wait for an
 * update to complete after a change occurs, use `await this.updateComplete` in the handler. To start watching after the
 * initial update/render, use `{ waitUntilFirstUpdate: true }` or `this.hasUpdated` in the handler.
 *
 * Usage:
 *
 * @watch('propName')
 * handlePropChange(newValue, oldValue) {
 *   ...
 * }
 */
export function watch(propertyName: string | string[], options?: WatchOptions) {
  const waitUntilFirstUpdate = options?.waitUntilFirstUpdate ?? false;
  return <ElemClass extends LitElement>(
    proto: ElemClass,
    decoratedFnName: string,
  ) => {
    // @ts-expect-error - update is a protected property
    const { update } = proto;
    const watchedProperties = Array.isArray(propertyName)
      ? propertyName
      : [propertyName];

    // @ts-expect-error - update is a protected property
    proto.update = function (
      this: ElemClass,
      changedProps: Map<keyof ElemClass, ElemClass[keyof ElemClass]>,
    ) {
      watchedProperties.forEach((property) => {
        const key = property as keyof ElemClass;
        if (changedProps.has(key)) {
          const oldValue = changedProps.get(key);
          const newValue = this[key];

          if (oldValue !== newValue) {
            if (!waitUntilFirstUpdate || this.hasUpdated) {
              (
                this[
                  decoratedFnName as keyof ElemClass
                ] as unknown as ChangeHandler
              )(newValue, oldValue);
            }
          }
        }
      });

      update.call(this, changedProps);
    };
  };
}
