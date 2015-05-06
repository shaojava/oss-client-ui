'use strict';

/**
 * @ngdoc overview
 * @name OSSCommon
 * @description
 * # OSSCommon
 *
 * Main module of the application.
 */
angular.module('OSSCommon', [
    'ui.select'
])
    .config(['uiSelectConfig', function (uiSelectConfig) {
        uiSelectConfig.theme = 'bootstrap';
    }])
/**
 * 本地对话框
 */
    .factory('OSSDialog', [function () {
        var defaultParam = {
            type: 'normal',
            resize: 0,
            width: 490,
            height: 420
        };
        return {
            /**
             * 导出授权窗口
             */
            exportAuthorization: function () {
                var UIPath = OSS.invoke('getUIPath');
                OSS.invoke('showWnd', angular.extend({}, defaultParam, {
                    url: UIPath + '/export-authorization.html'
                }));
            },
            /**
             * 自定义服务器地址
             */
            customServerHost: function () {
                var UIPath = OSS.invoke('getUIPath');
                OSS.invoke('showWnd', angular.extend({}, defaultParam, {
                    url: UIPath + '/custom-domain.html'
                }));
            },
            setting: function () {
                var UIPath = OSS.invoke('getUIPath');
                OSS.invoke('showWnd', angular.extend({}, defaultParam, {
                    url: UIPath + '/setting.html'
                }));
            }
        };
    }])

/**
 *   客户端配置的相关信息（定制时用）
 */
    .factory('OSSConfig', [function () {
        var config = OSS.invoke('configInfo');
        if (!config) {
            config = {
                source: "",
                disable_location_select: 0,
                host: "aliyuncs.com",
                locations: [
                    {
                      "location": "oss-cn-guizhou-a",
                      "name": "互联网",
                      "enable": 0,
                      "network":"internet"
                    },
                    {
                      "location": "oss-cn-guizhou-a-internal",
                      "name": "政务外网",
                      "enable": 0,
                      "network":"internet"
                    },
                    {
                      "location": "oss-cn-gzzwy-a-internal",
                      "name": "政务外网",
                      "enable": 0,
                      "network":"intranet"
                    },
                    {
                        location: 'oss-cn-hangzhou',
                        name: '杭州',
                        enable: 1
                    },
                    {
                        location: 'oss-cn-qingdao',
                        name: '青岛',
                        enable: 1
                    },
                    {
                        location: 'oss-cn-beijing',
                        name: '北京',
                        enable: 1
                    },
                    {
                        location: 'oss-cn-hongkong',
                        name: '香港',
                        enable: 1
                    },
                    {
                        location: 'oss-cn-shenzhen',
                        name: '深圳',
                        enable: 1
                    },
                    {
                      location: 'oss-us-west-1',
                      name: '美国',
                      enable: 1
                    }
                ]
            };
        }
        return {
            /**
             * 是否是定制客户端
             * @returns {boolean}
             */
            isCustomClient: function () {
                return config.source && config.source != '';
            },
            /**
             * 是否是贵州的定制客户端
             * @returns {boolean}
             */
            isGuiZhouClient: function () {
                return config.source == 'guizhou';
            },
            /**
             * 是否显示白名单设置
             * @returns {boolean}
             */
            showRefer: function () {
                return !!config.showrefer;
            },
            /**
             * 是否显示图片服务器设置
             * @returns {boolean}
             */
            showChannel: function () {
                return !!config.showchannel;
            },
            /**
             * 创建bucket是否不允许选择区域
             */
            isDisableLocationSelect: function () {
                return config.disable_location_select == 1;
            },
            getLocations: function () {
                return config.locations || [];
            },
            /**
             * 获取主机
             * @returns {*}
             */
            getHost: function () {
                return config.host;
            }
        };
    }])

