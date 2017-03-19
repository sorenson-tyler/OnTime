(function() {
    'use strict';

    angular.module('onTime')
        .factory('eventService', reports);

    reports.$inject = ['$http'];

    function reports($http) {
        var service = {
            getLatitudeLongitude: getLatitudeLongitude,
            findStopTimes: findStopTimes
        };
        return service;

        function getLatitudeLongitude(address) {
            return $http.get('/Maps/GetLatLon?address=' + address);
        }

        function findStopTimes(dep, des) {
            return $http.get('/Agencies/Starts?departure=' + dep + '&destination=' + des);
        }
    }
})();
