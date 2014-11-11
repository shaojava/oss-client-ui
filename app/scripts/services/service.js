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
    .factory('OSSAlert', ['$modal', function ($modal) {

        function openAlertModal(type, message, title, buttons) {
            var option = {
                templateUrl: 'views/alert_modal.html',
                windowClass: 'alert-modal ' + type + '-alert-modal',
                controller: function ($scope, $modalInstance) {

                    $scope.type = type;

                    $scope.message = message;

                    $scope.title = title;

                    $scope.buttons = buttons;

                    $scope.buttonClick = function (button) {
                        angular.isFunction(button.callback) && button.callback();
                        $modalInstance.close();
                    }

                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };

                }
            };

            return $modal.open(option);
        }


        return {
            info: function (message, title, buttons) {
                title = angular.isUndefined(title) ? '信息' : title;
                buttons = angular.isUndefined(buttons) ? [
                    {
                        text: '关闭',
                        classes: 'btn btn-default'
                    }
                ] : buttons;
                return openAlertModal('info', message, title, buttons);
            },
            warning: function (message, title, buttons) {
                title = angular.isUndefined(title) ? '警告' : title;
                buttons = angular.isUndefined(buttons) ? [
                    {
                        text: '确认',
                        classes: 'btn btn-primary'
                    },
                    {
                        text: '关闭',
                        classes: 'btn btn-default'
                    }
                ] : buttons;
                return openAlertModal('warning', message, title, buttons);
            },
            error: function (message, title, buttons) {
                title = angular.isUndefined(title) ? '错误' : title;
                buttons = angular.isUndefined(buttons) ? [
                    {
                        text: '关闭',
                        classes: 'btn btn-default'
                    }
                ] : buttons;
                return openAlertModal('error', message, title, buttons);
            },
            success: function (message, title, buttons) {
                title = angular.isUndefined(title) ? '成功' : title;
                buttons = angular.isUndefined(buttons) ? [
                    {
                        text: '关闭',
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
    .factory('OSSQueueMenu', ['$rootScope', 'OSSQueueItem', '$timeout', function ($rootScope, OSSQueueItem, $timeout) {
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
        var prepareUpladParam = function (selectedItems) {
            var param = {
                all: selectedItems && selectedItems.length ? 0 : 1
            };
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
        var prepareDownloadParam = function (selectedItems) {
            var param = {
                all: selectedItems && selectedItems.length ? 0 : 1
            };
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
                text: '开始',
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
                text: '暂停',
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
                text: '取消',
                execute: function (selectedItems) {
                    if (!confirm('你确定要取消' + (selectedItems.length == 1 ? '这个' : '这' + selectedItems.length + '个') + '文件的上传？')) {
                        return;
                    }
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('deleteUpload', prepareUpladParam(selectedItems), function () {
                        $timeout(function () {
                            $rootScope.$broadcast('removeQueue', 'upload', selectedItems);
                        })
                    });

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
                text: '移除',
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
                text: '全部暂停',
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
                    return _.find(items, function (item) {
                        return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item);
                    }) ? 1 : 0;
                }
            },
            {
                name: 'startAll',
                text: '全部开始',
                execute: function (selectedItems, items) {
                    OSS.invoke('startUpload', prepareUpladParam(), function () {
                        $timeout(function () {
                            _.each(_.filter(items, function (item) {
                                return OSSQueueItem.isPaused(item);
                            }), OSSQueueItem.setPaused);
                        });
                    });
                },
                getState: function (selectItems, items) {
                    return _.find(items, function (item) {
                        return OSSQueueItem.isPaused(item);
                    }) ? 1 : 0;
                }
            },
            {
                name: 'removeAll',
                text: '清空已完成',
                execute: function (selectItems, items) {
                    OSS.invoke('deleteUpload', {
                        finish: 1,
                        all: 1
                    }, function () {
                        $timeout(function () {
                            $rootScope.$broadcast('removeQueue', 'upload', _.filter(items, function (item) {
                                return OSSQueueItem.isDone(item);
                            }));
                        });
                    });
                },
                getState: function (selectItems, items) {
                    return _.find(items, function (item) {
                        return OSSQueueItem.isDone(item);
                    }) ? 1 : 0;
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
                text: '开始',
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
                text: '暂停',
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
                text: '取消',
                execute: function (selectedItems) {
                    if (!confirm('你确定要取消' + (selectedItems.length == 1 ? '这个' : '这' + selectedItems.length + '个') + '文件的下载？')) {
                        return;
                    }
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('deleteDownload', prepareDownloadParam(selectedItems), function () {
                        $timeout(function () {
                            $rootScope.$broadcast('removeQueue', 'download', selectedItems);
                        })
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
                text: '移除',
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
                text: '全部暂停',
                execute: function (selectItems, items) {
                    OSS.invoke('stopDownload', prepareDownloadParam(), function () {
                        $timeout(function () {
                            _.each(_.filter(items, function (item) {
                                return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item);
                            }), OSSQueueItem.setPaused);
                        });
                    });

                },
                getState: function (selectItems, items) {
                    return _.find(items, function (item) {
                        return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item);
                    }) ? 1 : 0;
                }
            },
            {
                name: 'startAll',
                text: '全部开始',
                execute: function (selectItems, items) {
                    OSS.invoke('startDownload', prepareDownloadParam(), function () {
                        _.each(_.filter(items, function (item) {
                            return OSSQueueItem.isPaused(item);
                        }), OSSQueueItem.setProgress);
                    });
                },
                getState: function (selectItems, items) {
                    return _.find(items, function (item) {
                        return OSSQueueItem.isPaused(item);
                    }) ? 1 : 0;
                }
            },
            {
                name: 'removeAll',
                text: '清空已完成',
                execute: function (selectItems, items) {
                    OSS.invoke('deleteDownload', {
                        finish: 1,
                        all: 1
                    }, function () {
                        $timeout(function () {
                            $rootScope.$broadcast('removeQueue', 'download', _.filter(items, function (item) {
                                return OSSQueueItem.isDone(item);
                            }));
                        });
                    });
                },
                getState: function (selectItems, items) {
                    return _.find(items, function (item) {
                        return OSSQueueItem.isDone(item);
                    }) ? 1 : 0;
                }
            }
        ];

        var groupMenu = [
            ['start', 'pause', 'cancel', 'remove'],
            ['startAll', 'pauseAll', 'removeAll']
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
    .factory('OSSMenu', ['Clipboard', 'OSSModal', '$rootScope', 'OSSApi', 'OSSException', function (Clipboard, OSSModal, $rootScope, OSSApi, OSSException) {
        var currentMenus = 'upload create paste'.split(' '),
            selectMenus = 'download copy del get_uri set_header'.split(' '),
            groupMenu = ['upload create paste'.split(' '), 'download copy del'.split(' '), 'get_uri set_header'.split(' ')];
        var allMenu = [
            {
                name: 'upload',
                text: '上传',
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
                text: '新建文件夹',
                getState: function () {
                    return 1;
                },
                execute: function (bucket, currentObject) {
                    $rootScope.$broadcast('createObject', function (filename, callback) {
                        var objectPath = currentObject ? currentObject + filename + '/' : filename + '/';
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
                    })
                }
            },
            {
                name: 'download',
                text: '下载',
                getState: function (selectedFiles) {
                    var len = selectedFiles.length;
                    if (!len) {
                        return 0;
                    }
                    return 1;
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    var list = _.map(selectedFiles, function (val) {
                        return {
                            location: bucket['Location'],
                            bucket: bucket['Name'],
                            object: val.path,
                            filesize: val.size,
                            etag:val.etag
                        }
                    });

                    OSS.invoke('saveFile', {
                        list: list
                    }, function (res) {
                        if (!res.error) {
                            $rootScope.$broadcast('toggleTransQueue', true, 'download');
                            $rootScope.$broadcast('reloadDownloadQueue');
                        } else {
                            $rootScope.$broadcast('showError', OSSException.getClientErrorMsg(res));
                        }
                    })
                }
            },
            {
                name: 'copy',
                text: '复制',
                getState: function (selectedFiles) {
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
                text: '粘贴',
                getState: function () {
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
                        OSS.invoke('copyObject', {
                            dstbucket: bucket['Name'],
                            dstobject: selectedFiles.length == 1 && selectedFiles[0].dir ? selectedFiles[0].path : currentObject,
                            dstlocation: bucket['Location'],
                            bucket: targetBucket['Name'],
                            location: targetBucket['Location'],
                            list: list
                        }, function (res) {
                            if (!res.error) {
                                $rootScope.$broadcast('reloadFileList');
                            } else {
                                $rootScope.$broadcast('showError', OSSException.getClientErrorMsg(res));
                            }
                        })
                    }
                }
            },
            {
                name: 'del',
                text: '删除',
                getState: function (selectedFiles) {
                    var len = selectedFiles.length;
                    if (!len) {
                        return 0;
                    }
                    return 1;
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    if (!confirm('确定要删除？')) {
                        return;
                    }
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
                }
            },
            {
                name: 'get_uri',
                text: '获取地址',
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
                text: '设置HTTP头',
                getState: function (selectedFiles) {
                    var len = selectedFiles.length;
                    if (!len || len > 1) {
                        return 0;
                    } else {
                        return selectedFiles[0].dir ? 0 : 1
                    }
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    OSSModal.setObjectHttpHeader(bucket, selectedFiles[0]);
                }
            }

        ];
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
    .factory('OSSUploadMenu', ['Bucket', 'OSSApi', '$rootScope', 'OSSModal','OSSException',function (Bucket, OSSApi, OSSModal,OSSException) {
        var allMenu = [
            {
                name: 'remove',
                text: '删除',
                getState: function (selectedUploads) {
                    var len = selectedUploads.length;
                    if (!len) {
                        return 0;
                    }
                    return 1;
                },
                execute: function (selectedUploads) {
                    if (!confirm('确定要删除选择的碎片？')) {
                        return;
                    }
                    angular.forEach(selectedUploads, function (upload) {
                        OSSApi.deleteUpload(Bucket.getCurrentBucket(), upload).success(function () {
                            $rootScope.$broadcast('removeUpload', upload);
                        }).error(function (res,status) {
                            $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                        });
                    });
                }
            },
            {
                name: 'detail',
                text: '详细',
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
            backward: function () {
                this.go();
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
            getUrl: function (bucketName, prefix, filter) {

                filter = angular.isUndefined(filter) ? 'file' : filter;
                prefix = angular.isUndefined(prefix) ? '' : prefix;

                var url = '';

                url += '/' + filter;

                url += '/' + bucketName;

                if (prefix) {
                    url += '/' + prefix;
                }

                return url;
            }
        };
        return OSSLocation;
    }])

/**
 * 面包屑相关
 */
    .factory('Bread', ['OSSLocation', function (OSSLocation) {
        var getFilterName = function (filter) {
            var filterName = '';
            switch (filter) {
                case 'upload':
                    filterName = '碎片管理';
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
            getCreateBucketXML: function (region) {
                //去掉”-internal“
                region = region.replace('-internal', '');
                return [
                    this.getXMLHeader(),
                    "<CreateBucketConfiguration >",
                    "<LocationConstraint >",
                    region,
                    "</LocationConstraint >",
                    "</CreateBucketConfiguration >"
                ].join('');
            }
        };
    })

/**
 * bucket相关
 */
    .factory('Bucket', ['OSSApi', '$q','OSSException','$rootScope', function (OSSApi, $q,OSSException,$rootScope) {
        var buckets = null;
        var deferred = $q.defer();
        var listPromise;
        return {
            list: function () {
                if (listPromise) {
                    return listPromise;
                } else {
                    OSSApi.getBuckets().success(function (res) {
                        var resBuckets = res['ListAllMyBucketsResult']['Buckets']['Bucket'];
                        if(resBuckets){
                            buckets = angular.isArray(resBuckets) ? resBuckets : [resBuckets]
                        }else{
                            buckets = [];
                        }
                        deferred.resolve(buckets);
                    }).error(function (res,status) {
                        $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                        deferred.reject(res,status);
                    });
                    return listPromise = deferred.promise;
                }
            },

            getAcls: function () {
                return {
                    "public-read-write": "公共读写",
                    "public-read": "公共读",
                    "private": "私有"
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
            }
        };
    }])

/**
 * api相关
 */
    .factory('OSSApi', ['$http', 'RequestXML', 'OSSConfig', 'OSSRegion',function ($http, RequestXML, OSSConfig,OSSRegion) {

        var OSSAccessKeyId = OSS.invoke('getAccessID');

        //获取当前的区域
        var currentLocation = OSS.invoke('getCurrentLocation');

        var host = OSSConfig.getHost();

        var getExpires = function (expires) {
            expires = angular.isUndefined(expires) ? 60 : expires;
            return parseInt(new Date().getTime() / 1000) + expires;
        };

        var getRequestUrl = function (bucket, region, expires, signature, canonicalizedResource, extraParam) {
            region = OSSRegion.changeLocation(region);
            var requestUrl = 'http://' + (bucket ? bucket + "." : "") + (region ? region + '.' : '') + host;
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
            return '/' + (bucketName ? bucketName + '/' : '') + (objectName ? objectName : '') + (subResourcesStr ? '?' + subResourcesStr : '');
        };

        return {
            getURI: function (bucket, objectName, expires) {
                if (expires) {
                    return 'http://' + bucket.Name + '.' + bucket.Location + '.' + host + '/' + encodeURIComponent(objectName);
                } else {
                    expires = getExpires(expires);
                    var canonicalizedResource = getCanonicalizedResource(bucket.Name, objectName);
                    var signature = OSS.invoke('getSignature', {
                        verb: 'GET',
                        expires: expires,
                        canonicalized_resource: canonicalizedResource
                    });
                    return getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
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
            createBucket: function (bucketName, region, acl) {
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
                return $http.put(requestUrl, RequestXML.getCreateBucketXML(region), {
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

                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
                return $http.head(requestUrl);
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

                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
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
                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
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
                var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource, param);
                return $http.get(requestUrl);
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
                    OSS.log('listUploads:res', res);
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
    .factory('OSSModal', ['$modal', 'OSSDialog','OSSConfig', 'Bucket', 'OSSApi', 'OSSObject', 'OSSException', 'OSSRegion', '$rootScope', 'usSpinnerService', function ($modal, OSSDialog,OSSConfig, Bucket, OSSApi, OSSObject, OSSException, OSSRegion, $rootScope, usSpinnerService) {
        var defaultOption = {
            backdrop: 'static'
        };
        return {
            setting:function(){
                var option = {
                    templateUrl: 'views/setting_modal.html',
                    windowClass: 'setting_modal',
                    controller: function ($scope, $modalInstance) {

                        $scope.min = 1;

                        $scope.max = 10;

                        $scope.isCustomClient = OSSConfig.isCustomClient();

                        var setting = OSS.invoke('getTransInfo');

                        $scope.setting = setting;

                        var checkSetting = function(setting){
                            var unValidMessage = '';
                            for(var key in setting){
                                if(setting.hasOwnProperty(key)){
                                    var val = setting[key];
                                    if(!/\d/.test(val)){
                                        unValidMessage = '请输入数字';
                                        break;
                                    }
                                    if(val<=0 || val>10){
                                        unValidMessage = '设置的值必须大于0小于或等于10';
                                        break;
                                    }
                                }
                            }
                            if(unValidMessage){
                                alert(unValidMessage);
                                return;
                            }
                        };

                        $scope.saveSetting = function(setting){
                            checkSetting(setting);
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

                        //bucket的权限
                        var acls = [], regions = [];
                        angular.forEach(Bucket.getAcls(), function (val, key) {
                            acls.push({
                                name: val,
                                value: key
                            })
                        });
                        $scope.acls = acls;
                        if (!bucket) {
                            $scope.acls.selected = $scope.acls[0];
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

                        //创建bucket时是否不允许选择区域
                        $scope.isDisableLocationSelect = OSSConfig.isDisableLocationSelect();

                        if (!$scope.isDisableLocationSelect) {
                            //bucket区域
                            $scope.regions = OSSRegion.list();
                        }

                        if (!bucket) {
                            if (!$scope.isDisableLocationSelect) {
                                $scope.cBucket.region = $scope.regions[0];
                            } else {
                                var currentLocation = OSS.invoke('getCurrentLocation');
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
                                $scope.selectAcl = Util.Array.getObjectByKeyValue($scope.acls, 'value', res["AccessControlPolicy"]["AccessControlList"]["Grant"]);
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
                        $scope.createBucket = function (bucketName, region, acl) {
                            if (!bucketName || !bucketName.length) {
                                alert('Bucket的名称不能为空');
                                return;
                            }
                            $scope.loading = true;
                            OSSApi.createBucket(bucketName, region.location, acl.value).success(function () {
                                $scope.loading = false;
                                $modalInstance.close({
                                    act: 'add',
                                    bucket: {
                                        Name: bucketName,
                                        Location: region.location,
                                        Acl: acl.value
                                    }
                                });
                            }).error(function (response, statusCode) {
                                $scope.loading = false;
                                $rootScope.$broadcast('showError', OSSException.getError(response, statusCode).msg);
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
            setObjectHttpHeader: function (bucket, object) {
                var option = {
                    templateUrl: 'views/set_http_header_modal.html',
                    windowClass: 'set_http_header_modal',
                    controller: function ($scope, $modalInstance) {

                        $scope.object = object;

                        $scope.headers = [];
                        angular.forEach('Content-Type Content-Disposition Content-Language Cache-Control Expires'.split(' '), function (val) {
                            $scope.headers.push({
                                name: val,
                                text: val
                            })
                        })

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

                        $scope.loading = true;
                        OSSApi.getObjectMeta(bucket, object.path).success(function (data, status, getHeader) {
                            $scope.loading = false;
                            angular.forEach($scope.headers, function (header) {
                                header.model = getHeader(header.name);
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


                        $scope.setHttpHeader = function (headers, customHeaders) {
                            var ossHeaders = {}, canonicalizedOSSheaders = {};
                            angular.forEach(headers, function (val) {
                                if (val.model) {
                                    ossHeaders[val.name] = val.model;
                                }
                            });

                            angular.forEach(customHeaders, function (val) {
                                if (val.nameModel) {
                                    canonicalizedOSSheaders['x-oss-meta-' + val.nameModel.toLowerCase()] = val.contentModel || '';
                                }
                            });

                            $scope.saving = true;
                            OSSApi.putObject(bucket, object.path, ossHeaders, canonicalizedOSSheaders).success(function (res) {
                                $scope.saving = false;
                                $modalInstance.close();
                            }).error(function(res,status){
                                $scope.saving = false;
                                $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                            });
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
            getObjectURI: function (bucket, object) {
                var option = {
                    templateUrl: 'views/get_object_uri_modal.html',
                    windowClass: 'get_object_uri_modal',
                    controller: function ($scope, $modalInstance) {

                        $scope.filename = Util.String.baseName(object.path);

                        $scope.expire = 3600;

                        $scope.loading = true;

                        $scope.$watch('loading', function (newVal) {
                            if (newVal) {
                                usSpinnerService.spin('get-acl-spinner');
                            } else {
                                usSpinnerService.stop('get-acl-spinner');
                            }
                        });

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

                        //获取私有bucket的uri
                        $scope.getUri = function (expire) {
                            $scope.uri = OSSApi.getURI(bucket, object.path, expire);
                        };

                        $scope.copyToClipborad = function (uri) {
                            OSS.invoke('setClipboardData', uri);
                            alert('已复制到剪切板');
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

                        var loadPart = function () {
                            if ($scope.loading) {
                                return;
                            }
                            $scope.loading = true;
                            OSSApi.listUploadPart(bucket, upload, lastMaker, size).success(function (res) {
                                $scope.loading = false;
                                var result = res['ListPartsResult'];
                                lastMaker = result['NextPartNumberMarker'];
                                allLoaded = result['IsTruncated'] === 'false';
                                var parts = angular.isArray(result['Part']) ? result['Part'] : [result['Part']];
                                $scope.parts = $scope.parts.concat(parts);
                            }).error(function (res,status) {
                                $scope.loading = false;
                                $rootScope.$broadcast('showError',OSSException.getError(res,status).msg);
                            })
                        };

                        loadPart();

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
                            if (!confirm('确定要删除Bucket “' + bucket.Name + '“吗？删除后数据将无法恢复')) {
                                return;
                            }
                            if (!accessKey) {
                                alert('请输入 Access Key ID');
                                return;
                            }
                            if (!accessSecret) {
                                alert('请输入 Access Key Secret');
                                return;
                            }
                            $modalInstance.close({
                                accessKey: accessKey,
                                accessSecret: accessSecret
                            });
                        };

                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            }
        };
    }]);