/**
 * bucket区域
 */
    .factory('OSSRegion', ['OSSConfig', function (OSSConfig) {
        var locations = OSSConfig.getLocations();
        var currentLocation = OSS.invoke('getCurrentLocation');
        return {
            getRegionPerfix: function () {
                return "CLIENT_LOGIN_REGION"
            },
            list: function (_netType) {
                var params = {
                  enable: 1
                };
                if(_netType){
                  params.network = _netType
                }
                return _.where(locations, params);
            },
            /**
             * 判断当前location是否是当前登录区域允许的bucket
             */
            getEnableRegionByLocation: function (location) {
                var enableLocations = this.list();
                return _.find(enableLocations, function (item) {
                    return location.indexOf(item.location) === 0||
                           location.indexOf(item.location.replace('-a-internal', '')) === 0 ||
                           location.indexOf(item.location.replace('-a', '')) === 0 ||
                           location.indexOf(item.location.replace('-internal', '')) === 0;
                });
            },
            getRegionByLocation: function (location) {
                return _.find(locations, function (item) {
                    return location.indexOf(item.location.replace('-internal', '')) === 0;
                });
            },
            changeLocation: function (location) {
              var isIntranet = this.isIntranet(currentLocation);
                if(OSSConfig.isCustomClient() && isIntranet) {
                  var intranetLocations = this.getIntranetLocationItem();
                  var _location = location;
                  angular.forEach(intranetLocations, function (item) {
                      if (item.location === location || item.location === location + '-internal' || item.location === location + '-a-internal') {
                          _location = item.location;
                      }
                  })
                  return _location;
                }
                if (location.indexOf('-internal') > 0) {
                    return location;
                }
                if (currentLocation && location + '-a' == currentLocation) {
                    return location + '-a';
                }
                if (currentLocation && location + '-internal' == currentLocation) {
                    return location + '-internal';
                }
                if (currentLocation && location + '-a-internal' == currentLocation) {
                    return location + '-a-internal';
                }
                return location;
            },
            //判断是内网
            isIntranet: function (location,network) {
                if (location){
                    var region = _.find(locations, function (item) {
                        return  item.enable === 1 && item.location === location;
                    });
                    if (region.network === 'intranet') {
                        return true;
                    }
                }else if(network && network === 'intranet'){
                    return true;
                }
                return false;
            },
            getIntranetLocationItem: function () {
                return _.filter(locations, function (item) {
                    return  item.enable === 1 && item.network === "intranet";
                });
            },
            getInternetLocationItem: function () {
                return _.find(locations, function (item) {
                    return  item.enable === 1 && item.network === "internet";
                });
            },
            getIntranetLocation: function (location) {
                return location.replace('-internal', '');
            },
            getIntranetInner: function (loadInner) {
                if (!!loadInner) {
                    return this.getIntranetLocationItem()[1]
                }else{
                    return this.getIntranetLocationItem()[0]
                }
            }
        };
    }])

