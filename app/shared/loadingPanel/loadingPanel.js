(function() {
    'use strict';

    angular
        .module('onTime')
        .directive('loadingPanel', directive);

    directive.$inject = [];

    function directive() {

        return {
            templateUrl: 'app/shared/loadingPanel/loadingPanel.html',
            restrict: 'E'
        };
    }
})();
