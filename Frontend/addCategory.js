import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings.js';
import "./node_modules/@polymer/paper-input/paper-input.js";
import './node_modules/@polymer/paper-listbox/paper-listbox.js';
import './node_modules/@polymer/paper-dialog/paper-dialog.js';
import './node_modules/@polymer/paper-toast/paper-toast.js';
import {backendIP, backendPort, addCategory, openSpinner, closeSpinner, loadSettings, translated, backendToken, webPrefix}  from './functions.js';

class MainElement extends LitElement {
  static get properties() {
    return {
      categoriesJson: Object,
    };
  }

  getStaticData(arrayName){
    openSpinner()
    var instance = this

    var xhr = new XMLHttpRequest();
    xhr.open("GET", webPrefix + backendIP + ":"+ backendPort + "/api/getValue?token=" + backendToken + "&getValuesFrom=" + arrayName, true);
    
    xhr.onload = function () {
      instance.categoriesJson = JSON.parse(xhr.response)
      closeSpinner()
    }

    xhr.send();
  }

  deleteCategory(catId)
  {
    var instance = this
    var xhr = new XMLHttpRequest();
    xhr.open("POST", webPrefix + backendIP + ":"+ backendPort + "/api/deleteValue?token=" + backendToken + "&tableName=categories&id=" + catId, true);
    
    xhr.onload = function () {
      instance.shadowRoot.getElementById("deleteToastDone").open()
      instance.getStaticData("categories")
      instance.requestUpdate()
    }

    xhr.send();
  }

  render() {

    return html `
      ${this.categoriesJson
        ? html `
          <div class="mainContainer" id="mainContainer">
            ${this.categoriesJson["values"].map(category => {

                var categoryName
                if (!category.name)
                {
                  categoryName = ""
                }
                else
                {
                  categoryName = category.name
                }

                return html `
                  <paper-input class="category" id="category${category.id}" label="${translated.inputLabels.lbl_category}" value="${categoryName}" @keyup=${e => addCategory(e, this, category.id)}></paper-input>
                  <paper-icon-button class="deleteButton" icon="delete" @click=${() => this.deleteCategory(category.id)}></paper-icon-button>
                
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
    addCategoryPage = this
  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
    loadSettings(this, "addCategory")
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

      .category 
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

customElements.define('addcategory-element', MainElement);