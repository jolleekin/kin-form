import { css } from "lit";

export const styles = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100dvh;
  }

  kin-field {
    display: contents;
  }

  .main {
    display: flex;
    flex-flow: row wrap;
    gap: 48px;
    padding-inline: 24px;
    flex: 1;
    overflow: hidden;
  }
  .form {
    flex: 1 1 520px;
    max-height: 100%;
    max-width: 700px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .form-state {
    border-radius: var(--border-radius-lg);
    flex: 1 1 300px;
    max-height: 100%;
    overflow: auto;
  }

  fieldset {
    background-color: var(--color-bg-1);
    border-radius: var(--border-radius-lg);
    border-style: solid;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 12px;
  }
  legend {
    font-size: 20px;
    line-height: 1.2;
  }

  .actions {
    display: flex;
    gap: 12px;
  }

  ix-object-inspector {
    /* https://github.com/elematic/inspector-elements/issues/8 */
    /* --ix-treenode-font-size: 13px;
    --ix-treenode-line-height: 16px; */
    zoom: 1.5;
  }
`;
