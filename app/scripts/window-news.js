'use strict';

angular
    .module('WindowNews', [
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'ngAnimate',
        'ui.bootstrap',
        'angularSpinner',
        'OSSCommon',
        'LocalStorageModule',
        'gettext'
    ])
    .run(function(gettextCatalog,OSSI18N){
      OSSI18N.setDefaultLan();
      gettextCatalog.currentLanguage = OSSI18N.getCurrLan().lan;
      gettextCatalog.debug = false;
    })
    .controller('MainCtrl', ['$scope','gettext','gettextCatalog','OSSNews','localStorageService', function ($scope,gettext,gettextCatalog,OSSNews,localStorageService) {
        $scope.winNews = {
          data:null,
          loading:false
        }
        $scope.winNews.data = localStorageService.get('window-news-json')

        $scope.clickNews = function (aid,index) {
          OSS.invoke('openUrl',{"url":OSSNews.clickNews(aid,index)})
        }

        //取消
        $scope.cancel = function () {
            OSS.invoke('closeWnd');
        };

    }]);
