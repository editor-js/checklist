/**
 * Build styles
 */
require('./index.css').toString();

/**
 * Require polyfills
 */
require('./polyfills.js');

/**
 * @typedef {object} ChecklistData
 * @property {Array} items - checklist elements
 */

/**
 * Checklist Tool for the Editor.js 2.0
 */
class Checklist {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Allow to use native Enter behaviour
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks() {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: '<svg width="15" height="15" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zm0-2.394a5.106 5.106 0 1 0 0-10.212 5.106 5.106 0 0 0 0 10.212zm-.675-4.665l2.708-2.708 1.392 1.392-2.708 2.708-1.392 1.391-2.971-2.971L5.245 6.36l1.58 1.58z"/></svg>',
      title: 'Checklist',
    };
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {ChecklistData} data - previously saved data
   * @param {object} config - user config for Tool
   * @param {object} api - Editor.js API
   * @param {boolean} readOnly - read only mode flag
   */
  constructor({ data, config, api, readOnly }) {
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

    /**
     * Tool's data
     *
     * @type {ChecklistData}
     */
    this._data = {
      items: [],
    };

    this.api = api;
    this.data = data;
  }

  /**
   * Returns checklist tag with items
   *
   * @returns {Element}
   */
  render() {
    this._elements.wrapper = this._make('div', [this.CSS.baseBlock, this.CSS.wrapper]);

    // fill with data
    if (this._data.items.length) {
      this._data.items.forEach(item => {
        const newItem = this.createChecklistItem(item);

        this._elements.items.push(newItem);
        this._elements.wrapper.appendChild(newItem);
      });
    } else {
      const newItem = this.createChecklistItem();

      this._elements.items.push(newItem);
      this._elements.wrapper.appendChild(newItem);
    }

    /**
     * If read-only mode is on, do not bind events
     */
    if (this.readOnly) {
      return this._elements.wrapper;
    }

    // add event-listeners
    this._elements.wrapper.addEventListener('keydown', (event) => {
      const [ENTER, BACKSPACE] = [13, 8]; // key codes

      switch (event.keyCode) {
        case ENTER:
          this.appendNewElement(event);
          break;
        case BACKSPACE:
          this.backspace(event);
          break;
      }
    }, false);

    this._elements.wrapper.addEventListener('click', (event) => {
      this.toggleCheckbox(event);
    });

    return this._elements.wrapper;
  }

  /**
   * Validate data: check if Checklist has items
   *
   * @param {ChecklistData} savedData — data received after saving
   * @returns {boolean} false if saved data is not correct, otherwise true
   * @public
   */
  validate(savedData) {
    return !!savedData.items.length;
  }

  /**
   * Toggle checklist item state
   *
   * @param event
   */
  toggleCheckbox(event) {
    const checkListItem = event.target.closest(`.${this.CSS.item}`);
    const checkbox = checkListItem.querySelector(`.${this.CSS.checkbox}`);

    if (checkbox.contains(event.target)) {
      checkListItem.classList.toggle(this.CSS.itemChecked);
    }
  }

  /**
   * Create Checklist items
   *
   * @param {ChecklistData} item - data.item
   * @returns {HTMLElement} checkListItem - new element of checklist
   */
  createChecklistItem(item = {}) {
    const checkListItem = this._make('div', this.CSS.item);

    const checkbox = this._make('span', this.CSS.checkbox);

    const textField = this._make('div', this.CSS.textField, {
      innerHTML: item.text ? item.text : '',
      contentEditable: !this.readOnly,
    });

    if (item.checked) {
      checkListItem.classList.add(this.CSS.itemChecked);
    }

    checkListItem.appendChild(checkbox);
    checkListItem.appendChild(textField);

    return checkListItem;
  }

