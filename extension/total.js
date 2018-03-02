'use strict';

// Packages
const Pusher = require('pusher-js');
const request = require('request-promise');

// Ours
const formatDollars = require('../util/format-dollars');
const nodecg = require('./util/nodecg-api-context').get();
const tiltify = require('./tiltify');

const autoUpdateTotal = nodecg.Replicant('autoUpdateTotal');
const total = nodecg.Replicant('total');

autoUpdateTotal.on('change', (newVal) => {
  if (newVal) {
    nodecg.log.info('Automatic updating of donation total enabled');
    manuallyUpdateTotal(true);
  } else {
    nodecg.log.warn('Automatic updating of donation total DISABLED');
  }
});

if (nodecg.bundleConfig && nodecg.bundleConfig.donation.enabled) {
  const pusher = new Pusher(nodecg.bundleConfig.donation.pusherKey);
  const pusherable_id = 'event-' + nodecg.bundleConfig.donation.slug;

  // Get initial data, then listen for donations.
  updateTotal().then(() => {
    let channel = pusher.subscribe('donation_updates');
    channel.bind('new_confirmed_donation', function(data) {
      if(pusherable_id === data.pusherable_id) {
        newDonation(data);
      }
    });
  });
} else {
  nodecg.log.warn(
    `cfg/${nodecg.bundleName}.json is missing the "donation" property.`);
}

nodecg.listenFor('setTotal', ({type, newValue}) => {
  if (type === 'cash') {
    total.value = {
      raw: parseFloat(newValue),
      formatted: formatDollars(newValue, {cents: false}),
    };
    nodecg.sendMessage('total:manuallyUpdated', total.value);
  } else {
    nodecg.log.error('Unexpected "type" sent to setTotal: "%s"', type);
  }
});

// Dashboard can invoke manual updates
nodecg.listenFor('updateTotal', manuallyUpdateTotal);

/**
 * Handles manual "updateTotal" requests.
 * @param {Boolean} [silent = false] - Whether to print info to logs or not.
 * @param {Function} [cb] - The callback to invoke after the total has been
 * updated.
 * @return {undefined}
 */
function manuallyUpdateTotal(silent, cb = function() {}) {
  if (!silent) {
    nodecg.log.info(
      'Manual donation total update button pressed, invoking update...');
  }

  updateTotal().then((updated) => {
    if (updated) {
      nodecg.sendMessage('total:manuallyUpdated', total.value);
      nodecg.log.info('Donation total successfully updated');
    } else {
      nodecg.log.info('Donation total unchanged, not updated');
    }

    cb(null, updated);
  }).catch((error) => {
    cb(error);
  });
}

/**
 * Updates the "total" replicant with the latest value from the GDQ Tracker API.
 * @return {Promise} - A promise.
 */
async function updateTotal() {
  let data = await tiltify.getEvent();

  const freshTotal = parseFloat(data.totalAmountRaised || 0);

  if (freshTotal === total.value.raw) {
    return false;
  }

  mockTotalAmount = freshTotal;

  total.value = {
    raw: freshTotal,
    formatted: formatDollars(freshTotal, {cents: false}),
  };
  return true;
}

function newDonation(data) {
  const donation = formatDonation({
    rawAmount: data.donation_amt,
    newTotal: data.display_total_amt_raised,
  });
  nodecg.sendMessage('donation', donation);

  if (autoUpdateTotal.value) {
    total.value = {
      raw: donation.rawNewTotal,
      formatted: donation.newTotal,
    };
  }
}

/*
 * @typedef {Object} FormattedDonation
 * @property {String} amount
 * @property {Number} rawAmount
 * @property {String} newTotal
 * @property {Number} rawNewTotal
 */

/**
 * Formats each donation coming in from the socket repeater, which in turn is
 * receiving them from a Postback URL on the tracker.
 * @param {Number} rawAmount - The numeric amount of the donation.
 * @param {Number} rawNewTotal - The new numeric donation total,
 * including this donation.
 * @return {FormattedDonation} - A formatted donation.
 */
function formatDonation({rawAmount, newTotal}) {
  rawAmount = parseFloat(rawAmount);
  const rawNewTotal = parseFloat(newTotal);

  // Format amount
  let amount = formatDollars(rawAmount);

  // If a whole dollar, get rid of cents
  if (amount.endsWith('.00')) {
    amount = amount.substr(0, amount.length - 3);
  }

  return {
    amount,
    rawAmount,
    newTotal: formatDollars(rawNewTotal, {cents: false}),
    rawNewTotal,
  };
}

let mockTotalAmount = 0;

if (nodecg.bundleConfig && nodecg.bundleConfig.donation.mock)
{
  setInterval(() => {
    const maxAmount = nodecg.bundleConfig.donation.mockAmount;
    let amount = Math.floor(Math.random() * (maxAmount - 1)) + 1;
    mockTotalAmount += amount;
    newDonation({
      donation_amt: amount,
      display_total_amt_raised: mockTotalAmount,
    });
  }, nodecg.bundleConfig.donation.mockInterval * 1000);
}
