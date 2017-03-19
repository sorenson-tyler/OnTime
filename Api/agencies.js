(function() {
    'use strict';

    var express = require('express');
    var router = express.Router();
    var mongodb = require('mongodb').MongoClient;
    var util = require('util');
    var q = require('q');
    var googleGeocoding = require('google-geocoding');
    var _ = require('lodash');

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
            var departure = req.query.departure;
            var destination = req.query.destination;
            var geoLocationDep;
            var geoLocationDes;
            console.log('Departure: ' + departure);
            console.log('Destination: ' + destination);
            googleGeocoding.geocode(departure, function(err, location) {
                if (err) {
                    console.log('Result Departure: ' + 'Error: ' + err);
                    res.status(400).send(err);
                } else if (!location) {
                    console.log('Result Departure: ' + 'No result.');
                    res.status(204).send('No result');
                } else {
                    geoLocationDep = location;
                    googleGeocoding.geocode(destination, function(err, location) {
                        if (err) {
                            console.log('Result Destination: ' + 'Error: ' + err);
                            res.status(400).send(err);
                        } else if (!location) {
                            console.log('Result Destination: ' + 'No result.');
                            res.status(204).send('No result');
                        } else {
                            geoLocationDes = location;
                            console.log(util.inspect(geoLocationDep, false, null));
                            console.log(util.inspect(geoLocationDes, false, null));

                            var url = 'mongodb://admin:admin@ds137149.mlab.com:37149/ontime';
                            mongodb.connect(url, function(err, db) {
                                var stopsCollection = db.collection('stops');
                                var queryDep = {
                                    loc: {
                                        $near: {
                                            $geometry: {
                                                type: 'Point',
                                                coordinates: [geoLocationDep.lng, geoLocationDep.lat]
                                            },
                                            $maxDistance: 500
                                        }
                                    }
                                };
                                var queryDes = {
                                    loc: {
                                        $near: {
                                            $geometry: {
                                                type: 'Point',
                                                coordinates: [geoLocationDes.lng, geoLocationDes.lat]
                                            },
                                            $maxDistance: 500
                                        }
                                    }
                                };
                                var departureStops;
                                var destinationStops;
                                var departureStopTimes;
                                var destinationStopTimes;
                                stopsCollection.find(queryDep).toArray(function(err, result) {
                                    departureStops = result;
                                    if (departureStops === null) {
                                        res.status(404)
                                        .json('Your requested departure address does not have nearby public transit');
                                        return;
                                    }
                                    stopsCollection.find(queryDes).toArray(function(err, result) {
                                        destinationStops = result;
                                        if (destinationStops === null) {
                                            res.status(404)
                                            .json('Your requested destination address does not have nearby public transit');
                                            return;
                                        }
                                        db.collection('stop_times').find({
                                            stop_id: {
                                                $in: _.map(departureStops, 'stop_id')
                                            }
                                        }).toArray(function(err, result) {
                                            departureStopTimes = result;
                                            departureStopTimes = _.uniq(departureStopTimes, false, function(o) {
                                                return o.trip_id;
                                            });
                                            db.collection('stop_times').find({
                                                stop_id: {
                                                    $in: _.map(destinationStops, 'stop_id')
                                                }
                                            }).toArray(function(err, result) {
                                                destinationStopTimes = result;
                                                destinationStopTimes = _.uniq(destinationStopTimes, false, function(o) {
                                                    return o.trip_id;
                                                });
                                                var fullRoutes = [];
                                                for (var i = 0; i < Object.keys(departureStopTimes).length; i++) {
                                                    var stopTime = departureStopTimes[i];
                                                    var goesThrough =
                                                        _.findIndex(destinationStopTimes,
                                                            function(object) {
                                                                return object.trip_id === stopTime.trip_id;
                                                            });
                                                    if (goesThrough > -1) {
                                                        //TODO Grab the route with the trip id
                                                        //TODO Filter duplicates some how
                                                        var depStop = _.filter(departureStops, function(o) {
                                                            return  o.stop_id === stopTime.stop_id;
                                                        });
                                                        depStop[0].stopTimes = _.filter(departureStopTimes, function(o) {
                                                            return  o.stop_id === stopTime.stop_id &&
                                                                    o.trip_id === stopTime.trip_id;
                                                        });
                                                        var matchingDesTime = destinationStopTimes[goesThrough];
                                                        var desStop = _.filter(destinationStops, function(o) {
                                                            return  o.stop_id === matchingDesTime.stop_id;
                                                        });
                                                        desStop[0].stopTimes = _.filter(destinationStopTimes, function(o) {
                                                            return  o.stop_id === desStop.stop_id &&
                                                                    o.trip_id === stopTime.trip_id;
                                                        });
                                                        var stop = {
                                                            depStop: depStop[0],
                                                            desStop: desStop[0]
                                                        };
                                                        fullRoutes.push(stop);
                                                    }
                                                }
                                                db.close();
                                                res.status(200).json(fullRoutes);
                                            });
                                        });

                                    });
                                });
                            });
                        }
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
                                q.npost(collection, 'update', [query, update])
                                .then(function(updated) {
                                    //console.log(util.inspect(updated, false, null));
                                });

                            promises.push(promise);
                        } else {
                            // close the connection after executing all promises
                            q.all(promises)
                                .then(function() {
                                    if (cursor.isClosed()) {
                                        console.log('all items have been processed');
                                        db.close();
                                        res.status(200).send('Success');
                                    }
                                })
                                .fail(function() {
                                    res.status(500).send('Failed');
                                });
                        }
                    });
                }
            });
        });


    module.exports = router;
})();
