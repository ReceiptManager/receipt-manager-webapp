import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings.js';
import "./node_modules/@polymer/paper-input/paper-input.js";
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
    }, 2000);
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
            
            <paper-input id="backendHostname" label="Backend Hostname" @change=${e => this.triggerUpdate(e, this)} value="${settings['backendHostname']}" @keyup=${e => closeMobileKeyboard(e, this, "backendHostname")}></paper-input>
            <paper-input disabled id="backendIP" label="Backend IP" @change=${e => this.triggerUpdate(e, this)} value="${settings['backendIP']}" @keyup=${e => closeMobileKeyboard(e, this, "backendIP")}></paper-input>
            <paper-input disabled id="backendPort" label="Backend Port" @change=${e => this.triggerUpdate(e, this)} value="${settings['backendPort']}" @keyup=${e => closeMobileKeyboard(e, this, "backendPort")}></paper-input>
            <paper-input disabled id="backendToken" label="Backend Token" @change=${e => this.triggerUpdate(e, this)} value="${settings['backendToken']}" @keyup=${e => closeMobileKeyboard(e, this, "backendToken")}></paper-input>
            <paper-dropdown-menu-light id="language" label="${translated.inputLabels.lbl_language}" @selected-item-changed=${e => this.triggerUpdate(e, this)} value="${settings['language']}">
              <paper-listbox slot="dropdown-content">
                <paper-item>de-DE</paper-item>
                <paper-item>en-GB</paper-item>
                <paper-item>en-US</paper-item>
                <paper-item>fr-FR</paper-item>
                <paper-item>es-ES</paper-item>
              </paper-listbox>
            </paper-dropdown-menu-light>

        </vaadin-accordion-panel>
        <vaadin-accordion-panel theme="reverse">

            <div slot="summary" class="accordionText">Parser</div>
            <paper-input label="Parser IP" auto-validate id="parserIP" pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$" @change=${e => this.triggerUpdate(e, this)} value="${settings['parserIP']}" @keyup=${e => closeMobileKeyboard(e, this, "parserIP")}></paper-input>
            <paper-input type="number" label="Parser Port" id="parserPort" @change=${e => this.triggerUpdate(e, this)} value="${settings['parserPort']}" @keyup=${e => closeMobileKeyboard(e, this, "parserPort")}></paper-input>
            <paper-input label="Parser Token" id="parserToken" @change=${e => this.triggerUpdate(e, this)} value="${settings['parserToken']}" @keyup=${e => closeMobileKeyboard(e, this, "parserToken")}></paper-input>

        </vaadin-accordion-panel>
        <vaadin-accordion-panel theme="reverse">

            <div slot="summary" class="accordionText">${translated.texts.lbl_database}</div>
              <paper-dropdown-menu-light id="dbMode" label="DB Mode"  @selected-item-changed=${e => this.triggerUpdate(e, this)} value="${settings['dbMode']}">
                <paper-listbox slot="dropdown-content">
                  <paper-item>mssql</paper-item>
                  <paper-item>mysql</paper-item>
                </paper-listbox>
              </paper-dropdown-menu-light>
              <paper-input auto-validate id="sqlServerIP" label="SQL Server IP" pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$" @change=${e => this.triggerUpdate(e, this)} value="${settings['sqlServerIP']}" @keyup=${e => closeMobileKeyboard(e, this, "sqlServerIP")}></paper-input>
              <paper-input id="sqlServerDatabase" label="SQL Database" @change=${e => this.triggerUpdate(e, this)} value="${settings['sqlDatabase']}" @keyup=${e => closeMobileKeyboard(e, this, "sqlServerDatabase")}></paper-input>
              <paper-input id="sqlServerUsername" label="SQL Username" @change=${e => this.triggerUpdate(e, this)} value="${settings['sqlUsername']}" @keyup=${e => closeMobileKeyboard(e, this, "sqlServerUsername")}></paper-input>
              <paper-input id="sqlServerPassword" label="SQL Password" @change=${e => this.triggerUpdate(e, this)} value="${settings['sqlPassword']}" @keyup=${e => closeMobileKeyboard(e, this, "sqlServerPassword")}></paper-input>
        </vaadin-accordion-panel>
      </vaadin-accordion>
    
      <div class="version">Version: ${version}</div>
    </div>

    <paper-toast class="fit-bottom" id="updateToast" duration="0" text="${translated.toasts.lbl_settingsChanged}">
          <paper-button id="updateButton" class="yellow-button" @click=${() => this.updateConfig(this)}>${translated.buttons.lbl_save}</paper-button>
          <paper-button id="cancelButton" class="yellow-button" @click=${() => this.shadowRoot.getElementById('updateToast').close()}>${translated.buttons.lbl_abort}</paper-button>
    </paper-toast>
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