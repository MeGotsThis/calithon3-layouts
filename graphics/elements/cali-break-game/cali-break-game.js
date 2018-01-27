(function() {
  'use strict';

  const currentRun = nodecg.Replicant('currentRun');
  const nextRun = nodecg.Replicant('nextRun');
  const schedule = nodecg.Replicant('schedule');
  const stopwatch = nodecg.Replicant('stopwatch');

  class CaliBreakGame extends Polymer.Element {
    static get is() {
      return 'cali-break-game';
    }

    static get properties() {
      return {
        offset: {
          type: Number,
          value: 0,
        },
        right: {
          type: Boolean,
          reflectToAttribute: true,
        },
      };
    }

    ready() {
      super.ready();
      currentRun.on('change', this.runChanged.bind(this));
      nextRun.on('change', this.runChanged.bind(this));
      schedule.on('change', this.runChanged.bind(this));
      stopwatch.on('change', this.runChanged.bind(this));
    }

    runChanged() {
      if (currentRun.status !== 'declared'
          || nextRun.status !== 'declared'
          || schedule.status !== 'declared'
          || stopwatch.status !== 'declared') {
        return;
      }

      let newLineReplace = this.singleLineName ? ' ' : '<br/>';
      let baseGame;
      if (stopwatch.value.state === 'finished') {
        baseGame = nextRun.value;
      } else {
        baseGame = currentRun.value;
      }
      let game = baseGame;
      if (this.offset > 0) {
        let runs = schedule.value.filter(
          (item) => item.type === 'run' && item.order >= baseGame.order);
        game = runs[this.offset] || {};
      } else if (this.offset < 0) {
        let runs = schedule.value.filter(
          (item) => item.type === 'run' && item.order <= baseGame.order);
        game = runs.reverse()[-this.offset] || {};
      }
      this.name = (game.name || '').replace('\\n', newLineReplace);

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

      const MAX_GAME_WIDTH = this.clientWidth - 32 - this.$.icon.clientWidth;
      const gameSpan = this.$.text;
      const gameWidth = gameSpan.clientWidth;
      if (gameWidth > MAX_GAME_WIDTH) {
        TweenLite.set(gameSpan, {
          scaleX: MAX_GAME_WIDTH / gameWidth,
          transformOrigin: this.right ? 'right' : 'left',
      });
      } else {
        TweenLite.set(gameSpan, {
          scaleX: 1,
          transformOrigin: this.right ? 'right' : 'left',
      });
      }
    }
  }

  customElements.define(CaliBreakGame.is, CaliBreakGame);
})();
