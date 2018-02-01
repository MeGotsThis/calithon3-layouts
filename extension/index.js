'use strict';

// Packages
const cheerio = require('cheerio');
const request = require('request-promise').defaults({
  jar: true, // <= Automatically saves and re-uses cookies.
});
const entities = require('entities');

// Ours
const nodecgApiContext = require('./util/nodecg-api-context');

module.exports = function(nodecg) {
  // Store a reference to this nodecg API context in a place where other libs
  // can easily access it.
  // This must be done before any other files are `require`d.
  nodecgApiContext.set(nodecg);

  if (!nodecg.bundleConfig.tracker) {
      throw new Error(
        `You must populate the "tracker" configuration object in `
        + `cfg/${nodecg.bundleName}.json`);
  }

  if (nodecg.bundleConfig.useMockData) {
    nodecg.log.warn(
      'WARNING! useMockData is true, you will not receive real data from the '
      + 'tracker!');
  }

  // Be careful when re-ordering these.
  // Some of them depend on Replicants initialized in others.
  require('./timekeeping');
  require('./obs');
  require('./prizes');
  require('./bids');
  require('./total');
  require('./countdown');

  require('./google-play-music-desktop-replicants');
  if (nodecg.bundleConfig.googlePlayMusic) {
    require('./google-play-music-desktop');
  } else {
    nodecg.log.warn('"googlePlayMusic" is not defined in cfg! '
      + 'Google Play Music Desktop Player integration will be disabled.');
  }

  const {loginToTracker} = require('./horaro');
  loginToTracker().then(() => {
    const schedule = require('./schedule');
    schedule.on('permissionDenied', () => {
      loginToTracker().then(schedule.update);
    });

      // Tracker logins expire every 2 hours. Re-login every 90 minutes.
      setInterval(loginToTracker, 90 * 60 * 1000);
  });

  if (nodecg.bundleConfig.twitch) {
    require('./twitch-ads');
    require('./twitch-bits');

    // If the appropriate config params are present,
    // automatically update the Twitch game and title when currentRun changes.
    if (nodecg.bundleConfig.twitch.titleTemplate) {
      nodecg.log.info('Automatic Twitch stream title updating enabled.');
      require('./twitch-title-updater');
    }
  }

  if (nodecg.bundleConfig.twitter && nodecg.bundleConfig.twitter.userId) {
    if (nodecg.bundleConfig.twitter.enabled) {
      require('./twitter');
    }
  } else {
    nodecg.log.warn('"twitter" is not defined in cfg/sgdq17-layouts.json! '
      + 'Twitter integration will be disabled.');
  }
};
