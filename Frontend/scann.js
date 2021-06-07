import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import "./node_modules/@vaadin/vaadin-combo-box/vaadin-combo-box.js"
import "./node_modules/@vaadin/vaadin-text-field/vaadin-text-field.js"
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings.js';
import "./node_modules/@polymer/paper-input/paper-input.js";
import "./node_modules/@polymer/paper-button/paper-button.js";
import './node_modules/@polymer/paper-dropdown-menu/paper-dropdown-menu-light.js';
import './node_modules/@polymer/paper-item/paper-icon-item.js'
import './node_modules/@polymer/paper-listbox/paper-listbox.js';
import './node_modules/@polymer/paper-toast/paper-toast.js';
import './node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import './node_modules/@polymer/iron-icon/iron-icon.js';
import './node_modules/@polymer/iron-icons/iron-icons.js';
import {showReceipt, openDialog, validateCategories, validateStore, validateDate, validateTotal, validateArticles, updateResponseJson, calcDifference, assumeArticleSum, 
        validateTotalSum, triggerSelectedAction, formatDate, backendIP, backendPort, openSpinner, closeSpinner, closeMobileKeyboard, loadSettings, resetForm, manualInput, translated, backendToken, webPrefix, europeCountries, language} from './functions.js';

class ScanElement extends LitElement {
  static get properties() {
    return {
      responseJson: String,
      categoriesJson: String,
      storesJson: String,
      storedFile: Object,
      articleSum: Number,
      totalSum: String,
      differenceSum: Number,
      uploadedFile: Object,
      manualInput: Boolean,
      errorCode: String,
      errorText: String,
    };
  }


  getStaticData(arrayName){
    var instance = this

    var xhr = new XMLHttpRequest();
    xhr.open("GET", webPrefix + backendIP + ":"+ backendPort + "/api/getValue?token=" + backendToken + "&getValuesFrom=" + arrayName, true);
    
    if (arrayName == "categories")
    {
      xhr.onload = function () {
        if (xhr.status == 200)
        {
          instance.categoriesJson = JSON.parse(xhr.response)
        }
        else
        {
          instance.shadowRoot.getElementById("invalidToken").open()
        }
      }
    }
    else
    {
      xhr.onload = function () {
        if (xhr.status == 200)
        {
            instance.storesJson = JSON.parse(xhr.response)
        }
        else
        {
            instance.shadowRoot.getElementById("invalidToken").open()
        }
      }
    }

    xhr.send();
  }

checkValidAndSave(e)
{
    var storeValid = validateStore(this)
    if (!storeValid)
    {
      this.shadowRoot.getElementById("invalidStore").open()
      return
    }

    var dateValid = validateDate(this)
    if (!dateValid)
    {
      this.shadowRoot.getElementById("invalidDate").open()
      return
    }

    var categoriesValid = validateCategories(this)
    if (!categoriesValid)
    {
      this.shadowRoot.getElementById("invalidCategory").open()
      return
    }

    var sumsValid = validateArticles(this)
    if (!sumsValid)
    {
      this.shadowRoot.getElementById("invalidSums").open()
      return
    }

    var totalValid = validateTotal(this)
    if (!totalValid)
    {
        // Artikel summe und Bon Summe unterscheiden sich!
      this.shadowRoot.getElementById("differentSums").open()
      return
    }

    var totalSumValid = validateTotalSum(this)
    if (!totalSumValid)
    {
      this.shadowRoot.getElementById("invalidSumTotal").open()
      return
    }

    // Sende kassenbon an Backend für metabase
    var instance = this
    var xhr = new XMLHttpRequest();
    xhr.open("POST", webPrefix + backendIP + ":" + backendPort + "/api/writeReceiptToDB?token=" + backendToken)
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")

    xhr.onload = function () {
      if (xhr.status == 200)
      {
        instance.shadowRoot.getElementById("saveToDB").open()
        instance.responseJson = null
        instance.manualInput = null
        instance.storedFile = null
      }
      else
      {
        instance.errorCode = xhr.status
        instance.errorText = xhr.responseText
        instance.shadowRoot.getElementById("errorOnUpload").open()
      }

    }

    xhr.onerror = function () {
      instance.shadowRoot.getElementById("saveToDBError").open()
    }

    xhr.send(JSON.stringify(this.responseJson))
}

