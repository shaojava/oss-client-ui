'use strict';

/**
 * @ngdoc function
 * @name ossClientUiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ossClientUiApp
 */
angular.module('ossClientUiApp')

    .controller('MainCtrl', function ($scope, OSSApi, OSSModal) {

        $scope.buckets = [];

        //获取所有bucket列表
        OSSApi.getBuckets().success(function (res) {
            var buckets = res['ListAllMyBucketsResult']['Buckets']['Bucket'];
            $scope.buckets = angular.isArray(buckets) ? buckets : [buckets];
        });

        //新建bucket对话框
        $scope.showAddBucketModal = function () {
            OSSModal.addBucket().result.then(function (bucket) {
                $scope.buckets.push(bucket);
            });
        };

        $scope.editBucket = function (bucket) {
            OSSModal.addBucket(bucket).result.then(function (bucket) {

            });
        };

    });
