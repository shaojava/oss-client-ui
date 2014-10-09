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
    .controller('MainCtrl', ['$scope', 'OSSApi', 'OSSModal', 'Bucket', 'Bread', 'OSSLocationHistory', '$rootScope', '$filter', function ($scope, OSSApi, OSSModal, Bucket, Bread, OSSLocationHistory, $rootScope, $filter) {

        //获取所有bucket列表
        $scope.buckets = [];
        Bucket.list().then(function (buckets) {
            $scope.buckets = angular.isArray(buckets) ? buckets : [buckets];
        });

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

        //后退
        $scope.backward = function () {
            OSSLocationHistory.backward();
        };

        //前进
        $scope.forward = function () {
            OSSLocationHistory.forward();
        };


        $scope.$on('$routeChangeSuccess', function (event, current, prev) {
            if (prev && prev.params) {
                var oldBucket = Bucket.getBucket(prev.params.bucket);
                oldBucket && Bucket.unselected(oldBucket);
            }
            if (current && current.params) {
                var pathArr = current.$$route.originalPath.split('/');
                var currentBucket = Bucket.getBucket(current.params.bucket);
                currentBucket && Bucket.select(currentBucket);
                $scope.breads = Bread.getBreads(currentBucket.Name, current.params.object, pathArr[2]);
                $scope.historyCanForward = OSSLocationHistory.canForward();
                $scope.historyCanBackward = OSSLocationHistory.canBackward();
            }
        })

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
    }])
    .controller('UploadListCtrl', ['$scope', '$routeParams', 'OSSUploadPart', 'Bucket', 'OSSUploadMenu', function ($scope, $routeParams, OSSUploadPart, Bucket, OSSUploadMenu) {

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
                console.log('res',res);
                $scope.loading = false;
                $scope.uploads = $scope.uploads.concat(res.uploads);
                lastKeyMaker = res.keyMaker;
                lastUploadMaker = res.uploadIdMaker;
                isAllLoaded = res.allLoaded;
            }, function () {
                $scope.loadingFile = false;
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

        //已选中upload列表
        $scope.selectedUploads = [];

        //初始加载
        loadUploads();

        //点击uploaditem
        $scope.handleClick = function (upload) {
            upload.selected = !upload.selected;
        };

        $scope.topMenuList = OSSUploadMenu.getAllMenu();

        $scope.$watch('uploads', function () {
            $scope.selectedUploads = _.where($scope.uploads, {
                selected: true
            });
        }, true);

        $scope.$on('removeUpload', function (event, uploads) {
            if (!angular.isArray(uploads)) {
                uploads = [uploads];
            }
            angular.forEach(uploads, function (upload) {
                var index = _.indexOf($scope.uploads, upload);
                index >= 0 && $scope.uploads.splice(index, 1);
            });
        })

    }]);