  /**
   * Append new elements to the list by pressing Enter
   *
   * @param {KeyboardEvent} event
   */
  appendNewElement(event) {
    event.preventDefault();
    const currentNode = window.getSelection().anchorNode;
    const lastItem = this._elements.items[this._elements.items.length - 1].querySelector(`.${this.CSS.textField}`);
    const lastItemText = lastItem.innerHTML.replace('<br>', ' ').trim();

    /**
     * Prevent checklist item generation if last item is empty and get out of checklist
     */
    if (currentNode === lastItem && !lastItemText) {
      /** Insert New Block and set caret */
      this.api.blocks.insertNewBlock();
      event.stopPropagation();

      return;
    }

    /**
     * Create new checklist item
     */
    const newItem = this.createChecklistItem();

    /**
     * Find closest checklist item
     */
    const currentItem = currentNode.parentNode.closest(`.${this.CSS.item}`);

    /**
     * Insert new checklist item as sibling to currently selected item
     */
    this._elements.wrapper.insertBefore(newItem, currentItem.nextSibling);

    /**
     * Index of newly inserted checklist item
     */
    const currentIndex = this._elements.items.indexOf(currentItem) + 1;

    /**
     * Add new checklist item to tags array
     */
    this._elements.items.splice(currentIndex, 0, newItem);

    /**
     * Move caret to contentEditable textField of new checklist item
     */
    this.moveCaretToEnd(newItem.querySelector(`.${this.CSS.textField}`));
  }

  /**
   * Handle backspace
   *
   * @param {KeyboardEvent} event
   */
  backspace(event) {
    const currentItem = event.target.closest(`.${this.CSS.item}`);
    const currentIndex = this._elements.items.indexOf(currentItem);
    const currentItemText = currentItem.querySelector(`.${this.CSS.textField}`).innerHTML.replace('<br>', ' ').trim();
    const firstItem = this._elements.items[0];
    const firstItemText = firstItem.querySelector(`.${this.CSS.textField}`).innerHTML.replace('<br>', ' ').trim();

    if (!firstItemText) {
      return;
    }

    /**
     * If not first checklist item and item has no text
     */
    if (currentIndex && !currentItemText) {
      event.preventDefault();
      currentItem.remove();

      /**
       * Delete checklist item from tags array
       */
      this._elements.items.splice(currentIndex, 1);

      /**
       * After deleting the item, move move caret to previous item if it exists
       */
      if (this._elements.items[currentIndex - 1] !== 'undefined') {
        this.moveCaretToEnd(this._elements.items[currentIndex - 1].querySelector(`.${this.CSS.textField}`));
      }
    }
  }

  /**
   * @returns {ChecklistData}
   */
  save() {
    return this.data;
  }

  /**
   * Styles
   *
   * @private
   */
  get CSS() {
    return {
      baseBlock: this.api.styles.block,
      wrapper: 'cdx-checklist',
      item: 'cdx-checklist__item',
      itemChecked: 'cdx-checklist__item--checked',
      checkbox: 'cdx-checklist__item-checkbox',
      textField: 'cdx-checklist__item-text',
    };
  }

  /**
   * Checklist data setter
   *
   * @param {ChecklistData} checklistData
   */
  set data(checklistData) {
    this._data.items = checklistData.items || [];

    const oldView = this._elements.wrapper;

    if (oldView) {
      oldView.parentNode.replaceChild(this.render(), oldView);
    }
  }

  /**
   * Return Checklist data
   *
   * @returns {ChecklistData}
   */
  get data() {
    this._data.items = [];

    for (let i = 0; i < this._elements.items.length; i++) {
      const value = this._elements.items[i].querySelector(`.${this.CSS.textField}`).innerHTML.replace('<br>', ' ').trim();

      if (value) {
        this._data.items.push({
          text: value,
          checked: this._elements.items[i].classList.contains(this.CSS.itemChecked),
        });
      }
    }

    return this._data;
  }

  /**
   * Helper for making Elements with attributes
   *
   * @param  {string} tagName           - new Element tag name
   * @param  {Array|string} classNames  - list or name of CSS classname(s)
   * @param  {object} attributes        - any attributes
   * @returns {Element}
   */
  _make(tagName, classNames = null, attributes = {}) {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (const attrName in attributes) {
      el[attrName] = attributes[attrName];
    }

    return el;
  }

  /**
   * Moves caret to the end of contentEditable element
   *
   * @param {HTMLElement} element - contentEditable element
   */
  moveCaretToEnd(element) {
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

module.exports = Checklist;
