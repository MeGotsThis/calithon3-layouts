/* global formatTimeSpan */
(function() {
  'use strict';

  class CaliMultiGame extends Polymer.Element {
    static get is() {
      return 'cali-multi-game';
    }

    static get properties() {
      return {
        name: {
          type: String,
          observer: 'fitText'
        },
        singleLineName: {
          type: Boolean,
          reflectToAttribute: true,
          value: false,
        },
      };
    }

    ready() {
      super.ready();
    }

    fitText() {
      if (Polymer.flush) {
        Polymer.flush();
      }

      const MAX_GAME_WIDTH = this.clientWidth - 32 - 54;
      const gameSpan = this.$.text;
      const gameWidth = gameSpan.clientWidth;
      if (gameWidth > MAX_GAME_WIDTH) {
        TweenLite.set(gameSpan, {
          scaleX: MAX_GAME_WIDTH / gameWidth,
          transformOrigin: 'left',
      });
      } else {
        TweenLite.set(gameSpan, {
          scaleX: 1,
          transformOrigin: 'left',
      });
      }
    }
  }

  customElements.define(CaliMultiGame.is, CaliMultiGame);
})();
