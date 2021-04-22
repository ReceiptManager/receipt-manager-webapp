[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-checkbox.svg)](https://www.npmjs.com/package/@polymer/paper-checkbox)
[![Build status](https://travis-ci.org/PolymerElements/paper-checkbox.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-checkbox)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-checkbox)

## &lt;paper-checkbox&gt;

`paper-checkbox` is a button that can be either checked or unchecked. User can
tap the checkbox to check or uncheck it. Usually you use checkboxes to allow
user to select multiple options from a set. If you have a single ON/OFF option,
avoid using a single checkbox and use `paper-toggle-button` instead.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-checkbox),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-checkbox/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/paper-checkbox
```

### In an HTML file

```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-checkbox/paper-checkbox.js';
    </script>
  </head>
  <body>
    <paper-checkbox>Unchecked</paper-checkbox>
    <paper-checkbox checked>Checked</paper-checkbox>
    <paper-checkbox disabled>Disabled</paper-checkbox>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import '@polymer/paper-checkbox/paper-checkbox.js';

class ExampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-checkbox>Unchecked</paper-checkbox>
      <paper-checkbox checked>Checked</paper-checkbox>
      <paper-checkbox disabled>Disabled</paper-checkbox>
    `;
  }
}

customElements.define('example-element', ExampleElement);
```

## Contributing

If you want to send a PR to this element, here are the instructions for running
the tests and demo locally:

### Installation

```sh
git clone https://github.com/PolymerElements/paper-checkbox
cd paper-checkbox
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests

```sh
polymer test --npm
```
