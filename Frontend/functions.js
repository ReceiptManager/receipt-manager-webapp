var backendIP
var backendPort
var backendToken
var language
var webPrefix
var settingsLoaded
var menuIcon
var openPage
var translated
var settings
var backendSettings
var europeCountries = []

function loadSettings(t, origin) 
{
  if (!settingsLoaded)
  {
      let xhr = new XMLHttpRequest();
      xhr.open("GET", "./settings/settings.json?" + (new Date().getTime()));
    
      xhr.onload = function () 
      {
        if (this.status >= 200 && this.status < 300) 
        {
          settings = JSON.parse(xhr.response);
          backendIP = settings['backendIP']
          backendPort = settings['backendPort']
          backendToken = settings['backendToken']
          language = settings['language']
          europeCountries = ["de-DE", "en-GB", "es-ES", "fr-FR"]
          
          if (settings['useSSL'])
          {
            webPrefix = "https://"
          }
          else
          {
            webPrefix = "http://"
          }

          settingsLoaded = true
          loadBackendSettings()
          loadPageData(t, origin)
        } 
      }

      xhr.send()
  }
  else
  {
    loadPageData(t, origin)
  }
}

function loadBackendSettings()
{
  let xhr = new XMLHttpRequest();
  xhr.open("GET", webPrefix + backendIP + ":" + backendPort + "/api/getBackendConfig?token=" + backendToken);

  xhr.onload = function () 
  {
    if (this.status >= 200 && this.status < 300) 
    {
      backendSettings = JSON.parse(xhr.response)
    }
  }

  xhr.send()
}


function loadPageData(t, origin) 
{
    if (origin == "historyPage")
    {
      t.getStaticData("categories")
      t.getStaticData("stores")
      t.getHistoryPurchases()
    }
    else if (origin == "scan")
    {
      t.getStaticData("categories")
      t.getStaticData("stores")
    }
    else if (origin == "addCategory")
    {
      t.getStaticData("categories")
    }
    else if (origin == "addStore")
    {
      t.getStaticData("stores")
    }
}

function loadTranslations() {
  let xhr = new XMLHttpRequest();

  if (language == 'de-DE' || !language)
  {
    xhr.open("GET", "./lang/de.json");
  }
  
  xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        translated = JSON.parse(xhr.response);
        mainPage.requestUpdate()
      } 
  };
  xhr.send();
}

function getSelectedCategoryId(t, itemName)
{
  var index = t.categoriesJson["values"].findIndex(category => category.name == itemName);
  return index
}

function chooseAddMode(t)
{
  if (openPage == "addCategory")
  {
    addCategoryPage.categoriesJson["values"].unshift(["", ""])
    addCategoryPage.requestUpdate()
  }
  else if (openPage == "addStore")
  {
    addStorePage.storesJson["values"].unshift(["",""])
    addStorePage.requestUpdate()
  }
}

function setOpenPage(openedPage)
{
  openPage = openedPage
}

function showReceipt(t) {
    // Make uploaded image viewable
    var image = t.shadowRoot.getElementById("uploadedImage");
    image.src = URL.createObjectURL(t.uploadedFile);

    var image = t.shadowRoot.getElementById("uploadedImage")
    var imageStatus = image.style.display

    var displayButton = t.shadowRoot.getElementById("showReceiptButton")

    if (!imageStatus)
    {
      displayButton.style.transform = "rotate(180deg)"
      image.style.display = "flex"
    }
    else
    {
      displayButton.style.transform = "rotate(0deg)"
      image.style.display = null
    }
}

function responseChanged(t) {
    t.requestUpdate()
}

function storesChanged(t){
    t.requestUpdate()
}

function addItem(copyItem, itemId, t) {

    mainPage.shadowRoot.getElementById("copyLine").close()
    showBackground()
    if (!copyItem)
    {
      t.responseJson["receiptItems"].splice(itemId + 1, 0, [itemId + 1, "", ""])
    }
    else
    {
      let articleCat = t.shadowRoot.getElementById("category" + itemId).value
      let articleName = t.shadowRoot.getElementById("article" + itemId).value
      let articleSum = t.shadowRoot.getElementById("sum" + itemId).value.replace(',','.')

      t.responseJson["receiptItems"].splice(itemId + 1, 0, [itemId + 1, articleName, articleSum, articleCat])
    }
    
    t.copyID = null
    t.responseJson = updateItemIDs(t)
    
    responseChanged(t)
}

function openCopyDialog (itemId, t)
{
    hideBackground()
    mainPage.shadowRoot.getElementById("copyLine").open()
    mainPage.copyID = itemId
}

