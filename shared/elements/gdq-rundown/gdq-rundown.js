(function() {
  'use strict';

  const NUM_RUNS_TO_SHOW_IN_RUNDOWN = 4;
  const currentRun = nodecg.Replicant('currentRun');
  const schedule = nodecg.Replicant('schedule');
  const stopwatch = nodecg.Replicant('stopwatch');

  class GdqRundown extends Polymer.MutableData(Polymer.Element) {
    static get is() {
      return 'gdq-rundown';
    }

    static get properties() {
      return {
        schedule: {
          type: Object,
        },
      };
    }

    ready() {
      super.ready();
      this._debounceUpdateScheduleSlice =
        this._debounceUpdateScheduleSlice.bind(this);
      this._updateScheduleSlice = this._updateScheduleSlice.bind(this);

      currentRun.on('change', this._debounceUpdateScheduleSlice);
      schedule.on('change', this._debounceUpdateScheduleSlice);
      stopwatch.on('change', (newVal, oldVal) => {
        if (!oldVal || newVal.state !== oldVal.state
            || newVal.time.raw < oldVal.time.raw) {
          return this._debounceUpdateScheduleSlice();
        }
      });
    }

    _debounceUpdateScheduleSlice() {
      this._updateScheduleSliceDebouncer = Polymer.Debouncer.debounce(
        this._updateScheduleSliceDebouncer,
        Polymer.Async.timeOut.after(10),
        this._updateScheduleSlice
      );
    }

    _updateScheduleSlice() {
      if (currentRun.status !== 'declared'
          || schedule.status !== 'declared'
          || stopwatch.status !== 'declared'
          || !schedule.value) {
        return;
      }

      let currentItems = currentRun.value.name ? [currentRun.value] : [];

      const sched = schedule.value || [];

      // Start after whatever the last item was in currentItems.
      const lastCurrentItem = currentItems[currentItems.length - 1];
      const startIndex = sched.findIndex((item) => {
        return item.id === lastCurrentItem.id
            && item.type === lastCurrentItem.type;
      }) + 1;
      let numFoundRuns = 0;
      let endIndex = startIndex;
      let lastRunOrder = currentRun.value.order;
      sched.slice(startIndex).some((item, index) => {
        if (numFoundRuns < NUM_RUNS_TO_SHOW_IN_RUNDOWN) {
          if (item.type === 'run') {
            lastRunOrder = item.order;
            numFoundRuns++;
            if (numFoundRuns >= NUM_RUNS_TO_SHOW_IN_RUNDOWN) {
              endIndex = index;
              return false;
            }
          }

          return false;
        } else if (item.type !== 'run' && item.order === lastRunOrder) {
          endIndex = index;
          return false;
        }

        return true;
      });

      this.currentItems = currentItems;
      this.remainderItems = typeof endIndex === 'number' ?
        sched.slice(startIndex, startIndex + endIndex + 1) :
        sched.slice(startIndex);
    }

    _showTooltip(e) {
      const notes = e.model.item.notes;
      if (!notes || notes.trim().length <= 0) {
        return;
      }

      this.$['tooltip-content'].innerHTML = notes
        .replace(/\r\n/g, '<br/>')
        .replace(/\n/g, '<br/>');

      const thisRect = this.getBoundingClientRect();
      const itemRect = e.target.getBoundingClientRect();
      const tooltipRect = this.$['tooltip-content'].getBoundingClientRect();
      const offset = -4;

      this.$.tooltip.style.opacity = 1;
      this.$.tooltip.style.top = `${itemRect.top - thisRect.top - tooltipRect.height + offset}px`;
    }

    _hideTooltip() {
      this.$.tooltip.style.opacity = 0;
    }
  }

  customElements.define(GdqRundown.is, GdqRundown);
})();
