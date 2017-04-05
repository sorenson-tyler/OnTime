(function() {
    'use strict';

    angular.module('onTime')
        .controller('addEventController', controller);

    controller.$inject = ['$http', '$location'];

    function controller($http, $location) {
        var _this = this;
        var query_string = $location.search();
        _this.code = query_string.code;

        //Variables
        _this.title = 'Add new event';
        //Functions
        _this.createEvent = createEvent;

        function createEvent() {
            $http.post('account/createEvent?code=' + _this.code, _this.event).then(function(response) {
                if (response.data) {

                }
            });
        }
    }
})();
