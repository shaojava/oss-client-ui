'use strict';

/**
 * @ngdoc directive
 * @name ossClientUiApp.directive:directive
 * @description
 * # directive
 */
angular.module('ossClientUiApp')
    .directive('createFile', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var fn = $parse(attrs.createFileCallback);
                var createFileItem;
                scope.$watch(attrs.createFile, function (value, oldValue) {
                    if (value) {
                        element.scrollTop(0);
                        var defaultFilename = '新建文件夹';
                        var $input = angular.element('<input name="folder-name" class="form-control" value="' + defaultFilename + '" />'),
                            $okBtn = angular.element('<button class="btn btn-primary">确定</button>'),
                            $cancelBtn = angular.element('<button class="btn btn-default">取消</button>');

                        createFileItem = angular.element('<div class="clearfix file-item new-file-item"><div class="pull-left filename"><i class="file-icon-32 icon-folder"></i></div></div>');
                        createFileItem.find('.filename').append($input).append($okBtn).append($cancelBtn);
                        createFileItem.prependTo(element);
                        $input[0].select();
                        $input[0].selectionStart = 0;
                        $input[0].selectionEnd = defaultFilename.length;
                        $input.focus();
                        $okBtn.click(function () {
                            scope.$apply(function () {
                                var filename = $.trim($input.val());

                                createFileItem.find('button').prop('disabled', true);
                                $.isFunction(fn) && fn(scope, {
                                    filename: filename,
                                    callback: function (success) {
                                        if (success) {
                                            scope[attrs.createFile] = false;
                                        } else {
                                            createFileItem.find('button').prop('disabled', false);
                                        }

                                    }
                                });
                            });
                        });

                        $cancelBtn.click(function () {
                            scope.$apply(function () {
                                scope[attrs.createFile] = false;
                            })
                        });


                        $input.on('keydown', function (event) {
                            if (event.keyCode == 13) {
                                $okBtn.trigger('click');
                            }
                        });
                    } else {
                        createFileItem && createFileItem.remove();
                    }

                });
            }
        };
    }])
    .directive('smartSearch', ['$location', '$rootScope', '$filter', 'OSSObject', 'Bucket','OSSLocation', function ($location, $rootScope, $filter, OSSObject, Bucket,OSSLocation) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function postLink(scope, element, attrs, ngModel) {
                var bread = element.parent().next();

                element.on('keydown', function (e) {
                    var keycode = e.keyCode;
                    if (keycode != 13) {
                        return;
                    }
                    var keyword = ngModel.$modelValue;
                    if(!keyword){
                        return;
                    }
                    var currentObj = OSSObject.getCurrentObject();
                    var currentBucket = Bucket.getCurrentBucket();
                    scope.$apply(function () {
                        var url = OSSLocation.getUrl(currentBucket.Name,currentObj.path,'file',{
                            keyword: keyword,
                            scope: ''
                        });
                        $location.url(url);
                    })
                });

                var $breadList = bread.find('.bread-list');
                var $searchWrapper = element.parent();

                var hideSearch = function () {
                    $searchWrapper.find('.search-scope').remove();
                    $searchWrapper.find('.fa-remove').remove();
                    $breadList.show();
                    element.next('.fa').show();
                    scope[attrs.ngModel] = '';
                    var search = $location.search();
                    if(search.keyword){
                        $location.url($location.path());
                    }
                };

                var showSearch = function () {
                    if (element.next('.search-scope').size()) {
                        return;
                    }
                    var currentObj = OSSObject.getCurrentObject();
                    var currentBucket = Bucket.getCurrentBucket();
                    var searchScopeName = currentObj.path ? $filter('getPrefixName')(currentObj.path, 1) : currentBucket.Name;
                    var $removeIcon = $('<a href="javascript:;" class="fa fa-remove fa-lg"></a>');
                    var $searchScope = $('<div class="search-scope"> 在 <span>' + searchScopeName + '</span> 中搜索</div>');
                    element.next('.fa').hide();
                    element.after($searchScope).after($removeIcon);
                    element.css({
                        'padding-left': $searchScope.outerWidth(true) + 6
                    });
                    $breadList.hide();
                    $removeIcon.on('click', function () {
                        scope.$apply(function(){
                            hideSearch();
                        });
                    })
                    element.focus();
                };

                element.on('mousedown', function () {
                    showSearch();
                });

                element.next('.fa').on('click', function () {
                    showSearch();
                });

                scope.$on('$locationChangeSuccess',function(){
                    var param = $location.search();
                    if(!param || !param.keyword){
                        hideSearch();
                    }
                });
            }
        };
    }])
    .directive('smartBread', ['$timeout',function ($timeout) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {

                var fontSize = 12,
                    marginWidth = 10,
                    borderWidth = 8,
                    offsetParent = element.offsetParent(),
                    lastMaxWidth = 0;

                if(element.css('maxWidth').indexOf('%')>=0){
                    lastMaxWidth =  offsetParent.width() * (parseFloat(element.css('maxWidth'))/100);
                }else{
                    lastMaxWidth = parseInt(element.css('maxWidth'));
                }

                var getBreadItemWidth = function(breadItem){
                    return breadItem.outerWidth(true);
                    //return breadText.length * fontSize + marginWidth + borderWidth;
                };

                var getTotalBreadWidth = function(breads){
                    var totalWidth = 0;
                    breads.each(function(){
                        totalWidth += getBreadItemWidth($(this));
                    })
                    //totalWidth -= borderWidth;
                    return totalWidth;
                };

                var setBreadUI = function(){
                    var realWidth = element.width();
                    var totalWidth = getTotalBreadWidth(element.find('.bread-item'));
                    if(totalWidth > lastMaxWidth){
                        if(totalWidth > lastMaxWidth){
                            scope.breads.shift();
                        }
                    }
                };

                scope.$watch('breads',function(val){
                    if(!val || !val.length){
                        return;
                    }
                    $timeout(function(){
                        setBreadUI();
                    });
                });

                $(window).on('resize',function(){
                    lastMaxWidth =  offsetParent().width() * maxWidthSet;
                });
            }
        };
    }])
    .directive('queueItem', ['OSSQueueItem',function (OSSQueueItem) {
        return {
            templateUrl: 'views/queue-item.html',
            restrict: 'E',
            replace: true,
            scope: {
                type: '@',
                item: '=data',
                executeCmd:'&'
            },
            link: function postLink(scope) {
                scope.handleCmdClick = function(cmd,item){
                    scope.executeCmd({
                        cmd:cmd,
                        item:item
                    });
                };

                //是否出错
                scope.isError = OSSQueueItem.isError;

                //是否正在上传或下载
                scope.isInProgress = OSSQueueItem.isInProgress;

                //是否已完成
                scope.isDone = OSSQueueItem.isDone;

                //是否在等待上传
                scope.isWaiting = OSSQueueItem.isWaiting;

                //是否已暂停
                scope.isPasued = OSSQueueItem.isPaused;

                //获取进度
                scope.getProgress = function(item){
                    if(scope.isError(item) || scope.isPasued(item) || scope.isWaiting(item) ||  scope.isInProgress(item)){
                        if(item.filesize == 0){
                            return 100;
                        }
                        return item.offset/item.filesize*100;
                    }else{
                        return 100;
                    }

                };
            }
        };
    }])
    .directive('menu', [function () {
        return {
            template: '<button class="btn btn-default" ng-class="menu-{{name}}" ng-disabled="state==0" ng-show="state>-1" ng-transclude></button>',
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {
                text: "@",
                name: "@",
                state: "=",
                shortcut: "@",
                execute: "&"
            },
            link: function postLink(scope, element, attrs) {
                element.click(function (event) {
                    scope.execute({
                        $event: event
                    });
                });
            }
        };
    }])
    .directive('onlyNumber', ['$timeout',function ($timeout) {
        return {
          restrict: 'A',
          replace: false,
          link: function postLink(scope, element, attrs) {
            var _val = 0;
            $timeout(function(){
              var min = parseInt(attrs.min),max = parseInt(attrs.max)
              _val = element.val();
              element.keydown(function(event) {
                if(event.ctrlKey || event.shiftKey){
                  return false;
                }
                if((event.keyCode > 47 && event.keyCode < 58) || (event.keyCode > 95 && event.keyCode < 106) || "37 38 39 40 8".indexOf(event.keyCode+"") >= 0){
                  return true
                }
                return false

              }).keyup(function(event){
                if((min || min == 0) && (max || max == 0)) {
                  _val = element.val();
                  if (!_val || _val < min) {
                    element.val(min);
                    _val = min;
                  } else if (_val > max) {
                    element.val(max);
                    _val = max;
                  }
                }
              });
            })
          }
        }
    }])
    .directive('fileIcon', ['OSSObject', function (OSSObject) {
        return {
            template: '<i class="file-icon-{{size}} {{icon}}"></i>',
            restrict: 'E',
            replace: true,
            scope: {
                dir: "@",
                filename: "@",
                size: "@"
            },
            link: function postLink(scope, element, attrs) {
                scope.icon = OSSObject.getIcon(scope.dir, scope.filename);
            }
        };
    }])
    .directive('keyboardNav', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {

                var list = [],
                    enableKeyboardNav = false, //是否允许开启键盘选择,
                    shiftLastIndex = 0,
                    keyboardNavStep = 1;

                scope.$watch(attrs.keyboardNavList, function (newVal) {
                    shiftLastIndex = 0;
                    list = newVal;
                });

                attrs.$observe('keyboardNav', function (newVal) {
                    enableKeyboardNav = newVal == 1 ? true : false;
                });

                attrs.$observe('keyboardNavStep', function (newVal) {
                    keyboardNavStep = parseInt(newVal);
                });

                //已选中列表
                var getSelectedList = $parse(attrs.getSelectedList);

                //获取已选中列表的最小index
                var getSelectedMinIndex = function () {
                    return _.indexOf(list, _.findWhere(list, {
                        selected: true
                    }));
                };

                //获取已选中列表的最大index
                var getSelectedMaxIndex = function () {
                    var selectedFiles = getSelectedList(scope);
                    if (selectedFiles && selectedFiles.length) {
                        return _.indexOf(list, selectedFiles[selectedFiles.length - 1]);
                    }
                    return -1;
                };

                //选中
                var select = $parse(attrs.select);

                //取消选中
                var unSelect = $parse(attrs.unSelect);

                //取消所有选中
                var unSelectAll = function () {
                    angular.forEach(getSelectedList(scope), function (item) {
                        unSelect(scope, {
                            item: item
                        });
                    });
                };


                /**
                 * up left 键
                 * @param $event
                 */
                var upLeftPress = function ($event) {
                    var step = keyboardNavStep;

                    /**
                     * 初始index是最后一个
                     * @type {number}
                     */
                    var initIndex = list.length + step - 1;
                    /**
                     * 如果已经选中，则取已选中的最小一个
                     */
                    var selectedIndex = getSelectedMinIndex();
                    if (selectedIndex >= 0) {
                        initIndex = selectedIndex;
                    }
                    var newIndex = initIndex - step;
                    if (newIndex < 0) {
                        newIndex = 0;
                    }

                    if ($event.shiftKey) {
                        for (var i = (initIndex > (list.length - 1) ? list.length - 1 : initIndex); i >= newIndex; i--) {
                            select(scope, {
                                item: list[i]
                            });
                        }
                    } else {
                        unSelectAll();
                        select(scope, {
                            item: list[newIndex]
                        });
                        shiftLastIndex = newIndex;
                    }
                };

                /**
                 * down right 键
                 * @param $event
                 */
                var downRightPress = function ($event) {
                    var step = keyboardNavStep;

                    /**
                     * 初始index是第一个
                     * @type {number}
                     */
                    var initIndex = -1 * step;
                    /**
                     * 如果已经选中，则取已选中的最大一个
                     */
                    var selectedIndex = getSelectedMaxIndex();
                    if (selectedIndex >= 0) {
                        initIndex = selectedIndex;
                    }
                    var newIndex = initIndex + step;
                    if (newIndex > list.length - 1) {
                        newIndex = list.length - 1;
                    }
                    if ($event.shiftKey) {
                        for (var i = (initIndex > 0 ? initIndex : 0); i <= newIndex; i++) {
                            select(scope, {
                                item: list[i]
                            });
                        }
                    } else {
                        unSelectAll();
                        select(scope, {
                            item: list[newIndex]
                        });
                        shiftLastIndex = newIndex;
                    }
                };

                /**
                 * 监听键盘事件
                 */
                $(document).on('keydown.keyboardNav', function ($event) {
                    if (!enableKeyboardNav) {
                        return;
                    }

                    if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) >= 0) {
                        return;
                    }
                    scope.$apply(function () {
                        switch ($event.keyCode) {
                            case 37: //up
                            case 38: //left
                                upLeftPress($event);
                                break;
                            case 39: //down
                            case 40: //right
                                downRightPress($event);
                                break;
                        }
                    });
                    $event.preventDefault();
                });

                scope.$on('$destroy',function(){
                    $(document).off('keydown.keyboardNav');
                });

            }
        };
    }]);
