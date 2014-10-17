'use strict';

angular
    .module('OSSLogin', [
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
    .controller('MainCtrl', ['$scope', 'OSSException', 'OSSRegion', function ($scope, OSSException, OSSRegion) {

        /**
         * 登录到主界面
         */
        var loginToLanchpad = function () {
            OSS.invoke('showLaunchpad');
            OSS.invoke('closeWnd');
        };

        $scope.step = location.hash ? location.hash.replace(/^#/, '') : 'loginById';

        $scope.deviceCode = OSS.invoke('getDeviceEncoding');

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

        //提交登录
        $scope.login = function (accessKeyId, accessKeySecret, isCloudHost, region) {
            if (!accessKeyId || !accessKeyId.length) {
                alert('请输入 Access Key ID');
                return;
            }

            if (!accessKeySecret || !accessKeySecret.length) {
                alert('请输入 Access Key Secret');
                return;
            }

            if (isCloudHost && !region.value) {
                alert('请选择区域');
                return;
            }

            OSS.invoke('loginByKey', {
                keyid: accessKeyId,
                keysecret: accessKeySecret,
                ishost: isCloudHost,
                location: region.value
            }, function (res) {
                if (!res.error) {
                    $scope.$apply(function () {
                        $scope.step = 'setPassword';
                    })
                } else {
                    alert(OSSException.getClientErrorMsg(res));
                }
            });
        };

        $scope.setPassword = function (password, rePassword) {
            if (!password || !password.length) {
                alert('请输入安全密码');
                return;
            }

            if (!rePassword || !rePassword.length) {
                alert('请确认安全密码');
                return;
            }

            if (password !== rePassword) {
                alert('两次输入的密码不一致');
                return;
            }

            OSS.invoke('setPassword', {
                password: password
            }, function (res) {
                if (!res.error) {
                    loginToLanchpad();
                } else {
                    alert(OSSException.getClientErrorMsg(res));
                }
            });

        };

        $scope.skipSetPassword = function () {
            loginToLanchpad();
        };

        $scope.copy = function (deviceCode) {
            OSS.invoke('setClipboardData', deviceCode);
            alert('复制成功');
        };

        $scope.import = function (isCloudHost, region) {
            OSS.invoke('loginByFile', {
                ishost: isCloudHost ? 1 : 0,
                location: region.value
            }, function (res) {
                $scope.$apply(function () {
                    if (!res.error) {
                        $scope.step = 'setPassword';
                    } else if (res.error != 5) {
                        alert(OSSException.getClientErrorMsg(res));
                    }
                });
            });
        };

        //通过安全密码登录
        $scope.loginByPassword = function (password) {
            if (!password || !password.length) {
                alert('请输入安全密码');
                return;
            }
            OSS.invoke('loginPassword', {
                password: password
            }, function (res) {
                $scope.$apply(function () {
                    if (!res.error) {
                        loginToLanchpad();
                    } else {
                        alert(OSSException.getClientErrorMsg(res));
                    }
                });

            })
        };

        //清除安全密码
        $scope.clearPassword = function () {
            if(!confirm('确定要清除安全密码？')){
                return;
            }
            OSS.invoke('clearPassword');
            $scope.step = 'loginById';
        };

    }]);
