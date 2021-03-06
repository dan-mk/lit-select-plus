/* eslint-disable lit-a11y/click-events-have-key-events */
import { html, css, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

interface SelectPlusOption {
  value: string;
  label: string;
}

export class SelectPlus extends LitElement {
  static styles = css`
    * {
      box-sizing: border-box;
    }

    :host {
      display: block;
      border-radius: 4px;
    }

    :host(:focus) {
      box-shadow: 2px 2px 0 black, -2px -2px 0 black, 2px -2px 0 black,
        -2px 2px 0 black;
    }

    :host,
    .input {
      font-family: sans-serif;
      font-size: 15px;
      outline: none;
    }

    .input,
    .value-container {
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px 10px;
      width: 100%;
    }

    .clear-button {
      cursor: pointer;
      padding: 4px;
      margin-top: -4px;
      margin-right: -4px;
      margin-bottom: -4px;
    }

    .main-options-container {
      position: relative;
    }

    .options-container {
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.15);
      position: absolute;
      top: 38px;
      width: 100%;
    }

    .option,
    .value-container {
      display: flex;
    }

    .option {
      padding: 10px 8px;
      cursor: pointer;
    }

    .option:hover {
      background: #f3f3f3;
    }

    .option-value,
    .value,
    .magnifying-glass {
      flex-shrink: 0;
      width: 50px;
    }

    .option-label,
    .label,
    .placeholder {
      flex-grow: 1;
    }

    .placeholder-text {
      color: #777;
      font-style: italic;
    }

    .label,
    .option-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .no-results {
      color: #777;
      font-style: italic;
      padding: 8px 10px;
    }

    :host([hide-value]) .value,
    :host([hide-value]) .option-value {
      display: none;
    }
  `;

  @property({ type: String }) tabindex = '0';

  @property({ type: String }) placeholder = 'Select...';

  @property({ type: String }) value = '';

  @property({ type: Boolean, attribute: 'hide-value' }) hideValue = false;

  @property({ type: String, attribute: 'value-pattern' }) valuePattern =
    '\\d{1,5}';

  @state() private _searchState: Boolean = false;

  @state() private _options: SelectPlusOption[] = [];

  @state() private _query: String = '';

  firstUpdated() {
    this.setAttribute('tabindex', this.tabindex);

    this.addEventListener('keydown', e => {
      if (this._searchState === false) {
        this._onKeyDownValueContainer(e);
      }
    });

    this.addEventListener('blur', () => {
      this._searchState = false;

      const pattern = new RegExp(this.valuePattern);
      if (pattern.test(this._query as string)) {
        this.value = this._query as string;
      }
    });

    this._updateOptionsList();

    const observer = new MutationObserver(() => {
      this._updateOptionsList();
    });

    observer.observe(this as Node, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  render() {
    const selectedOption = this._options.find(
      option => option.value === this.value
    );
    const label = selectedOption ? selectedOption.label : null;

    return html`
      <div
        class="main-options-container"
        style=${styleMap({ display: this._searchState ? 'block' : 'none' })}
      >
        <input
          class="input"
          type="text"
          .value=${this._query as string}
          @input="${this._onChangeQueryInput}"
          @keydown="${this._onKeyDownQueryInput}"
        />
        <div class="options-container">
          ${this._options
            .filter(option => this._doesOptionMatchQuery(option))
            .map(
              option => html`
                <div
                  class="option"
                  @click="${() => this._onClickOption(option)}"
                >
                  <div class="option-value">${option.value}</div>
                  <div class="option-label">${option.label}</div>
                </div>
              `
            )}
          ${this._options.filter(option => this._doesOptionMatchQuery(option))
            .length === 0 && this._query.length > 0
            ? html` <div class="no-results">No results</div> `
            : ''}
        </div>
      </div>
      <div
        style=${styleMap({ display: this._searchState ? 'none' : 'flex' })}
        @click="${this._onClickValueContainer}"
        class="value-container"
      >
        ${this.value !== ''
          ? html`
              <div class="value">${this.value}</div>
              <div class="label">
                ${label ||
                html`<span class="placeholder-text">Loading...</span>`}
              </div>
              <div class="clear-button" @click="${this._onClickClearButton}">
                X
              </div>
            `
          : html`
              <div class="magnifying-glass">Q</div>
              <div class="placeholder">
                <span class="placeholder-text">${this.placeholder}</span>
              </div>
            `}
      </div>
    `;
  }

  private _updateOptionsList() {
    const options = this.querySelectorAll('select-plus-option');
    this._options = Array.from(options).map(option => ({
      value: option.getAttribute('value'),
      label: option.textContent,
    })) as SelectPlusOption[];
  }

  private _onChangeQueryInput(e: KeyboardEvent) {
    const queryInput = e.target! as HTMLInputElement;
    this._query = queryInput.value;
  }

  private _onKeyDownQueryInput(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      this._searchState = false;

      const pattern = new RegExp(this.valuePattern);
      if (pattern.test(this._query as string)) {
        this.value = this._query as string;
      }

      this.updateComplete.then(() => {
        this.focus();
      });
    }
  }

  private _doesOptionMatchQuery(option: SelectPlusOption) {
    return (
      option.label.toLowerCase().includes(this._query.toLowerCase()) ||
      option.value.toLocaleLowerCase() === this._query.toLocaleLowerCase()
    );
  }

  private _onClickOption(option: SelectPlusOption) {
    this.value = option.value;
    this._searchState = false;
    this.updateComplete.then(() => {
      this.focus();
    });
  }

  private _onClickValueContainer() {
    this._openOptionsContainer();
  }

  private _onKeyDownValueContainer(e: KeyboardEvent) {
    if (e.code === 'Space') {
      this._openOptionsContainer();
      e.preventDefault();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      this.value = '';
    }
  }

  private _onClickClearButton(e: MouseEvent) {
    e.stopPropagation();
    this.value = '';
    this.updateComplete.then(() => {
      this.focus();
    });
  }

  private _openOptionsContainer() {
    this._searchState = true;
    if (this.value !== '' && this.hideValue === false) {
      this._query = this.value;
    } else {
      this._query = '';
    }

    this.updateComplete.then(() => {
      this.shadowRoot?.querySelector('input')?.select();
    });
  }
}

// Keyboard navigation
// Launch query event
// Launch change event
// Launch user-change event
