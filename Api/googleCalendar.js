(function() {
    'use strict';

    //Node variables
    var express = require('express');
    var router = express.Router();
    var fs = require('fs');
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');
    //Application variables
    var events = {};
    var login_url;
    var credentials;
    var clientSecret;
    var clientId;
    var redirectUrl;
    var auth;
    var oauth2Client;

    //Routes
    router.route('/google')
        .get(function(req, res) {
            res.status(200).json(login_url);
        });

    router.route('/getEventsByCode')
        .get(function(req, res) {
            getToken(req.query.code, res, listEvents);
        });

    router.route('/createEvent')
        .post(function(req, res) {
            if (auth.credentials == null) {
                getToken(req.query.code, res, function(auth, res) {
                    addEvent(auth, req.body, res);
                });
            } else {
                addEvent(oauth2Client, req.body, res);
            }
        });

    router.route('/getEventsByToken')
        .get(function(req, res) {
            getEventsByToken(req.query.token, res, function(err, events) {
                if (err) {
                    res.status(404);
                }
                res.status(200).json(events);
            });
        });
    module.exports = router;

    //activate
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        credentials = JSON.parse(content);

        clientSecret = credentials.web.client_secret;
        clientId = credentials.web.client_id;
        redirectUrl = credentials.web.redirect_uris[0];
        auth = new googleAuth();
        oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

        getNewToken(oauth2Client);
    });

    // If modifying these scopes, delete your previously saved credentials
    // at ~/.credentials/calendar-nodejs-quickstart.json
    var SCOPES = ['https://www.googleapis.com/auth/calendar'];
    var TOKEN_PATH = 'calendar-nodejs-quickstart.json';

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, token, res, callback) {
        clientSecret = credentials.web.client_secret;
        clientId = credentials.web.client_id;
        redirectUrl = credentials.web.redirect_uris[0];
        auth = new googleAuth();
        oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        if (!token) {
            getNewToken(oauth2Client);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            login_url = null;
            callback(oauth2Client, res);
        }
    }

    /**
     * Get URL for Google Calendar authorization
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     */
    function getNewToken(oauth2Client) {
        var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });

        login_url = authUrl;
    }

    function getToken(code, response, callback) {
        fs.readFile('client_secret.json', function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                return;
            }
            // Authorize a client with the loaded credentials, then call the
            // Google Calendar API.
            credentials = JSON.parse(content);
            clientSecret = credentials.web.client_secret;
            clientId = credentials.web.client_id;
            redirectUrl = credentials.web.redirect_uris[0];
            auth = new googleAuth();
            oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

            oauth2Client.getToken(code, function(err, token) {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    return;
                }
                oauth2Client.credentials = token;
                login_url = null;
                callback(oauth2Client, response);
            });
        });
    }

    function getEventsByToken(token, res, callback) {
        fs.readFile('client_secret.json', function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                res.status(400);
            }
            var credentials = JSON.parse(content);
            authorize(credentials, token, res, listEvents);
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
                getNewToken(auth);
                res.status(400).send(events);
            }
            if (response != null) {
                events = response.items;

                if (res != null) {
                    var returnObj = {
                        events: events,
                        token: auth.credentials
                    };
                    res.status(200).json(returnObj);
                }
            }
        });
    }

    function addEvent(auth, eventDetails, res) {
        var calendar = google.calendar('v3');
        calendar.events.insert({
            auth: auth,
            calendarId: 'primary',
            resource: eventDetails
        }, function(err, event) {
            if (err) {
                console.log('There was an error creating the event: ' + err);
                res.status(400).json(err);
                return;
            }
            console.log('Event created');
            res.status(201).json(event);
        });
    }
})();
