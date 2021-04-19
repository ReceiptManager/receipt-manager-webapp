import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings.js';
import "./node_modules/@polymer/paper-input/paper-input.js";
import "./node_modules/@polymer/paper-button/paper-button.js";
import './node_modules/@polymer/paper-dropdown-menu/paper-dropdown-menu-light.js';
import './node_modules/@polymer/paper-item/paper-item.js';
import './node_modules/@polymer/paper-item/paper-icon-item.js'
import './node_modules/@polymer/paper-listbox/paper-listbox.js';
import './node_modules/@polymer/paper-dialog/paper-dialog.js';
import './node_modules/@polymer/paper-spinner/paper-spinner.js';
import './node_modules/@polymer/paper-toast/paper-toast.js';
import './node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import './node_modules/@polymer/iron-icon/iron-icon.js';
import './node_modules/@polymer/iron-icons/iron-icons.js';
import {updateResponseJson, addItem, deleteItem, activateDeleteMode, calcDifference, validateStore, validateDate, validateArticles, validateCategories, validateTotal, backendIP, backendPort, responseChanged, assumeArticleSum, openSpinner, closeSpinner, setMenuIcon, language}  from './functions.js';

class MainElement extends LitElement {
  static get properties() {
    return {
    };
  }

  render() {
    
    
  }

  updated ()
  {
  }

  constructor() {
    super();
  }

  static get styles() {
    return css`
    
    `;
  }

}

customElements.define('addstore-element', MainElement);