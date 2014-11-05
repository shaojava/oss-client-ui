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
        getDownload: function() {}
    };
    if (!isOSSClient()) {
        window.OSSClient = OSSClient;
    }
})(window);

"use strict";

window.debug = true;

var OSS = {
    invoke: function(name, param, callback, log) {
        var _self = this;
        if (typeof OSSClient === "undefined") {
            throw new Error("Can not find OSSClient");
        }
        if (typeof OSSClient[name] !== "function") {
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
            re = OSSClient[name]();
        } else if (args.length == 1) {
            re = OSSClient[name](args[0]);
        } else if (args.length == 2) {
            if (name == "loginByKey") {
                re = OSSClient.loginByKey(args[0], args[1]);
            } else {
                re = OSSClient[name](args[0], args[1]);
            }
        }
        if (log !== false) {
            this.log(name + ":return", re);
        }
        re = !re ? "" : typeof re === "object" ? re : JSON.parse(re);
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
        }
    };
} ]).factory("OSSRegion", [ function() {
    return {
        list: function() {
            return {
                "oss-cn-hangzhou-a": "杭州",
                "oss-cn-qingdao-a": "青岛",
                "oss-cn-beijing-a": "北京",
                "oss-cn-hongkong-a": "香港",
                "oss-cn-shenzhen-a": "深圳",
                "oss-cn-guizhou-a": "贵州"
            };
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
} ]);

"use strict";

angular.module("CustomDomain", [ "ngAnimate", "ngCookies", "ngResource", "ngRoute", "ngSanitize", "ngTouch", "ui.bootstrap", "angularSpinner", "OSSCommon" ]).controller("MainCtrl", [ "$scope", "OSSException", function($scope, OSSException) {
    $scope.customDomain = function(host) {
        if (!host || !host.length) {
            alert("请输入服务器地址");
            return;
        }
        OSS.invoke("setServerLocation", {
            location: host
        }, function(res) {
            if (!res.error) {
                alert("设置成功");
            } else {
                alert(OSSException.getClientErrorMsg(res));
            }
        });
    };
    $scope.cancel = function() {
        OSS.invoke("closeWnd");
    };
} ]);