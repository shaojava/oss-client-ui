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
        'angularSpinner',
        'OSSCommon'
    ])
    .config(['$routeProvider', '$httpProvider',function ($routeProvider, $httpProvider) {
        $routeProvider
            .when('/:bucket?/file/?:object*?', {
                templateUrl: 'views/filelist.html',
                controller: 'FileListCtrl',
                resolve: {
                    buckets: function (Bucket) {
                        return Bucket.list();
                    }
                }
            })
            .when('/:bucket/upload/?', {
                templateUrl: 'views/uploadlist.html',
                controller: 'UploadListCtrl',
                resolve: {
                    buckets: function (Bucket) {
                        return Bucket.list();
                    }
                }
            })
            .otherwise({
                redirectTo: '/'
            });

        $httpProvider.defaults.transformResponse.unshift(function (response, header) {
            if (header('content-type') == 'application/xml') {
                return $.xml2json(response);
            }
            return response;
        })

    }]);
