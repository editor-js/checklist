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
 * @property {array} items - checklist elements
 */

/**
 * Checklist Tool for the CodeX Editor 2.0
 */
class Checklist {
  /**
   * Allow to use native Enter behaviour
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
   * @return {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: '<svg width="17" height="13" viewBox="0 0 17 13" xmlns="http://www.w3.org/2000/svg"> <path d="M5.625 4.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm0-4.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm0 9.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm-4.5-5a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25zm0-4.85a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25zm0 9.85a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25z"/></svg>',
      title: 'Checklist'
    };
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {{data: ChecklistData, config: object, api: object}}
   *   data — previously saved data
   *   config - user config for Tool
   *   api - CodeX Editor API
   */
  constructor({data, config, api}) {
    /**
     * HTML nodes
     * @private
     */
    this._elements = {
      wrapper : null,
      items : []
    };

    /**
     * Tool's data
     * @type {ChecklistData}
     * */
    this._data = {
      items: []
    };

    this.api = api;
    this.data = data;
  }

  /**
   * Returns checklist tag with items
   * @return {Element}
   * @public
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
      const checkListItem = event.target.closest(`.${this.CSS.item}`);
      const checkbox = checkListItem.querySelector(`.${this.CSS.checkbox}`);

      if (event.target === checkbox) {
        checkListItem.classList.toggle(this.CSS.itemChecked);
      }
    });

    return this._elements.wrapper;
  }

  /**
   * Create Checklist items
   * @param {ChecklistData} item - data.item
   * @return {HTMLElement} checkListItem - new element of checklist
   */
  createChecklistItem(item = {}) {
    const checkListItem = this._make('div', this.CSS.item);

    const checkbox = this._make('span', this.CSS.checkbox);

    const textField = this._make('div', this.CSS.textField, {
      innerHTML: item.text ? item.text : '',
      contentEditable: true
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
    let currentItem = currentNode.parentNode.closest(`.${this.CSS.item}`);

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
   * @param {KeyboardEvent} event
   */
  backspace(event) {
    const currentItem = event.target.closest(`.${this.CSS.item}`);
    const currentIndex = this._elements.items.indexOf(currentItem);
    const currentItemText = currentItem.querySelector(`.${this.CSS.textField}`).innerHTML.replace('<br>', ' ').trim();
    const firstItem = this._elements.items[0];
    const firstItemText = firstItem.querySelector(`.${this.CSS.textField}`).innerHTML.replace('<br>', ' ').trim();

    if (!firstItemText ) {
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
      if (this._elements.items[currentIndex - 1]  !== 'undefined') {
        this.moveCaretToEnd(this._elements.items[currentIndex - 1].querySelector(`.${this.CSS.textField}`));
      }
    }
  }

  /**
   * @return {ChecklistData}
   * @public
   */
  save() {
    return this.data;
  }

  /**
   * Styles
   * @private
   */
  get CSS() {
    return {
      baseBlock: this.api.styles.block,
      wrapper: 'cdx-checklist',
      item: 'cdx-checklist__item',
      itemChecked: 'cdx-checklist__item--checked',
      checkbox: 'cdx-checklist__item-checkbox',
      textField: 'cdx-checklist__item-text'
    };
  }

  /**
   * Checklist data setter
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
   * @return {ChecklistData}
   */
  get data() {
    this._data.items = [];

    for (let i = 0; i < this._elements.items.length; i++) {
      const value = this._elements.items[i].querySelector(`.${this.CSS.textField}`).innerHTML.replace('<br>', ' ').trim();

      if (value) {
        this._data.items.push({
          text: value,
          checked: this._elements.items[i].classList.contains(this.CSS.itemChecked)
        });
      }
    }

    return this._data;
  }

  /**
   * Helper for making Elements with attributes
   * @param  {string} tagName           - new Element tag name
   * @param  {array|string} classNames  - list or name of CSS classname(s)
   * @param  {Object} attributes        - any attributes
   * @return {Element}
   */
  _make(tagName, classNames = null, attributes = {}) {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (let attrName in attributes) {
      el[attrName] = attributes[attrName];
    }

    return el;
  }

  /**
   * Moves caret to the end of contentEditable element
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
