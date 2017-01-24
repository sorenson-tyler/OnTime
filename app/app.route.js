var app = angular.module("onTime");
app.config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when("/", {
    	templateUrl : 'app/components/home/home.html'
    })
    .when("/test", {
    	template : "<div>Test</div><a class='btn btn-primary' href='#!/home'>Go Home</a>"
    });
});