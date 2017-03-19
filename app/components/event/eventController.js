(function() {
    'use strict';

    angular.module('onTime')
        .controller('eventController', controller);

    controller.$inject = ['$rootScope', 'eventService'];

    function controller($rootScope, eventService) {
        var _this = this;

        //Variables
        _this.event = $rootScope.selectedEvent;
        _this.title = _this.event.summary;
        _this.getDepartureLatLng = getDepartureLatLng;

        //Functions
        (function activate() {
            _this.event.geocode = getLatitudeLongitude(_this.event.location);
        })();

        function getDepartureLatLng() {
            eventService.findStopTimes(_this.departure.address, _this.event.location).then(function(response) {
                if (response.data) {
                    _this.stops = response.data;
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
    }
})();
