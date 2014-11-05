/**
 * 模拟客户端接口，便于网页版调试开发，正式发布不能包含该文件
 */

'use strict';
;(function (window) {

    var accessId = "fmVEoAkpUByBS1cs";
    var accessSecret = "HWsJ79uEwsrh7PB6ASGpyrdZkwJWdR";
//    var accessId = "aNgmvBucXXcJnOgj";
//    var accessSecret = "GBJN7GarVWrITZT9YZR64Ir6bOLEM5";

    function isOSSClient() {
        var sync = navigator.userAgent.split(';')[0] || '';
        return sync.toLowerCase() == 'gk_sync';
    };

    function getCanonicalizedOssHeaders(headers) {
        var tmp_headers = {};
        var canonicalized_oss_headers = '';

        for (var k in headers) {
            if (k.toLowerCase().indexOf('x-oss-', 0) === 0) {
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
                canonicalized_oss_headers += x_header_list[k] + ':' + tmp_headers[x_header_list[k]] + '\n';
            }
        }

        return canonicalized_oss_headers;
    }

    var OSSClient = {
        getAccessID: function () {
            return JSON.stringify(accessId);
        },
        getSignature: function (param) {
            var parseParam = JSON.parse(param);
            var arr = [
                parseParam.verb,
                parseParam.content_md5,
                parseParam.content_type,
                parseParam.expires
            ];
            var canonicalizedOSSheaders = '';
            if (parseParam.canonicalized_oss_headers) {
                canonicalizedOSSheaders = getCanonicalizedOssHeaders(parseParam.canonicalized_oss_headers);
            }
            var canonicalizedResource = parseParam.canonicalized_resource;
            return JSON.stringify(CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(arr.join('\n') + '\n' + canonicalizedOSSheaders + canonicalizedResource, accessSecret)));
        },
        changeHost:function(region){
            region = JSON.parse(region);
            var host = [region,region ? '.' : '' ,'aliyuncs.com'].join('');
            return JSON.stringify(host);
        },
        changeUpload:function(){

        },
        changeDownload:function(){

        },
        getUpload: function () {
            return JSON.stringify({
                "download": 0,
                "upload": 0,
                "count": 1,
                "list": [{
                    "bucket": "121212121212",
                    "object": "PhpStorm-8.0.dmg",
                    "fullpath": "C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",
                    "offset": 100000000,
                    "filesize": 137181104,
                    "status": 5,
                    "speed": 10000,
                    "errormsg": ""
                },
                    {
                        "bucket": "121212121212",
                        "object": "PhpStorm-8.0.dmg",
                        "fullpath": "C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",
                        "offset": 0,
                        "filesize": 137181104,
                        "status": 5,
                        "speed": 0,
                        "errormsg": ""
                    }]
            });
        },
        getDownload: function () {

        }
    };

    if (!isOSSClient()) {
        window.OSSClient = OSSClient;
    }
})(window);