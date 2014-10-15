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
    }]);
