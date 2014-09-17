'use strict';

/**
 * @ngdoc function
 * @name ossClientUiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ossClientUiApp
 */
angular.module('ossClientUiApp')
    .run(function ($rootScope) {
        $rootScope.PAGE_CONFIG = {};
    })
    .controller('MainCtrl', function ($scope, OSSApi, OSSModal, Bucket, Bread, OSSLocationHistory, OSSMenu,$rootScope) {

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

            //顶部操作菜单
            $scope.topMenuList = OSSMenu.getMenu(bucket, objectPrefix);
        });

        //后退
        $scope.backward = function () {
            OSSLocationHistory.backward();
        };

        //前进
        $scope.forward = function () {
            OSSLocationHistory.forward();
        };

        //执行操作
        $scope.execCMD = function (cmd) {
            var args = [];
            if (cmd == 'upload') {
                args = [$rootScope.PAGE_CONFIG.bucket['Name'], $rootScope.PAGE_CONFIG.bucket['Location'], $rootScope.PAGE_CONFIG.objectPrefix];
            }
            OSSMenu.exec(cmd, args);
        }

        //右键菜单
        $scope.contextMenu = [];
    })
    .controller('FileListCtrl', function ($scope, $routeParams, OSSApi, buckets, $rootScope, OSSObject) {
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
        }
        loadFile();

        //打开文件（夹）
        $scope.openFile = function (file, isDir) {
            OSSObject.open($rootScope.PAGE_CONFIG.bucket, file.path, isDir);
        }

        //加载更多文件
        $scope.loadMoreFile = function () {
            if (isAllFileLoaded) {
                return;
            }
            loadFile();
        }

    });
