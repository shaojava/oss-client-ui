'use strict';

/**
 * @ngdoc function
 * @name ossClientUiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ossClientUiApp
 */
angular.module('ossClientUiApp')
    .run(function(){

    })
    .controller('MainCtrl', function ($scope, $http) {

        $scope.buckets = [];

        //获取所有bucket列表
        $http.get('test/buckets.xml').success(function(response){
            var data = $.xml2json(response);
            console.log('data',data);
            $scope.buckets = data['ListAllMyBucketsResult']['Buckets']['Bucket'];

        })
    });
