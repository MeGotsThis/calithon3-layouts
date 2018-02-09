const nodecg = require('./util/nodecg-api-context').get();
const TimeUtils = require('./lib/time');
const HoraroUtils = require('./lib/horaro');

const checklistComplete = nodecg.Replicant('checklistComplete');
const stopwatch = nodecg.Replicant('stopwatch');
const currentRunRep = nodecg.Replicant('currentRun');
const nextRunRep = nodecg.Replicant('nextRun');
const scheduleRep = nodecg.Replicant('schedule');

const STOPWATCH_STATES = {
  NOT_STARTED: 'not_started',
  RUNNING: 'running',
  PAUSED: 'paused',
  FINISHED: 'finished'
};

let csrfName;
let csrfToken;
let startTime;
let setupTime;

const getSchedule = async(scheduleId) => {
  let {runs, csrfName: csrfName_, csrfToken: csrfToken_,
      startTime: startTime_, setupTime: setupTime_} =
    await HoraroUtils.getSchedule(scheduleId);
  csrfName = csrfName_;
  csrfToken = csrfToken_;
  startTime = startTime_;
  setupTime = setupTime_;
  return runs;
};

const validatedEstimates = async (rawRuns, scheduleId) => {
  let changed = false;
  await Promise.all(rawRuns.map(async (run) => {
    let duration = run._horaroEstimate * 1000;
    let estimate = TimeUtils.parseTimeString(run.estimate);
    let setupTime = TimeUtils.parseTimeString(run.setupTime);
    if (duration != estimate + setupTime) {
      await HoraroUtils.updateRunEstimate({
        scheduleId,
        runId: run.id,
        estimate: Math.floor((estimate + setupTime) / 1000),
        csrfName,
        csrfToken,
      });
      changed = true;
      nodecg.log.info(
        `Updated Run Id ${run.id} (${run.name}) for not having matching `
        + `estimate/setup/duration`)
    }
  }))
  return !changed;
};

const updateStartTime = async () => {
  const run = currentRunRep.value;
  const prevRun = [...scheduleRep.value].reverse().find((item) => {
    if (item.type !== 'run') {
      return false;
    }

    return item.order < run.order;
  });

  // This is the case of the first game of the marathon. In this case, I'll let
  // the next game eat the additional setup time for this game to get started
  if (typeof prevRun === 'undefined') {
    if (run.order != 0) {
      throw new Error(
        `Run ${run.id} (${run.name}) does not have a previous run `
        + `and is not the first run`);
    }
    return;
  }

  let now = stopwatch.value.time.timestamp;
  let runStartTime = new Date(startTime);
  scheduleRep.value.forEach((item) => {
    if (item.order < run.order) {
      runStartTime.setSeconds(runStartTime.getSeconds() + item._horaroEstimate);
    }
  });
  let offset = Math.floor((now - runStartTime.getTime()) / 1000);
  let prevSetupTime = TimeUtils.parseTimeString(prevRun.setupTime) / 1000;
  const {id: scheduleId, setupTime} = nodecg.bundleConfig.tracker.schedule;
  let horaroEstimate = prevRun._horaroEstimate + offset;
  let formattedSetupTime = TimeUtils.formatSeconds(
    prevSetupTime + offset, {showHours: true});
  if (horaroEstimate < 0) {
    throw new Error(
      `Run ${prevRun.id} (${prevRun.name}) cannot have negative Horaro `
      + `estimate of ${horaroEstimate}`);
  }
  await HoraroUtils.updateRunEstimateAndData({
    scheduleId,
    runId: prevRun.id,
    estimate: horaroEstimate,
    data: {
      [setupTime]: formattedSetupTime,
    },
    csrfName,
    csrfToken,
  });
}

const updateFinishTime = async () => {
  if (!checklistComplete.value) {
    return;
  }
  if (stopwatch.value.state !== STOPWATCH_STATES.FINISHED) {
    return;
  }

  const run = currentRunRep.value;

  let runRunTime = Math.floor(stopwatch.value.time.raw / 1000);
  let setupTime = TimeUtils.parseTimeString(run.setupTime) / 1000;
  const {id: scheduleId, runTime} = nodecg.bundleConfig.tracker.schedule;
  let horaroEstimate = runRunTime + setupTime;
  let formattedRunTime = TimeUtils.formatSeconds(runRunTime, {showHours: true});
  if (horaroEstimate < 0) {
    throw new Error(
      `Run ${prevRun.id} (${prevRun.name}) cannot have negative Horaro `
      + `estimate of ${horaroEstimate}`);
  }
  await HoraroUtils.updateRunEstimateAndData({
    scheduleId,
    runId: run.id,
    estimate: runRunTime + setupTime,
    data: {
      [runTime]: formattedRunTime,
    },
    csrfName,
    csrfToken,
  });
}

module.exports = {
  getSchedule,
  validatedEstimates,
  updateStartTime,
  updateFinishTime,
  STOPWATCH_STATES,
};
