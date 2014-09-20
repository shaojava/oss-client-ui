'use strict';

/**
 * @ngdoc service
 * @name ossClientUiApp.service
 * @description
 * # service
 * Factory in the ossClientUiApp.
 */
angular.module('ossClientUiApp')
    .factory('OSSQueue', function () {
        return {
            uploadList: function () {
                return OSS.invoke('getUpload');
            },

            downloadList: function () {
                return OSS.invoke('getDownload');
            }
        };
    })
    .factory('OSSCmd', function () {
        return {
            upload: function (bucketName, location, prefix) {
                OSS.invoke('selectFileDlg', {
                    path: '',
                    disable_root: 1
                }, function (res) {
                    if (!res || !res['list'] || !res['list'].length) {
                        return;
                    }
                    OSS.invoke('addFile', {
                        location: location,
                        bucket: bucketName,
                        prefix: prefix,
                        list: res['list']
                    }, function (res) {

                    })
                });
            },

            download: function (objects) {
                OSS.invoke('saveFile', {
                    list: objects
                }, function (res) {

                })
            },
            create: function (bucket, prefix, newFolder) {

            },
            setHttpHeader: function (bucket, object) {

            },
            del: function (bucket, objects) {

            },
            getUri: function (bucket, object) {

            }
        };
    })
    .factory('OSSMenu', ['OSSCmd', function (OSSCmd) {
        var allMenu = {
            'upload': {
                name: 'upload',
                text: '上传'
            },
            'create': {
                name: 'create',
                text: '新建文件夹'
            },
            'download': {
                name: 'download',
                text: '下载'
            },
            'get_uri': {
                name: 'get_uri',
                text: '获取地址'
            },
            'set_header': {
                name: 'set_header',
                text: '设置HTTP头'
            },
            'del': {
                name: 'del',
                text: '删除'
            }
        };
        return {
            getDefaultMenus: function () {
                return _.keys(allMenu);
            },
            checkPermission: function () {
                return true;
            },
            getMenu: function (bucket, currentObject, selectedObjects) {
                var menu = this.getDefaultMenus(),
                    currentMenu = this.getCurrentMenu(menu);
                if (!selectedObjects || !selectedObjects.length) {
                    return this.calculateMenu(currentMenu);
                } else {
                    var selectedMenu = this.getSelectMenu(menu);
                    if (selectedObjects.length == 1) {
                        return this.calculateMenu(currentMenu, selectedMenu);
                    } else {
                        return this.calculateMenu(currentMenu, selectedMenu, this.getMultiSelectMenu(menu));
                    }
                }
            },
            calculateMenu: function () {
                var menus = [];
                var calculatedMenu = _.prototype.union.apply(this,Array.prototype.slice.call(arguments));
                angular.forEach(allMenu,function(val,key){
                    if(_.indexOf(calculatedMenu,key) < 0){
                        val.disabled = 1;
                    }else{
                        val.disabled =0;
                    }
                    menus.push(val);
                })
                return menus;
            },
            getCurrentMenu: function (menu) {
                return this.disableMenu(menu, 'download', 'get_uri', 'set_header', 'del');
            },
            getMultiSelectMenu: function (menu) {
                return this.disableMenu(menu, 'upload', 'create', 'get_uri', 'set_header');
            },
            getSelectMenu: function (menu) {
                return this.disableMenu(menu, 'upload', 'create');
            },
            disableMenu: function (menu) {
                var disableOpts = Array.prototype.slice.call(arguments).splice(1);
                 disableOpts.unshift(menu);
                return _.without.apply(this,disableOpts);
            },
            exec: function (cmd, args) {
                if (!angular.isFunction(OSSCmd[cmd])) {
                    return;
                }
                if (!this.checkPermission(cmd)) {
                    return;
                }
                OSSCmd[cmd].apply(this, args);
            }
        };
    }])
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
    .factory('OSSObject', ['$location', '$filter', 'OSSApi', '$q', function ($location, $filter, OSSApi, $q) {
        var fileSorts = {
            'SORT_SPEC': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'ai', 'cdr', 'psd', 'dmg', 'iso', 'md', 'ipa', 'apk', 'gknote'],
            'SORT_MOVIE': ['mp4', 'mkv', 'rm', 'rmvb', 'avi', '3gp', 'flv', 'wmv', 'asf', 'mpeg', 'mpg', 'mov', 'ts', 'm4v'],
            'SORT_MUSIC': ['mp3', 'wma', 'wav', 'flac', 'ape', 'ogg', 'aac', 'm4a'],
            'SORT_IMAGE': ['jpg', 'png', 'jpeg', 'gif', 'psd', 'bmp', 'ai', 'cdr'],
            'SORT_DOCUMENT': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'odt', 'rtf', 'ods', 'csv', 'odp', 'txt', 'gknote'],
            'SORT_CODE': ['js', 'c', 'cpp', 'h', 'cs', 'vb', 'vbs', 'java', 'sql', 'ruby', 'php', 'asp', 'aspx', 'html', 'htm', 'py', 'jsp', 'pl', 'rb', 'm', 'css', 'go', 'xml', 'erl', 'lua', 'md'],
            'SORT_ZIP': ['rar', 'zip', '7z', 'cab', 'tar', 'gz', 'iso'],
            'SORT_EXE': ['exe', 'bat', 'com']
        };
        return {
            list: function (bucket, prefix, delimiter, lastLoadMaker, loadFileCount) {
                var _self = this;
                var defer = $q.defer();
                OSSApi.getObjects(bucket, prefix, delimiter, lastLoadMaker, loadFileCount).success(function (res) {
                    OSS.log('list:res', res);
                    var contents = res['ListBucketResult']['Contents'];
                    contents = contents ? angular.isArray(contents) ? contents : contents : [];

                    var commonPrefixes = res['ListBucketResult']['CommonPrefixes'];
                    commonPrefixes = commonPrefixes ? angular.isArray(commonPrefixes) ? commonPrefixes : [commonPrefixes] : [];

                    var files = [];
                    angular.forEach($.merge(contents, commonPrefixes), function (file) {
                        if (file.Key !== prefix && file.Prefix !== prefix) {
                            files.push(_self.format(file));
                        }
                    })
                    defer.resolve({
                        files: files,
                        marker: res['ListBucketResult']['NextMarker'],
                        allLoaded: res['ListBucketResult']['IsTruncated'] === 'false'
                    });

                }).error(function () {

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
                    size: object.Size ? parseInt(object.Size) : 0
                }
            },
            open: function (bucket, path, isDir) {
                if (isDir) {
                    $location.path('/file/' + bucket.Name + '/' + path);
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
                        suffix = 'movie';
                    } else if (jQuery.inArray(ext, sorts['SORT_MUSIC']) > -1) {
                        suffix = 'music';
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
    .factory('OSSLocation', function () {
        return {
            getUrl: function (bucketName, prefix) {
                prefix = angular.isUndefined(prefix) ? '' : prefix;
                return ['/file/', bucketName, '/', prefix].join('');
            }
        };
    })
    .factory('Bread', ['OSSLocation', function (OSSLocation) {
        return {
            getBreads: function (bucketName, path) {
                var breads = [
                    {
                        name: bucketName,
                        url: OSSLocation.getUrl(bucketName)
                    }
                ];
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
        };
    })
    .factory('Bucket', ['OSSApi', '$q', function (OSSApi, $q) {
        var buckets = null;
        var deferred = $q.defer();
        return {
            list: function () {
                if (buckets) {
                    deferred.resolve(deferred);
                } else {
                    OSSApi.getBuckets().success(function (res) {
                        buckets = res['ListAllMyBucketsResult']['Buckets']['Bucket'];
                        deferred.resolve(angular.isArray(buckets) ? buckets : [buckets]);
                    }).error(function () {
                        deferred.reject();
                    });
                }
                return deferred.promise;
            },
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
        };
    }])
    .factory('OSSApi', ['$http', 'RequestXML', function ($http, RequestXML) {

        var OSSAccessKeyId = OSS.invoke('getAccessID');

        var getOSSHost = function (bucket, region, object, https) {
            //https = angular.isUndefined(https) ? true : https;
            https = angular.isUndefined(https) ? false : https;
            region = angular.isUndefined(region) ? "" : region;
            object = angular.isUndefined(object) ? "" : object;
            var protocol = https ? 'https:' : ["https:", "http:"].indexOf(location.protocol) >= 0 ? location.protocol : "http:";
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
                OSS.log('createBucket', arguments);
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
            },
            delBucket: function (bucket) {

                var expires = getExpires();
                var host = getOSSHost(bucket.Name, bucket.Location);
                var canonicalizedOSSheaders = '';
                var contentType = '';
                var signature = OSS.invoke('getSignature', {
                    verb: 'DELETE',
                    content_md5: '',
                    content_type: contentType,
                    expires: expires,
                    canonicalized_oss_headers: canonicalizedOSSheaders,
                    canonicalized_resource: '/' + bucket.Name + '/'
                });

                var requestUrl = getRequestUrl(host, expires, signature);
                var headers = angular.extend({}, canonicalizedOSSheaders);
                return $http.delete(requestUrl, "", {
                    headers: headers
                });
            },
            getObjects: function (bucket, prefix, delimiter, marker, maxKeys) {
                var param = {
                    prefix: prefix
                };
                $.extend(param, {
                    delimiter: delimiter,
                    marker: marker,
                    'max-keys': maxKeys
                })
                var queryStr = $.param(param, true);
                var expires = getExpires();
                var host = getOSSHost(bucket.Name, bucket.Location);
                var canonicalizedOSSheaders = "";
                var signature = OSS.invoke('getSignature', {
                    verb: 'GET',
                    content_md5: '',

                    expires: expires,
                    canonicalized_oss_headers: canonicalizedOSSheaders,
                    canonicalized_resource: '/' + bucket.Name + '/'
                });

                var requestUrl = getRequestUrl(host, expires, signature, queryStr);
                var headers = angular.extend({}, canonicalizedOSSheaders);
                return $http.get(requestUrl, {
                    headers: headers
                });
            }
        };
    }])
    .factory('OSSModal', ['$modal', 'Bucket', 'OSSApi', function ($modal, Bucket, OSSApi) {
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
                                $scope.acl = Util.Array.getObjectByKeyValue($scope.acls, 'value', res["AccessControlPolicy"]["AccessControlList"]["Grant"]);
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
                                    act: 'add',
                                    bucket: {
                                        Name: bucketName,
                                        Location: region.value,
                                        Acl: acl.value
                                    }
                                });
                            });
                        };

                        $scope.editBucket = function (acl) {
                            OSSApi.editBucket(bucket, acl.value).success(function () {
                                angular.extend(bucket, {
                                    Acl: acl.value
                                })
                                $modalInstance.close({
                                    act: 'edit',
                                    bucket: bucket
                                });
                            });
                        };

                        $scope.delBucket = function () {
                            OSSApi.delBucket(bucket).success(function () {
                                $modalInstance.close({
                                    act: 'del',
                                    bucket: bucket
                                });
                            });
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            }
        };
    }]);