function checkLineItem (itemId, t)
{
  var lineItem = t.shadowRoot.getElementById("itemListContainer" + itemId)

  if (lineItem.style.background == "rgb(160, 231, 160)")
  {
    lineItem.style = "background: unset; border-radius: unset;"
  }
  else
  {
    lineItem.style = "background: #a0e7a0; border-radius: 10px;"
  }
}

function triggerSelectedAction (itemId, t)
{
  let selectedTab = parseInt(mainPage.shadowRoot.getElementById('menuTabs').selected)
  
  switch (selectedTab)
  {
    case 0:
      checkLineItem(itemId, t)
      break;
    case 1:
      openCopyDialog(itemId, t)
      break;
    case 2:
      deleteItem(itemId, t)
      break;
  }
}

function hideBackground()
{
  let bodyContainer = mainPage.shadowRoot.getElementById("bodyContainer")
  bodyContainer.style.opacity = "20%"
  bodyContainer.style["pointer-events"] = "none"
}

function showBackground()
{
  let bodyContainer = mainPage.shadowRoot.getElementById("bodyContainer")
  bodyContainer.style.opacity = "100%"
  bodyContainer.style["pointer-events"] = "auto"
}


function addCategory(event, t, elementId)
{
  if (event.which == 13)
  {
    closeMobileKeyboard(event, t, "category" + elementId)
    var newCat = t.shadowRoot.getElementById("category" + elementId).value

    if (!elementId)
    {
      elementId = ""
    }
  
    if (newCat)
    {
      if (newCat.includes("&"))
      {
        newCat = newCat.replace("&", "%26")
      }
  
      var xhr = new XMLHttpRequest();
      xhr.open("POST", webPrefix + backendIP + ":" + backendPort + "/api/addValue?token=" + backendToken + "&toAddArray=categories&toAddValue=" + newCat + "&id=" + elementId, true);
  
      xhr.onerror = function () {
        console.error("Error with code " + xhr.status);
      };
  
      xhr.onload = function () {
        t.shadowRoot.getElementById("uploadToastDone").open()
        t.getStaticData("categories")
        t.requestUpdate()
      }
  
      xhr.send()
    }
  }
}

function addStore(event, t, elementId)
{
  if (event.which == 13)
  {
    closeMobileKeyboard(event, t, "store" + elementId)
    var newStore = t.shadowRoot.getElementById("store" + elementId).value

    if (!elementId)
    {
      elementId = ""
    }
  
    if (newStore)
    {
      if (newStore.includes("&"))
      {
        newStore = newStore.replace("&", "%26")
      }
  
      var xhr = new XMLHttpRequest();
      xhr.open("POST", webPrefix + backendIP + ":" + backendPort + "/api/addValue?token=" + backendToken + "&toAddArray=stores&toAddValue=" + newStore + "&id=" + elementId, true);
  
      xhr.onerror = function () {
        console.error("Error with code " + xhr.status);
      };
  
      xhr.onload = function () {
        t.shadowRoot.getElementById("uploadToastDone").open()
        t.getStaticData("stores")
        t.requestUpdate()
      }
  
      xhr.send()
    }
  }
}

function openDialog(t, elementId)
{
  hideBackground()
  t.shadowRoot.getElementById(elementId).open()
}

function deleteReceipt(t, receiptId)
{
  var xhr = new XMLHttpRequest();
  xhr.open("POST", webPrefix + backendIP + ":" + backendPort + "/api/deleteReceiptFromDB?token=" + backendToken + "&purchaseID=" + receiptId, true);

  xhr.onerror = function () 
  {
    historyPage.shadowRoot.getElementById("receiptDeletionError").open()
    t.shadowRoot.getElementById("deleteReceipt").close()
    console.error("Error with code " + xhr.status);
  };

  xhr.onload = function ()
  {
    if (xhr.status == 200)
    {
      t.shadowRoot.getElementById("deleteReceipt").close()
      historyPage.shadowRoot.getElementById("receiptDeleted").open()
      historyPage.responseJson = null
      historyPage.getHistoryPurchases()
      historyPage.shadowRoot.getElementById("mainContainerHistory").style.display = null
      historyPage.shadowRoot.getElementById("mainContainerDetails").style.display = "none"
    }
    else
    {
      historyPage.shadowRoot.getElementById("receiptDeletionError").open()
      t.shadowRoot.getElementById("deleteReceipt").close()
    }
  }

  xhr.send()
}

