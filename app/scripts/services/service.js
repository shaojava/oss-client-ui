'use strict';

/**
 * @ngdoc service
 * @name ossClientUiApp.service
 * @description
 * # service
 * Factory in the ossClientUiApp.
 */
angular.module('ossClientUiApp')
/**
 * 信息提示框
 */
    .factory('OSSAlert', ['$modal','gettextCatalog','gettext', function ($modal,gettextCatalog,gettext) {

        function openAlertModal(type, message, title, buttons,errOptions) {
            var option = {
                templateUrl: 'views/alert_modal.html',
                windowClass: 'alert-modal ' + type + '-alert-modal',
                controller: function ($scope, $modalInstance) {
                    $scope.isWindowClient = OSS.isWindowsClient()
                    $scope.type = type;

                    $scope.message = message;

                    $scope.title = title;

                    $scope.buttons = buttons;

                    $scope.errOptions = errOptions;

                    var getRandomNum = function(){
                      var numArr = [0,1,2,3,4,5,6,7,8,9];
                      var _str = "";
                      for(var i=0;i<5;i++){
                        var index = Math.floor(Math.random() * 10)
                        _str += numArr[index] + "";
                      }
                      return _str;
                    }

                    if(errOptions && errOptions.Code === 'BucketAlreadyExists'){
                        errOptions.newBucketName = errOptions.bucketName + "-" + getRandomNum();
                    }
                    $scope.buttonClick = function (button) {
                        if(angular.isFunction(button.callback)){
                            button.callback($modalInstance)
                        }else{
                            $modalInstance.close();
                        }
                    };

                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };
                }
            };

            return $modal.open(option);
        }


        return {
            confirm:function(message,title){
                title = angular.isUndefined(title) ? gettextCatalog.getString(gettext('请确认')) : title;
                var buttons = [
                    {
                        text: gettextCatalog.getString(gettext('确定')),
                        classes: 'btn btn-primary',
                        callback:function($modalInstance){
                            $modalInstance.close();
                        }
                    },
                    {
                        text: gettextCatalog.getString(gettext('取消')),
                        classes: 'btn btn-default',
                        callback:function($modalInstance){
                            $modalInstance.dismiss('cancel');
                        }
                    }
                ];
                return openAlertModal('warning', message, title, buttons);
            },
            info: function (message, title, buttons) {
                title = angular.isUndefined(title) ? gettextCatalog.getString(gettext('信息')) : title;
                buttons = angular.isUndefined(buttons) ? [
                    {
                        text: gettextCatalog.getString(gettext('关闭')),
                        classes: 'btn btn-default'
                    }
                ] : buttons;
                return openAlertModal('info', message, title, buttons);
            },
            warning: function (message, title, buttons) {
                title = angular.isUndefined(title) ? gettextCatalog.getString(gettext('警告')) : title;
                buttons = angular.isUndefined(buttons) ? [
                    {
                        text: gettextCatalog.getString(gettext('确认')),
                        classes: 'btn btn-primary'
                    },
                    {
                        text: gettextCatalog.getString(gettext('关闭')),
                        classes: 'btn btn-default'
                    }
                ] : buttons;
                return openAlertModal('warning', message, title, buttons);
            },
            error: function (message, title, buttons,otherOption) {
                title = angular.isUndefined(title) || !title ? gettextCatalog.getString(gettext('错误')) : title;
                buttons = angular.isUndefined(buttons) || !buttons ? [
                    {
                        text: gettextCatalog.getString(gettext('关闭')),
                        classes: 'btn btn-default'
                    }
                ] : buttons;
                return openAlertModal('error', message, title, buttons,otherOption);
            },
            success: function (message, title, buttons) {
                title = angular.isUndefined(title) ? gettextCatalog.getString(gettext('成功')) : title;
                buttons = angular.isUndefined(buttons) ? [
                    {
                        text: gettextCatalog.getString(gettext('关闭')),
                        classes: 'btn btn-default'
                    }
                ] : buttons;
                return openAlertModal('success', message, title, buttons);
            }
        }
    }])

/**
 * 上传队列
 */
    .factory('OSSUploadQueue', ['$rootScope', '$timeout', 'OSSQueueItem', 'OSSLocation', '$filter', function ($rootScope, $timeout, OSSQueueItem, OSSLocation, $filter) {
        var size = 100;//每次加载多少条
        var OSSUploadQueue = {
            items: [],
            totalCount: 0,
            doneCount: 0,
            uploadSpeed: 0,
            downloadSpeed: 0,
            isStop: true,
            init: function () {
                this.getQueueList(0);
                return this;
            },
            getQueueList: function (start) {
                var res = OSS.invoke('getUpload', {
                    start: start,
                    count: size
                });
                OSS.log('OSSUploadQueue', res);
                var list = angular.isArray(res['list']) ? res['list'] : [];
                if (start == 0) {
                    this.items = list;
                } else {
                    angular.forEach(list, function (item) {
                        OSSUploadQueue.add(item);
                    });
                }
                this.totalCount = res['upload_total_count'];
                this.doneCount = res['upload_done_count'];
                this.uploadSpeed = res['upload'];
                this.downloadSpeed = res['download'];
            },
            add: function (item) {
                this.items.push(item);
            },
            get: function (pathhash) {
                return _.findWhere(this.items, {
                    pathhash: pathhash
                });
            },
            remove: function (item) {
                var index = _.indexOf(this.items, item);
                if (index > -1) {
                    this.items.splice(index, 1);
                }
            },
            update: function (item, param) {
                angular.extend(item, param);
            },
            refresh: function () {
                var _self = this;
                OSS.invoke('changeUpload', {start: 1}, function (res) {
                    $timeout(function () {
                        angular.forEach(res['list'], function (val) {
                            var existItem = _self.get(val.pathhash);
                            if (existItem) {
                                _self.update(existItem, val);
                            } else {
                                //不用增加，每次添加后重新去拿列表
                                // _self.add(val);
                            }
                            //上传成功后如果是当前的object刷新文件列表
                            var upPath = $filter('isDir')(val.object) ? Util.String.dirName(Util.String.dirName(val.object)) : Util.String.dirName(val.object);
                            if (OSSQueueItem.isDone(val) && OSSLocation.isCurrentObject(val.bucket, upPath)) {
                                $rootScope.$broadcast('reloadFileList');
                            }
                        });
                        _self.totalCount = res['upload_total_count'];
                        _self.doneCount = res['upload_done_count'];
                        _self.uploadSpeed = res['upload'];
                        _self.downloadSpeed = res['download'];
                    })
                }, false);
                this.isStop = false;
            },
            stop: function () {
                OSS.invoke('changeUpload', {start: 0});
                this.isStop = true;
            },
            isStoped: function () {
                return this.isStop;
            }
        };
        return OSSUploadQueue;
    }])

/**
 * 上传、下载队列单条
 */
    .factory('OSSQueueItem', [function () {
        var STATUS_ERROR = 5,
            STATUS_PROGRESS = 1,
            STATUS_DONE = 4,
            STATUS_WAITING = 2,
            STATUS_PASUED = 3;
        var OSSQueueItem = {
            setStatus: function (item, status) {
                item.status = status;
            },
            //是否出错
            isError: function (item) {
                return item.status == STATUS_ERROR;
            },
            //是否正在上传或下载
            isInProgress: function (item) {
                return item.status == STATUS_PROGRESS;
            },
            //是否已完成
            isDone: function (item) {
                return item.status == STATUS_DONE;
            },
            //是否在等待上传
            isWaiting: function (item) {
                return item.status == STATUS_WAITING;
            },
            //是否已暂停
            isPaused: function (item) {
                return item.status == STATUS_PASUED;
            },
            setError: function (item) {
                OSSQueueItem.setStatus(item, STATUS_ERROR);
            },
            setProgress: function (item) {
                OSSQueueItem.setStatus(item, STATUS_PROGRESS);
            },
            setDone: function (item) {
                OSSQueueItem.setStatus(item, STATUS_DONE);
            },
            setWaiting: function (item) {
                OSSQueueItem.setStatus(item, STATUS_WAITING);
            },
            setPaused: function (item) {
                OSSQueueItem.setStatus(item, STATUS_PASUED);
            }
        };

        return OSSQueueItem;
    }])

/**
 * 下载队列
 */
    .factory('OSSDownloadQueue', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
        var size = 100; //每次加载多少条
        var OSSDownloadQueue = {
            items: [],
            totalCount: 0,
            doneCount: 0,
            uploadSpeed: 0,
            downloadSpeed: 0,
            isStop: true,
            init: function () {
                this.getQueueList(0);
                return this;
            },
            getQueueList: function (start) {
                var res = OSS.invoke('getDownload', {
                    start: start,
                    count: size
                });
                var list = angular.isArray(res['list']) ? res['list'] : [];
                if (start == 0) {
                    this.items = list;
                } else {
                    angular.forEach(list, function (item) {
                        OSSDownloadQueue.add(item);
                    });
                }
                this.totalCount = res['download_total_count'];
                this.doneCount = res['download_done_count'];
                this.uploadSpeed = res['upload'];
                this.downloadSpeed = res['download'];
            },
            add: function (item) {
                this.items.push(item);
            },
            get: function (fullpath) {
                return _.findWhere(this.items, {
                    fullpath: fullpath
                });
            },
            remove: function (item) {
                var index = _.indexOf(this.items, item);
                if (index > -1) {
                    this.items.splice(index, 1);
                }
            },
            update: function (item, param) {
                angular.extend(item, param);
            },
            refresh: function () {
                var _self = this;
                this.isStop = false;
                OSS.invoke('changeDownload', {start: 1}, function (res) {
                    $timeout(function () {
                        angular.forEach(res['list'], function (val) {
                            var existItem = _self.get(val.fullpath);
                            if (existItem) {
                                _self.update(existItem, val);
                            } else {
                                // _self.add(val);
                            }
                        })
                        _self.totalCount = res['download_total_count'];
                        _self.doneCount = res['download_done_count'];
                        _self.uploadSpeed = res['upload'];
                        _self.downloadSpeed = res['download'];
                    })
                }, false);
            },
            stop: function () {
                OSS.invoke('changeDownload', {start: 0});
                this.isStop = true;
            },
            isStoped: function () {
                return this.isStop;
            }
        };
        return OSSDownloadQueue;
    }])

/**
 * 上传、下载队列的操作菜单
 */
    .factory('OSSQueueMenu', ['$rootScope', 'OSSQueueItem', '$timeout','OSSAlert', 'OSSDownloadQueue','OSSUploadQueue','gettext','gettextCatalog',function ($rootScope, OSSQueueItem, $timeout,OSSAlert,OSSDownloadQueue,OSSUploadQueue,gettext,gettextCatalog) {
        /**
         * 检测参数的合法性
         * @param selectedItems
         * @returns {boolean}
         */
        var checkArgValid = function (selectedItems) {
            if (!angular.isArray(selectedItems) || !selectedItems.length) {
                return false;
            }
            return true;
        };

        /**
         * 准备uplad的请求参数
         * @param selectedItems
         * @returns {{all: number, list: Array}}
         */
        var prepareUpladParam = function (selectedItems,finish) {
            var param = {
                all: selectedItems && selectedItems.length ? 0 : 1
            };
            if(typeof finish !== 'undefined'){
                angular.extend(param,{
                    finish:finish
                })
            }
            if (selectedItems) {
                param.list = [];
                angular.forEach(selectedItems, function (item) {
                    param.list.push({
                        bucket: item.bucket,
                        object: item.object
                    });
                });
            }
            return param;
        };

        /**
         * 准备download的请求参数
         * @param selectedItems
         * @returns {{all: number, list: Array}}
         */
        var prepareDownloadParam = function (selectedItems,finish) {
            var param = {
                all: selectedItems && selectedItems.length ? 0 : 1
            };
            if(typeof finish !== 'undefined'){
                angular.extend(param,{
                    finish:finish
                })
            }
            if (selectedItems) {
                param.list = [];
                angular.forEach(selectedItems, function (item) {
                    param.list.push({
                        fullpath: item.fullpath
                    });
                });
            }
            return param;
        };

        /**
         * 上传队列的操作菜单
         * @type {{name: string, text: string, execute: Function, getState: Function}[]}
         */
        var uploadMenu = [
            {
                name: 'start',
                text: gettext('开始'),
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('startUpload', prepareUpladParam(selectedItems), function () {
                        $timeout(function () {
                            _.each(selectedItems, OSSQueueItem.setProgress);
                        });
                    });
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return -1;
                    }
                    var hasUnValidItem = false;
                    for (var i = 0; i < selectedItems.length; i++) {
                        var item = selectedItems[i];
                        if (!OSSQueueItem.isPaused(item)) {
                            hasUnValidItem = true;
                        }
                    }
                    if (hasUnValidItem) {
                        return -1;
                    }
                    return 1;
                }
            },
            {
                name: 'pause',
                text: gettext('暂停'),
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('stopUpload', prepareUpladParam(selectedItems), function () {
                        $timeout(function () {
                            _.each(selectedItems, OSSQueueItem.setPaused);
                        })
                    });
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return 0;
                    }
                    var hasUnValidItem = false;
                    var count = 0;
                    for (var i = 0; i < selectedItems.length; i++) {
                        var item = selectedItems[i];
                        if (OSSQueueItem.isPaused(item) || OSSQueueItem.isError(item) || OSSQueueItem.isDone(item)) {
                            hasUnValidItem = true;
                            if (OSSQueueItem.isPaused(item)) {
                                count++;
                            }
                        }
                    }
                    if (hasUnValidItem) {
                        if (count == selectedItems.length) {
                            return -1;
                        } else {
                            return 0;
                        }
                    }
                    return 1;
                }
            },
            {
                name: 'cancel',
                text: gettext('取消'),
                execute: function (selectedItems) {
                    var msg = "";
                    if (selectedItems.length == 1){
                      msg = gettextCatalog.getString(gettext("你确定要取消这个文件的上传？"))
                    }else if (selectedItems.length > 1){
                      msg = gettextCatalog.getString(gettext("你确定要取消这{{fileLen}}个文件的上传？"),{fileLen:selectedItems.length})
                    }

                    OSSAlert.confirm(msg).result.then(function(){
                        if (!checkArgValid(selectedItems)) {
                            return;
                        }
                        OSS.invoke('deleteUpload', prepareUpladParam(selectedItems), function () {
                            $timeout(function () {
                                $rootScope.$broadcast('removeQueue', 'upload', selectedItems);
                            })
                        });
                    },function(){
                        return;
                    })
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return 0;
                    }
                    var doneItemsList = _.filter(selectedItems, function (item) {
                        return OSSQueueItem.isDone(item) || OSSQueueItem.isError(item);
                    });

                    var progressList = _.filter(selectedItems, function (item) {
                        return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item) || OSSQueueItem.isPaused(item);
                    });

                    if (doneItemsList && doneItemsList.length == selectedItems.length) {
                        return -1;
                    } else if (progressList && progressList.length == selectedItems.length) {
                        return 1
                    }
                    return 0;
                }
            },
            {
                name: 'remove',
                text: gettext('移除'),
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('deleteUpload', prepareUpladParam(selectedItems), function () {
                        $timeout(function () {
                            $rootScope.$broadcast('removeQueue', 'upload', selectedItems);
                        });
                    });
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return -1;
                    }
                    var doneItemsList = _.filter(selectedItems, function (item) {
                        return OSSQueueItem.isDone(item) || OSSQueueItem.isError(item);
                    });

                    if (doneItemsList && doneItemsList.length == selectedItems.length) {
                        return 1;
                    }
                    return -1;
                }
            },
            {
                name: 'pauseAll',
                text: gettext('全部暂停'),
                execute: function (selectedItems, items) {
                    OSS.invoke('stopUpload', prepareUpladParam(), function () {
                        $timeout(function () {
                            _.each(_.filter(items, function (item) {
                                return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item);
                            }), OSSQueueItem.setPaused);
                        })
                    });
                },
                getState: function (selectItems, items) {
                    return !items || !items.length ? 0 : 1;
                }
            },
            {
                name: 'startAll',
                text: gettext('全部开始'),
                execute: function (selectedItems, items) {
                    OSS.invoke('startUpload', prepareUpladParam(), function () {
                        $timeout(function () {
                            _.each(_.filter(items, function (item) {
                                return OSSQueueItem.isPaused(item) || OSSQueueItem.isError(item);
                            }), OSSQueueItem.setWaiting);
                        });
                    });
                },
                getState: function (selectItems, items) {
                    return !items || !items.length ? 0 : 1;
                }
            },
            {
                name: 'stopAll',
                text: gettext('全部取消'),
                execute: function (selectedItems, items) {
                    var msg = gettextCatalog.getString(gettext('你确定要取消所有上传？'));
                    OSSAlert.confirm(msg).result.then(function(){
                        OSS.invoke('deleteUpload', prepareUpladParam(false,0), function () {
                            $timeout(function () {
                                $rootScope.$broadcast('reloadUploadQueue');
                            })
                        });
                    });
                },
                getState: function (selectItems, items) {
                    return !items || !items.length ? 0 : 1;
                }
            },
            {
                name: 'removeAll',
                text: gettext('清空已完成'),
                execute: function (selectItems, items) {
                    OSS.invoke('deleteUpload', {
                        finish: 1,
                        all: 1
                    }, function () {
                        $timeout(function () {
                            $rootScope.$broadcast('removeQueue', 'upload', _.filter(items, function (item) {
                                return OSSQueueItem.isDone(item);
                            }),function(){
                                $rootScope.$broadcast('reloadUploadQueue');
                            });

                        });
                    });
                },
                getState: function (selectItems, items) {
                    return !items || !items.length ? 0 : 1;
                }
            }
        ];

        /**
         * 下载队列的操作菜单
         * @type {{name: string, text: string, execute: Function, getState: Function}[]}
         */
        var downloadMenu = [
            {
                name: 'start',
                text: gettext('开始'),
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('startDownload', prepareDownloadParam(selectedItems), function () {
                        $timeout(function () {
                            _.each(selectedItems, OSSQueueItem.setProgress);
                        })
                    });
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return -1;
                    }
                    var hasUnValidItem = false;
                    for (var i = 0; i < selectedItems.length; i++) {
                        var item = selectedItems[i];
                        if (!OSSQueueItem.isPaused(item)) {
                            hasUnValidItem = true;
                        }
                    }
                    if (hasUnValidItem) {
                        return -1;
                    }
                    return 1;
                }
            },
            {
                name: 'pause',
                text: gettext('暂停'),
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('stopDownload', prepareDownloadParam(selectedItems), function () {
                        $timeout(function () {
                            _.each(selectedItems, OSSQueueItem.setPaused);
                        })
                    });

                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return 0;
                    }
                    var hasUnValidItem = false;
                    var count = 0;
                    for (var i = 0; i < selectedItems.length; i++) {
                        var item = selectedItems[i];
                        if (OSSQueueItem.isPaused(item) || OSSQueueItem.isError(item) || OSSQueueItem.isDone(item)) {
                            hasUnValidItem = true;
                            if (OSSQueueItem.isPaused(item)) {
                                count++;
                            }
                        }
                    }
                    if (hasUnValidItem) {
                        if (count == selectedItems.length) {
                            return -1;
                        } else {
                            return 0;
                        }

                    }
                    return 1;
                }
            },
            {
                name: 'cancel',
                text: gettext('取消'),
                execute: function (selectedItems) {
                    var msg = ""
                    if (selectedItems.length == 1){
                      msg = gettextCatalog.getString(gettext('你确定要取消这个文件的下载？'));
                    }else if (selectedItems.length > 1) {
                      msg = gettextCatalog.getString(gettext('你确定要取消这{{fileLen}}文件的下载？'), {fileLen: selectedItems.length});
                    }
                    OSSAlert.confirm(msg).result.then(function(){
                        if (!checkArgValid(selectedItems)) {
                            return;
                        }
                        OSS.invoke('deleteDownload', prepareDownloadParam(selectedItems), function () {
                            $timeout(function () {
                                $rootScope.$broadcast('removeQueue', 'download', selectedItems);
                            })
                        });
                    });
                },
                getState: function (selectedItems) {
                    if (!selectedItems || !selectedItems.length) return 0;
                    var doneItemsList = _.filter(selectedItems, function (item) {
                        return OSSQueueItem.isDone(item) || OSSQueueItem.isError(item);
                    });

                    var progressList = _.filter(selectedItems, function (item) {
                        return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item) || OSSQueueItem.isPaused(item);
                    });

                    if (doneItemsList && doneItemsList.length == selectedItems.length) {
                        return -1;
                    } else if (progressList && progressList.length == selectedItems.length) {
                        return 1
                    }
                    return 0;
                }
            },
            {
                name: 'remove',
                text: gettext('移除'),
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('deleteDownload', prepareDownloadParam(selectedItems), function () {
                        $timeout(function () {
                            $rootScope.$broadcast('removeQueue', 'download', selectedItems);
                        });
                    });

                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return -1;
                    }
                    var doneItemsList = _.filter(selectedItems, function (item) {
                        return OSSQueueItem.isDone(item) || OSSQueueItem.isError(item);
                    });

                    if (doneItemsList && doneItemsList.length == selectedItems.length) {
                        return 1;
                    }
                    return -1;
                }
            },
            {
                name: 'pauseAll',
                text: gettext('全部暂停'),
                execute: function (selectItems, items) {
                    OSS.invoke('stopDownload', prepareDownloadParam(), function () {
                        $timeout(function () {
                            _.each(_.filter(items, function (item) {
                                return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item);
                            }), OSSQueueItem.setPaused);
                        });
                    });
                },
                getState: function (selectItems, items,doneCount,totalCount) {
                    return !items || !items.length ? 0 : 1;
                }
            },
            {
                name: 'startAll',
                text: gettext('全部开始'),
                execute: function (selectItems, items) {
                    OSS.invoke('startDownload', prepareDownloadParam(), function () {
                        _.each(_.filter(items, function (item) {
                            return OSSQueueItem.isPaused(item);
                        }), OSSQueueItem.setProgress);
                    });
                },
                getState: function (selectItems, items) {
                    return !items || !items.length ? 0 : 1;
                }
            },
            {
                name: 'stopAll',
                text: gettext('全部取消'),
                execute: function (selectedItems, items) {
                    var msg = gettextCatalog.getString(gettext('你确定要取消所有下载？'));
                    OSSAlert.confirm(msg).result.then(function(){
                        OSS.invoke('deleteDownload', prepareDownloadParam(false,0), function () {
                            $timeout(function () {
                                $rootScope.$broadcast('reloadDownloadQueue');
                            })
                        });
                    });
                },
                getState: function (selectItems, items) {
                    return !items || !items.length ? 0 : 1;
                }
            },
            {
                name: 'removeAll',
                text: gettext('清空已完成'),
                execute: function (selectItems, items) {
                    OSS.invoke('deleteDownload', {
                        finish: 1,
                        all: 1
                    }, function () {
                        $timeout(function () {
                            $rootScope.$broadcast('removeQueue', 'download', _.filter(items, function (item) {
                                return OSSQueueItem.isDone(item);
                            }),function(){
                                $rootScope.$broadcast('reloadDownloadQueue');
                            });
                        });
                    });
                },
                getState: function (selectItems, items) {
                    return !items || !items.length ? 0 : 1;
                }
            }
        ];

        var groupMenu = [
            ['start', 'pause', 'cancel', 'remove'],
            ['startAll', 'pauseAll','stopAll', 'removeAll']
        ];

        var OSSQueueMenu = {
            getUploadMenu: function () {
                return uploadMenu;
            },
            getDownloadMenu: function () {
                return downloadMenu;
            },
            getUploadMenuItem: function (name) {
                return _.findWhere(uploadMenu, {
                    name: name
                })
            },
            getDownloadMenuItem: function (name) {
                return _.findWhere(downloadMenu, {
                    name: name
                });
            },
            groupBy: function (menus) {
                var groupMenus = [];
                angular.forEach(groupMenu, function (val, key) {
                    if (!groupMenus[key]) {
                        groupMenus[key] = [];
                    }
                    angular.forEach(val, function (menuName) {
                        groupMenus[key].push(_.findWhere(menus, {
                            name: menuName
                        }));
                    });
                });
                return groupMenus;
            }
        };
        return OSSQueueMenu;
    }])

