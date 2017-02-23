(function() {
    'use strict';

    var express = require('express');
    var router = express.Router();
    var mongodb = require('mongodb').MongoClient;

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

    module.exports = router;
})();
