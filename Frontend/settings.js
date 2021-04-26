import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings.js';
import "./node_modules/@polymer/paper-input/paper-input.js";
import './node_modules/@polymer/paper-listbox/paper-listbox.js';
import './node_modules/@polymer/paper-dialog/paper-dialog.js';
import './node_modules/@polymer/paper-toast/paper-toast.js';
import {loadSettings, translated}  from './functions.js';

class MainElement extends LitElement {
  static get properties() {
    return {
    };
  }


  render() {

    return html `
    <div class="mainContainer" id="mainContainerHistory">
      <paper-icon-item class="settings"  @click=${() => location.reload()}>
          <iron-icon icon="refresh" slot="item-icon"></iron-icon>
          <paper-item-body>
            <div>${translated.texts.lbl_clearCache}</div>
          </paper-item-body>
        </paper-icon-item>
        <paper-icon-item class="settings"  @click=${() => window.open('./ssl/ca.crt')}>
        <iron-icon icon="https" slot="item-icon"></iron-icon>
        <paper-item-body>
          <div>${translated.texts.lbl_certDownload}</div>
        </paper-item-body>
      </paper-icon-item>
    
    <div class="version">Version: ${version}</div>
    </div>
      `
  }

  updated ()
  {
    settingsPage = this
  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
    loadSettings(this, "settings")
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
    `;
  }
}

customElements.define('settings-element', MainElement);