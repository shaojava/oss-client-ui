'use strict';

/**
 * @ngdoc filter
 * @name ossClientUiApp.filter:filter
 * @function
 * @description
 * # filter
 * Filter in the ossClientUiApp.
 */
angular.module('ossClientUiApp')
    .filter('bitSize', function () {
        return Util.Number.bitSize;
    })
    .filter('formatTime', function ($filter) {
        return function (dateStr) {
            return $filter('date')(Date.parse(dateStr), 'yyyy-MM-dd HH:mm:ss');
        };
    })
    .filter('getPrefixName', function () {
        return function (prefix, removeLastSlash) {
            removeLastSlash = angular.isUndefined(removeLastSlash) ? 0 : removeLastSlash;
            var arr = prefix.split('/');
            return arr[arr.length - 2] + (removeLastSlash ? "" : "/");

        }
    })
    .filter('baseName', function () {
        return Util.String.baseName;
    });
