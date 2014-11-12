'use strict';

angular
    .module('ExportAuthorization', [
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'ui.bootstrap',
        'angularSpinner',
        'OSSCommon'
    ])
    .controller('MainCtrl', ['$scope', 'OSSException', 'OSSRegion', function ($scope, OSSException, OSSRegion) {

        var regions = [];
        angular.forEach(OSSRegion.list(), function (val, key) {
            regions.push({
                name: val,
                value: key
            })
        });

        $scope.region = {
            name: '选择区域',
            value: ''
        };

        regions.unshift($scope.region);
        $scope.regions = regions;

        //导出授权
        $scope.exportAuthorization = function (accessKeyId, accessKeySecret, deviceCode) {
            if (!accessKeyId || !accessKeyId.length) {
                alert('请输入 Access Key ID');
                return;
            }

            if (!accessKeySecret || !accessKeySecret.length) {
                alert('请输入 Access Key Secret');
                return;
            }

            if (!deviceCode) {
                alert('请输入要授权的机器码');
                return;
            }

            OSS.invoke('saveAuthorization', {
                keyid: accessKeyId,
                keysecret: accessKeySecret,
                encoding: deviceCode
            }, function (res) {
                if (!res.error) {
                    alert('导出成功');
                } else if(res.error != 5) {
                    alert(OSSException.getClientErrorMsg(res));
                }
            });

        };

        //取消
        $scope.cancel = function () {
            OSS.invoke('closeWnd');
        };

    }]);
