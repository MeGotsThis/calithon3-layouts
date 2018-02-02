(function() {
  'use strict';

  const FADE_DURATION = 0.33;
  const FADE_IN_EASE = Power1.easeOut;
  const FADE_OUT_EASE = Power1.easeIn;
  const currentRun = nodecg.Replicant('currentRun');
  const stopwatch = nodecg.Replicant('stopwatch');

  class CaliFinishTime extends Polymer.Element {
    static get is() {
      return 'cali-finish-time';
    }

    static get properties() {
      return {
        index: Number,
        attach: {
          type: String,
          description:
            'This is the location where the element is attaching from',
          reflectToAttribute: true,
        },
        forfeit: {
          type: Boolean,
          readOnly: true,
          reflectToAttribute: true,
          value: false,
        },
        time: {
          type: String,
          readOnly: true,
        },
        place: {
          type: Number,
          readOnly: true,
        },
        placement: {
          type: String,
          computed: 'calcPlacement(place, forfeit)',
        },
        timeTL: {
          type: TimelineLite,
          value() {
            return new TimelineLite({autoRemoveChildren: true});
          },
          readOnly: true,
        },
      };
    }

    static get observers() {
      return [
        'handleNewPlace(place, forfeit)',
      ];
    }

    handleNewPlace(place, forfeit) {
      if (place || forfeit) {
        this.showTime();
      } else {
        this.hideTime();
      }
    }

    showTime() {
      if (this._timeShowing) {
        return;
      }

      this._timeShowing = true;

      this.timeTL.clear();
      let val = {
        ease: FADE_OUT_EASE,
        clearProps: 'all',
      };
      if (this.attach === 'top') {
        val.top = 0;
      } else if (this.attach === 'bottom') {
        val.bottom = 0;
      } else if (this.attach === 'left') {
        val.left = 0;
      } else if (this.attach === 'right') {
        val.right = 0;
      }
      this.timeTL.to(this.$.main, FADE_DURATION, val);
    }

    hideTime() {
      if (!this._timeShowing) {
        return;
      }

      this._timeShowing = false;

      this.timeTL.clear();
      let val = {
        ease: FADE_IN_EASE,
      };
      if (this.attach === 'top') {
        val.top = '-100%';
      } else if (this.attach === 'bottom') {
        val.bottom = '-100%';
      } else if (this.attach === 'left') {
        val.left = '-100%';
      } else if (this.attach === 'right') {
        val.right = '-100%';
      }
      this.timeTL.to(this.$.main, FADE_DURATION, val);
    }

    calcPlacement(place, forfeit) {
      if (forfeit) {
        return 'Forfeit';
      }

      switch (place) {
        case 1:
          return '1st';
        case 2:
          return '2nd';
        case 3:
          return '3rd';
        case 4:
          return '4th';
        default:
          return '';
      }
    }

    ready() {
      super.ready();
      this._timeShowing = true;

      stopwatch.on('change', this.stopwatchChanged.bind(this));
    }

    stopwatchChanged(newVal) {
      if (newVal.results[this.index]) {
        this._setForfeit(newVal.results[this.index].forfeit);
        this._setPlace(newVal.results[this.index].place);
        this._setTime(newVal.results[this.index].time.formatted);
      } else {
        this._setForfeit(false);
        this._setPlace(0);
      }
    }
  }

  customElements.define(CaliFinishTime.is, CaliFinishTime);
})();
