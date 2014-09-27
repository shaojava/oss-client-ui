'use strict';

/**
 * @ngdoc function
 * @name ossClientUiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ossClientUiApp
 */
angular.module('ossClientUiApp')
    .run(['$rootScope', function ($rootScope) {
        $rootScope.PAGE_CONFIG = {};
    }])
    .controller('MainCtrl', ['$scope', 'OSSApi', 'OSSModal', 'Bucket', 'Bread', 'OSSLocationHistory', '$rootScope','$filter', function ($scope, OSSApi, OSSModal, Bucket, Bread, OSSLocationHistory, $rootScope,$filter) {

        //获取所有bucket列表
        $scope.buckets = [];
        Bucket.list().then(function (buckets) {
            $scope.buckets = angular.isArray(buckets) ? buckets : [buckets];
        })

        //新建bucket对话框
        $scope.showAddBucketModal = function () {
            OSSModal.addBucket().result.then(function (param) {
                if (param.act == 'add') {
                    $scope.buckets.push(param.bucket);
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

        //面包屑
        $scope.breads = [];
        $scope.$watchCollection('[PAGE_CONFIG.bucket,PAGE_CONFIG.objectPrefix]', function (newArr) {
            if (!newArr[0]) return;
            var bucket = newArr[0], objectPrefix = newArr[1];
            $scope.breads = Bread.getBreads(bucket['Name'], objectPrefix);
            $scope.historyCanForward = OSSLocationHistory.canForward();
            $scope.historyCanBackward = OSSLocationHistory.canBackward();


        });

        //后退
        $scope.backward = function () {
            OSSLocationHistory.backward();
        };

        //前进
        $scope.forward = function () {
            OSSLocationHistory.forward();
        };

    }])
    .controller('TransQueueCtrl', ['$scope', '$interval', 'OSSQueueMenu', 'OSSUploadQueue', 'OSSDownloadQueue', function ($scope, $interval, OSSQueueMenu, OSSUploadQueue, OSSDownloadQueue) {

        //上传速度
        $scope.uploadSpeed = 0;

        //下载速度
        $scope.downloadSpeed = 0;

        //上传队列总数
        $scope.uploadCount = 0;

        //下载队列总数
        $scope.downloadCount = 0;

        //选中的上传条目
        $scope.selectedUploadItems = [];

        //选中的下载条目
        $scope.selectedDownloadItems = [];

        //上传的操作菜单
        $scope.uploadQueueMenus = OSSQueueMenu.getUploadMenu();

        //下载的操作菜单
        $scope.downloadQueueMenus = OSSQueueMenu.getDownloadMenu();

        $scope.onUploadItemSelect = function ($event, item) {
            console.log('arguments', arguments);
            $scope.selectedUploadItems = _.where($scope.uploadList, {
                selected: true
            });
        };

        $scope.onDownloadItemSelect = function ($event, item) {
            $scope.selectedDownloadItems = _.where($scope.downloadList, {
                selected: true
            });
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
        })

        //上传队列
        $scope.uploadList = OSSUploadQueue.init();
        OSSUploadQueue.refresh();

        //下载队列
        $scope.downloadList = OSSDownloadQueue.init();
        OSSDownloadQueue.refresh();

    }])
    .controller('FileListCtrl', ['$scope', '$routeParams', 'OSSApi', 'buckets', '$rootScope', 'OSSObject', 'OSSMenu', function ($scope, $routeParams, OSSApi, buckets, $rootScope, OSSObject, OSSMenu) {
        var bucketName = $routeParams.bucket ? $routeParams.bucket : buckets && buckets.length ? buckets[0]['Name'] : '',
            keyword = $routeParams.keyword || '',
            prefix = '',
            delimiter = '/',
            isSearch = false,
            loadFileCount = 20,
            lastLoadMaker = '',
            isAllFileLoaded = false;

        $rootScope.PAGE_CONFIG.bucket = Util.Array.getObjectByKeyValue($scope.buckets, 'Name', bucketName);
        $rootScope.PAGE_CONFIG.objectPrefix = $routeParams.object ? $routeParams.object : '';

        if (keyword.length) {
            prefix = keyword;
            isSearch = true;
        } else {
            prefix = $rootScope.PAGE_CONFIG.objectPrefix;
            isSearch = false;
        }

        //获取文件列表
        $scope.files = [];
        var loadFile = function () {
            if ($scope.loadingFile) {
                return;
            }
            $scope.loadingFile = true;
            OSSObject.list($rootScope.PAGE_CONFIG.bucket, prefix, delimiter, lastLoadMaker, loadFileCount).then(function (res) {
                $scope.loadingFile = false;
                $scope.files = $scope.files.concat(res.files);
                lastLoadMaker = res.marker;
                isAllFileLoaded = res.allLoaded;
            }, function () {
                $scope.loadingFile = false;
            });
        };
        loadFile();

        //打开文件（夹）
        $scope.openFile = function (file, isDir) {
            OSSObject.open($rootScope.PAGE_CONFIG.bucket, file.path, isDir);
        };

        //加载更多文件
        $scope.loadMoreFile = function () {
            if (isAllFileLoaded) {
                return;
            }
            loadFile();
        };

        //已选中文件列表
        $scope.selectedFiles = [];

        //点击文件
        $scope.handleClick = function (file) {
            var index = $scope.selectedFiles.indexOf(file);
            if (index >= 0) {
                $scope.selectedFiles.splice(index, 1);
            } else {
                //$scope.selectedFiles = [];
                $scope.selectedFiles.push(file);
            }
        };

        $scope.topMenuList = OSSMenu.getAllMenu();

        //右键菜单
        $scope.contextMenu = [];
    }]);
