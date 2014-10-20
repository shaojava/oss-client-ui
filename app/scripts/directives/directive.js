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
    .directive('smartSearch', ['$location', '$rootScope', '$filter', 'OSSObject', 'Bucket', function ($location, $rootScope, $filter, OSSObject, Bucket) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function postLink(scope, element, attrs, ngModel) {
                var bread = element.parent().next();
                element.on('keydown', function (e) {
                    var keyword = e.keyCode;
                    if (keyword != 13) {
                        return;
                    }
                    scope.$apply(function () {
                        $location.search({
                            keyword: ngModel.$modelValue,
                            scope: ''
                        });
                    })
                })
                var $breadList = bread.find('.bread-list');
                var $searchWrapper = element.parent();

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
                        hideSearch();
                    })
                    element.focus();
                };

                var hideSearch = function () {
                    $searchWrapper.find('.search-scope').remove();
                    $searchWrapper.find('.fa-remove').remove();
                    $breadList.show();
                    element.next('.fa').show();
                };

                element.on('mousedown', function () {
                    showSearch();
                });

                element.next('.fa').on('click', function () {
                    showSearch();
                });
            }
        };
    }])
    .directive('queueItem', [function () {
        return {
            templateUrl: 'views/queue-item.html',
            restrict: 'E',
            replace: true,
            scope: {
                type: '@',
                item: '=data',
                onSelect: '&'
            },
            link: function postLink(scope, element, attrs) {
                scope.clickItem = function ($event, item) {
                    scope.onSelect({
                        $event: $event
                    });
                }
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
                    console.log('event', event);
                    scope.execute({
                        $event: event
                    });
                })
            }
        };
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
    .directive('keyboardNav', ['$parse',function ($parse) {
        return {
            restrict: 'A',
            scope: {
                keyboardNavList: '=',
                keyboardNav: '@',
                keyboardNavStep: '@',
                select:'&',
                unSelect:'&',
                getSelectedList:'&'
            },
            link: function postLink(scope, element, attrs) {

                var list = scope.keyboardNavList,
                    enableKeyboardNav = false, //是否允许开启键盘选择,
                    shiftLastIndex = 0,
                    keyboardNavStep = 1;

                scope.$watch('keyboardNavList', function (newVal, oldVal) {
                    shiftLastIndex = 0;
                    list = newVal;
                });

                attrs.$observe('keyboardNav', function (newVal, oldVal) {
                    enableKeyboardNav = newVal == 1 ? true : false;
                });

                attrs.$observe('keyboardNavStep', function (newVal, oldVal) {
                    keyboardNavStep = parseInt(newVal);
                });

                //已选中列表
                var getSelectedList = scope.getSelectedList;

                //获取已选中列表的最小index
                var getSelectedMinIndex = function () {
                    return _.indexOf(list,_.findWhere(list,{
                        selected:true
                    }));
                };

                //获取已选中列表的最大index
                var getSelectedMaxIndex = function () {
                    var selectedFiles = getSelectedList();
                    if(selectedFiles && selectedFiles.length){
                        return _.indexOf(list,selectedFiles[selectedFiles.length-1]);
                    }
                    return -1;
                };

                //选中
                var select = scope.select;

                //取消选中
                var unSelect =  scope.unSelect;

                //取消所有选中
                var unSelectAll = function(){
                    console.log('getSelectedList()',getSelectedList());
                    angular.forEach(getSelectedList(),function(item){

                        unSelect({
                            item:item
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
                    if (selectedIndex>=0) {
                        initIndex = selectedIndex;
                    }
                    var newIndex = initIndex - step;
                    if (newIndex < 0) {
                        newIndex = 0;
                    }

                    if ($event.shiftKey) {
                        for (var i = (initIndex > (list.length - 1) ? list.length - 1 : initIndex); i >= newIndex; i--) {
                            select({
                                item:list[i]
                            });
                        }
                    } else {
                        unSelectAll();
                        select({
                            item:list[newIndex]
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
                    console.log('selectedIndex',selectedIndex);
                    if (selectedIndex >= 0) {
                        initIndex = selectedIndex;
                    }
                    var newIndex = initIndex + step;
                    if (newIndex > list.length - 1) {
                        newIndex = list.length - 1;
                    }
                    console.log('newIndex',newIndex);
                    if ($event.shiftKey) {
                        for (var i = (initIndex > 0 ? initIndex : 0); i <= newIndex; i++) {
                            select({
                                item:list[i]
                            });
                        }
                    } else {
                        unSelectAll();
                        select({
                            item:list[newIndex]
                        });
                        shiftLastIndex = newIndex;
                    }
                };

                /**
                 * 监听键盘事件
                 */
                $(document).on('keydown.keyboardNav', function ($event) {
                    console.log('enableKeyboardNav',enableKeyboardNav);
                    if(!enableKeyboardNav){
                        return;
                    }

                    if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) >=0) {
                        return;
                    }
                    scope.$apply(function () {
                        var ctrlKeyOn = $event.ctrlKey || $event.metaKey;
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

            }
        };
    }]);
