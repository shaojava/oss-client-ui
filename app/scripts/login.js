'use strict';

angular
    .module('OSSLogin', [
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'ui.bootstrap',
        'angularSpinner',
        'OSSCommon',
        'LocalStorageModule'
    ])
    .config([function(){
        //localStorageServiceProvider.setPrefix('OSSClient');
    }])
    .controller('MainCtrl', ['$scope','localStorageService','usSpinnerService', '$http','OSSException', 'OSSRegion','OSSConfig', '$timeout',function ($scope,localStorageService,usSpinnerService, $http,OSSException, OSSRegion,OSSConfig,$timeout) {

        /**
         * 是否定制客户端
         * @type {boolean|*}
         */
        $scope.isCustomClient = OSSConfig.isCustomClient();

        /**
         * 登录到主界面
         */
        var loginToLanchpad = function () {
            OSS.invoke('showLaunchpad');
            OSS.invoke('closeWnd');
        };


        $scope.step = location.hash ? location.hash.replace(/^#/, '') : 'loginById';

        $scope.getSectionClass = function(sectionId){
            return {
                'current':sectionId == $scope.step,
                'custom-client':$scope.isCustomClient
            };
        };
        $scope.customHost = OSS.invoke('getCurrentHost');
        //提交自定义的服务器地址
        $scope.customDomain = function (host) {
          console.log("---host---",host)
          if (!host || !host.length) {
            alert('请输入服务器地址');
            return;
          }
          OSS.invoke('setServerLocation', {
            location: host
          }, function (res) {
            if (!res.error) {
              $scope.customHost = host;
              alert('设置成功');
            } else {
              alert(OSSException.getClientErrorMsg(res));
            }
          })
        };

        $scope.deviceCode = OSS.invoke('getDeviceEncoding');

        $scope.regionSelectTip = '选择区域';

        //提交登录

        $scope.login = function (accessKeyId, accessKeySecret, isCloudHost, location) {
            if (!accessKeyId || !accessKeyId.length) {
                alert('请输入 Access Key ID');
                return;
            }

            if (!accessKeySecret || !accessKeySecret.length) {
                alert('请输入 Access Key Secret');
                return;
            }

            //如果是云主机
            if (!$scope.isCustomClient && isCloudHost) {
                if(!location){
                    alert('请选择区域');
                    return;
                }
                location += '-internal';
            }

            if(!$scope.isCustomClient && !isCloudHost){
              location = null;
            }

            if(OSSConfig.isGuiZhouClient()){
                if(!location){
                    alert('请选择区域');
                    return;
                }
            }
            var param = {
                keyid: accessKeyId,
                keysecret: accessKeySecret
            };

            if(location){
                angular.extend(param,{
                    location: location
                })
            }
            $scope.loging = true;
            OSS.invoke('loginByKey', param, function (res) {
                $scope.loging = false;
                $scope.$apply(function () {
                    if (!res.error) {
                        $scope.step = 'setPassword';
                    } else {
                        console.log("===login res===",res);
                        alert(OSSException.getClientErrorMsg(res));
                    }
                });
            });
        };

        $scope.setPassword = function (password, rePassword) {
            if (!password || !password.length) {
                alert('请输入安全密码');
                return;
            }
            if(password.length < 6){
                alert('密码长度最少6位');
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
            $scope.setting = true;
            OSS.invoke('setPassword', {
                password: password
            }, function (res) {
                $scope.$apply(function(){
                    $scope.setting = false;
                    if (!res.error) {
                        loginToLanchpad();
                    } else {
                        alert(OSSException.getClientErrorMsg(res));
                    }
                });

            });

        };

        $scope.skipSetPassword = function () {
            loginToLanchpad();
        };

        $scope.copy = function (deviceCode) {
            OSS.invoke('setClipboardData', deviceCode);
            alert('复制成功');
        };


        $scope.import = function (isCloudHost, location) {
            $scope.loging = true;
            OSS.invoke('loginByFile', {
                ishost: isCloudHost ? 1 : 0,
                location: location
            }, function (res) {
                $timeout(function () {
                    $scope.loging = false;
                    if (!res.error) {
                        $scope.step = 'setPassword';
                    } else if (res.error != 5) {
                        alert(OSSException.getClientErrorMsg(res));
                    }
                });
            });
        };

        //通过安全密码登录
        var allowErrorCount = 5;
        var loginErrorCount = localStorageService.get('login-error-count') ? parseInt(localStorageService.get('login-error-count')) : 0;
        $scope.loginByPassword = function (password) {
            if (!password || !password.length) {
                alert('请输入安全密码');
                return;
            }
            $scope.loging = true;
            OSS.invoke('loginPassword', {
                password: password
            }, function (res) {
                $scope.$apply(function () {
                    $scope.loging = false;
                    if (!res.error) {
                        loginErrorCount = 0;
                        localStorageService.set('login-error-count',loginErrorCount);
                        loginToLanchpad();
                    } else {
                        loginErrorCount++;
                        localStorageService.set('login-error-count',loginErrorCount);
                        if(loginErrorCount>allowErrorCount){
                            alert('你连续密码输入错误已超过' + allowErrorCount + '次,请重新使用Access Key ID 和 Access Key Secret登录');
                            OSS.invoke('clearPassword');
                            $scope.step = 'loginById';
                        }else{
                            alert(OSSException.getClientErrorMsg(res));
                        }
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

        var checkCurrentLocation = function(callback){
            var region = OSSRegion.getRegionByLocation('oss-cn-gzzwy-a');
            var host = OSSConfig.getHost();
            var requestUrl = 'http://'+region.location + '.' + host;
            $http.get(requestUrl,{
                timeout:3000
            }).error(function(req,status){
                if(!req && !status){
                    $scope.netWorkType = 'internet';
                    callback('oss-cn-guizhou-a');
                }else{
                    $scope.netWorkType = 'intranet';
                    callback('oss-cn-gzzwy-a');
                }
            });
        };

        //

        $scope.checkingLocation = false;
        $scope.predictionLocation = '';
        $scope.netWorkType = null;
        if(OSSConfig.isGuiZhouClient()){
            $scope.checkingLocation = true;
            usSpinnerService.spin('checking-locaiton-spinner');
            checkCurrentLocation(function(predictionLocation){
                $scope.checkingLocation = false;
                usSpinnerService.stop('checking-locaiton-spinner');
                $scope.defaultLocation = predictionLocation;
            });
        }

    }]);
