'use strict';

/**
 * @ngdoc function
 * @name ossClientUiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ossClientUiApp
 */
angular.module('ossClientUiApp')
    .controller('MainCtrl', ['$scope', 'OSSApi', 'OSSModal', 'Bucket', 'Bread', 'OSSLocationHistory', '$rootScope', '$filter', 'OSSDialog', 'OSSAlert', 'OSSLocation', '$location', function ($scope, OSSApi, OSSModal, Bucket, Bread, OSSLocationHistory, $rootScope, $filter, OSSDialog, OSSAlert, OSSLocation, $location) {

        //获取所有bucket列表
        $scope.buckets = [];

        //新建bucket对话框
        $scope.showAddBucketModal = function () {
            OSSModal.addBucket().result.then(function (param) {
                if (param.act == 'add') {
                    $scope.buckets.push(param.bucket);
                    $location.path(OSSLocation.getUrl(param.bucket.Name));
                }

            });
        };

        //bucket设置
        $scope.editBucket = function (bucket) {
            OSSModal.addBucket(bucket).result.then(function (param) {
                if (param.act == 'del') {
                    Util.Array.removeByValue($scope.buckets, param.bucket);
                }
            });
        };

        $scope.onConextMenuShow = function (bucket) {
            $scope.activeBucket = bucket;
        }

        //面包屑
        $scope.breads = [];

        //后退
        $scope.backward = function () {
            OSSLocationHistory.backward();
        };

        //前进
        $scope.forward = function () {
            OSSLocationHistory.forward();
        };


        Bucket.list().then(function (buckets) {
            $scope.buckets = angular.isArray(buckets) ? buckets : [buckets];
        });

        $scope.$on('$routeChangeSuccess', function (event, current, prev) {
            if (prev && prev.params) {
                var oldBucket = Bucket.getBucket(prev.params.bucket);
                oldBucket && Bucket.unselected(oldBucket);
            }
            var currentBucket,
                currentObjectPath = '/',
                filter = 'file';
            if (current && current.params && current.params.bucket) {
                if (current.$$route && current.$$route.originalPath) {
                    var pathArr = current.$$route.originalPath.split('/');
                    currentBucket = Bucket.getBucket(current.params.bucket);
                    currentObjectPath = current.params.object;
                    filter = pathArr[1] || 'file';
                }
            } else if ($scope.buckets && $scope.buckets.length) {
                currentBucket = $scope.buckets[0]['Name'];
            }
            if (currentBucket) {
                Bucket.select(currentBucket);
                $scope.breads = Bread.getBreads(currentBucket.Name, currentObjectPath, filter);
                $scope.historyCanForward = OSSLocationHistory.canForward();
                $scope.historyCanBackward = OSSLocationHistory.canBackward();
            }
        });

        //打开导出授权的页面
        $scope.exportAuthorization = function () {
            OSSModal.setting();
        };

        //展开,展开传输队列
        $scope.$on('toggleTransQueue', function (event, isShow) {
            if (angular.isUndefined(isShow)) {
                $scope.showTransQueue = !$scope.showTransQueue;
            } else {
                $scope.showTransQueue = isShow;
            }

        });

        //显示错误提示框
        $scope.$on('showError', function (event, errorMsg, errorTitle) {
            if (!errorMsg) return;
            OSSAlert.error(errorMsg, errorTitle);
        });

        $scope.$on('removeBucket', function (event, bucket) {
            if (bucket.selected && $scope.buckets.length) {
                $location.path(OSSLocation.getUrl($scope.buckets[0].Name));
            }
            Util.Array.removeByValue($scope.buckets, bucket);
        });

    }])
