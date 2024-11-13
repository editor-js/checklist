![](https://badgen.net/badge/Editor.js/v2.0/blue)

# Checklist Tool for Editor.js

> [!IMPORTANT]
> This repository is deprecated and is no longer supported.
Take a look at a new repository [List tool](https://github.com/editor-js/list) with more functionality and compatibility with old data.

![](assets/68747470733a2f2f636170656c6c612e706963732f66303939646439622d313332312d343766362d623965312d3937666331656634306236612e6a7067.jpeg)

## Installation

Get the package

```shell
yarn add @editorjs/checklist
```

Include module at your application

```javascript
import Checklist from '@editorjs/checklist'
```

Optionally, you can load this tool from CDN [JsDelivr CDN](https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest)

## Usage

Add a new Tool to the `tools` property of the Editor.js initial config.

```javascript
var editor = EditorJS({
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

