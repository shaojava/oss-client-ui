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
    .controller('MainCtrl', ['$scope','gettext','gettextCatalog','OSSNews', function ($scope,gettext,gettextCatalog,OSSNews) {
        $scope.winNews = {
          data:null,
          loading:true
        }
        OSSNews.getWinNewsData('aliyun').then(function(data){
          $scope.winNews.loading = false;
          if (data && !data.err){
            data.imgs = data.image.split(",");
            $scope.winNews.data = data
          }
        },function(res){
          $scope.winNews.loading = false;
        })

        $scope.clickNews = function (aid,index) {
          OSS.invoke('openUrl',{"url":OSSNews.clickNews(aid,index)})
        }

        //取消
        $scope.cancel = function () {
            OSS.invoke('closeWnd');
        };

    }]);
