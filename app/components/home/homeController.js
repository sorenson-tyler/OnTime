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

        (function login() {
            $http.get('/account/google').then(function(response) {
                if (response.data) {
                    _this.login_url = response.data;
                }
                });
        })();

        (function getGoogleCode() {
            var query_string = $location.search();
            if (query_string != null) {
             _this.code = query_string.code;
             $http.get('/account/saveCode?code=' + _this.code).then(function(response) {
                 if (response.data) {
                     _this.events = response.data;
                     $rootScope.events = response.data;
                 }
             });
            }
        })();

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
