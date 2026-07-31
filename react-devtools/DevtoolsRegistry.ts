/**
 * The devtools' registry of live forms, via {@linkcode DevtoolsRegistry}.
 *
 * @module
 */

import type { FormApi } from "@kin-form/core";

/**
 * A registry that tracks every `FormApi` currently opted into devtools via
 * {@linkcode useFormDevtools}.
 *
 * A small dedicated subscribe/notify pair rather than reusing `core`'s
 * `BaseApi`: `BaseApi` isn't part of `@kin-form/core`'s public exports (only
 * `index.ts` is), and this registry's needs (a flat set of forms, no
 * tree/batching semantics) don't warrant widening that surface.
 */
export class DevtoolsRegistry {
  /** Every currently-registered form, keyed by its `FormApi.id`. */
  get forms(): ReadonlyMap<number, FormApi<unknown>> {
    return this.#forms;
  }

  /** A monotonically increasing counter, bumped whenever a form is registered/unregistered. */
  readonly getVersion = (): number => {
    return this.#version;
  };

  /** Registers `cb` to be called whenever a form is registered/unregistered. */
  readonly subscribe = (cb: VoidFunction): VoidFunction => {
    this.#listeners.add(cb);
    return () => {
      this.#listeners.delete(cb);
    };
  };

  /** Returns the display name passed to {@linkcode register} for `id`, if any. */
  readonly getFormName = (id: number): string | undefined => {
    return this.#names.get(id);
  };

  #forms = new Map<number, FormApi<unknown>>();
  #names = new Map<number, string>();
  #listeners = new Set<VoidFunction>();
  #version = 0;

  /**
   * Registers `form`, notifying any subscribed panel. `name`, if given, is
   * shown in the panel's form select instead of the form's numeric id.
   * Returns a function that unregisters it again (called from
   * {@linkcode useFormDevtools}'s effect cleanup).
   */
  register(form: FormApi<unknown>, name?: string): VoidFunction {
    this.#forms.set(form.id, form);
    if (name != null) this.#names.set(form.id, name);
    this.#notify();

    return () => {
      this.#forms.delete(form.id);
      this.#names.delete(form.id);
      this.#notify();
    };
  }

  #notify(): void {
    this.#version++;
    for (const cb of this.#listeners) cb();
  }
}
