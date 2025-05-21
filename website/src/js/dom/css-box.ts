/**
 * A utility class that helps measure miscellaneous box layout properties of an
 * {@linkcode HTMLElement}.
 *
 * __NOTE__:
 *
 * The values of all getters are computed everytime the getters are accessed.
 */
export class CSSBox {
  readonly element: HTMLElement;
  readonly style: CSSStyleDeclaration;

  constructor(el: HTMLElement) {
    this.element = el;
    this.style = getComputedStyle(el);
  }

  /**
   * The content height, which equals
   * {@linkcode HTMLElement.clientHeight}` - `{@linkcode verticalPadding}
   */
  get contentHeight(): number {
    return this.element.clientHeight - this.verticalPadding;
  }

  /**
   * The content width, which equals
   * {@linkcode HTMLElement.clientWidth}` - `{@linkcode horizontalPadding}
   */
  get contentWidth(): number {
    return this.element.clientWidth - this.horizontalPadding;
  }

  /** The horizontal border, which equals `borderLeftWidth + borderRightWidth`. */
  get horizontalBorder(): number {
    return (
      parseInt(this.style.borderLeftWidth) +
      parseInt(this.style.borderRightWidth)
    );
  }

  /** The vertical border, which equals `borderTopWidth + borderBottomWidth`. */
  get verticalBorder(): number {
    return (
      parseInt(this.style.borderTopWidth) +
      parseInt(this.style.borderBottomWidth)
    );
  }

  /** The horizontal margin, which equals `marginLeft + marginRight`. */
  get horizontalMargin(): number {
    return this.marginLeft + this.marginRight;
  }

  get marginBottom(): number {
    return parseInt(this.style.marginBottom);
  }

  get marginLeft(): number {
    return parseInt(this.style.marginLeft);
  }

  get marginRight(): number {
    return parseInt(this.style.marginRight);
  }

  get marginTop(): number {
    return parseInt(this.style.marginTop);
  }

  /** The vertical margin, which equals `marginTop + marginBottom`. */
  get verticalMargin(): number {
    return this.marginTop + this.marginBottom;
  }

  /** The horizontal padding, which equals `paddingLeft + paddingRight`. */
  get horizontalPadding(): number {
    return (
      parseInt(this.style.paddingLeft) + parseInt(this.style.paddingRight)
    );
  }

  /** The vertical padding, which equals `paddingTop + paddingBottom`. */
  get verticalPadding(): number {
    return (
      parseInt(this.style.paddingTop) + parseInt(this.style.paddingBottom)
    );
  }

  /** The horizontal padding + border + margin. */
  get horizontalPbm(): number {
    return this.totalWidth - this.contentWidth;
  }

  /** The vertical padding + border + margin. */
  get verticalPbm(): number {
    return this.totalHeight - this.contentHeight;
  }

  /**
   * The total height, which equals `offsetHeight + marginTop + marginBottom`.
   */
  get totalHeight(): number {
    return this.element.offsetHeight + this.marginTop + this.marginBottom;
  }

  /**
   * The total width, which equals `offsetWidth + marginLeft + marginRight`.
   */
  get totalWidth(): number {
    return this.element.offsetWidth + this.marginLeft + this.marginRight;
  }
}
