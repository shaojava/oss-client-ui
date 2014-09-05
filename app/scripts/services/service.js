'use strict';

/**
 * @ngdoc service
 * @name ossClientUiApp.service
 * @description
 * # service
 * Factory in the ossClientUiApp.
 */
angular.module('ossClientUiApp')
    .factory('RequestXML', function () {

        return {
            getXMLHeader: function () {
                return '<?xml version="1.0" encoding="UTF-8"?>';
            },
            getCreateBucketXML: function (region) {
                return [
                    this.getXMLHeader(),
                    "<CreateBucketConfiguration >",
                    "<LocationConstraint >",
                    region,
                    "</LocationConstraint >",
                    "</CreateBucketConfiguration >"
                ].join('');
            }
        }
    })
    .factory('Bucket', function () {
        return {
            getRegions: function () {
                return {
                    'oss-cn-hangzhou-a': '杭州',
                    'oss-cn-qingdao-a': '青岛',
                    'oss-cn-beijing-a': '北京',
                    'oss-cn-hongkong-a': '香港',
                    'oss-cn-shenzhen-a': '深圳'
                };
            },
            getAcls: function () {
                return {
                    "public-read-write": "公共读写",
                    "public-read": "公共读",
                    "private": "私有"
                }
            }
        }
    })
    .factory('OSSApi', function ($http, RequestXML) {

        var OSSAccessKeyId = OSS.invoke('getAccessID');

        var getOSSHost = function (bucket, region, object, https) {
            //https = angular.isUndefined(https) ? true : https;
            https = angular.isUndefined(https) ? false : https;
            region = angular.isUndefined(region) ? "" : region;
            object = angular.isUndefined(object) ? "" : object;
            var protocol = https ? 'https:' : ["https:", "http:"].indexOf(location.protocol) >= 0 ? location.protocol : "https:";
            return protocol + '//' + (bucket ? bucket + "." : "") + (region ? region + "." : "") + 'aliyuncs.com' + object;

        };

        var getExpires = function (expires) {
            expires = angular.isUndefined(expires) ? 60 : expires;
            return parseInt(new Date().getTime() / 1000) + expires;
        };

        var getRequestUrl = function (host, expires, signature, resource) {
            return host + '?' + (resource ? resource + '&' : '') + $.param({
                OSSAccessKeyId: OSSAccessKeyId,
                Expires: expires,
                Signature: signature
            });
        };

        return {
            getBuckets: function () {

                var expires = getExpires();
                var host = getOSSHost("oss", "", "/");
                OSS.log('host', host);
                var signature = OSS.invoke('getSignature', {
                    verb: 'GET',
                    content_md5: '',
                    content_type: '',
                    expires: expires,
                    canonicalized_oss_headers: '',
                    canonicalized_resource: '/'
                });

                var requestUrl = getRequestUrl(host, expires, signature);
                return $http.get(requestUrl);

            },
            createBucket: function (bucketName, region, acl) {

                var expires = getExpires();
                var host = getOSSHost(bucketName, region);

                var canonicalizedOSSheaders = {
                    'x-oss-acl': acl
                };
                var contentType = 'application/xml';
                var signature = OSS.invoke('getSignature', {
                    verb: 'PUT',
                    content_md5: '',
                    content_type: contentType,
                    expires: expires,
                    canonicalized_oss_headers: canonicalizedOSSheaders,
                    canonicalized_resource: '/' + bucketName + '/'
                });

                var requestUrl = getRequestUrl(host, expires, signature);
                var headers = angular.extend({}, canonicalizedOSSheaders, {
                    'Content-Type': contentType
                });
                return $http.put(requestUrl, RequestXML.getCreateBucketXML(region), {
                    headers: headers
                });
            },
            getBucketAcl: function (bucket) {
                var expires = getExpires();
                var host = getOSSHost(bucket.Name, bucket.Location);
                var canonicalizedOSSheaders = '';
                var contentType = '';
                var signature = OSS.invoke('getSignature', {
                    verb: 'GET',
                    content_md5: '',
                    content_type: contentType,
                    expires: expires,
                    canonicalized_oss_headers: canonicalizedOSSheaders,
                    canonicalized_resource: '/' + bucket.Name + '/?acl'
                });

                var requestUrl = getRequestUrl(host, expires, signature, 'acl');
                var headers = angular.extend({}, canonicalizedOSSheaders, {
                    'Content-Type': contentType
                });
                return $http.get(requestUrl, "", {
                    headers: headers
                });
            },
            editBucket: function (bucket, acl) {

                var expires = getExpires();
                var host = getOSSHost(bucket.Name, bucket.Location);
                var canonicalizedOSSheaders = {
                    'x-oss-acl': acl
                };
                var contentType = 'application/xml';
                var signature = OSS.invoke('getSignature', {
                    verb: 'PUT',
                    content_md5: '',
                    content_type: contentType,
                    expires: expires,
                    canonicalized_oss_headers: canonicalizedOSSheaders,
                    canonicalized_resource: '/' + bucket.Name + '/'
                });

                var requestUrl = getRequestUrl(host, expires, signature);
                var headers = angular.extend({}, canonicalizedOSSheaders, {
                    'Content-Type': contentType
                });
                return $http.put(requestUrl, "", {
                    headers: headers
                });
            }
        };
    })
    .factory('OSSModal', function ($modal, Bucket, OSSApi,usSpinnerService) {
        var defaultOption = {
            backdrop: 'static'
        };
        return {
            /**
             * 新建或编辑bucket
             * @param bucket 如果传了bucket就是编辑
             * @returns {*}
             */
            addBucket: function (bucket) {
                var option = {
                    templateUrl: 'views/add_bucket_modal.html',
                    windowClass: 'add_bucket_modal',
                    controller: function ($scope, $modalInstance) {
                        $scope.loading = false;
                        $scope.bucket = bucket;

                        var acls = [], regions = [];
                        angular.forEach(Bucket.getAcls(), function (val, key) {
                            acls.push({
                                name: val,
                                value: key
                            })
                        });

                        $scope.acls = acls;
                        if (!bucket) {
                            $scope.acl = $scope.acls[0];
                        }

                        angular.forEach(Bucket.getRegions(), function (val, key) {
                            regions.push({
                                name: val,
                                value: key
                            })
                        });

                        $scope.regions = regions;
                        if (!bucket) {
                            $scope.region = $scope.regions[0];
                        } else {
                            $scope.region = Util.Array.getObjectByKeyValue($scope.regions, 'value', bucket.Location);
                        }

                        //获取ACl信息
                        if ($scope.bucket) {
                            $scope.loading = true;
                            OSSApi.getBucketAcl(bucket).success(function (res) {
                                $scope.loading = false;
                                console.log('res', res);
                                $scope.acl = Util.Array.getObjectByKeyValue($scope.acls, 'value',res["AccessControlPolicy"]["AccessControlList"]["Grant"]);
                            });
                        } else {
                            $scope.loading = true;
                        }

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.createBucket = function (bucketName, region, acl) {
                            OSSApi.createBucket(bucketName, region.value, acl.value).success(function () {
                                $modalInstance.close({
                                    Name: bucketName,
                                    Location: region.value,
                                    Acl: acl.value
                                });
                            });
                        };

                        $scope.editBucket = function (acl) {
                            OSSApi.editBucket(bucket, acl.value).success(function () {
                                angular.extend(bucket, {
                                    Acl: acl.value
                                })
                                $modalInstance.close(bucket);
                            });
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            }
        }
    });