function addStoreFromScan (t)
{
  showBackground()
  var newStore = mainPage.shadowRoot.getElementById("newStore")
  
  if (newStore.value)
  {
    var newStoreIndex = t.storesJson["values"].length;
    t.storesJson["values"][newStoreIndex] = {"name": newStore.value, "id": ""};
    storesChanged(t);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", webPrefix + backendIP + ":" + backendPort + "/api/addValue?token=" + backendToken + "&toAddArray=stores&toAddValue=" + newStore.value + "&id=", true);

    xhr.onerror = function () {
      console.error("Error with code " + xhr.status);
    };

    xhr.send()
    mainPage.shadowRoot.getElementById("addStore").close()
    newStore.value = ""
  }
}

function updateItemIDs (t)
{
  var receiptJson = t.responseJson; 
  let arrayCnt = 0;

  receiptJson["receiptItems"].map(item => {
    item[0] = arrayCnt;
    arrayCnt++;
  });

  return receiptJson
}

function deleteItem(itemId, t)
{
  var items = t.responseJson;
  var filtered = items.receiptItems.filter(function (item) {
    return item[0] != itemId;
  }); 

  var itemsCnt = t.responseJson["receiptItems"].length + 1;
  t.responseJson["receiptItems"].splice(0, itemsCnt);
  t.responseJson["receiptItems"] = filtered;

  t.responseJson = updateItemIDs(t)
  
  responseChanged(t)
}

function validateCategories(t)
{
  var categoriesValid = true
  var itemCnt = t.responseJson["receiptItems"].length
  var itemValue
  var isInValid
  var itemField
  var i

  // Check article sums
  for (i = 0; i < itemCnt; i++)
  {
    itemField = t.shadowRoot.getElementById("category" + i)
    isInValid = itemField.invalid
    itemValue = itemField.value

    if (isInValid && !itemValue)
    {
      categoriesValid = false
      itemField.invalid = true
    }
    else if (!itemValue)
    {
      categoriesValid = false
      itemField.invalid = true
    }
    else
    {
      itemField.invalid = false
    }
  }

  return categoriesValid
}

function validateStore(t)
{
  var storeValid = true
  var storeField = t.shadowRoot.getElementById("storeName")
  var isInValid = storeField.invalid

  if (isInValid && !storeField.value)
  {
    storeValid = false
    storeField.invalid = true
  }
  else if (!storeField.value)
  {
    storeValid = false
    storeField.invalid = true
  }
  else
  {
    storeField.invalid = false
  }

  return storeValid
}

function validateDate(t)
{
  var dateValid = true
  var dateField = t.shadowRoot.getElementById("receiptDate")
  var isInValid = dateField.invalid
  var regEx = /^((\d{4}-\d{2}-\d{2})|(\d{2}\.\d{2}\.\d{4}))$/

  if (isInValid || !dateField.value.match(regEx))
  {
    dateValid = false
    dateField.invalid = true
  }
  else
  {
    dateField.invalid = false
  }

  return dateValid
}

function validateTotalSum(t)
{
  var totalSumValid = true
  var sumField = t.shadowRoot.getElementById("receiptTotal")
  var isInValid = sumField.invalid

  if (isInValid || !sumField.value)
  {
    totalSumValid = false
    sumField.invalid = true
  }
  else
  {
    sumField.invalid = false
  }

  return totalSumValid
}

function validateTotal(t)
{
  var sumsValid = true
  var isInValid

  // Check total
  var articleSumField = t.shadowRoot.getElementById("articleSum")
  isInValid = articleSumField.invalid
  if (isInValid || !articleSumField.value)
  {
    sumsValid = false
    articleSumField.invalid = true
  }
  else
  {
    if (parseFloat(t.articleSum.replace(',','.')) != parseFloat(t.totalSum.replace(',','.')))
    {
      sumsValid = false
    }
  }

  return sumsValid
}

function validateArticles(t)
{
  var sumsValid = true
  var itemCnt = t.responseJson["receiptItems"].length
  var isInValid
  var i

  // Check article sums
  for (i = 0; i < itemCnt; i++)
  {
    isInValid = t.shadowRoot.getElementById("sum" + i).invalid
    if (isInValid)
    {
      sumsValid = false
    }
  }

  return sumsValid
}