/**
 * 传输队列
 */
    .controller('TransQueueCtrl', ['$scope', '$interval', 'OSSQueueMenu', 'OSSUploadQueue', 'OSSDownloadQueue', '$rootScope', function ($scope, $interval, OSSQueueMenu, OSSUploadQueue, OSSDownloadQueue, $rootScope) {

        //上传的操作菜单
        $scope.uploadQueueMenus = OSSQueueMenu.getUploadMenu();
        $scope.uploadMenuGroup = OSSQueueMenu.groupBy($scope.uploadQueueMenus, 'upload');

        //下载的操作菜单
        $scope.downloadQueueMenus = OSSQueueMenu.getDownloadMenu();
        $scope.downloadMenuGroup = OSSQueueMenu.groupBy($scope.downloadQueueMenus, 'download');

        //获取选中的列表
        $scope.getSelectedList = function (type) {
            return _.where(type == 'download' ? $scope.downloadList : $scope.uploadList, {
                selected: true
            })
        };

        //选中
        $scope.select = function (item, type) {
            item.selected = true;
            if (type == 'download') {
                $scope.scrollToDownloadIndex = _.indexOf($scope.downloadList, item);
            } else {
                $scope.scrollToUploadIndex = _.indexOf($scope.uploadList, item);
            }

        };

        //取消选中
        $scope.unSelect = function (item) {
            item.selected = false;
        };

        //取消所有选中
        $scope.unSelectAll = function (type) {
            angular.forEach($scope.getSelectedList(type), function (item) {
                $scope.unSelect(item, type);
            });
        };

        //按住shift键选中的最后一个元素
        $scope.shiftLastUploadIndex = 0;
        $scope.shiftLastDownloadIndex = 0;

        //点击条目
        $scope.handleItemClick = function ($event, index, item, type) {
            if ($event.ctrlKey || $event.metaKey) {
                if (item.selected) {
                    $scope.unSelect(item, type);
                } else {
                    $scope.select(item, type);
                }
            } else if ($event.shiftKey) {
                var lastIndex = type == 'download' ? $scope.shiftLastDownloadIndex : $scope.shiftLastUploadIndex;
                $scope.unSelectAll(type);
                if (index > lastIndex) {
                    for (var i = lastIndex; i <= index; i++) {
                        $scope.select(type == 'download' ? $scope.downloadList[i] : $scope.uploadList[i], type);
                    }
                } else if (index < lastIndex) {
                    for (var i = index; i <= lastIndex; i++) {
                        $scope.select(type == 'download' ? $scope.downloadList[i] : $scope.uploadList[i], type);
                    }
                }

            } else {
                $scope.unSelectAll(type);
                $scope.select(item, type);
            }

            if (!$event.shiftKey) {
                if (type == 'download') {
                    $scope.shiftLastDownloadIndex = index;
                } else {
                    $scope.shiftLastUploadIndex = index;
                }

            }
        };

        //监听删除队列
        $scope.$on('removeQueue', function (event, type, items) {
            OSS.log('removeQueue', arguments);
            if (type === 'upload') {
                angular.forEach(items, function (item) {
                    OSSUploadQueue.remove(item);
                });
            } else {
                angular.forEach(items, function (item) {
                    OSSDownloadQueue.remove(item);
                });
            }
        });

        $scope.OSSUploadQueue = OSSUploadQueue.init();
        $scope.uploadList = $scope.OSSUploadQueue.items;
        $scope.OSSUploadQueue.refresh();
        $scope.$on('reloadUploadQueue', function () {
            $scope.OSSUploadQueue = OSSUploadQueue.init();
            $scope.uploadList = $scope.OSSUploadQueue.items;
        });

        $scope.OSSDownloadQueue = OSSDownloadQueue.init();
        $scope.downloadList = $scope.OSSDownloadQueue.items;
        $scope.OSSDownloadQueue.refresh();
        $scope.$on('reloadDownloadQueue', function () {
            $scope.OSSDownloadQueue = OSSDownloadQueue.init();
            $scope.downloadList = $scope.OSSDownloadQueue.items;
        });

        //滚到加载
        $scope.loadMoreQueue = function (type) {
            if (type == 'download') {
                $scope.loadingQueue = true;
                $scope.OSSDownloadQueue.getQueueList($scope.downloadList.length);
                $scope.loadingQueue = false;
            } else if (type == 'upload') {
                $scope.loadingQueue = true;
                $scope.OSSUploadQueue.getQueueList($scope.uploadList.length);
                $scope.loadingQueue = false;
            }
        };

        //隐藏或展开消息队列
        $scope.toggleSlideQueue = function () {
            $scope.$emit('toggleTransQueue');
        };

        //支持双击
        $scope.handleTransQueueDblClick = function ($event) {
            var $target = $($event.target);
            if ($target.hasClass('nav-tabs') || $target.parents('.nav').size()) {
                $scope.toggleSlideQueue();
            }
        };

        //选项卡集合
        $scope.tabs = [
            {
                name: 'upload',
                title: '上传队列'
                //title: '上传队列' + ($scope.OSSUploadQueue.totalCount ? '(' + $scope.OSSUploadQueue.doneCount + '/' + $scope.OSSUploadQueue.totalCount + ')' : '')
            },
            {
                name: 'download',
                title: '下载队列'
                //title: '下载队列' + ($scope.OSSDownloadQueue.doneCount ? '(' + $scope.OSSDownloadQueue.doneCount + '/' + $scope.OSSDownloadQueue.totalCount + ')' : '')
            },
            {
                name: 'log',
                title: '错误日志'
            }
        ];

        //选中tab
        $scope.$on('toggleTransQueue', function ($event, isShow, currentTab) {
            if (!angular.isUndefined(currentTab)) {
                var tab = _.findWhere($scope.tabs, {name: currentTab});
                if (tab && !tab.selected) {
                    tab.active = true;
                }
                if (tab == 'upload') {
                    $scope.scrollToUploadIndex = $scope.uploadList.length - 1;
                } else if (tab === 'download') {
                    $scope.scrollToDownloadIndex = $scope.downloadList.length - 1;
                }
            }
        });

        //打开日志文件夹
        $scope.openLogFolder = function () {
            OSS.invoke('openLogFolder');
        };

        //错误日志
        $scope.errorLog = '';
        var selectCount = 0;
        $scope.selectTab = function (tab) {
            //if(tab.name != 'upload' && !$scope.OSSUploadQueue.isStoped()){
            //    $scope.OSSUploadQueue.stop();
            //}
            //if (tab.name != 'download' && !$scope.OSSDownloadQueue.isStoped()) {
            //    $scope.OSSDownloadQueue.stop();
            //}
            if (tab.name == 'log') {
                var errorLog = '';
                var res = OSS.invoke('getErrorLog');
                if (res && res.list && res.list.length) {
                    angular.forEach(res.list, function (val) {
                        errorLog += val.msg + '\r\n';
                    });
                    $scope.errorLog = errorLog;
                }
            } else if (tab.name == 'upload') {
                //上传队列
                //if($scope.OSSUploadQueue.isStoped()){
                //    $scope.OSSUploadQueue.refresh();
                //}
            } else if (tab.name == 'download') {
                //下载队列
                //if ($scope.OSSDownloadQueue.isStoped()) {
                //    $scope.OSSDownloadQueue.refresh();
                //}
            }
            if (!$rootScope.showTransQueue && selectCount > 0) {
                $scope.$emit('toggleTransQueue', true);
            }
            selectCount++;
        };

        //执行下载队列的操作命令
        $scope.executeDownloadCmd = function (cmd, item) {
            var menu = OSSQueueMenu.getDownloadMenuItem(cmd);
            if (menu) {
                menu.execute([item]);
            }
        };

        //执行上传队列的操作命令
        $scope.executeUploadCmd = function (cmd, item) {
            var menu = OSSQueueMenu.getUploadMenuItem(cmd);
            if (menu) {
                menu.execute([item]);
            }
        };
        var excludeMenus = [];
        //是否是顶部要排除的menu
        $scope.isExcludeTopMenu = function (menu) {
            return _.indexOf(excludeMenus, menu.name) >= 0;
        };

        //清空已完成
        $scope.clearDone = function (type) {
            var menu, list = [];
            if (type == 'download') {
                menu = OSSQueueMenu.getDownloadMenuItem('remove');
                list = _.filter($scope.downloadList, function (item) {
                    return _.indexOf([4, 5], item.status) >= 0;
                });

            } else {
                menu = OSSQueueMenu.getUploadMenuItem('remove');
                list = _.filter($scope.uploadList, function (item) {
                    return _.indexOf([4, 5], item.status) >= 0;
                });
            }
            if (menu && list.length) {
                menu.execute(list);
            }
        };

    }])
