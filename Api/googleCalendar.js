(function() {
    'use strict';

    //Node variables
    var express = require('express');
    var router = express.Router();
    var events = {};
    var login_url;

    //Routes
    router.route('/')
        .get(function(req, res) {
            res.status(200).json(events);
        });

    router.route('/google')
        .get(function(req, res) {
            res.status(200).json(login_url);
        });

    router.route('/saveCode')
        .get(function(req, res) {
            getToken(req.query.code, res);
        });

    module.exports = router;

    var fs = require('fs');
    var readline = require('readline');
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    // If modifying these scopes, delete your previously saved credentials
    // at ~/.credentials/calendar-nodejs-quickstart.json
    var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
    var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
        process.env.USERPROFILE) + 'app-root/data/.credentials/';
    var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

    // Load client secrets from a local file.

    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Google Calendar API.
        authorize(JSON.parse(content), listEvents);
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
        var clientSecret = credentials.web.client_secret;
        var clientId = credentials.web.client_id;
        var redirectUrl = credentials.web.redirect_uris[0];
        var auth = new googleAuth();
        var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, function(err, token) {
            if (err) {
                getNewToken(oauth2Client, callback);
            } else {
                oauth2Client.credentials = JSON.parse(token);
                callback(oauth2Client);
            }
        });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback to call with the authorized
     *     client.
     */
    function getNewToken(oauth2Client, callback) {
        var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });

        login_url = authUrl;

        /*
           console.log('Authorize this app by visiting this url: ', authUrl);
           var rl = readline.createInterface({
               input: process.stdin,
               output: process.stdout
           });


           rl.question('Enter the code from that page here: ', function(code) {
               rl.close();
         */

        // oauth2Client.getToken(code, function(err, token) {
        //     if (err) {
        //         console.log('Error while trying to retrieve access token', err);
        //         return;
        //     }
        //     oauth2Client.credentials = token;
        //     storeToken(token);
        //     callback(oauth2Client);
        // });
        //});
    }

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    function storeToken(token) {
        try {
            fs.mkdirSync(TOKEN_DIR);
        } catch (err) {
            if (err.code != 'EEXIST') {
                throw err;
            }
        }
        fs.writeFile(TOKEN_PATH, JSON.stringify(token));
        console.log('Token stored to ' + TOKEN_PATH);
    }

    function getToken(code, response) {

        fs.readFile('client_secret.json', function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                return;
            }
            // Authorize a client with the loaded credentials, then call the
            // Google Calendar API.
            //authorize(JSON.parse(content), listEvents);
            var credentials = JSON.parse(content);
            var clientSecret = credentials.web.client_secret;
            var clientId = credentials.web.client_id;
            var redirectUrl = credentials.web.redirect_uris[0];
            var auth = new googleAuth();
            var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

            oauth2Client.getToken(code, function(err, token) {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    return;
                }
                oauth2Client.credentials = token;
                storeToken(token);
                login_url = null;
                listEvents(oauth2Client, response);
            });
        });
    }

    /**
     * Lists the next 10 events on the user's primary calendar.
     *
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    function listEvents(auth, res) {
        var calendar = google.calendar('v3');
        calendar.events.list({
            auth: auth,
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime'
        }, function(err, response) {
            if (err) {
                events = 'The API returned an error: ' + err;
                return;
            }
            events = response.items;

            if (res != null) {
                res.status(200).json(events);
            }
            // if (events.length == 0) {
            //     events = 'No upcoming events found.';
            // } else {
            //     console.log('Upcoming 10 events:');
            //     for (var i = 0; i < events.length; i++) {
            //         var event = events[i];
            //         var start = event.start.dateTime || event.start.date;
            //         console.log('%s - %s', start, event.summary);
            //     }
            // }
        });
    }
})();