/**
 * 抛错处理
 */
    .factory('OSSException', ['OSSConfig', function (OSSConfig) {
        var erroList = {
            getClientMessage:function(resError){
                if(resError.Code == 'AccessDenied' && resError.Message == 'Request has expired.'){
                    var serverTime = new Date(resError.ServerTime).getTime();
                    var clientTime = new Date(resError.Expires).getTime();
                    var expiresTime = parseInt(Math.abs(clientTime - serverTime) / 1000);
                    var d = parseInt(parseInt(expiresTime)/3600/24);
                    var h = parseInt((parseInt(expiresTime)/3600) % 24);
                    var m = parseInt((parseInt(expiresTime)/60) % 60);
                    var s = parseInt(parseInt(expiresTime) % 60)
                    var str = '数据加载失败，当前您电脑的时间比服务器时间';
                    if(clientTime - serverTime > 0){
                      str += '快'
                    }else if(clientTime - serverTime < 0){
                      str += '慢'
                    }else{
                      return ;
                    }
                    if(d > 0){
                      str += d + '天'
                    }
                    if(h > 0){
                      str += h + '小时'
                    }
                    if(m > 0){
                      str += m + '分钟'
                    }
                    if(s > 0){
                      str += s + '秒'
                    }
                    str += ",请调整您的电脑时间后重试。"
                    return str;
                }else if (erroList[resError.Code]) {
                    return erroList[resError.Code];
                }else{
                    return resError.Message;
                }
            },
            'AccessDenied': '拒绝访问',
            'BucketAlreadyExists': 'Bucket已经存在',
            'BucketNotEmpty': 'Bucket不为空',
            'EntityTooLarge': '实体过大',
            'EntityTooSmall': '实体过小',
            'FileGroupTooLarge': '文件组过大',
            'FilePartNotExist': '文件Part不存在',
            'FilePartStale': '文件Part过时',
            'InvalidArgument': '参数格式错误',
            'InvalidAccessKeyId': 'Access Key ID不存在',
            'InvalidBucketName': '无效的Bucket名字',
            'InvalidDigest': '无效的摘要',
            'InvalidObjectName': '无效的Object名字',
            'InvalidPart': '无效的Part',
            'InvalidPartOrder': '无效的part顺序',
            'InvalidTargetBucketForLogging': 'Logging操作中有无效的目标bucket',
            'InternalError': 'OSS内部发生错误',
            'MalformedXML': 'XML格式非法',
            'MethodNotAllowed': '不支持的方法',
            'MissingArgument': '缺少参数',
            'MissingContentLength': '缺少内容长度',
            'NoSuchBucket': 'Bucket不存在',
            'NoSuchKey': '文件不存在',
            'NoSuchUpload': 'Multipart Upload ID不存在',
            'NotImplemented': '无法处理的方法',
            'PreconditionFailed': '预处理错误',
            'RequestTimeTooSkewed': '发起请求的时间和服务器时间超出15分钟',
            'RequestTimeout': '请求超时',
            'SignatureDoesNotMatch': '签名错误',
            'TooManyBuckets': 'Bucket数目超过限制'
        };
        return {
            getError: function (res, status) {
                var error = {
                    status: status,
                    code: '',
                    msg: ''
                };
                if (!res) {
                    var msg = '';
                    if (status == 403) {
                        msg = erroList['AccessDenied'];
                    } else {
                        msg = '网络请求错误';
                        if (OSSConfig.isCustomClient()) {
                            msg += '<p class="text-muted">（可能是你登录时选择的区域与当前的网络环境不匹配，请退出客户端后重新选择）</p>';
                        }
                    }
                    angular.extend(error, {
                        msg: msg
                    });
                } else {
                    var resError = res['Error'];
                    angular.extend(error, {
                        code: resError.Code || '',
                        msg: resError.Message || ''
                    });
                    var message = erroList.getClientMessage(resError);
                    angular.extend(error, {
                        msg: message
                    });
                }
                return error;
            },
            getClientErrorMsg: function (res) {
                return res.message;
            }
        };
    }])

/**
 * 剪切板
 */
    .factory('Clipboard', function () {
        var maxLen = 1,
            container = [];
        return {
            clear: function () {
                container = [];
            },
            len: function () {
                return container.length;
            },
            get: function () {
                var item = container.shift();
                OSS.log('Clipboard.get', item);
                return item;
            },
            add: function (data) {
                container.push(data);
                if (container.length > maxLen) {
                    container.shift();
                }
                OSS.log('Clipboard.add', data);
            }
        };
    })

/**
 * 显示传入路径的文件名
 */
    .filter('baseName', function () {
        return Util.String.baseName;
    })

