(function () {
    'use strict';

    angular
        .module('onTime')
        .controller('HomeController', homeController);

        homeController.$inject = ['$location']

        function homeController($location) {
        	var vm = this;
        }

    })();