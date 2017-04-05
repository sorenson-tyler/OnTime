/*jshint esversion: 6 */
(function() {
    'use strict';

    angular.module('onTime')
        .controller('eventController', controller);

    controller.$inject = ['$rootScope', 'eventService', '$scope', '$location', '$window'];

    function controller($rootScope, eventService, $scope, $location, $window) {
        var _this = this;

        //Variables
        _this.event = angular.fromJson($window.sessionStorage.getItem('selectedEvent'));
        _this.getDepartureLatLng = getDepartureLatLng;
        var addressFormat = 'Address, City, State Zipcode.';

        //Functions
        (function activate() {
            if (_this.event === undefined) {
                $location.path('/');
            }
            _this.title = _this.event.summary;
        })();

        function getDepartureLatLng() {
            if (_this.departure.address != null) {
                $rootScope.loading = true;
                eventService.getLatitudeLongitude(_this.event.location).then(function(response) {
                    if (response.data) {
                        _this.event.geocode = response.data;
                        eventService.getLatitudeLongitude(_this.departure.address).then(function(response) {
                            if (response.data) {
                                var depGeocode = response.data;
                                eventService.findStopTimes(depGeocode, _this.event.geocode).then(function(response) {
                                    if (response.data.length > 0) {
                                        _this.routes = response.data;
                                    } else {
                                        _this.error = 'Unable to find public transit between ' + _this.departure.address +
                                            ' and ' + _this.event.location + '. Try another departure address. Results are most accurate when the addresses are in the following format: ' +
                                            addressFormat;
                                    }
                                    $rootScope.loading = false;
                                });
                            } else {
                                _this.error = 'Unable to find address: ' + _this.departure.address +
                                    '. Make sure your location is in the correct format: ' +
                                    addressFormat;
                                $rootScope.loading = false;
                            }
                        });
                    } else {
                        _this.error = 'Unable to find address: ' + _this.event.location +
                            '. Make sure your location is in the correct format: ' +
                            addressFormat;
                        $rootScope.loading = false;
                    }
                });
            }
        }

        function getLatitudeLongitude(address) {
            if (_this.event !== null) {
                $rootScope.loading = true;
                //Converts the events address into latitude and longitude
                eventService.getLatitudeLongitude(address).then(function(response) {
                    if (response.data) {
                        return response.data;
                    }
                    $rootScope.loading = false;
                });
            }
        }

        $scope.style = function(route) {
            return {
                'background-color': '#' + route.route.route_color,
                'color': '#' + route.route.route_text_color
            };
        };
    }
})();
