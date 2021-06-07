import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import { setPassiveTouchGestures } from "./node_modules/@polymer/polymer/lib/utils/settings.js";
import './node_modules/@polymer/paper-item/paper-item.js';
import './node_modules/@polymer/paper-item/paper-icon-item.js';
import './node_modules/@polymer/paper-listbox/paper-listbox.js';
import './node_modules/@polymer/paper-spinner/paper-spinner.js';
import './node_modules/@polymer/paper-toast/paper-toast.js';
import './node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import './node_modules/@polymer/iron-icon/iron-icon.js';
import './node_modules/@polymer/iron-icons/iron-icons.js';
import './node_modules/@polymer/iron-icons/maps-icons.js';
import './node_modules/@polymer/app-layout/app-layout.js';
import './node_modules/@polymer/paper-tabs/paper-tabs.js';
import './node_modules/@polymer/paper-tabs/paper-tab.js';
import { closeDrawer, openDrawer, setMenuIcon, menuIcon, chooseAddMode, setOpenPage, loadTranslations, translated, showBackground, addItem, addStoreFromScan, deleteReceipt } from './functions.js';
import './scann.js';
import './history.js';
import './addCategory.js';
import './addStore.js';
import './settings.js';

class MainElement extends LitElement {
  static get properties() {
    return {
      menuMode: String,
      selectedMenu: String,
      copyID: Number,
      inputMode: Boolean,
    };
  }

  openSelectedWindow(mode) {
    this.inputMode = false
    this.shadowRoot.getElementById("drawer").close();
    this.menuMode = mode;
    setOpenPage(mode);

    if (mode == "scan") {
      this.shadowRoot.getElementById("addButton").style.display = "none";
      this.selectedMenu = "0";
    } else if (mode == "history") {
      this.shadowRoot.getElementById("addButton").style.display = "none";
      this.selectedMenu = "1";
    } else if (mode == "addCategory") {
      this.shadowRoot.getElementById("addButton").style.display = null;
      this.selectedMenu = "2";
    } else if (mode == "addStore") {
      this.shadowRoot.getElementById("addButton").style.display = null;
      this.selectedMenu = "3";
    } else if (mode == "settings") {
      this.shadowRoot.getElementById("addButton").style.display = "none";
      this.selectedMenu = "4";
    }
  }
  
  getCurrentRoot()
  {
    if (!this.menuMode ||this.menuMode == "scan")
    {
      return scanPage
    }
    else if (this.menuMode == "history")
    {
      return historyPage
    }
    else
    {
      return null
    }
  }

  triggerDialog(elementId) 
  {
    let dialogState = this.shadowRoot.getElementById(elementId).ariaHidden
  
    if (dialogState == "true")
    {
        showBackground();
    }
  }

