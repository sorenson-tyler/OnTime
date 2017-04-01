(function() {
    'use strict';

    angular
        .module('onTime')
        .directive('login', directive);

    directive.$inject = [];

    function directive() {

        return {
            templateUrl: 'app/shared/login/login.html',
            restrict: 'E'
        };
    }
})();
