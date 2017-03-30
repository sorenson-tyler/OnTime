(function() {
    'use strict';

    var app = angular.module('onTime');
    app.config(function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: '../app/components/home/home.html'
            })
            .when('/event', {
                templateUrl: '../app/components/event/event.html'
            })
            .when('/create', {
                templateUrl: '../app/components/addEvent/addEvent.html'
            });
        $locationProvider.html5Mode(true);
    });
})();
