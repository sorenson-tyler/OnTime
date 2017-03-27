(function() {
    'use strict';

    angular
        .module('onTime')
        .controller('HomeController', homeController);

    homeController.$inject = ['$location', '$http', '$rootScope', '$window'];

    function homeController($location, $http, $rootScope, $window) {
        var _this = this;
        //Variables
        _this.title = 'Home';
        //Functions
        _this.details = details;
        _this.addEvent = addEvent;

        function details(event) {
            $window.sessionStorage.setItem('selectedEvent', JSON.stringify(event));
            //Navigate to details page
            $location.path('/event').search('event', event.id);
        }

        function addEvent() {
            //Navigate to create event page
            $location.path('/create');
        }

        (function getGoogleEvents() {
            $http.get('/account').then(function(response) {
                if (response.data) {
                    _this.events = response.data;
                    $rootScope.events = response.data;
                }
            });
        })();
    }

})();
