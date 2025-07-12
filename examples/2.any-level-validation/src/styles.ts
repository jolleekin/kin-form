import { css } from "lit";

export const defaultStyles = css`
  *,
  :host,
  ::before,
  ::after {
    box-sizing: border-box;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
  }
`;

export const utilityStyles = css`
  .pt-2 {
    padding-top: 0.5rem;
  }
  .text-center {
    text-align: center;
  }
  .text-end {
    text-align: end;
  }
`;

export const buttonStyles = css`
  button {
    border-radius: var(--border-radius-md);
    min-height: 32px;
    min-width: 80px;
  }
  button[icon] {
    min-width: 32px;
  }
  button[primary] {
    color: var(--color-fg-on-primary);
    background-color: var(--color-primary);
  }
`;

export const fieldStyles = css`
  :host,
  .field {
    display: flex;
    flex-flow: row wrap;
  }
  [part="label"] {
    flex: 1 0 100px;
  }
  [part="content"] {
    flex: 1e9 1 200px;
    display: flex;
    flex-direction: column;
  }
  [part="input"] {
    border-radius: var(--border-radius-md);
    border-style: solid;
    border-width: 1px;
    min-width: 0;
    min-height: 32px;
    width: 100%;
    padding: 0 8px;

    font-size: 1rem;
    line-height: 1.5;
    font-family: inherit;
  }
`;

export const fieldStatusStyles = css`
  [part="error"] {
    font-size: 13px;
    line-height: 16px;
    color: coral;
  }
`;
