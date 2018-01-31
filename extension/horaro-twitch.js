'use strict';

const cheerio = require('cheerio');
const request = require('request-promise').defaults({
  jar: true, // <= Automatically saves and re-uses cookies.
  // Fiddler proxy
  // proxy: 'http://127.0.0.1:8888',
  // rejectUnauthorized: false,
});
const entities = require('entities');

const LOGIN_URL = 'https://horaro.org/-/oauth/start?provider=twitch';

const nodecg = require('./util/nodecg-api-context').get();
const loginLog = new nodecg.Logger(`${nodecg.bundleName}:tracker`);
let isFirstLogin = true;

// Fetch the login page, and run the response body through cheerio
// so we can extract the CSRF token from the hidden input field.
// Then, POST with our username, password, and the csrfmiddlewaretoken.
const loginToTracker = async () => {
  if (isFirstLogin) {
    loginLog.info('Logging in as %s...', nodecg.bundleConfig.tracker.username);
  } else {
    loginLog.info(
      'Refreshing tracker login session as %s...',
       nodecg.bundleConfig.tracker.username);
  }

  try {
    let response, $, csfrToken, client_id, request_id;

    // First request from horaro
    response = await request({
      uri: LOGIN_URL,
      resolveWithFullResponse: true,
    });
    $ = cheerio.load(response.body);
    await request({
      method: 'GET',
      uri: 'https://passport.twitch.tv' + $('.tracking-pixel').attr('src'),
      headers: {
        Referer: response.request.uri.href,
      },
    });
    csfrToken = entities.decodeHTML($('#authenticity_token').val());
    client_id = $('#loginForm > input[name="client_id"]').val();
    request_id = $('#loginForm > input[name="request_id"]').val();

    // Next request the login submit
    await request({
      method: 'POST',
      uri: 'https://passport.twitch.tv/client_event/new',
      form: {
        username_filled: 'true',
        password_filled: 'true',
        event_type: 'login_submit',
        client_id,
        request_id,
      },
      headers: {
        Referer: response.request.uri.href,
        "X-CSRF-Token": csfrToken,
      },
      resolveWithFullResponse: true,
    });

    // I guess I have to handle the captcha
    if ($('input[name="show_captcha"]').val() === 'true') {
      // State that the captcha is shown
      await request({
        method: 'POST',
        uri: 'https://passport.twitch.tv/client_event/new',
        form: {
          event_type: 'captcha_shown',
          client_id,
          request_id,
        },
        headers: {
          Referer: response.request.uri.href,
          "X-CSRF-Token": csfrToken,
        },
        resolveWithFullResponse: true,
      });
      // State that the captcha is solved
      await request({
        method: 'POST',
        uri: 'https://passport.twitch.tv/client_event/new',
        form: {
          event_type: 'captcha_success',
          client_id: client_id,
          request_id: request_id,
        },
        headers: {
          Referer: response.request.uri.href,
          "X-CSRF-Token": csfrToken,
        },
        resolveWithFullResponse: true,
      });
    }

    // Submit the login
    let origin_uri = $('#loginForm > input[name="origin_uri"]').val();
    let redirect_path = $('#loginForm > input[name="redirect_path"]').val();
    let embed = $('#loginForm > input[name="embed"]').val();
    let time_to_submit = $('#loginForm > input[name="time_to_submit"]').val();
    response = await request({
      method: 'POST',
      uri: 'https://passport.twitch.tv' + $('#loginForm').attr('action'),
      form: {
        username: nodecg.bundleConfig.tracker.username,
        password: nodecg.bundleConfig.tracker.password,
        client_id,
        request_id,
        origin_uri,
        redirect_path,
        embed,
        time_to_submit,
      },
      headers: {
        Referer: response.request.uri.href,
        "X-CSRF-Token": entities.decodeHTML($('#authenticity_token').val()),
      },
      simple: false,
      json: true,
    });
    if (response.captcha) {
      throw new Error("captcha is required");
    }

    // Handle the two factor authentication
    response = await request({
      uri: 'https://passport.twitch.tv' + response.redirect,
      simple: false,
      resolveWithFullResponse: true,
    });
    $ = cheerio.load(response.body);
    csfrToken = entities.decodeHTML($('#authenticity_token').val());
    let action = $('#two-factor-submit').attr('action');
    client_id = $('#two-factor-submit > input[name="client_id"]').val();
    request_id = $('#two-factor-submit > input[name="request_id"]').val();
    origin_uri = $('#two-factor-submit > input[name="origin_uri"]').val();
    redirect_path = $('#two-factor-submit > input[name="redirect_path"]').val();
    embed = $('#two-factor-submit > input[name="embed"]').val();
    let code = $('#two-factor-submit > input[name="code"]').val();

    // Send the two factor authentication
    response = await new Promise((resolve, reject) => {
      // But I need to wait for a message from the dashboard
      const waitingForCode = (authy_token) => {
        nodecg.unlisten('tracker:2FA', waitingForCode);
        resolve(request({
          method: 'POST',
          uri:
            'https://passport.twitch.tv' + action,
          form: {
            authy_token,
            remember_2fa: 'true',
            client_id,
            request_id,
            origin_uri,
            redirect_path,
            embed,
            code,
          },
          headers: {
            Referer: response.request.uri.href,
            "X-CSRF-Token": csfrToken,
          },
          simple: false,
        }));
      };
      nodecg.listenFor('tracker:2FA', waitingForCode);
    });
    if (response === 'Forbidden - CSRF token invalid\n') {
      throw new Error(response);
    }

    // We should be logged in by now
    if (isFirstLogin) {
      isFirstLogin = false;
      loginLog.info(
        'Logged in as %s.', nodecg.bundleConfig.tracker.username);
    } else {
      loginLog.info(
        'Refreshed session as %s.', nodecg.bundleConfig.tracker.username);
    }
  } catch(err) {
    loginLog.error('Error authenticating!\n', err);
    throw err;
  }
}

module.exports = {loginToTracker};
