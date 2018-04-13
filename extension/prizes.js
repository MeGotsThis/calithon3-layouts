'use strict';

// Packages
const clone = require('clone');
const equal = require('deep-equal');
const numeral = require('numeral');

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const tiltify = require('./tiltify');

const POLL_INTERVAL = 60 * 1000;

const currentPrizes = nodecg.Replicant('currentPrizes', {defaultValue: []});
const allPrizes = nodecg.Replicant('allPrizes', {defaultValue: []});

// Get initial data
update();

// Get latest prize data every POLL_INTERVAL milliseconds
let updateInterval = setInterval(update, POLL_INTERVAL);

// Dashboard can invoke manual updates
nodecg.listenFor('updatePrizes', (data, cb) => {
  nodecg.log.info('Manual prize update button pressed, invoking update...');
  clearInterval(updateInterval);
  updateInterval = setInterval(update, POLL_INTERVAL);
  update()
    .spread((updatedCurrent, updatedAll) => {
      const updatedEither = updatedCurrent || updatedAll;
      if (updatedEither) {
        nodecg.log.info('Prizes successfully updated');
      } else {
        nodecg.log.info('Prizes unchanged, not updated');
      }

      cb(null, updatedEither);
    }, (error) => {
      cb(error);
    });
});

/**
 * Grabs the latest prizes from the tracker.
 */
async function update() {
  const rewards = await tiltify.getRewards();

  const _allPrizes = rewards.map(formatPrize);
  const _currentPrizes = clone(_allPrizes.filter((prize) => prize.active));

  if (!equal(allPrizes.value, _allPrizes)) {
    allPrizes.value = _allPrizes;
  }

  if (!equal(currentPrizes.value, _currentPrizes)) {
    currentPrizes.value = _currentPrizes;
  }
}

/*
 * @typedef {Object} FormattedPrize
 * @property {string} name
 * @property {string} provided
 * @property {string} description
 * @property {string} image
 * @property {string} minimumbid
 * @property {boolean} grand
 * @property {string} type
 */

/**
 * Formats a raw prize object from the GDQ Tracker API into a slimmed-down
 * version for our use.
 * @param {Object} prize - A raw prize object from the GDQ Tracker API.
 * @return {FormattedPrize}
 * The formatted prize object.
 */
function formatPrize(prize) {
  const active = prize.alwaysActive || (prize.active
    && (prize.startsAt === 0 || Date.now() >= prize.startsAt)
    && (prize.endsAt === 0 || Date.now() <= prize.endsAt)
    && (prize.remaining === null || prize.remaining > 0));
  return {
    id: prize.pk,
    name: prize.name,
    provided: 'Unknown',
    description: prize.name || prize.description,
    image: prize.image.src,
    minimumbid: numeral(prize.amount).format('$0,0[.]00'),
    grand: nodecg.bundleConfig.prizes.grand.includes(prize.id),
    sumdonations: nodecg.bundleConfig.prizes.sum.includes(prize.id),
    active,
    type: 'prize',
  };
}
