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
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'ui.bootstrap',
        'angularSpinner',
        'OSSCommon',
        'angularSpinner',
        'ng-context-menu',
        'ui.select',
        'LocalStorageModule',
        'gettext'
    ])
    .run(function(gettextCatalog,OSSI18N){
      OSSI18N.setDefaultLan();
      gettextCatalog.currentLanguage = OSSI18N.getCurrLan().lan;
      gettextCatalog.debug = false;
    })
    .config(['$routeProvider', '$httpProvider','uiSelectConfig', function ($routeProvider, $httpProvider,uiSelectConfig) {
        //设置ui-select的默认样式
        uiSelectConfig.theme = 'bootstrap';

        $routeProvider
            .when('/file/:bucket?/?:object*?', {
                templateUrl: 'views/filelist.html',
                controller: 'FileListCtrl',
                resolve: {
                    buckets: function (Bucket) {
                        return Bucket.list();
                    }
                }
            })
            .when('/upload/:bucket', {
                templateUrl: 'views/uploadlist.html',
                controller: 'UploadListCtrl',
                resolve: {
                    buckets: function (Bucket) {
                        return Bucket.list();
                    }
                }
            })
            .otherwise({
                redirectTo: '/file'
            });

        $httpProvider.defaults.transformResponse.unshift(function (response, header) {
            if (header('content-type') == 'application/xml') {
                return $.xml2json(response);
            }
            return response;
        })

    }]);
