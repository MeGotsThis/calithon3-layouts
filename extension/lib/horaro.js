'use strict';

const cheerio = require('cheerio');
const request = require('request-promise').defaults({
  jar: true, // <= Automatically saves and re-uses cookies.
});

module.exports = {
  async getSchedule(scheduleId) {
    let runsHtml = await request({
      uri: `https://horaro.org/-/schedules/${scheduleId}`,
    });
    let $ = cheerio.load(runsHtml);
    return JSON.parse($('#h-item-data').contents().text());
  },
};
