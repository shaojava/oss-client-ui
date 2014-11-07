"use strict";

(function(window) {
    var accessId = "fmVEoAkpUByBS1cs";
    var accessSecret = "HWsJ79uEwsrh7PB6ASGpyrdZkwJWdR";
    function isOSSClient() {
        var sync = navigator.userAgent.split(";")[0] || "";
        return sync.toLowerCase() == "gk_sync";
    }
    function getCanonicalizedOssHeaders(headers) {
        var tmp_headers = {};
        var canonicalized_oss_headers = "";
        for (var k in headers) {
            if (k.toLowerCase().indexOf("x-oss-", 0) === 0) {
                tmp_headers[k.toLowerCase()] = headers[k];
            }
        }
        if (tmp_headers != {}) {
            var x_header_list = [];
            for (var k in tmp_headers) {
                x_header_list.push(k);
            }
            x_header_list.sort();
            for (var k in x_header_list) {
                canonicalized_oss_headers += x_header_list[k] + ":" + tmp_headers[x_header_list[k]] + "\n";
            }
        }
        return canonicalized_oss_headers;
    }
    var OSSClient = {
        getAccessID: function() {
            return JSON.stringify(accessId);
        },
        getSignature: function(param) {
            var parseParam = JSON.parse(param);
            var arr = [ parseParam.verb, parseParam.content_md5, parseParam.content_type, parseParam.expires ];
            var canonicalizedOSSheaders = "";
            if (parseParam.canonicalized_oss_headers) {
                canonicalizedOSSheaders = getCanonicalizedOssHeaders(parseParam.canonicalized_oss_headers);
            }
            var canonicalizedResource = parseParam.canonicalized_resource;
            return JSON.stringify(CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(arr.join("\n") + "\n" + canonicalizedOSSheaders + canonicalizedResource, accessSecret)));
        },
        changeHost: function(region) {
            region = JSON.parse(region);
            var host = [ region, region ? "." : "", "aliyuncs.com" ].join("");
            return JSON.stringify(host);
        },
        changeUpload: function() {},
        changeDownload: function() {},
        getUpload: function() {
            return JSON.stringify({
                download: 0,
                upload: 0,
                count: 1,
                list: [ {
                    bucket: "121212121212",
                    object: "PhpStorm-8.0.dmg",
                    fullpath: "C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",
                    offset: 1e8,
                    filesize: 137181104,
                    status: 5,
                    speed: 1e4,
                    errormsg: ""
                }, {
                    bucket: "121212121212",
                    object: "PhpStorm-8.0.dmg",
                    fullpath: "C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",
                    offset: 0,
                    filesize: 137181104,
                    status: 5,
                    speed: 0,
                    errormsg: ""
                } ]
            });
        },
        getDownload: function() {},
        configInfo: function() {
            var re = JSON.stringify({
                source: "",
                disable_location_select: 0,
                host: "aliyuncs.com",
                locations: [ {
                    location: "oss-cn-guizhou-a",
                    name: "互联网",
                    enable: 0
                }, {
                    location: "oss-cn-gzzwy-a",
                    name: "政务外网",
                    enable: 0
                }, {
                    location: "oss-cn-hangzhou-a",
                    name: "杭州",
                    enable: 1
                }, {
                    location: "oss-cn-qingdao-a",
                    name: "青岛",
                    enable: 1
                }, {
                    location: "oss-cn-beijing-a",
                    name: "北京",
                    enable: 1
                }, {
                    location: "oss-cn-hongkong-a",
                    name: "香港",
                    enable: 1
                }, {
                    location: "oss-cn-shenzhen-a",
                    name: "深圳",
                    enable: 1
                } ]
            });
            console.log("re", re);
            return JSON.stringify({
                source: "guizhou",
                disable_location_select: 1,
                host: "aliyuncs.com",
                locations: [ {
                    location: "oss-cn-guizhou-a",
                    name: "互联网",
                    enable: 1
                }, {
                    location: "oss-cn-gzzwy-a",
                    name: "政务外网",
                    enable: 1
                }, {
                    location: "oss-cn-hangzhou-a",
                    name: "杭州",
                    enable: 0
                }, {
                    location: "oss-cn-qingdao-a",
                    name: "青岛",
                    enable: 0
                }, {
                    location: "oss-cn-beijing-a",
                    name: "北京",
                    enable: 0
                }, {
                    location: "oss-cn-hongkong-a",
                    name: "香港",
                    enable: 0
                }, {
                    location: "oss-cn-shenzhen-a",
                    name: "深圳",
                    enable: 0
                } ]
            });
        },
        getCurrentLocation: function() {
            return JSON.stringify("oss-cn-guizhou-a");
        }
    };
    if (!isOSSClient()) {
        window.OSSClient = OSSClient;
    }
})(window);

"use strict";

window.debug = true;

var debugInterfaces = [];

var OSS = {
    invoke: function(name, param, callback, log) {
        var _self = this;
        if (typeof OSSClient === "undefined") {
            throw new Error("Can not find OSSClient");
        }
        if (typeof OSSClient[name] !== "function" && debugInterfaces.indexOf(name) < 0) {
            throw new Error("Can not find interface " + name);
        }
        var args = [];
        if (param) {
            args.push(JSON.stringify(param));
        }
        if (typeof callback === "function") {
            args.push(function(re) {
                if (log !== false) {
                    _self.log(name + ":callback", re);
                }
                re = !re ? "" : typeof re === "object" ? re : JSON.parse(re);
                callback(re);
            });
        }
        var re = "";
        if (log !== false) {
            this.log(name, args);
        }
        if (!args.length) {
            if (debugInterfaces.indexOf(name) >= 0) {
                re = this[name]();
            } else {
                re = OSSClient[name]();
            }
        } else if (args.length == 1) {
            re = OSSClient[name](args[0]);
        } else if (args.length == 2) {
            re = OSSClient[name](args[0], args[1]);
        }
        if (log !== false) {
            this.log(name + ":return", re);
        }
        re = !re ? "" : JSON.parse(re);
        return re;
    },
    log: function(name, info) {
        if (window.debug) {
            console.log("%c" + name, "color:blue", info);
        }
    },
    getUserAgent: function() {
        return navigator.userAgent.split(";");
    },
    getClientOS: function() {
        var os = this.getUserAgent()[2] || "";
        return os.toLowerCase();
    },
    isWindowsClient: function() {
        return this.getClientOS() == "windows";
    },
    isMacClient: function() {
        return this.getClientOS() == "mac";
    },
    isClientOS: function() {
        return this.isWindowsClient() || this.isMacClient();
    },
    isOSSClient: function() {
        var sync = this.getUserAgent()[0] || "";
        return sync.toLowerCase() == "gk_sync";
    }
};

"use strict";

angular.module("OSSCommon", []).factory("OSSDialog", [ function() {
    var defaultParam = {
        type: "normal",
        resize: 0,
        width: 490,
        height: 420
    };
    return {
        exportAuthorization: function() {
            var UIPath = OSS.invoke("getUIPath");
            OSS.invoke("showWnd", angular.extend({}, defaultParam, {
                url: UIPath + "/export-authorization.html"
            }));
        },
        customServerHost: function() {
            var UIPath = OSS.invoke("getUIPath");
            OSS.invoke("showWnd", angular.extend({}, defaultParam, {
                url: UIPath + "/custom-domain.html"
            }));
        },
        setting: function() {
            var UIPath = OSS.invoke("getUIPath");
            OSS.invoke("showWnd", angular.extend({}, defaultParam, {
                url: UIPath + "/setting.html"
            }));
        }
    };
} ]).factory("OSSConfig", [ function() {
    var config = OSS.invoke("configInfo");
    return {
        isCustomClient: function() {
            return config.source != "";
        },
        isGuiZhouClient: function() {
            return config.source == "guizhou";
        },
        isDisableLocationSelect: function() {
            return config.disable_location_select == 1;
        },
        getLocations: function() {
            return config.locations || [];
        },
        getHost: function() {
            return config.host;
        }
    };
} ]).factory("OSSRegion", [ "OSSConfig", function(OSSConfig) {
    var locations = OSSConfig.getLocations();
    var currentLocation = OSS.invoke("getCurrentLocation");
    return {
        list: function() {
            return _.where(locations, {
                enable: 1
            });
        },
        getRegionByLocation: function(location) {
            return _.find(locations, function(item) {
                return item.location.replace("-internal", "") == location.replace("-internal", "");
            });
        },
        changeLocation: function(location) {
            if (location.indexOf("-internal") > 0) {
                return location;
            }
            if (currentLocation && location + "-internal" == currentLocation) {
                return location + "-internal";
            }
            return location;
        }
    };
} ]).factory("OSSException", [ function() {
    var erroList = {};
    return {
        getError: function(res, status) {
            var resError = res["Error"];
            var error = {
                status: status,
                code: resError.Code || "",
                msg: resError.Message || ""
            };
            return error;
        },
        getClientErrorMsg: function(res) {
            return res.message;
        }
    };
} ]).factory("Clipboard", function() {
    var maxLen = 1, container = [];
    return {
        clear: function() {
            container = [];
        },
        len: function() {
            return container.length;
        },
        get: function() {
            var item = container.shift();
            OSS.log("Clipboard.get", item);
            return item;
        },
        add: function(data) {
            container.push(data);
            if (container.length > maxLen) {
                container.shift();
            }
            OSS.log("Clipboard.add", data);
        }
    };
}).filter("baseName", function() {
    return Util.String.baseName;
}).filter("isDir", function() {
    return function(path) {
        var lastStr = Util.String.lastChar(path);
        return lastStr === "/" || lastStr === "\\" ? 1 : 0;
    };
}).directive("scrollLoad", [ "$rootScope", "$parse", function($rootScope, $parse) {
    return {
        restrict: "A",
        link: function($scope, $element, attrs) {
            var triggerDistance = 0;
            var disableScroll = false;
            if (attrs.triggerDistance != null) {
                $scope.$watch(attrs.triggerDistance, function(value) {
                    return triggerDistance = parseInt(value || 0, 10);
                });
            }
            if (attrs.disableScroll != null) {
                $scope.$watch(attrs.disableScroll, function(value) {
                    return disableScroll = !!value;
                });
            }
            var direction = "down";
            if (attrs.triggerDirection) {
                direction = attrs.triggerDirection;
            }
            var startScrollTop = 0;
            var fn = $parse(attrs["scrollLoad"]);
            $element.on("scroll.scrollLoad", function(event) {
                var _self = jQuery(this), realDistance = 0, scrollH = 0, scrollT = 0, isScrollDown = false;
                scrollH = jQuery.isWindow(this) ? document.body.scrollHeight : $element[0].scrollHeight;
                scrollT = _self.scrollTop();
                isScrollDown = scrollT > startScrollTop;
                var clientHeight = jQuery.isWindow(this) ? document.documentElement.clientHeight || document.body.clientHeight : this.clientHeight;
                realDistance = direction == "down" ? scrollH - scrollT - clientHeight : scrollT;
                if (realDistance <= triggerDistance && !disableScroll) {
                    if (!isScrollDown && direction == "up" || isScrollDown && direction == "down") {
                        $scope.$apply(function() {
                            fn($scope, {
                                $event: event
                            });
                        });
                    }
                }
                startScrollTop = scrollT;
            });
            $scope.$on("$destroy", function() {
                $element.off("scroll.scrollLoad");
            });
        }
    };
} ]).directive("scrollToItem", [ "$timeout", function($timeout) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            attrs.$observe("scrollToItem", function(newVal) {
                $timeout(function() {
                    var index = newVal;
                    if (index < 0) return;
                    var $fileItem = element.find(attrs.itemSelector + ":eq(" + index + ")");
                    if (!$fileItem.size()) return;
                    var top = $fileItem.position().top;
                    var grep = top + $fileItem.height() - element.height();
                    if (top < 0) {
                        element.scrollTop(element.scrollTop() + top);
                    } else if (grep > 0) {
                        element.scrollTop(element.scrollTop() + grep);
                    }
                });
            });
        }
    };
} ]).directive("onDrop", [ "$parse", function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.onDrop);
        element.on("drop", function(event) {
            scope.$apply(function() {
                fn(scope, {
                    $event: event
                });
            });
        });
    };
} ]).directive("preventDragDrop", [ function() {
    return {
        restrict: "A",
        link: function($scope, $element) {
            $element.on("dragstart", function(event) {
                var jTarget = jQuery(event.target);
                if (!jTarget.attr("draggable") && !jTarget.parents("[draggable]").size()) {
                    event.preventDefault();
                }
            });
            $element.on("dragover", function(event) {
                event.preventDefault();
            });
            $element.on("dragenter", function(event) {
                event.preventDefault();
            });
            $element.on("drop", function(event) {
                event.preventDefault();
            });
        }
    };
} ]).directive("autoSelect", [ function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var isAutoSelect = false;
            attrs.$observe("autoSelect", function(isAuto) {
                isAutoSelect = isAuto;
            });
            element.on("click.autoSelect", function() {
                if (isAutoSelect) {
                    element.select();
                }
            });
        }
    };
} ]).directive("locationSelect", [ "OSSRegion", function(OSSRegion) {
    return {
        restrict: "E",
        replace: true,
        scope: {
            selectLocation: "=",
            disableSelect: "=",
            name: "@",
            placeHolder: "@"
        },
        template: '<select ng-model="selectLocation" name="{{name}}" ng-disabled="disableSelect" class="form-control" ng-options="location.name for location in locations"></select>',
        link: function(scope) {
            scope.locations = OSSRegion.list();
            if (scope.placeHolder) {
                var defaultOption = {
                    name: scope.placeHolder
                };
                scope.locations.unshift(defaultOption);
                scope.selectLocation = defaultOption;
            }
        }
    };
} ]);

