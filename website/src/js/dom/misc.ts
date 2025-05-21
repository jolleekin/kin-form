/**
 * Finds the host element of {@linkcode node}.
 *
 * The host element of a node is the element whose shadow root contains that
 * node.
 */
export function findHost(node: Node | null): Element | null {
  while (node && !(node instanceof ShadowRoot)) {
    node = node.parentNode;
  }
  return node && node.host;
}

/**
 * Finds an ancestor of a node that satisfies a predicate.
 * @param node The node.
 * @param predicate The predicate.
 * @param options.crossesShadow Whether to cross Shadow DOM boundaries.
 * Default is `false`.
 * @param options.includesInitialNode Whether to test {@linkcode node} itself.
 */
export function findAncestor<T extends Node>(
  node: Node,
  predicate: (e: Node) => e is T,
  options: { crossesShadow?: boolean; includesInitialNode?: boolean } = {},
): T | null {
  let p: Node | null = node;
  if (options.includesInitialNode && predicate(node)) {
    return p as T | null;
  }
  do {
    p = p.parentNode;
    if (p instanceof ShadowRoot) p = options.crossesShadow ? p.host : null;
  } while (p && !predicate(p));
  return p as T | null;
}

/**
 * Finds a node on the propagation path of an event that satisfies a predicate.
 * @param {Event} event The event.
 * @param {(target: EventTarget) => boolean} predicate The predicate.
 */
export function findTarget<T extends EventTarget>(
  event: Event,
  predicate: (target: EventTarget) => boolean,
): T | null {
  const path = event.composedPath();
  let target: EventTarget;
  for (let i = 0; (target = path[i]); i++) {
    if (predicate(target)) return target as T;
  }
  return null;
}

/**
 * Finds the deepest active element.
 */
export function findDeepestActiveElement(): Element {
  let e = document.activeElement || document.body;
  while (true) {
    const r = e.shadowRoot;
    if (!r) break;
    const f = r.activeElement;
    if (!f) break;
    e = f;
  }
  return e;
}

/**
 * Tries to focus an element.
 * @param e The element to focus.
 * @returns `true` if {@linkcode e} is visible ({@linkcode isVisible} returns `true`) and can be focused.
 */
export function tryFocus(e: Element): boolean {
  if (e instanceof HTMLElement && isFocusable(e)) {
    e.focus();
    return true;
  }
  return false;
}

/**
 * Gets the z-index of an element as a number.
 * @param e The element.
 */
export function getZIndex(e: HTMLElement | SVGElement | null): number | null {
  if (!e) return null;
  const s = e.style.zIndex || window.getComputedStyle(e).zIndex;
  if (!s) return null;
  return parseInt(s);
}

/**
 * Tests whether an element is visible, i.e. both its width and height are > 0.
 *
 * @param e The element to test.
 */
export function isVisible(e: HTMLElement): boolean {
  return e.offsetWidth > 0 && e.offsetHeight > 0;
}

/**
 * Returns `true` if {@linkcode e} is keyboard-focusable.
 */
export function isFocusable(e: HTMLElement): boolean {
  return isVisible(e) && e.tabIndex >= 0 && !(e as any).disabled;
}

/**
 * Returns `true` if {@linkcode e} is focused.
 */
export function isFocused(e: HTMLElement) {
  let a: Element | null = document.activeElement;
  while (e !== a && a) {
    a = a.shadowRoot && a.shadowRoot.activeElement;
  }
  return e === a;
}

/**
 * Traverses a DOM tree.
 * @param root The root element to start traversing.
 * @param stop A function called against each visited element.
 *             If this function returns `true`, the traversal will stop.
 * @return `true` if {@linkcode stop} was called and returned `true`.
 */
export function traverseForward(
  root: Element,
  stop: (e: Element) => boolean,
): boolean {
  if (stop(root)) return true;

  const children = getChildren(root);
  for (let i = 0, n = children.length; i < n; i++) {
    if (traverseForward(children[i], stop)) return true;
  }

  return false;
}

/**
 * Traverses a DOM tree in reverse order.
 * @param root The root element to start traversing.
 * @param stop A function called against each visited element.
 *             If this function returns `true`, the traversal will stop.
 * @return `true` if {@linkcode stop} was called and returned `true`.
 */

export function traverseBackward(
  root: Element,
  stop: (e: Element) => boolean,
): boolean {
  const children = getChildren(root);
  for (let i = children.length - 1; i >= 0; i--) {
    if (traverseBackward(children[i], stop)) return true;
  }

  return stop(root);
}

function getChildren(e: Element): ArrayLike<Element> {
  return e.localName !== "slot"
    ? (e.shadowRoot || e).children
    : (e as HTMLSlotElement).assignedElements();
}

export enum VisitResult {
  down,
  skip,
  stop,
}

export function walkTree(
  root: Element | DocumentFragment,
  visit: (e: Element) => VisitResult,
): void {
  let e = root.firstElementChild;
  while (e) {
    const r = visit(e);
    if (r === VisitResult.down) {
      walkTree(e, visit);
    } else if (r === VisitResult.stop) {
      break;
    }
    e = e.nextElementSibling;
  }
}

export function anyElementChild(
  parent: Element,
  predicate: (child: Element) => boolean,
): boolean {
  let child = parent.firstElementChild;
  while (child) {
    if (predicate(child)) return true;
    child = child.nextElementSibling;
  }
  return false;
}

const p = "--_________";

/**
 *
 * @param name `--xyz` or `var(--xyz)`.
 * @param element The element to read the CSS property from.
 * Default is `document.body`.
 * @returns
 */
export function getCustomCssPropertyValue(
  name: string,
  element: HTMLElement = document.body,
): string {
  element.style.setProperty(p, name.startsWith("var") ? name : `var(${name})`);
  const value = getComputedStyle(element).getPropertyValue(p);
  element.style.removeProperty(p);
  return value;
}

export function scrollIntoViewIfNeeded(
  element: HTMLElement,
  container: HTMLElement,
  axis: "x" | "y" | "both",
  options: {
    behavior?: ScrollBehavior;
    marginX?: number;
    marginY?: number;
  } = {},
): void {
  const eRect = element.getBoundingClientRect();
  const cRect = container.getBoundingClientRect();
  const { behavior = "smooth", marginX = 0, marginY = 0 } = options;
  let dx = 0;
  let dy = 0;

  if (axis === "x" || axis === "both") {
    if (eRect.left < cRect.left) {
      dx = eRect.left - cRect.left - marginX;
    } else if (eRect.right > cRect.right) {
      dx = eRect.right - cRect.right + marginX;
    }
  }

  if (axis === "y" || axis === "both") {
    if (eRect.top < cRect.top) {
      dy = eRect.top - cRect.top - marginY;
    } else if (eRect.bottom > cRect.bottom) {
      dy = eRect.bottom - cRect.bottom + marginY;
    }
  }

  if (dx !== 0 || dy !== 0) {
    container.scrollBy({ left: dx, top: dy, behavior });
  }
}
