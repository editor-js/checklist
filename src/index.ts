import './index.css';
import { IconChecklist, IconCheck } from '@codexteam/icons';
import EditorJS from "@editorjs/editorjs";
import { extractContentAfterCaret, fragmentToHtml, make, getHTML, moveCaret } from './utils';
import './polyfills.js';

/**
 * Single CheckList data entity abstraction
 */
export interface ChecklistItem {
  /** @property {string} text - item label */
  text: string;
  /** @property {boolean} checked - is the item checked */
  checked: boolean;
}

/**
 * CheckList data collection abstraction
 */
export interface ChecklistData {
  /** @property {ChecklistItem[]} items - checklist elements */
  items: ChecklistItem[];
}

/**
 * CheckList constructor options
 */
export interface ChecklistOptions {
  /** @property {ChecklistData} data - checklist option data */
  data: ChecklistData;
  /** @property {EditorJS} api - Editor.js API */
  api: EditorJS;
  /** @property {boolean} readOnly - read only mode flag */
  readOnly: boolean;
}

/**
 * Checklist Tool for the Editor.js 2.0
 */
export default class Checklist {
  /** @private HTML nodes */
  private _elements: { wrapper: HTMLElement | null; items: HTMLElement[] };
  /** @private read only flag */
  private readOnly: boolean;
  /** @private Editor.js API */
  private api: EditorJS;
  /** @private checklist option data */
  private data: ChecklistData;

  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported(): boolean {
    return true;
  }