"use strict";

angular.module("ossClientUiApp", [ "ngAnimate", "ngCookies", "ngResource", "ngRoute", "ngSanitize", "ngTouch", "ui.bootstrap", "angularSpinner", "OSSCommon", "angularSpinner", "ng-context-menu" ]).config([ "$routeProvider", "$httpProvider", function($routeProvider, $httpProvider) {
    $routeProvider.when("/file/:bucket?/?:object*?", {
        templateUrl: "views/filelist.html",
        controller: "FileListCtrl",
        resolve: {
            buckets: function(Bucket) {
                return Bucket.list();
            }
        }
    }).when("/upload/:bucket", {
        templateUrl: "views/uploadlist.html",
        controller: "UploadListCtrl",
        resolve: {
            buckets: function(Bucket) {
                return Bucket.list();
            }
        }
    }).otherwise({
        redirectTo: "/file"
    });
    $httpProvider.defaults.transformResponse.unshift(function(response, header) {
        if (header("content-type") == "application/xml") {
            return $.xml2json(response);
        }
        return response;
    });
} ]);

"use strict";

angular.module("ossClientUiApp").controller("MainCtrl", [ "$scope", "OSSApi", "OSSModal", "Bucket", "Bread", "OSSLocationHistory", "$rootScope", "$filter", "OSSDialog", "OSSAlert", "OSSLocation", "$location", function($scope, OSSApi, OSSModal, Bucket, Bread, OSSLocationHistory, $rootScope, $filter, OSSDialog, OSSAlert, OSSLocation, $location) {
    $scope.buckets = [];
    $scope.showAddBucketModal = function() {
        OSSModal.addBucket().result.then(function(param) {
            if (param.act == "add") {
                $scope.buckets.push(param.bucket);
                $location.path(OSSLocation.getUrl(param.bucket.Name));
            }
        });
    };
    $scope.editBucket = function(bucket) {
        OSSModal.addBucket(bucket).result.then(function(param) {
            if (param.act == "del") {
                Util.Array.removeByValue($scope.buckets, param.bucket);
            }
        });
    };
    $scope.onConextMenuShow = function(bucket) {
        $scope.activeBucket = bucket;
    };
    $scope.breads = [];
    $scope.backward = function() {
        OSSLocationHistory.backward();
    };
    $scope.forward = function() {
        OSSLocationHistory.forward();
    };
    Bucket.list().then(function(buckets) {
        $scope.buckets = angular.isArray(buckets) ? buckets : [ buckets ];
    });
    $scope.$on("$routeChangeSuccess", function(event, current, prev) {
        if (prev && prev.params) {
            var oldBucket = Bucket.getBucket(prev.params.bucket);
            oldBucket && Bucket.unselected(oldBucket);
        }
        var currentBucket, currentObjectPath = "/", filter = "file";
        if (current && current.params && current.params.bucket) {
            if (current.$$route && current.$$route.originalPath) {
                var pathArr = current.$$route.originalPath.split("/");
                currentBucket = Bucket.getBucket(current.params.bucket);
                currentObjectPath = current.params.object;
                filter = pathArr[1] || "file";
            }
        } else if ($scope.buckets && $scope.buckets.length) {
            currentBucket = $scope.buckets[0]["Name"];
        }
        if (currentBucket) {
            Bucket.select(currentBucket);
            $scope.breads = Bread.getBreads(currentBucket.Name, currentObjectPath, filter);
            $scope.historyCanForward = OSSLocationHistory.canForward();
            $scope.historyCanBackward = OSSLocationHistory.canBackward();
        }
    });
    $scope.exportAuthorization = function() {
        OSSModal.setting();
    };
    $scope.$on("toggleTransQueue", function(event, isShow) {
        if (angular.isUndefined(isShow)) {
            $scope.showTransQueue = !$scope.showTransQueue;
        } else {
            $scope.showTransQueue = isShow;
        }
    });
    $scope.$on("showError", function(event, errorMsg, errorTitle) {
        if (!errorMsg) return;
        OSSAlert.error(errorMsg, errorTitle);
    });
    $scope.$on("removeBucket", function(event, bucket) {
        if (bucket.selected && $scope.buckets.length) {
            $location.path(OSSLocation.getUrl($scope.buckets[0].Name));
        }
        Util.Array.removeByValue($scope.buckets, bucket);
    });
} ]).controller("TransQueueCtrl", [ "$scope", "$interval", "OSSQueueMenu", "OSSUploadQueue", "OSSDownloadQueue", "$rootScope", function($scope, $interval, OSSQueueMenu, OSSUploadQueue, OSSDownloadQueue, $rootScope) {
    $scope.uploadQueueMenus = OSSQueueMenu.getUploadMenu();
    $scope.uploadMenuGroup = OSSQueueMenu.groupBy($scope.uploadQueueMenus, "upload");
    $scope.downloadQueueMenus = OSSQueueMenu.getDownloadMenu();
    $scope.downloadMenuGroup = OSSQueueMenu.groupBy($scope.downloadQueueMenus, "download");
    $scope.getSelectedList = function(type) {
        return _.where(type == "download" ? $scope.downloadList : $scope.uploadList, {
            selected: true
        });
    };
    $scope.select = function(item, type) {
        item.selected = true;
        if (type == "download") {
            $scope.scrollToDownloadIndex = _.indexOf($scope.downloadList, item);
        } else {
            $scope.scrollToUploadIndex = _.indexOf($scope.uploadList, item);
        }
    };
    $scope.unSelect = function(item) {
        item.selected = false;
    };
    $scope.unSelectAll = function(type) {
        angular.forEach($scope.getSelectedList(type), function(item) {
            $scope.unSelect(item, type);
        });
    };
    $scope.shiftLastUploadIndex = 0;
    $scope.shiftLastDownloadIndex = 0;
    $scope.handleItemClick = function($event, index, item, type) {
        if ($event.ctrlKey || $event.metaKey) {
            if (item.selected) {
                $scope.unSelect(item, type);
            } else {
                $scope.select(item, type);
            }
        } else if ($event.shiftKey) {
            var lastIndex = type == "download" ? $scope.shiftLastDownloadIndex : $scope.shiftLastUploadIndex;
            $scope.unSelectAll(type);
            if (index > lastIndex) {
                for (var i = lastIndex; i <= index; i++) {
                    $scope.select(type == "download" ? $scope.downloadList[i] : $scope.uploadList[i], type);
                }
            } else if (index < lastIndex) {
                for (var i = index; i <= lastIndex; i++) {
                    $scope.select(type == "download" ? $scope.downloadList[i] : $scope.uploadList[i], type);
                }
            }
        } else {
            $scope.unSelectAll(type);
            $scope.select(item, type);
        }
        if (!$event.shiftKey) {
            if (type == "download") {
                $scope.shiftLastDownloadIndex = index;
            } else {
                $scope.shiftLastUploadIndex = index;
            }
        }
    };
    $scope.$on("removeQueue", function(event, type, items) {
        OSS.log("removeQueue", arguments);
        if (type === "upload") {
            angular.forEach(items, function(item) {
                OSSUploadQueue.remove(item);
            });
        } else {
            angular.forEach(items, function(item) {
                OSSDownloadQueue.remove(item);
            });
        }
    });
    $scope.OSSUploadQueue = OSSUploadQueue.init();
    $scope.uploadList = $scope.OSSUploadQueue.items;
    $scope.OSSUploadQueue.refresh();
    $scope.$on("reloadUploadQueue", function() {
        $scope.OSSUploadQueue = OSSUploadQueue.init();
        $scope.uploadList = $scope.OSSUploadQueue.items;
    });
    $scope.OSSDownloadQueue = OSSDownloadQueue.init();
    $scope.downloadList = $scope.OSSDownloadQueue.items;
    $scope.OSSDownloadQueue.refresh();
    $scope.$on("reloadDownloadQueue", function() {
        $scope.OSSDownloadQueue = OSSDownloadQueue.init();
        $scope.downloadList = $scope.OSSDownloadQueue.items;
    });
    $scope.loadMoreQueue = function(type) {
        if (type == "download") {
            $scope.loadingQueue = true;
            $scope.OSSDownloadQueue.getQueueList($scope.downloadList.length);
            $scope.loadingQueue = false;
        } else if (type == "upload") {
            $scope.loadingQueue = true;
            $scope.OSSUploadQueue.getQueueList($scope.uploadList.length);
            $scope.loadingQueue = false;
        }
    };
    $scope.toggleSlideQueue = function() {
        $scope.$emit("toggleTransQueue");
    };
    $scope.handleTransQueueDblClick = function($event) {
        var $target = $($event.target);
        if ($target.hasClass("nav-tabs") || $target.parents(".nav").size()) {
            $scope.toggleSlideQueue();
        }
    };
    $scope.tabs = [ {
        name: "upload",
        title: "上传队列"
    }, {
        name: "download",
        title: "下载队列"
    }, {
        name: "log",
        title: "错误日志"
    } ];
    $scope.$on("toggleTransQueue", function($event, isShow, currentTab) {
        if (!angular.isUndefined(currentTab)) {
            var tab = _.findWhere($scope.tabs, {
                name: currentTab
            });
            if (tab && !tab.selected) {
                tab.active = true;
            }
            if (tab == "upload") {
                $scope.scrollToUploadIndex = $scope.uploadList.length - 1;
            } else if (tab === "download") {
                $scope.scrollToDownloadIndex = $scope.downloadList.length - 1;
            }
        }
    });
    $scope.openLogFolder = function() {
        OSS.invoke("openLogFolder");
    };
    $scope.errorLog = "";
    var selectCount = 0;
    $scope.selectTab = function(tab) {
        if (tab.name == "log") {
            var errorLog = "";
            var res = OSS.invoke("getErrorLog");
            if (res && res.list && res.list.length) {
                angular.forEach(res.list, function(val) {
                    errorLog += val.msg + "\r\n";
                });
                $scope.errorLog = errorLog;
            }
        } else if (tab.name == "upload") {} else if (tab.name == "download") {}
        if (!$rootScope.showTransQueue && selectCount > 0) {
            $scope.$emit("toggleTransQueue", true);
        }
        selectCount++;
    };
    $scope.executeDownloadCmd = function(cmd, item) {
        var menu = OSSQueueMenu.getDownloadMenuItem(cmd);
        if (menu) {
            menu.execute([ item ]);
        }
    };
    $scope.executeUploadCmd = function(cmd, item) {
        var menu = OSSQueueMenu.getUploadMenuItem(cmd);
        if (menu) {
            menu.execute([ item ]);
        }
    };
    var excludeMenus = [];
    $scope.isExcludeTopMenu = function(menu) {
        return _.indexOf(excludeMenus, menu.name) >= 0;
    };
    $scope.clearDone = function(type) {
        var menu, list = [];
        if (type == "download") {
            menu = OSSQueueMenu.getDownloadMenuItem("remove");
            list = _.filter($scope.downloadList, function(item) {
                return _.indexOf([ 4, 5 ], item.status) >= 0;
            });
        } else {
            menu = OSSQueueMenu.getUploadMenuItem("remove");
            list = _.filter($scope.uploadList, function(item) {
                return _.indexOf([ 4, 5 ], item.status) >= 0;
            });
        }
        if (menu && list.length) {
            menu.execute(list);
        }
    };
} ]).controller("FileListCtrl", [ "$scope", "$routeParams", "OSSApi", "buckets", "$rootScope", "OSSObject", "OSSMenu", "Bucket", "$route", "$location", "OSSLocation", "usSpinnerService", "$filter", "OSSException", "$timeout", function($scope, $routeParams, OSSApi, buckets, $rootScope, OSSObject, OSSMenu, Bucket, $route, $location, OSSLocation, usSpinnerService, $filter, OSSException, $timeout) {
    var bucketName = $routeParams.bucket || "", keyword = $routeParams.keyword || "", prefix = "", delimiter = "/", isSearch = false, loadFileCount = 50, lastLoadMaker = "", isAllFileLoaded = false;
    $scope.orderBy = "";
    if (buckets.length && !bucketName) {
        $location.path(OSSLocation.getUrl(buckets[0].Name));
        return;
    }
    $scope.bucket = Bucket.getBucket(bucketName);
    $scope.objectPrefix = $routeParams.object ? $routeParams.object : "";
    OSSObject.setCurrentObject({
        path: $scope.objectPrefix,
        dir: 1
    });
    if (keyword.length) {
        prefix = keyword;
        isSearch = true;
    } else {
        prefix = $scope.objectPrefix;
        isSearch = false;
    }
    $scope.files = [];
    var loadFile = function() {
        if ($scope.loadingFile) {
            return;
        }
        $scope.loadingFile = true;
        usSpinnerService.spin("file-list-spinner");
        OSSObject.list($scope.bucket, prefix, delimiter, lastLoadMaker, loadFileCount).then(function(res) {
            $scope.loadingFile = false;
            $scope.files = $filter("orderBy")($scope.files.concat(res.files), $scope.orderBy);
            lastLoadMaker = res.marker;
            isAllFileLoaded = res.allLoaded;
            usSpinnerService.stop("file-list-spinner");
        }, function() {
            $scope.loadingFile = false;
            usSpinnerService.stop("file-list-spinner");
        });
    };
    loadFile();
    $scope.openFile = function(file, isDir) {
        if (isDir == 1) {
            OSSObject.open($scope.bucket, file.path, isDir);
        } else {
            var menu = OSSMenu.getMenu("download");
            if (menu) {
                menu.execute($scope.bucket, $scope.objectPrefix, [ file ]);
            }
        }
    };
    $scope.loadMoreFile = function() {
        if (isAllFileLoaded) {
            return;
        }
        loadFile();
    };
    $scope.$watch("orderBy", function(val) {
        $scope.files = $filter("orderBy")($scope.files, val);
    });
    $scope.enableKeyBoardNav = 1;
    $scope.getSelectedList = function() {
        return _.where($scope.files, {
            selected: true
        });
    };
    $scope.select = function(item) {
        item.selected = true;
        $scope.scrollToIndex = _.indexOf($scope.files, item);
    };
    $scope.unSelect = function(item) {
        item.selected = false;
    };
    $scope.unSelectAll = function() {
        angular.forEach($scope.getSelectedList(), function(item) {
            $scope.unSelect(item);
        });
    };
    $scope.shiftLastIndex = 0;
    $scope.handleClick = function($event, file, index) {
        if ($event.ctrlKey || $event.metaKey) {
            if (file.selected) {
                $scope.unSelect(file);
            } else {
                $scope.select(file);
            }
        } else if ($event.shiftKey) {
            var lastIndex = $scope.shiftLastIndex;
            $scope.unSelectAll();
            if (index > lastIndex) {
                for (var i = lastIndex; i <= index; i++) {
                    $scope.select($scope.files[i]);
                }
            } else if (index < lastIndex) {
                for (var i = index; i <= lastIndex; i++) {
                    $scope.select($scope.files[i]);
                }
            }
        } else {
            $scope.unSelectAll();
            $scope.select(file);
        }
        if (!$event.shiftKey) {
            $scope.shiftLastIndex = index;
        }
    };
    $scope.onContextMenuShow = function(file) {
        if (!file.selected) {
            $scope.unSelectAll();
            $scope.select(file);
        }
    };
    $scope.currentFileMenuList = OSSMenu.getCurrentFileMenu();
    $scope.selectFileMenuList = OSSMenu.getSelectFileMenu();
    $scope.menuGroups = OSSMenu.groupMenu(_.union($scope.currentFileMenuList, $scope.selectFileMenuList));
    $scope.excludeTopMenu = OSSMenu.getTopExcludeMenus();
    $scope.isExclude = function(menu) {
        return $scope.excludeTopMenu.indexOf(menu.name) >= 0;
    };
    $scope.$on("reloadFileList", function() {
        $route.reload();
    });
    $scope.$on("createObject", function(event, callback) {
        $timeout(function() {
            $scope.showCreateFile = true;
            $scope.createFileCallback = callback;
        });
    });
    $scope.$on("addObject", function(event, objects, selected) {
        objects = $.isArray(objects) ? objects : [ objects ];
        var addFiles = _.map(objects, OSSObject.format);
        angular.forEach(addFiles, function(file) {
            $scope.files.push(file);
            if (selected) {
                $scope.select(file);
            }
        });
    });
    $scope.$on("removeObject", function(event, objects) {
        angular.forEach(objects, function(object) {
            Util.Array.removeByValue($scope.files, object);
        });
    });
    $scope.handleSysDrop = function() {
        var dragFiles = OSS.invoke("getDragFiles");
        var params = {
            location: $scope.bucket["Location"],
            bucket: $scope.bucket["Name"],
            prefix: $scope.objectPrefix,
            list: dragFiles["list"]
        };
        OSS.invoke("addFile", params, function(res) {
            if (!res.error) {
                $rootScope.$broadcast("toggleTransQueue", true);
                $rootScope.$broadcast("reloadUploadQueue");
            } else {
                $rootScope.$broadcast("showError", OSSException.getClientErrorMsg(res));
            }
        });
    };
} ]).controller("UploadListCtrl", [ "$scope", "$routeParams", "OSSUploadPart", "Bucket", "OSSUploadMenu", function($scope, $routeParams, OSSUploadPart, Bucket, OSSUploadMenu) {
    $scope.loading = false;
    var isAllLoaded = false;
    var lastKeyMaker = "";
    var lastUploadMaker = "";
    var loadCount = 100;
    var bucketName = $routeParams.bucket;
    var loadUploads = function() {
        if ($scope.loading) {
            return;
        }
        $scope.loading = true;
        OSSUploadPart.list(Bucket.getBucket(bucketName), "", "", lastKeyMaker, loadCount, lastUploadMaker).then(function(res) {
            $scope.loading = false;
            $scope.uploads = $scope.uploads.concat(res.uploads);
            lastKeyMaker = res.keyMaker;
            lastUploadMaker = res.uploadIdMaker;
            isAllLoaded = res.allLoaded;
        }, function() {
            $scope.loadingFile = false;
        });
    };
    $scope.uploads = [];
    $scope.loadMoreUpload = function() {
        if (isAllLoaded) {
            return;
        }
        loadUploads();
    };
    loadUploads();
    $scope.enableKeyBoardNav = 1;
    $scope.getSelectedList = function() {
        return _.where($scope.uploads, {
            selected: true
        });
    };
    $scope.select = function(item) {
        item.selected = true;
        $scope.scrollToIndex = _.indexOf($scope.uploads, item);
    };
    $scope.unSelect = function(item) {
        item.selected = false;
    };
    $scope.unSelectAll = function() {
        angular.forEach($scope.getSelectedList(), function(item) {
            $scope.unSelect(item);
        });
    };
    $scope.handleClick = function($event, upload, index) {
        if ($event.ctrlKey || $event.metaKey) {
            if (upload.selected) {
                $scope.unSelect(upload);
            } else {
                $scope.select(upload);
            }
        } else if ($event.shiftKey) {
            var lastIndex = $scope.shiftLastIndex;
            $scope.unSelectAll();
            if (index > lastIndex) {
                for (var i = lastIndex; i <= index; i++) {
                    $scope.select($scope.uploads[i]);
                }
            } else if (index < lastIndex) {
                for (var i = index; i <= lastIndex; i++) {
                    $scope.select($scope.uploads[i]);
                }
            }
        } else {
            $scope.unSelectAll();
            $scope.select(upload);
        }
        if (!$event.shiftKey) {
            $scope.shiftLastIndex = index;
        }
    };
    $scope.topMenuList = OSSUploadMenu.getAllMenu();
    $scope.$on("removeUpload", function(event, uploads) {
        if (!angular.isArray(uploads)) {
            uploads = [ uploads ];
        }
        angular.forEach(uploads, function(upload) {
            var index = _.indexOf($scope.uploads, upload);
            index >= 0 && $scope.uploads.splice(index, 1);
        });
    });
    $scope.onContextMenuShow = function(upload) {
        if (!upload.selected) {
            $scope.unSelectAll();
            $scope.select(upload);
        }
    };
} ]);

