'use strict';

/**
 * @ngdoc service
 * @name ossClientUiApp.service
 * @description
 * # service
 * Factory in the ossClientUiApp.
 */
angular.module('ossClientUiApp')
    .factory('OSSQueueItem', function () {
        return {
            isUploading: function (item) {
                return item.status == 1;
            },
            isWaiting: function (item) {
                return item.status == 2;
            },
            isPause: function (item) {
                return item.status == 3;
            },
            isDone: function (item) {
                return item.status == 4;
            },
            isError: function (item) {
                return item.status == 5;
            }
        };
    })
    .factory('OSSUploadQueue', function ($interval) {
        return {
            items: [],
            uploadCount: 0,
            uploadSpeed: 0,
            downloadSpeed: 0,
            init: function () {
                var res = OSS.invoke('getUpload');
                this.items = res['list'];
                this.uploadCount = res['count'];
                this.uploadSpeed = res['upload'];
                this.downloadSpeed = res['download'];
                return this.items;
            },
            add: function (item) {
                this.items.push(item);
            },
            get: function (bucket, object) {
                return _.findWhere(this.items, {
                    bucket: bucket,
                    object: object
                });
            },
            remove: function (item) {
                var index = _.indexOf(this.items, item);
                if (index > -1) {
                    this.items.splice(index, 1);
                }
            },
            update: function (item, param) {
                angular.extend(item, param);
            },
            refresh: function () {
                var _self = this;
                $interval(function () {
                    var res = OSS.invoke('getUpload', undefined, undefined);
                    angular.forEach(res['list'], function (val) {
                        var existItem = _self.get(val.bucket, val.object);
                        if (existItem) {
                            _self.update(existItem, val);
                        } else {
                            _self.add(val);
                        }
                    })
                    _self.uploadCount = res['count'];
                    _self.uploadSpeed = res['upload'];
                    _self.downloadSpeed = res['download'];
                }, 1000);
            }
        };
    })
    .factory('OSSDownloadQueue', function ($interval) {
        return {
            items: [],
            uploadCount: 0,
            uploadSpeed: 0,
            downloadSpeed: 0,
            init: function () {
                var res = OSS.invoke('getDownload');
                this.items = res['list'];
                this.uploadCount = res['count'];
                this.uploadSpeed = res['upload'];
                this.downloadSpeed = res['download'];
                return this.items;
            },
            add: function (item) {
                this.items.push(item);
            },
            get: function (fullpath) {
                return _.findWhere(this.items, {
                    fullpath: fullpath
                });
            },
            remove: function (item) {
                var index = _.indexOf(this.items, item);
                if (index > -1) {
                    this.items.splice(index, 1);
                }
            },
            update: function (item, param) {
                angular.extend(item, param);
            },
            refresh: function () {
                var _self = this;
                $interval(function () {
                    var res = OSS.invoke('getDownload', undefined, undefined);
                    angular.forEach(res['list'], function (val) {
                        var existItem = _self.get(val.fullpath);
                        if (existItem) {
                            _self.update(existItem, val);
                        } else {
                            _self.add(val);
                        }
                    })
                    _self.uploadCount = res['count'];
                    _self.uploadSpeed = res['upload'];
                    _self.downloadSpeed = res['download'];
                }, 1000);
            }
        };
    })
    .factory('OSSQueueMenu', ['$rootScope', 'OSSQueueItem', function ($rootScope, OSSQueueItem) {
        /**
         * 检测参数的合法性
         * @param selectedItems
         * @returns {boolean}
         */
        var checkArgValid = function (selectedItems) {
            if (!angular.isArray(selectedItems) || !selectedItems.length) {
                return false;
            }
            return true;
        };

        /**
         * 准备uplad的请求参数
         * @param selectedItems
         * @returns {{all: number, list: Array}}
         */
        var prepareUpladParam = function (selectedItems) {
            var param = {
                all: 0,
                list: []
            };
            angular.forEach(selectedItems, function (item) {
                param.list.push({
                    bucket: item.bucket,
                    object: item.object
                });
            })
            return param;
        };

        /**
         * 准备download的请求参数
         * @param selectedItems
         * @returns {{all: number, list: Array}}
         */
        var prepareDownloadParam = function (selectedItems) {
            var param = {
                all: 0,
                list: []
            };
            angular.forEach(selectedItems, function (item) {
                param.list.push({
                    fullpath: item.fullpath
                });
            })
            return param;
        };

        var uploadMenu = [
            {
                name: 'start',
                text: '开始',
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('startUpload', prepareUpladParam(selectedItems));
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return 0;
                    }
                    var hasUnValidItem = false;
                    for (var i = 0; i < selectedItems.length; i++) {
                        var item = selectedItems[i];
                        if (!OSSQueueItem.isPause(item)) {
                            hasUnValidItem = true;
                        }
                    }
                    if (hasUnValidItem) {
                        return 0;
                    }
                    return 1;
                }
            },
            {
                name: 'pause',
                text: '暂停',
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('stopUpload', prepareUpladParam(selectedItems));
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return 0;
                    }
                    var hasUnValidItem = false;
                    for (var i = 0; i < selectedItems.length; i++) {
                        var item = selectedItems[i];
                        if (OSSQueueItem.isPause(item) || OSSQueueItem.isError(item) || OSSQueueItem.isDone(item)) {
                            hasUnValidItem = true;
                        }
                    }
                    if (hasUnValidItem) {
                        return 0;
                    }
                    return 1;
                }
            },
            {
                name: 'remove',
                text: '取消',
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('deleteUpload', prepareUpladParam(selectedItems));
                    $rootScope.$broadcast('removeQueue', 'upload', selectedItems);
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return 0;
                    }
                    return 1;
                }
            }
        ];

        var downloadMenu = [
            {
                name: 'start',
                text: '开始',
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('startDownload', prepareUpladParam(selectedItems));
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return 0;
                    }
                    var hasUnValidItem = false;
                    for (var i = 0; i < selectedItems.length; i++) {
                        var item = selectedItems[i];
                        if (!OSSQueueItem.isPause(item)) {
                            hasUnValidItem = true;
                        }
                    }
                    if (hasUnValidItem) {
                        return 0;
                    }
                    return 1;
                }
            },
            {
                name: 'pause',
                text: '暂停',
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('stopDownload', prepareDownloadParam(selectedItems));
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return 0;
                    }
                    var hasUnValidItem = false;
                    for (var i = 0; i < selectedItems.length; i++) {
                        var item = selectedItems[i];
                        if (OSSQueueItem.isPause(item) || OSSQueueItem.isError(item) || OSSQueueItem.isDone(item)) {
                            hasUnValidItem = true;
                        }
                    }
                    if (hasUnValidItem) {
                        return 0;
                    }
                    return 1;
                }
            },
            {
                name: 'remove',
                text: '取消',
                execute: function (selectedItems) {
                    if (!checkArgValid(selectedItems)) {
                        return;
                    }
                    OSS.invoke('deleteDownload', prepareDownloadParam(selectedItems));
                    $rootScope.$broadcast('removeQueue', 'download', selectedItems);
                },
                getState: function (selectedItems) {
                    var len = selectedItems.length;
                    if (!len) {
                        return 0;
                    }
                    return 1;
                }
            }
        ];
        return {
            getUploadMenu: function () {
                return uploadMenu;
            },
            getDownloadMenu: function () {
                return downloadMenu;
            }
        };
    }])
    .factory('OSSMenu', [function () {
        var allMenu = [
            {
                name: 'upload',
                text: '上传',
                getState: function () {
                    return 1;
                },
                execute: function (bucket, currentObject) {
                    OSS.invoke('selectFileDlg', {
                        path: '',
                        disable_root: 1
                    }, function (res) {
                        if (!res || !res['list'] || !res['list'].length) {
                            return;
                        }
                        OSS.invoke('addFile', {
                            location: bucket['Location'],
                            bucket: bucket['Name'],
                            prefix: currentObject,
                            list: res['list']
                        }, function (res) {

                        })
                    });
                }
            },
            {
                name: 'create',
                text: '新建文件夹',
                getState: function () {
                    return 1;
                },
                execute: function () {

                }
            },
            {
                name: 'download',
                text: '下载',
                getState: function (selectedFiles) {
                    var len = selectedFiles.length;
                    if (!len) {
                        return 0;
                    }
                    return 1;
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    var list = _.map(selectedFiles, function (val) {
                        return {
                            location: bucket['Location'],
                            bucket: bucket['Name'],
                            object: val.path,
                            filesize: val.size
                        }
                    });

                    OSS.invoke('saveFile', {
                        list: list
                    }, function (res) {

                    })
                }
            },
            {
                name: 'get_uri',
                text: '获取地址',
                getState: function (selectedFiles) {
                    var len = selectedFiles.length;
                    if (!len || len > 1) {
                        return 0;
                    } else {
                        return selectedFiles[0].dir ? 0 : 1
                    }
                },
                execute: function () {

                }
            },
            {
                name: 'set_header',
                text: '设置HTTP头',
                getState: function (selectedFiles) {
                    var len = selectedFiles.length;
                    if (!len || len > 1) {
                        return 0;
                    } else {
                        return selectedFiles[0].dir ? 0 : 1
                    }
                },
                execute: function () {
                    console.log(arguments);
                }
            },
            {
                name: 'del',
                text: '删除',
                getState: function (selectedFiles) {
                    var len = selectedFiles.length;
                    if (!len) {
                        return 0;
                    }
                    return 1;
                },
                execute: function (bucket, currentObject, selectedFiles) {
                    var list = _.map(selectedFiles, function (object) {
                        return {
                            object: object.path
                        }
                    });

                    OSS.invoke('deleteObject', {
                        bucket:bucket['Name'],
                        list: list
                    }, function (res) {

                    })
                }
            }
        ];
        return {
            getAllMenu: function () {
                return allMenu;
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
