(function() {
  'use strict';

  class Tracker2FA extends Polymer.Element {
    static get is() {
      return 'tracker-2fa';
    }

    static get properties() {
      return {};
    }

    sendCode() {
      nodecg.sendMessage('tracker:2FA', this.$.code.value);
    }
  }

  customElements.define(
    Tracker2FA.is, Tracker2FA);
})();