"use strict";

angular.module("ossClientUiApp").factory("OSSAlert", [ "$modal", function($modal) {
    function openAlertModal(type, message, title, buttons) {
        var option = {
            templateUrl: "views/alert_modal.html",
            windowClass: "alert-modal " + type + "-alert-modal",
            controller: function($scope, $modalInstance) {
                $scope.type = type;
                $scope.message = message;
                $scope.title = title;
                $scope.buttons = buttons;
                $scope.buttonClick = function(button) {
                    angular.isFunction(button.callback) && button.callback();
                    $modalInstance.close();
                };
                $scope.cancel = function() {
                    $modalInstance.dismiss("cancel");
                };
            }
        };
        return $modal.open(option);
    }
    return {
        info: function(message, title, buttons) {
            title = angular.isUndefined(title) ? "信息" : title;
            buttons = angular.isUndefined(buttons) ? [ {
                text: "关闭",
                classes: "btn btn-default"
            } ] : buttons;
            return openAlertModal("info", message, title, buttons);
        },
        warning: function(message, title, buttons) {
            title = angular.isUndefined(title) ? "警告" : title;
            buttons = angular.isUndefined(buttons) ? [ {
                text: "确认",
                classes: "btn btn-primary"
            }, {
                text: "关闭",
                classes: "btn btn-default"
            } ] : buttons;
            return openAlertModal("warning", message, title, buttons);
        },
        error: function(message, title, buttons) {
            title = angular.isUndefined(title) ? "错误" : title;
            buttons = angular.isUndefined(buttons) ? [ {
                text: "关闭",
                classes: "btn btn-default"
            } ] : buttons;
            return openAlertModal("error", message, title, buttons);
        },
        success: function(message, title, buttons) {
            title = angular.isUndefined(title) ? "成功" : title;
            buttons = angular.isUndefined(buttons) ? [ {
                text: "关闭",
                classes: "btn btn-default"
            } ] : buttons;
            return openAlertModal("success", message, title, buttons);
        }
    };
} ]).factory("OSSUploadQueue", [ "$rootScope", "$timeout", "OSSQueueItem", "OSSLocation", "$filter", function($rootScope, $timeout, OSSQueueItem, OSSLocation, $filter) {
    var size = 100;
    var OSSUploadQueue = {
        items: [],
        totalCount: 0,
        doneCount: 0,
        uploadSpeed: 0,
        downloadSpeed: 0,
        isStop: true,
        init: function() {
            this.getQueueList(0);
            return this;
        },
        getQueueList: function(start) {
            var res = OSS.invoke("getUpload", {
                start: start,
                count: size
            });
            OSS.log("OSSUploadQueue", res);
            var list = angular.isArray(res["list"]) ? res["list"] : [];
            if (start == 0) {
                this.items = list;
            } else {
                angular.forEach(list, function(item) {
                    OSSUploadQueue.add(item);
                });
            }
            this.totalCount = res["upload_total_count"];
            this.doneCount = res["upload_done_count"];
            this.uploadSpeed = res["upload"];
            this.downloadSpeed = res["download"];
        },
        add: function(item) {
            this.items.push(item);
        },
        get: function(pathhash) {
            return _.findWhere(this.items, {
                pathhash: pathhash
            });
        },
        remove: function(item) {
            var index = _.indexOf(this.items, item);
            if (index > -1) {
                this.items.splice(index, 1);
            }
        },
        update: function(item, param) {
            angular.extend(item, param);
        },
        refresh: function() {
            var _self = this;
            OSS.invoke("changeUpload", {
                start: 1
            }, function(res) {
                $timeout(function() {
                    angular.forEach(res["list"], function(val) {
                        var existItem = _self.get(val.pathhash);
                        if (existItem) {
                            _self.update(existItem, val);
                        } else {}
                        var upPath = $filter("isDir")(val.object) ? Util.String.dirName(Util.String.dirName(val.object)) : Util.String.dirName(val.object);
                        if (OSSQueueItem.isDone(val) && OSSLocation.isCurrentObject(val.bucket, upPath)) {
                            $rootScope.$broadcast("reloadFileList");
                        }
                    });
                    _self.totalCount = res["upload_total_count"];
                    _self.doneCount = res["upload_done_count"];
                    _self.uploadSpeed = res["upload"];
                    _self.downloadSpeed = res["download"];
                });
            }, false);
            this.isStop = false;
        },
        stop: function() {
            OSS.invoke("changeUpload", {
                start: 0
            });
            this.isStop = true;
        },
        isStoped: function() {
            return this.isStop;
        }
    };
    return OSSUploadQueue;
} ]).factory("OSSQueueItem", [ function() {
    var STATUS_ERROR = 5, STATUS_PROGRESS = 1, STATUS_DONE = 4, STATUS_WAITING = 2, STATUS_PASUED = 3;
    var OSSQueueItem = {
        setStatus: function(item, status) {
            item.status = status;
        },
        isError: function(item) {
            return item.status == STATUS_ERROR;
        },
        isInProgress: function(item) {
            return item.status == STATUS_PROGRESS;
        },
        isDone: function(item) {
            return item.status == STATUS_DONE;
        },
        isWaiting: function(item) {
            return item.status == STATUS_WAITING;
        },
        isPaused: function(item) {
            return item.status == STATUS_PASUED;
        },
        setError: function(item) {
            OSSQueueItem.setStatus(item, STATUS_ERROR);
        },
        setProgress: function(item) {
            OSSQueueItem.setStatus(item, STATUS_PROGRESS);
        },
        setDone: function(item) {
            OSSQueueItem.setStatus(item, STATUS_DONE);
        },
        setWaiting: function(item) {
            OSSQueueItem.setStatus(item, STATUS_WAITING);
        },
        setPaused: function(item) {
            OSSQueueItem.setStatus(item, STATUS_PASUED);
        }
    };
    return OSSQueueItem;
} ]).factory("OSSDownloadQueue", [ "$rootScope", "$timeout", function($rootScope, $timeout) {
    var size = 100;
    var OSSDownloadQueue = {
        items: [],
        totalCount: 0,
        doneCount: 0,
        uploadSpeed: 0,
        downloadSpeed: 0,
        isStop: true,
        init: function() {
            this.getQueueList(0);
            return this;
        },
        getQueueList: function(start) {
            var res = OSS.invoke("getDownload", {
                start: start,
                count: size
            });
            var list = angular.isArray(res["list"]) ? res["list"] : [];
            if (start == 0) {
                this.items = list;
            } else {
                angular.forEach(list, function(item) {
                    OSSDownloadQueue.add(item);
                });
            }
            this.totalCount = res["download_total_count"];
            this.doneCount = res["download_done_count"];
            this.uploadSpeed = res["upload"];
            this.downloadSpeed = res["download"];
        },
        add: function(item) {
            this.items.push(item);
        },
        get: function(fullpath) {
            return _.findWhere(this.items, {
                fullpath: fullpath
            });
        },
        remove: function(item) {
            var index = _.indexOf(this.items, item);
            if (index > -1) {
                this.items.splice(index, 1);
            }
        },
        update: function(item, param) {
            angular.extend(item, param);
        },
        refresh: function() {
            var _self = this;
            this.isStop = false;
            OSS.invoke("changeDownload", {
                start: 1
            }, function(res) {
                $timeout(function() {
                    angular.forEach(res["list"], function(val) {
                        var existItem = _self.get(val.fullpath);
                        if (existItem) {
                            _self.update(existItem, val);
                        } else {}
                    });
                    _self.totalCount = res["download_total_count"];
                    _self.doneCount = res["download_done_count"];
                    _self.uploadSpeed = res["upload"];
                    _self.downloadSpeed = res["download"];
                });
            }, false);
        },
        stop: function() {
            OSS.invoke("changeDownload", {
                start: 0
            });
            this.isStop = true;
        },
        isStoped: function() {
            return this.isStop;
        }
    };
    return OSSDownloadQueue;
} ]).factory("OSSQueueMenu", [ "$rootScope", "OSSQueueItem", "$timeout", function($rootScope, OSSQueueItem, $timeout) {
    var checkArgValid = function(selectedItems) {
        if (!angular.isArray(selectedItems) || !selectedItems.length) {
            return false;
        }
        return true;
    };
    var prepareUpladParam = function(selectedItems) {
        var param = {
            all: selectedItems && selectedItems.length ? 0 : 1
        };
        if (selectedItems) {
            param.list = [];
            angular.forEach(selectedItems, function(item) {
                param.list.push({
                    bucket: item.bucket,
                    object: item.object
                });
            });
        }
        return param;
    };
    var prepareDownloadParam = function(selectedItems) {
        var param = {
            all: selectedItems && selectedItems.length ? 0 : 1
        };
        if (selectedItems) {
            param.list = [];
            angular.forEach(selectedItems, function(item) {
                param.list.push({
                    fullpath: item.fullpath
                });
            });
        }
        return param;
    };
    var uploadMenu = [ {
        name: "start",
        text: "开始",
        execute: function(selectedItems) {
            if (!checkArgValid(selectedItems)) {
                return;
            }
            OSS.invoke("startUpload", prepareUpladParam(selectedItems), function() {
                $timeout(function() {
                    _.each(selectedItems, OSSQueueItem.setProgress);
                });
            });
        },
        getState: function(selectedItems) {
            var len = selectedItems.length;
            if (!len) {
                return -1;
            }
            var hasUnValidItem = false;
            for (var i = 0; i < selectedItems.length; i++) {
                var item = selectedItems[i];
                if (!OSSQueueItem.isPaused(item)) {
                    hasUnValidItem = true;
                }
            }
            if (hasUnValidItem) {
                return -1;
            }
            return 1;
        }
    }, {
        name: "pause",
        text: "暂停",
        execute: function(selectedItems) {
            if (!checkArgValid(selectedItems)) {
                return;
            }
            OSS.invoke("stopUpload", prepareUpladParam(selectedItems), function() {
                $timeout(function() {
                    _.each(selectedItems, OSSQueueItem.setPaused);
                });
            });
        },
        getState: function(selectedItems) {
            var len = selectedItems.length;
            if (!len) {
                return 0;
            }
            var hasUnValidItem = false;
            var count = 0;
            for (var i = 0; i < selectedItems.length; i++) {
                var item = selectedItems[i];
                if (OSSQueueItem.isPaused(item) || OSSQueueItem.isError(item) || OSSQueueItem.isDone(item)) {
                    hasUnValidItem = true;
                    if (OSSQueueItem.isPaused(item)) {
                        count++;
                    }
                }
            }
            if (hasUnValidItem) {
                if (count == selectedItems.length) {
                    return -1;
                } else {
                    return 0;
                }
            }
            return 1;
        }
    }, {
        name: "cancel",
        text: "取消",
        execute: function(selectedItems) {
            if (!confirm("你确定要取消" + (selectedItems.length == 1 ? "这个" : "这" + selectedItems.length + "个") + "文件的上传？")) {
                return;
            }
            if (!checkArgValid(selectedItems)) {
                return;
            }
            OSS.invoke("deleteUpload", prepareUpladParam(selectedItems), function() {
                $timeout(function() {
                    $rootScope.$broadcast("removeQueue", "upload", selectedItems);
                });
            });
        },
        getState: function(selectedItems) {
            var len = selectedItems.length;
            if (!len) {
                return 0;
            }
            var doneItemsList = _.filter(selectedItems, function(item) {
                return OSSQueueItem.isDone(item) || OSSQueueItem.isError(item);
            });
            var progressList = _.filter(selectedItems, function(item) {
                return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item) || OSSQueueItem.isPaused(item);
            });
            if (doneItemsList && doneItemsList.length == selectedItems.length) {
                return -1;
            } else if (progressList && progressList.length == selectedItems.length) {
                return 1;
            }
            return 0;
        }
    }, {
        name: "remove",
        text: "移除",
        execute: function(selectedItems) {
            if (!checkArgValid(selectedItems)) {
                return;
            }
            OSS.invoke("deleteUpload", prepareUpladParam(selectedItems), function() {
                $timeout(function() {
                    $rootScope.$broadcast("removeQueue", "upload", selectedItems);
                });
            });
        },
        getState: function(selectedItems) {
            var len = selectedItems.length;
            if (!len) {
                return -1;
            }
            var doneItemsList = _.filter(selectedItems, function(item) {
                return OSSQueueItem.isDone(item) || OSSQueueItem.isError(item);
            });
            if (doneItemsList && doneItemsList.length == selectedItems.length) {
                return 1;
            }
            return -1;
        }
    }, {
        name: "pauseAll",
        text: "全部暂停",
        execute: function(selectedItems, items) {
            OSS.invoke("stopUpload", prepareUpladParam(), function() {
                $timeout(function() {
                    _.each(_.filter(items, function(item) {
                        return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item);
                    }), OSSQueueItem.setPaused);
                });
            });
        },
        getState: function(selectItems, items) {
            return _.find(items, function(item) {
                return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item);
            }) ? 1 : 0;
        }
    }, {
        name: "startAll",
        text: "全部开始",
        execute: function(selectedItems, items) {
            OSS.invoke("startUpload", prepareUpladParam(), function() {
                $timeout(function() {
                    _.each(_.filter(items, function(item) {
                        return OSSQueueItem.isPaused(item);
                    }), OSSQueueItem.setPaused);
                });
            });
        },
        getState: function(selectItems, items) {
            return _.find(items, function(item) {
                return OSSQueueItem.isPaused(item);
            }) ? 1 : 0;
        }
    }, {
        name: "removeAll",
        text: "清空已完成",
        execute: function(selectItems, items) {
            OSS.invoke("deleteUpload", {
                finish: 1,
                all: 1
            }, function() {
                $timeout(function() {
                    $rootScope.$broadcast("removeQueue", "upload", _.filter(items, function(item) {
                        return OSSQueueItem.isDone(item);
                    }));
                });
            });
        },
        getState: function(selectItems, items) {
            return _.find(items, function(item) {
                return OSSQueueItem.isDone(item);
            }) ? 1 : 0;
        }
    } ];
    var downloadMenu = [ {
        name: "start",
        text: "开始",
        execute: function(selectedItems) {
            if (!checkArgValid(selectedItems)) {
                return;
            }
            OSS.invoke("startDownload", prepareDownloadParam(selectedItems), function() {
                $timeout(function() {
                    _.each(selectedItems, OSSQueueItem.setProgress);
                });
            });
        },
        getState: function(selectedItems) {
            var len = selectedItems.length;
            if (!len) {
                return -1;
            }
            var hasUnValidItem = false;
            for (var i = 0; i < selectedItems.length; i++) {
                var item = selectedItems[i];
                if (!OSSQueueItem.isPaused(item)) {
                    hasUnValidItem = true;
                }
            }
            if (hasUnValidItem) {
                return -1;
            }
            return 1;
        }
    }, {
        name: "pause",
        text: "暂停",
        execute: function(selectedItems) {
            if (!checkArgValid(selectedItems)) {
                return;
            }
            OSS.invoke("stopDownload", prepareDownloadParam(selectedItems), function() {
                $timeout(function() {
                    _.each(selectedItems, OSSQueueItem.setPaused);
                });
            });
        },
        getState: function(selectedItems) {
            var len = selectedItems.length;
            if (!len) {
                return 0;
            }
            var hasUnValidItem = false;
            var count = 0;
            for (var i = 0; i < selectedItems.length; i++) {
                var item = selectedItems[i];
                if (OSSQueueItem.isPaused(item) || OSSQueueItem.isError(item) || OSSQueueItem.isDone(item)) {
                    hasUnValidItem = true;
                    if (OSSQueueItem.isPaused(item)) {
                        count++;
                    }
                }
            }
            if (hasUnValidItem) {
                if (count == selectedItems.length) {
                    return -1;
                } else {
                    return 0;
                }
            }
            return 1;
        }
    }, {
        name: "cancel",
        text: "取消",
        execute: function(selectedItems) {
            if (!confirm("你确定要取消" + (selectedItems.length == 1 ? "这个" : "这" + selectedItems.length + "个") + "文件的下载？")) {
                return;
            }
            if (!checkArgValid(selectedItems)) {
                return;
            }
            OSS.invoke("deleteDownload", prepareDownloadParam(selectedItems), function() {
                $timeout(function() {
                    $rootScope.$broadcast("removeQueue", "download", selectedItems);
                });
            });
        },
        getState: function(selectedItems) {
            if (!selectedItems || !selectedItems.length) return 0;
            var doneItemsList = _.filter(selectedItems, function(item) {
                return OSSQueueItem.isDone(item) || OSSQueueItem.isError(item);
            });
            var progressList = _.filter(selectedItems, function(item) {
                return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item) || OSSQueueItem.isPaused(item);
            });
            if (doneItemsList && doneItemsList.length == selectedItems.length) {
                return -1;
            } else if (progressList && progressList.length == selectedItems.length) {
                return 1;
            }
            return 0;
        }
    }, {
        name: "remove",
        text: "移除",
        execute: function(selectedItems) {
            if (!checkArgValid(selectedItems)) {
                return;
            }
            OSS.invoke("deleteDownload", prepareDownloadParam(selectedItems), function() {
                $timeout(function() {
                    $rootScope.$broadcast("removeQueue", "download", selectedItems);
                });
            });
        },
        getState: function(selectedItems) {
            var len = selectedItems.length;
            if (!len) {
                return -1;
            }
            var doneItemsList = _.filter(selectedItems, function(item) {
                return OSSQueueItem.isDone(item) || OSSQueueItem.isError(item);
            });
            if (doneItemsList && doneItemsList.length == selectedItems.length) {
                return 1;
            }
            return -1;
        }
    }, {
        name: "pauseAll",
        text: "全部暂停",
        execute: function(selectItems, items) {
            OSS.invoke("stopDownload", prepareDownloadParam(), function() {
                $timeout(function() {
                    _.each(_.filter(items, function(item) {
                        return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item);
                    }), OSSQueueItem.setPaused);
                });
            });
        },
        getState: function(selectItems, items) {
            return _.find(items, function(item) {
                return OSSQueueItem.isWaiting(item) || OSSQueueItem.isInProgress(item);
            }) ? 1 : 0;
        }
    }, {
        name: "startAll",
        text: "全部开始",
        execute: function(selectItems, items) {
            OSS.invoke("startDownload", prepareDownloadParam(), function() {
                _.each(_.filter(items, function(item) {
                    return OSSQueueItem.isPaused(item);
                }), OSSQueueItem.setProgress);
            });
        },
        getState: function(selectItems, items) {
            return _.find(items, function(item) {
                return OSSQueueItem.isPaused(item);
            }) ? 1 : 0;
        }
    }, {
        name: "removeAll",
        text: "清空已完成",
        execute: function(selectItems, items) {
            OSS.invoke("deleteDownload", {
                finish: 1,
                all: 1
            }, function() {
                $timeout(function() {
                    $rootScope.$broadcast("removeQueue", "download", _.filter(items, function(item) {
                        return OSSQueueItem.isDone(item);
                    }));
                });
            });
        },
        getState: function(selectItems, items) {
            return _.find(items, function(item) {
                return OSSQueueItem.isDone(item);
            }) ? 1 : 0;
        }
    } ];
    var groupMenu = [ [ "start", "pause", "cancel", "remove" ], [ "startAll", "pauseAll", "removeAll" ] ];
    var OSSQueueMenu = {
        getUploadMenu: function() {
            return uploadMenu;
        },
        getDownloadMenu: function() {
            return downloadMenu;
        },
        getUploadMenuItem: function(name) {
            return _.findWhere(uploadMenu, {
                name: name
            });
        },
        getDownloadMenuItem: function(name) {
            return _.findWhere(downloadMenu, {
                name: name
            });
        },
        groupBy: function(menus) {
            var groupMenus = [];
            angular.forEach(groupMenu, function(val, key) {
                if (!groupMenus[key]) {
                    groupMenus[key] = [];
                }
                angular.forEach(val, function(menuName) {
                    groupMenus[key].push(_.findWhere(menus, {
                        name: menuName
                    }));
                });
            });
            return groupMenus;
        }
    };
    return OSSQueueMenu;
} ]).factory("OSSMenu", [ "Clipboard", "OSSModal", "$rootScope", "OSSApi", "OSSException", function(Clipboard, OSSModal, $rootScope, OSSApi, OSSException) {
    var currentMenus = "upload create paste".split(" "), selectMenus = "download copy del get_uri set_header".split(" "), groupMenu = [ "upload create paste".split(" "), "download copy del".split(" "), "get_uri set_header".split(" ") ];
    var allMenu = [ {
        name: "upload",
        text: "上传",
        getState: function() {
            return 1;
        },
        execute: function(bucket, currentObject) {
            OSS.invoke("selectFileDlg", {
                path: "",
                disable_root: 1
            }, function(res) {
                if (!res || !res["list"] || !res["list"].length) {
                    return;
                }
                OSS.invoke("addFile", {
                    location: bucket["Location"],
                    bucket: bucket["Name"],
                    prefix: currentObject,
                    list: res["list"]
                }, function(res) {
                    if (!res.error) {
                        $rootScope.$broadcast("toggleTransQueue", true, "upload");
                        $rootScope.$broadcast("reloadUploadQueue");
                    } else {
                        $rootScope.$broadcast("showError", OSSException.getClientErrorMsg(res));
                    }
                });
            });
        }
    }, {
        name: "create",
        text: "新建文件夹",
        getState: function() {
            return 1;
        },
        execute: function(bucket, currentObject) {
            $rootScope.$broadcast("createObject", function(filename, callback) {
                var objectPath = currentObject ? currentObject + filename + "/" : filename + "/";
                OSSApi.putObject(bucket, objectPath, {
                    "Content-Type": ""
                }, "").success(function() {
                    $.isFunction(callback) && callback(true);
                    $rootScope.$broadcast("addObject", {
                        Prefix: objectPath
                    }, true);
                }).error(function(res, status) {
                    $.isFunction(callback) && callback(false);
                    $rootScope.$broadcast("showError", OSSException.getError(res, status).msg);
                });
            });
        }
    }, {
        name: "download",
        text: "下载",
        getState: function(selectedFiles) {
            var len = selectedFiles.length;
            if (!len) {
                return 0;
            }
            return 1;
        },
        execute: function(bucket, currentObject, selectedFiles) {
            var list = _.map(selectedFiles, function(val) {
                return {
                    location: bucket["Location"],
                    bucket: bucket["Name"],
                    object: val.path,
                    filesize: val.size,
                    etag: val.etag
                };
            });
            OSS.invoke("saveFile", {
                list: list
            }, function(res) {
                if (!res.error) {
                    $rootScope.$broadcast("toggleTransQueue", true, "download");
                    $rootScope.$broadcast("reloadDownloadQueue");
                } else {
                    $rootScope.$broadcast("showError", OSSException.getClientErrorMsg(res));
                }
            });
        }
    }, {
        name: "copy",
        text: "复制",
        getState: function(selectedFiles) {
            var len = selectedFiles.length;
            if (!len) {
                return 0;
            }
            return 1;
        },
        execute: function(bucket, currentObject, selectedFiles) {
            var data = JSON.stringify({
                ac: "copy",
                bucket: bucket,
                objects: selectedFiles
            });
            Clipboard.add(data);
        }
    }, {
        name: "paste",
        text: "粘贴",
        getState: function() {
            return Clipboard.len() ? 1 : -1;
        },
        execute: function(bucket, currentObject, selectedFiles) {
            var clipData = Clipboard.get();
            if (!clipData) return;
            clipData = JSON.parse(clipData);
            if (clipData.ac == "copy") {
                var targetBucket = clipData["bucket"];
                var list = clipData["objects"].map(function(object) {
                    return {
                        object: object.path,
                        filesize: object.filesize
                    };
                });
                OSS.invoke("copyObject", {
                    dstbucket: bucket["Name"],
                    dstobject: selectedFiles.length == 1 && selectedFiles[0].dir ? selectedFiles[0].path : currentObject,
                    dstlocation: bucket["Location"],
                    bucket: targetBucket["Name"],
                    location: targetBucket["Location"],
                    list: list
                }, function(res) {
                    if (!res.error) {
                        $rootScope.$broadcast("reloadFileList");
                    } else {
                        $rootScope.$broadcast("showError", OSSException.getClientErrorMsg(res));
                    }
                });
            }
        }
    }, {
        name: "del",
        text: "删除",
        getState: function(selectedFiles) {
            var len = selectedFiles.length;
            if (!len) {
                return 0;
            }
            return 1;
        },
        execute: function(bucket, currentObject, selectedFiles) {
            if (!confirm("确定要删除？")) {
                return;
            }
            var list = _.map(selectedFiles, function(object) {
                return {
                    object: object.path
                };
            });
            OSS.invoke("deleteObject", {
                bucket: bucket["Name"],
                location: bucket["Location"],
                list: list
            }, function(res) {
                if (!res.error) {
                    $rootScope.$broadcast("removeObject", selectedFiles);
                } else {
                    $rootScope.$broadcast("showError", OSSException.getClientErrorMsg(res));
                }
            });
        }
    }, {
        name: "get_uri",
        text: "获取地址",
        getState: function(selectedFiles) {
            var len = selectedFiles.length;
            if (!len || len > 1) {
                return 0;
            } else {
                return selectedFiles[0].dir ? 0 : 1;
            }
        },
        execute: function(bucket, currentObject, selectedFiles) {
            OSSModal.getObjectURI(bucket, selectedFiles[0]);
        }
    }, {
        name: "set_header",
        text: "设置HTTP头",
        getState: function(selectedFiles) {
            var len = selectedFiles.length;
            if (!len || len > 1) {
                return 0;
            } else {
                return selectedFiles[0].dir ? 0 : 1;
            }
        },
        execute: function(bucket, currentObject, selectedFiles) {
            OSSModal.setObjectHttpHeader(bucket, selectedFiles[0]);
        }
    } ];
    return {
        getAllMenu: function() {
            return allMenu;
        },
        getCurrentFileMenu: function() {
            return _.filter(allMenu, function(menu) {
                return _.indexOf(currentMenus, menu.name) >= 0;
            });
        },
        getSelectFileMenu: function() {
            return _.filter(allMenu, function(menu) {
                return _.indexOf(selectMenus, menu.name) >= 0;
            });
        },
        getMenu: function(name) {
            return _.findWhere(allMenu, {
                name: name
            });
        },
        groupMenu: function(menus) {
            var groupMenus = [];
            angular.forEach(groupMenu, function(val, key) {
                if (!groupMenus[key]) {
                    groupMenus[key] = [];
                }
                angular.forEach(val, function(menuName) {
                    groupMenus[key].push(_.findWhere(menus, {
                        name: menuName
                    }));
                });
            });
            return groupMenus;
        },
        getTopExcludeMenus: function() {
            return [ "paste" ];
        }
    };
} ]).factory("OSSUploadMenu", [ "Bucket", "OSSApi", "$rootScope", "OSSModal", function(Bucket, OSSApi, $rootScope, OSSModal) {
    var allMenu = [ {
        name: "remove",
        text: "删除",
        getState: function(selectedUploads) {
            var len = selectedUploads.length;
            if (!len) {
                return 0;
            }
            return 1;
        },
        execute: function(selectedUploads) {
            if (!confirm("确定要删除选择的碎片？")) {
                return;
            }
            angular.forEach(selectedUploads, function(upload) {
                OSSApi.deleteUpload(Bucket.getCurrentBucket(), upload).success(function() {
                    $rootScope.$broadcast("removeUpload", upload);
                }).error(function() {});
            });
        }
    }, {
        name: "detail",
        text: "详细",
        getState: function(selectedUploads) {
            var len = selectedUploads.length;
            if (!len || len > 1) {
                return 0;
            }
            return 1;
        },
        execute: function(selectedUploads) {
            OSSModal.uploadDetail(Bucket.getCurrentBucket(), selectedUploads[0]);
        }
    } ];
    return {
        getAllMenu: function() {
            return allMenu;
        }
    };
} ]).factory("OSSLocationHistory", [ "$location", "$rootScope", function($location, $rootScope) {
    var update = true, history = [], current, maxLen = 100;
    $rootScope.$on("$locationChangeSuccess", function() {
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
        reset: function() {
            history = [];
            current = 0;
            update = true;
        },
        go: function(isForward) {
            if (isForward && this.canForward() || !isForward && this.canBackward()) {
                update = false;
                $location.url(history[isForward ? ++current : --current]);
            }
        },
        forward: function() {
            this.go(true);
        },
        backward: function() {
            this.go();
        },
        canForward: function() {
            return current < history.length - 1;
        },
        canBackward: function() {
            return current > 0;
        }
    };
} ]).factory("OSSObject", [ "$location", "$filter", "OSSApi", "$q", "OSSLocation", function($location, $filter, OSSApi, $q, OSSLocation) {
    var fileSorts = {
        SORT_SPEC: [ "doc", "docx", "xls", "xlsx", "ppt", "pptx", "pdf", "ai", "cdr", "psd", "dmg", "iso", "md", "ipa", "apk", "gknote" ],
        SORT_MOVIE: [ "mp4", "mkv", "rm", "rmvb", "avi", "3gp", "flv", "wmv", "asf", "mpeg", "mpg", "mov", "ts", "m4v" ],
        SORT_MUSIC: [ "mp3", "wma", "wav", "flac", "ape", "ogg", "aac", "m4a" ],
        SORT_IMAGE: [ "jpg", "png", "jpeg", "gif", "psd", "bmp", "ai", "cdr" ],
        SORT_DOCUMENT: [ "doc", "docx", "xls", "xlsx", "ppt", "pptx", "pdf", "odt", "rtf", "ods", "csv", "odp", "txt", "gknote" ],
        SORT_CODE: [ "js", "c", "cpp", "h", "cs", "vb", "vbs", "java", "sql", "ruby", "php", "asp", "aspx", "html", "htm", "py", "jsp", "pl", "rb", "m", "css", "go", "xml", "erl", "lua", "md" ],
        SORT_ZIP: [ "rar", "zip", "7z", "cab", "tar", "gz", "iso" ],
        SORT_EXE: [ "exe", "bat", "com" ]
    };
    var currentObject = {};
    return {
        getCurrentObject: function() {
            return currentObject;
        },
        setCurrentObject: function(object) {
            currentObject = object;
        },
        list: function(bucket, prefix, delimiter, lastLoadMaker, loadFileCount) {
            var _self = this;
            var defer = $q.defer();
            OSSApi.getObjects(bucket, prefix, delimiter, lastLoadMaker, loadFileCount).success(function(res) {
                var contents = res["ListBucketResult"]["Contents"];
                contents = contents ? angular.isArray(contents) ? contents : [ contents ] : [];
                var commonPrefixes = res["ListBucketResult"]["CommonPrefixes"];
                commonPrefixes = commonPrefixes ? angular.isArray(commonPrefixes) ? commonPrefixes : [ commonPrefixes ] : [];
                var files = [];
                angular.forEach($.merge(commonPrefixes, contents), function(file) {
                    if (file.Key !== prefix && file.Prefix !== prefix) {
                        files.push(_self.format(file));
                    }
                });
                defer.resolve({
                    files: files,
                    marker: res["ListBucketResult"]["NextMarker"],
                    allLoaded: res["ListBucketResult"]["IsTruncated"] === "false"
                });
            }).error(function() {});
            return defer.promise;
        },
        format: function(object) {
            var path = object.Key || object.Prefix;
            var isDir = Util.String.lastChar(path) === "/" ? 1 : 0;
            var filename = isDir ? $filter("getPrefixName")(path, 1) : $filter("baseName")(path);
            return {
                path: path,
                dir: isDir,
                filename: filename,
                lastModified: object.LastModified || "",
                size: object.Size ? parseInt(object.Size) : 0,
                etag: object.ETag || ""
            };
        },
        open: function(bucket, path, isDir) {
            if (isDir) {
                $location.url(OSSLocation.getUrl(bucket.Name, path, "file"));
            } else {}
        },
        getIconSuffix: function(dir, filename) {
            var suffix = "";
            var sorts = fileSorts;
            if (dir == 1) {
                suffix = "folder";
            } else {
                var ext = Util.String.getExt(filename);
                if (jQuery.inArray(ext, sorts["SORT_SPEC"]) > -1) {
                    suffix = ext;
                } else if (jQuery.inArray(ext, sorts["SORT_MOVIE"]) > -1) {
                    suffix = "video";
                } else if (jQuery.inArray(ext, sorts["SORT_MUSIC"]) > -1) {
                    suffix = "audio";
                } else if (jQuery.inArray(ext, sorts["SORT_IMAGE"]) > -1) {
                    suffix = "image";
                } else if (jQuery.inArray(ext, sorts["SORT_DOCUMENT"]) > -1) {
                    suffix = "document";
                } else if (jQuery.inArray(ext, sorts["SORT_ZIP"]) > -1) {
                    suffix = "compress";
                } else if (jQuery.inArray(ext, sorts["SORT_EXE"]) > -1) {
                    suffix = "execute";
                } else {
                    suffix = "other";
                }
            }
            return suffix;
        },
        getIcon: function(dir, name) {
            return "icon-" + this.getIconSuffix(dir, name);
        }
    };
} ]).factory("OSSLocation", [ "$routeParams", function($routeParams) {
    var OSSLocation = {
        isCurrentBucket: function(bucketName) {
            return bucketName == $routeParams.bucket;
        },
        isCurrentObject: function(bucketName, objectPath) {
            if (objectPath && Util.String.lastChar(objectPath) != "/") {
                objectPath += "/";
            }
            return OSSLocation.isCurrentBucket(bucketName) && objectPath == ($routeParams.object || "");
        },
        getUrl: function(bucketName, prefix, filter) {
            filter = angular.isUndefined(filter) ? "file" : filter;
            prefix = angular.isUndefined(prefix) ? "" : prefix;
            var url = "";
            url += "/" + filter;
            url += "/" + bucketName;
            if (prefix) {
                url += "/" + prefix;
            }
            return url;
        }
    };
    return OSSLocation;
} ]).factory("Bread", [ "OSSLocation", function(OSSLocation) {
    var getFilterName = function(filter) {
        var filterName = "";
        switch (filter) {
          case "upload":
            filterName = "碎片管理";
            break;
        }
        return filterName;
    };
    return {
        getBreads: function(bucketName, path, filter) {
            var breads = [];
            breads.push({
                name: bucketName,
                url: OSSLocation.getUrl(bucketName)
            });
            if (filter !== "file") {
                breads.push({
                    name: getFilterName(filter),
                    url: OSSLocation.getUrl(bucketName, "", filter)
                });
            }
            if (path && path.length) {
                path = Util.String.rtrim(Util.String.ltrim(path, "/"), "/");
                var paths = path.split("/");
                for (var i = 0; i < paths.length; i++) {
                    var bread = {
                        name: paths[i]
                    };
                    var fullpath = "";
                    for (var j = 0; j <= i; j++) {
                        fullpath += paths[j] + "/";
                    }
                    bread.url = OSSLocation.getUrl(bucketName, fullpath);
                    breads.push(bread);
                }
            }
            return breads;
        }
    };
} ]).factory("RequestXML", function() {
    return {
        getXMLHeader: function() {
            return '<?xml version="1.0" encoding="UTF-8"?>';
        },
        getCreateBucketXML: function(region) {
            region = region.replace("-internal", "");
            return [ this.getXMLHeader(), "<CreateBucketConfiguration >", "<LocationConstraint >", region, "</LocationConstraint >", "</CreateBucketConfiguration >" ].join("");
        }
    };
}).factory("Bucket", [ "OSSApi", "$q", function(OSSApi, $q) {
    var buckets = null;
    var deferred = $q.defer();
    var listPromise;
    return {
        list: function() {
            if (listPromise) {
                return listPromise;
            } else {
                OSSApi.getBuckets().success(function(res) {
                    var resBuckets = res["ListAllMyBucketsResult"]["Buckets"]["Bucket"];
                    buckets = angular.isArray(resBuckets) ? resBuckets : [ resBuckets ];
                    deferred.resolve(buckets);
                }).error(function() {
                    deferred.reject();
                });
                return listPromise = deferred.promise;
            }
        },
        getAcls: function() {
            return {
                "public-read-write": "公共读写",
                "public-read": "公共读",
                "private": "私有"
            };
        },
        getBucket: function(buckeName) {
            return _.findWhere(buckets, {
                Name: buckeName
            });
        },
        select: function(bucket) {
            bucket.selected = true;
        },
        unselected: function(bucket) {
            bucket.selected = false;
        },
        getCurrentBucket: function() {
            return _.findWhere(buckets, {
                selected: true
            });
        }
    };
} ]).factory("OSSApi", [ "$http", "RequestXML", "OSSConfig", "OSSRegion", function($http, RequestXML, OSSConfig, OSSRegion) {
    var OSSAccessKeyId = OSS.invoke("getAccessID");
    var currentLocation = OSS.invoke("getCurrentLocation");
    var host = OSSConfig.getHost();
    var getExpires = function(expires) {
        expires = angular.isUndefined(expires) ? 60 : expires;
        return parseInt(new Date().getTime() / 1e3) + expires;
    };
    var getRequestUrl = function(bucket, region, expires, signature, canonicalizedResource, extraParam) {
        region = OSSRegion.changeLocation(region);
        var requestUrl = "http://" + (bucket ? bucket + "." : "") + (region ? region + "." : "") + host;
        canonicalizedResource = canonicalizedResource.replace(new RegExp("^/" + bucket), "");
        requestUrl += canonicalizedResource;
        requestUrl += (requestUrl.indexOf("?") >= 0 ? "&" : "?") + $.param({
            OSSAccessKeyId: OSSAccessKeyId,
            Expires: expires,
            Signature: signature
        });
        requestUrl += extraParam ? "&" + $.param(extraParam) : "";
        return requestUrl;
    };
    var getCanonicalizedResource = function(bucketName, objectName, subResources) {
        var subResourcesStr = subResources ? Util.param(subResources) : "";
        return "/" + (bucketName ? bucketName + "/" : "") + (objectName ? objectName : "") + (subResourcesStr ? "?" + subResourcesStr : "");
    };
    return {
        getURI: function(bucket, objectName, expires) {
            if (expires) {
                return "http://" + bucket.Name + "." + bucket.Location + "." + host + "/" + encodeURIComponent(objectName);
            } else {
                expires = getExpires(expires);
                var canonicalizedResource = getCanonicalizedResource(bucket.Name, objectName);
                var signature = OSS.invoke("getSignature", {
                    verb: "GET",
                    expires: expires,
                    canonicalized_resource: canonicalizedResource
                });
                return getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
            }
        },
        getBuckets: function() {
            var expires = getExpires();
            var canonicalizedResource = getCanonicalizedResource();
            var signature = OSS.invoke("getSignature", {
                verb: "GET",
                expires: expires,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl("", currentLocation ? currentLocation : "oss", expires, signature, canonicalizedResource);
            return $http.get(requestUrl);
        },
        createBucket: function(bucketName, region, acl) {
            var expires = getExpires();
            var canonicalizedOSSheaders = {
                "x-oss-acl": acl
            };
            var canonicalizedResource = getCanonicalizedResource(bucketName);
            var contentType = "application/xml";
            var signature = OSS.invoke("getSignature", {
                verb: "PUT",
                content_type: contentType,
                expires: expires,
                canonicalized_oss_headers: canonicalizedOSSheaders,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl(bucketName, region, expires, signature, canonicalizedResource);
            var headers = angular.extend({}, canonicalizedOSSheaders, {
                "Content-Type": contentType
            });
            return $http.put(requestUrl, RequestXML.getCreateBucketXML(region), {
                headers: headers
            });
        },
        getBucketAcl: function(bucket) {
            var expires = getExpires();
            var canonicalizedResource = getCanonicalizedResource(bucket.Name, "", {
                acl: undefined
            });
            var signature = OSS.invoke("getSignature", {
                verb: "GET",
                expires: expires,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
            return $http.get(requestUrl);
        },
        editBucket: function(bucket, acl) {
            var expires = getExpires();
            var canonicalizedOSSheaders = {
                "x-oss-acl": acl
            };
            var canonicalizedResource = getCanonicalizedResource(bucket.Name, "");
            var contentType = "application/xml";
            var signature = OSS.invoke("getSignature", {
                verb: "PUT",
                content_type: contentType,
                expires: expires,
                canonicalized_oss_headers: canonicalizedOSSheaders,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
            var headers = angular.extend({}, canonicalizedOSSheaders, {
                "Content-Type": contentType
            });
            return $http.put(requestUrl, "", {
                headers: headers
            });
        },
        delBucket: function(bucket) {
            var expires = getExpires();
            var canonicalizedResource = getCanonicalizedResource(bucket.Name, "");
            var signature = OSS.invoke("getSignature", {
                verb: "DELETE",
                expires: expires,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
            return $http.delete(requestUrl);
        },
        getObjects: function(bucket, prefix, delimiter, marker, maxKeys) {
            var param = {
                prefix: prefix
            };
            $.extend(param, {
                delimiter: delimiter,
                marker: marker,
                "max-keys": maxKeys
            });
            var expires = getExpires();
            var canonicalizedResource = getCanonicalizedResource(bucket.Name, "");
            var signature = OSS.invoke("getSignature", {
                verb: "GET",
                expires: expires,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource, param);
            return $http.get(requestUrl);
        },
        getObjectMeta: function(bucket, object) {
            var expires = getExpires();
            var canonicalizedResource = getCanonicalizedResource(bucket.Name, object);
            var signature = OSS.invoke("getSignature", {
                verb: "HEAD",
                expires: expires,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
            return $http.head(requestUrl);
        },
        putObject: function(bucket, objectPath, headers, canonicalizedOSSheaders) {
            var expires = getExpires();
            var canonicalizedResource = getCanonicalizedResource(bucket.Name, objectPath);
            var signature = OSS.invoke("getSignature", {
                verb: "PUT",
                content_type: headers["Content-Type"],
                expires: expires,
                canonicalized_oss_headers: canonicalizedOSSheaders,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
            return $http.put(requestUrl, "", {
                headers: angular.extend({}, headers, canonicalizedOSSheaders)
            });
        },
        listUploads: function(bucket, prefix, delimiter, keyMarker, maxUploads, uploadIdMaker) {
            var param = {
                prefix: prefix
            };
            $.extend(param, {
                delimiter: delimiter,
                "key-marker": keyMarker,
                "upload-id-marker": uploadIdMaker,
                "max-uploads": maxUploads
            });
            var expires = getExpires();
            var canonicalizedResource = getCanonicalizedResource(bucket.Name, "", {
                uploads: undefined
            });
            var signature = OSS.invoke("getSignature", {
                verb: "GET",
                expires: expires,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource, param);
            return $http.get(requestUrl);
        },
        deleteUpload: function(bucket, upload) {
            var expires = getExpires();
            var canonicalizedResource = getCanonicalizedResource(bucket.Name, upload.path, {
                uploadId: upload.id
            });
            var signature = OSS.invoke("getSignature", {
                verb: "DELETE",
                expires: expires,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource);
            return $http.delete(requestUrl);
        },
        listUploadPart: function(bucket, upload, partNumberMaker, maxParts) {
            var param = {
                "part-number-marker": partNumberMaker,
                "max-parts": maxParts
            };
            var expires = getExpires();
            var canonicalizedResource = getCanonicalizedResource(bucket.Name, upload.path, {
                uploadId: upload.id
            });
            var signature = OSS.invoke("getSignature", {
                verb: "GET",
                expires: expires,
                canonicalized_resource: canonicalizedResource
            });
            var requestUrl = getRequestUrl(bucket.Name, bucket.Location, expires, signature, canonicalizedResource, param);
            return $http.get(requestUrl);
        }
    };
} ]).factory("OSSUploadPart", [ "OSSApi", "$filter", "$q", function(OSSApi, $filter, $q) {
    return {
        list: function(bucket, prefix, delimiter, lastKeyMaker, loadFileCount, lastUploadMaker) {
            var _self = this;
            var defer = $q.defer();
            OSSApi.listUploads(bucket, prefix, delimiter, lastKeyMaker, loadFileCount, lastUploadMaker).success(function(res) {
                OSS.log("listUploads:res", res);
                var result = res["ListMultipartUploadsResult"];
                var contents = result["Upload"];
                contents = contents ? angular.isArray(contents) ? contents : [ contents ] : [];
                var commonPrefixes = result["CommonPrefixes"];
                commonPrefixes = commonPrefixes ? angular.isArray(commonPrefixes) ? commonPrefixes : [ commonPrefixes ] : [];
                var files = [];
                angular.forEach($.merge(contents, commonPrefixes), function(file) {
                    if (file.Key !== prefix && file.Prefix !== prefix) {
                        files.push(_self.format(file));
                    }
                });
                defer.resolve({
                    uploads: files,
                    keyMaker: result["NextKeyMarker"],
                    uploadIdMaker: result["NextUploadIdMarker"],
                    allLoaded: result["IsTruncated"] === "false"
                });
            }).error(function() {});
            return defer.promise;
        },
        format: function(upload) {
            var path = upload.Key || upload.Prefix;
            var isDir = Util.String.lastChar(path) === "/" ? 1 : 0;
            var filename = isDir ? $filter("getPrefixName")(path, 1) : $filter("baseName")(path);
            return {
                path: path,
                dir: isDir,
                filename: filename,
                id: upload.UploadId,
                initTime: upload.Initiated
            };
        }
    };
} ]).factory("OSSModal", [ "$modal", "OSSDialog", "OSSConfig", "Bucket", "OSSApi", "OSSObject", "OSSException", "OSSRegion", "$rootScope", "usSpinnerService", function($modal, OSSDialog, OSSConfig, Bucket, OSSApi, OSSObject, OSSException, OSSRegion, $rootScope, usSpinnerService) {
    var defaultOption = {
        backdrop: "static"
    };
    return {
        setting: function() {
            var option = {
                templateUrl: "views/setting_modal.html",
                windowClass: "setting_modal",
                controller: function($scope, $modalInstance) {
                    $scope.min = 0;
                    $scope.max = 10;
                    $scope.isCustomClient = OSSConfig.isCustomClient();
                    var setting = OSS.invoke("getTransInfo");
                    $scope.setting = setting;
                    $scope.saveSetting = function(setting) {
                        OSS.invoke("setTransInfo", setting);
                        alert("设置成功");
                        $modalInstance.dismiss("cancel");
                    };
                    $scope.cancel = function() {
                        $modalInstance.dismiss("cancel");
                    };
                    $scope.exportAuth = function() {
                        OSSDialog.exportAuthorization();
                    };
                }
            };
            option = angular.extend({}, defaultOption, option);
            return $modal.open(option);
        },
        addBucket: function(bucket) {
            var _context = this;
            var option = {
                templateUrl: "views/add_bucket_modal.html",
                windowClass: "add_bucket_modal",
                controller: function($scope, $modalInstance) {
                    $scope.loading = false;
                    $scope.getingBucketInfo = false;
                    $scope.bucket = bucket || null;
                    $scope.cBucket = {};
                    var acls = [], regions = [];
                    angular.forEach(Bucket.getAcls(), function(val, key) {
                        acls.push({
                            name: val,
                            value: key
                        });
                    });
                    $scope.acls = acls;
                    if (!bucket) {
                        $scope.selectAcl = $scope.acls[0];
                    }
                    $scope.$watch("loading", function(newVal) {
                        if (newVal) {
                            usSpinnerService.spin("add-bucket-spinner");
                        } else {
                            usSpinnerService.stop("add-bucket-spinner");
                        }
                    });
                    $scope.$watch("getingBucketInfo", function(newVal) {
                        if (newVal) {
                            usSpinnerService.spin("get-bucket-spinner");
                        } else {
                            usSpinnerService.stop("get-bucket-spinner");
                        }
                    });
                    $scope.isDisableLocationSelect = OSSConfig.isDisableLocationSelect();
                    if (!$scope.isDisableLocationSelect) {
                        $scope.regions = OSSRegion.list();
                    }
                    if (!bucket) {
                        if (!$scope.isDisableLocationSelect) {
                            $scope.cBucket.region = $scope.regions[0];
                        } else {
                            var currentLocation = OSS.invoke("getCurrentLocation");
                            if (!currentLocation) {
                                return;
                            }
                            $scope.cBucket.region = OSSRegion.getRegionByLocation(currentLocation);
                        }
                    } else {
                        $scope.cBucket.region = OSSRegion.getRegionByLocation(bucket.Location);
                    }
                    if ($scope.bucket) {
                        $scope.loading = true;
                        $scope.getingBucketInfo = true;
                        OSSApi.getBucketAcl(bucket).success(function(res) {
                            $scope.loading = false;
                            $scope.getingBucketInfo = false;
                            $scope.selectAcl = Util.Array.getObjectByKeyValue($scope.acls, "value", res["AccessControlPolicy"]["AccessControlList"]["Grant"]);
                        }).error(function() {
                            $scope.loading = false;
                            $scope.getingBucketInfo = false;
                        });
                    } else {
                        $scope.loading = true;
                    }
                    $scope.cancel = function() {
                        $modalInstance.dismiss("cancel");
                    };
                    $scope.loading = false;
                    $scope.createBucket = function(bucketName, region, acl) {
                        if (!bucketName || !bucketName.length) {
                            alert("Bucket的名称不能为空");
                            return;
                        }
                        $scope.loading = true;
                        OSSApi.createBucket(bucketName, region.location, acl.value).success(function() {
                            $scope.loading = false;
                            $modalInstance.close({
                                act: "add",
                                bucket: {
                                    Name: bucketName,
                                    Location: region.location,
                                    Acl: acl.value
                                }
                            });
                        }).error(function(response, statusCode) {
                            $scope.loading = false;
                            $rootScope.$broadcast("showError", OSSException.getError(response, statusCode).msg);
                        });
                    };
                    $scope.editBucket = function(acl) {
                        $scope.loading = true;
                        OSSApi.editBucket(bucket, acl.value).success(function() {
                            $scope.loading = false;
                            angular.extend(bucket, {
                                Acl: acl.value
                            });
                            $modalInstance.close({
                                act: "edit",
                                bucket: bucket
                            });
                        }).error(function(response, statusCode) {
                            $scope.loading = false;
                            $rootScope.$broadcast("showError", OSSException.getError(response, statusCode).msg);
                        });
                    };
                    $scope.delBucket = function() {
                        _context.delBucketConfirm(bucket).result.then(function(param) {
                            OSS.invoke("deleteBucket", {
                                keyid: param.accessKey,
                                keysecret: param.accessSecret,
                                bucket: bucket.Name,
                                location: bucket.Location
                            }, function(res) {
                                if (!res.error) {
                                    $rootScope.$broadcast("removeBucket", bucket);
                                    $modalInstance.close();
                                } else {
                                    alert(OSSException.getClientErrorMsg(res));
                                }
                            });
                        });
                    };
                }
            };
            option = angular.extend({}, defaultOption, option);
            return $modal.open(option);
        },
        setObjectHttpHeader: function(bucket, object) {
            var option = {
                templateUrl: "views/set_http_header_modal.html",
                windowClass: "set_http_header_modal",
                controller: function($scope, $modalInstance) {
                    $scope.object = object;
                    $scope.headers = [];
                    angular.forEach("Content-Type Content-Disposition Content-Language Cache-Control Expires".split(" "), function(val) {
                        $scope.headers.push({
                            name: val,
                            text: val
                        });
                    });
                    $scope.customHeaders = [ {
                        nameModel: "",
                        contentModel: ""
                    } ];
                    OSSApi.getObjectMeta(bucket, object.path).success(function(data, status, getHeader) {
                        angular.forEach($scope.headers, function(header) {
                            header.model = getHeader(header.name);
                        });
                        angular.forEach(getHeader(), function(val, key) {
                            if (key.indexOf("x-oss-meta-") === 0) {
                                $scope.customHeaders.push({
                                    nameModel: key.replace(/^x-oss-meta-/, ""),
                                    contentModel: val
                                });
                            }
                        });
                    }).error(function() {});
                    $scope.setHttpHeader = function(headers, customHeaders) {
                        var ossHeaders = {}, canonicalizedOSSheaders = {};
                        angular.forEach(headers, function(val) {
                            if (val.model) {
                                ossHeaders[val.name] = val.model;
                            }
                        });
                        angular.forEach(customHeaders, function(val) {
                            if (val.nameModel) {
                                canonicalizedOSSheaders["x-oss-meta-" + val.nameModel.toLowerCase()] = val.contentModel || "";
                            }
                        });
                        OSSApi.putObject(bucket, object.path, ossHeaders, canonicalizedOSSheaders).success(function(res) {
                            $modalInstance.close();
                        });
                    };
                    $scope.addCustomHeader = function() {
                        $scope.customHeaders.push({
                            nameModel: "",
                            contentModel: ""
                        });
                    };
                    $scope.removeCustomHeader = function(header) {
                        var index = _.indexOf($scope.customHeaders, header);
                        index > -1 && $scope.customHeaders.splice(index, 1);
                    };
                    $scope.cancel = function() {
                        $modalInstance.dismiss("cancel");
                    };
                }
            };
            option = angular.extend({}, defaultOption, option);
            return $modal.open(option);
        },
        getObjectURI: function(bucket, object) {
            var option = {
                templateUrl: "views/get_object_uri_modal.html",
                windowClass: "get_object_uri_modal",
                controller: function($scope, $modalInstance) {
                    $scope.filename = Util.String.baseName(object.path);
                    $scope.expire = 3600;
                    $scope.loading = true;
                    $scope.$watch("loading", function(newVal) {
                        if (newVal) {
                            usSpinnerService.spin("get-acl-spinner");
                        } else {
                            usSpinnerService.stop("get-acl-spinner");
                        }
                    });
                    OSSApi.getBucketAcl(bucket).success(function(res) {
                        $scope.loading = false;
                        if (res && res["AccessControlPolicy"] && res["AccessControlPolicy"]["AccessControlList"] && res["AccessControlPolicy"]["AccessControlList"]["Grant"]) {
                            var acl = res["AccessControlPolicy"]["AccessControlList"]["Grant"];
                            if (acl != "private") {
                                $scope.uri = OSSApi.getURI(bucket, object.path);
                            }
                        }
                    }).error(function() {
                        $scope.loading = false;
                    });
                    $scope.getUri = function(expire) {
                        $scope.uri = OSSApi.getURI(bucket, object.path, expire);
                    };
                    $scope.copyToClipborad = function(uri) {
                        OSS.invoke("setClipboardData", uri);
                        alert("已复制到剪切板");
                    };
                    $scope.cancel = function() {
                        $modalInstance.dismiss("cancel");
                    };
                }
            };
            option = angular.extend({}, defaultOption, option);
            return $modal.open(option);
        },
        uploadDetail: function(bucket, upload) {
            var option = {
                templateUrl: "views/upload_detail_modal.html",
                windowClass: "upload_detail_modal",
                controller: function($scope, $modalInstance) {
                    $scope.loading = false;
                    $scope.parts = [];
                    var size = 50;
                    var lastMaker = "";
                    var allLoaded = false;
                    var loadPart = function() {
                        if ($scope.loading) {
                            return;
                        }
                        $scope.loading = true;
                        OSSApi.listUploadPart(bucket, upload, lastMaker, size).success(function(res) {
                            $scope.loading = false;
                            var result = res["ListPartsResult"];
                            lastMaker = result["NextPartNumberMarker"];
                            allLoaded = result["IsTruncated"] === "false";
                            var parts = angular.isArray(result["Part"]) ? result["Part"] : [ result["Part"] ];
                            $scope.parts = $scope.parts.concat(parts);
                        }).error(function() {
                            $scope.loading = false;
                        });
                    };
                    loadPart();
                    $scope.loadMore = function() {
                        if (allLoaded) {
                            return;
                        }
                        loadPart();
                    };
                    $scope.cancel = function() {
                        $modalInstance.dismiss("cancel");
                    };
                }
            };
            option = angular.extend({}, defaultOption, option);
            return $modal.open(option);
        },
        delBucketConfirm: function(bucket) {
            var option = {
                templateUrl: "views/del_bucket_confirm_modal.html",
                windowClass: "del_bucket_confirm_modal",
                controller: function($scope, $modalInstance) {
                    $scope.cancel = function() {
                        $modalInstance.dismiss("cancel");
                    };
                    $scope.delConfirm = function(accessKey, accessSecret) {
                        if (!confirm("确定要删除Bucket “" + bucket.Name + "“吗？删除后数据将无法恢复")) {
                            return;
                        }
                        if (!accessKey) {
                            alert("请输入 Access Key ID");
                            return;
                        }
                        if (!accessSecret) {
                            alert("请输入 Access Key Secret");
                            return;
                        }
                        $modalInstance.close({
                            accessKey: accessKey,
                            accessSecret: accessSecret
                        });
                    };
                }
            };
            option = angular.extend({}, defaultOption, option);
            return $modal.open(option);
        }
    };
} ]);

"use strict";

angular.module("ossClientUiApp").filter("bitSize", function() {
    return Util.Number.bitSize;
}).filter("formatTime", [ "$filter", function($filter) {
    return function(dateStr) {
        return $filter("date")(Date.parse(dateStr), "yyyy-MM-dd HH:mm:ss");
    };
} ]).filter("getPrefixName", function() {
    return function(prefix, removeLastSlash) {
        removeLastSlash = angular.isUndefined(removeLastSlash) ? 0 : removeLastSlash;
        var arr = prefix.split("/");
        return arr[arr.length - 2] + (removeLastSlash ? "" : "/");
    };
}).filter("getRemainTime", function($filter) {
    return function(speed, filesize, offset) {
        if (!speed) {
            return "--:--:--";
        }
        var time = (filesize - offset) / speed * 1e3;
        return time ? $filter("date")(time, "00:mm:ss") : "--:--:--";
    };
}).filter("getQueueState", function($filter) {
    return function(type, status, speed, filesize, offset, errormsg) {
        var state = "";
        switch (status) {
          case 1:
            state = $filter("getRemainTime")(speed, filesize, offset);
            break;

          case 2:
            state = "等待" + (type == "upload" ? "上传" : "下载");
            break;

          case 3:
            state = "暂停";
            break;

          case 4:
            state = "完成";
            break;

          case 5:
            state = "错误：" + errormsg;
            break;
        }
        return state;
    };
}).filter("getLocation", [ "OSSLocation", function(OSSLocation) {
    return OSSLocation.getUrl;
} ]).filter("baseName", function() {
    return Util.String.baseName;
});

"use strict";

angular.module("ossClientUiApp").directive("createFile", [ "$parse", function($parse) {
    return {
        restrict: "A",
        link: function postLink(scope, element, attrs) {
            var fn = $parse(attrs.createFileCallback);
            var createFileItem;
            scope.$watch(attrs.createFile, function(value, oldValue) {
                if (value) {
                    element.scrollTop(0);
                    var defaultFilename = "新建文件夹";
                    var $input = angular.element('<input name="folder-name" class="form-control" value="' + defaultFilename + '" />'), $okBtn = angular.element('<button class="btn btn-primary">确定</button>'), $cancelBtn = angular.element('<button class="btn btn-default">取消</button>');
                    createFileItem = angular.element('<div class="clearfix file-item new-file-item"><div class="pull-left filename"><i class="file-icon-32 icon-folder"></i></div></div>');
                    createFileItem.find(".filename").append($input).append($okBtn).append($cancelBtn);
                    createFileItem.prependTo(element);
                    $input[0].select();
                    $input[0].selectionStart = 0;
                    $input[0].selectionEnd = defaultFilename.length;
                    $input.focus();
                    $okBtn.click(function() {
                        scope.$apply(function() {
                            var filename = $.trim($input.val());
                            createFileItem.find("button").prop("disabled", true);
                            $.isFunction(fn) && fn(scope, {
                                filename: filename,
                                callback: function(success) {
                                    if (success) {
                                        scope[attrs.createFile] = false;
                                    } else {
                                        createFileItem.find("button").prop("disabled", false);
                                    }
                                }
                            });
                        });
                    });
                    $cancelBtn.click(function() {
                        scope.$apply(function() {
                            scope[attrs.createFile] = false;
                        });
                    });
                    $input.on("keydown", function(event) {
                        if (event.keyCode == 13) {
                            $okBtn.trigger("click");
                        }
                    });
                } else {
                    createFileItem && createFileItem.remove();
                }
            });
        }
    };
} ]).directive("smartSearch", [ "$location", "$rootScope", "$filter", "OSSObject", "Bucket", function($location, $rootScope, $filter, OSSObject, Bucket) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function postLink(scope, element, attrs, ngModel) {
            var bread = element.parent().next();
            element.on("keydown", function(e) {
                var keyword = e.keyCode;
                if (keyword != 13) {
                    return;
                }
                scope.$apply(function() {
                    $location.search({
                        keyword: ngModel.$modelValue,
                        scope: ""
                    });
                });
            });
            var $breadList = bread.find(".bread-list");
            var $searchWrapper = element.parent();
            var hideSearch = function() {
                $searchWrapper.find(".search-scope").remove();
                $searchWrapper.find(".fa-remove").remove();
                $breadList.show();
                element.next(".fa").show();
                scope[attrs.ngModel] = "";
            };
            var showSearch = function() {
                if (element.next(".search-scope").size()) {
                    return;
                }
                var currentObj = OSSObject.getCurrentObject();
                var currentBucket = Bucket.getCurrentBucket();
                var searchScopeName = currentObj.path ? $filter("getPrefixName")(currentObj.path, 1) : currentBucket.Name;
                var $removeIcon = $('<a href="javascript:;" class="fa fa-remove fa-lg"></a>');
                var $searchScope = $('<div class="search-scope"> 在 <span>' + searchScopeName + "</span> 中搜索</div>");
                element.next(".fa").hide();
                element.after($searchScope).after($removeIcon);
                element.css({
                    "padding-left": $searchScope.outerWidth(true) + 6
                });
                $breadList.hide();
                $removeIcon.on("click", function() {
                    scope.$apply(function() {
                        hideSearch();
                    });
                });
                element.focus();
            };
            element.on("mousedown", function() {
                showSearch();
            });
            element.next(".fa").on("click", function() {
                showSearch();
            });
            scope.$on("$locationChangeSuccess", function() {
                var param = $location.search();
                if (!param || !param.keyword) {
                    hideSearch();
                }
            });
        }
    };
} ]).directive("queueItem", [ "OSSQueueItem", function(OSSQueueItem) {
    return {
        templateUrl: "views/queue-item.html",
        restrict: "E",
        replace: true,
        scope: {
            type: "@",
            item: "=data",
            executeCmd: "&"
        },
        link: function postLink(scope) {
            scope.handleCmdClick = function(cmd, item) {
                scope.executeCmd({
                    cmd: cmd,
                    item: item
                });
            };
            scope.isError = OSSQueueItem.isError;
            scope.isInProgress = OSSQueueItem.isInProgress;
            scope.isDone = OSSQueueItem.isDone;
            scope.isWaiting = OSSQueueItem.isWaiting;
            scope.isPasued = OSSQueueItem.isPasued;
            scope.getProgress = function(item) {
                if (scope.isPasued(item) || scope.isWaiting(item) || scope.isInProgress(item)) {
                    if (item.filesize == 0) {
                        return 100;
                    }
                    return item.offset / item.filesize * 100;
                } else {
                    return 100;
                }
            };
        }
    };
} ]).directive("menu", [ function() {
    return {
        template: '<button class="btn btn-default" ng-class="menu-{{name}}" ng-disabled="state==0" ng-show="state>-1" ng-transclude></button>',
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {
            text: "@",
            name: "@",
            state: "=",
            shortcut: "@",
            execute: "&"
        },
        link: function postLink(scope, element, attrs) {
            element.click(function(event) {
                scope.execute({
                    $event: event
                });
            });
        }
    };
} ]).directive("fileIcon", [ "OSSObject", function(OSSObject) {
    return {
        template: '<i class="file-icon-{{size}} {{icon}}"></i>',
        restrict: "E",
        replace: true,
        scope: {
            dir: "@",
            filename: "@",
            size: "@"
        },
        link: function postLink(scope, element, attrs) {
            scope.icon = OSSObject.getIcon(scope.dir, scope.filename);
        }
    };
} ]).directive("keyboardNav", [ "$parse", function($parse) {
    return {
        restrict: "A",
        link: function postLink(scope, element, attrs) {
            var list = [], enableKeyboardNav = false, shiftLastIndex = 0, keyboardNavStep = 1;
            scope.$watch(attrs.keyboardNavList, function(newVal) {
                shiftLastIndex = 0;
                list = newVal;
            });
            attrs.$observe("keyboardNav", function(newVal) {
                enableKeyboardNav = newVal == 1 ? true : false;
            });
            attrs.$observe("keyboardNavStep", function(newVal) {
                keyboardNavStep = parseInt(newVal);
            });
            var getSelectedList = $parse(attrs.getSelectedList);
            var getSelectedMinIndex = function() {
                return _.indexOf(list, _.findWhere(list, {
                    selected: true
                }));
            };
            var getSelectedMaxIndex = function() {
                var selectedFiles = getSelectedList(scope);
                if (selectedFiles && selectedFiles.length) {
                    return _.indexOf(list, selectedFiles[selectedFiles.length - 1]);
                }
                return -1;
            };
            var select = $parse(attrs.select);
            var unSelect = $parse(attrs.unSelect);
            var unSelectAll = function() {
                angular.forEach(getSelectedList(scope), function(item) {
                    unSelect(scope, {
                        item: item
                    });
                });
            };
            var upLeftPress = function($event) {
                var step = keyboardNavStep;
                var initIndex = list.length + step - 1;
                var selectedIndex = getSelectedMinIndex();
                if (selectedIndex >= 0) {
                    initIndex = selectedIndex;
                }
                var newIndex = initIndex - step;
                if (newIndex < 0) {
                    newIndex = 0;
                }
                if ($event.shiftKey) {
                    for (var i = initIndex > list.length - 1 ? list.length - 1 : initIndex; i >= newIndex; i--) {
                        select(scope, {
                            item: list[i]
                        });
                    }
                } else {
                    unSelectAll();
                    select(scope, {
                        item: list[newIndex]
                    });
                    shiftLastIndex = newIndex;
                }
            };
            var downRightPress = function($event) {
                var step = keyboardNavStep;
                var initIndex = -1 * step;
                var selectedIndex = getSelectedMaxIndex();
                if (selectedIndex >= 0) {
                    initIndex = selectedIndex;
                }
                var newIndex = initIndex + step;
                if (newIndex > list.length - 1) {
                    newIndex = list.length - 1;
                }
                if ($event.shiftKey) {
                    for (var i = initIndex > 0 ? initIndex : 0; i <= newIndex; i++) {
                        select(scope, {
                            item: list[i]
                        });
                    }
                } else {
                    unSelectAll();
                    select(scope, {
                        item: list[newIndex]
                    });
                    shiftLastIndex = newIndex;
                }
            };
            $(document).on("keydown.keyboardNav", function($event) {
                if (!enableKeyboardNav) {
                    return;
                }
                if ([ "INPUT", "TEXTAREA" ].indexOf($event.target.nodeName) >= 0) {
                    return;
                }
                scope.$apply(function() {
                    switch ($event.keyCode) {
                      case 37:
                      case 38:
                        upLeftPress($event);
                        break;

                      case 39:
                      case 40:
                        downRightPress($event);
                        break;
                    }
                });
                $event.preventDefault();
            });
            scope.$on("$destroy", function() {
                $(document).off("keydown.keyboardNav");
            });
        }
    };
} ]);