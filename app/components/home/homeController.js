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

        (function activate() {
            $rootScope.loading = true;
            getGoogleEvents();
        })();

        function login() {
            $http.get('/account/google').then(function(response) {
                if (response.data) {
                    _this.login_url = response.data;
                    $rootScope.loading = false;
                }
            });
        }

        function getGoogleCode() {
            var query_string = $location.search();
            _this.code = query_string.code;
            $http.get('/account/getEventsByCode?code=' + _this.code).then(function(response) {
                if (response.data) {
                    _this.events = response.data.events;
                    $rootScope.events = response.data;
                    $window.localStorage.setItem('clientToken', JSON.stringify(response.data.token));
                    $rootScope.loading = false;
                }
            });
        }

        function details(event) {
            $window.sessionStorage.setItem('selectedEvent', JSON.stringify(event));
            //Navigate to details page
            $location.path('/event').search('event', event.id);
        }

        function addEvent() {
            //Navigate to create event page
            $location.path('/create');
        }

        function getGoogleEvents() {
            var token = $window.localStorage.getItem('clientToken');
            if (token != null) {
                $http.get('/account/getEventsByToken?token=' + token).then(function(response) {
                    if (response.data) {
                        _this.events = response.data.events;
                        $rootScope.events = response.data;
                        $window.localStorage.setItem('clientToken', JSON.stringify(response.data.token));
                    } else {
                        login();
                    }
                    $rootScope.loading = false;
                });
            } else {
                var query_string = $location.search();
                if (query_string.code != null) {
                    getGoogleCode();
                }
                login();
            }
        }
    }

})();