function updateResponseJson (itemId, mode, t)
{
  if (mode == "article")
  {
    var updateVal = t.shadowRoot.getElementById("article" + itemId).value;
    t.responseJson["receiptItems"][itemId][1] = updateVal;
  }
  else if (mode == "articleSum")
  {
    var updateVal = t.shadowRoot.getElementById("sum" + itemId).value;
    if (!updateVal.includes('.') && !updateVal.includes(',') && updateVal.length > 0)
    {
      updateVal = updateVal + '.00'
    }
    t.responseJson["receiptItems"][itemId][2] = updateVal.replace(',','.');
  }
  else if (mode == "category")
  {
    var updateVal = t.shadowRoot.getElementById("category" + itemId).value;
    t.responseJson["receiptItems"][itemId][3] = updateVal;
  }
  else if (mode == "store")
  {
    var updateVal = t.shadowRoot.getElementById("storeName").value;
    t.responseJson["storeName"] = updateVal;
  }
  else if (mode == "receiptDate")
  {
    var updateVal = t.shadowRoot.getElementById("receiptDate").value;

    if (updateVal.match('-'))
    {
      var dateParts = updateVal.split("-");
      updateVal = dateParts[2] + "." + dateParts[1] + "." + dateParts[0]
    }

    t.responseJson["receiptDate"] = updateVal;
  }
  else if (mode == "receiptTotal")
  {
    var updateVal = t.shadowRoot.getElementById("receiptTotal").value;

    if (updateVal.includes(',') && europeCountries.includes(language))
    {
      updateVal = updateVal.replace(',','.')
    }

    t.responseJson["receiptTotal"] = updateVal;
  }

  responseChanged(t)
}

function closeDrawer(t)
{
    var drawer = t.shadowRoot.getElementById("drawer")
    var mainContent = t.shadowRoot.getElementById("mainElement")

    if (!drawer.opened)
    {
      mainContent.style.visibility = null
    }
}

function openDrawer(t)
{
  if (menuIcon != "arrow-back")
  {
    t.shadowRoot.getElementById("drawer").open()
    t.shadowRoot.getElementById("mainElement").style.visibility = "hidden"
  }
  else
  {
    historyPage.shadowRoot.getElementById("mainContainerHistory").style.display = null
    historyPage.shadowRoot.getElementById("mainContainerDetails").style.display = "none"
    historyPage.responseJson = null

    window.scrollTo(0,0)

    setMenuIcon("menu")
    mainPage.inputMode = false
    mainPage.requestUpdate()
  }
}

function calcDifference (t)
{
  if (t.articleSum && t.responseJson.receiptTotal)
  {
    var articleSum = t.articleSum.replace(',','.')
    var totalSum = t.responseJson.receiptTotal.replace(',','.')

    t.differenceSum = (parseFloat(articleSum) - parseFloat(totalSum)).toFixed(2)
  }
}

function assumeArticleSum (t)
{
  t.shadowRoot.getElementById("receiptTotal").value = t.shadowRoot.getElementById("articleSum").value;
  updateResponseJson(null, "receiptTotal", t)
}

function openSpinner ()
{
  hideBackground()

  mainPage.shadowRoot.getElementById("loadingSpinner").active = true
  mainPage.shadowRoot.getElementById("menuButton").style["pointer-events"] = "none"
}

function closeSpinner ()
{
  showBackground()

  mainPage.shadowRoot.getElementById("loadingSpinner").active = null;
  mainPage.shadowRoot.getElementById("menuButton").style["pointer-events"] = "auto"
}

function setMenuIcon (mode)
{
  if (mode == "menu")
  {
    menuIcon = "menu"
  }
  else if (mode == "historyDetail")
  {
    menuIcon = "arrow-back"
  }
}

function manualInput (t)
{
  var emptyRespose = '{"storeName":"","receiptTotal":"","receiptDate":"","receiptCategory":"","receiptItems":[[0, "", "", ""]]}'
  t.responseJson = JSON.parse(emptyRespose)
  t.manualInput = true
  mainPage.inputMode = true
  t.requestUpdate()
}

function resetForm (t)
{
  t.responseJson = null
  t.manualInput = null
  t.storedFile = null
  t.differenceSum = null
  mainPage.inputMode = false
}

function closeMobileKeyboard (event, t, id)
{
  if (event.which == 13)
  {
    t.shadowRoot.getElementById(id).blur()
  }
}

function formatDate(date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}

export {showReceipt, responseChanged, storesChanged, addItem, addStoreFromScan, updateItemIDs, deleteItem, validateCategories, validateStore, validateDate, validateTotal, validateArticles, updateResponseJson, closeDrawer, openDrawer, calcDifference, assumeArticleSum, openSpinner, closeSpinner, setMenuIcon, chooseAddMode, setOpenPage, 
        validateTotalSum, deleteReceipt, formatDate, openDialog, showBackground, openCopyDialog, addCategory, addStore,getSelectedCategoryId, manualInput, loadTranslations, resetForm, closeMobileKeyboard, loadSettings, loadBackendSettings, triggerSelectedAction, backendSettings, settings, menuIcon, language,backendIP, backendPort, translated, backendToken, webPrefix, europeCountries}