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
    .filter('getRemainTime',['gettext','gettextCatalog', function ($filter,gettext,gettextCatalog) {
        return function (speed, filesize, offset) {
            if (!speed) {
                return '--:--:--';
            }

            //var time = (filesize - offset) / speed * 1000;
            //console.log('time',time);
            //return time ? $filter('date')(time, '00:mm:ss') : '--:--:--';
            var second = (filesize - offset) / speed
            if (second < 0 ){
              second = 0;
              return '--:--:--';
            }
            var d = parseInt(parseInt(second)/3600/24);
            var h = parseInt((parseInt(second)/3600) % 24);
            var m = parseInt((parseInt(second)/60) % 60);
            var s = parseInt(parseInt(second) % 60)
            if(d>0){
              return gettextCatalog.getString(gettext('大于{{dateLen}}天'),{dateLen: d});
            }else {
              if (h < 10) {
                h = '0' + h
              }
              if (m < 10) {
                m = '0' + m
              }
              if (s < 10) {
                s = '0' + s
              }
              if(h == '00' && m == '00' && s == '00'){
                 return '00:00:01';
              }
              return h + ":" + m + ":" + s
            }

        }
    }])
    .filter('getQueueState', ['$filter','gettext','gettextCatalog',function ($filter,gettext,gettextCatalog) {
        return function (type, status, speed, filesize, offset, errormsg) {
            var state = '';
            switch (status) {
                case 1:
                    state = $filter('getRemainTime')(speed, filesize, offset);
                    break;
                case 2:
                    state = ''
                    if (type == 'upload'){
                      state = gettextCatalog.getString(gettext('等待上传'));
                    }else{
                      state = gettextCatalog.getString(gettext('等待下载'))
                    }

                    break;
                case 3:
                    state = gettextCatalog.getString(gettext('暂停'));
                    break
                case 4:
                    state = gettextCatalog.getString(gettext('完成'));
                    break;
                case 5:
                    state = gettextCatalog.getString(gettext('错误：')) + errormsg;
                    break;
            }
            return state;
        }
    }])
    .filter('getLocation', ['OSSLocation',function (OSSLocation) {
        return OSSLocation.getUrl;
    }])
    .filter('baseName', function () {
        return Util.String.baseName;
    });
