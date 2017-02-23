(function() {
    'use strict';

    angular
        .module('onTime')
        .directive('navbar', directive);

    directive.$inject = [];

    function directive() {

        return {
            templateUrl: 'app/shared/navBar/navBar.html',
            restrict: 'E'
        };
    }
})();
