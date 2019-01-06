![](https://badgen.net/badge/CodeX%20Editor/v2.0/blue)

# Checklist Tool for CodeX Editor

This Tool for the [CodeX Editor](https://ifmo.su/editor) allows you to add  checklists to your texts.

![](https://capella.pics/2d3bb910-9693-423d-b560-bca89016810e.jpg)

## Installation

### Install via NPM

Get the package

```shell
npm i --save-dev codex.editor.checklist
```

Include module at your application

```javascript
const List = require('codex.editor.checklist');
```

### Download to your project's source dir

1. Upload folder `dist` from repository
2. Add `dist/bundle.js` file to your page.

### Load from CDN

You can load specific version of package from [jsDelivr CDN](https://www.jsdelivr.com/package/npm/codex.editor.checklist).

`https://cdn.jsdelivr.net/npm/codex.editor.checklist@1.0.0`

Then require this script on page with CodeX Editor.

```html
<script src="..."></script>
```

## Usage

Add a new Tool to the `tools` property of the CodeX Editor initial config.

```javascript
var editor = CodexEditor({
  ...
  
  tools: {
    ...
    checklist: {
      class: Checklist,
      inlineToolbar: true,
    },
  }
  
  ...
});
```

## Config Params

This Tool has no config params


## Output data

| Field | Type       | Description                            |
| ----- | ---------- | -------------------------------------- |
| items | `object[]` | array of checklist's items             |


```json
{
    "type" : "checklist",
    "data" : {
        "items" : [
            {
              "text" : "This is a block-styled editor",
              "checked" : true
            },
            {
              "text" : "Clean output data",
              "checked" : false
            },
            {
              "text" : "Simple and powerful API",
              "checked" : true
            }
        ]
    }
}
```