  /**
   * Allow to use native Enter behaviour
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks(): boolean {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: IconChecklist,
      title: 'Checklist',
    };
  }

  /**
   * Allow Checkbox Tool to be converted to/from other block
   *
   * @returns {{export: Function, import: Function}}
   */
  static get conversionConfig(): { export: (data: ChecklistData) => string; import: (str: string) => ChecklistData } {
    return {
      /**
       * To create exported string from the checkbox, concatenate items by dot-symbol.
       *
       * @param {ChecklistData} data - checklist data to create a string from that
       * @returns {string}
       */
      export: (data: ChecklistData): string => {
        return data.items.map(({ text }) => text).join('. ');
      },
      /**
       * To create a checklist from other block's string, just put it at the first item
       *
       * @param {string} string - string to create list tool data from that
       * @returns {ChecklistData}
       */
      import: (str: string): ChecklistData => {
        return {
          items: [
            {
              text: str,
              checked: false,
            },
          ],
        };
      },
    };
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {object} options - block constructor options
   * @param {ChecklistData} options.data - previously saved data
   * @param {object} options.api - Editor.js API
   * @param {boolean} options.readOnly - read only mode flag
   */
  constructor({ data, api, readOnly }: ChecklistOptions) {
    /**
     * HTML nodes
     *
     * @private
     */
    this._elements = {
      wrapper: null,
      items: [],
    };
    this.readOnly = readOnly;
    this.api = api;
    /**
     * Fill or create tool's data structure
     */
    this.data = data || { items: [] };
  }

  /**
   * Returns checklist tag with items
   *
   * @returns {Element}
   */
  render(): HTMLElement {
    this._elements.wrapper = make('div', [this.CSS.baseBlock, this.CSS.wrapper]);

    /**
     * If there is no data, create first empty item
     */
    if (!this.data.items) {
      this.data.items = [
        {
          text: '',
          checked: false,
        },
      ];
    }

    this.data.items.forEach(item => {
      const newItem = this.createChecklistItem(item);

      if (this._elements.wrapper) {
        this._elements.wrapper.appendChild(newItem);
      }
    });

    /**
     * If read-only mode is on, do not bind events
     */
    if (this.readOnly) {
      return this._elements.wrapper;
    }

    /**
     * Add event-listeners
     */
    this._elements.wrapper.addEventListener('keydown', (event: KeyboardEvent) => {
      const [ENTER, BACKSPACE] = [13, 8]; // key codes

      switch (event.keyCode) {
        case ENTER:
          this.enterPressed(event);
          break;
        case BACKSPACE:
          this.backspace(event);
          break;
      }
    }, false);

    this._elements.wrapper.addEventListener('click', (event: MouseEvent) => {
      this.toggleCheckbox(this._elements.wrapper, event);
    });

    return this._elements.wrapper;
  }

  /**
   * Return Checklist data
   *
   * @returns {ChecklistData}
   */
  save(): ChecklistData {
    /**
     * @type {ChecklistItem[]}
     */
    let items: ChecklistItem[] = this.items.filter(itemEl => this.getItemInput(itemEl) !== null).map((itemEl) => {
      const input = this.getItemInput(itemEl) as HTMLElement;

      return {
        text: getHTML(input),
        checked: itemEl.classList.contains(this.CSS.itemChecked),
      };
    });

    /**
     * Skip empty items
     */
    items = items.filter(item => item.text.trim().length !== 0);

    return {
      items,
    };
  }

  /**
   * Validate data: check if Checklist has items
   *
   * @param {ChecklistData} savedData — data received after saving
   * @returns {boolean} false if saved data is not correct, otherwise true
   * @public
   */
  validate(savedData: ChecklistData): boolean {
    return !!savedData.items.length;
  }

  /**
   * Toggle checklist item state
   *
   * @param {HTMLElement | null} target - element receiving the event
   * @param {MouseEvent} event - click
   * @returns {void}
   */
  toggleCheckbox(target: HTMLElement | null, event: MouseEvent): void {

    if (target) {
      const checkListItem = target.closest(`.${this.CSS.item}`);

      if (checkListItem) {
        const checkbox = checkListItem.querySelector<HTMLElement>(`.${this.CSS.checkboxContainer}`);

        if (checkbox && checkbox.contains(event.target as Node)) {
          checkListItem.classList.toggle(this.CSS.itemChecked);
          checkbox.classList.add(this.CSS.noHover);
          checkbox.addEventListener('mouseleave', () => this.removeSpecialHoverBehavior(checkbox), { once: true });
        }
      }
    }
  }

  /**
   * Create Checklist items
   *
   * @param {ChecklistItem} item - data.item
   * @returns {Element} checkListItem - new element of checklist
   */
  createChecklistItem(item: ChecklistItem = { text: '', checked: false }): HTMLElement {
    const checkListItem = make('div', this.CSS.item);
    const checkbox = make('span', this.CSS.checkbox);
    const checkboxContainer = make('div', this.CSS.checkboxContainer);
    const textField = make('div', this.CSS.textField, {
      innerHTML: item.text ? item.text : '',
      contentEditable: !this.readOnly,
    });

    if (item.checked) {
      checkListItem.classList.add(this.CSS.itemChecked);
    }

    checkbox.innerHTML = IconCheck;

    checkboxContainer.appendChild(checkbox);

    checkListItem.appendChild(checkboxContainer);
    checkListItem.appendChild(textField);

    return checkListItem;
  }

  /**
   * Append new elements to the list by pressing Enter
   *
   * @param {KeyboardEvent} event - keyboard event
   */
  enterPressed(event: KeyboardEvent): void {
    event.preventDefault();

    const items = this.items;
    const currentItem = document.activeElement?.closest(`.${this.CSS.item}`);
    const currentItemIndex = items.indexOf(<HTMLElement>currentItem);
    const isLastItem = currentItemIndex === items.length - 1;

    /**
     * Prevent checklist item generation if it's the last item and it's empty
     * and get out of checklist
     */
    if (isLastItem) {

      if (currentItem) {
        const itemInput = this.getItemInput(currentItem)

        if (itemInput) {
          const currentItemText = getHTML(itemInput);
          const isEmptyItem = currentItemText.length === 0;

          if (isEmptyItem) {
            const currentBlockIndex = this.api.blocks.getCurrentBlockIndex();

            currentItem.remove();

            this.api.blocks.insert();
            this.api.caret.setToBlock(currentBlockIndex + 1);

            return;
          }
        }
        /**
         * Cut content after caret
         */
        const fragmentAfterCaret = extractContentAfterCaret();
        const htmlAfterCaret = fragmentToHtml(fragmentAfterCaret);

        /**
         * Create new checklist item
         */
        const newItem = this.createChecklistItem({
          text: htmlAfterCaret,
          checked: false,
        });

        /**
         * Insert new checklist item as sibling to currently selected item
         */
        this._elements.wrapper?.insertBefore(newItem, currentItem.nextSibling);

        /**
         * Move caret to contentEditable textField of new checklist item
         */
        const newItemInput = this.getItemInput(newItem)

        if (newItemInput) {
          moveCaret(newItemInput, true);
        }
      }
    }
  }

  /**
   * Handle backspace
   *
   * @param {KeyboardEvent} event - keyboard event
   */
  backspace(event: KeyboardEvent): void {
    const currentItem = (event.target as HTMLElement).closest(`.${this.CSS.item}`) as HTMLElement;
    const currentIndex = this.items.indexOf(currentItem);
    const prevItem = this.items[currentIndex - 1];

    if (!prevItem) {
      return;
    }

    const selection = window.getSelection() as Selection;
    const caretAtTheBeginning = selection.focusOffset === 0;

    if (!caretAtTheBeginning) {
      return;
    }

    event.preventDefault();

    /**
     * Append content after caret to the previous item
     * and remove the current one
     */
    const fragmentAfterCaret = extractContentAfterCaret();
    const prevItemInput = this.getItemInput(prevItem);

    if (prevItemInput) {
      const prevItemChildNodesLength = prevItemInput.childNodes.length;

      prevItemInput.appendChild(fragmentAfterCaret);

      moveCaret(prevItemInput, undefined, prevItemChildNodesLength);

      currentItem.remove();
    }
  }

  /**
   * Styles
   *
   * @private
   * @returns {object<string>}
   */
  get CSS(): { [key: string]: string } {
    return {
      baseBlock: this.api.styles.block,
      wrapper: 'cdx-checklist',
      item: 'cdx-checklist__item',
      itemChecked: 'cdx-checklist__item--checked',
      noHover: 'cdx-checklist__item-checkbox--no-hover',
      checkbox: 'cdx-checklist__item-checkbox-check',
      textField: 'cdx-checklist__item-text',
      checkboxContainer: 'cdx-checklist__item-checkbox'
    };
  }

  /**
   * Return all items elements
   *
   * @returns {Element[]}
   */
  get items(): HTMLElement[] {
    return Array.from(this._elements.wrapper?.querySelectorAll(`.${this.CSS.item}`) || []);
  }

  /**
   * Removes class responsible for special hover behavior on an item
   *
   * @private
   * @param {Element} el - item wrapper
   * @returns {Element}
   */
  removeSpecialHoverBehavior(el: HTMLElement): void {
    el.classList.remove(this.CSS.noHover);
  }

  /**
   * Find and return item's content editable element
   *
   * @private
   * @param {Element} el - item wrapper
   * @returns {Element}
   */
  getItemInput(el: HTMLElement | Element): HTMLElement | null {
    return el.querySelector(`.${this.CSS.textField}`);
  }
}
