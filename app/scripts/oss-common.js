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
            setting:function(){
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
        var config  = OSS.invoke('configInfo');
        if(!config){
            config = {
                source:"",
                disable_location_select:0,
                host:"aliyuncs.com",
                locations:[
                    {
                        location:'oss-cn-guizhou-a',
                        name:'互联网',
                        enable:0
                    },
                    {
                        location:'oss-cn-gzzwy-a-internal',
                        name:'政务外网',
                        enable:0
                    },
                    {
                        location:'oss-cn-hangzhou',
                        name:'杭州',
                        enable:1
                    },
                    {
                        location:'oss-cn-qingdao',
                        name:'青岛',
                        enable:1
                    },
                    {
                        location:'oss-cn-beijing',
                        name:'北京',
                        enable:1
                    },
                    {
                        location:'oss-cn-hongkong',
                        name:'香港',
                        enable:1
                    },
                    {
                        location:'oss-cn-shenzhen',
                        name:'深圳',
                        enable:1
                    }
                ]
            };
        }
        return {
            /**
             * 是否是定制客户端
             * @returns {boolean}
             */
            isCustomClient:function(){
                return config.source != '';
            },
            /**
             * 是否是贵州的定制客户端
             * @returns {boolean}
             */
            isGuiZhouClient:function(){
                return  config.source == 'guizhou';
            },
            /**
             * 创建bucket是否不允许选择区域
             */
            isDisableLocationSelect:function(){
                return config.disable_location_select == 1;
            },
            getLocations:function(){
                return  config.locations || [];
            },
            /**
             * 获取主机
             * @returns {*}
             */
            getHost:function(){
                return  config.host;
            }
        };
    }])

    /**
     * bucket区域
     */
    .factory('OSSRegion', ['OSSConfig',function (OSSConfig) {
        var locations = OSSConfig.getLocations();
        var currentLocation = OSS.invoke('getCurrentLocation');
        return {
            list: function () {
                return _.where(locations,{
                    enable:1
                });
            },
            getRegionByLocation:function(location){
                return _.find(locations,function(item){
                    return location.indexOf(item.location.replace('-internal','')) === 0;
                });
            },
            changeLocation:function(location){
                if(location.indexOf('-internal') > 0){
                    return location;
                }
                if (currentLocation && location + '-internal' == currentLocation) {
                    return location + '-internal';
                }
                return location;
            }
        };
    }])

    /**
     * 抛错处理
     */
    .factory('OSSException', ['OSSConfig',function (OSSConfig) {
        var erroList = {
            'AccessDenied':'拒绝访问',
            'BucketAlreadyExists':'Bucket已经存在',
            'BucketNotEmpty':'Bucket不为空',
            'EntityTooLarge':'实体过大',
            'EntityTooSmall':'实体过小',
            'FileGroupTooLarge':'文件组过大',
            'FilePartNotExist':'文件Part不存在',
            'FilePartStale':'文件Part过时',
            'InvalidArgument':'参数格式错误',
            'InvalidAccessKeyId':'Access Key ID不存在',
            'InvalidBucketName':'无效的Bucket名字',
            'InvalidDigest':'无效的摘要',
            'InvalidObjectName':'无效的Object名字',
            'InvalidPart':'无效的Part',
            'InvalidPartOrder':'无效的part顺序',
            'InvalidTargetBucketForLogging':'Logging操作中有无效的目标bucket',
            'InternalError':'OSS内部发生错误',
            'MalformedXML':'XML格式非法',
            'MethodNotAllowed':'不支持的方法',
            'MissingArgument':'缺少参数',
            'MissingContentLength':'缺少内容长度',
            'NoSuchBucket':'Bucket不存在',
            'NoSuchKey':'文件不存在',
            'NoSuchUpload':'Multipart Upload ID不存在',
            'NotImplemented':'无法处理的方法',
            'PreconditionFailed':'预处理错误',
            'RequestTimeTooSkewed':'发起请求的时间和服务器时间超出15分钟',
            'RequestTimeout':'请求超时',
            'SignatureDoesNotMatch':'签名错误',
            'TooManyBuckets':'Bucket数目超过限制'
        };
        return {
            getError: function (res, status) {
                var error = {
                    status: status,
                    code:  '',
                    msg:  ''
                };
                if(!res){
                    var msg ='';
                    if(status == 403){
                        msg = erroList['AccessDenied'];
                    }else{
                        msg = '网络请求错误';
                        if(OSSConfig.isGuiZhouClient()){
                            msg += '<p class="text-muted">（可能是你登录时选择的区域与当前的网络环境不匹配，请退出客户端后重新选择）</p>';
                        }
                    }
                    angular.extend(error,{
                        msg: msg
                    });
                }else{
                    var resError = res['Error'];
                    angular.extend(error,{
                        code: resError.Code || '',
                        msg: resError.Message || ''
                    });

                    var message = resError.Message;
                    if(erroList[resError.Code]){
                        message = erroList[resError.Code];
                    }
                    angular.extend(error,{
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
        return function(path){
            var lastStr = Util.String.lastChar(path);
            return lastStr === '/' || lastStr === '\\' ? 1 : 0;
        };
    })
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
    .directive('scrollToItem', ['$timeout',function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                attrs.$observe('scrollToItem',function(newVal){
                    $timeout(function(){
                        var index = newVal;
                        if (index < 0) return;
                        var $fileItem = element.find(attrs.itemSelector + ':eq(' + index + ')');
                        if (!$fileItem.size()) return;
                        var top = $fileItem.position().top;
                        var grep = top + $fileItem.height() - element.height() ;
                        if(top < 0){
                            element.scrollTop(element.scrollTop() + top);
                        }else if(grep > 0){
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
        return function (scope,element, attrs) {
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
            link: function (scope, element,attrs) {
                var isAutoSelect = false;
                attrs.$observe('autoSelect',function(isAuto){
                    isAutoSelect = isAuto;
                });

                element.on('click.autoSelect',function(){
                    if(isAutoSelect){
                        element.select();
                    }
                });

            }
        }
    }])

    /**
     * bucket区域选择下拉框
     */
    .directive('locationSelect', ['OSSRegion',function (OSSRegion) {
        return {
            restrict: 'E',
            replace:true,
            scope:{
                selectLocation: '=',
                disableSelect:'=',
                name:'@',
                placeHolder:'@',
                searchDisabled:'='
            },
            templateUrl:'views/location-select.html',
            link: function (scope) {
                scope.locations = OSSRegion.list();
                scope.$watch('locations.selected',function(val){
                    scope.selectLocation = val;
                });
                if(!scope.placeHolder){
                    scope.locations.selected =  scope.locations[0];
                }
            }
        }
    }])
;

