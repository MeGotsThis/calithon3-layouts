/* global formatTimeSpan */
(function() {
  'use strict';

  const currentRun = nodecg.Replicant('currentRun');

  class CaliGame extends Polymer.Element {
    static get is() {
      return 'cali-game';
    }

    static get properties() {
      return {
        singleLineName: {
          type: Boolean,
          reflectToAttribute: true,
          value: false,
        },
      };
    }

    ready() {
      super.ready();
      currentRun.on('change', this.currentRunChanged.bind(this));
    }

    currentRunChanged(newVal) {
      let newLineReplace = this.singleLineName ? ' ' : '<br/>';
      this.name = (newVal.name || '').replace('\\n', newLineReplace);

      if (this.initialized || !Polymer.RenderStatus) {
        this.fitText();
      } else {
        Polymer.RenderStatus.afterNextRender(this, this.fitText);
        this.initialized = true;
      }
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

  customElements.define(CaliGame.is, CaliGame);
})();