/**
 * 判断传入的路径是否文件夹
 */
    .filter('isDir', function () {
        return function (path) {
            var lastStr = Util.String.lastChar(path);
            return lastStr === '/' || lastStr === '\\' ? 1 : 0;
        };
    })
    .filter('getLocationName', ['OSSRegion', function (OSSRegion) {
        return function (location) {
            if (!location) {
                return '';
            }
            ;
            var region = OSSRegion.getRegionByLocation(location);
            if (!region) {
                return '';
            }
            return region.name;
        };
    }])
    .directive('ngRightClick', ['$parse', function ($parse) {
        return function ($scope, $element, $attrs) {
            var fn = $parse($attrs.ngRightClick);
            $element.bind('contextmenu', function (event) {
                $scope.$apply(function () {
                    event.preventDefault();
                    fn($scope, {$event: event});
                });
            });
        };
    }])
/**
 * 滚到加载
 */
    .directive('scrollLoad', ['$rootScope', '$parse', function ($rootScope, $parse) {
        return {
            restrict: 'A',
            link: function ($scope, $element, attrs) {
                var triggerDistance = 0;
                var disableScroll = false;
                if (attrs.triggerDistance != null) {
                    $scope.$watch(attrs.triggerDistance, function (value) {
                        return triggerDistance = parseInt(value || 0, 10);
                    });
                }

                if (attrs.disableScroll != null) {
                    $scope.$watch(attrs.disableScroll, function (value) {
                        return disableScroll = !!value;
                    });
                }
                var direction = 'down';
                if (attrs.triggerDirection) {
                    direction = attrs.triggerDirection;
                }
                var startScrollTop = 0;
                var fn = $parse(attrs['scrollLoad']);
                $element.on('scroll.scrollLoad', function (event) {
                    var _self = jQuery(this),
                        realDistance = 0,
                        scrollH = 0,
                        scrollT = 0,
                        isScrollDown = false;

                    scrollH = jQuery.isWindow(this) ? document.body.scrollHeight : $element[0].scrollHeight;
                    scrollT = _self.scrollTop();
                    isScrollDown = scrollT > startScrollTop;
                    var clientHeight = jQuery.isWindow(this) ? document.documentElement.clientHeight || document.body.clientHeight : this.clientHeight;
                    realDistance = direction == 'down' ? (scrollH - scrollT - clientHeight) : scrollT;
                    if (realDistance <= triggerDistance && !disableScroll) {
                        if ((!isScrollDown && direction == 'up') || (isScrollDown && direction == 'down')) {
                            $scope.$apply(function () {
                                fn($scope, {$event: event});
                            })

                        }
                    }
                    startScrollTop = scrollT;
                });

                $scope.$on('$destroy', function () {
                    $element.off('scroll.scrollLoad');
                })
            }
        }
    }])

/**
 * 滚到指定的item
 */
    .directive('scrollToItem', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                attrs.$observe('scrollToItem', function (newVal) {
                    if(typeof newVal === 'undefiend') return;
                    $timeout(function () {
                        var index = newVal;
                        if (index < 0) return;
                        var $fileItem = element.find(attrs.itemSelector + ':eq(' + index + ')');
                        if (!$fileItem.size()) return;
                        var top = $fileItem.position().top;
                        var grep = top + $fileItem.height() - element.height();
                        if (top < 0) {
                            element.scrollTop(element.scrollTop() + top);
                        } else if (grep > 0) {
                            element.scrollTop(element.scrollTop() + grep);
                        }
                    })
                })

            }
        }
    }])

/**
 * 拖拽
 */
    .directive('onDrop', ['$parse', function ($parse) {
        return function (scope, element, attrs) {
            var fn = $parse(attrs.onDrop);
            element.on('drop', function (event) {
                scope.$apply(function () {
                    fn(scope, {$event: event});
                });
            });
        };
    }])

/**
 * 阻止默认的拖拽时间
 */
    .directive('preventDragDrop', [function () {
        return {
            restrict: 'A',
            link: function ($scope, $element) {
                $element.on('dragstart', function (event) {
                    var jTarget = jQuery(event.target);
                    if (!jTarget.attr('draggable') && !jTarget.parents('[draggable]').size()) {
                        event.preventDefault();
                    }
                })
                $element.on('dragover', function (event) {
                    event.preventDefault();
                });
                $element.on('dragenter', function (event) {
                    event.preventDefault();
                });
                $element.on('drop', function (event) {
                    event.preventDefault();
                });
            }
        }
    }])

