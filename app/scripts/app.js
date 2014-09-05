'use strict';

/**
 * @ngdoc overview
 * @name ossClientUiApp
 * @description
 * # ossClientUiApp
 *
 * Main module of the application.
 */
angular
    .module('ossClientUiApp', [
        'ngAnimate',
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'ui.bootstrap',
        'angularSpinner'
    ])
    .config(function ($routeProvider, $httpProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });

        $httpProvider.defaults.transformResponse.unshift(function (response,header) {
            if(header('content-type') == 'application/xml'){
                return $.xml2json(response);
            }
            return response;

        })

    });
