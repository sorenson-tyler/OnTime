(function() {
    'use strict';

    var express = require('express');
    var router = express.Router();
    var mongodb = require('mongodb').MongoClient;
    var util = require('util');
    var q = require('q');
    var _ = require('lodash');
    var events = require('events');

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
        .post(function(req, res) {
            var eventEmitter = new events.EventEmitter();
            var params = req.body;
            var geoLocationDep = params.dep;
            var geoLocationDes = params.des;
            console.log(util.inspect(geoLocationDep, false, null));
            console.log(util.inspect(geoLocationDes, false, null));

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
            var trips;
            var routes;
            var fullRoutes = [];
            var stopsCollection;
            var stopTimesCollection;
            var database;
            var stopTimes = 0;

            var url = 'mongodb://admin:admin@ds137149.mlab.com:37149/ontime';

            mongodb.connect(url, function(err, db) {
                database = db;
                eventEmitter.emit('dbReady');
            });
            eventEmitter.on('dbReady', function() {
                findStops(database, queryDes, function(err, result) {
                    destinationStops = result;
                    eventEmitter.emit('desStopsRecieved');
                });
            });
            eventEmitter.on('dbReady', function() {
                findStops(database, queryDep, function(err, result) {
                    departureStops = result;
                    eventEmitter.emit('depStopsRecieved');
                });
            });
            eventEmitter.on('desStopsRecieved', function() {
                var queryDesTimes = {
                    stop_id: {
                        $in: _.map(destinationStops, 'stop_id')
                    }
                };
                findStopTimes(database, queryDesTimes, function(err, result) {
                    destinationStopTimes = result;
                    if (stopTimes === 0) {
                        eventEmitter.emit('desStopTimesRecieved');
                    } else {
                        eventEmitter.emit('findFullRoutes');
                    }
                });
            });
            eventEmitter.on('depStopsRecieved', function() {
                var queryDepTimes = {
                    stop_id: {
                        $in: _.map(departureStops, 'stop_id')
                    }
                };
                findStopTimes(database, queryDepTimes, function(err, result) {
                    departureStopTimes = result;
                    if (stopTimes === 0) {
                        eventEmitter.emit('depStopTimesRecieved');
                    } else {
                        eventEmitter.emit('findFullRoutes');
                    }
                });
            });
            eventEmitter.on('desStopTimesRecieved', function() {
                stopTimes++;
            });
            eventEmitter.on('depStopTimesRecieved', function() {
                stopTimes++;
            });
            eventEmitter.on('findFullRoutes', function() {
                generateReturnObject(departureStopTimes, destinationStopTimes,
                    departureStops, destinationStops,
                    function(result) {
                        fullRoutes = _.uniq(result, false, function(o) {
                            return o.departure.stop_id && o.destination.stop_id;
                        });
                        eventEmitter.emit('getRoutes');
                    });
            });
            eventEmitter.on('getRoutes', function() {
                var processed = 0;
                fullRoutes.forEach(function(fullRoute) {
                    getTrip(fullRoute, database, function(err, tripResult) {
                        fullRoute = tripResult;
                        getRoute(fullRoute, database, function(err, routeResult) {
                            fullRoute = routeResult;
                            processed++;
                            if (processed === fullRoutes.length) {
                                eventEmitter.emit('return');
                            }
                        });
                    });
                });
            });
            eventEmitter.on('return', function() {
                database.close();
                res.status(200).json(fullRoutes);
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

    function findStops(db, query, callback) {
        db.collection('stops').find(query).toArray(function(err, result) {
            if (result === null) {
                res.status(404)
                    .json('Your requested departure address does not have nearby public transit');
                callback('Your requested departure address does not have nearby public transit', null);
            }
            callback(null, result);
        });
    }

    function findStopTimes(db, query, callback) {
        db.collection('stop_times').find(query).toArray(function(err, result) {
            var uniques = _.uniq(result, false, function(o) {
                return o.trip_id;
            });
            callback(null, uniques);
        });
    }

    function generateReturnObject(departureStopTimes, destinationStopTimes,
        departureStops, destinationStops, callback) {
        var fullRoutes = [];
        departureStopTimes.forEach(function(depTime) {
            var existingStops = _.filter(fullRoutes, function(o) {
                return o.departure.stop_id === depTime.stop_id &&
                    o.departure.stopTimes[0].trip_id === depTime.trip_id;
            });
            if (existingStops.length === 0) {
                var goesThrough =
                    _.find(destinationStopTimes,
                        function(object) {
                            return object.trip_id === depTime.trip_id;
                        });
                if (goesThrough !== undefined) {
                    var depStop = _.filter(departureStops, function(o) {
                        return o.stop_id === depTime.stop_id;
                    })[0];
                    depStop.stopTimes = _.filter(departureStopTimes, function(o) {
                        return o.stop_id === depTime.stop_id &&
                            o.trip_id === depTime.trip_id;
                    });
                    var matchingDesTime = goesThrough;
                    var desStop = _.filter(destinationStops, function(o) {
                        return o.stop_id === matchingDesTime.stop_id;
                    })[0];
                    desStop.stopTimes = _.filter(destinationStopTimes, function(o) {
                        return o.stop_id === desStop.stop_id &&
                            o.trip_id === depTime.trip_id;
                    });
                    fullRoutes.push({
                        departure: depStop,
                        destination: desStop
                    });
                }
            }
        });
        callback(fullRoutes);
    }

    function getTrip(fullRoute, db, callback) {
        var query = {
            trip_id: fullRoute.departure.stopTimes[0].trip_id
        };
        db.collection('trips').findOne(query, function(err, result) {
            var trip = result;
            fullRoute.trip = trip;
            callback(null, fullRoute);
        });
    }

    function getRoute(fullRoute, db, callback) {
        var query = {
            route_id: fullRoute.trip.route_id
        };
        db.collection('routes').findOne(query, function(err, result) {
            var route = result;
            fullRoute.route = route;
            callback(null, fullRoute);
        });
    }
})();
