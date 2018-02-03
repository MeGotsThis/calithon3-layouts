'use strict';

const LS_TIMER_PHASE = {
  NotRunning: 0,
  Running: 1,
  Ended: 2,
  Paused: 3
};

// Packages
const clone = require('clone');
const liveSplitCore = require('livesplit-core');

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const TimeUtils = require('./lib/time');

const lsRun = liveSplitCore.Run.new();
const segment = liveSplitCore.Segment.new('finish');
lsRun.pushSegment(segment);
const timer = liveSplitCore.Timer.new(lsRun);

const checklistComplete = nodecg.Replicant('checklistComplete');
const currentRun = nodecg.Replicant('currentRun');
const stopwatch = nodecg.Replicant('stopwatch');
const STOPWATCH_STATES = {
  NOT_STARTED: 'not_started',
  RUNNING: 'running',
  PAUSED: 'paused',
  FINISHED: 'finished'
};

// Load the existing time and start the stopwatch at that.
timer.start();
timer.pause();
initGameTime();
if (stopwatch.value.state === STOPWATCH_STATES.RUNNING) {
  const missedTime = Date.now() - stopwatch.value.time.timestamp;
  const previousTime = stopwatch.value.time.raw;
  const timeOffset = previousTime + missedTime;
  nodecg.log.info(
    'Recovered %s seconds of lost time.', (missedTime / 1000).toFixed(2));
  start(true);
  timer.setGameTime(liveSplitCore.TimeSpan.fromSeconds(timeOffset / 1000));
}

nodecg.listenFor('startTimer', start);
nodecg.listenFor('stopTimer', pause);
nodecg.listenFor('resetTimer', reset);
nodecg.listenFor('completeRunner', (data) => {
  if (currentRun.value.coop) {
    // Finish all runners.
    currentRun.value.runners.forEach((runner, index) => {
      if (!runner) {
        return;
      }

      completeRunner({index, forfeit: data.forfeit});
    });
  } else {
    completeRunner(data);
  }
});
nodecg.listenFor('resumeRunner', (index) => {
  if (currentRun.value.coop) {
    // Resume all runners.
    currentRun.value.runners.forEach((runner, index) => {
      if (!runner) {
        return;
      }

      resumeRunner(index);
    });
  } else {
    resumeRunner(index);
  }
});
nodecg.listenFor('editTime', editTime);

setInterval(tick, 100); // 10 times per second.

/**
 * Starts the timer.
 * @param {Boolean} [force=false] - Forces the timer to start again, even if
 *  already running.
 * @return {undefined}
 */
function start(force) {
  if (!force && stopwatch.value.state === STOPWATCH_STATES.RUNNING) {
    return;
  }

  stopwatch.value.state = STOPWATCH_STATES.RUNNING;
  if (timer.currentPhase() === LS_TIMER_PHASE.NotRunning) {
    timer.start();
    initGameTime();
  } else {
    timer.resume();
  }
}

function initGameTime() {
  timer.setLoadingTimes(liveSplitCore.TimeSpan.fromSeconds(0));
  timer.initializeGameTime();
  const existingSeconds = stopwatch.value.time.raw / 1000;
  timer.setGameTime(liveSplitCore.TimeSpan.fromSeconds(existingSeconds));
}

/**
 * Increments the timer by one second.
 * @return {undefined}
 */
function tick() {
  if (stopwatch.value.state !== STOPWATCH_STATES.RUNNING) {
    return;
  }

  const time = timer.currentTime();
  const gameTime = time.gameTime();
  if (!gameTime) {
    return;
  }

  stopwatch.value.time =
    TimeUtils.createTimeStruct((gameTime.totalSeconds() * 1000));
}

/**
 * Pauses the timer.
 * @return {undefined}
 */
function pause() {
  timer.pause();
  stopwatch.value.state = STOPWATCH_STATES.PAUSED;
}

/**
 * Pauses and resets the timer, clearing the time and results.
 * @return {undefined}
 */
function reset() {
  pause();
  timer.reset(true);
  stopwatch.value.time = TimeUtils.createTimeStruct();
  stopwatch.value.results = [null, null, null, null];
  stopwatch.value.state = STOPWATCH_STATES.NOT_STARTED;
}

/**
 * Marks a runner as complete.
 * @param {Number} index - The runner to modify (0-3).
 * @param {Boolean} forfeit - Whether or not the runner forfeit.
 * @return {undefined}
 */
function completeRunner({index, forfeit}) {
  if (!stopwatch.value.results[index]) {
    stopwatch.value.results[index] = {
      time: clone(stopwatch.value.time),
      place: 0,
      forfeit: false,
    };
  }

  stopwatch.value.results[index].forfeit = forfeit;
  recalcPlaces();
}

/**
 * Marks a runner as still running.
 * @param {Number} index - The runner to modify (0-3).
 * @return {undefined}
 */
function resumeRunner(index) {
  stopwatch.value.results[index] = null;
  recalcPlaces();

  if (stopwatch.value.state === STOPWATCH_STATES.FINISHED) {
    const missedMilliseconds = Date.now() - stopwatch.value.time.timestamp;
    const newMilliseconds = stopwatch.value.time.raw + missedMilliseconds;
    stopwatch.value.time = TimeUtils.createTimeStruct(newMilliseconds);
    timer.setGameTime(
      liveSplitCore.TimeSpan.fromSeconds(newMilliseconds / 1000));
    start();
  }
}

/**
 * Edits the final time of a result.
 * @param {Number|String} index - The result index to edit.
 * @param {String} newTime - A hh:mm:ss (or mm:ss) formatted new time.
 * @return {undefined}
 */
function editTime({index, newTime}) {
  if (!newTime) {
    return;
  }

  const newMilliseconds = TimeUtils.parseTimeString(newTime);
  if (isNaN(newMilliseconds)) {
    return;
  }

  if (index === 'master' || currentRun.value.runners.length === 1) {
    if (newMilliseconds === 0) {
      return reset();
    }

    stopwatch.value.time = TimeUtils.createTimeStruct(newMilliseconds);
    timer.setGameTime(
        liveSplitCore.TimeSpan.fromSeconds(newMilliseconds / 1000));
  }

  if (stopwatch.value.results[index]) {
    stopwatch.value.results[index].time =
      TimeUtils.createTimeStruct(newMilliseconds);
    recalcPlaces();
  }
}

/**
 * Re-calculates the podium place for all runners.
 * @return {undefined}
 */
function recalcPlaces() {
  const finishedResults = stopwatch.value.results.filter((r) => {
    if (r) {
      r.place = 0;
      return !r.forfeit;
    }

    return false;
  });

  finishedResults.sort((a, b) => {
    return a.time.raw - b.time.raw;
  });

  finishedResults.forEach((r, index) => {
    r.place = index + 1;
  });

  // If every runner is finished, stop ticking and set timer state to
  // "finished".
  let allRunnersFinished = true;
  currentRun.value.runners.forEach((runner, index) => {
    if (!runner) {
      return;
    }

    if (!stopwatch.value.results[index]) {
      allRunnersFinished = false;
    }
  });

  if (allRunnersFinished) {
    pause();
    stopwatch.value.state = STOPWATCH_STATES.FINISHED;
  }
}

module.exports = {
  start,
  pause,
  reset,
  STOPWATCH_STATES,
};
