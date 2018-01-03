'use strict';

const WebSocket = require('ws');

const nodecg = require('./util/nodecg-api-context').get();

const NAME = 'Calithon Layouts';

const CONNECTION_FREQUENCY = 1000;

let connection = null;

const gpmdConnected = nodecg.Replicant('gpmd-connected');
const gpmd = nodecg.Replicant('gpmd');
const gpmdAuthorizationCode = nodecg.Replicant('gpmd-authorization-code');

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
    connection.send(JSON.stringify({
      "namespace": "connect",
      "method": "connect",
      "arguments": [NAME, gpmdAuthorizationCode.value],
    }));
  }).on('message', function(data) {
    let jData = JSON.parse(data);
    if (jData.channel === 'connect') {
      // Handle connection specific messages
      if (jData.payload === 'CODE_REQUIRED') {
        nodecg.log.info(
          'Google Play Music Desktop Player authorization required...');
        gpmdAuthorizationCode.value = null;
      } else {
        nodecg.log.info(
          'Saving Google Play Music Desktop Player authorization token...');
        gpmdAuthorizationCode.value = jData.payload;
        connection.send(JSON.stringify({
          "namespace": "connect",
          "method": "connect",
          "arguments": [NAME, gpmdAuthorizationCode.value],
        }));
      }
    } else if ((typeof gpmd.value[jData.channel]) !== 'undefined') {
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

nodecg.listenFor('gpmd:authorization', (data, cb) => {
  nodecg.log.info(
    'Sending Google Play Music Desktop Player authorization code...');
  connection.send(JSON.stringify({
    "namespace": "connect",
    "method": "connect",
    "arguments": [NAME, data],
  }));
});
