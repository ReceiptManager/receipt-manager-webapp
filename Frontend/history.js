import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings.js';
import "./node_modules/@polymer/paper-input/paper-input.js";
import "./node_modules/@polymer/paper-button/paper-button.js";
import './node_modules/@polymer/paper-dropdown-menu/paper-dropdown-menu-light.js';
import './node_modules/@polymer/paper-item/paper-item.js';
import './node_modules/@polymer/paper-item/paper-icon-item.js'
import './node_modules/@polymer/paper-listbox/paper-listbox.js';
import './node_modules/@polymer/paper-toast/paper-toast.js';
import './node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import './node_modules/@polymer/iron-icon/iron-icon.js';
import './node_modules/@polymer/iron-icons/iron-icons.js';
import {updateResponseJson, deleteItem, activateDeleteMode, calcDifference, validateStore, validateDate, validateArticles, validateCategories, validateTotal, backendIP, backendPort, responseChanged, assumeArticleSum, openSpinner, closeSpinner, setMenuIcon, 
        getSelectedCategoryId, closeMobileKeyboard, loadSettings,language, translated, backendToken, webPrefix, europeCountries, openCopyDialog}  from './functions.js';

class MainElement extends LitElement {
  static get properties() {
    return {
      historyPurchases: Object,
      responseJson: Object,
      articleSum: Number,
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

  getHistoryPurchases (e) {
    var instance = this

    var xhr = new XMLHttpRequest();
    xhr.open("GET", webPrefix + backendIP + ":"+ backendPort + "/api/getHistory?token=" + backendToken, true);
    
    xhr.onload = function () {
      if (xhr.status == 200)
      {
        instance.historyPurchases = JSON.parse(xhr.response)
      }
      else
      {
        instance.shadowRoot.getElementById("invalidToken").open()
      }
        
    }

    xhr.send();
  }

  checkValidAndUpdate(e)
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

    // Sende kassenbon an Backend für metabase
    var instance = this
    var xhr = new XMLHttpRequest();
    xhr.open("POST", webPrefix + backendIP + ":" + backendPort + "/api/updateReceiptToDB?token=" + backendToken)
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")

    xhr.onload = function () {
      instance.shadowRoot.getElementById("saveToDB").open()
      instance.responseJson = null
      setMenuIcon("menu")
      instance.getHistoryPurchases()
      responseChanged(instance)

      instance.shadowRoot.getElementById("mainContainerHistory").style.display = null
    }

    xhr.onerror = function () {
      instance.shadowRoot.getElementById("saveToDBError").open()
    }

    xhr.send(JSON.stringify(this.responseJson))
  }


  openPurchaseDetails (purchaseId, location, totalSum, date)
  {
    openSpinner()
    setMenuIcon("historyDetail")
    mainPage.requestUpdate()
    var instance = this

    var xhr = new XMLHttpRequest();
    xhr.open("GET", webPrefix + backendIP + ":"+ backendPort + "/api/getHistoryDetails?token=" + backendToken + "&purchaseID=" + purchaseId + "&storeName=" + location + "&receiptTotal=" + totalSum + "&receiptDate=" + date , true);
    
    xhr.onload = function () {
        var purchaseDetails = JSON.parse(xhr.response)

        // Add id to items
        let arrayCnt = 0
        purchaseDetails["receiptItems"].map (item => {
            
          item.splice(0, 0, arrayCnt)

          arrayCnt++
        })

        instance.shadowRoot.getElementById("mainContainerHistory").style.display = "none"
        instance.shadowRoot.getElementById("mainContainerDetails").style.display = null
        instance.responseJson = purchaseDetails
        closeSpinner()
    }

    xhr.send();
  }

  render() {

    // Set article sum = 0
    this.articleSum = ""
    var actMonth
    var monthString

    if (this.responseJson)
    {
      var itemsLength = this.responseJson["receiptItems"].length
      var itemCnt = 0
      var differenceCSS
    }
    
    if (this.categoriesJson)
    {
      var categories = []
      for (var category of this.categoriesJson["values"]) {
        categories.push (html`<paper-item>${category.name}</paper-item>`)
      }
    }

    return html`
    <div class="mainContainer" id="mainContainerHistory">

      ${(this.historyPurchases)
        ? html `
            ${this.historyPurchases.map(purchase => {
                actMonth = monthString
                var isoDate = purchase.timestamp.replace(/\s/, 'T')
                var date = new Date(isoDate)
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                monthString = date.toLocaleDateString(language , {month: 'long'})

                return html `
                  ${!actMonth || actMonth != monthString
                  ? html `
                    
                    <div class="monthName">
                      ${monthString}
                    </div>
                  ` 
                  : html ``
                  }
                  <paper-icon-item class="purchase" @click=${() => this.openPurchaseDetails(purchase.id, purchase.location, purchase.totalSum, date.toLocaleString(language, { year: 'numeric', month: '2-digit', day: '2-digit' }))}>
                    <iron-icon icon="store" slot="item-icon"></iron-icon>
                    <paper-item-body two-line>
                      <div>${purchase.location} - ${purchase.totalSum}€</div>
                      <div secondary>${date.toLocaleString('de-DE', options)}</div>
                    </paper-item-body>
                  </paper-icon-item>
                `
              })
            }
        ` 
        : html ``
      }
    </div>
    <div class="mainContainerDetails" id="mainContainerDetails">

      ${(this.responseJson)
        ? html `
            <paper-dropdown-menu-light class="storeDropdown" required="true" id="storeName" label="${translated.inputLabels.lbl_store}" value=${this.responseJson.storeName} @selected-item-changed=${() => updateResponseJson(null, "store", this)}>
              <paper-listbox slot="dropdown-content">
                ${this.storesJson["values"].map(store => {
                  return html `<paper-item>${store.name}</paper-item>`
                })}
              </paper-listbox>
            </paper-dropdown-menu-light>

            <paper-input label="${translated.inputLabels.lbl_date}" required="true" id="receiptDate" auto-validate pattern="^(0[1-9]|[12][0-9]|3[01])[.](0[1-9]|1[012])[.](19|20)[0-9]{2}$" value="${this.responseJson.receiptDate}" @change=${() => updateResponseJson(null, "receiptDate", this)} @keyup=${e => closeMobileKeyboard(e, this, "receiptDate")}>
              <iron-icon icon="date-range" slot="suffix"></iron-icon>    
            </paper-input>

            ${this.responseJson["receiptItems"].map(item => {
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
                  <div class="itemsListContainer">

                      <paper-dropdown-menu-light class="itemListCategories" required="true" value="${item[3]}" id="category${item[0]}" label="${translated.inputLabels.lbl_category}" @selected-item-changed=${() => updateResponseJson(item[0], "category", this)} noink noAnimations>
                        <paper-listbox class="dropdown" slot="dropdown-content" selected="${getSelectedCategoryId(this, item[3])}">
                          ${categories}
                        </paper-listbox>
                      </paper-dropdown-menu-light>

                      <paper-input class="itemListArticle" required="true" id="article${item[0]}" label="${translated.inputLabels.lbl_article}" value="${item[1]}" @change=${() => updateResponseJson(item[0], "article", this)} @keyup=${e => closeMobileKeyboard(e, this, "article" + item[0])}></paper-input>
                      <paper-input class="itemListSum" required="true" auto-validate pattern="((\-|)[0-9]|[0-9]{2})\.[0-9]{2}" id="sum${item[0]}" label="${translated.inputLabels.lbl_price}" value="${itemSum}" @change=${() => updateResponseJson(item[0], "articleSum", this)} @keyup=${e => closeMobileKeyboard(e, this, "sum" + item[0])}>
                        <div slot="suffix">€</div>
                      </paper-input>

                      <paper-icon-button class="addButton" id="addArticleButton${item[0]}" icon="add-circle" @click=${() => openCopyDialog(item[0], this)}></paper-icon-button>
                      <paper-icon-button class="deleteButton" id="deleteArticleButton${item[0]}" icon="delete" @click=${() => deleteItem(item[0], this)}></paper-icon-button>
                      </div>
                  `
              })
            } 
          
          <div class="foundArticles">${translated.texts.lbl_articleCount}: ${this.responseJson.receiptItems.length}</div>
          
          <paper-icon-button icon="create" class="extraButtons" @click=${() => activateDeleteMode(this)}></paper-icon-button>
          <paper-icon-button class="assumeArticleSum extraButtons" icon="play-for-work" @click=${() => assumeArticleSum(this)}></paper-icon-button>
          <paper-input class="articleSum" class="extraButtons" required="true" auto-validate pattern="([0-9]|[0-9]{2})\.[0-9]{2}" id="articleSum" label="${translated.inputLabels.lbl_articleSum}" value="${this.articleSum}" @keyup=${e => closeMobileKeyboard(e, this, "articleSum")}>
            <div slot="suffix">€</div>
          </paper-input>

          <div class="${differenceCSS}" id="differenceSum">${this.differenceSum}</div>

          <paper-input label="${translated.inputLabels.lbl_totalPrice}" required="true" id="receiptTotal" auto-validate pattern="([0-9]|[0-9]{2})\.[0-9]{2}" value="${this.totalSum}" @change=${() => updateResponseJson(null, "receiptTotal", this)} @keyup=${e => closeMobileKeyboard(e, this, "receiptTotal")}>
            <iron-icon icon="euro-symbol" slot="suffix"></iron-icon>  
          </paper-input>

          <paper-button raised class="buttons" @click=${this.checkValidAndUpdate}><iron-icon icon="send"></iron-icon>Speichern</paper-button>
        ` 
        : html ``
      }
    </div>

    <paper-toast class= "uploadToast fit-bottom" id="saveToDB" duration="2500" text="${translated.toasts.lbl_saveSuccess}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="saveToDBError" duration="2500" text="${translated.toasts.lbl_saveError}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidSums" duration="2000" text="${translated.toasts.lbl_invalidSums}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="differentSums" duration="3000" text="${translated.toasts.lbl_diffrentSums1} ${this.articleSum}€ ${translated.toasts.lbl_diffrentSums2} ${this.totalSum}€ ${translated.toasts.lbl_diffrentSums3}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidDate" duration="2000" text="${translated.toasts.lbl_invalidDate}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidCategory" duration="2000" text="${translated.toasts.lbl_invalidCategory}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidStore" duration="2000" text="${translated.toasts.lbl_invalidStore}"></paper-toast>
    <paper-toast class= "invalidSums fit-bottom" id="invalidToken" duration="5000" text="${translated.toasts.lbl_invalidToken}"></paper-toast>
    `;
  }

  updated ()
  {
    historyPage = this;
  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
    loadSettings(this, "historyPage")

    this.articleSum = 0
  }

  static get styles() {
    return css`

    .mainContainer
    {
      width: calc(100% - 25px);
      padding-left: 25px;
      padding-bottom: 10px;
      margin-top: 70px;
      position: absolute;
      z-index: -1;
    }

    .mainContainerDetails
    {
      padding-left: 10px;
      padding-bottom: 10px;
      margin-top: 70px;
      position: absolute;
      z-index: -1;
      padding-right: 10px;
      width: calc(100% - 25px);
    }

    .storeDropdown {
      width: 100%;
    }

    .monthName {
      font-family: Roboto;
      margin-top: 10px;
      font-size: larger;
    }

    .itemsListContainer
    {
      padding-left: 5px;
      width: 98%;
      display: inline-grid;
      grid-auto-flow: column;
      grid-template-columns: 115px calc(100% - 225px) auto auto;
      column-gap: 6px;
    }

    .foundArticles
    {
      font-family: Roboto;
      font-size: small;
      margin-left: 6px;
      color: dimgrey;
    }

    .itemListCategories
    {
      width: 120px;
      margin-top: 1px;
    }

    .itemListArticle
    {
      width: calc(100% - 10px);
      padding-left: 8px;
    }

    .addButton{
      margin-top: 20px;
    }

    .articleSum {
      display: inline-block;
      width: 60px;
      pointer-events: none;
    }

    .assumeArticleSum {
      display: inline-block;
      margin-left: calc(100% - 190px);
      padding-right: 0px;
      padding-top: 1px;
    }

    .differenceRed 
    {
      font-family: Roboto;
      font-size: small;
      margin-left: calc(100% - 89px);
      color: red;
    }

    .differenceGrey
    {
      font-family: Roboto;
      font-size: small;
      margin-left: calc(100% - 95px);
      color: lightgrey;
    }

    .deleteButton {
      display: none;
      margin-top: 20px;
    }

    .purchase
    {
      padding-top: 1px;
      border-bottom-style: dotted;
      border-color: dimgray;
      width: calc(100% - 60px);
      line-height: 20px;
    }

    .uploadToast {
      --paper-toast-background-color: green;
    }

    .invalidSums {
      --paper-toast-background-color: red;
    }
    `;
  }

}

customElements.define('history-element', MainElement);