/**
 * object的操作菜单
 */
    .factory('OSSMenu', ['Clipboard', 'OSSAlert','OSSModal', '$rootScope', 'OSSApi', 'OSSException','OSSConfig','gettext','gettextCatalog', function (Clipboard,OSSAlert, OSSModal, $rootScope, OSSApi, OSSException,OSSConfig,gettext,gettextCatalog) {
        var currentMenus = 'upload create paste downloadcurrent'.split(' '),
            selectMenus = 'download copy del get_uri set_header paste'.split(' '),
            groupMenu = ['upload create'.split(' '), 'download copy del'.split(' '), 'get_uri set_header'.split(' ') , 'paste'.split(' ')];
        var allMenu = [

            {
                name: 'upload',
                text: gettext('上传'),
                getState: function () {
                    return 1;
                },
                execute: function (bucket, currentObject) {
                    OSS.invoke('selectFileDlg', {
                        path: '',
                        disable_root: 1
                    }, function (res) {
                        if (!res || !res['list'] || !res['list'].length) {
                            return;
                        }
                        OSS.invoke('addFile', {
                            location: bucket['Location'],
                            bucket: bucket['Name'],
                            prefix: currentObject,
                            list: res['list']
                        }, function (res) {
                            if (!res.error) {
                                $rootScope.$broadcast('toggleTransQueue', true, 'upload');
                                $rootScope.$broadcast('reloadUploadQueue');
                            } else {
                                $rootScope.$broadcast('showError', OSSException.getClientErrorMsg(res));
                            }
                        });
                    });
                }
            },
            {
                name: 'create',
                text: gettext('新建文件夹'),
                getState: function () {
                    return 1;
                },
                execute: function (bucket, currentObject) {
                    $rootScope.$broadcast('createObject', function (filename, callback) {
                        var msg  = gettextCatalog.getString(gettext('文件夹名称格式错误'));
                        msg += '<p class="text-muted">';
                        msg += gettextCatalog.getString(gettext('1. 只能包含字母，数字，中文，下划线（_）和短横线（-）,小数点（.）'))+'<br/>';
                        msg += gettextCatalog.getString(gettext('2. 只能以字母、数字或者中文开头'))+'<br/>';
                        msg += gettextCatalog.getString(gettext('3. 文件夹的长度限制在1-254之间'))+'<br/>';
                        msg += gettextCatalog.getString(gettext('4. Object总长度必须在1-1023之间'))+'<br/>';
                        msg += '</p>';

                        if(!/^[a-zA-Z0-9\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5_\-.]{0,253}$/.test(filename)){
                            $rootScope.$broadcast('showError',msg);
                            $.isFunction(callback) && callback(false);
                            return;
                        }
                        if(Util.String.mbLen(filename) > 254){
                            $rootScope.$broadcast('showError',msg);
                            $.isFunction(callback) && callback(false);
                            return;
                        }
                        var objectPath = currentObject ? currentObject + filename + '/' : filename + '/';
                        if(Util.String.mbLen(objectPath) > 1023){
                            $rootScope.$broadcast('showError',msg);
                            $.isFunction(callback) && callback(false);
                            return;
                        }
                        //新建之前先去检测是否有同名的文件夹
                        OSSApi.getObjectMeta(bucket,objectPath).success(function(){
                            $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('已存在相同名称的文件夹')));
                            $.isFunction(callback) && callback(false);
                        }).error(function(response, statusCode){
                            var error = OSSException.getError(response, statusCode);
                            if(error.status != 404){
                                $rootScope.$broadcast('showError', error.msg);
                                $.isFunction(callback) && callback(false);
                                return;
                            }
                            OSSApi.putObject(bucket, objectPath, {
                                'Content-Type': ''
                            }, '').success(function () {
                                $.isFunction(callback) && callback(true);
                                $rootScope.$broadcast('addObject', {
                                    Prefix: objectPath
                                }, true);
                            }).error(function (res, status) {
                                $.isFunction(callback) && callback(false);
                                $rootScope.$broadcast('showError', OSSException.getError(res, status).msg);
                            });
                        });

                    })
                }
            },
            {
              name: 'downloadcurrent',
              text: gettext('下载当前目录'),
              getState: function(selectFiles, bucket){
                if(OSSConfig.isArchiveBucket(bucket)){
                    return 0
                }
                return 1;
              },
              execute: function (bucket, currentObject){
                var list = [{
                    location: bucket['Location'],
                    bucket: bucket['Name'],
                    object: currentObject,
                    filesize: 0,
                    etag:""
                  }]
                OSS.invoke('saveFileDlg',null,function(res){
                  var _path = res.path
                  if(_path){
                    $rootScope.$broadcast('startDownloadFilesLoading');
                    OSS.invoke('saveFile', {
                      list: list,
                      path:_path
                    }, function (res) {
                      $rootScope.$broadcast('endDownloadFilesLoading')
                      if (!res.error) {
                        $rootScope.$broadcast('toggleTransQueue', true, 'download');
                        $rootScope.$broadcast('reloadDownloadQueue');
                      } else {
                        $rootScope.$broadcast('showError', OSSException.getClientErrorMsg(res));
                      }
                    })
                  }
                })
              }
            },
            {
              name: 'bucketdownload',
              text: gettext('下载'),
              getState: function () {
                return 1;
              },
              execute: function (bucket) {
                var list = [{
                    location: bucket['Location'],
                    bucket: bucket['Name'],
                    object: ""
                  }]
                OSS.invoke('saveFileDlg',null,function(res){
                  var _path = res.path
                  if(_path){
                    $rootScope.$broadcast('startDownloadFilesLoading');
                    OSS.invoke('saveFile', {
                      list: list,
                      path:_path
                    }, function (res) {
                      $rootScope.$broadcast('endDownloadFilesLoading')
                      if (!res.error) {
                        $rootScope.$broadcast('toggleTransQueue', true, 'download');
                        $rootScope.$broadcast('reloadDownloadQueue');
                      } else {
                        $rootScope.$broadcast('showError', OSSException.getClientErrorMsg(res));
                      }
                    })
                  }
                })
              }
            },
            {
                name: 'download',
                text: gettext('下载'),
                getState: function (selectedFiles, bucket) {
                    if(!bucket){
                        return 0;
                    }
                    var len = selectedFiles.length;
                    //归档bucket一次只能下载一个文件
                    if(OSSConfig.isArchiveBucket(bucket)) {
                        if(len != 1){
                            return 0
                        }
                    }else{
                      if (!len) {
                        return 0;
                      }
                    }
                    return 1;
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    if(OSSConfig.isArchiveBucket(bucket)) {
                      OSSModal.downloadObject(bucket, selectedFiles);
                    }else{
                      var list = _.map(selectedFiles, function (val) {
                        return {
                          location: bucket['Location'],
                          bucket: bucket['Name'],
                          object: val.path,
                          filesize: val.size,
                          etag:val.etag
                        }
                      });
                      OSS.invoke('saveFileDlg',null,function(res){
                        var _path = res.path
                        if(_path){
                          $rootScope.$broadcast('startDownloadFilesLoading');
                          OSS.invoke('saveFile', {
                            list: list,
                            path:_path
                          }, function (res) {
                            $rootScope.$broadcast('endDownloadFilesLoading')
                            if (!res.error) {
                              $rootScope.$broadcast('toggleTransQueue', true, 'download');
                              $rootScope.$broadcast('reloadDownloadQueue');
                            } else {
                              $rootScope.$broadcast('showError', OSSException.getClientErrorMsg(res));
                            }
                          })
                        }
                      })
                    }

                }
            },
            {
                name: 'copy',
                text: gettext('复制'),
                getState: function (selectedFiles, bucket) {
                    if(!bucket || OSSConfig.isArchiveBucket(bucket)){
                        return 0;
                    }
                    var len = selectedFiles.length;
                    if (!len) {
                        return 0;
                    }
                    return 1;
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    var data = JSON.stringify({
                        ac: 'copy',
                        bucket: bucket,
                        objects: selectedFiles
                    });
                    Clipboard.add(data);
                }
            },
            {
                name: 'paste',
                text: gettext('粘贴'),
                getState: function (selectedFiles, bucket) {
                  if(!bucket || OSSConfig.isArchiveBucket(bucket)){
                    return -1;
                  }
                  return Clipboard.len() ? 1 : -1;
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    var clipData = Clipboard.get();
                    if (!clipData) return;
                    clipData = JSON.parse(clipData);
                    if (clipData.ac == 'copy') {
                        var targetBucket = clipData['bucket'];
                        var list = clipData['objects'].map(function (object) {
                            return {
                                object: object.path,
                                filesize: object.filesize
                            }
                        });
                        if(bucket['Location'] != targetBucket['Location']){
                            $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('不同区域的Bucket之间不能复制')));
                            return;
                        }
                        var copyToCurrent = selectedFiles.length == 1 && selectedFiles[0].dir ? false : true;
                        OSS.invoke('copyObject', {
                            dstbucket: bucket['Name'],
                            dstobject: !copyToCurrent ? selectedFiles[0].path : currentObject,
                            dstlocation: bucket['Location'],
                            bucket: targetBucket['Name'],
                            location: targetBucket['Location'],
                            list: list
                        }, function (res) {
                            if (!res.error) {
                                if(copyToCurrent){
                                    $rootScope.$broadcast('reloadFileList');
                                }
                            } else {
                                $rootScope.$broadcast('showError', OSSException.getClientErrorMsg(res));
                            }
                        })
                    }
                }
            },
            {
                name: 'del',
                text: gettext('删除'),
                getState: function (selectedFiles) {
                    var len = selectedFiles.length;
                    if (!len) {
                        return 0;
                    }
                    return 1;
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    OSSAlert.confirm(gettextCatalog.getString(gettext('确定要删除？'))).result.then(function(){
                        var list = _.map(selectedFiles, function (object) {
                            return {
                                object: object.path
                            }
                        });

                        OSS.invoke('deleteObject', {
                            bucket: bucket['Name'],
                            location: bucket['Location'],
                            list: list
                        }, function (res) {
                            if (!res.error) {
                                $rootScope.$broadcast('removeObject', selectedFiles);
                            } else {
                                $rootScope.$broadcast('showError', OSSException.getClientErrorMsg(res));
                            }
                        })
                    });
                }
            },
            {
                name: 'get_uri',
                text: gettext('获取地址'),
                getState: function (selectedFiles) {
                    var len = selectedFiles.length;
                    if (!len || len > 1) {
                        return 0;
                    } else {
                        return selectedFiles[0].dir ? 0 : 1
                    }
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    OSSModal.getObjectURI(bucket, selectedFiles[0]);
                }
            },
            {
                name: 'set_header',
                text: gettext('设置HTTP头'),
                getState: function (selectedFiles) {
                    if (!selectedFiles || selectedFiles.length == 0)
                      return 0;
                    var dirs = _.find(selectedFiles, function(item) {
                      return item.dir;
                    })
                    return dirs ? 0 : 1
                    //var len = selectedFiles.length;
                    //if (!len || len > 1) {
                    //    return 0;
                    //} else {
                    //    return selectedFiles[0].dir ? 0 : 1
                    //}
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    OSSModal.setObjectHttpHeader(bucket, selectedFiles);
                }
            }

        ];
        if(OSSConfig.showRefer()){
          var referSetting = {
            name: 'refer',
            text: gettext('Refer设置'),
            getState: function () {
              return 1;
            },
            execute: function (bucket) {
              OSSModal.setRefer(bucket);
            }
          }

          allMenu.splice(0,0,referSetting);
          currentMenus = currentMenus.concat(['refer']);
          groupMenu[0].push('refer');
        }
        if(OSSConfig.showRam()){
          var ramSetting = {
            name:'set_ram',
            text:gettext('RAM授权'),
            getState: function (selectedFiles) {
              return 1;
            },
            execute: function (bucket, currentObject, selectedFiles){
              OSSModal.setRam();
            }
          }
          allMenu.push(ramSetting);
          currentMenus = currentMenus.concat(['set_ram']);
          groupMenu.push(['set_ram']);
        }
        return {
            getAllMenu: function () {
                return allMenu;
            },
            getCurrentFileMenu: function () {
                return _.filter(allMenu, function (menu) {
                    return _.indexOf(currentMenus, menu.name) >= 0;
                })
            },
            getSelectFileMenu: function () {
                return _.filter(allMenu, function (menu) {
                    return _.indexOf(selectMenus, menu.name) >= 0;
                })
            },
            getMenu: function (name) {
                return _.findWhere(allMenu, {
                    name: name
                })
            },
            groupMenu: function (menus) {
                var groupMenus = [];
                angular.forEach(groupMenu, function (val, key) {
                    if (!groupMenus[key]) {
                        groupMenus[key] = [];
                    }
                    angular.forEach(val, function (menuName) {
                        groupMenus[key].push(_.findWhere(menus, {
                            name: menuName
                        }));
                    });
                });
                return groupMenus;
            },
            getTopExcludeMenus: function () {
                return [];
            }
        };
    }])

/**
 * 碎片的的操作菜单
 */
    .factory('OSSUploadMenu', ['Bucket','OSSAlert', 'OSSApi', '$rootScope', 'OSSModal','OSSException','gettext','gettextCatalog',function (Bucket, OSSAlert,OSSApi,$rootScope, OSSModal,OSSException,gettext,gettextCatalog) {
        var allMenu = [
            {
                name: 'remove',
                text: gettext('删除'),
                getState: function (selectedUploads) {
                    var len = selectedUploads.length;
                    if (!len) {
                        return 0;
                    }
                    return 1;
                },
                execute: function (selectedUploads) {
                    OSSAlert.confirm(gettextCatalog.getString(gettext('确定要删除选择的碎片？'))).result.then(function(){
                        angular.forEach(selectedUploads, function (upload) {
                            OSSApi.deleteUpload(Bucket.getCurrentBucket(), upload).success(function () {
                                $rootScope.$broadcast('removeUpload', upload);
                            }).error(function (res,status) {
                                $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                            });
                        });
                    });
                }
            },
            {
                name: 'detail',
                text: gettext('详细'),
                getState: function (selectedUploads) {
                    var len = selectedUploads.length;
                    if (!len || len > 1) {
                        return 0;
                    }
                    return 1;
                },
                execute: function (selectedUploads) {
                    OSSModal.uploadDetail(Bucket.getCurrentBucket(), selectedUploads[0]);
                }
            }

        ];
        return {
            getAllMenu: function () {
                return allMenu;
            }
        };
    }])

/**
 * 浏览的历史记录
 */
    .factory('OSSLocationHistory', ['$location', '$rootScope', function ($location, $rootScope) {
        var update = true,
            history = [],
            current,
            maxLen = 100;

        $rootScope.$on('$locationChangeSuccess', function () {
            var url = $location.url();
            var l = history.length;
            if (update) {
                current >= 0 && l > current + 1 && history.splice(current + 1);
                if (history[history.length - 1] != url) {
                    history.push(url);
                    if (history.length > maxLen) {
                        history.splice(0, 1);
                    }
                }
                current = history.length - 1;
            }
            update = true;
        });

        return {
            reset: function () {
                history = [];
                current = 0;
                update = true;
            },
            go: function (isForward) {
                if ((isForward && this.canForward()) || (!isForward && this.canBackward())) {
                    update = false;
                    $location.url(history[isForward ? ++current : --current]);
                }
            },
            forward: function () {
                this.go(true);
            },
            backwardPath:function(){
              if(this.canBackward()) {
                return history[current - 1]
              }
              return null;
            },
            backward: function () {
                this.go();
            },
            forwardPath:function(){
              if(this.canForward()) {
                return history[current + 1]
              }
              return null;
            },
            canForward: function () {
                return current < history.length - 1;
            },

            canBackward: function () {
                return current > 0;
            }
        };
    }])

/**
 * object相关
 */
    .factory('OSSObject', ['$location', '$filter', 'OSSApi', '$q', 'OSSLocation', function ($location, $filter, OSSApi, $q, OSSLocation) {
        var fileSorts = {
            'SORT_SPEC': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'ai', 'cdr', 'psd', 'dmg', 'iso', 'md', 'ipa', 'apk'],
            'SORT_MOVIE': ['mp4', 'mkv', 'rm', 'rmvb', 'avi', '3gp', 'flv', 'wmv', 'asf', 'mpeg', 'mpg', 'mov', 'ts', 'm4v'],
            'SORT_MUSIC': ['mp3', 'wma', 'wav', 'flac', 'ape', 'ogg', 'aac', 'm4a'],
            'SORT_IMAGE': ['jpg', 'png', 'jpeg', 'gif', 'psd', 'bmp', 'ai', 'cdr'],
            'SORT_DOCUMENT': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'odt', 'rtf', 'ods', 'csv', 'odp', 'txt'],
            'SORT_CODE': ['js', 'c', 'cpp', 'h', 'cs', 'vb', 'vbs', 'java', 'sql', 'ruby', 'php', 'asp', 'aspx', 'html', 'htm', 'py', 'jsp', 'pl', 'rb', 'm', 'css', 'go', 'xml', 'erl', 'lua', 'md'],
            'SORT_ZIP': ['rar', 'zip', '7z', 'cab', 'tar', 'gz', 'iso'],
            'SORT_EXE': ['exe', 'bat', 'com']
        };
        var currentObject = {};
        return {
            getCurrentObject: function () {
                return currentObject;
            },
            setCurrentObject: function (object) {
                currentObject = object;
            },
            list: function (bucket, prefix, delimiter, lastLoadMaker, loadFileCount) {
                var _self = this;
                var defer = $q.defer();
                OSSApi.getObjects(bucket, prefix, delimiter, lastLoadMaker, loadFileCount).success(function (res) {
                    var contents = res['ListBucketResult']['Contents'];
                    contents = contents ? angular.isArray(contents) ? contents : [contents] : [];

                    var commonPrefixes = res['ListBucketResult']['CommonPrefixes'];
                    commonPrefixes = commonPrefixes ? angular.isArray(commonPrefixes) ? commonPrefixes : [commonPrefixes] : [];
                    var files = [];
                    angular.forEach($.merge(commonPrefixes, contents), function (file) {
                        if (file.Key !== prefix && file.Prefix !== prefix) {
                            files.push(_self.format(file));
                        }
                    })

                    defer.resolve({
                        files: files,
                        marker: res['ListBucketResult']['NextMarker'],
                        allLoaded: res['ListBucketResult']['IsTruncated'] === 'false'
                    });

                }).error(function (res,status) {
                    defer.reject(res,status);
                });
                return defer.promise;
            },
            format: function (object) {
                var path = object.Key || object.Prefix;
                var isDir = Util.String.lastChar(path) === '/' ? 1 : 0;
                var filename = isDir ? $filter('getPrefixName')(path, 1) : $filter('baseName')(path);
                return {
                    path: path,
                    dir: isDir,
                    filename: filename,
                    lastModified: object.LastModified || '',
                    size: object.Size ? parseInt(object.Size) : 0,
                    etag:object.ETag || ''
                }
            },
            open: function (bucket, path, isDir) {
                if (isDir) {
                    $location.url(OSSLocation.getUrl(bucket.Name, path, 'file'));
                } else {

                }
            },
            getIconSuffix: function (dir, filename) {
                var suffix = '';
                var sorts = fileSorts;
                if (dir == 1) {
                    suffix = 'folder';
                } else {
                    var ext = Util.String.getExt(filename);
                    if (jQuery.inArray(ext, sorts['SORT_SPEC']) > -1) {
                        suffix = ext;
                    } else if (jQuery.inArray(ext, sorts['SORT_MOVIE']) > -1) {
                        suffix = 'video';
                    } else if (jQuery.inArray(ext, sorts['SORT_MUSIC']) > -1) {
                        suffix = 'audio';
                    } else if (jQuery.inArray(ext, sorts['SORT_IMAGE']) > -1) {
                        suffix = 'image';
                    } else if (jQuery.inArray(ext, sorts['SORT_DOCUMENT']) > -1) {
                        suffix = 'document';
                    } else if (jQuery.inArray(ext, sorts['SORT_ZIP']) > -1) {
                        suffix = 'compress';
                    } else if (jQuery.inArray(ext, sorts['SORT_EXE']) > -1) {
                        suffix = 'execute';
                    } else {
                        suffix = 'other';
                    }
                }
                return suffix;
            },
            getIcon: function (dir, name) {
                return 'icon-' + this.getIconSuffix(dir, name);
            }
        };
    }])