  render() {
    return html`

    ${translated ? html`
      
          <paper-spinner id="loadingSpinner" class="loadingSpinner"></paper-spinner>
          <div class="bodyContainer" id="bodyContainer" style="opacity: 100%">
            <app-header reveals>
            <app-toolbar class="appToolbar">
              <paper-icon-button icon="${menuIcon}" id="menuButton" @click="${() => openDrawer(this)}"></paper-icon-button>
              <div main-title>${translated.title}</div>
              <paper-icon-button style="display: none" icon="add-circle" id="addButton" @click="${() => chooseAddMode(this)}"></paper-icon-button>
            </app-toolbar>
          </app-header>
          <app-drawer swipeOpen id="drawer" @app-drawer-transitioned="${() => closeDrawer(this)}">
            <paper-listbox selected="${this.selectedMenu}">
              <paper-icon-item @click=${() => this.openSelectedWindow("scan")}><iron-icon icon="receipt" slot="item-icon"></iron-icon>${translated.menu.lbl_scan}</paper-icon-item>
              <paper-icon-item @click=${() => this.openSelectedWindow("history")}><iron-icon icon="update" slot="item-icon"></iron-icon>${translated.menu.lbl_history}</paper-icon-item>
              <paper-icon-item @click=${() => this.openSelectedWindow("addCategory")}><iron-icon icon="add-shopping-cart" slot="item-icon"></iron-icon>${translated.menu.lbl_categories}</paper-icon-item>
              <paper-icon-item @click=${() => this.openSelectedWindow("addStore")}><iron-icon icon="maps:add-location" slot="item-icon"></iron-icon>${translated.menu.lbl_stores}</paper-icon-item>
              <paper-icon-item @click=${() => this.openSelectedWindow("settings")}><iron-icon icon="settings" slot="item-icon"></iron-icon>${translated.menu.lbl_settings}</paper-icon-item>
            </paper-listbox>
          </app-drawer>
          
          ${this.menuMode == "scan" || !this.menuMode ? html`<scan-element id="mainElement"></scan-element>`: html``}
          
          ${this.menuMode == "history" ? html`<history-element id="mainElement"></history-element>`: html``}

          ${this.menuMode == "addCategory" ? html`<addcategory-element id="mainElement"></addcategory-element>` : html``}
          
          ${this.menuMode == "addStore" ? html`<addstore-element id="mainElement"></addstore-element>` : html``}

          ${this.menuMode == "settings" ? html`<settings-element id="mainElement"></settings-element>` : html``}

          ${this.inputMode ?
            html `
              <app-header class="appMenu" id="appMenu" fixed>
                <paper-tabs selected="0" id="menuTabs" style="background-color: white">
                  <paper-tab><iron-icon icon="icons:done"></iron-icon></paper-tab>
                  <paper-tab><iron-icon icon="icons:add-circle"></iron-icon></paper-tab>
                  <paper-tab><iron-icon icon="icons:delete"></iron-icon></paper-tab>
                </paper-tabs>
              </app-header>
            `: html ``
            }
        </div>

        <!-- On event elements -->
        <paper-dialog id="copyLine" class="copyLine" @opened-changed=${() => this.triggerDialog("copyLine")}>
            <div class="dialogText" style="margin-left: 10px; font-size: 15px;">${translated.texts.lbl_copyLine}</div>
            <div class="buttons">
              <paper-button dialog-confirm @click=${() => showBackground()}>${translated.buttons.lbl_close}</paper-button>  
              <paper-button @click=${() => addItem(false, this.copyID, this.getCurrentRoot())}>${translated.buttons.lbl_no}</paper-button>
              <paper-button @click=${() => addItem(true, this.copyID, this.getCurrentRoot())}>${translated.buttons.lbl_yes}</paper-button>
            </div>
        </paper-dialog>

        <paper-dialog id="addStore" class="addStoreDialog" @opened-changed=${() => this.triggerDialog("addStore")}>
          <paper-input class="addStoreInput" required="true" id="newStore" label="${translated.inputLabels.lbl_newStore}"></paper-input>
          <div class="buttons">
            <paper-button dialog-confirm @click=${() => showBackground()}>${translated.buttons.lbl_close}</paper-button>  
            <paper-button @click=${() => addStoreFromScan(scanPage)}>${translated.buttons.lbl_save}</paper-button>
          </div>
        </paper-dialog>

        <paper-toast class= "uploadToast fit-bottom" id="uploadToast" duration="5000" text="${translated.toasts.lbl_startUpload}"></paper-toast>
        <paper-toast class="fit-bottom" id="updateToast" duration="0" text="${translated.toasts.lbl_newVersion}">
          <paper-button id="updateButton" class="yellow-button" @click=${() => servicesPage.toggleUpdate()}>UPDATE</paper-button>
        </paper-toast>

        <paper-dialog id="deleteReceipt" class="deleteReceiptDialog" @opened-changed=${() => this.triggerDialog("deleteReceipt")}>
          <div class="deleteReciptText">${translated.texts.lbl_deleteReceipt}</div>
          <div class="buttons">
            <paper-button dialog-confirm @click=${() => showBackground()}>${translated.buttons.lbl_abort}</paper-button>  
            <paper-button @click=${() => deleteReceipt(this, historyPage.openedReceiptId)}>${translated.buttons.lbl_yes}</paper-button>
          </div>
        </paper-dialog>
        
      ` : html`<paper-spinner id="loadingSpinner" class="loadingSpinner" active></paper-spinner>`}
      `;
  }

  updated() {
    mainPage = this;
  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
    loadTranslations();
    this.selectedMenu = "0";
    setMenuIcon("menu");
  }

  static get styles() {
    return css`
        .appMenu {
          --paper-tabs-selection-bar-color: #333366;
          --paper-tab-ink: #333366;
          bottom: 28px;
          top: unset;
          height: 20px;
          z-index: -1;
        }

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

        .appToolbar {
          font-family: Roboto;
          background-color: #333366;
          border-radius: 0px 0px 20px 20px;      
          color: white;
        }

        app-header {
          position: fixed;
          top: 0; 
          left: 0;
          width: 100%;
          height: 100px;
        }

        .bodyContainer {
          inset: 0px;
          width: 100%;
          position: absolute;
          background-color: rgba(255,255,255,200);
          z-index: 2;
          opacity: 20%;
        }

        .deleteReciptText {
          margin-left: 10px;
        }

        .yellow-button {
          text-transform: none;
          color: #eeff41;
        }

        paper-toast {
          text-align: center;
          font-family: Roboto;
        }
        `;
  }

}

customElements.define('main-element', MainElement);