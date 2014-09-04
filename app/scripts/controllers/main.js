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

        //显示新建bucket对话框
        $scope.showAddBucketModal = function(){
            OSSModal.addBucket();
        }

    });
