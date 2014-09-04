'use strict';

/**
 * @ngdoc service
 * @name ossClientUiApp.service
 * @description
 * # service
 * Factory in the ossClientUiApp.
 */
angular.module('ossClientUiApp')
    .factory('OSSApi', function ($http) {

        var OSSAccessKeyId = OSS.invoke('getAccessID');

        var getExpires = function (expires) {
            expires = angular.isUndefined(expires) ? 60 : expires;
            return parseInt(new Date().getTime() / 1000) + expires;
        };

        var getRequestUrl = function (host, expires, signature) {
            return host + '?' + $.param({
                OSSAccessKeyId: OSSAccessKeyId,
                Expires: expires,
                Signature: signature
            });
        };

        return {
            getBuckets: function () {

                var expires = getExpires();
                var signature = OSS.invoke('getSignature', {
                    verb: 'GET',
                    content_md5: '',
                    content_type: '',
                    expires: expires,
                    canonicalized_oss_headers: '',
                    canonicalized_resource: '/'
                });

                var requestUrl = getRequestUrl('https://oss.aliyuncs.com/', expires, signature);
                return $http.get(requestUrl);
            }
        };
    })
    .factory('OSSModal', function ($modal) {
        var defaultOption = {
            backdrop: 'static'
        };
        return {
            addBucket: function () {
                var option = {
                    templateUrl: 'views/add_bucket_modal.html',
                    windowClass: 'add_bucket_modal',
                    controller: function ($scope, $modalInstance) {

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            }
        }
    });
