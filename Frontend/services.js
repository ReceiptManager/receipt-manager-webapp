import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import { setPassiveTouchGestures } from "./node_modules/@polymer/polymer/lib/utils/settings.js";
import "./node_modules/@polymer/paper-input/paper-input.js";
import './node_modules/@polymer/paper-listbox/paper-listbox.js';
import './node_modules/@polymer/paper-dialog/paper-dialog.js';
import './node_modules/@polymer/paper-toast/paper-toast.js';
import {Workbox} from 'https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-window.prod.mjs';

class MainElement extends LitElement {
  static get properties() {
    return {
      workBox: Object
    };
  }

  registerServiceWorkers() {
    if ('serviceWorker' in navigator) 
    {
      this.workBox = new Workbox('/service-worker.js');

      this.workBox.addEventListener('waiting', () => this.showUpdateBar());

      this.workBox.register()
    }
  }

  toggleUpdate() {
    this.workBox.messageSkipWaiting()
    window.location.reload()
  }

  showUpdateBar() {
    mainPage.shadowRoot.getElementById('updateToast').open();
  }

  render() {
    return html`
      `;
  }

  updated() {
    servicesPage = this;
  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
    this.registerServiceWorkers();
  }

  static get styles() {
    return css`
      .mainContainer
      {
        font-family: Roboto;
        width: calc(100% - 25px);
        padding-left: 25px;
        padding-bottom: 10px;
        margin-top: 80px;
        position: absolute;
        z-index: -1;
      }

      .settings
      {
        padding-top: 1px;
        border-bottom-style: dotted;
        border-color: dimgray;
        width: calc(100% - 60px);
        font-size: 18px;
      }

      .version
      {
        font-family: 'Roboto';
        margin-top: 10px;
        margin-left: 10px;
        font-size: 10px;
      }
      
      .updateToast {
          --paper-toast-background-color: green;
        }

    `;
  }

}

customElements.define('services-element', MainElement);