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
        'LocalStorageModule',
        'gettext'
    ])
    .run(function(gettextCatalog,OSSI18N){
      OSSI18N.setDefaultLan();
      gettextCatalog.currentLanguage = OSSI18N.getCurrLan().lan;
      gettextCatalog.debug = false;

    })

    .config([function(){
        //localStorageServiceProvider.setPrefix('OSSClient');
    }])
    .controller('MainCtrl', ['$scope','localStorageService','usSpinnerService', '$http','OSSException', 'OSSRegion','OSSConfig', '$timeout','gettext','gettextCatalog','OSSI18N',function ($scope,localStorageService,usSpinnerService, $http,OSSException, OSSRegion,OSSConfig,$timeout,gettext,gettextCatalog,OSSI18N) {

        /**
         * 是否定制客户端
         * @type {boolean|*}
         */
        $scope.isCustomClient = OSSConfig.isCustomClient();

        /**
         * 语言国际化
         * @type {{lan: string}[]}
         */
        $scope.showLanSetting = OSSConfig.showLanSetting();
        $scope.lanLists = angular.copy(OSSI18N.getLanLists())
        $scope.lanLists.selected = OSSI18N.getCurrLan();
        $scope.selectLan = function ($item){
          gettextCatalog.setCurrentLanguage($item.lan)
          OSSI18N.setCurrLan($item.key);
        }

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
          //if (!host || !host.length) {
          //  alert(gettextCatalog.getString(gettext('请输入服务器地址')));
          //  return;
          //}
          OSS.invoke('setServerLocation', {
            location: host
          }, function (res) {
            if (!res.error) {
              $scope.customHost = host;
              alert(gettextCatalog.getString(gettext('设置成功')));
            } else {
              alert(OSSException.getClientErrorMsg(res));
            }
          })
        };

        $scope.deviceCode = OSS.invoke('getDeviceEncoding');

        $scope.regionSelectTip = gettextCatalog.getString(gettext('选择区域'));

        //提交登录

        $scope.login = function (accessKeyId, accessKeySecret, isCloudHost, region) {
            console.info("login oss argument:",arguments)
            var location = undefined;
            if (!accessKeyId || !accessKeyId.length) {
                alert(gettextCatalog.getString(gettext('请输入 Access Key ID')));
                return;
            }

            if (!accessKeySecret || !accessKeySecret.length) {
                alert(gettextCatalog.getString(gettext('请输入 Access Key Secret')));
                return;
            }
            if(region && region.location){
              location = region.location;
            }
            //如果是云主机
            if (!$scope.isCustomClient && isCloudHost) {
                if(!location){
                    alert(gettextCatalog.getString(gettext('请选择区域')));
                    return;
                }
                location += '-internal';
            }

            if(!$scope.isCustomClient && !isCloudHost){
              location = null;
            }

            if(OSSConfig.isCustomClient()){
                if(!location){
                    alert(gettextCatalog.getString(gettext('请选择区域')));
                    return;
                }
                //如果配置了自定义服务器地址，则设在自定义服务器地址
                var customHost = region.customhost;
                if (customHost && customHost.length) {
                  OSS.invoke('setServerLocation', {
                    location: customHost
                  });
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
                        alert(OSSException.getClientErrorMsg(res));
                    }
                });
            });
        };

        $scope.setPassword = function (password, rePassword) {
            if (!password || !password.length) {
                alert(gettextCatalog.getString(gettext('请输入安全密码')));
                return;
            }
            if(password.length < 6){
                alert(gettextCatalog.getString(gettext('密码长度最少6位')));
                return;
            }
            if (!rePassword || !rePassword.length) {
                alert(gettextCatalog.getString(gettext('请确认安全密码')));
                return;
            }

            if (password !== rePassword) {
                alert(gettextCatalog.getString(gettext('两次输入的密码不一致')));
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
            alert(gettextCatalog.getString(gettext('复制成功')));
        };


        $scope.import = function (isCloudHost, location) {
            $scope.loging = true;
            if(isCloudHost){
              location = location +'-internal';
            }
            OSS.invoke('loginByFile', {
                ishost: isCloudHost ? 1 : 0,
                location:location
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
                alert(gettextCatalog.getString(gettext('请输入安全密码')));
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
                            var str = gettextCatalog.getString(gettext('你连续密码输入错误已超过{{allowErrorCount}}次,请重新使用Access Key ID 和 Access Key Secret登录'),{'allowErrorCount':allowErrorCount});
                            alert(str);
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
            if(!confirm(gettextCatalog.getString(gettext('确定要清除安全密码？')))){
                return;
            }
            OSS.invoke('clearPassword');
            $scope.step = 'loginById';
        };

        var checkCurrentLocation = function(callback){
            var region = OSSRegion.getIntranetInner(true);
            var host = OSSConfig.getHost();
            var requestUrl = 'http://'+region.location + '.' + host;
            if(region.customhost && region.customhost.length){
              requestUrl = 'http://'+region.customhost;
            }
            $http.get(requestUrl,{
                timeout:3000
            }).error(function(req,status){
                if(!req && (!status || +status == -1)){
                    region = OSSRegion.getInternetLocationItem();
                    $scope.netWorkType = region.network;
                    callback(region.location);
                }else{
                    $scope.netWorkType = region.network;
                    callback(region.location);
                }
            });
        };

        //

        $scope.checkingLocation = false;
        $scope.predictionLocation = '';
        $scope.netWorkType = null;
        if(OSSConfig.isCustomClient()){
            $scope.checkingLocation = true;
            usSpinnerService.spin('checking-locaiton-spinner');
            checkCurrentLocation(function(predictionLocation){
                $scope.defaultLocation = predictionLocation;
            });
        }
        $scope.$on('unDisabledLocationSelect',function(){
          $scope.checkingLocation = false;
          usSpinnerService.stop('checking-locaiton-spinner');
        })
    }]);
