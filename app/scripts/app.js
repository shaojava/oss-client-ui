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
        'ngAnimate',
        'ui.bootstrap',
        'angularSpinner',
        'OSSCommon',
        'ng-context-menu',
        'ui.select',
        'LocalStorageModule',
        'gettext'
    ])
    .run(function(gettextCatalog,OSSI18N,OSSConfig){
      OSSI18N.setDefaultLan();
      gettextCatalog.currentLanguage = OSSI18N.getCurrLan().lan;
      gettextCatalog.debug = false;
      if(OSSConfig.isGuiZhouClient()){
        OSS.invoke("setDefaultContentDisposition",{"default":parseInt(1)});
      }
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
