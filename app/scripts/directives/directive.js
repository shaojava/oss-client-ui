'use strict';

/**
 * @ngdoc directive
 * @name ossClientUiApp.directive:directive
 * @description
 * # directive
 */
angular.module('ossClientUiApp')
    .directive('smartSearch', ['$location', '$rootScope', '$filter', function ($location, $rootScope, $filter) {
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
                    console.log('ngModel.$modelValue', ngModel.$modelValue);
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
                    var searchScopeName = $rootScope.PAGE_CONFIG.objectPrefix ? $filter('getPrefixName')($rootScope.PAGE_CONFIG.objectPrefix, 1) : $rootScope.PAGE_CONFIG.bucket.Name;
                    var $removeIcon = $('<a href="javascript:;" class="fa fa-remove fa-lg"></a>');
                    ;
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
                    item.selected = !item.selected;
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
                    console.log('event',event);
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
