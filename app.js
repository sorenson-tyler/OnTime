(function() {
    'use strict';

    var express = require('express');
    var app = express();
    var bodyParser = require('body-parser');
    app.use(bodyParser.json()); // for parsing application/json

    //Controllers
    var agencies = require('./Api/agencies');
    var googleCal = require('./Api/googleCalendar');
    var googleMaps = require('./Api/googleMaps');

    var port = process.env.OPENSHIFT_NODEJS_PORT || 5000;
    var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

    app.use('/app', express.static(__dirname + '/app'));
    app.use('/assets', express.static(__dirname + '/assets'));

    //Routes
    app.use('/Agencies', agencies);
    app.use('/Account', googleCal);
    app.use('/Maps', googleMaps);

    app.get('/', function(req, res) {
        res.status(200).sendFile(__dirname + '/app/index.html');
    });

    app.get('/event', function(req, res) {
        res.status(200).sendFile(__dirname + '/app/index.html');
    });

    app.listen(port, server_ip_address, function() {
        console.log('running server on ' + server_ip_address + ', port ' + port);
    });
})();
