import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings.js';
import "./node_modules/@vaadin/vaadin-text-field/vaadin-text-field.js";
import "./node_modules/@vaadin/vaadin-combo-box/vaadin-combo-box.js"
import "./node_modules/@vaadin/vaadin-text-field/vaadin-password-field.js";
import './node_modules/@polymer/paper-listbox/paper-listbox.js';
import './node_modules/@polymer/paper-dialog/paper-dialog.js';
import './node_modules/@polymer/paper-toast/paper-toast.js';
import './node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import './node_modules/@vaadin/vaadin-accordion/vaadin-accordion.js'
import {loadSettings, translated, settings, webPrefix, backendToken, backendIP, backendPort, openSpinner, closeMobileKeyboard}  from './functions.js';

class MainElement extends LitElement {
  static get properties() {
    return {
      version: String,
    };
  }

  triggerUpdate(e, t)
  {
    if (e.type == "active-changed")
    {
      let toggleButtonState = t.shadowRoot.getElementById('useSSL').active
      
      if (typeof settings['useSSL'] == 'string')
      {
        toggleButtonState = toggleButtonState.toString()
      }

      if (toggleButtonState != settings['useSSL'])
      {
        t.shadowRoot.getElementById('updateToast').open()
      }
    }
    else
    {
      t.shadowRoot.getElementById('updateToast').open()
    } 
  }

  updateConfig(t) 
  {
    var nuseSSL = t.shadowRoot.getElementById('useSSL').active
    var nbackendHostname = t.shadowRoot.getElementById('backendHostname').value
    var nbackendIP = t.shadowRoot.getElementById('backendIP').value
    var nbackendPort = t.shadowRoot.getElementById('backendPort').value
    var nlanguage = t.shadowRoot.getElementById('language').value
    var nparserIP = t.shadowRoot.getElementById('parserIP').value
    var nparserPort = t.shadowRoot.getElementById('parserPort').value
    var nparserToken = t.shadowRoot.getElementById('parserToken').value
    var ndbMode = t.shadowRoot.getElementById('dbMode').value
    var nsqlServerIP = t.shadowRoot.getElementById('sqlServerIP').value
    var nsqlServerDatabase = t.shadowRoot.getElementById('sqlServerDatabase').value
    var nsqlServerUsername = t.shadowRoot.getElementById('sqlServerUsername').value
    var nsqlServerPassword = t.shadowRoot.getElementById('sqlServerPassword').value

    var xhr = new XMLHttpRequest();
    xhr.open("POST", webPrefix + backendIP + ":" + backendPort + "/api/updateConfig?token=" + backendToken)
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")

    if (nbackendPort && typeof nbackendPort == "string")
    {
      nbackendPort = parseInt(nbackendPort)
    }

    if (nparserPort && typeof nparserPort == "string")
    {
      nparserPort = parseInt(nparserPort)
    }

    var post_json = {"useSSL": nuseSSL, "backendHostname": nbackendHostname, "backendIP": nbackendIP, "backendPort": nbackendPort, "backendLanguage": nlanguage, "parserIP": nparserIP, "parserPort": nparserPort, 
                     "parserToken": nparserToken, "dbMode": ndbMode,"sqlServerIP": nsqlServerIP, "sqlDatabase": nsqlServerDatabase, "sqlUsername": nsqlServerUsername, "sqlPassword": nsqlServerPassword} 
    
    xhr.send(JSON.stringify(post_json));

    openSpinner()

    setTimeout(function() {
      location.reload()
    }, 2500);
  }