/**
 * 浏览路径相关
 */
    .factory('OSSLocation', ['$routeParams', function ($routeParams) {
        var OSSLocation = {
            /**
             * 传染的Bucket是否是当前正在浏览的bucket
             * @param bucketName
             */
            isCurrentBucket: function (bucketName) {
                return bucketName == $routeParams.bucket;
            },
            /**
             * 传入的object是否是当前正在浏览的object
             * @param objectPath
             */
            isCurrentObject: function (bucketName, objectPath) {
                if (objectPath && Util.String.lastChar(objectPath) != '/') {
                    objectPath += '/';
                }
                return OSSLocation.isCurrentBucket(bucketName) && objectPath == ($routeParams.object || '');
            },
            getUrl: function (bucketName, prefix, filter,searchParam) {

                filter = angular.isUndefined(filter) ? 'file' : filter;
                prefix = angular.isUndefined(prefix) ? '' : prefix;

                var url = '';

                url += '/' + filter;

                url += '/' + bucketName;

                if (prefix) {
                    url += '/' + encodeURIComponent(prefix);
                }
                if(searchParam){
                    url += '?' + $.param(searchParam);
                }
                return url;
            }
        };
        return OSSLocation;
    }])

/**
 * 面包屑相关
 */
    .factory('Bread', ['OSSLocation','gettext','gettextCatalog', function (OSSLocation,gettext,gettextCatalog) {
        var getFilterName = function (filter) {
            var filterName = '';
            switch (filter) {
                case 'upload':
                    filterName = gettextCatalog.getString(gettext('碎片管理'));
                    break;

            }
            return filterName;
        };
        return {
            getBreads: function (bucketName, path, filter) {
                var breads = [];

                breads.push({
                    name: bucketName,
                    url: OSSLocation.getUrl(bucketName)
                });

                if (filter !== 'file') {
                    breads.push({
                        name: getFilterName(filter),
                        url: OSSLocation.getUrl(bucketName, '', filter)
                    });
                }

                if (path && path.length) {
                    path = Util.String.rtrim(Util.String.ltrim(path, '/'), '/');
                    var paths = path.split('/');
                    for (var i = 0; i < paths.length; i++) {
                        var bread = {
                            name: paths[i]
                        };
                        var fullpath = '';
                        for (var j = 0; j <= i; j++) {
                            fullpath += paths[j] + '/'
                        }
                        bread.url = OSSLocation.getUrl(bucketName, fullpath);
                        breads.push(bread);
                    }
                }
                return breads;
            }
        };
    }])

/**
 * 请求时生成xml文档
 */
    .factory('RequestXML', function () {
        return {
            getXMLHeader: function () {
                return '<?xml version="1.0" encoding="UTF-8"?>';
            },
            getCreateChannelXml: function (setting) {
                return [
                  this.getXMLHeader(),
                  "<Channel>",
                  "<Status>",
                  setting.Status,
                  "</Status>",
                  "<OrigPicForbidden>",
                  setting.OrigPicForbidden,
                  "</OrigPicForbidden> ",
                  "<UseStyleOnly>" ,
                  setting.UseStyleOnly,
                  "</UseStyleOnly>",
                  "</Channel>"
                ].join('');
            },
            getCreateBucketXML: function (bucketType) {
                //去掉”-internal“
                // region = region.replace('-internal', '');
                return [
                    this.getXMLHeader(),
                    "<CreateBucketConfiguration >",
                    // "<LocationConstraint >",
                    // region,
                    // "</LocationConstraint >",
                        "<StorageClass>",
                            bucketType,
                         "</StorageClass>",
                    "</CreateBucketConfiguration >"
                ].join('');
            },
            getSetBucketReferXML: function (refer) {
              var referers = refer.content.split(";")
              var _referContent = ""
              for(var i=0;i<referers.length;i++){
                _referContent +="<Referer>" + referers[i] + "</Referer>"
              }
              return [
                this.getXMLHeader(),
                "<RefererConfiguration>",
                "<AllowEmptyReferer>",
                refer.allowEmpty,
                "</AllowEmptyReferer>",
                "<RefererList>",
                _referContent,
                "</RefererList>",
                "</RefererConfiguration>"
              ].join('')
            }
        };
    })

/**
 * bucket相关
 */
    .factory('Bucket', ['OSSApi', '$q','OSSException','$rootScope','OSSRegion','localStorageService','OSSConfig','gettext','gettextCatalog', function (OSSApi, $q,OSSException,$rootScope,OSSRegion,localStorageService,OSSConfig,gettext,gettextCatalog) {
        var buckets = null;
        var deferred = $q.defer();
        var listPromise;
        //是否是政务外网环境下
        var isIntranetNet = localStorageService.get(OSSRegion.getRegionPerfix())
        //获取当前的区域
        var currentLocation = OSS.invoke('getCurrentLocation');
        //当前登录的是否政务外网
        var isIntranet = OSSRegion.isIntranet(currentLocation);
        return {
            list: function () {
                if (listPromise) {
                    return listPromise;
                } else {
                    OSSApi.getBuckets().success(function (res) {
                        $rootScope.$broadcast('bucketsLoaded');
                        $rootScope.$broadcast('setCurrentConnectType',3)
                        if(!res['ListAllMyBucketsResult']){
                            $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('数据请求失败，如果你自定义了服务器地址，请检查是否正常。')));
                            return;
                        }
                        var resBuckets = [];
                        if(res['ListAllMyBucketsResult']['Buckets'] && res['ListAllMyBucketsResult']['Buckets']['Bucket']){
                            resBuckets = res['ListAllMyBucketsResult']['Buckets']['Bucket'];
                        }
                        console.log('current buckets:', resBuckets)
                        if(resBuckets){
                            buckets = []
                            var _list = angular.isArray(resBuckets) ? resBuckets : [resBuckets]
                            if(OSSConfig.isCustomClient()){
                               console.log("is IntranetNet:",isIntranetNet,currentLocation);
                                if(!isIntranetNet) {
                                    angular.forEach(_list, function (bucket) {
                                        if (currentLocation.indexOf(bucket.Location) === 0) {
                                            buckets.push(bucket);
                                        }
                                    })
                                }else {
                                    console.log("=========load bucket=========",resBuckets)
                                    var intranetLocations =  []
                                    console.log("=========isIntranet=========",isIntranet)
                                    if(isIntranet && isIntranetNet === '1'){
                                      intranetLocations = OSSRegion.getIntranetLocationItem();
                                    }else{
                                      console.log('---get internet location item---')
                                      intranetLocations = [OSSRegion.getInternetLocationItem()].concat([OSSRegion.getIntranetInner(OSSConfig.hasMoreZwLocations())])
                                    }
                                    console.log("=========intranetLocations=========",intranetLocations, _list)
                                    angular.forEach(_list, function (bucket) {
                                        if(OSSConfig.isHuaTongClient()){
                                          bucket.Location = 'oss-cn-hangzhou-hsa'
                                        }
                                        var _item = _.find(intranetLocations,function(item){
                                            return item.enable === 1 && (item.location === bucket.Location || item.location === bucket.Location + '-internal' || item.location === bucket.Location + '-a-internal');
                                        })
                                        if(_item){
                                            buckets.push(bucket);
                                        }
                                    })
                                }
                            }else{
                                angular.forEach(_list,function(bucket){
                                    if (bucket.Location.toLowerCase().indexOf("tw")>=0){
                                      bucket.Location = 'oss-tw-kaohsiung'
                                    }

                                    if (currentLocation){
                                      if (currentLocation.indexOf(bucket.Location) === 0){
                                        buckets.push(bucket);
                                      }
                                    }else{
                                      var region = OSSRegion.getEnableRegionByLocation(bucket.Location);
                                      if (region) {
                                        buckets.push(bucket);
                                      }
                                    }
                                })
                            }
                        }else{
                            buckets = [];
                        }
                        //接口返回的bucket的location会带上-a，需要替换成不带-a的
                        angular.forEach(buckets,function(bucket){
                            var region  = OSSRegion.getRegionByLocation(bucket.Location);
                            if(region){
                                bucket.Location = region.location.replace('-internal','');
                            }
                        });
                        deferred.resolve(buckets);
                    }).error(function (res,status) {
                        if(+status == -1){
                          $rootScope.$broadcast('setCurrentConnectType',0);
                        }else if(res && res.Error && res.Error.Code == 'InvalidAccessKeyId'){
                          $rootScope.$broadcast('setCurrentConnectType',1);
                        }else if(res && res.Error && res.Error.Code == 'AccessDenied'){
                          $rootScope.$broadcast('setCurrentConnectType',2);
                        }
                        if(!res || !res.Error || res.Error.Code != 'AccessDenied'){
                          $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                          deferred.reject(res,status);
                        }else{
                          deferred.resolve([]);
                        }
                        $rootScope.$broadcast('bucketsLoaded');
                    });
                    return listPromise = deferred.promise;
                }
            },
            loadNew: function () {
                var _deferred = $q.defer();
                var newBuckets = [];
                OSSApi.getBuckets().success(function (res) {
                    var bucketList = null;
                    var resBuckets = null;

                    if(res && res['ListAllMyBucketsResult'] && res['ListAllMyBucketsResult']['Buckets'] && res['ListAllMyBucketsResult']['Buckets']['Bucket']) {
                        resBuckets = res['ListAllMyBucketsResult']['Buckets']['Bucket'];
                    }
                    if(resBuckets){
                        bucketList = []
                        var _list = angular.isArray(resBuckets) ? resBuckets : [resBuckets]
                        if(OSSConfig.isCustomClient()){
                            if(!isIntranetNet) {
                                angular.forEach(_list, function (bucket) {
                                    if( currentLocation.indexOf(bucket.Location) === 0 ){
                                        bucketList.push(bucket);
                                    }
                                })
                            }else{
                                var intranetLocations =  []
                                if(isIntranet && isIntranetNet === '1'){
                                    intranetLocations = OSSRegion.getIntranetLocationItem();
                                }else{
                                    intranetLocations = [OSSRegion.getInternetLocationItem()].concat([OSSRegion.getIntranetInner(OSSConfig.hasMoreZwLocations())])
                                }
                                angular.forEach(_list, function (bucket) {
                                    var _item = _.find(intranetLocations,function(item){
                                        return item.enable === 1 && (item.location === bucket.Location || item.location === bucket.Location + '-internal' || item.location === bucket.Location + '-a-internal');
                                    })
                                    if(_item){
                                        bucketList.push(bucket);
                                    }
                                })
                            }
                        }else{
                            angular.forEach(_list,function(bucket){
                              if (currentLocation){
                                if (currentLocation.indexOf(bucket.Location) === 0){
                                  bucketList.push(bucket);
                                }
                              }else {
                                var region = OSSRegion.getEnableRegionByLocation(bucket.Location);
                                if (region) {
                                  bucketList.push(bucket);
                                }
                              }
                            })
                        }
                    }else{
                        bucketList = [];
                    }
                    angular.forEach(bucketList,function(bucket){
                      var oldItem = _.findWhere(buckets, {Name: bucket.Name});
                      if(!oldItem){
                        newBuckets.push(bucket);
                      }
                    });
                    //接口返回的bucket的location会带上-a，需要替换成不带-a的
                    angular.forEach(newBuckets,function(bucket){
                      var region  = OSSRegion.getRegionByLocation(bucket.Location);
                      if(region){
                        bucket.Location = region.location.replace('-internal','');
                      }
                    });
                    if(newBuckets && newBuckets.length > 0) {
                        buckets = buckets.concat(newBuckets);
                    }
                    _deferred.resolve(buckets);
                })
              .error(function (res,status) {
                 _deferred.reject(res,status);
              });
              return _deferred.promise;
            },
            getBucketTypes: function() {
                return {
                    "Standard": gettext("标准存储"),
                    "IA": gettext("低频访问"),
                    "Archive": gettext("归档存储")
                }
            },
            getAcls: function () {
                return {
                    "public-read": gettext("公共读"),
                    "public-read-write": gettext("公共读写"),
                    "private": gettext("私有")
                }
            },
            getBucket: function (buckeName) {
                return _.findWhere(buckets, {Name: buckeName});
            },
            select: function (bucket) {
                bucket.selected = true;
            },
            unselected: function (bucket) {
                bucket.selected = false;
            },
            getCurrentBucket: function () {
                return _.findWhere(buckets, {selected: true});
            },
            appendBucket: function (bucket){
                if(!buckets){
                  buckets = []
                }
                buckets = buckets.concat([bucket]);
            },
            removeBucket: function (bucket){
              if(bucket){
                var _index = _.indexOf(buckets,bucket);
                buckets.splice(_index,1);
              }
            }
        };
    }])
    .factory('SpeedService',['$timeout','OSSConfig',function($timeout,OSSConfig){
        var caclurtimeout = null;
        var speedSetting={
              speed:{
                  cartNumber:null,
                  timeHour:0,
                  timeMinute:0,
                  timeSecond:0
              },
              active:false,
              show:!OSSConfig.isCustomClient()
        }
        var SpeedService = {
          getSpeedSetting:function(){
            return speedSetting;
          },
          setSpeedSetting:function(_speedSetting){
            speedSetting.speed = _speedSetting.speed;
            speedSetting.active = _speedSetting.active || false;
            SpeedService.caclurSpeedNotUserTime();
          },
          caclurSpeedNotUserTime:function(){
            var _notUserdSecond = speedSetting.speed.timeCount - speedSetting.speed.timeUsed;
            var _hours = parseInt(_notUserdSecond / 3600);
            var _minuts = parseInt((_notUserdSecond % 3600) / 60);
            var _seconds =  parseInt((_notUserdSecond % 3600) % 60);
            speedSetting.speed.timeHour = +_hours >= 10 ? _hours : '0' + _hours;
            speedSetting.speed.timeMinute = +_minuts >= 10 ? _minuts : '0' + _minuts;
            speedSetting.speed.timeSecond = +_seconds >= 10 ? _seconds : '0' + _seconds;
          },
          caclurSpeedTime:function(){
            caclurtimeout = $timeout(function(){
              if(speedSetting.active){
                speedSetting.speed.timeUsed += 1;
                SpeedService.caclurSpeedNotUserTime();
                SpeedService.caclurSpeedTime();
              }else{
                if(caclurtimeout){
                  $timeout.cancel(caclurtimeout);
                }
              }
            },1000)
          },
          disabledSpeed:function(){
            speedSetting.active = false;
          },
          abledSpeed:function(){
            speedSetting.active = true;
          }
        }
      return SpeedService;
    }])