/**
 *  input默认选中
 */
    .directive('autoSelect', [function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var isAutoSelect = false;
                attrs.$observe('autoSelect', function (isAuto) {
                    isAutoSelect = isAuto;
                });

                element.on('click.autoSelect', function () {
                    if (isAutoSelect) {
                        element.select();
                    }
                });

            }
        }
    }])

/**
 * bucket区域选择下拉框
 */
    .directive('locationSelect', ['$rootScope','OSSRegion','OSSConfig','$http','localStorageService', function ($rootScope,OSSRegion,OSSConfig,$http,localStorageService) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                selectLocation: '=',
                loginNetworktype: '=',
                disableSelect: '=',
                name: '@',
                placeHolder: '@',
                searchDisabled: '=',
                defaultLocation:'@'
            },
            templateUrl: 'views/location-select.html',
            link: function (scope) {
                if (!OSSConfig.isCustomClient()) {
                    localStorageService.set(OSSRegion.getRegionPerfix(),false);
                    scope.locations = OSSRegion.list();
                    if (!scope.placeHolder) {
                        scope.locations.selected = scope.locations[0];
                    }
                    scope.$watch('defaultLocation',function(newVal){
                        if(!newVal){
                            return;
                        }
                        scope.locations.selected = _.find(scope.locations,function(region){
                            return region.location.indexOf(newVal) == 0;
                        });
                    });
                }else{
                    scope.$watch('loginNetworktype',function(newVal){
                        if(!newVal){
                            return;
                        }
                        localStorageService.set(OSSRegion.getRegionPerfix(),OSSRegion.isIntranet(null,newVal));
                        if (OSSRegion.isIntranet(null,newVal)) {
                            var region = OSSRegion.getIntranetInner(false);
                            var host = OSSConfig.getHost();
                            var requestUrl = 'http://'+region.location + '.' + host;
                            if(region.customhost && region.customhost.length){
                                requestUrl = 'http://'+region.customhost;
                            }
                            $http.get(requestUrl,{
                                timeout:3000
                            }).error(function(req,status){
                                //走不通
                                if(!req && !status){
                                    scope.locations = [OSSRegion.getInternetLocationItem()].concat([OSSRegion.getIntranetInner(true)])
                                }
                                //走的通
                                else{
                                    scope.locations = OSSRegion.getIntranetLocationItem()
                                }
                                //当前可以显示的bucket
                                $rootScope.$broadcast('unDisabledLocationSelect')
                                scope.locations.selected = _.find(scope.locations,function(region){
                                    return region.location.indexOf(scope.defaultLocation) == 0;
                                });
                            });
                        }else {
                            scope.locations = OSSRegion.list(newVal);
                            $rootScope.$broadcast('unDisabledLocationSelect')
                            scope.locations.selected = _.find(scope.locations,function(region){
                                return region.location.indexOf(scope.defaultLocation) == 0;
                            });
                        }
                    })
                }
                scope.$watch('locations.selected', function (val) {
                    scope.selectLocation = val;
                });
            }
        }
    }])
;

/**
 * 客户端的回调
 * @param name
 * @param params
 */
var ossClientCallback = function (name, param) {
  console.log('客户端的回调[ossClientCallback]', arguments);
  if (typeof name !== 'string') {
    name = String(name);
  }
  var rootScope = jQuery(document).scope();
  var JSONparam;
  if (param) {
    JSONparam = JSON.parse(param);
  }
  rootScope && rootScope.$broadcast(name, JSONparam);
};
//通知当前下载列表加载的数量
ossClientCallback.getUpdateLoadingCount = function(){
  return 'UpdateLoadingCount';
}