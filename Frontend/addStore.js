import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings.js';
import "./node_modules/@polymer/paper-input/paper-input.js";
import './node_modules/@polymer/paper-listbox/paper-listbox.js';
import './node_modules/@polymer/paper-dialog/paper-dialog.js';
import './node_modules/@polymer/paper-toast/paper-toast.js';
import {backendIP, backendPort, addStore, openSpinner, closeSpinner, loadSettings, translated, backendToken, webPrefix}  from './functions.js';

class MainElement extends LitElement {
  static get properties() {
    return {
      storesJson: Object,
    };
  }

  getStaticData(arrayName){
    openSpinner()
    var instance = this

    var xhr = new XMLHttpRequest();
    xhr.open("GET", webPrefix + backendIP + ":"+ backendPort + "/api/getValue?token=" + backendToken + "&getValuesFrom=" + arrayName, true);
    
    xhr.onload = function () {
      instance.storesJson = JSON.parse(xhr.response)
      closeSpinner()
    }

    xhr.send();
  }

  deleteStore(storeId)
  {
    var instance = this
    var xhr = new XMLHttpRequest();
    xhr.open("POST", webPrefix + backendIP + ":"+ backendPort + "/api/deleteValue?token=" + backendToken + "&tableName=stores&id=" + storeId, true);
    
    xhr.onload = function () {
      instance.shadowRoot.getElementById("deleteToastDone").open()
      instance.getStaticData("stores")
      instance.requestUpdate()
    }

    xhr.send();
  }

  render() {

    return html `
      ${this.storesJson
        ? html `
          <div class="mainContainer" id="mainContainer">
            ${this.storesJson["values"].map(store => {

                var storeName
                if (!store.name)
                {
                  storeName = ""
                }
                else
                {
                  storeName = store.name
                }

                return html `
                  <paper-input class="store" id="store${store.id}" label="${translated.inputLabels.lbl_store}" value="${storeName}" @keyup=${e => addStore(e, this, store.id)}></paper-input>
                  <paper-icon-button class="deleteButton" icon="delete" @click=${() => this.deleteStore(store.id)}></paper-icon-button>
                
                `
            })}
        </div>
        ` : html `<paper-spinner id="loadingSpinner" class="loadingSpinner" active></paper-spinner>`
      }
      <paper-toast class= "uploadToast fit-bottom" id="uploadToastDone" duration="2500" text="Kategorie gespeichert!"></paper-toast>
      <paper-toast class= "uploadToast fit-bottom" id="deleteToastDone" duration="2500" text="Kategorie gelöscht!"></paper-toast>
      `
  }

  updated ()
  {
    addStorePage = this
  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
    loadSettings(this, "addStore")
  }

  static get styles() {
    return css`
      .loadingSpinner {
        position: absolute;
        top: 50%;
        left: 50%;
        margin-top: -20px;
        margin-left: -25px;
        width: 50px;
        height: 50px;
        text-align: center;
        font-size: 10px;
      }

      .mainContainer {
        width: calc(100% - 25px);
        padding-left: 25px;
        padding-bottom: 10px;
        margin-top: 70px;
        position: absolute;
        z-index: -1;
      }

      .store 
      {
        width: calc(100% - 55px);
        display: inline-block;
      }
      
      .deleteButton {
        margin-top: 22px;
        position: absolute;
      }
      
      .uploadToast {
        --paper-toast-background-color: green;
      }
    `;
  }
}

customElements.define('addstore-element', MainElement);