  uploadFile(e) {
    var instance = this

    //Reset form
    this.responseJson = null

    var uploadField = this.shadowRoot.getElementById("uploadedFile")
    this.uploadedFile = uploadField.inputElement.inputElement.files[0];
    var file = this.uploadedFile

    if (!file)
    {
      return
    }

    openSpinner()

    var formData = new FormData();
    formData.append("file", file, file.name);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", webPrefix + backendIP + ":" + backendPort + "/api/upload?token=" + backendToken + "&legacy_parser=True&grayscale_image=True&rotate_image=True", true);


    xhr.onerror = function () {
      console.error("Error with code " + xhr.status);
    };

    xhr.onload = function () {
      instance.storedFile = file
      instance.shadowRoot.getElementById("uploadToastDone").open()
      instance.shadowRoot.getElementById("uploadButton").disabled = null

      if (xhr.status == 200) {
        console.log("upload done");
        mainPage.inputMode = true
        var receiptJson = JSON.parse(xhr.response) 

        // Add id to items
        let arrayCnt = 0
        receiptJson["receiptItems"].map (item => {
            
          item.splice(0, 0, arrayCnt)

          arrayCnt++
        })

        instance.responseJson = receiptJson
        closeSpinner()
      } 
      else 
      {
        instance.errorCode = xhr.statusText
        closeSpinner()
        instance.shadowRoot.getElementById("errorOnUpload").open()
        instance.storedFile = null
        instance.shadowRoot.getElementById("uploadButton").disabled = null
      }
    };

    //Disable upload button
    this.shadowRoot.getElementById("uploadButton").disabled = true

    //Display toast
    mainPage.shadowRoot.getElementById("uploadToast").open()

    // Headers
    xhr.setRequestHeader("accept", "application/json"); 
    xhr.send(formData);
  }

