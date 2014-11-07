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
    if (!config) {
        config = {
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
        };
    }
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
    var erroList = {
        AccessDenied: "拒绝访问",
        BucketAlreadyExists: "Bucket已经存在",
        BucketNotEmpty: "Bucket不为空",
        EntityTooLarge: "实体过大",
        EntityTooSmall: "实体过小",
        FileGroupTooLarge: "文件组过大",
        FilePartNotExist: "文件Part不存在",
        FilePartStale: "文件Part过时",
        InvalidArgument: "参数格式错误",
        InvalidAccessKeyId: "Access Key ID不存在",
        InvalidBucketName: "无效的Bucket名字",
        InvalidDigest: "无效的摘要",
        InvalidObjectName: "无效的Object名字",
        InvalidPart: "无效的Part",
        InvalidPartOrder: "无效的part顺序",
        InvalidTargetBucketForLogging: "Logging操作中有无效的目标bucket",
        InternalError: "OSS内部发生错误",
        MalformedXML: "XML格式非法",
        MethodNotAllowed: "不支持的方法",
        MissingArgument: "缺少参数",
        MissingContentLength: "缺少内容长度",
        NoSuchBucket: "Bucket不存在",
        NoSuchKey: "文件不存在",
        NoSuchUpload: "Multipart Upload ID不存在",
        NotImplemented: "无法处理的方法",
        PreconditionFailed: "预处理错误",
        RequestTimeTooSkewed: "发起请求的时间和服务器时间超出15分钟",
        RequestTimeout: "请求超时",
        SignatureDoesNotMatch: "签名错误",
        TooManyBuckets: "Bucket数目超过限制"
    };
    return {
        getError: function(res, status) {
            console.log("getError", arguments);
            var error = {
                status: status,
                code: "",
                msg: ""
            };
            if (!res) {
                angular.extend(error, {
                    msg: "网络请求超时"
                });
            } else {
                var resError = res["Error"];
                angular.extend(error, {
                    code: resError.Code || "",
                    msg: resError.Message || ""
                });
                var message = resError.Message;
                if (erroList[resError.Code]) {
                    message = erroList[resError.Code];
                }
                angular.extend(error, {
                    msg: message
                });
            }
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

angular.module("OSSLogin", [ "ngAnimate", "ngCookies", "ngResource", "ngRoute", "ngSanitize", "ngTouch", "ui.bootstrap", "angularSpinner", "OSSCommon" ]).controller("MainCtrl", [ "$scope", "OSSException", "OSSRegion", "OSSConfig", function($scope, OSSException, OSSRegion, OSSConfig) {
    $scope.isCustomClient = OSSConfig.isCustomClient();
    var loginToLanchpad = function() {
        OSS.invoke("showLaunchpad");
        OSS.invoke("closeWnd");
    };
    $scope.step = location.hash ? location.hash.replace(/^#/, "") : "loginById";
    $scope.deviceCode = OSS.invoke("getDeviceEncoding");
    $scope.regionSelectTip = "选择区域";
    $scope.login = function(accessKeyId, accessKeySecret, isCloudHost, location) {
        if (!accessKeyId || !accessKeyId.length) {
            alert("请输入 Access Key ID");
            return;
        }
        if (!accessKeySecret || !accessKeySecret.length) {
            alert("请输入 Access Key Secret");
            return;
        }
        if (!$scope.isCustomClient && isCloudHost) {
            if (!location) {
                alert("请选择区域");
                return;
            }
            location += "-internal";
        }
        if (OSSConfig.isGuiZhouClient()) {
            if (!location) {
                alert("请选择区域");
                return;
            }
        }
        var param = {
            keyid: accessKeyId,
            keysecret: accessKeySecret
        };
        if (location) {
            angular.extend(param, {
                location: location
            });
        }
        OSS.invoke("loginByKey", param, function(res) {
            if (!res.error) {
                $scope.$apply(function() {
                    $scope.step = "setPassword";
                });
            } else {
                alert(OSSException.getClientErrorMsg(res));
            }
        });
    };
    $scope.setPassword = function(password, rePassword) {
        if (!password || !password.length) {
            alert("请输入安全密码");
            return;
        }
        if (!rePassword || !rePassword.length) {
            alert("请确认安全密码");
            return;
        }
        if (password !== rePassword) {
            alert("两次输入的密码不一致");
            return;
        }
        OSS.invoke("setPassword", {
            password: password
        }, function(res) {
            if (!res.error) {
                loginToLanchpad();
            } else {
                alert(OSSException.getClientErrorMsg(res));
            }
        });
    };
    $scope.skipSetPassword = function() {
        loginToLanchpad();
    };
    $scope.copy = function(deviceCode) {
        OSS.invoke("setClipboardData", deviceCode);
        alert("复制成功");
    };
    $scope.import = function(isCloudHost, location) {
        OSS.invoke("loginByFile", {
            ishost: isCloudHost ? 1 : 0,
            location: location
        }, function(res) {
            $scope.$apply(function() {
                if (!res.error) {
                    $scope.step = "setPassword";
                } else if (res.error != 5) {
                    alert(OSSException.getClientErrorMsg(res));
                }
            });
        });
    };
    $scope.loginByPassword = function(password) {
        if (!password || !password.length) {
            alert("请输入安全密码");
            return;
        }
        OSS.invoke("loginPassword", {
            password: password
        }, function(res) {
            $scope.$apply(function() {
                if (!res.error) {
                    loginToLanchpad();
                } else {
                    alert(OSSException.getClientErrorMsg(res));
                }
            });
        });
    };
    $scope.clearPassword = function() {
        if (!confirm("确定要清除安全密码？")) {
            return;
        }
        OSS.invoke("clearPassword");
        $scope.step = "loginById";
    };
} ]);