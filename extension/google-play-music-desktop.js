'use strict';

const WebSocket = require('ws');

const nodecg = require('./util/nodecg-api-context').get();

const CONNECTION_FREQUENCY = 1000;

let connection = null;

const gpmdConnected = nodecg.Replicant('gpmd-connected');
const gpmd = nodecg.Replicant('gpmd');

gpmdConnected.on('change', (v) => {
  nodecg.log.info('gmpdConnected changed to ' + v);
});

checkGoogleMusicPlayerDesktop();
setInterval(checkGoogleMusicPlayerDesktop, CONNECTION_FREQUENCY);

function checkGoogleMusicPlayerDesktop() {
  if (connection) {
    if (connection.readyState == connection.OPEN ||
        connection.readyState == connection.CONNECTING) {
      return;
    }
  }
  let address = 'localhost';
  let port = 5672;
  connection = new WebSocket(`ws://${address}:${port}/`);
  connection.on('open', function() {
    gpmdConnected.value = true;
  }).on('message', function(data) {
    let jData = JSON.parse(data);
    if ((typeof gpmd.value[jData.channel]) !== 'undefined') {
      gpmd.value[jData.channel] = jData.payload;
    }
  }).on('error', function(err) {
    gpmdConnected.value = false;
    connection = null;
  }).on('close', function() {
    gpmdConnected.value = false;
    connection = null;
  });
}
