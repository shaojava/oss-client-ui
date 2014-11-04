'use strict';

/**
 * @ngdoc overview
 * @name OSSCommon
 * @description
 * # OSSCommon
 *
 * Main module of the application.
 */
angular.module('OSSCommon', [])
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
            }
        };
    }])
    .factory('OSSRegion', [function () {
        return {
            list: function () {
                return {
                    'oss-cn-hangzhou-a': '杭州',
                    'oss-cn-qingdao-a': '青岛',
                    'oss-cn-beijing-a': '北京',
                    'oss-cn-hongkong-a': '香港',
                    'oss-cn-shenzhen-a': '深圳',
                    'oss-cn-guizhou-a': '贵州'
                };
            }
        };
    }])
    .factory('OSSException', [function () {
        var erroList = {};
        return {
            getError: function (res, status) {
                var resError = res['Error'];
                var error = {
                    status: status,
                    code: resError.Code || '',
                    msg: resError.Message || ''
                };
                return error;
            },
            getClientErrorMsg: function (res) {
                return res.message;
            }
        };
    }])
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
    .filter('baseName', function () {
        return Util.String.baseName;
    })
    .filter('isDir', function () {
        return function(path){
            var lastStr = Util.String.lastChar(path);
            return lastStr === '/' || lastStr === '\\' ? 1 : 0;
        };
    })
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
;

