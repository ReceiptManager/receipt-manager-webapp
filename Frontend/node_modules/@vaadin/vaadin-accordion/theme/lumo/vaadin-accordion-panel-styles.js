import '@vaadin/vaadin-lumo-styles/color.js';
import '@vaadin/vaadin-lumo-styles/spacing.js';
import '@vaadin/vaadin-details/theme/lumo/vaadin-details-styles.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

const $_documentContainer = html`<dom-module id="lumo-accordion-panel" theme-for="vaadin-accordion-panel">
  <template>
    <style include="lumo-details">
      :host {
        margin: 0;
        border-bottom: solid 1px var(--lumo-contrast-10pct);
      }

      :host(:last-child) {
        border-bottom: none;
      }

      :host([theme~="filled"]) {
        border-bottom: none;
      }

      :host([theme~="filled"]:not(:last-child)) {
        margin-bottom: 2px;
      }
    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
