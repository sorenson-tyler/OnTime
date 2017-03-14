(function() {
    'use strict';

    //Node variables
    var express = require('express');
    var router = express.Router();
    var googleGeocoding = require('google-geocoding');
    var util = require('util');

    //Routes
    router.route('/GetLatLon')
        .get(function(req, res) {
            var address = req.query.address;
            console.log('Address: ' + address);
            googleGeocoding.geocode(address, function(err, location) {
                if (err) {
                    console.log('Result: ' + 'Error: ' + err);
                    res.status(400).send(err);
                } else if (!location) {
                    console.log('Result: ' + 'No result.');
                    res.status(204).send('No result');
                } else {
                    console.log(util.inspect(location, false, null));
                    res.status(200).send(location);
                }
            });
        });

    module.exports = router;
})();
