(function() {
    'use strict';

    var express = require('express');
    var router = express.Router();
    var mongodb = require('mongodb').MongoClient;
    var util = require('util');
    var Q = require('q');
    var googleGeocoding = require('google-geocoding');

    router.route('/')
        .get(function(req, res) {
            var url = 'mongodb://admin:admin@ds137149.mlab.com:37149/ontime';
            mongodb.connect(url, function(err, db) {
                var collection = db.collection('agency');
                collection.find({}).toArray(
                    function(err, results) {
                        res.status(200).json(results);
                        db.close();
                    }
                );
            });
        });

    //Retrieves closests stops
    router.route('/starts')
        .get(function(req, res) {
            var address = req.query.location;
            var geoLocation;
            console.log('Address: ' + address);
            googleGeocoding.geocode(address, function(err, location) {
                if (err) {
                    console.log('Result: ' + 'Error: ' + err);
                    res.status(400).send(err);
                } else if (!location) {
                    console.log('Result: ' + 'No result.');
                    res.status(204).send('No result');
                } else {
                    geoLocation = location;
                    console.log(util.inspect(geoLocation, false, null));
                    if (geoLocation === undefined ||
                        geoLocation.lat === undefined ||
                        geoLocation.lng === undefined) {
                        res.status(409).json('Invalid departure location');
                    }

                    var url = 'mongodb://admin:admin@ds137149.mlab.com:37149/ontime';
                    mongodb.connect(url, function(err, db) {
                        var collection = db.collection('stops');
                        var query = {
                            loc: {
                                $near: {
                                    $geometry: {
                                        type: 'Point',
                                        coordinates: [geoLocation.lng, geoLocation.lat]
                                    }
                                }
                            }
                        };
                        var nearResult = collection.find(query).limit(10);
                        var locations = [];
                        nearResult.forEach(function(stop) {
                            var stopTimes = db.collection('stop_times').find({
                                stop_id: stop.stop_id
                            });
                            // stop.stopTimes = stopTimes;
                            // stop.stopTimes.forEach(function(time) {
                            //     var trip = db.collection('trips').findOne({
                            //         trip_id: time.trip_id
                            //     });
                            //     time.trip = trip;
                            //     var routes = db.collection('routes').find({
                            //         route_id: trip.route_id
                            //     });
                            //     time.routes = routes;
                            // });
                            var location = {
                                'stopTimes': stop.stopTimes,
                                'name': stop.stop_desc,
                                'location': [stop.stop_lon, stop.stop_lat]
                            };
                            locations.push(location);
                            console.log(util.inspect(location, false, null));
                        });
                        console.log(util.inspect(locations, false, null));
                        res.status(200).json(locations);
                        db.close();
                    });
                }
            });

        });

    //Adds a 2DSphere definition to each record in the collection using it's lat and lon definitions
    router.route('/addLocIndex')
        .get(function(req, res) {
            var url = 'mongodb://admin:admin@ds137149.mlab.com:37149/ontime';
            mongodb.connect(url, function(err, db) {
                var promises = [];
                var query = {}; // select all docs
                if (req.query.collection !== undefined) {
                    var collection = db.collection(req.query.collection);
                    var cursor = collection.find(query);
                    // read all docs
                    cursor.each(function(err, doc) {
                        if (err) {
                            throw err;
                        }

                        if (doc) {
                            // create a promise to update the doc
                            var query = doc;
                            var update = {
                                $set: {
                                    loc: {
                                        type: 'Point',
                                        coordinates: [doc.stop_lon, doc.stop_lat]
                                    }
                                }
                            };

                            var promise =
                                Q.npost(collection, 'update', [query, update])
                                .then(function(updated) {
                                    //console.log(util.inspect(updated, false, null));
                                });

                            promises.push(promise);
                        } else {
                            // close the connection after executing all promises
                            Q.all(promises)
                                .then(function() {
                                    if (cursor.isClosed()) {
                                        console.log('all items have been processed');
                                        db.close();
                                        res.status(200).send('Success');
                                    }
                                })
                                .fail(function() {
                                    console.error;
                                    res.status(500).send('Failed');
                                });
                        }
                    });
                }
            });
        });

    module.exports = router;
})();
