'use strict';
window.debug = true;
var OSS = {
    /**
     * @description 请求客户端接口
     * @param {string} name  接口名称
     * @param {object} param 请求参数
     * @param {fn} callback 回调函数
     */
    invoke: function (name, param, callback, log) {
        if (log !== false) {
            this.log(name, arguments);
        }
        if (typeof OSSClient === 'undefined') {
            throw new Error('Can not find OSSClient');
        }
        if(name === 'getUIPath'){
            return 'file:///Y:/project/oss-client-ui/app/';
        }
        if (typeof OSSClient[name] !== 'function') {
            throw new Error('Can not find interface ' + name);
        }
        var args = [JSON.stringify(param)];
        if (typeof callback === 'function') {
            args.push(function (re) {
                re = !re ? '' : JSON.parse(re);
                if (log !== false) {
                    this.log(name + ':callback', re);
                }
                callback(re);
            })
        }

        var re = OSSClient[name].apply(this, args);
        if (log !== false) {
            this.log(name + ':return', re);
        }
        re = !re ? '' : JSON.parse(re);
        return re;
    },
    /**
     * @description 打印日志
     * @param name 日志名
     * @param info 日志内容
     */
    log: function (name, info) {
        if (window.debug) {
            console.log('%c' + name, 'color:blue', info);
        }
    },
    /**
     * @description 获取客户端useragent
     * @returns {*|Array}
     */
    getUserAgent: function () {
        return navigator.userAgent.split(';');
    },
    /**
     * @description 获取客户端操作系统
     * @returns {string}
     */
    getClientOS: function () {
        var os = this.getUserAgent()[2] || '';
        return os.toLowerCase();
    },
    /**
     * @description 是否OSS window客户端
     * @returns {boolean}
     */
    isWindowsClient: function () {
        return this.getClientOS() == 'windows';
    },
    /**
     * @description 是否OSS mac客户端
     * @returns {boolean}
     */
    isMacClient: function () {
        return this.getClientOS() == 'mac';
    },
    /**
     * @description 是否客户端
     * @returns {boolean}
     */
    isClientOS: function () {
        return this.isWindowsClient() || this.isMacClient();
    },
    /**
     * @description 是否oss客户端
     * @returns {boolean}
     */
    isOSSClient: function () {
        var sync = this.getUserAgent()[0] || '';
        return sync.toLowerCase() == 'gk_sync';
    }
};