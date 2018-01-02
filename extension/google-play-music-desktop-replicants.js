'use strict';

const nodecg = require('./util/nodecg-api-context').get();

const gmpdConnected = nodecg.Replicant('gmpd-connected', {
  defaultValue: false,
  persistent: false,
});
const gmpd = nodecg.Replicant('gmpd', {
  defaultValue: {
    playState: false,
    time: null,
    track: null,
  },
  persistent: false,
});
