'use strict';

angular
    .module('CustomDomain', [
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
    .controller('MainCtrl', ['$scope', 'OSSException', function ($scope, OSSException) {

        //提交自定义的服务器地址
        $scope.customDomain = function (host) {
            if (!host || !host.length) {
                alert('请输入服务器地址');
                return;
            }
            OSS.invoke('setServerLocation', {
                location: host
            }, function (res) {
                if (!res.error) {
                    alert('设置成功');
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