  render() {
    return html `
    <div class="mainContainer" id="mainContainerHistory">

      <vaadin-accordion>
        <vaadin-accordion-panel theme="reverse">
          <div slot="summary" class="accordionText">${translated.texts.lbl_actions}</div>
                <paper-icon-item class="settings"  @click=${() => location.reload()}>
                  <iron-icon icon="refresh" slot="item-icon"></iron-icon>
                  <paper-item-body>
                    <div>${translated.texts.lbl_clearCache}</div>
                  </paper-item-body>
                </paper-icon-item>
                <paper-icon-item class="settings"  @click=${() => window.open('./ssl/ca.crt')}>
                  <iron-icon icon="get-app" slot="item-icon"></iron-icon>
                  <paper-item-body>
                    <div>${translated.texts.lbl_certDownload}</div>
                  </paper-item-body>
                </paper-icon-item>

        </vaadin-accordion-panel>
        <vaadin-accordion-panel theme="reverse">

            <div slot="summary" class="accordionText">Backend</div>

            ${settings['useSSL']
            ? html `
              <paper-toggle-button checked id="useSSL" @active-changed=${e => this.triggerUpdate(e, this)}>${translated.texts.lbl_useSSL}</paper-toggle-button>
              ` 
              : html `
              <paper-toggle-button id="useSSL" @active-changed=${e => this.triggerUpdate(e, this)}>${translated.texts.lbl_useSSL}</paper-toggle-button>
              `
            }
            
            <vaadin-text-field class="inputFields" id="backendHostname" label="Backend Hostname" @change=${e => this.triggerUpdate(e, this)} value="${settings['backendHostname']}" @keyup=${e => closeMobileKeyboard(e, this, "backendHostname")}></vaadin-text-field>
            <vaadin-text-field disabled class="inputFields" id="backendIP" label="Backend IP" @change=${e => this.triggerUpdate(e, this)} value="${settings['backendIP']}" @keyup=${e => closeMobileKeyboard(e, this, "backendIP")}></vaadin-text-field>
            <vaadin-text-field disabled class="inputFields" id="backendPort" label="Backend Port" @change=${e => this.triggerUpdate(e, this)} value="${settings['backendPort']}" @keyup=${e => closeMobileKeyboard(e, this, "backendPort")}></vaadin-text-field>
            <vaadin-password-field disabled class="inputFields" id="backendToken" label="Backend Token" @change=${e => this.triggerUpdate(e, this)} value="${settings['backendToken']}" @keyup=${e => closeMobileKeyboard(e, this, "backendToken")}></vaadin-password-field>
            <vaadin-combo-box class="inputFields" auto-open-disabled clear-button-visible id="language" label="${translated.inputLabels.lbl_language}" @change=${e => this.triggerUpdate(e, this)} value="${settings['language']}"></vaadin-combo-box>

        </vaadin-accordion-panel>
        <vaadin-accordion-panel theme="reverse">

            <div slot="summary" class="accordionText">Parser</div>
            <vaadin-text-field class="inputFields" label="Parser IP" auto-validate id="parserIP" pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$" @change=${e => this.triggerUpdate(e, this)} value="${settings['parserIP']}" @keyup=${e => closeMobileKeyboard(e, this, "parserIP")}></vaadin-text-field>
            <vaadin-text-field class="inputFields" type="number" label="Parser Port" id="parserPort" @change=${e => this.triggerUpdate(e, this)} value="${settings['parserPort']}" @keyup=${e => closeMobileKeyboard(e, this, "parserPort")}></vaadin-text-field>
            <vaadin-password-field class="inputFields" label="Parser Token" id="parserToken" @change=${e => this.triggerUpdate(e, this)} value="${settings['parserToken']}" @keyup=${e => closeMobileKeyboard(e, this, "parserToken")}></vaadin-password-field>

        </vaadin-accordion-panel>
        <vaadin-accordion-panel theme="reverse">

            <div slot="summary" class="accordionText">${translated.texts.lbl_database}</div>
              <vaadin-combo-box class="inputFields" auto-open-disabled clear-button-visible id="dbMode" label="${translated.texts.lbl_database}" @change=${e => this.triggerUpdate(e, this)} value="${settings['dbMode']}"></vaadin-combo-box>
              <vaadin-text-field class="inputFields" auto-validate id="sqlServerIP" label="SQL Server IP" pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$" @change=${e => this.triggerUpdate(e, this)} value="${settings['sqlServerIP']}" @keyup=${e => closeMobileKeyboard(e, this, "sqlServerIP")}></vaadin-text-field>
              <vaadin-text-field class="inputFields" id="sqlServerDatabase" label="SQL Database" @change=${e => this.triggerUpdate(e, this)} value="${settings['sqlDatabase']}" @keyup=${e => closeMobileKeyboard(e, this, "sqlServerDatabase")}></vaadin-text-field>
              <vaadin-text-field class="inputFields" id="sqlServerUsername" label="SQL Username" @change=${e => this.triggerUpdate(e, this)} value="${settings['sqlUsername']}" @keyup=${e => closeMobileKeyboard(e, this, "sqlServerUsername")}></vaadin-text-field>
              <vaadin-password-field class="inputFields" id="sqlServerPassword" type="password" label="SQL Password" @change=${e => this.triggerUpdate(e, this)} value="${settings['sqlPassword']}" @keyup=${e => closeMobileKeyboard(e, this, "sqlServerPassword")}></vaadin-password-field>
        </vaadin-accordion-panel>
      </vaadin-accordion>
    
      <div class="version">Version: ${version}</div>
    </div>

    <paper-toast class="fit-bottom" id="updateToast" duration="0" text="${translated.toasts.lbl_settingsChanged}">
          <paper-button id="updateButton" class="yellow-button" @click=${() => this.updateConfig(this)}>${translated.buttons.lbl_save}</paper-button>
          <paper-button id="cancelButton" class="yellow-button" @click=${() => this.shadowRoot.getElementById('updateToast').close()}>${translated.buttons.lbl_abort}</paper-button>
    </paper-toast>

    <paper-toast class="fit-bottom" id="dockerModeToast" duration="5000" text="${translated.toasts.lbl_dockerMode}"></paper-toast>
      `
  }

  updated ()
  {
    settingsPage = this

    customElements.whenDefined('vaadin-combo-box').then(function() {
      const comboBox = settingsPage.shadowRoot.querySelectorAll('vaadin-combo-box');
      comboBox[0].items = ['de-DE', 'en-GB', 'en-US', 'fr-FR', 'es-ES'];
      comboBox[1].items = ['mssql', 'mysql'];
    });
  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
    loadSettings(this, "settings")
  }

  static get styles() {
    return css`
      paper-dropdown-menu-light {
        width: 100%
      }

      .accordionText 
      {
        font-size: 18px;
        color: black;
      }

      .mainContainer
      {
        font-family: Roboto;
        width: calc(100% - 50px);
        padding-left: 25px;
        padding-bottom: 10px;
        margin-top: 80px;
        position: absolute;
        z-index: -1;
      }

      .settings
      {
        font-size: 16px;
      }

      .inputFields
      {
        width: 100%;
      }

      .version
      {
        font-family: 'Roboto';
        margin-top: 10px;
        font-size: 10px;
      }

      .yellow-button {
        text-transform: none;
        color: #eeff41;
        margin-right: 0px;
        padding-left: 0px;
        padding-right: 0px;
      }

      paper-toast {
        text-align: center;
        font-family: Roboto;
      }
    `;
  }
}

customElements.define('settings-element', MainElement);