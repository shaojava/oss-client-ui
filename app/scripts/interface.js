/**
 * 调用客户端的本地接口
 */

'use strict';
window.debug = true;
var debugInterfaces = ['getConfig','getCurrentLocation'];
var OSS = {
    /**
     * @description 请求客户端接getCurrentLocation口
     * @param {string} name  接口名称
     * @param {object} param 请求参数
     * @param {fn} callback 回调函数
     */
    invoke: function (name, param, callback, log) {
        var _self = this;
        if (typeof OSSClient === 'undefined') {
            throw new Error('Can not find OSSClient');
        }
        if (typeof OSSClient[name] !== 'function' && debugInterfaces.indexOf(name) < 0) {
            throw new Error('Can not find interface ' + name);
        }
        var args = [];
        if(param){
            args.push(JSON.stringify(param));
        }
        if (typeof callback === 'function') {
            args.push(function (re) {
                if (log !== false) {
                    _self.log(name + ':callback', re);
                }

                //mac上回调的参数不是JSONString，而是Object
                re = !re ? '' : typeof re === 'object' ? re : JSON.parse(re);
                callback(re);
            })
        }

        /***
         * mac版不能使用apply方法
         * @type {string}
         */
        //var re = OSSClient[name].apply(this, args);
        var re = '';
        if (log !== false) {
            this.log(name, args);
        }
        if(!args.length){
            /**
             * 调试用
             */
            if(debugInterfaces.indexOf(name) >= 0){
                re = this[name]();
            }else{
                re = OSSClient[name]();
            }

        }else if(args.length == 1){
            re = OSSClient[name](args[0]);
        }else if(args.length == 2){
            re = OSSClient[name](args[0],args[1]);
        }
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
    },

    getConfig:function(){


        return JSON.stringify({
            source:'guizhou',
            disable_location_select:1,
            locations:[
                {
                    location:'oss-cn-guizhou-a',
                    name:'贵州',
                    enable:1
                },
                {
                    location:'oss-cn-gzzwy-a',
                    name:'政务网',
                    enable:1
                },
                {
                    location:'oss-cn-hangzhou-a',
                    name:'杭州',
                    enable:0
                },
                {
                    location:'oss-cn-qingdao-a',
                    name:'青岛',
                    enable:0
                },
                {
                    location:'oss-cn-beijing-a',
                    name:'北京',
                    enable:0
                },
                {
                    location:'oss-cn-hongkong-a',
                    name:'香港',
                    enable:0
                },
                {
                    location:'oss-cn-shenzhen-a',
                    name:'深圳',
                    enable:0
                }
            ]
        });


        return JSON.stringify({
            source:'',
            disable_location_select:0,
            locations:[
                {
                    location:'oss-cn-guizhou-a',
                    name:'贵州',
                    enable:0
                },
                {
                    location:'oss-cn-gzzwy-a',
                    name:'政务网',
                    enable:0
                },
                {
                    location:'oss-cn-hangzhou-a',
                    name:'杭州',
                    enable:1
                },
                {
                    location:'oss-cn-qingdao-a',
                    name:'青岛',
                    enable:1
                },
                {
                    location:'oss-cn-beijing-a',
                    name:'北京',
                    enable:1
                },
                {
                    location:'oss-cn-hongkong-a',
                    name:'香港',
                    enable:1
                },
                {
                    location:'oss-cn-shenzhen-a',
                    name:'深圳',
                    enable:1
                }
            ]
        });



    },
    getCurrentLocation:function(){
        //return 'oss-cn-gzzwy-a';
        return JSON.stringify('oss-cn-guizhou-a');
    }
};