  render() {

    if (this.responseJson)
    {
        if (!this.responseJson.storeName)
        {
          this.responseJson.storeName = ""
        }
        if (!this.responseJson.receiptTotal)
        {
          this.responseJson.receiptTotal = ""
        }
        if (this.responseJson.receiptDate == "null")
        {
          this.responseJson.receiptDate = ""
        }
    }

    // Set article sum empty
    this.articleSum = ""

    if (this.responseJson)
    {
      var itemsLength = this.responseJson["receiptItems"].length
      var itemCnt = 0
      var differenceCSS
    }

    if (this.responseJson)
    {
      var dateParts = this.responseJson.receiptDate.split(".");
      var hiddenDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]); 
    }

    return html`
    <div class="mainContainer" id="mainContainer">
      ${this.responseJson ? html`
  
            <paper-dropdown-menu-light class="storeDropdown" required="true" id="storeName" label="${translated.inputLabels.lbl_store}" value=${this.responseJson.storeName} @selected-item-changed=${() => updateResponseJson(null, "store", this)} noink noAnimations>
              <paper-listbox slot="dropdown-content">
                ${this.storesJson["values"].map(store => {
                  return html `<paper-item>${store.name}</paper-item>`
                })}
              </paper-listbox>
            </paper-dropdown-menu-light>
            <paper-icon-button icon="add-circle" class="addStore" @click=${() => openDialog(mainPage, "addStore")}></paper-icon-button>

            <paper-input type="date" label="${translated.inputLabels.lbl_date}" required="true" id="receiptDate" auto-validate pattern="^(0[1-9]|[12][0-9]|3[01])[.](0[1-9]|1[012])[.](19|20)[0-9]{2}$" value=${formatDate(hiddenDate)} @change=${() => updateResponseJson(null, "receiptDate", this)} @keyup=${e => closeMobileKeyboard(e, this, "receiptDate")}> 
            </paper-input>
        
          ${this.responseJson.receiptItems.map(item => {
            itemCnt++

            // calc article Sum
            if (item[2])
            {
              // Convert to flotable format
              var JsSum = item[2].replace(',','.')
              var actSum = this.articleSum.replace(',','.')

              if (!actSum)
              {
                actSum = 0
              }
              
              // Calc article sum
              this.articleSum = parseFloat(actSum) + parseFloat(JsSum)

              // Replace dot with comma
              if (europeCountries.includes(language))
              {
                this.articleSum = this.articleSum.toFixed(2).toString().replace('.',',')
              }
              else
              {
                this.articleSum = this.articleSum.toFixed(2)
              }
            }

            // Convert digits with dots in commas
            var itemSum = item[2]
            if (item[2].includes('.') && europeCountries.includes(language))
            {
              itemSum = item[2].replace('.',',')
            }

            this.totalSum = this.responseJson.receiptTotal
            if (this.totalSum.includes('.') && europeCountries.includes(language))
            {
              this.totalSum = this.totalSum.replace('.',',')
            }

            if (itemCnt == itemsLength)
            {
              calcDifference(this)
              if (this.differenceSum != 0.00)
              {
                differenceCSS = "differenceRed"
              }
              else
              {
                differenceCSS = "differenceGrey"
              }
            }

            if (!item[3])
            {
              item[3] = ""
            }

            return html `
            <div class="itemsListContainer" id="itemListContainer${item[0]}">
                      <vaadin-combo-box required auto-open-disabled clear-button-visible id="category${item[0]}" class="itemListCategory" placeholder="${translated.inputLabels.lbl_category}" value="${item[3]}" label="${translated.inputLabels.lbl_category}" @change=${() => updateResponseJson(item[0], "category", this)} @keyup=${e => closeMobileKeyboard(e, this, "category" + item[0])}></vaadin-combo-box>
                      <vaadin-text-field required id="article${item[0]}" class="itemListArticle" label="${translated.inputLabels.lbl_article}" value="${item[1]}" @change=${() => updateResponseJson(item[0], "article", this)} @keyup=${e => closeMobileKeyboard(e, this, "article" + item[0])}></vaadin-text-field>
                      <vaadin-text-field required id="sum${item[0]}" class="itemListSum" pattern="((\-|)[0-9]|[0-9]{2})\.[0-9]{2}"  label="${translated.inputLabels.lbl_price}" value="${itemSum}" @change=${() => updateResponseJson(item[0], "articleSum", this)} @keyup=${e => closeMobileKeyboard(e, this, "sum" + item[0])}></vaadin-text-field>
                      
                      <paper-icon-button class="articleButton" id="articleButton" icon="chevron-left" @click=${() => triggerSelectedAction(item[0], this)}></paper-icon-button>
              </div>`;
          })}
          <div class="foundArticles">${translated.texts.lbl_articleCount}: ${this.responseJson.receiptItems.length}</div>
          
          <paper-icon-button icon="arrow-drop-down" class="extraButtons showReceipt" id="showReceiptButton" @click=${() => showReceipt(this)} style=${this.manualInput ? css `visibility: hidden;`: css ``}></paper-icon-button>
          <paper-icon-button class="assumeArticleSum extraButtons" icon="play-for-work" @click=${() => assumeArticleSum(this)}></paper-icon-button>
          <paper-input type="text" class="articleSum" class="extraButtons" required="true" auto-validate pattern="([0-9]|[0-9]{2}|[0-9]{3})\.[0-9]{2}" id="articleSum" label="${translated.inputLabels.lbl_articleSum}" value="${this.articleSum}" @keyup=${e => closeMobileKeyboard(e, this, "articleSum")}>
            <div slot="suffix">€</div>
          </paper-input>
          

          <div class="${differenceCSS}" id="differenceSum">${this.differenceSum}</div>

          <img id="uploadedImage" class="uploadedImage"/>

    <paper-input label="${translated.inputLabels.lbl_totalPrice}" required="true" id="receiptTotal" auto-validate pattern="([0-9]|[0-9]{2}|[0-9]{3})\.[0-9]{2}" value="${this.totalSum}" @change=${() => updateResponseJson(null, "receiptTotal", this)} @keyup=${e => closeMobileKeyboard(e, this, "receiptTotal")}>
        <iron-icon icon="euro-symbol" slot="suffix"></iron-icon>  
    </paper-input>
   `: 
    html``}

    ${(!this.manualInput && !this.storedFile)
    ? html `
      <paper-input id="uploadedFile" label="${translated.inputLabels.lbl_uploadFile}" type="file" accept=".jpeg, .png, .jpg, .pdf">
        <iron-icon icon="find-in-page" slot="suffix"></iron-icon>  
      </paper-input>
      <paper-button raised class="buttons" id="uploadButton" @click=${this.uploadFile}><iron-icon icon="file-upload"></iron-icon>${translated.buttons.lbl_upload}</paper-button>
      <paper-button raised class="buttons" id="manualReceipt" @click=${() => manualInput(this)}><iron-icon icon="input"></iron-icon>${translated.buttons.lbl_manual}</paper-button> 
    `  
    : html ``
    }

    ${(this.storedFile || this.manualInput)
      ? html `
        <paper-button raised class="buttons" @click=${this.checkValidAndSave}><iron-icon icon="send"></iron-icon>${translated.buttons.lbl_save}</paper-button>
        <paper-button raised class="buttons" @click=${() => resetForm(this)}><iron-icon icon="clear"></iron-icon>${translated.buttons.lbl_abort}</paper-button>
      `: html ``
    }
    </div>
    

    <!-- On event elements -->
    <paper-toast class= "uploadToast fit-bottom" id="uploadToastDone" duration="2500" text="${translated.toasts.lbl_uploadDone}"></paper-toast>
    <paper-toast class= "uploadToast fit-bottom" id="saveToDB" duration="2500" text="${translated.toasts.lbl_saveSuccess}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="saveToDBError" duration="2500" text="${translated.toasts.lbl_saveError}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidSums" duration="2000" text="${translated.toasts.lbl_invalidSums}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="errorOnUpload" duration="5000" text="${translated.toasts.lbl_errorOnUpload} ${this.errorCode}, ${this.errorText}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="differentSums" duration="3000" text="${translated.toasts.lbl_diffrentSums1} ${this.articleSum}€ ${translated.toasts.lbl_diffrentSums2} ${this.totalSum}€ ${translated.toasts.lbl_diffrentSums3}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidDate" duration="2000" text="${translated.toasts.lbl_invalidDate}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidCategory" duration="2000" text="${translated.toasts.lbl_invalidCategory}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidStore" duration="2000" text="${translated.toasts.lbl_invalidStore}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidSumTotal" duration="2000" text="${translated.toasts.lbl_invalidSumTotal}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidToken" duration="5000" text="${translated.toasts.lbl_invalidToken}"></paper-toast>
    
    `;
  }

  updated() {
    scanPage = this;

    if (this.responseJson && this.categoriesJson)
    {
      customElements.whenDefined('vaadin-combo-box').then(function() 
      {
        const combos = scanPage.shadowRoot.querySelectorAll('vaadin-combo-box');
        combos.forEach(function(comboBox) {
          comboBox.items = scanPage.categoriesJson["values"].map(function(item) {return item.name });
          comboBox.style.setProperty('--vaadin-combo-box-overlay-width', '40%');
        });
      })
    }

  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
    loadSettings(this, "scan")
  }

  static get styles() {
    return css`

        .storeDropdown {
          width: calc(100% - 44.3px);
        }

        .addStore {
          padding-right: 0px;
          position: absolute;
          margin-top: 20px;
          margin-left: 6px;
        }

        .mainContainer
        {
          width: calc(100% - 20px);
          padding-left: 10px;
          padding-bottom: 60px;
          margin-top: 70px;
          position: absolute;
          z-index: -1;
        }

        .itemsListContainer
        {
          padding-left: 5px;
          width: 98%;
          display: inline-grid;
          grid-auto-flow: column;
          grid-template-columns: 135px calc(100% - 232px) auto auto;
          column-gap: 2px;
          margin-bottom: 2px;
        }

        .itemListCategories
        {
          width: 135px;
        }

        .foundArticles
        {
          font-family: Roboto;
          font-size: small;
          margin-left: 6px;
          color: dimgrey;
        }

        .articleButton{
          margin-top: 35px;
        }

        .itemListSum
        {
          width: 60px;
        }

        .differenceRed 
        {
          font-family: Roboto;
          font-size: small;
          margin-left: calc(100% - 84px);
          color: red;
        }
    
        .differenceGrey
        {
          font-family: Roboto;
          font-size: small;
          margin-left: calc(100% - 82px);
          color: lightgrey;
        }
    
        .uploadToast {
          --paper-toast-background-color: green;
        }

        .invalidSums {
          --paper-toast-background-color: red;
        }

        .uploadedImage {
          max-width: 100%;
          margin-top: 10px;
          display: none;
        }

        @media only screen and (min-width: 1080px) {
          .uploadedImage {
            height: 1000px;
            margin-left: auto;
            margin-right: auto;
          }
        }

        .articleSum {
          display: inline-block;
          width: 60px;
          pointer-events: none;
        }

        .assumeArticleSum {
          display: inline-block;
          margin-left: calc(100% - 182px);
          padding-right: 0px;
          padding-top: 1px;
        }

        .showReceipt {
          transition: all 0.75s;
          padding: 3px;
        }

        paper-toast {
          text-align: center;
          font-family: Roboto;
        }
    `;
  }

}

customElements.define('scan-element', ScanElement);