/**
 * RAM授权
 */
  .factory('OSSRam',['$http','$q','localStorageService',function($http,$q,localStorageService){
    var OSSAccessKeyId = OSS.invoke('getAccessID');
    var ramCommonParams = {
      Format:'JSON',
      Version:'2015-05-01',
      SignatureMethod:'HMAC-SHA1',
      SignatureVersion:'1.0'
    }
    var getSign = function (method,_params){
      var params = angular.copy(_params)
      var _keyArr = []
      for(var key in params){
        _keyArr.push(key);
      }
      //排序
      _keyArr.sort();
      var _paramStr = ""
      for(var i=0;i<_keyArr.length;i++){
        if (i != 0)
          _paramStr += "&"
        _paramStr += encodeURIComponent(_keyArr[i]) + "="+ encodeURIComponent(params[_keyArr[i]]).replace(/\+/g, "%20").replace(/\*/g, "%2A").replace(/%7E/g, "~")
      }
      console.log("=========_paramStr=======",_paramStr)
      var signString = method + "&"+encodeURIComponent("/")+"&"+encodeURIComponent(_paramStr)
      console.log("=========signString=======",signString)
      var _screct = localStorageService.get("serect") || "AGK7oJ8n22LPHGSfs0Tv0F094ohKjl";
      console.log("=====_screct======",_screct);
      var signStr = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(signString, _screct+"&"));

      return signStr;
    };
    var getRamRequestUrl = function(action,options){
      var _date = new Date();
      var _utcYear = _date.getUTCFullYear();
      var _utcMonth = _date.getUTCMonth() > 8 ? (_date.getUTCMonth() + 1) : '0' + (_date.getUTCMonth() + 1);
      var _utcDate = _date.getUTCDate() > 9 ? _date.getUTCDate() : '0' + _date.getUTCDate();
      var _utcHours = _date.getUTCHours() > 9 ? _date.getUTCHours() : '0' + _date.getUTCHours();
      var _utcMinutes = _date.getUTCMinutes() > 9 ? _date.getUTCMinutes() : '0' + _date.getUTCMinutes();
      var _utcSeconds = _date.getUTCSeconds() > 9 ? _date.getUTCSeconds() : '0' + _date.getUTCSeconds();
      var _utcTime =  _utcYear + '-' + _utcMonth + '-' + _utcDate + "T" + _utcHours + ":" + _utcMinutes + ":" + _utcSeconds +"Z"
      var params = angular.extend(angular.copy(ramCommonParams),{
        SignatureNonce:''+new Date().getTime(),
        Timestamp:_utcTime,
        AccessKeyId:OSSAccessKeyId,
        Action:action
      })
      if (options){
        params = angular.extend(params,options);
      }
      var _clientSign = getSign('GET',params);
      var _signature = OSSClient.getRamSignature('GET',JSON.stringify(params))
      var _sign = $.trim(_signature.substring(1,_signature.length - 1))
      console.log("=====params=====",params,_signature,_sign,_clientSign);
      params.Signature = _sign; //$.trim(_signature.substring(1,_signature.length - 1))
      return 'https://ram.aliyuncs.com/?'+ $.param(params)
    };
    return{
      deactivateService:function(_accountId){
        var defer = $q.defer();
        var params = {
          AccountId:_accountId
        }
        var url= getRamRequestUrl('DeactivateService',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      activateService:function(_accountId){
        var defer = $q.defer();
        var params = {
          AccountId:_accountId
        }
        var url= getRamRequestUrl('ActivateService',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      createUser:function (_userName,_displayName,_phone,_email,_desc){
        var defer = $q.defer();
        var params = {
          UserName:_userName,
          DisplayName:_displayName,
          MobilePhone:_phone,
          Email:_email,
          Comments:_desc
        }
        var url= getRamRequestUrl('CreateUser',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      createRole:function (_roleName,_doc,_desc) {
        var defer = $q.defer();
        var params = {
          RoleName:_roleName,
          AssumeRolePolicyDocument:_doc,
          Description:_desc
        }
        var url= getRamRequestUrl('CreateRole',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      createGroup:function (_groupName,_groupDesc) {
        var defer = $q.defer();
        var params = {
          GroupName:_groupName,
          Comments:_groupDesc
        }
        var url= getRamRequestUrl('CreateGroup',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      createPolicy:function (_policyName,_policyDoc,_desc) {
        var defer = $q.defer();
        var params = {
          PolicyName:_policyName,
          PolicyDocument:_policyDoc,
          Description:_desc
        }
        var url= getRamRequestUrl('CreatePolicy',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      updateUser:function (_user){
        var defer = $q.defer();
        var params = {
          UserName:_user.oldUserName,
          NewUserName:_user.userName,
          NewDisplayName:_user.displayName,
          NewMobilePhone:_user.phone,
          NewEmail:_user.email,
          NewComments:_user.desc
        }
        var url= getRamRequestUrl('UpdateUser',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      deleteUser:function(_userName){
        var defer = $q.defer();
        var params = {
          UserName:_userName
        }
        var url= getRamRequestUrl('DeleteUser',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      createAccessKey:function(_userName){
        var defer = $q.defer();
        var params = {
          UserName:_userName
        }
        var url= getRamRequestUrl('CreateAccessKey',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      updateAccessKey:function(_keyId,_userName,_status){
        var defer = $q.defer();
        var params = {
          UserAccessKeyId:_keyId,
          UserName:_userName,
          Status:_status
        }
        var url= getRamRequestUrl('UpdateAccessKey',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      deleteAccessKey:function(_keyId,_userName){
        var defer = $q.defer();
        var params = {
          UserAccessKeyId:_keyId,
          UserName:_userName
        }
        var url= getRamRequestUrl('DeleteAccessKey',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      listUserAccessKey:function(_userName){
        var defer = $q.defer();
        var params = {
          UserName:_userName
        }
        var url= getRamRequestUrl('ListAccessKeys',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      getUserPolicies:function(_userName){
        var defer = $q.defer();
        var params = {
          UserName:_userName
        }
        var url= getRamRequestUrl('ListPoliciesForUser',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },

      detachPolicyFromUser:function(_policyType,_policyName,_userName){
        var defer = $q.defer();
        var params = {
          PolicyType:_policyType,
          PolicyName:_policyName,
          UserName:_userName
        }
        var url= getRamRequestUrl('DetachPolicyFromUser',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      attachPolicyToUser:function(_policyType,_policyName,_userName){
        var defer = $q.defer();
        var params = {
          PolicyType:_policyType,
          PolicyName:_policyName,
          UserName:_userName
        }
        var url= getRamRequestUrl('AttachPolicyToUser',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      detachPolicyFromRole:function(_policyType,_policyName,_roleName){
        var defer = $q.defer();
        var params = {
          PolicyType:_policyType,
          PolicyName:_policyName,
          RoleName:_roleName
        }
        var url= getRamRequestUrl('DetachPolicyFromRole',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      attachPolicyToRole:function(_policyType,_policyName,_roleName){
        var defer = $q.defer();
        var params = {
          PolicyType:_policyType,
          PolicyName:_policyName,
          RoleName:_roleName
        }
        var url= getRamRequestUrl('AttachPolicyToRole',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      getUserGroups:function(_userName){
        var defer = $q.defer();
        var params = {
          UserName:_userName
        }
        var url= getRamRequestUrl('ListGroupsForUser',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      removeUserToGroups:function(_userName,_groupName){
        var defer = $q.defer();
        var params = {
          UserName:_userName,
          GroupName:_groupName
        }
        var url= getRamRequestUrl('RemoveUserFromGroup',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      addUserToGroups:function(_userName,_groupName){
        var defer = $q.defer();
        var params = {
          UserName:_userName,
          GroupName:_groupName
        }
        var url= getRamRequestUrl('AddUserToGroup',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      deleteGroup:function(_groupName){
        var defer = $q.defer();
        var params = {
          GroupName:_groupName
        }
        var url= getRamRequestUrl('DeleteGroup',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      updateGroup:function(_group){
        var defer = $q.defer();
        var params = {
          GroupName:_group.oldGroupName,
          NewGroupName:_group.GroupName,
          NewComments:_group.Comments
        }
        var url= getRamRequestUrl('UpdateGroup',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      getGroupUsers:function(_groupName){
        var defer = $q.defer();
        var params = {
          GroupName:_groupName
        }
        var url= getRamRequestUrl('ListUsersForGroup',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      getGroupPolicies:function(_groupName){
        var defer = $q.defer();
        var params = {
          GroupName:_groupName
        }
        var url= getRamRequestUrl('ListPoliciesForGroup',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      detachPolicyFromGroup:function(_policyType,_policyName,_groupName){
        var defer = $q.defer()
        var params = {
          PolicyType:_policyType,
          PolicyName:_policyName,
          GroupName:_groupName
        }
        var url= getRamRequestUrl('DetachPolicyFromGroup',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      attachPolicyToGroup:function(_policyType,_policyName,_groupName){
        var defer = $q.defer();
        var params = {
          PolicyType:_policyType,
          PolicyName:_policyName,
          GroupName:_groupName
        }
        var url= getRamRequestUrl('AttachPolicyToGroup',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      getRolePolicies:function(_roleName){
        var defer = $q.defer();
        var params = {
          RoleName:_roleName
        }
        var url= getRamRequestUrl('ListPoliciesForRole',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      getGroups:function (_max,_marker){
        var defer = $q.defer();
        var params = {
          MaxItems:""+_max
        }
        if(_marker){
          params.Marker = _marker;
        }
        var url= getRamRequestUrl('ListGroups',params);
        $http.get(url).then(function(res){
            defer.resolve(res.data)
        },function(res){
            defer.reject(res)
        })
        return defer.promise;
      },
      getUser:function(_userName){
        var defer = $q.defer();
        var params = {
          UserName:_userName
        }
        var url= getRamRequestUrl('GetUser',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      getUsers:function (_max,_marker) {
        var defer = $q.defer();
        var params = {
          MaxItems:""+_max
        }
        if(_marker){
          params.Marker = _marker;
        }
        var url= getRamRequestUrl('ListUsers',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      getRole:function(_roleName){
        var defer = $q.defer();
        var params = {
          RoleName:_roleName
        }
        var url= getRamRequestUrl('GetRole',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      deleteRole:function(_roleName){
        var defer = $q.defer();
        var params = {
          RoleName:_roleName
        }
        var url= getRamRequestUrl('DeleteRole',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      updateRole:function(_roleName,_roleDoc){
        var defer = $q.defer();
        var params = {
          RoleName:_roleName,
          NewAssumeRolePolicyDocument:_roleDoc
        }
        var url= getRamRequestUrl('UpdateRole',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      getRoles:function(){
        var defer = $q.defer();
        var url= getRamRequestUrl('ListRoles');
        $http.get(url).then(function(res){
          defer.resolve(res.data);
        },function(res){
          defer.reject(res);
        })
        return defer.promise;
      },
      getPolicies:function (_max,_marker,_type) {
        var defer = $q.defer();
        var params = {
          MaxItems:""+_max
        }
        if(_marker){
          params.Marker = _marker;
        }
        if(_type && (_type === 'Custom' || _type === 'System')){
          params.PolicyType = _type;
        }
        var url= getRamRequestUrl('ListPolicies',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      deletePolicy:function(_policyName){
        var defer = $q.defer();
        var params = {
          PolicyName:_policyName
        }
        var url= getRamRequestUrl('DeletePolicy',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      getPolicieVersions:function (_type,_name) {
        var defer = $q.defer();
        var params = {
          PolicyType:_type,
          PolicyName:_name
        }
        var url= getRamRequestUrl('ListPolicyVersions',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      createPolicyVersion:function (_policyName,_policyDoc,_isDefault){
        var defer = $q.defer();
        var params = {
          PolicyName:_policyName,
          PolicyDocument:_policyDoc,
          SetAsDefault:""+_isDefault
        }
        var url= getRamRequestUrl('CreatePolicyVersion',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      deletePolicyVersion:function(_policyName,_versionId){
        var defer = $q.defer();
        var params = {
          PolicyName:_policyName,
          VersionId:_versionId
        }
        var url= getRamRequestUrl('DeletePolicyVersion',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      },
      setPolicyDefault:function(_policyName,_versionId){
        var defer = $q.defer();
        var params = {
          PolicyName:_policyName,
          VersionId:_versionId
        }
        var url= getRamRequestUrl('SetDefaultPolicyVersion',params);
        $http.get(url).then(function(res){
          defer.resolve(res.data)
        },function(res){
          defer.reject(res)
        })
        return defer.promise;
      }
    }
  }])
/**
 * api相关
 */
    .factory('OSSApi', ['$http', 'RequestXML', 'OSSConfig', 'OSSRegion','localStorageService','$q',function ($http, RequestXML, OSSConfig,OSSRegion,localStorageService,$q) {
        var ajaxBaseUri = "http://pay.jiagouyun.com"
        var OSSAccessKeyId = OSS.invoke('getAccessID');
        //是否是政务外网环境下
        var isIntranetNet = localStorageService.get(OSSRegion.getRegionPerfix())
        //获取当前的区域
        var currentLocation = OSS.invoke('getCurrentLocation');
        //判断当前登录的是内网
        var isIntranet = OSSRegion.isIntranet(currentLocation);
        //获取默认的HOST
        var host = OSSConfig.getHost();
        //获取用户自定义的HOST
        var customHost = OSS.invoke('getCurrentHost');

        var getExpires = function (expires) {
            expires = angular.isUndefined(expires) ? 10*60 : expires;   //默认10分钟
            return parseInt(new Date().getTime() / 1000) + expires;
        };
        var getRequestUrl = function (bucket, region, expires, signature, canonicalizedResource, extraParam,isImgServer) {

            region = OSSRegion.changeLocation(region);
            //默认发送请求地址
            var requestUrl = 'http://' + (bucket ? bucket + "." : "") + (region ? region + '.' : '') + host;
            //判断是否是图片服务器
            isImgServer = !!isImgServer;
            if(isImgServer){
              requestUrl = requestUrl.replace(region,region.replace("oss",'img'))
            }
            console.log("--------get request url customHost--------",customHost)
            //如果设置了自定义服务器，则以自定义服务器的host进行请求
            if(customHost){
                var _imgServer = null
                var _customHost = customHost
                //当前是自定义版本
                if(OSSConfig.isCustomClient()){
                  console.log("--------get request url isIntranetNet isIntranet--------",isIntranetNet,isIntranet)
                    //当前是在政务外网环境下
                    if(isIntranetNet) {
                        var intranetLocations =  []
                        //登录的是政务外网下的域名
                        if(isIntranet && +isIntranetNet == 1){
                            intranetLocations = OSSRegion.getIntranetLocationItem();
                        }
                        //登录的不是政务外网下的域名
                        else{
                            intranetLocations = [OSSRegion.getInternetLocationItem()].concat([OSSRegion.getIntranetInner(true)])
                        }
                        console.log("==========get current location=========",intranetLocations,region);
                        var _item = _.find(intranetLocations, function (item) {
                            return item.enable === 1 && item.location.indexOf(region) >= 0;
                        })
                        requestUrl = 'http://' + (bucket ? bucket + "." : "") + _item.customhost;
                        _imgServer = _item.imghost
                        _customHost = _item.customhost
                    }
                    //当前是在互联网环境
                    else{
                        var internetLocation = OSSRegion.getInternetLocationItem();
                        _imgServer = internetLocation.imghost
                        requestUrl = 'http://' + (bucket ? bucket + "." : "") + internetLocation.customhost;
                        _customHost = internetLocation.customhost
                    }
                }else {
                  requestUrl = 'http://' + (bucket ? bucket + "." : "") + _customHost;
                }

                if(isImgServer){
                  if(!_imgServer) {
                    var _host = _customHost.substring(0, _customHost.indexOf(".")) + "-picture" + _customHost.substring(_customHost.indexOf("."))
                    requestUrl = requestUrl.replace(_customHost, _host)
                  }else{
                    requestUrl = 'http://' + (bucket ? bucket + "." : "") + _imgServer
                  }
                }
            }
            canonicalizedResource = canonicalizedResource.replace(new RegExp('^\/' + bucket), '');
            requestUrl += canonicalizedResource;
            requestUrl += (requestUrl.indexOf('?') >= 0 ? '&' : '?') + $.param({
                OSSAccessKeyId: OSSAccessKeyId,
                Expires: expires,
                Signature: signature
            });

            requestUrl += (extraParam ? '&' + $.param(extraParam) : '');
            return requestUrl;
        };

        var getCanonicalizedResource = function (bucketName, objectName, subResources) {
            var subResourcesStr = subResources ? Util.param(subResources) : '';
            console.log('----request url----', subResourcesStr)
            return '/' + (bucketName ? bucketName + '/' : '') + (objectName ? objectName : '') + (subResourcesStr ? '?' + subResourcesStr : '');
        };

        return {
            getURI: function (bucket, objectName, _expires) {
                if (!_expires) {
                    var _location = OSSRegion.changeLocation(bucket.Location);
                    var _url = 'http://' + bucket.Name + '.' + _location + '.' + host + '/' + encodeURI(objectName);
                    //如果设置了自定义服务器，则以自定义服务器的host进行请求
                    if(OSSConfig.isCustomClient() && customHost){
                        _url = 'http://' + bucket.Name + '.' + customHost + '/' + encodeURI(objectName);
                        //当前是在政务外网环境下
                        if(isIntranetNet){
                            var intranetLocations =  []
                            //登录的是政务外网下的域名
                            if(isIntranet && +isIntranetNet == 1){
                                intranetLocations = OSSRegion.getIntranetLocationItem();
                            }
                            //登录的不是政务外网下的域名
                            else{
                                intranetLocations = [OSSRegion.getInternetLocationItem()].concat([OSSRegion.getIntranetInner(true)])
                            }
                            var _item = _.find(intranetLocations,function(item){
                                return item.enable === 1 && item.location.indexOf(_location)>=0;
                            })
                            _url = 'http://' + bucket.Name + '.' + _item.customhost + '/' + encodeURI(objectName);
                        }
                    }
                    return _url;
                } else {
                    var expires = getExpires(+_expires);
                    var canonicalizedResource = getCanonicalizedResource(bucket.Name, objectName);
                    var signature = OSS.invoke('getSignature', {
                        verb: 'GET',
                        expires: expires,
                        canonicalized_resource: canonicalizedResource
                    });
                    return getRequestUrl(bucket.Name, bucket.Location, expires, signature, getCanonicalizedResource(bucket.Name, encodeURIComponent(objectName)));
                }
            },
            getBuckets: function () {
                var expires = getExpires();
                var canonicalizedResource = getCanonicalizedResource();
                var signature = OSS.invoke('getSignature', {
                    verb: 'GET',
                    expires: expires,
                    canonicalized_resource: canonicalizedResource
                });
                var requestUrl = getRequestUrl('', (currentLocation ? currentLocation : 'oss'), expires, signature, canonicalizedResource);
                return $http.get(requestUrl);
            },
            getBucketRefer: function (bucket) {
              var expires = getExpires();
              var canonicalizedResource = getCanonicalizedResource(bucket.Name, '',{referer: undefined});
              var signature = OSS.invoke('getSignature', {
                verb: 'GET',
                expires: expires,
                canonicalized_resource: canonicalizedResource
              });
              var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
              return $http.get(requestUrl);
            },
            setBucketRefer: function (bucket,refer) {
              var expires = getExpires();
              var canonicalizedResource = getCanonicalizedResource(bucket.Name, '',{referer: undefined});
              var contentType = 'application/xml';
              var signature = OSS.invoke('getSignature', {
                verb: 'PUT',
                content_type: contentType,
                expires: expires,
                canonicalized_resource: canonicalizedResource
              });
              var headers = angular.extend({}, {}, {
                'Accept': contentType,
                'Content-Type': contentType
              });
              var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
              return $http.put(requestUrl,RequestXML.getSetBucketReferXML(refer),{
                headers: headers
              });
            },
            saveBucketChannel:function (bucketName,bucketRegion,_status,_origPicForbidden,_useStyleOnly){
              var expires = getExpires();
              var canonicalizedResource = getCanonicalizedResource(bucketName, null, {img:undefined});
              var contentType = 'application/xml';
              var signature = OSS.invoke('getSignature', {
                verb: 'PUT',
                content_type: contentType,
                expires: expires,
                canonicalized_resource: canonicalizedResource
              });
              var setting = {
                Status : _status ? 'enable' : 'disable',
                OrigPicForbidden : _origPicForbidden,
                UseStyleOnly : _useStyleOnly
              }
              var headers = angular.extend({}, {}, {
                'Accept': contentType,
                'Content-Type': contentType
              });
              var requestUrl = getRequestUrl(bucketName, bucketRegion, expires, signature, canonicalizedResource,null,true);
              console.log('put channal url: ', requestUrl)
              return $http.put(requestUrl,RequestXML.getCreateChannelXml(setting),{
                headers: headers
              });
            },
            getBucketChannel: function (bucket) {
                var expires = getExpires();
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, null, {img:undefined});
                var signature = OSS.invoke('getSignature', {
                  verb: 'GET',
                  expires: expires,
                  canonicalized_resource: canonicalizedResource
                });
                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource,null,true);
                console.log('get bucket channel: ', requestUrl)
                return $http.get(requestUrl);
            },
            createBucket: function (bucketName, region, acl, bucketType) {
                var expires = getExpires();
                var canonicalizedOSSheaders = {
                    'x-oss-acl': acl
                };
                var canonicalizedResource = getCanonicalizedResource(bucketName);
                var contentType = 'application/xml';

                var signature = OSS.invoke('getSignature', {
                    verb: 'PUT',
                    content_type: contentType,
                    expires: expires,
                    canonicalized_oss_headers: canonicalizedOSSheaders,
                    canonicalized_resource: canonicalizedResource
                });

                var requestUrl = getRequestUrl(bucketName, region, expires, signature, canonicalizedResource);
                var headers = angular.extend({}, canonicalizedOSSheaders, {
                    'Content-Type': contentType
                });
                return $http.put(requestUrl,RequestXML.getCreateBucketXML(bucketType), {
                    headers: headers
                });
            },
            getBucketAcl: function (bucket) {
                var expires = getExpires();
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, '', {acl: undefined});
                var signature = OSS.invoke('getSignature', {
                    verb: 'GET',
                    expires: expires,
                    canonicalized_resource: canonicalizedResource
                });

                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
                return $http.get(requestUrl);
            },
            editBucket: function (bucket, acl) {
                var expires = getExpires();
                var canonicalizedOSSheaders = {
                    'x-oss-acl': acl
                };
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, '');
                var contentType = 'application/xml';
                var signature = OSS.invoke('getSignature', {
                    verb: 'PUT',
                    content_type: contentType,
                    expires: expires,
                    canonicalized_oss_headers: canonicalizedOSSheaders,
                    canonicalized_resource: canonicalizedResource
                });

                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
                var headers = angular.extend({}, canonicalizedOSSheaders, {
                    'Content-Type': contentType
                });
                return $http.put(requestUrl, "", {
                    headers: headers
                });
            },
            delBucket: function (bucket) {
                var expires = getExpires();
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, '');
                var signature = OSS.invoke('getSignature', {
                    verb: 'DELETE',
                    expires: expires,
                    canonicalized_resource: canonicalizedResource
                });

                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
                return $http.delete(requestUrl);
            },
            getObjects: function (bucket, prefix, delimiter, marker, maxKeys) {
                var param = {
                    'prefix': prefix
                };
                $.extend(param, {
                    'delimiter': delimiter,
                    'marker': marker,
                    'max-keys': maxKeys
                });
                var expires = getExpires();
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, '');
                var signature = OSS.invoke('getSignature', {
                    verb: 'GET',
                    expires: expires,
                    canonicalized_resource: canonicalizedResource
                });

                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource, param);
                return $http.get(requestUrl);
            },
            getObjectMeta: function (bucket, object) {
                var expires = getExpires();
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, object);
                var signature = OSS.invoke('getSignature', {
                    verb: 'HEAD',
                    expires: expires,
                    canonicalized_resource: canonicalizedResource
                });

                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, getCanonicalizedResource(bucket.Name, encodeURIComponent(object)));
                return $http.head(requestUrl);
            },
            restoreFile: function (bucket, objectPath) {
              var expires = getExpires();
              var canonicalizedResource = getCanonicalizedResource(bucket.Name, objectPath,{restore: undefined});
              var contentType = 'application/xml';
              var signature = OSS.invoke('getSignature', {
                verb: 'POST',
                content_type: contentType,
                expires: expires,
                canonicalized_resource: canonicalizedResource
              });
              var headers = angular.extend({}, {}, {
                'Accept': contentType,
                'Content-Type': contentType
              });
              var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
              return $http.post(requestUrl,null,{
                headers: headers
              });
            },
            putObject: function (bucket, objectPath, headers, canonicalizedOSSheaders) {
                var expires = getExpires();
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, objectPath);
                var signature = OSS.invoke('getSignature', {
                    verb: 'PUT',
                    content_type: headers['Content-Type'],
                    expires: expires,
                    canonicalized_oss_headers: canonicalizedOSSheaders,
                    canonicalized_resource: canonicalizedResource
                });

                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, getCanonicalizedResource(bucket.Name, encodeURIComponent(objectPath)));
                return $http.put(requestUrl, '', {
                    headers: angular.extend({}, headers, canonicalizedOSSheaders)
                });
            },
            listUploads: function (bucket, prefix, delimiter, keyMarker, maxUploads, uploadIdMaker) {
                var param = {
                    'prefix': prefix
                };
                $.extend(param, {
                    'delimiter': delimiter,
                    'key-marker': keyMarker,
                    'upload-id-marker': uploadIdMaker,
                    'max-uploads': maxUploads
                });
                var expires = getExpires();
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, '', {uploads: undefined});
                var signature = OSS.invoke('getSignature', {
                    verb: 'GET',
                    expires: expires,
                    canonicalized_resource: canonicalizedResource
                });
                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource, param);
                return $http.get(requestUrl);
            },
            deleteUpload: function (bucket, upload) {
                var expires = getExpires();
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, upload.path, {'uploadId': upload.id});
                var signature = OSS.invoke('getSignature', {
                    verb: 'DELETE',
                    expires: expires,
                    canonicalized_resource: canonicalizedResource
                });
                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, getCanonicalizedResource(bucket.Name, encodeURIComponent(upload.path), {'uploadId': upload.id}));
                return $http.delete(requestUrl);
            },
            listUploadPart: function (bucket, upload, partNumberMaker, maxParts) {
                var param = {
                    'part-number-marker': partNumberMaker,
                    'max-parts': maxParts
                };
                var expires = getExpires();
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, upload.path, {uploadId: upload.id});
                var signature = OSS.invoke('getSignature', {
                    verb: 'GET',
                    expires: expires,
                    canonicalized_resource: canonicalizedResource
                });
                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, getCanonicalizedResource(bucket.Name, encodeURIComponent(upload.path), {uploadId: upload.id}), param);
                return $http.get(requestUrl);
            },
            getSpeedCart: function(cartNumber,baseUri){
              baseUri = baseUri || ajaxBaseUri
              var requestUrl = baseUri + '/cardnumber/detail/get';
              requestUrl += (requestUrl.indexOf('?') >= 0 ? '&' : '?') + $.param({
                'cartNumber':cartNumber
              });
              return $http.get(requestUrl);
            },
            startCartSpeed: function (cartNumber,baseUri) {
              baseUri = baseUri || ajaxBaseUri
              var requestUrl = baseUri + '/flowwallet/upload/init';
              var param = {
                'cartNumber':cartNumber
              }
              var defer = $q.defer()
              $http.post(requestUrl,param).success(function(res){
                defer.resolve(res)
              }).error(function(res){
                defer.resolve(res)
              })
              return defer.promise;
            }
        };
    }])

/**
 * 碎片相关
 */
    .factory('OSSUploadPart', ['OSSApi', '$filter', '$q', function (OSSApi, $filter, $q) {
        return {
            list: function (bucket, prefix, delimiter, lastKeyMaker, loadFileCount, lastUploadMaker) {
                var _self = this;
                var defer = $q.defer();
                OSSApi.listUploads(bucket, prefix, delimiter, lastKeyMaker, loadFileCount, lastUploadMaker).success(function (res) {
                    var result = res['ListMultipartUploadsResult'];
                    var contents = result['Upload'];
                    contents = contents ? angular.isArray(contents) ? contents : [contents] : [];

                    var commonPrefixes = result['CommonPrefixes'];
                    commonPrefixes = commonPrefixes ? angular.isArray(commonPrefixes) ? commonPrefixes : [commonPrefixes] : [];

                    var files = [];
                    angular.forEach($.merge(contents, commonPrefixes), function (file) {
                        if (file.Key !== prefix && file.Prefix !== prefix) {
                            files.push(_self.format(file));
                        }
                    })
                    defer.resolve({
                        uploads: files,
                        keyMaker: result['NextKeyMarker'],
                        uploadIdMaker: result['NextUploadIdMarker'],
                        allLoaded: result['IsTruncated'] === 'false'
                    });

                }).error(function (res,status) {
                    defer.reject(res,status);
                });
                return defer.promise;
            },
            format: function (upload) {
                var path = upload.Key || upload.Prefix;
                var isDir = Util.String.lastChar(path) === '/' ? 1 : 0;
                var filename = isDir ? $filter('getPrefixName')(path, 1) : $filter('baseName')(path);
                return {
                    path: path,
                    dir: isDir,
                    filename: filename,
                    id: upload.UploadId,
                    initTime: upload.Initiated
                }
            }

        }
    }])

/**
 * 所有对话框
 */
    .factory('OSSModal', ['$modal', 'OSSAlert','OSSDialog','OSSConfig', 'Bucket', 'OSSApi','OSSRam', 'OSSObject', 'OSSException', 'OSSRegion', '$rootScope', 'usSpinnerService','SpeedService','gettext','gettextCatalog','localStorageService','OSSI18N','OSSVersionLogs', '$timeout',function ($modal, OSSAlert,OSSDialog,OSSConfig, Bucket, OSSApi,OSSRam, OSSObject, OSSException, OSSRegion, $rootScope, usSpinnerService,SpeedService,gettext,gettextCatalog,localStorageService,OSSI18N,OSSVersionLogs,$timeout) {
        var defaultOption = {
            backdrop: 'static'
        };
        var OSSModal = {
            setting:function(){
                var option = {
                    templateUrl: 'views/setting_modal.html',
                    windowClass: 'setting_modal',
                    controller: function ($scope, $modalInstance) {

                        $scope.min = 1;

                        //线程数最大限制
                        $scope.max = 10;

                        //任务数最大限制
                        $scope.maxTaskLimit = 99;

                        $scope.isCustomClient = OSSConfig.isCustomClient();

                        $scope.setting = OSS.invoke('getTransInfo');
                        $scope.showLanSetting = OSSConfig.showLanSetting();
                        $scope.lanLists = angular.copy(OSSI18N.getLanLists())
                        $scope.lanLists.selected = OSSI18N.getCurrLan();
                        $scope.showRam = OSSConfig.showRam();
                        $scope.setContentDispositionDefault = {
                          default: OSSClient.getDefaultContentDisposition ? OSS.invoke('getDefaultContentDisposition').default : false
                        };
                        var checkSetting = function(setting){
                            var unValidMsg = '';
                            angular.forEach(setting,function(val,key){
                                    if(!/^[1-9]{1}[0-9]*$/.test(val)){
                                        unValidMsg = gettextCatalog.getString(gettext('设置的值必须是正整数'));
                                        if(_.indexOf(['upload_peer_max','download_peer_max'],key) >= 0){
                                            unValidMsg = gettextCatalog.getString(gettext('单任务线程数必须是大于{{min}}小于等于{{max}}的整数'),{min:$scope.min,max:$scope.max});
                                        }else{
                                            unValidMsg = gettextCatalog.getString(gettext('同时任务数必须是大于{{min}}小于等于{{max}}的整数'),{min:$scope.min,max:$scope.maxTaskLimit});
                                        }
                                        return false;
                                    }
                                    //if(val <= $scope.min){
                                    //    unValidMsg = '设置的值必须大于0';
                                    //    return false;
                                    //}
                                    //if(_.indexOf(['upload_peer_max','download_peer_max'],key) >= 0 && val > $scope.max){
                                    //    unValidMsg = '最大线程数不能超过' + $scope.max;
                                    //    return false;
                                    //}
                                    //if(_.indexOf(['upload_task_max','download_task_max'],key) >= 0 && val > $scope.maxTaskLimit){
                                    //    unValidMsg = '最大任务数不能超过' + $scope.maxTaskLimit;
                                    //    return false;
                                    //}
                            });

                            if(unValidMsg){
                                $rootScope.$broadcast('showError',unValidMsg);
                                return false;
                            }
                            return true;
                        };

                        $scope.saveSetting = function(setting){
                            if(!OSSConfig.isCustomClient()) {
                              gettextCatalog.setCurrentLanguage($scope.lanLists.selected.lan);
                              OSSI18N.setCurrLan($scope.lanLists.selected.key);

                              if(OSSConfig.showNews()){
                                $rootScope.$emit('loadAllNews');
                                OSSVersionLogs.getVersionLogs().then(function(res){
                                  $rootScope.versionLogs = res;
                                })
                              }

                            }
                            OSS.invoke("setDefaultContentDisposition",{"default":parseInt($scope.setContentDispositionDefault.default)});
                            if(!checkSetting(setting)){
                                return;
                            }
                            angular.forEach(setting,function(val,key){
                                setting[key] = parseInt(val)
                            })
                            OSS.invoke('setTransInfo',setting);

                            $modalInstance.dismiss('cancel');
                        };

                        $scope.cancel = function(){
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.exportAuth = function(){
                            OSSDialog.exportAuthorization();
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            /**
             * 添加要访问的bucket
             * @param bucket
             */
            addVisitBucket: function (bucket) {
              var _context = this;
              var option = {
                templateUrl: 'views/add_visit_bucket_modal.html',
                windowClass: 'add_bucket_modal',
                controller: function ($scope, $modalInstance) {
                  $scope.loading = false;
                  $scope.isCustomClient = OSSConfig.isCustomClient();
                  $scope.cBucket = {};
                  var currentLocation = OSS.invoke('getCurrentLocation');
                  $scope.regions = OSSRegion.list();
                  //console.log("------currentLocation  regions========",currentLocation,$scope.regions);
                  if (!currentLocation) {
                    $scope.cBucket.region = $scope.regions[0];
                  } else {
                    $scope.cBucket.region = OSSRegion.getRegionByLocation(currentLocation);
                  }
                  $scope.$watch('loading', function (newVal) {
                    if (newVal) {
                      usSpinnerService.spin('add-bucket-spinner');
                    } else {
                      usSpinnerService.stop('add-bucket-spinner');
                    }
                  });

                  //取消
                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };

                  $scope.createBucket = function (bucketName, region) {
                    if (!bucketName || !bucketName.length) {
                      $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('Bucket的名称不能为空')));
                      return;
                    }
                    if(!/^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$/.test(bucketName)){
                      $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('Bucket的名称格式错误')));
                      return;
                    }
                    if(Bucket.getBucket(bucketName)){
                      var _options = {
                        bucketName:bucketName,
                        Code: "BucketAlreadyExists",
                        Custom:true
                      }
                      $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('已存在相同名称的Bucket')),null,null,_options);
                      return;
                    }
                    $modalInstance.close({
                      act: 'add',
                      bucket: {
                        Name: bucketName,
                        Location: region.location,
                        Custom:true
                      }
                    });
                  };
                }
              };
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            /**
             * 新建或编辑bucket
             * @param bucket 如果传了bucket就是编辑
             * @returns {*}
             */
            addBucket: function (bucket) {
                var _context = this;
                var option = {
                    templateUrl: 'views/add_bucket_modal.html',
                    windowClass: 'add_bucket_modal',
                    controller: function ($scope, $modalInstance) {

                        //是否在进行ajax请求
                        $scope.loading = false;

                        //是否在加载bucket信息
                        $scope.getingBucketInfo = false;

                        $scope.bucket = bucket || null;

                        $scope.cBucket = {};
  
                        $scope.isCustomClient = OSSConfig.isCustomClient();

                        //bucket的权限
                        var acls = [], regions = [], types = [];

                        angular.forEach(Bucket.getAcls(), function (val, key) {
                            acls.push({
                                name: val,
                                value: key
                            })
                        });
                        $scope.acls = acls;
                        angular.forEach(Bucket.getBucketTypes(), function (val, key) {
                          types.push({
                            name: val,
                            value: key
                          })
                        });
                        $scope.bucketTypes = types;
                        if (!bucket) {
                            $scope.acls.selected = $scope.acls[0];
                            $scope.bucketTypes.selected = $scope.bucketTypes[0];
                        }else{

                           var buecktType = Util.Array.getObjectByKeyValue($scope.bucketTypes, 'value', bucket.StorageClass);
                          console.log("bucket new::",bucket,buecktType,$scope.bucketTypes)
                           bucket.StorageName = buecktType.name;
                        }

                        $scope.$watch('loading', function (newVal) {
                            if (newVal) {
                                usSpinnerService.spin('add-bucket-spinner');
                            } else {
                                usSpinnerService.stop('add-bucket-spinner');
                            }
                        });

                        $scope.$watch('getingBucketInfo', function (newVal) {
                            if (newVal) {
                                usSpinnerService.spin('get-bucket-spinner');
                            } else {
                                usSpinnerService.stop('get-bucket-spinner');
                            }
                        });
                        var currentLocation = OSS.invoke('getCurrentLocation');
                        //创建bucket时是否不允许选择区域
                        $scope.isDisableLocationSelect = OSSConfig.isDisableLocationSelect() || currentLocation;

                        if (!$scope.isDisableLocationSelect) {
                            //bucket区域
                            $scope.regions = OSSRegion.list();
                        }

                        if (!bucket) {
                            if (!$scope.isDisableLocationSelect) {
                                $scope.cBucket.region = $scope.regions[0];
                            } else {
                                if (!currentLocation) {
                                    return;
                                }
                                $scope.cBucket.region = OSSRegion.getRegionByLocation(currentLocation);
                            }
                        } else {
                            $scope.cBucket.region = OSSRegion.getRegionByLocation(bucket.Location);
                        }

                        //获取ACl信息
                        if ($scope.bucket) {
                            $scope.loading = true;
                            $scope.getingBucketInfo = true;
                            OSSApi.getBucketAcl(bucket).success(function (res) {
                                $scope.loading = false;
                                $scope.getingBucketInfo = false;
                                $scope.acls.selected = Util.Array.getObjectByKeyValue($scope.acls, 'value', res["AccessControlPolicy"]["AccessControlList"]["Grant"]);
                            }).error(function (res,status) {
                                $scope.loading = false;
                                $scope.getingBucketInfo = false;
                                $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                            });
                        } else {
                            $scope.loading = true;
                        }

                        //取消
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        //创建bucket
                        $scope.loading = false;
                        $scope.createBucket = function (bucketName, region, acl,bucketType) {
                            if (!bucketName || !bucketName.length) {
                                $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('Bucket的名称不能为空')));
                                return;
                            }
                            if(!/^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$/.test(bucketName)){
                                $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('Bucket的名称格式错误')));
                                return;
                            }
                            if(Bucket.getBucket(bucketName)){
                                var _options = {
                                  bucketName:bucketName,
                                  Code: "BucketAlreadyExists"
                                }
                                $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('已存在相同名称的Bucket')),null,null,_options);
                                return;
                            }
                            $scope.loading = true;
                            OSSApi.createBucket(bucketName, region.location, acl.value,bucketType.value).success(function (res) {
                                $scope.loading = false;
                                $modalInstance.close({
                                    act: 'add',
                                    bucket: {
                                        Name: bucketName,
                                        Location: region.location,
                                        StorageClass: bucketType.value,
                                        Acl: acl.value
                                    }
                                });
                            }).error(function (response, statusCode) {
                                $scope.loading = false;
                                var _options = undefined;
                                if (response && response.Error && response.Error.Code === 'BucketAlreadyExists') {
                                  _options = {
                                    bucketName: bucketName,
                                    Code: "BucketAlreadyExists"
                                  }
                                }
                                $rootScope.$broadcast('showError', OSSException.getError(response, statusCode).msg,null,null,_options);
                            });
                        };

                        //修改bucket
                        $scope.editBucket = function (acl) {
                            $scope.loading = true;
                            OSSApi.editBucket(bucket, acl.value).success(function () {
                                $scope.loading = false;
                                angular.extend(bucket, {
                                    Acl: acl.value
                                })
                                $modalInstance.close({
                                    act: 'edit',
                                    bucket: bucket
                                });
                            }).error(function (response, statusCode) {
                                $scope.loading = false;
                                $rootScope.$broadcast('showError', OSSException.getError(response, statusCode).msg);
                            });
                        };

                        //删除bucket
                        $scope.delBucket = function () {
                            _context.delBucketConfirm(bucket).result.then(function (param) {
                                OSS.invoke('deleteBucket', {
                                    keyid: param.accessKey,
                                    keysecret: param.accessSecret,
                                    bucket: bucket.Name,
                                    location: bucket.Location
                                }, function (res) {
                                    if (!res.error) {
                                        $rootScope.$broadcast('removeBucket', bucket);
                                        $rootScope.$broadcast('reloadUploadQueue');
                                        $rootScope.$broadcast('reloadDownloadQueue');
                                        $modalInstance.close();
                                    } else {
                                        alert(OSSException.getClientErrorMsg(res));
                                    }
                                })
                            });
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            /**
             * 设置object的http header头
             * @param bucket
             * @param object
             * @returns {*}
             */
            setObjectHttpHeader: function (bucket, objects) {
                var option = {
                    templateUrl: 'views/set_http_header_modal.html',
                    windowClass: 'set_http_header_modal',
                    controller: function ($scope, $modalInstance) {
                        $scope.objects = objects;

                        $scope.headers = [];
                        angular.forEach('Content-Type Content-Disposition Content-Language Cache-Control Expires'.split(' '), function (val) {
                            $scope.headers.push({
                                name: val,
                                text: val
                            })
                        });

                        $scope.customHeaders = [
                            {
                                nameModel: '',
                                contentModel: ''
                            }
                        ];

                        $scope.$watch('saving', function (newVal) {
                            if (newVal) {
                                usSpinnerService.spin('set-http-spinner');
                            } else {
                                usSpinnerService.stop('set-http-spinner');
                            }
                        });

                        $scope.$watch('loading', function (newVal) {
                            if (newVal) {
                                usSpinnerService.spin('loading-spinner');
                            } else {
                                usSpinnerService.stop('loading-spinner');
                            }
                        });

                        if(objects && objects.length == 1){
                          var object = objects[0];
                          $scope.loading = true;
                          OSSApi.getObjectMeta(bucket, object.path).success(function (data, status, getHeader) {
                            $scope.loading = false;
                            angular.forEach($scope.headers, function (header) {
                              header.model = getHeader(header.name);
                              if(header.name == 'Content-Disposition' && header.model){
                                header.model = decodeURIComponent(header.model)
                              }
                            })
                            angular.forEach(getHeader(), function (val, key) {
                              if (key.indexOf('x-oss-meta-') === 0) {
                                $scope.customHeaders.push({
                                  nameModel: key.replace(/^x-oss-meta-/, ''),
                                  contentModel: val
                                })
                              }
                            });
                          }).error(function (res,status) {
                            $scope.loading = false;
                            $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                          });
                        }

                        $scope.setHttpHeader = function (headers, customHeaders) {
                            var ossHeaders = {}, canonicalizedOSSheaders = {};
                            var unValidFieldValue = false,contentTypeRequired = false;
                            var fieldValueReg = /^[a-zA-Z0-9\-_/.="]+$/;

                            var checkFieldValueIsValid = function(value){
                              //不检查
                              //return true;
                              return /^[a-zA-Z0-9\-_/.;,:="]+$/.test(value);
                            };

                            angular.forEach(headers, function (val) {
                                if(val.name == 'Content-Type' && !val.model){
                                    contentTypeRequired = true;
                                    return false;
                                }
                                if (val.model) {
                                    if(val.name == 'Content-Disposition'){
                                      var valid = /^[\u4e00-\u9fa5a-zA-Z0-9\-_/.;,:=*'"]+$/.test(val.model);
                                      if(!valid){
                                        unValidFieldValue = true;
                                        return false;
                                      }else{
                                        var _modelVal = val.model.match(/filename\*=utf-8''\S+/g);
                                        if(_modelVal && _modelVal.length > 0){
                                          var _str = _modelVal[0].substring("filename*=utf-8''".length);
                                          if(_str.indexOf("\"") != 0){
                                            _str = "\"" + _str
                                          }
                                          if(_str.lastIndexOf("\"") != _str.length - 1){
                                            _str = _str + "\""
                                          }
                                          _modelVal = _str.substring(1,_str.length - 1);
                                        }
                                        val.model = val.model.replace(/filename\*=utf-8''\S+/g,"filename*=utf-8''"+encodeURIComponent(_modelVal)+"")
                                      }
                                    }else if(!checkFieldValueIsValid(val.model)){
                                        unValidFieldValue = true;
                                        return false;
                                    }
                                    ossHeaders[val.name] = val.model;
                                }
                            });

                            var unValidField = false;
                            angular.forEach(customHeaders, function (val) {
                                if (val.nameModel) {
                                    if(!/^[a-zA-Z0-9\-]+$/.test(val.nameModel)){
                                        unValidField = true;
                                        return false;
                                    }
                                    if(val.contentModel){
                                        if(!checkFieldValueIsValid(val.contentModel)){
                                            unValidFieldValue = true;
                                            return false;
                                        }
                                        canonicalizedOSSheaders['x-oss-meta-' + val.nameModel.toLowerCase()] = val.contentModel || '';
                                    }
                                }
                            });
                            if(contentTypeRequired){
                              var msg  = gettextCatalog.getString(gettext('HTTP属性值格式错误'));
                              msg += '<p class="text-muted">'+gettextCatalog.getString(gettext('Content-Type是必填字段'))+'</p>'
                              $rootScope.$broadcast('showError',msg);
                              return;
                            }
                            if(unValidFieldValue){
                                var msg  = gettextCatalog.getString(gettext('HTTP属性值格式错误'));
                                msg += '<p class="text-muted">'+gettextCatalog.getString(gettext('属性名称只能包含英文、数子、横线、下划线、斜杠、点、英文分号、英文逗号、英文冒号、英文双引号和等号'))+'</p>'
                                $rootScope.$broadcast('showError',msg);
                                return;
                            }

                            if(unValidField){
                                var msg  = gettextCatalog.getString(gettext('属性名称格式错误'));
                                msg += '<p class="text-muted">'+gettextCatalog.getString(gettext('属性名称只能包含英文、数子或横线'))+'</p>'
                                $rootScope.$broadcast('showError',msg);
                                return;
                            }


                            $scope.saving = true;

                            //var headers = $.extend({},ossHeaders,canonicalizedOSSheaders);
                            //OSS.invoke('setMetaObject',{
                            //    bucket:bucket.Name,
                            //    object:object.path,
                            //    location:bucket.Location,
                            //    canonicalized_oss_headers:headers
                            //},function(res){
                            //    $scope.saving = false;
                            //    if(!res.error){
                            //        $modalInstance.close();
                            //    }else{
                            //        $rootScope.$broadcast('showError',OSSException.getClientErrorMsg(res));
                            //    }
                            //});


                            var errorSetObjects = [],_submitCount = 0;
                            angular.forEach(objects,function(object,index){
                                angular.extend(canonicalizedOSSheaders,{
                                  'x-oss-copy-source': '/' + bucket.Name + '/' + encodeURIComponent(object.path)
                                });
                                OSSApi.putObject(bucket, object.path, ossHeaders, canonicalizedOSSheaders).success(function (res) {
                                    _submitCount += 1;
                                    if(_submitCount == objects.length) {
                                      $scope.saving = false;
                                      $modalInstance.close();
                                    }
                                }).error(function(res,status) {
                                  _submitCount += 1;
                                  var _filename = object.filename;
                                  errorSetObjects.push({'filename':_filename,'errmsg':OSSException.getError(res, status).msg});
                                  if (_submitCount == objects.length){
                                    $scope.saving = false;
                                    var _errorMsg = '';
                                    angular.forEach(errorSetObjects,function(item){
                                      _errorMsg += gettextCatalog.getString(gettext("文件{{fileName}}设置http头的错误信息:"),{fileName:item.filename})+item.errmsg + "<br/>"
                                    })
                                    $rootScope.$broadcast('showError', _errorMsg);
                                  }
                                });
                            })
                        };

                        $scope.addCustomHeader = function () {
                            $scope.customHeaders.push({
                                nameModel: '',
                                contentModel: ''
                            })
                        };

                        $scope.removeCustomHeader = function (header) {
                            var index = _.indexOf($scope.customHeaders, header);
                            index > -1 && $scope.customHeaders.splice(index, 1);
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            setSpeed: function (){
              var option = {
                templateUrl: 'views/set_speed_modal.html',
                windowClass: 'set_speed_modal',
                controller: function ($scope, $modalInstance,$timeout) {
                  var _loadCartSpeedTimeout = null;
                  $scope.speedSetting = SpeedService.getSpeedSetting();
                  var startCartSpeed = function (cartNumber) {
                    OSSApi.startCartSpeed(cartNumber).then(function(res){
                      if(res.err_code == '400'){
                        $rootScope.$broadcast('showError',res.err_msg);
                        return false;
                      }
                      if (!SpeedService.getSpeedSetting().active) {
                        SpeedService.abledSpeed();
                        SpeedService.caclurSpeedTime();
                      }
                      _loadCartSpeedTimeout = $timeout(function(){
                        startCartSpeed();
                      },30000)
                    })
                  }

                  $scope.stopOpenSpeed = function () {
                    $timeout.cancel(_loadCartSpeedTimeout);
                    SpeedService.disabledSpeed();
                  }

                  $scope.startOpenSpeed = function () {
                    $scope.doing = true
                    OSSApi.getSpeedCart($scope.speedSetting.speed.cartNumber).success(function(res){
                      $scope.doing = false
                      var _speed = {
                        "cartNumber": res.cart_number,
                        "orderId": res.order_id,
                        "timeCount": res.time_count,
                        "timeUsed": res.time_used
                      }
                      SpeedService.setSpeedSetting({speed:_speed})
                      startCartSpeed($scope.speedSetting.speed.cartNumber);
                    }).error(function(res,status){
                      $scope.doing = false;
                      var _message = "";
                      if(typeof(res)  === 'string'){
                        _message = res
                      }else{
                        _message = res.err_msg
                      }
                      $rootScope.$broadcast('showError',_message);
                    })
                  }

                  $scope.goBuy = function(){
                    OSS.invoke('openUrl',{"url":"http://pay.jiagouyun.com"})
                  }

                  $scope.goSearchBill = function(){
                    //OSS.invoke('openUrl',{"url":"http://www.baidu.com"})
                  }

                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            callbackSetting: function (bucket){
              var option = {
                templateUrl: 'views/callback-setting.html',
                windowClass: 'callback-setting-modal',
                controller: function ($scope, $modalInstance,$timeout) {
                  //重连最小次数
                  $scope.min = 1;
                  //重连最大次数
                  $scope.max = 5;

                  var _setting = OSS.invoke('getCallFunctionInfo', {
                    bucket:bucket.Name
                  });
                  $scope.callbackSetting = {
                    times:_setting.num || 3,
                    url:_setting.url || '',
                    rule:_setting.regular || '',
                    status:_setting.status || 0
                  }
                  $scope.setCallback = function(){
                    var _params = {
                      bucket:bucket.Name,
                      regular:$scope.callbackSetting.rule,
                      url:$scope.callbackSetting.url,
                      status:parseInt($scope.callbackSetting.status),
                      num:parseInt($scope.callbackSetting.times)
                    }
                    OSS.invoke('setCallFunctionInfo',_params);
                    $modalInstance.dismiss('cancel');
                  }
                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            setRefer: function (bucket){
              var option = {
                templateUrl: 'views/set_refer_modal.html',
                windowClass: 'set_refer_modal',
                controller: function ($scope, $modalInstance) {
                  $scope.loading = true;
                  $scope.refer = {
                    content:'',
                    allowEmpty:true
                  }

                  OSSApi.getBucketRefer(bucket).success(function (res) {
                    $scope.loading = false;
                    var _referContent = ""
                    if(res.RefererConfiguration && res.RefererConfiguration.RefererList && res.RefererConfiguration.RefererList.Referer) {
                      if(angular.isArray(res.RefererConfiguration.RefererList.Referer)) {
                        for (var i = 0; i < res.RefererConfiguration.RefererList.Referer.length; i++) {
                          _referContent += res.RefererConfiguration.RefererList.Referer[i] + ";"
                        }
                      }else{
                        _referContent += res.RefererConfiguration.RefererList.Referer + ";"
                      }
                    }
                    $scope.refer.content = _referContent.replace(/;/g,"\r")
                    $scope.refer.allowEmpty = Boolean(res.RefererConfiguration.AllowEmptyReferer == 'true');

                  }).error(function(res,status){
                    $scope.loading = false;
                    $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                  });

                  $scope.disabledSave = function () {
                    if (!$scope.refer.allowEmpty && (!$scope.refer.content || $scope.refer.content.length == 0)) {
                      return true
                    }else if($scope.saving){
                      return true
                    }
                    return false
                  }

                  $scope.setReferer = function () {
                    $scope.saving = true;
                    var _refer = $scope.refer.content.replace(/\r|\n/ig,";");
                    var params = {
                      content:_refer,
                      allowEmpty:$scope.refer.allowEmpty
                    }
                    OSSApi.setBucketRefer(bucket,params).success(function (res) {
                      $scope.saving = false
                      $modalInstance.dismiss('cancel');
                    }).error(function(res,status){
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  }
                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            setImageServer: function (bucket){
              var option = {
                templateUrl: 'views/set_image_server_modal.html',
                windowClass: 'set_imageserver_modal',
                controller: function ($scope, $modalInstance) {
                  $scope.loading = true;
                  $scope.channel = {
                      name: bucket.Name,
                      Status: false,
                      OrigPicForbidden: false,
                      UseStyleOnly: false
                  }
                  OSSApi.getBucketChannel(bucket).success(function(res){
                      var channel = res.Channel;
                      $scope.channel.name = channel.Name;
                      $scope.channel.Status = channel.Status.toLowerCase().indexOf('enable') === 0 ? true : false;
                      $scope.channel.OrigPicForbidden = channel.OrigPicForbidden.toLowerCase() === 'true' ? true : false;
                      $scope.channel.UseStyleOnly = channel.UseStyleOnly.toLowerCase() === 'true' ? true : false;
                      $scope.loading = false;
                  }).error(function(res,status){
                      if (status && status == 404){
                         $scope.loading = false;
                      }else{
                         $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      }
                  });
                  $scope.saveChannel = function () {
                      $scope.saving = true;
                      OSSApi.saveBucketChannel(bucket.Name,bucket.Location,$scope.channel.Status,$scope.channel.OrigPicForbidden,$scope.channel.UseStyleOnly).success(function(res){
                          $scope.saving = false;
                          $modalInstance.dismiss('cancel');
                      }).error(function(res,status){
                          $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      })
                  }
                  $scope.cancel = function () {
                      $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            setRamServiceModal: function (){
              var option = {
                templateUrl: 'views/ram-service-modal.html',
                windowClass: 'ram-service-modal',
                controller: function ($scope, $modalInstance) {
                  $scope.aliyun = {
                    uuid:'',
                    pattern:/^[0-9]{16}$/
                  }
                  $scope.activeRam = function(){
                    OSSRam.activateService($scope.aliyun.uuid).then(function(res){
                      $modalInstance.dismiss('cancel');
                      OSSRam.setRam();
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  }
                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            ramUserManage:function (user,_tab){
              _tab = _tab || 'info'
              var option = {
                templateUrl: 'views/ram-user-manage.html',
                windowClass: 'ram-user-manage-modal',
                controller: function ($scope, $modalInstance) {
                  $scope.info = {
                    pattern:{
                      name:/^[a-zA-Z0-9\u4e00-\u9fa5\.@\-_]{1,64}$/,
                      display:/^[a-zA-Z0-9\.@\-\u4e00-\u9fa5]{0,12}$/,
                      phone:/^([0-9]+\-){0,1}[0-9]{11}$/,
                      email:/^[a-zA-Z0-9]+\@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/,
                      desc:/^[\S\s]{0,128}$/
                    },
                    edit:false,
                    active:_tab == 'info',
                    data:null,
                    editData:null,
                    loading:true
                  };
                  $scope.accessKey = {
                    active:_tab == 'accessKey',
                    list:null,
                    loading:true
                  };
                  $scope.group = {
                    active:_tab == 'group',
                    hasGroup:{
                      list:null,
                      loading:true,
                      active:false
                    },
                    listGroup:{
                      list:[],
                      loading:false,
                      active:false,
                      hasMore:false,
                      marker:null,
                      max:20
                    }
                  };

                  $scope.policies = {
                    active:_tab == 'policy',
                    hasPolicies:{
                      active:true,
                      loading:true,
                      list:null
                    },
                    listPolicies:{
                      active:false,
                      loading:true,
                      list:[],
                      marker:null,
                      max:20,
                      hasMore:false,
                      type:'Custom'
                    }
                  }

                  var getUserPolicies = function(){
                    OSSRam.getUserPolicies(user.UserName).then(function(res){
                      console.log("user policy:",res)
                      $scope.policies.hasPolicies.list = res.Policies.Policy;
                      $scope.policies.hasPolicies.loading = false;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  }

                  var getAllPolicies = function(_max,_marker,_type){
                    _max = _max || 50;
                    OSSRam.getPolicies(_max,_marker,_type).then(function(res){
                      if(res.IsTruncated){
                        $scope.policies.listPolicies.marker = res.Marker;
                        $scope.policies.listPolicies.hasMore = true;
                      }else{
                        $scope.policies.listPolicies.marker = null;
                        $scope.policies.listPolicies.hasMore = false;
                      }

                      var _allPolicies = res.Policies.Policy;
                      if($scope.policies.hasPolicies.list){
                        for(var i=0;i<_allPolicies.length;i++){
                          for(var j=0;j<$scope.policies.hasPolicies.list.length;j++){
                            if(_allPolicies[i].PolicyName == $scope.policies.hasPolicies.list[j].PolicyName){
                              _allPolicies[i].exist = true;
                              break;
                            }
                          }
                        }
                      }
                      $scope.policies.listPolicies.list =  $scope.policies.listPolicies.list.concat(_allPolicies);
                      $scope.policies.listPolicies.loading = false;
                    });
                  }

                  var getUserInfo = function(){
                    OSSRam.getUser(user.UserName).then(function(res){
                      $scope.info.data = {
                        UserId:user.UserId,
                        oldUserName:user.UserName,
                        userName:res.User.UserName,
                        displayName:res.User.DisplayName,
                        phone:res.User.MobilePhone,
                        id:res.User.UserId,
                        email:res.User.Email,
                        desc:res.User.Comments,
                        createDate:res.User.CreateDate,
                        lastLoginDate:res.User.LastLoginDate,
                        updateDate:res.User.UpdateDate
                      }
                      $scope.info.editData = angular.copy($scope.info.data);
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  }
                  var getAccessKeyList = function(){
                    OSSRam.listUserAccessKey(user.UserName).then(function(res){
                      $scope.accessKey.list = res.AccessKeys.AccessKey;
                      $scope.accessKey.loading = false;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  };
                  //查询用户已存在的组
                  var getUserGroups = function(){
                    OSSRam.getUserGroups(user.UserName).then(function(res){
                      console.log("get user group:",res);
                      $scope.group.hasGroup.list = res.Groups.Group;
                      $scope.group.hasGroup.loading = false;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  };
                  //查询用户所有的组
                  var getAllUserGroups = function(_max,_marker){
                    _max = _max || 50;
                    OSSRam.getGroups(_max,_marker).then(function(res){
                      if(res.IsTruncated){
                        $scope.group.listGroup.marker = res.Marker;
                        $scope.group.listGroup.hasMore = true;
                      }else{
                        $scope.group.listGroup.marker = null;
                        $scope.group.listGroup.hasMore = false;
                      }
                      var _allGroup = res.Groups.Group;
                      if($scope.group.hasGroup.list){
                        for(var i=0;i<_allGroup.length;i++){
                          for(var j=0;j<$scope.group.hasGroup.list.length;j++){
                            if(_allGroup[i].GroupName == $scope.group.hasGroup.list[j].GroupName){
                              _allGroup[i].exist = true;
                              break;
                            }
                          }
                        }
                      }
                      $scope.group.listGroup.list = $scope.group.listGroup.list.concat(_allGroup);
                      $scope.group.listGroup.loading = false;
                      console.log("list groups:",$scope.group.listGroup.list)
                    });
                  };

                  getUserInfo();
                  $scope.changeEditModel = function (){
                    $scope.info.edit = !$scope.info.edit;
                    if (!$scope.info.edit) {
                      $scope.info.editData = angular.copy($scope.info.data);
                    }
                  }
                  $scope.updateUser = function(){
                    OSSRam.updateUser($scope.info.editData).then(function(res){
                      $scope.info.data = angular.copy($scope.info.editData);
                      user = angular.extend(user,res.User);
                      $scope.info.edit = false;
                      alert(gettextCatalog.getString(gettext("用户信息修改成功！")));
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  };
                  $scope.deleteUser = function(){
                    OSSAlert.confirm(gettextCatalog.getString(gettext('确定要删除当前用户吗？'))).result.then(function() {
                      OSSRam.deleteUser(user.UserName).then(function(res){
                        alert(gettextCatalog.getString(gettext("用户删除成功！")));
                        $rootScope.$broadcast('UpdateRamListData','user')
                        $modalInstance.dismiss('cancel');
                      },function(res){
                        res = {
                          Error:res.data
                        }
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      })
                    });
                  };
                  $scope.showAkSecret = function(ak){
                    if(ak.Status == 'Inactive'){
                      return false;
                    }
                    if(!ak.AccessKeySecret){
                      if(OSSClient['gAccountAction']){
                        var param = {
                          subkeyid:ak.AccessKeyId
                        }
                        var _ak = OSSClient.gAccountAction('getram',JSON.stringify(param));
                        if(_ak){
                          _ak = JSON.parse(_ak);
                          ak.AccessKeySecret = _ak.subsecret
                        }
                      }
                    }
                    ak.showSecret = true;
                  }
                  $scope.createKey = function(){
                    OSSRam.createAccessKey(user.UserName).then(function(res){
                      alert(gettextCatalog.getString(gettext("创建AccessKey成功！")));
                      var param = {
                        subkeyid:res.AccessKey.AccessKeyId,
                        subsecret:res.AccessKey.AccessKeySecret
                      }
                      if(OSSClient['gAccountAction']){
                        OSSClient.gAccountAction('addram',JSON.stringify(param))
                      }
                      $scope.accessKey.list.push(res.AccessKey);
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  };
                  $scope.updateAccessKey = function(_ak){
                    var _status = _ak.Status == 'Active' ? 'Inactive' : 'Active';
                    var _update = function(){
                      OSSRam.updateAccessKey(_ak.AccessKeyId,user.UserName,_status).then(function(res){
                        var _message = _status == 'Active' ? gettextCatalog.getString(gettext("启用AccessKey成功！")) : gettextCatalog.getString(gettext("禁用AccessKey成功！"))
                        alert(_message);
                        _ak.Status = _status;
                      },function(res){
                        res = {
                          Error:res.data
                        }
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      });
                    }
                    if(_status == 'Inactive'){
                      OSSAlert.confirm(gettextCatalog.getString(gettext('确定要禁用当前AccessKey吗？'))).result.then(function() {
                        _update();
                      });
                    }else{
                      _update();
                    }
                  }
                  $scope.delAccessKey = function(_ak){
                    OSSAlert.confirm(gettextCatalog.getString(gettext('确定要删除当前用户的AccessKey吗？'))).result.then(function() {
                      OSSRam.deleteAccessKey(_ak.AccessKeyId,user.UserName).then(function(res){
                        alert(gettextCatalog.getString(gettext("删除AccessKey成功！")));
                        if(OSSClient['gAccountAction']){
                          OSSClient.gAccountAction('delram',JSON.stringify({subkeyid:_ak.AccessKeyId}));
                        }
                        getAccessKeyList();
                      },function(res){
                        res = {
                          Error:res.data
                        }
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      });
                    })
                  };
                  $scope.removePolicy = function(_policy,_index){
                    OSSRam.detachPolicyFromUser(_policy.PolicyType,_policy.PolicyName,user.UserName).then(function(res){
                      $scope.policies.hasPolicies.list.splice(_index,1);
                      alert(gettextCatalog.getString(gettext("移除授权成功！")));
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  }
                  $scope.setPolicy = function(_policy){
                    OSSRam.attachPolicyToUser(_policy.PolicyType,_policy.PolicyName,user.UserName).then(function(res){
                      _policy.exist = true;
                      alert(gettextCatalog.getString(gettext("授权成功！")));
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  }

                  $scope.selectTabs = function(_type){
                    if(_type == 'info'){
                      $scope.accessKey.active = false;
                      $scope.group.active = false;
                      $scope.policies.active = false;
                      $scope.info.active = true;
                      $scope.info.loading = true;
                      getUserInfo();
                    }else if(_type == 'accessKey'){
                      $scope.accessKey.active = true;
                      $scope.info.active = false;
                      $scope.group.active = false;
                      $scope.policies.active = false;
                      $scope.accessKey.loading = true;
                      $scope.accessKey.list = null;
                      getAccessKeyList();
                    }else if(_type == 'group'){
                      $scope.accessKey.active = false;
                      $scope.info.active = false;
                      $scope.policies.active = false;
                      $scope.group.hasGroup.active = true;
                      $scope.group.hasGroup.loading = true;
                      $scope.group.hasGroup.list = null;
                      $scope.group.listGroup.active = false;
                      $scope.group.listGroup.loading = false;
                      $scope.group.listGroup.list = [];
                      getUserGroups();
                    }else if(_type == 'policy'){
                      $scope.accessKey.active = false;
                      $scope.info.active = false;
                      $scope.group.active = false;
                      $scope.policies.active = true;
                      $scope.policies.hasPolicies.active = true;
                      $scope.policies.hasPolicies.loading = true;
                      $scope.policies.hasPolicies.list = null;
                      $scope.policies.listPolicies.active = false;
                      $scope.policies.listPolicies.loading = false;
                      $scope.policies.listPolicies.list = [];
                      getUserPolicies();
                    }
                  };
                  $scope.loadMoreGroups = function () {
                    $scope.group.listGroup.loading = true;
                    $scope.group.listGroup.list = [];
                    getAllUserGroups($scope.group.listGroup.max,$scope.group.listGroup.marker);
                  }
                  $scope.loadMorePolicies = function () {
                    $scope.policies.listPolicies.loading = true;
                    getAllPolicies($scope.policies.listPolicies.max,$scope.policies.listPolicies.marker,$scope.policies.listPolicies.type);
                  }
                  $scope.changePolicyType = function (_type){
                    $scope.policies.listPolicies.type = _type;
                    $scope.policies.listPolicies.marker = null;
                    $scope.policies.listPolicies.list = [];
                    $scope.policies.listPolicies.loading = true;
                    getAllPolicies($scope.policies.listPolicies.max,$scope.policies.listPolicies.marker,$scope.policies.listPolicies.type);
                  }

                  $scope.removeUserToGroups = function(_group,_index){
                    OSSAlert.confirm(gettextCatalog.getString(gettext('确定要移除该用户组吗？'))).result.then(function() {
                      OSSRam.removeUserToGroups(user.UserName, _group.GroupName).then(function (res) {
                        $scope.group.hasGroup.list.splice(_index, 1)
                        alert(gettextCatalog.getString(gettext("移除用户组成功！")));
                      }, function (res) {
                        res = {
                          Error: res.data
                        }
                        $rootScope.$broadcast('showError', OSSException.getError(res, status).msg);
                      });
                    });
                  }
                  $scope.addUserToGroup = function(_group){
                    OSSRam.addUserToGroups(user.UserName,_group.GroupName).then(function(res){
                      alert(gettextCatalog.getString(gettext("加入用户组成功！")));
                      _group.exist = true;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  }
                  $scope.policyModalChange = function(){
                    if($scope.policies.listPolicies.active){
                      $scope.policies.listPolicies.active = false;
                      $scope.policies.hasPolicies.active = true;
                      $scope.policies.hasPolicies.loading = true;
                      $scope.policies.hasPolicies.list = null;
                      getUserPolicies();
                    }else {
                      $scope.policies.hasPolicies.active = false;
                      $scope.policies.listPolicies.active = true;
                      $scope.policies.listPolicies.loading = true;
                      $scope.policies.listPolicies.list = [];
                      getAllPolicies($scope.policies.listPolicies.max, $scope.policies.listPolicies.marker, $scope.policies.listPolicies.type);
                    }
                  }
                  $scope.groupModalChange = function(){
                    if($scope.group.listGroup.active){
                      $scope.group.listGroup.active = false;
                      $scope.group.hasGroup.active = true;
                      $scope.group.hasGroup.loading = true;
                      $scope.group.hasGroup.list = null;
                      getUserGroups();
                    }else{
                      $scope.group.hasGroup.active = false;
                      $scope.group.listGroup.active = true;
                      $scope.group.listGroup.loading = true;
                      $scope.group.listGroup.list = [];
                      getAllUserGroups($scope.group.listGroup.max,$scope.group.listGroup.marker);
                    }
                  };
                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            ramGroupManage:function (group,_tab){
              _tab = _tab || 'info';
              var option = {
                templateUrl: 'views/ram-group-manage.html',
                windowClass: 'ram-group-manage-modal',
                controller: function ($scope, $modalInstance) {
                  $scope.info = {
                    pattern:{
                      name:/^[a-zA-Z0-9\u4e00-\u9fa5\.@\-_]{1,64}$/,
                      desc:/^[\S\s]{0,128}$/
                    },
                    edit:false,
                    active:_tab == 'info',
                    data:angular.copy(group),
                    editData:angular.copy(group),
                    loading:true
                  };
                  $scope.user = {
                    active:_tab == 'user',
                    hasUser:{
                      list:null,
                      loading:true,
                      active:false
                    },
                    listUser:{
                      list:[],
                      loading:false,
                      active:false,
                      hasMore:false,
                      marker:null,
                      max:20
                    }
                  };

                  $scope.policies = {
                    active:_tab == 'policy',
                    hasPolicies:{
                      active:true,
                      loading:true,
                      list:null
                    },
                    listPolicies:{
                      active:false,
                      loading:true,
                      list:[],
                      marker:null,
                      max:20,
                      hasMore:false,
                      type:'Custom'
                    }
                  }

                  var getGroupPolicies = function(){
                    OSSRam.getGroupPolicies(group.GroupName).then(function(res){
                      console.log("group policy:",res)
                      $scope.policies.hasPolicies.list = res.Policies.Policy;
                      $scope.policies.hasPolicies.loading = false;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  }

                  var getAllPolicies = function(_max,_marker,_type){
                    _max = _max || 50;
                    OSSRam.getPolicies(_max,_marker,_type).then(function(res){
                      if(res.IsTruncated){
                        $scope.policies.listPolicies.marker = res.Marker;
                        $scope.policies.listPolicies.hasMore = true;
                      }else{
                        $scope.policies.listPolicies.marker = null;
                        $scope.policies.listPolicies.hasMore = false;
                      }

                      var _allPolicies = res.Policies.Policy;
                      if($scope.policies.hasPolicies.list){
                        for(var i=0;i<_allPolicies.length;i++){
                          for(var j=0;j<$scope.policies.hasPolicies.list.length;j++){
                            if(_allPolicies[i].PolicyName == $scope.policies.hasPolicies.list[j].PolicyName){
                              _allPolicies[i].exist = true;
                              break;
                            }
                          }
                        }
                      }
                      $scope.policies.listPolicies.list =  $scope.policies.listPolicies.list.concat(_allPolicies);
                      $scope.policies.listPolicies.loading = false;
                    });
                  }

                  var getGroupUser = function(){
                    OSSRam.getGroupUsers(group.GroupName).then(function(res){
                      $scope.user.hasUser.list = res.Users.User;
                      $scope.user.hasUser.loading = false;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  }
                  var getAllUsers = function(_max,_marker){
                    _max = _max || 50;
                    OSSRam.getUsers(_max,_marker).then(function(res){
                      if(res && !res.err){
                        if(res.IsTruncated){
                          $scope.user.listUser.marker = res.Marker
                          $scope.user.listUser.hasMore = true
                        }else{
                          $scope.user.listUser.marker = null;
                          $scope.user.listUser.hasMore = false;
                        }
                        var _allUsers = res.Users.User;
                        if($scope.user.hasUser.list){
                          for(var i=0;i<_allUsers.length;i++){
                            for(var j=0;j<$scope.user.hasUser.list.length;j++){
                              if(_allUsers[i].UserName == $scope.user.hasUser.list[j].UserName){
                                _allUsers[i].exist = true;
                                break;
                              }
                            }
                          }
                        }
                        $scope.user.listUser.list = $scope.user.listUser.list.concat(res.Users.User);
                      }
                      $scope.user.listUser.loading = false;
                    });
                  }
                  $scope.loadMoreUsers = function () {
                    $scope.user.listUser.loading = true;
                    $scope.user.listUser.list = [];
                    getAllUsers($scope.user.listUser.max,$scope.user.listUser.marker);
                  }
                  $scope.loadMorePolicies = function () {
                    $scope.policies.listPolicies.loading = true;
                    getAllPolicies($scope.policies.listPolicies.max,$scope.policies.listPolicies.marker,$scope.policies.listPolicies.type);
                  }
                  $scope.selectTabs = function(_type){
                    if(_type == 'info'){
                      $scope.user.active = false;
                      $scope.policies.active = false;
                      $scope.info.active = true;
                    }else if(_type == 'user'){
                      $scope.user.active = true;
                      $scope.info.active = false;
                      $scope.policies.active = false;
                      $scope.user.hasUser.loading = true;
                      $scope.user.hasUser.list = null;
                      getGroupUser();
                    }else if(_type == 'policy'){
                      $scope.info.active = false;
                      $scope.user.active = false;
                      $scope.policies.active = true;
                      $scope.policies.hasPolicies.active = true;
                      $scope.policies.hasPolicies.loading = true;
                      $scope.policies.hasPolicies.list = null;
                      $scope.policies.listPolicies.active = false;
                      $scope.policies.listPolicies.loading = false;
                      $scope.policies.listPolicies.list = [];
                      getGroupPolicies();
                    }else if(_type == 'setting'){

                    }
                  };
                  $scope.changePolicyType = function (_type){
                    $scope.policies.listPolicies.type = _type;
                    $scope.policies.listPolicies.marker = null;
                    $scope.policies.listPolicies.list = [];
                    $scope.policies.listPolicies.loading = true;
                    getAllPolicies($scope.policies.listPolicies.max,$scope.policies.listPolicies.marker,$scope.policies.listPolicies.type);
                  }
                  $scope.policyModalChange = function(){
                    if($scope.policies.listPolicies.active){
                      $scope.policies.listPolicies.active = false;
                      $scope.policies.hasPolicies.active = true;
                      $scope.policies.hasPolicies.loading = true;
                      $scope.policies.hasPolicies.list = null;
                      getGroupPolicies();
                    }else {
                      $scope.policies.hasPolicies.active = false;
                      $scope.policies.listPolicies.active = true;
                      $scope.policies.listPolicies.loading = true;
                      $scope.policies.listPolicies.list = [];
                      getAllPolicies($scope.policies.listPolicies.max, $scope.policies.listPolicies.marker, $scope.policies.listPolicies.type);
                    }
                  }
                  $scope.userModalChange = function(){
                    if($scope.user.listUser.active){
                      $scope.user.listUser.active = false;
                      $scope.user.hasUser.active = true;
                      $scope.user.hasUser.loading = true;
                      $scope.user.hasUser.list = null;
                      getGroupUser();
                    }else{
                      $scope.user.hasUser.active = false;
                      $scope.user.listUser.active = true;
                      $scope.user.listUser.loading = true;
                      $scope.user.listUser.list = [];
                      getAllUsers($scope.user.listUser.max,$scope.user.listUser.marker);
                    }
                  };

                  $scope.removePolicy = function(_policy,_index){
                    OSSRam.detachPolicyFromGroup(_policy.PolicyType,_policy.PolicyName,group.GroupName).then(function(res){
                      $scope.policies.hasPolicies.list.splice(_index,1);
                      alert(gettextCatalog.getString(gettext("移除授权成功！")));
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  }
                  $scope.setPolicy = function(_policy){
                    OSSRam.attachPolicyToGroup(_policy.PolicyType,_policy.PolicyName,group.GroupName).then(function(res){
                      _policy.exist = true;
                      alert(gettextCatalog.getString(gettext("授权成功！")));
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  }

                  $scope.removeUserToGroups = function(_user,_index){
                    OSSAlert.confirm(gettextCatalog.getString(gettext('确定要移除该用户吗？'))).result.then(function() {
                      OSSRam.removeUserToGroups(_user.UserName, group.GroupName).then(function (res) {
                        $scope.user.hasUser.list.splice(_index, 1)
                        alert(gettextCatalog.getString(gettext("移除用户成功！")));
                      }, function (res) {
                        res = {
                          Error: res.data
                        }
                        $rootScope.$broadcast('showError', OSSException.getError(res, status).msg);
                      });
                    });
                  }

                  $scope.addUserToGroup = function(_user){
                    OSSRam.addUserToGroups(_user.UserName,group.GroupName).then(function(res){
                      alert(gettextCatalog.getString(gettext("添加用户成功！")));
                      _user.exist = true;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  }
                  $scope.deleteGroup = function(){
                    OSSAlert.confirm(gettextCatalog.getString(gettext('确定要删除当前用户组吗？'))).result.then(function() {
                      OSSRam.deleteGroup(group.GroupName).then(function(res){
                        alert(gettextCatalog.getString(gettext("用户组删除成功！")));
                        $rootScope.$broadcast('UpdateRamListData','group')
                        $modalInstance.dismiss('cancel');
                      },function(res){
                        res = {
                          Error:res.data
                        }
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      })
                    });
                  };
                  $scope.updateGroup = function(){
                    $scope.info.editData.oldGroupName = $scope.info.data.GroupName;
                    OSSRam.updateGroup($scope.info.editData).then(function(res){
                      $scope.info.data = angular.copy($scope.info.editData);
                      group = angular.extend(group,res.Group);
                      $scope.info.edit = false;
                      alert(gettextCatalog.getString(gettext("组信息修改成功！")));
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  };

                  $scope.changeEditModel = function (){
                    $scope.info.edit = !$scope.info.edit;
                    if (!$scope.info.edit) {
                      $scope.info.editData = angular.copy($scope.info.data);
                    }
                  }

                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            ramRoleManage:function (role,_tab){
              _tab = _tab || 'info'
              var option = {
                templateUrl: 'views/ram-role-manage.html',
                windowClass: 'ram-role-manage-modal',
                controller: function ($scope, $modalInstance) {
                  $scope.info = {
                    pattern:{
                      doc:/^[\S\s]{1,2048}$/
                    },
                    edit:false,
                    active:_tab == 'info',
                    data:angular.copy(role),
                    editData:angular.copy(role),
                    loading:true
                  };
                  $scope.policies = {
                    active:_tab == 'policy',
                    hasPolicies:{
                      active:true,
                      loading:true,
                      list:null
                    },
                    listPolicies:{
                      active:false,
                      loading:true,
                      list:[],
                      marker:null,
                      max:20,
                      hasMore:false,
                      type:'Custom'
                    }
                  }
                  var getRole = function(){
                    OSSRam.getRole(role.RoleName).then(function(res){
                      $scope.info.data = res.Role;
                      $scope.info.editData = angular.copy(res.Role);
                      $scope.info.loading = false;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  }


                  var getRolePolicies = function(){
                    OSSRam.getRolePolicies(role.RoleName).then(function(res){
                      console.log("role policy:",res)
                      $scope.policies.hasPolicies.list = res.Policies.Policy;
                      $scope.policies.hasPolicies.loading = false;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  }

                  var getAllPolicies = function(_max,_marker,_type){
                    _max = _max || 50;
                    OSSRam.getPolicies(_max,_marker,_type).then(function(res){
                      if(res.IsTruncated){
                        $scope.policies.listPolicies.marker = res.Marker;
                        $scope.policies.listPolicies.hasMore = true;
                      }else{
                        $scope.policies.listPolicies.marker = null;
                        $scope.policies.listPolicies.hasMore = false;
                      }

                      var _allPolicies = res.Policies.Policy;
                      if($scope.policies.hasPolicies.list){
                        for(var i=0;i<_allPolicies.length;i++){
                          for(var j=0;j<$scope.policies.hasPolicies.list.length;j++){
                            if(_allPolicies[i].PolicyName == $scope.policies.hasPolicies.list[j].PolicyName){
                              _allPolicies[i].exist = true;
                              break;
                            }
                          }
                        }
                      }
                      $scope.policies.listPolicies.list =  $scope.policies.listPolicies.list.concat(_allPolicies);
                      $scope.policies.listPolicies.loading = false;
                    });
                  }


                  $scope.selectTabs = function(_type){
                    if(_type == 'info'){
                      $scope.policies.active = false;
                      $scope.info.active = true;
                      getRole();
                    }else if(_type == 'policy'){
                      $scope.info.active = false;
                      $scope.policies.active = true;
                      $scope.policies.hasPolicies.active = true;
                      $scope.policies.hasPolicies.loading = true;
                      $scope.policies.hasPolicies.list = null;
                      $scope.policies.listPolicies.active = false;
                      $scope.policies.listPolicies.loading = false;
                      $scope.policies.listPolicies.list = [];
                      getRolePolicies();
                    }else if(_type == 'setting'){

                    }
                  };

                  $scope.changePolicyType = function (_type){
                    $scope.policies.listPolicies.type = _type;
                    $scope.policies.listPolicies.marker = null;
                    $scope.policies.listPolicies.list = [];
                    $scope.policies.listPolicies.loading = true;
                    getAllPolicies($scope.policies.listPolicies.max,$scope.policies.listPolicies.marker,$scope.policies.listPolicies.type);
                  }
                  $scope.policyModalChange = function(){
                    if($scope.policies.listPolicies.active){
                      $scope.policies.listPolicies.active = false;
                      $scope.policies.hasPolicies.active = true;
                      $scope.policies.hasPolicies.loading = true;
                      $scope.policies.hasPolicies.list = null;
                      getRolePolicies();
                    }else {
                      $scope.policies.hasPolicies.active = false;
                      $scope.policies.listPolicies.active = true;
                      $scope.policies.listPolicies.loading = true;
                      $scope.policies.listPolicies.list = [];
                      getAllPolicies($scope.policies.listPolicies.max, $scope.policies.listPolicies.marker, $scope.policies.listPolicies.type);
                    }
                  }


                  $scope.deleteRole = function(){
                    OSSAlert.confirm(gettextCatalog.getString(gettext('您确定要删除该角色吗？'))).result.then(function() {
                      OSSRam.deleteRole(role.RoleName).then(function (res) {
                        alert(gettextCatalog.getString(gettext("角色删除成功！")));
                        $rootScope.$broadcast('UpdateRamListData','role')
                        $modalInstance.dismiss('cancel');
                      },function(res){
                        res = {
                          Error:res.data
                        }
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      })
                    });
                  }
                  $scope.updateRole = function(){
                    OSSRam.updateRole($scope.info.editData.RoleName,$scope.info.editData.AssumeRolePolicyDocument).then(function(res){
                      $scope.info.data = angular.copy($scope.info.editData);
                      role = angular.extend(role,res.Role);
                      $scope.info.edit = false;
                      alert(gettextCatalog.getString(gettext("角色信息修改成功！")));
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  }
                  $scope.removePolicy = function(_policy,_index){
                    OSSRam.detachPolicyFromRole(_policy.PolicyType,_policy.PolicyName,role.RoleName).then(function(res){
                      $scope.policies.hasPolicies.list.splice(_index,1);
                      alert(gettextCatalog.getString(gettext("移除授权成功！")));
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  }
                  $scope.setPolicy = function(_policy){
                    OSSRam.attachPolicyToRole(_policy.PolicyType,_policy.PolicyName,role.RoleName).then(function(res){
                      _policy.exist = true;
                      alert(gettextCatalog.getString(gettext("授权成功！")));
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  }
                  $scope.changeEditModel = function (){
                    $scope.info.edit = !$scope.info.edit;
                    if (!$scope.info.edit) {
                      $scope.info.editData = angular.copy($scope.info.data);
                    }
                  }

                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            ramPolicyManage:function (policy){
              var option = {
                templateUrl: 'views/ram-policy-manage.html',
                windowClass: 'ram-policy-manage-modal',
                controller: function ($scope, $modalInstance) {
                  $scope.policy = policy
                  $scope.newVersion = {
                    active:false,
                    pattern:{
                      doc:/^[\S\s]{1,2048}$/
                    },
                    doc:null,
                    isDefault:false
                  }
                  $scope.versions = {
                    active:true,
                    list:null,
                    loading:true,
                    showList:true,
                    showPolicyDoc:null,
                    showDoc:false
                  }
                  var getPolicyVersion = function(){
                    OSSRam.getPolicieVersions(policy.PolicyType,policy.PolicyName).then(function(res){
                      $scope.versions.list = res.PolicyVersions.PolicyVersion;
                      $scope.versions.loading = false;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    });
                  }
                  $scope.setPolicyDefault = function(_version,_index){
                    OSSAlert.confirm(gettextCatalog.getString(gettext('您确定要将该版本设置为默认版本吗？'))).result.then(function() {
                      OSSRam.setPolicyDefault(policy.PolicyName, _version.VersionId).then(function (res) {
                        angular.forEach($scope.versions.list, function (item) {
                          if (item.IsDefaultVersion) {
                            item.IsDefaultVersion = false;
                            return false;
                          }
                        });
                        $scope.versions.list[_index].IsDefaultVersion = true;
                        alert(gettextCatalog.getString(gettext("设置默认成功！")));
                      })
                    });
                  }
                  $scope.deleteVersion = function(_version,_index){
                    OSSAlert.confirm(gettextCatalog.getString(gettext('您确定要删除该版本吗？'))).result.then(function() {
                      OSSRam.deletePolicyVersion(policy.PolicyName, _version.VersionId).then(function (res) {
                        $scope.versions.list.splice(_index, 1);
                        alert(gettextCatalog.getString(gettext("删除版本成功！")));
                      },function(res){
                        res = {
                          Error:res.data
                        }
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      })
                    });
                  }
                  $scope.saveNewVersion = function(){
                    OSSRam.createPolicyVersion(policy.PolicyName,$scope.newVersion.doc,$scope.newVersion.isDefault).then(function(res){
                      $scope.newVersion.doc = null;
                      $scope.newVersion.isDefault = false;
                      $scope.newVersion.active = false;
                      $scope.versions.active = true;
                      $scope.versions.showList = true;
                      $scope.versions.showDoc=false;
                    },function(res){
                      res = {
                        Error:res.data
                      }
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  }
                  $scope.selectTabs = function(_type){
                    if(_type == 'version'){
                      $scope.versions.list = null;
                      $scope.versions.active = true;
                      $scope.versions.loading = true;
                      getPolicyVersion();
                    }else if(_type == 'user'){

                    }else if(_type == 'setting'){

                    }
                  };
                  $scope.changeVersions = function(_doc){
                    if($scope.versions.showList){
                      $scope.versions.showPolicyDoc = _doc.replace(/\{/g,"\n{\n").replace(/\[/g,"\n[\n").replace(/\}/g,"\n}\n").replace(/\]/g,"\n]\n")
                      $scope.versions.showList = false;
                      $scope.versions.showDoc = true;
                    }else{
                      $scope.versions.showList = true;
                      $scope.versions.showDoc = false;
                    }
                  }
                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            setRam:function (bucket, objects){
              var option = {
                templateUrl: 'views/ram-setting.html',
                windowClass: 'ram-setting-modal',
                controller: function ($scope, $modalInstance) {
                  $scope.user = {
                    tabActive:false,
                    list:[],
                    max:20,
                    marker:null,
                    loading:false,
                    hasMore:false
                  }
                  $scope.group = {
                    tabActive:true,
                    list:[],
                    max:20,
                    marker:null,
                    loading:false,
                    hasMore:false
                  }
                  $scope.role = {
                    tabActive:false,
                    list:null,
                    loading:true
                  }
                  $scope.policy = {
                    tabActive:false,
                    list:[],
                    max:20,
                    marker:null,
                    loading:false,
                    hasMore:false,
                    type:'Custom'
                  }
                  //$scope.sts = {
                  //  tabActive:false,
                  //  list:[]
                  //}
                  var getUsers = function(_max,_marker){
                    _max = _max || 50;
                    OSSRam.getUsers(_max,_marker).then(function(res){
                      if(res && !res.err){
                        if(res.IsTruncated){
                          $scope.user.marker = res.Marker;
                          $scope.user.hasMore = true;
                        }else{
                          $scope.user.marker = null;
                          $scope.user.hasMore = false;
                        }
                        $scope.user.list = $scope.user.list.concat(res.Users.User);
                      }
                      $scope.user.loading = false;
                    }, function (res) {
                      $scope.user.loading = false;
                      res = {
                        Error: res.data
                      }
                      var _resultErr = OSSException.getError(res, status)
                      var _msg = _resultErr.msg
                      if(_resultErr.code == "Inactive"){
                        OSSModal.setRamServiceModal();
                        $timeout(function(){
                          $modalInstance.dismiss('cancel');
                        })
                      }else{
                        $rootScope.$broadcast('showError',_msg);
                      }
                    })
                  }
                  var getGroups = function(_max,_marker){
                    _max = _max || 50;
                    OSSRam.getGroups(_max,_marker).then(function(res){
                      if(res.IsTruncated){
                        $scope.group.marker = res.Marker;
                        $scope.group.hasMore = true;
                      }else{
                        $scope.group.marker = null;
                        $scope.group.hasMore = false;
                      }
                      $scope.group.list = $scope.group.list.concat(res.Groups.Group);
                      $scope.group.loading = false;
                    }, function (res) {
                      $scope.group.loading = false;
                      res = {
                        Error: res.data
                      }
                      var _resultErr = OSSException.getError(res, status)
                      var _msg = _resultErr.msg
                      if(_resultErr.code == "Inactive"){
                        OSSModal.setRamServiceModal();
                        $timeout(function(){
                          $modalInstance.dismiss('cancel');
                        })
                      }else{
                        $rootScope.$broadcast('showError',_msg);
                      }
                    });
                  }
                  var getRoles = function(){
                    OSSRam.getRoles().then(function(res){
                      $scope.role.list = res.Roles.Role;
                      $scope.role.loading = false;
                    }, function (res) {
                      $scope.role.loading = false;
                      res = {
                        Error: res.data
                      }
                      var _resultErr = OSSException.getError(res, status)
                      var _msg = _resultErr.msg
                      if(_resultErr.code == "Inactive"){
                        OSSModal.setRamServiceModal();
                        $timeout(function(){
                          $modalInstance.dismiss('cancel');
                        })
                      }else{
                        $rootScope.$broadcast('showError',_msg);
                      }
                    })
                  }
                  var getPolicies = function(_max,_marker,_type){
                    _max = _max || 50;
                    OSSRam.getPolicies(_max,_marker,_type).then(function(res){
                      if(res.IsTruncated){
                        $scope.policy.marker = res.Marker;
                        $scope.policy.hasMore = true;
                      }else{
                        $scope.policy.marker = null;
                        $scope.policy.hasMore = false;
                      }
                      $scope.policy.list =  $scope.policy.list.concat(res.Policies.Policy);
                      $scope.policy.loading = false;
                    }, function (res) {
                      $scope.policy.loading = false;
                      res = {
                        Error: res.data
                      }
                      var _resultErr = OSSException.getError(res, status)
                      var _msg = _resultErr.msg
                      if(_resultErr.code == "Inactive"){
                        OSSModal.setRamServiceModal();
                        $timeout(function(){
                          $modalInstance.dismiss('cancel');
                        })
                      }else{
                        $rootScope.$broadcast('showError',_msg);
                      }
                    });
                  }

                  $scope.loadMoreUsers = function () {
                    $scope.user.loading = true;
                    getUsers($scope.user.max,$scope.user.marker);
                  }
                  $scope.loadMoreGroups = function () {
                    if($scope.group.hasMore){
                      $scope.group.loading = true;
                      getGroups($scope.group.max,$scope.group.marker);
                    }
                  }
                  $scope.loadMorePolicies = function () {
                    $scope.policy.loading = true;
                    getPolicies($scope.policy.max,$scope.policy.marker,$scope.policy.type);
                  }
                  $scope.changePolicyType = function (_type){
                    $scope.policy.type = _type;
                    $scope.policy.marker = null;
                    $scope.policy.list = [];
                    $scope.policy.loading = true;
                    getPolicies($scope.policy.max,$scope.policy.marker,$scope.policy.type);
                  }
                  $scope.closeRamService = function(_accountId){
                    OSSRam.deactivateService(_accountId).then(function(res){

                    },function(res){
                      res = {
                        Error: res.data
                      }
                      $rootScope.$broadcast('showError', OSSException.getError(res, status).msg);
                    });
                  }
                  $scope.createUser = function(){
                    OSSModal.createRamItemsModal('user');
                  }
                  $scope.createGroup = function(){
                    OSSModal.createRamItemsModal('group');
                  }
                  $scope.createRole = function () {
                    OSSModal.createRamItemsModal('role');
                  }
                  $scope.createPolicy = function(){
                    OSSModal.createRamItemsModal('policy');
                  }
                  $scope.manageRam = function(_obj,_type,_tab){
                    if(_type == 'user'){
                      OSSModal.ramUserManage(_obj,_tab);
                    }else if(_type == 'group'){
                      OSSModal.ramGroupManage(_obj,_tab);
                    }else if(_type =='role'){
                      OSSModal.ramRoleManage(_obj,_tab);
                    }else{
                      OSSModal.ramPolicyManage(_obj,_tab)
                    }
                  }
                  $scope.deletePolicy = function(_policy,_index){
                    OSSAlert.confirm(gettextCatalog.getString(gettext('您确定要删除该授权策略吗？'))).result.then(function() {
                      OSSRam.deletePolicy(_policy.PolicyName).then(function (res) {
                        $scope.policy.marker = null;
                        $scope.policy.list = [];
                        $scope.policy.loading = true;
                        getPolicies($scope.policy.max,$scope.policy.marker,$scope.policy.type);
                        alert(gettextCatalog.getString(gettext("授权策略删除成功！")));
                      }, function (res) {
                        res = {
                          Error: res.data
                        }
                        $rootScope.$broadcast('showError', OSSException.getError(res, status).msg);
                      })
                    });
                  }
                  $scope.selectTabs = function(type){
                    if(type == 'user'){
                      $scope.group.tabActive = false;
                      $scope.policy.tabActive = false;
                      $scope.role.tabActive = false;
                      $scope.policy.type = 'Custom';
                      $scope.user.tabActive = true;
                      $scope.user.list = [];
                      $scope.user.loading = true;
                      getUsers($scope.user.max,$scope.user.marker);
                    }
                    if(type == 'group'){
                      if($scope.group.loading){
                        return false;
                      }
                      $scope.user.tabActive = false;
                      $scope.policy.tabActive = false;
                      $scope.role.tabActive = false;
                      $scope.policy.type = 'Custom';
                      $scope.group.tabActive = true;
                      $scope.group.list = [];
                      $scope.group.loading = true;
                      getGroups($scope.group.max,$scope.group.marker);
                    }
                    if(type == 'role'){
                      $scope.user.tabActive = false;
                      $scope.policy.tabActive = false;
                      $scope.policy.type = 'Custom';
                      $scope.group.tabActive = false;
                      $scope.role.tabActive = true;
                      $scope.role.loading = true;
                      getRoles();
                    }
                    if(type == 'policy'){
                      $scope.user.tabActive = false;
                      $scope.group.tabActive = false;
                      $scope.role.tabActive = false;
                      $scope.policy.tabActive = true;
                      $scope.policy.list = [];
                      $scope.policy.loading = true;
                      getPolicies($scope.policy.max,$scope.policy.marker,$scope.policy.type);
                    }
                  };

                  $scope.deletePolicies = function(){

                  }

                  $rootScope.$on("UpdateRamListData",function(event,type,option){
                    if(type == 'user'){
                      $scope.user.list = [];
                      $scope.user.marker = null;
                      $scope.user.loading = true;
                      $scope.user.hasMore = false;
                      getUsers($scope.user.max,$scope.user.marker);
                    }else if(type == 'group'){
                      $scope.group.list = [];
                      $scope.group.loading = true;
                      $scope.group.marker = null;
                      $scope.group.hasMore = false;
                      getGroups($scope.group.max,$scope.group.marker);
                    }else if(type == 'role'){
                      $scope.role.list = null;
                      $scope.role.loading = true;
                      getRoles();
                    }else if(type == 'policy'){
                      $scope.policy.list = [];
                      $scope.policy.loading = true;
                      $scope.policy.marker = null;
                      $scope.policy.hasMore = false;
                      getPolicies($scope.policy.max,$scope.policy.marker,$scope.policy.type);
                    }
                  });
                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            createRamItemsModal: function (_type){
              var option = {
                templateUrl: 'views/create-ram-items.html',
                windowClass: 'create-ram-items-modal',
                controller: function ($scope, $modalInstance) {
                  _type = _type?_type:'user'
                  $scope.userGroups = []
                  $scope.user = {
                    tabActive:_type == 'user',
                    pattern:{
                      name:/^[a-zA-Z0-9\u4e00-\u9fa5\.@\-_]{1,64}$/,
                      display:/^[a-zA-Z0-9\.@\-\u4e00-\u9fa5]{0,12}$/,
                      phone:/^([0-9]+\-){0,1}[0-9]{11}$/,
                      email:/^[a-zA-Z0-9]+\@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/,
                      desc:/^[\s\S]{0,128}$/
                    },
                    userName:'',
                    displayName:'',
                    phone:'',
                    email:'',
                    groupName:'',
                    desc:'',
                    defaultKey:false
                  }
                  $scope.group = {
                    tabActive:_type == 'group',
                    pattern:{
                      name:/^[a-zA-Z0-9\u4e00-\u9fa5\-]{1,64}$/,
                      desc:/^[\s\S]{0,128}$/
                    },
                    groupName:'',
                    desc:''
                  }
                  $scope.policy = {
                    tabActive:_type == 'policy',
                    pattern:{
                      name:/^[a-zA-Z0-9\u4e00-\u9fa5\-]{1,128}$/,
                      doc:/^[\S\s]{1,2048}$/,
                      desc:/^[\S\s]{0,1024}$/
                    },
                    policyName:'',
                    policyDocument:'',
                    desc:''
                  }
                  $scope.role = {
                    tabActive:_type == 'role',
                    pattern:{
                      name:/^[a-zA-Z0-9\.@\-_]{1,64}$/,
                      doc:/^[\S\s]{1,2048}$/,
                      desc:/^[\S\s]{0,1024}$/
                    },
                    roleName:'',
                    desc:'',
                    doc:''
                  }
                  //OSSRam.getGroups().then(function(res){
                  //  $scope.userGroups = res.Groups.Group
                  //  if ($scope.userGroups.length){
                  //    $scope.userGroups.selected = $scope.userGroups[0];
                  //  }
                  //});
                  $scope.selectTabs = function(type){
                    if(type == 'user'){
                      $scope.group.tabActive = false
                      $scope.policy.tabActive = false
                      $scope.role.tabActive = false
                      $scope.user.tabActive = true
                    }
                    if(type == 'group'){
                      $scope.user.tabActive = false
                      $scope.policy.tabActive = false
                      $scope.role.tabActive = false
                      $scope.group.tabActive = true
                    }
                    if(type == 'policy'){
                      $scope.user.tabActive = false
                      $scope.group.tabActive = false
                      $scope.role.tabActive = false
                      $scope.policy.tabActive = true
                    }
                    if(type == 'role'){
                      $scope.user.tabActive = false
                      $scope.group.tabActive = false
                      $scope.policy.tabActive = false
                      $scope.role.tabActive = true
                    }
                  }
                  $scope.save = function(){
                    if($scope.user.tabActive){
                      OSSRam.createUser($scope.user.userName,$scope.user.displayName,$scope.user.phone,$scope.user.email,$scope.user.desc).then(function(res){
                        console.log("create user result:",res)
                        $rootScope.$broadcast('UpdateRamListData','user',res.User);
                        alert(gettextCatalog.getString(gettext("用户创建成功！")));
                        $modalInstance.dismiss('cancel');
                        //if($scope.user.defaultKey){
                        //
                        //}
                      },function(res){
                        res = {
                          Error:res.data
                        }
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      })
                    }else if($scope.group.tabActive){
                      OSSRam.createGroup($scope.group.groupName,$scope.group.desc).then(function(res){
                        console.log("create group result:",res)
                        $rootScope.$broadcast('UpdateRamListData','group');
                        alert(gettextCatalog.getString(gettext("用户组创建成功！")))
                        $modalInstance.dismiss('cancel');
                      },function(res){
                        res = {
                          Error:res.data
                        }
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      })
                    }else if($scope.role.tabActive){
                      OSSRam.createRole($scope.role.roleName,$scope.role.doc,$scope.role.desc).then(function(res){

                        $rootScope.$broadcast('UpdateRamListData','role');
                        alert(gettextCatalog.getString(gettext("角色创建成功！")))
                        $modalInstance.dismiss('cancel');
                      },function(res){
                        res = {
                          Error:res.data
                        }
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      })
                    }else if($scope.policy.tabActive){
                      OSSRam.createPolicy($scope.policy.policyName,$scope.policy.policyDocument,$scope.policy.desc).then(function(res){
                        $rootScope.$broadcast('UpdateRamListData','policy');
                        alert(gettextCatalog.getString(gettext("授权策略创建成功！")))
                        $modalInstance.dismiss('cancel');
                      },function(res){
                        res = {
                          Error:res.data
                        }
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                      })
                    }
                  }
                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            },
            getObjectURI: function (bucket, object) {
                var option = {
                    templateUrl: 'views/get_object_uri_modal.html',
                    windowClass: 'get_object_uri_modal',
                    controller: function ($scope, $modalInstance) {
                        //console.log("======get object uri=====",object.path,bucket)
                        $scope.filename = Util.String.baseName(object.path);
                        //console.log("======get object filename=====",$scope.filename)
                        $scope.expire = 3600;

                        $scope.loading = true;

                        $scope.isArchiveBucket = OSSConfig.isArchiveBucket(bucket);

                        $scope.currentFile = {
                          restore: null,
                          status: 'norestore'
                        };

                        $scope.$watch('loading', function (newVal) {
                            if (newVal) {
                                usSpinnerService.spin('get-acl-spinner');
                            } else {
                                usSpinnerService.stop('get-acl-spinner');
                            }
                        });

                        var formatRestoreStr = function(restoreStr){
                            var restoreObj = {};
                            var restoreArr = restoreStr.split('\",');
                            angular.forEach(restoreArr,function(itemStr, index){
                              var itemArr = itemStr.replace(/"/g,"").split("=");
                              restoreObj[itemArr[0].replace(/ /g,"")] = itemArr[1];
                              if(index == 0){
                                restoreObj[itemArr[0]] = itemArr[1] == 'true' ? true : false
                              }
                            })
                            return restoreObj;
                        }

                        var getObjectAcl = function(){
                            //获取bucket的acl信息
                            OSSApi.getBucketAcl(bucket).success(function (res) {
                              $scope.loading = false;
                              if (res && res["AccessControlPolicy"] && res["AccessControlPolicy"]["AccessControlList"] && res["AccessControlPolicy"]["AccessControlList"]["Grant"]) {
                                var acl = res["AccessControlPolicy"]["AccessControlList"]["Grant"];
                                if (acl != 'private') {
                                  $scope.uri = OSSApi.getURI(bucket, object.path);
                                }
                              }
                            }).error(function (res,status) {
                              $scope.loading = false;
                              $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                            });
                        }

                        if($scope.isArchiveBucket){
                          OSSApi.getObjectMeta(bucket, object.path).success(function (data, status, getHeader) {
                            var headers = getHeader();
                            if(headers['x-oss-restore']){
                              $scope.currentFile.restore = formatRestoreStr(headers['x-oss-restore']);
                              if($scope.currentFile.restore['ongoing-request']){
                                $scope.currentFile.status = 'completing';
                              }else{
                                $scope.currentFile.expiryDate = new Date($scope.currentFile.restore['expiry-date']);
                                $scope.currentFile.status = 'completed';
                                getObjectAcl();
                              }
                            }
                            $scope.loading = false
                          })
                        }else{
                          getObjectAcl();
                        }

                        $scope.onRestoreFile = function () {
                            OSSApi.restoreFile(bucket, object.path).then(function(res,status) {
                              if(+res.status == 202){
                                $scope.currentFile.restore = {'ongoing-request': true}
                                $scope.currentFile.status = 'completing';
                                OSSAlert.success('Restore 请求提交成功，该操作可能需要几个小时的时间，请耐心等待。');
                                $modalInstance.dismiss('cancel');
                              }else if(+res.status == 200) {
                                OSSAlert.success('Restore 请求发送成功!');
                                $modalInstance.dismiss('cancel');
                              }
                            },function(res, status){
                              $scope.loading = false;
                              $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                            })
                        }

                        //获取私有bucket的uri
                        $scope.getUri = function (expire) {
                            $scope.uri = OSSApi.getURI(bucket, object.path, expire);
                        };

                        $scope.copyToClipborad = function (uri) {
                            OSS.invoke('setClipboardData', uri);
                            alert(gettextCatalog.getString(gettext('已复制到剪切板')));
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            uploadDetail: function (bucket, upload) {
                var option = {
                    templateUrl: 'views/upload_detail_modal.html',
                    windowClass: 'upload_detail_modal',
                    controller: function ($scope, $modalInstance) {

                        $scope.loading = false;

                        $scope.parts = [];

                        var size = 50;

                        var lastMaker = '';

                        var allLoaded = false;
                        $scope.firstLoading = true;
                        var loadPart = function () {
                            if ($scope.loading) {
                                return;
                            }
                            $scope.loading = true;
                            OSSApi.listUploadPart(bucket, upload, lastMaker, size).success(function (res) {
                                $scope.loading = false;
                                if(!$scope.parts || !$scope.parts.length){
                                    $scope.firstLoading = false;
                                }
                                var result = res['ListPartsResult'];
                                lastMaker = result['NextPartNumberMarker'];
                                allLoaded = result['IsTruncated'] === 'false';
                                var parts = [];
                                if(result['Part']){
                                    parts = angular.isArray(result['Part']) ? result['Part'] : [result['Part']];
                                }
                                $scope.parts = $scope.parts.concat(parts);
                            }).error(function (res,status) {
                                $scope.loading = false;
                                $scope.firstLoading = false;
                                $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                            })
                        };

                        loadPart();

                        $scope.$watch('firstLoading',function(newVal){
                            if (newVal) {
                                usSpinnerService.spin('load-upload-detail-spinner');
                            } else {
                                usSpinnerService.stop('load-upload-detail-spinner');
                            }
                        });

                        $scope.loadMore = function () {
                            if (allLoaded) {
                                return;
                            }
                            loadPart();
                        }

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            delBucketConfirm: function (bucket) {

                var option = {
                    templateUrl: 'views/del_bucket_confirm_modal.html',
                    windowClass: 'del_bucket_confirm_modal',
                    controller: function ($scope, $modalInstance) {
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.delConfirm = function (accessKey, accessSecret) {
                            if (!accessKey) {
                                $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('请输入 Access Key ID')));
                                return;
                            }
                            if (!accessSecret) {
                                $rootScope.$broadcast('showError',gettextCatalog.getString(gettext('请输入 Access Key Secret')));
                                return;
                            }

                            OSSAlert.confirm(gettextCatalog.getString(gettext('确定要删除Bucket “{{bucketName}}“吗？删除后数据将无法恢复'),{bucketName:bucket.Name})).result.then(function(){
                                $modalInstance.close({
                                    accessKey: accessKey,
                                    accessSecret: accessSecret
                                });
                            })
                        };

                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            downloadObject: function (bucket, selectFiles) {
              var option = {
                templateUrl: 'views/set_download_modal.html',
                windowClass: 'set-download-modal',
                controller: function ($scope, $modalInstance) {
                  $scope.downloadFile = {
                      restore: null,
                      status: 'norestore'
                  };
                  var object = selectFiles[0];
                  $scope.loading = true;
                  var formatRestoreStr = function(restoreStr){
                    var restoreObj = {};

                    var restoreArr = restoreStr.split('\",');
                    angular.forEach(restoreArr,function(itemStr, index){
                      var itemArr = itemStr.replace(/"/g,"").split("=");
                      restoreObj[itemArr[0].replace(/ /g,"")] = itemArr[1];
                      if(index == 0){
                        restoreObj[itemArr[0]] = itemArr[1] == 'true' ? true : false
                      }
                    })
                    return restoreObj;
                  }
                  OSSApi.getObjectMeta(bucket, object.path).success(function (data, status, getHeader) {
                    $scope.loading = false
                    var headers = getHeader();
                    if(headers['x-oss-restore']){
                      console.log('get restore data:', headers['x-oss-restore'])
                      $scope.downloadFile.restore = formatRestoreStr(headers['x-oss-restore']);
                      if($scope.downloadFile.restore['ongoing-request']){
                          $scope.downloadFile.status = 'completing';
                      }else{
                        $scope.downloadFile.expiryDate = new Date($scope.downloadFile.restore['expiry-date']);
                        $scope.downloadFile.status = 'completed';
                      }
                    }

                  }).error(function (res,status) {
                    $scope.loading = false;
                    $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                  });

                  $scope.onDownload = function () {
                      console.log("start download file:::", selectFiles)
                    var list = _.map(selectFiles, function (val) {
                      return {
                        location: bucket['Location'],
                        bucket: bucket['Name'],
                        object: val.path,
                        filesize: val.size,
                        etag:val.etag
                      }
                    });
                    OSS.invoke('saveFileDlg',null,function(res){
                      var _path = res.path
                      if(_path){
                        $rootScope.$broadcast('startDownloadFilesLoading');
                        OSS.invoke('saveFile', {
                          list: list,
                          path:_path
                        }, function (res) {
                          $rootScope.$broadcast('endDownloadFilesLoading')
                          if (!res.error) {
                            $rootScope.$broadcast('toggleTransQueue', true, 'download');
                            $rootScope.$broadcast('reloadDownloadQueue');
                          } else {
                            $rootScope.$broadcast('showError', OSSException.getClientErrorMsg(res));
                          }
                        })
                      }
                    })
                  }

                  $scope.onRestoreFile = function () {
                    OSSApi.restoreFile(bucket, object.path).then(function(res,status){
                      if(+res.status == 202){
                        $scope.downloadFile.restore = {'ongoing-request': true}
                        $scope.downloadFile.status = 'completing';
                        OSSAlert.success('Restore 请求提交成功，该操作可能需要几个小时的时间，请耐心等待。');
                        $modalInstance.dismiss('cancel');
                      }else if(+res.status == 200){
                        OSSAlert.success('Restore 请求发送成功!');
                        $modalInstance.dismiss('cancel');
                      }
                    },function(res, status){
                      $scope.loading = false;
                      $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                    })
                  }

                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };

                }
              }
              option = angular.extend({}, defaultOption, option);
              return $modal.open(option);
            }
        };
        return OSSModal;
    }])