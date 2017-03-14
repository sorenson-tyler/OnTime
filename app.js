(function() {
    'use strict';

    var express = require('express');
    var app = express();

    //Controllers
    var agencies = require('./Api/agencies');
    var googleCal = require('./Api/googleCalendar');
    var googleMaps = require('./Api/googleMaps');

    var port = 5000;

    app.use('/app', express.static(__dirname + '/app'));
    app.use('/assets', express.static(__dirname + '/assets'));

    //Routes
    app.use('/Agencies', agencies);
    app.use('/Account', googleCal);
    app.use('/Maps', googleMaps);

    app.get('/', function(req, res) {
        res.status(200).sendFile(__dirname + '/app/index.html');
    });

    app.listen(port, function() {
        console.log('running server on port ' + port);
    });
})();
