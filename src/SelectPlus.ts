import { html, css, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

interface SelectPlusOption {
  value: string;
  label: string;
}

export class SelectPlus extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    .option, .value-container {
      display: flex;
    }

    .option-value, .value, .magnifying-glass {
      flex-shrink: 0;
      width: 50px;
    }

    .option-label, .label, .placeholder {
      flex-grow: 1;
    }
  `;
  
  @property({ type: String }) placeholder = 'Select...';

  @property({ type: String }) value = '';
  
  @state() private _searchState : Boolean = false;

  @state() private _options : SelectPlusOption[] = [];

  @state() private _query : String = '';

  @state() private _label : String | null = null;

  firstUpdated() {
    const options = this.querySelectorAll('select-plus-option');
    this._options = Array.from(options).map(option => ({
        value: option.getAttribute('value'),
        label: option.textContent
    })) as SelectPlusOption[];

    this.addEventListener('click', () => {
      if (this._searchState === false) {
        this._onClickValueContainer();
      }
    });

    this.addEventListener('keydown', (e) => {
      if (this._searchState === false) {
        this._onKeyDownValueContainer(e);
      }
    });
  }

  render() {
    return html`
        <div style=${styleMap({ display: (this._searchState ? 'block' : 'none')})}>
          <input
            type="text"
            .value=${this._query as string}
            @input="${this._onChangeQueryInput}"
            @blur="${this._onBlurQueryInput}" />
          <div>
            ${
              this._options.filter((option) => this._doesOptionMatchQuery(option)).map((option) => html`
                <div class="option" @mousedown="${() => this._onMouseDownOption(option)}">
                  <div class="option-value">
                    ${option.value}
                  </div>
                  <div class="option-label">
                    ${option.label}
                  </div>
                </div>
              `)
            }
          </div>
        </div>
        <div
          style=${styleMap({ display: (this._searchState ? 'none' : 'flex')})}
          class="value-container">
          ${
            this.value !== '' ?
              html`
                <div class="value">
                  ${this.value}
                </div>
                <div class="label">
                  ${this._label ? this._label : 'Loading...'}
                </div>
              ` : html`
                <div class="magnifying-glass">
                  Q
                </div>
                <div class="placeholder">
                  ${this.placeholder}
                </div>
              `
          }
        </div>
      `;
  }

  private _onChangeQueryInput(e : Event) {
    const queryInput = e.target! as HTMLInputElement;
    this._query = queryInput.value;
  }

  private _onBlurQueryInput() {
    this._searchState = false;
  }

  private _doesOptionMatchQuery(option: SelectPlusOption) {
    return (
      option.label.toLowerCase().includes(this._query.toLowerCase()) ||
      option.value.toLocaleLowerCase() === this._query.toLocaleLowerCase()
    );
  }

  private _onMouseDownOption(option : SelectPlusOption) {
    this.value = option.value;
    this._updateLabel();
    this.updateComplete.then(() => {
      this.focus();
    });
  }

  private _onClickValueContainer() {
    this._openOptionsContainer();
  }

  private _onKeyDownValueContainer(e: KeyboardEvent) {
    if (e.code === "Space") {
      this._openOptionsContainer();
      e.preventDefault();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      this.value = '';
      this._updateLabel();
    }
  }

  private _openOptionsContainer() {
    this._searchState = true;
    if (this.value !== '') {
      this._query = this.value;
    } else {
      this._query = '';
    }

    this.updateComplete.then(() => {
      this.shadowRoot?.querySelector('input')?.focus();
    });
  }

  private _updateLabel() {
    const selectedOption = this._options.find((option) => option.value === this.value);
    this._label = selectedOption ? selectedOption.label : null;
  }
}
