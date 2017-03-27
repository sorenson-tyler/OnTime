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

        //Functions
        (function activate() {
            if (_this.event === undefined) {
                $location.path('/');
            }
            _this.title = _this.event.summary;
        })();

        function getDepartureLatLng() {
            eventService.getLatitudeLongitude(_this.event.location).then(function(response) {
                if (response.data) {
                    _this.event.geocode = response.data;
                    eventService.getLatitudeLongitude(_this.departure.address).then(function(response) {
                        if (response.data) {
                            var depGeocode = response.data;
                            eventService.findStopTimes(depGeocode, _this.event.geocode).then(function(response) {
                                if (response.data) {
                                    _this.routes = response.data;
                                }
                            });
                        }
                    });
                }
            });
        }

        function getLatitudeLongitude(address) {
            if (_this.event !== null) {
                //Converts the events address into latitude and longitude
                eventService.getLatitudeLongitude(address).then(function(response) {
                    if (response.data) {
                        return response.data;
                    }
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