/**
 * 文件列表
 */
    .controller('FileListCtrl', ['$scope', '$routeParams', 'OSSApi', 'buckets', '$rootScope', 'OSSObject', 'OSSMenu', 'Bucket', '$route', '$location', 'OSSLocation', 'usSpinnerService', '$filter', 'OSSException','$timeout', function ($scope, $routeParams, OSSApi, buckets, $rootScope, OSSObject, OSSMenu, Bucket, $route, $location, OSSLocation, usSpinnerService, $filter, OSSException,$timeout) {
        var bucketName = $routeParams.bucket || '',
            keyword = $routeParams.keyword || '',
            prefix = '',
            delimiter = '/',
            isSearch = false,
            loadFileCount = 50,
            lastLoadMaker = '',
            isAllFileLoaded = false;

        //默认排序
        $scope.orderBy = '';

        //默认去第一个bucket
        if (buckets.length && !bucketName) {
            $location.path(OSSLocation.getUrl(buckets[0].Name));
            return;
        }

        $scope.bucket = Bucket.getBucket(bucketName);
        $scope.objectPrefix = $routeParams.object ? $routeParams.object : '';
        OSSObject.setCurrentObject({
            path: $scope.objectPrefix,
            dir: 1
        });

        if (keyword.length) {
            prefix = keyword;
            isSearch = true;
        } else {
            prefix = $scope.objectPrefix;
            isSearch = false;
        }

        //获取文件列表
        $scope.files = [];
        var loadFile = function () {
            if ($scope.loadingFile) {
                return;
            }
            $scope.loadingFile = true;
            usSpinnerService.spin('file-list-spinner');
            OSSObject.list($scope.bucket, prefix, delimiter, lastLoadMaker, loadFileCount).then(function (res) {
                $scope.loadingFile = false;
                $scope.files = $filter('orderBy')($scope.files.concat(res.files), $scope.orderBy);
                lastLoadMaker = res.marker;
                isAllFileLoaded = res.allLoaded;
                usSpinnerService.stop('file-list-spinner');

            }, function (res,status) {
                //$scope.$emit('showError',OSSException.getError(res,status).msg);
                $scope.$emit('showError','无法访问该Bucket');
                $scope.loadingFile = false;
                usSpinnerService.stop('file-list-spinner');
            });
        };
        loadFile();

        //打开文件（夹）
        $scope.openFile = function (file, isDir) {
            if (isDir == 1) {
                OSSObject.open($scope.bucket, file.path, isDir);
            } else {
                var menu = OSSMenu.getMenu('download');
                if (menu) {
                    menu.execute($scope.bucket, $scope.objectPrefix, [file]);
                }
            }
        };

        //加载更多文件
        $scope.loadMoreFile = function () {
            if (isAllFileLoaded) {
                return;
            }
            loadFile();
        };

        $scope.$watch('orderBy', function (val) {
            $scope.files = $filter('orderBy')($scope.files, val);
        });

        $scope.enableKeyBoardNav = 1;

        //获取以选中的列表
        $scope.getSelectedList = function () {
            return _.where($scope.files, {
                selected: true
            })
        };

        //选中
        $scope.select = function (item) {
            item.selected = true;
            $scope.scrollToIndex = _.indexOf($scope.files, item);
        };

        //取消选中
        $scope.unSelect = function (item) {
            item.selected = false;
        };

        //取消所有选中
        $scope.unSelectAll = function () {
            angular.forEach($scope.getSelectedList(), function (item) {
                $scope.unSelect(item);
            });
        };

        $scope.shiftLastIndex = 0;

        //点击文件
        $scope.handleClick = function ($event, file, index) {
            if ($event.ctrlKey || $event.metaKey) {
                if (file.selected) {
                    $scope.unSelect(file);
                } else {
                    $scope.select(file);
                }
            } else if ($event.shiftKey) {
                var lastIndex = $scope.shiftLastIndex;
                $scope.unSelectAll();
                if (index > lastIndex) {
                    for (var i = lastIndex; i <= index; i++) {
                        $scope.select($scope.files[i]);
                    }
                } else if (index < lastIndex) {
                    for (var i = index; i <= lastIndex; i++) {
                        $scope.select($scope.files[i]);
                    }
                }

            } else {
                $scope.unSelectAll();
                $scope.select(file);
            }

            if (!$event.shiftKey) {
                $scope.shiftLastIndex = index;
            }
        };

        $scope.onContextMenuShow = function (file) {
            if (!file.selected) {
                $scope.unSelectAll();
                $scope.select(file);
            }
        };

        //当前文件夹的菜单
        $scope.currentFileMenuList = OSSMenu.getCurrentFileMenu();

        //选中文件的菜单
        $scope.selectFileMenuList = OSSMenu.getSelectFileMenu();

        //将menu组合成group
        $scope.menuGroups = OSSMenu.groupMenu(_.union($scope.currentFileMenuList, $scope.selectFileMenuList));

        //顶部菜单要排除不显示的菜单
        $scope.excludeTopMenu = OSSMenu.getTopExcludeMenus();

        //是否是要排除的菜单
        $scope.isExclude = function (menu) {
            return $scope.excludeTopMenu.indexOf(menu.name) >= 0;
        };

        //刷新当前列表
        $scope.$on('reloadFileList', function () {
            $route.reload();
        });


        //向当前列表中添加object
        $scope.$on('createObject', function (event, callback) {
            $timeout(function(){
                $scope.showCreateFile = true;
                $scope.createFileCallback = callback;
            });
        });

        //向当前列表中添加object
        $scope.$on('addObject', function (event, objects, selected) {
            objects = $.isArray(objects) ? objects : [objects];
            var addFiles = _.map(objects, OSSObject.format);
            angular.forEach(addFiles, function (file) {
                $scope.files.push(file);
                if (selected) {
                    $scope.select(file);
                }
            })
        });

        //从当前列表中移除object
        $scope.$on('removeObject', function (event, objects) {
            angular.forEach(objects, function (object) {
                Util.Array.removeByValue($scope.files, object);
            })
        });

        //拖拽文件上传
        $scope.handleSysDrop = function () {

            var dragFiles = OSS.invoke('getDragFiles');
            var params = {
                location: $scope.bucket['Location'],
                bucket: $scope.bucket['Name'],
                prefix: $scope.objectPrefix,
                list: dragFiles['list']
            };
            OSS.invoke('addFile', params, function (res) {
                if (!res.error) {
                    $rootScope.$broadcast('toggleTransQueue', true);
                    $rootScope.$broadcast('reloadUploadQueue');
                } else {
                    $rootScope.$broadcast('showError', OSSException.getClientErrorMsg(res));
                }
            });
        };

    }])
