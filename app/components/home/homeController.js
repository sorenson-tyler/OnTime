(function() {
    'use strict';

    angular
        .module('onTime')
        .controller('HomeController', homeController);

    homeController.$inject = ['$location', '$http', '$rootScope'];

    function homeController($location, $http, $rootScope) {
        var _this = this;
        //Variables
        _this.title = 'Home';
        //Functions
        _this.details = details;
        _this.addEvent = addEvent;

        _this.events = [{
                title: 'Class Meeting',
                location: '45458 Camino Monzon',
                city: 'temecula',
                state: 'CA',
                time: '2:00 PM',
                date: '20160102T00:00:00',
                id: 1
            },
            {
                title: 'Church Meeting',
                location: '45458 Camino Monzon',
                city: 'temecula',
                state: 'CA',
                time: '4:30 PM',
                date: '20160102T00:00:00',
                id: 2
            },
            {
                title: 'Work Meeting',
                location: '45458 Camino Monzon',
                city: 'temecula',
                state: 'CA',
                time: '2:15 PM',
                date: '20160102T00:00:00',
                id: 3
            },
            {
                title: 'Class Meeting',
                location: '45458 Camino Monzon',
                city: 'temecula',
                state: 'CA',
                time: '2:00 PM',
                date: '20160102T00:00:00',
                id: 4
            },
            {
                title: 'Class Meeting',
                location: '45458 Camino Monzon',
                city: 'temecula',
                state: 'CA',
                time: '2:00 PM',
                date: '20160102T00:00:00',
                id: 5
            },
            {
                title: 'Class Meeting',
                location: '45458 Camino Monzon',
                city: 'temecula',
                state: 'CA',
                time: '2:00 PM',
                date: '20160102T00:00:00',
                id: 6
            },
            {
                title: 'Class Meeting',
                location: '45458 Camino Monzon',
                city: 'temecula',
                state: 'CA',
                time: '2:00 PM',
                date: '20160102T00:00:00',
                id: 7
            },
            {
                title: 'Class Meeting',
                location: '45458 Camino Monzon',
                city: 'temecula',
                state: 'CA',
                time: '2:00 PM',
                date: '20160102T00:00:00',
                id: 8
            }
        ];

        function details(event) {
            $rootScope.selectedEvent = event;
            //Navigate to details page
            $location.path('/event').search(event.id);
        }

        function addEvent() {
            //Navigate to create event page
            $location.path('/create');
        }

        (function getGoogleEvents() {
            $http.get('/account').then(function(response) {
                if (response.data) {
                    _this.events = response.data;
                }
            });
        })();
    }

})();
