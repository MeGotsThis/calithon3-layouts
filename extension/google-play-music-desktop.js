'use strict';

const WebSocket = require('ws');

const nodecg = require('./util/nodecg-api-context').get();

const CONNECTION_FREQUENCY = 1000;

let connection = null;

const gmpdConnected = nodecg.Replicant('gmpd-connected');
const gmpd = nodecg.Replicant('gmpd');

gmpdConnected.on('change', (v) => {
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
    gmpdConnected.value = true;
  }).on('message', function(data) {
    let jData = JSON.parse(data);
    if ((typeof gmpd.value[jData.channel]) != 'undefined') {
      gmpd.value[jData.channel] = jData.payload;
    }
  }).on('error', function(err) {
    gmpdConnected.value = false;
    connection = null;
  }).on('close', function() {
    gmpdConnected.value = false;
    connection = null;
  });
}