/**
 * 上传碎片管理
 */
    .controller('UploadListCtrl', ['$scope', '$routeParams', 'OSSUploadPart', 'Bucket', 'OSSUploadMenu','OSSException', function ($scope, $routeParams, OSSUploadPart, Bucket, OSSUploadMenu,OSSException) {

        //是否加载中
        $scope.loading = false;

        //是否所有upload已加载完
        var isAllLoaded = false;

        //最近一次加载的起始位置
        var lastKeyMaker = '';

        var lastUploadMaker = '';

        //一次加载数量
        var loadCount = 100;

        //当前的bucket
        var bucketName = $routeParams.bucket;

        //加载upload列表
        var loadUploads = function () {
            if ($scope.loading) {
                return;
            }
            $scope.loading = true;
            OSSUploadPart.list(Bucket.getBucket(bucketName), '', '', lastKeyMaker, loadCount, lastUploadMaker).then(function (res) {
                $scope.loading = false;
                $scope.uploads = $scope.uploads.concat(res.uploads);
                lastKeyMaker = res.keyMaker;
                lastUploadMaker = res.uploadIdMaker;
                isAllLoaded = res.allLoaded;
            }, function (res,status) {
                $scope.loadingFile = false;
                $scope.$emit('showError',OSSException.getError(res,status).msg);
            });
        };

        //碎片列表
        $scope.uploads = [];

        //加载更多upload
        $scope.loadMoreUpload = function () {
            if (isAllLoaded) {
                return;
            }
            loadUploads();
        };

        //初始加载
        loadUploads();

        $scope.enableKeyBoardNav = 1;

        //获取以选中的列表
        $scope.getSelectedList = function () {
            return _.where($scope.uploads, {
                selected: true
            })
        };

        //选中
        $scope.select = function (item) {
            item.selected = true;
            $scope.scrollToIndex = _.indexOf($scope.uploads, item);
        };

        //取消选中
        $scope.unSelect = function (item) {
            item.selected = false;
        };

        //取消所有选中
        $scope.unSelectAll = function () {
            angular.forEach($scope.getSelectedList(), function (item) {
                $scope.unSelect(item);
            });
        };

        //点击uploaditem
        $scope.handleClick = function ($event, upload, index) {
            if ($event.ctrlKey || $event.metaKey) {
                if (upload.selected) {
                    $scope.unSelect(upload);
                } else {
                    $scope.select(upload);
                }
            } else if ($event.shiftKey) {
                var lastIndex = $scope.shiftLastIndex;
                $scope.unSelectAll();
                if (index > lastIndex) {
                    for (var i = lastIndex; i <= index; i++) {
                        $scope.select($scope.uploads[i]);
                    }
                } else if (index < lastIndex) {
                    for (var i = index; i <= lastIndex; i++) {
                        $scope.select($scope.uploads[i]);
                    }
                }

            } else {
                $scope.unSelectAll();
                $scope.select(upload);
            }

            if (!$event.shiftKey) {
                $scope.shiftLastIndex = index;
            }
        };

        $scope.topMenuList = OSSUploadMenu.getAllMenu();

        $scope.$on('removeUpload', function (event, uploads) {
            if (!angular.isArray(uploads)) {
                uploads = [uploads];
            }
            angular.forEach(uploads, function (upload) {
                var index = _.indexOf($scope.uploads, upload);
                index >= 0 && $scope.uploads.splice(index, 1);
            });
        })

        $scope.onContextMenuShow = function (upload) {
            if (!upload.selected) {
                $scope.unSelectAll();
                $scope.select(upload);
            }
        };

    }]);
