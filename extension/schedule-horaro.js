const nodecg = require('./util/nodecg-api-context').get();
const TimeUtils = require('./lib/time');
const HoraroUtils = require('./lib/horaro');

const currentRunRep = nodecg.Replicant('currentRun');
const nextRunRep = nodecg.Replicant('nextRun');
const scheduleRep = nodecg.Replicant('schedule');

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
        `Updated Run Id ${run.id} for not having matching `
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

  let now = new Date();
  let runStartTime = new Date(startTime);
  scheduleRep.value.forEach((item) => {
    if (item.order < run.order) {
      runStartTime.setSeconds(runStartTime.getSeconds() + item._horaroEstimate);
    }
  });
  let offset = Math.floor((now.getTime() - runStartTime.getTime()) / 1000);
  let prevSetupTime = TimeUtils.parseTimeString(prevRun.setupTime) / 1000;
  const {id: scheduleId, setupTime} = nodecg.bundleConfig.tracker.schedule;
  await HoraroUtils.updateRunEstimateAndData({
    scheduleId,
    runId: prevRun.id,
    estimate: prevRun._horaroEstimate + offset,
    data: {
      [setupTime]:
        TimeUtils.formatSeconds(prevSetupTime + offset, {showHours: true}),
    },
    csrfName,
    csrfToken,
  });
}

module.exports = {
  getSchedule,
  validatedEstimates,
  updateStartTime,
};
