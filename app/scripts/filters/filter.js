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
    .filter('formatTime', ['$filter', function ($filter) {
        return function (dateStr) {
            return $filter('date')(Date.parse(dateStr), 'yyyy-MM-dd HH:mm:ss');
        };
    }])
    .filter('getPrefixName', function () {
        return function (prefix, removeLastSlash) {
            removeLastSlash = angular.isUndefined(removeLastSlash) ? 0 : removeLastSlash;
            var arr = prefix.split('/');
            return arr[arr.length - 2] + (removeLastSlash ? "" : "/");

        }
    })
    .filter('getRemainTime', function ($filter) {
        return function (speed, filesize, offset) {
            console.log('arg', arguments);
            var time = (filesize - offset) / speed * 1000;
            console.log('time', time);
            return time ? $filter('date')(time, 'HH:mm:ss') : '--:--:--';
        }
    })

    .filter('getUploadState', function ($filter) {
        return function (status, speed, filesize, offset, errormsg) {
            var state = '';
            console.log('arguments', arguments)
            switch (status) {
                case 1:
                    state = $filter('getRemainTime')(peed, filesize, offset);
                    break;
                case 2:
                    state = '等待上传';
                    break;
                case 3:
                    state = '暂停';
                    break
                case 4:
                    state = '完成';
                    break;
                case 5:
                    state = '错误：' + errormsg;
                    break;
            }
            return state;
        }
    })

    .filter('getDownloadState', function ($filter) {
        return function (status, speed, filesize, offset, errormsg) {
            var state = '';
            console.log('arguments', arguments)
            switch (status) {
                case 1:
                    state = $filter('getRemainTime')(speed, filesize, offset);
                    break;
                case 2:
                    state = '等待下载';
                    break;
                case 3:
                    state = '暂停';
                    break
                case 4:
                    state = '完成';
                    break;
                case 5:
                    state = '错误：' + errormsg;
                    break;
            }
            return state;
        }
    })
    .filter('baseName', function () {
        return Util.String.baseName;
    });
