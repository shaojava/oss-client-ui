'use strict';

angular
    .module('CustomDomain', [
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
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
    .controller('MainCtrl', ['$scope', 'OSSException','gettext','gettextCatalog', function ($scope, OSSException,gettext,gettextCatalog) {

        //提交自定义的服务器地址
        $scope.customDomain = function (host) {
            if (!host || !host.length) {
                alert(gettextCatalog.getString(gettext('请输入服务器地址')));
                return;
            }
            OSS.invoke('setServerLocation', {
                location: host
            }, function (res) {
                if (!res.error) {
                    alert(gettextCatalog.getString(gettext('设置成功')));
                } else {
                    alert(OSSException.getClientErrorMsg(res));
                }
            })
        };

        //取消
        $scope.cancel = function () {
            OSS.invoke('closeWnd');
        };

    }]);
