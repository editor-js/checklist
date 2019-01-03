/**
 * Build styles
 */
require('./index.css').toString();

/**
 * @typedef {object} ChecklistData
 * @property {array} items - li elements
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
    this._elements.wrapper = this._make('div', [this.CSS.baseBlock, this.CSS.wrapper], {
      contentEditable: true
    });

    // fill with data
    if (this._data.items.length) {
      this._data.items.forEach(item => {
        this.createChecklistItem(item);
      });
    } else {
      this.createChecklistItem();
    }

    // detect keydown on the last item to escape List
    this._elements.wrapper.addEventListener('keydown', (event) => {
      const [ENTER, BACKSPACE, A] = [13, 8, 65]; // key codes
      const cmdPressed = event.ctrlKey || event.metaKey;

      switch (event.keyCode) {
        case ENTER:
          this.getOutofList(event);
          break;
        case BACKSPACE:
          this.backspace(event);
          break;
        case A:
          if (cmdPressed) {
            this.selectItem(event);
          }
          break;
      }
    }, false);

    return this._elements.wrapper;
  }

  /**
   * Create Checklist items
   * @param {ChecklistData} item - data.item
   */
  createChecklistItem(item = {}) {
    const checkListItem = this._make('div', this.CSS.item);
    const fakeCheckBox = this._make('label', this.CSS.fakeCheckBox);
    const checkBox = this._make('input', this.CSS.checkbox, {
      type: 'checkbox', checked: item.checked ? item.checked : false
    });
    const textField = this._make('div', this.CSS.textField, {innerHTML: item.text ? item.text : ''});

    if (item.checked) {
      checkListItem.classList.add(this.CSS.itemChecked);
    }

    checkListItem.appendChild(checkBox);
    checkListItem.appendChild(fakeCheckBox);
    checkListItem.appendChild(textField);

    fakeCheckBox.addEventListener('click', () => {
      checkListItem.classList.toggle(this.CSS.itemChecked);
      checkBox.checked = !checkBox.checked;
    });

    this._elements.wrapper.appendChild(checkListItem);
  }

  /**
   * Get out from List Tool
   * by Enter on the empty last item
   * @param {KeyboardEvent} event
   */
  getOutofList(event) {

    const items = this._elements.wrapper.querySelectorAll('.' + this.CSS.item);

    /**
     * Save the last one.
     */
    if (items.length < 2) {
      this.createChecklistItem();
      return;
    }

    const lastItem = items[items.length - 1].querySelector('.' + this.CSS.textField);
    const currentNode = window.getSelection().anchorNode;
    const lastItemText = lastItem.innerHTML.replace('<br>', ' ').trim();


    /** Prevent Default li generation if item is empty */
    if (currentNode === lastItem && !lastItemText) {

      /** Insert New Block and set caret */
      this.api.blocks.insertNewBlock();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.createChecklistItem();
  }

  /**
   * Handle backspace
   * @param {KeyboardEvent} event
   */
  backspace(event) {
    const items = this._elements.wrapper.querySelectorAll('.' + this.CSS.item),
      firstItem = items[0];

    if (!firstItem) {
      return;
    }

    /**
     * Save the last one.
     */
    if (items.length < 2 && !firstItem.innerHTML.replace('<br>', ' ').trim()) {
      event.preventDefault();
    }
  }

  /**
   * Select LI content by CMD+A
   * @param {KeyboardEvent} event
   */
  selectItem(event) {
    event.preventDefault();

    const selection = window.getSelection(),
      currentNode = selection.anchorNode.parentNode,
      currentItem = currentNode.closest('.' + this.CSS.item),
      range = new Range();

    range.selectNodeContents(currentItem);

    selection.removeAllRanges();
    selection.addRange(range);
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
      checkbox: 'cdx-checklist__checkbox',
      fakeCheckBox: 'cdx-checklist__fake-checkbox',
      textField: 'cdx-checklist__text'
    };
  }

  /**
   * Checklist data setter
   * @param {ChecklistData} checklistData
   */
  set data(checklistData) {
    if (!checklistData) {
      checklistData = {};
    }

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

    const items = this._elements.wrapper.querySelectorAll(`.${this.CSS.item}`);

    for (let i = 0; i < items.length; i++) {
      const value = items[i].querySelector(`.${this.CSS.textField}`).innerHTML.replace('<br>', ' ').trim();

      if (value) {
        this._data.items.push({
          text: value,
          checked: items[i].classList.contains(this.CSS.itemChecked)
        });
      }
    }

    return this._data;
  }

  /**
   * Helper for making Elements with attributes
   *
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
}

module.exports = Checklist;
