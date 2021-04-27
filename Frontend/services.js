import { LitElement, html, css } from "./node_modules/lit-element/lit-element.js";
import { setPassiveTouchGestures } from "./node_modules/@polymer/polymer/lib/utils/settings.js";
import "./node_modules/@polymer/paper-input/paper-input.js";
import './node_modules/@polymer/paper-listbox/paper-listbox.js';
import './node_modules/@polymer/paper-dialog/paper-dialog.js';
import './node_modules/@polymer/paper-toast/paper-toast.js';
import { translated } from './functions.js';

class MainElement extends LitElement {
  static get properties() {
    return {
        newWorker: Object
    };
  }

  registerServiceWorkers()
  {
    if ('serviceWorker' in navigator) 
    {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('service-worker.js').then(registration => {
            console.log(`service worker registered succesfully`);
          }).catch(err => {
            console.log(`Error registring ${err}`);
          });
        });
      } 
      else 
      {
        console.log(`Service worker is not supported in this browser or SSL not enabled.`);
      }

    if ('serviceWorker' in navigator) 
    {
        navigator.serviceWorker.register('/service-worker.js').then(reg => {
        reg.addEventListener('updatefound', () => {
        this.newWorker = reg.installing;
        this.newWorker.addEventListener('statechange', () => {
            switch (this.newWorker.state) {
            case 'installed':
                if (navigator.serviceWorker.controller) {
                 this.showUpdateBar();
                }

                break;
            }
        });
        });
    });

    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', function () 
    {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
    });
    }
  }

  toggleUpdate() {
    this.newWorker.postMessage({
      action: 'skipWaiting'
    });
  }


  showUpdateBar() {
    mainPage.shadowRoot.getElementById('updateToast').open();
  }
  

  render() {
    return html`
      `;
  }

  updated() {
    servicesPage = this
  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
    this.registerServiceWorkers()
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