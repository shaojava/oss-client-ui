'use strict';

/**
 * @ngdoc overview
 * @name OSSCommon
 * @description
 * # OSSCommon
 *
 * Main module of the application.
 */
angular.module('OSSCommon', [
    'ui.select'
])
    .config(['uiSelectConfig', function (uiSelectConfig) {
        uiSelectConfig.theme = 'bootstrap';
    }])
  .factory('OSSI18N',['OSSConfig',function(OSSConfig){
    var _lanArrs = [{name:'简体中文',lan:'zh_CN',key:1},{name:'繁體中文',lan:'zh_TW',key:3},{name:'English',lan:'en_US',key:2}]
    return {
      setDefaultLan:function(){
      },
      getLanLists:function(){
        return _lanArrs;
      },
      getLanByKey:function(_key){
        return _.find(_lanArrs,function(item){
          return +item.key === +_key
        })
      },
      getCurrLan:function(){
        var _defaultLanKey = OSSConfig.getConfig().defaultLan;
        if (!_defaultLanKey){
          _defaultLanKey = 'zh_CN';
        }
        var _defaultLan = _.find(_lanArrs,function(item){
          return item.lan === _defaultLanKey
        })
        var _lan = {type:_defaultLan.key}
        if (OSSClient.gGetLanguage){
          var _l = OSS.invoke('gGetLanguage')
          var _cl = _.find(_lanArrs,function(item){
            return +item.key === +_l.type
          })
          if(_cl && _cl.lan){
            _lan = _l
          }
        }
        var currLan = _.find(_lanArrs,function(item){
          return +item.key === +_lan.type
        })
        return currLan;
      },
      setCurrLan:function(_lan){
        if (!OSSClient.gChangeLanguage){
          return false;
        }
        OSS.invoke('gChangeLanguage',{type:_lan})
      }
    }

  }])
/**
 * 本地对话框
 */
    .factory('OSSDialog', [function () {
        var defaultParam = {
            type: 'normal',
            resize: 0,
            width: 490,
            height: 420
        };
        return {
          /**
           *
           */
            exportNewsWindow: function (data) {
                var winParams = {
                  type: 'normal',
                  resize: 0,
                  width: 490,
                  height: 300
                };
                var UIPath = OSS.invoke('getUIPath');
                OSS.invoke('showWnd', angular.extend(data||{}, winParams, {
                  url: UIPath + '/window-news.html'
                }));
            },

            /**
             * 导出授权窗口
             */
            exportAuthorization: function () {
                var UIPath = OSS.invoke('getUIPath');
                OSS.invoke('showWnd', angular.extend({}, defaultParam, {
                    url: UIPath + '/export-authorization.html'
                }));
            },
            /**
             * 自定义服务器地址
             */
            customServerHost: function () {
                var UIPath = OSS.invoke('getUIPath');
                OSS.invoke('showWnd', angular.extend({}, defaultParam, {
                    url: UIPath + '/custom-domain.html'
                }));
            },
            setting: function () {
                var UIPath = OSS.invoke('getUIPath');
                OSS.invoke('showWnd', angular.extend({}, defaultParam, {
                    url: UIPath + '/setting.html'
                }));
            }
        };
    }])

/**
 * 消息服务
 * clientType:客户端类型，取值：“aliyun”，“guizhou“，“taiwan”
 * newsLocation:广告类型，取值：”AD0121"->弹出框广告，“AD0122”->标签广告
 * lan:当前语言,取值：“chs“->简体，”cht“->繁体，”eng“->英语
 */
  .factory('OSSNews',['OSSI18N','OSSConfig','$http','$q',function(OSSI18N,OSSConfig,$http,$q){
    var tabNews = null,winNews = null,isTabNewsNew = false,isWinNewsNew = false,times = 0;
    var getCurrentLan = function getCurrentLan(){
      var lans = {"zh_CN":"chs","zh_TW":"cht","en_US":"eng"}
      var _currentLan = OSSI18N.getCurrLan();
      return lans[_currentLan.lan]
    }
    var getNewsSign = function getNewsSign(params){
      var paramsStr = "";
      for(var i=0;i<params.length;i++){
        paramsStr = paramsStr + params[i];
        if(i<params.length - 1){
          paramsStr = paramsStr + "\n";
        }
      }
      var signStr = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(paramsStr, OSSConfig.getConfig().news.key));
      return signStr.replace(/\//g, "-");
    }
    return {
      getNews:function(clientType,newsLocation){
        var params = {
          "res":clientType,
          "loc":newsLocation,
          "lan":getCurrentLan(),
          "sta":OSSConfig.getConfig().news.isPreview?'preview':'standard'
        }
        var _keyArr = ["res","loc","lan","sta"].sort()
        var paramsVal = []
        for(var i=0;i<_keyArr.length;i++){
          paramsVal.push(params[_keyArr[i]]);
        }
        var sign = encodeURIComponent(getNewsSign(paramsVal));
        var url = OSSConfig.getConfig().news.baseUri + OSSConfig.getConfig().news.getUri + "/sta/" + (OSSConfig.getConfig().news.isPreview?'preview':'standard') + "/res/"+clientType+"/loc/"+newsLocation+"/lan/"+getCurrentLan()+"/sign/"+sign
        return $http.get(url,{timeout:5000});
      },
      getTabsNews:function (){
        var clientType = 'aliyun';
        if(OSSConfig.getConfig().news && OSSConfig.getConfig().news.clientType){
          clientType = OSSConfig.getConfig().news.clientType;
        }
        return this.getNews(clientType,'AD0122')
      },
      getWinNews:function (){
        var clientType = 'aliyun';
        if(OSSConfig.getConfig().news && OSSConfig.getConfig().news.clientType){
          clientType = OSSConfig.getConfig().news.clientType;
        }
        return this.getNews(clientType,'AD0121')
      },
      isTabNews:function (loc){
        return loc.toUpperCase() === 'AD0122'
      },
      isWinNews:function (loc){
        return loc.toUpperCase() === 'AD0121'
      },
      getIsTabNewsNew:function () {
        return isTabNewsNew
      },
      setIsTabNewsNew:function () {
        isTabNewsNew = false;
      },
      getIsWinNewsNew:function () {
        return isWinNewsNew
      },
      setIsWinNewsNew:function () {
        isWinNewsNew = false;
      },
      getNewsData:function (_news) {
        if (_news && !_news.err) {
           if (this.isTabNews(_news.loc) && (!tabNews || tabNews.aid != _news.aid)){
             tabNews = _news;
             isTabNewsNew = true;
             return tabNews;
           }else if(this.isTabNews(_news.loc) && tabNews && tabNews.aid == _news.aid){
             return tabNews;
           } else if (this.isWinNews(_news.loc) && (!winNews || winNews.aid != _news.aid)){
             winNews = _news;
             isWinNewsNew = true;
             return winNews;
           }else if (this.isWinNews(_news.loc) && winNews && winNews.aid == _news.aid){
             return winNews;
           }
        }
        return {loc:_news.loc,err:1};
      },
      getWinNewsData:function () {
        var _this = this
        var winDefer = $q.defer();
        _this.getWinNews().then(function success(res){
          var _image = "",_color = "",_title = "",_desc = "";
          if(res.data.image){
            _image = decodeURIComponent(res.data.image);
          }
          _color = res.data.bgcolor || "";
          if(res.data.title){
            _title = decodeURIComponent(res.data.title);
          }
          if(res.data.description){
            _desc = decodeURIComponent(res.data.description);
          }
          res.data = angular.extend(res.data,{loc:'AD0121',image:_image,title:_title,description:_desc,imgs:_image.split(","),bgColors:_color.split(","),titles:_title.split(","),descs:_desc.split(",")})
          winDefer.resolve(_this.getNewsData(res.data));
        },function error(msg){
          winDefer.resolve(_this.getNewsData({err:1,loc:'AD0121'}));
        });
        return winDefer.promise;
      },
      getAllNews:function () {
        times += 1;
        var _this = this
        var promises = [];
        var tabDefer = $q.defer()
        _this.getTabsNews().then(function success(res){
          var _image = "",_color = "",_titleColor = "",_title = "",_desc = "";
          if(res.data.image){
             _image = decodeURIComponent(res.data.image);
          }
          _color = res.data.bgcolor || "";
          _titleColor = res.data.titlecolor || "";
          if(res.data.title){
            _title = decodeURIComponent(res.data.title);
          }
          if(res.data.description){
            _desc = decodeURIComponent(res.data.description);
          }
          res.data = angular.extend(res.data,{loc:'AD0122',image:_image,title:_title,description:_desc,imgs:_image.split(","),bgColors:_color.split(","),titleColors:_titleColor.split(","),titles:_title.split(","),descs:_desc.split(",")})
          tabDefer.resolve(_this.getNewsData(res.data));
        },function error(msg){
          tabDefer.resolve(_this.getNewsData({err:1,loc:'AD0122'}));
        });
        var winDefer = $q.defer()
        _this.getWinNews().then(function success(res){
          var _image = "",_color = "",_titleColor = "", _title = "",_desc = "";
          if(res.data.image){
            _image = decodeURIComponent(res.data.image);
          }
          _color = res.data.bgcolor || "";
          _titleColor = res.data.titlecolor || "";
          if(res.data.title){
            _title = decodeURIComponent(res.data.title);
          }
          if(res.data.description){
            _desc = decodeURIComponent(res.data.description);
          }
          res.data = angular.extend(res.data,{loc:'AD0121',image:_image,title:_title,description:_desc,imgs:_image.split(","),bgColors:_color.split(","),titleColors:_titleColor.split(","),titles:_title.split(","),descs:_desc.split(",")})
          winDefer.resolve(_this.getNewsData(res.data));
        },function error(msg){
          winDefer.resolve(_this.getNewsData({err:1,loc:'AD0121'}));
        });
        promises.push(tabDefer.promise);
        promises.push(winDefer.promise);
        return $q.all(promises);
      },
      clickNews:function(aid,ord){
        var params = {
          "aid":aid,
          "ord":ord
        }
        var _keyArr = ["aid","ord"].sort()
        var paramsVal = []
        for(var i=0;i<_keyArr.length;i++){
          paramsVal.push(params[_keyArr[i]]);
        }
        var sign = encodeURIComponent(getNewsSign(paramsVal));
        var url = OSSConfig.getConfig().news.baseUri + OSSConfig.getConfig().news.clickUri + "/aid/"+aid+"/ord/"+ord+"/sign/"+sign
        return url;
      }
    }
  }])
  .factory('OSSVersionLogs',['OSSI18N','$http','$q',function(OSSI18N,$http,$q){
    var versionLogs = null
    return {
      getVersionLogs:function(){
        var defer = $q.defer()
        $http.get("version-change-log.txt").then(function (res) {
          versionLogs = {
            version:res.data.version,
            updateTime:res.data.updateTime,
            currentLogs:res.data.logs.current[OSSI18N.getCurrLan().lan],
            nextLogs:res.data.logs.next[OSSI18N.getCurrLan().lan]
          }
          defer.resolve(versionLogs)
        },function (res) {
          defer.resolve({err:1})
        })
        return defer.promise;
      }
    }
  }])


/**
 *   客户端配置的相关信息（定制时用）
 */
    .factory('OSSConfig', ['gettext',function (gettext) {
        var config = OSS.invoke('configInfo');
        if (!config) {
            config = {
                source: "",
                disable_location_select: 0,
                hideLogo:false,
                showchannel:false,
                showrefer:false,
                defaultLan:"zh_CN",
                host: "aliyuncs.com",
                news:{
                  isPreview:false,
                  clientType:'aliyun',
                  key:'staycloud',
                  baseUri:'http://ossupdate.jiagouyun.com',
                  getUri:'/Interface/getNewAd',
                  clickUri:'/Interface/onAdClick'
                },
                locations: [
                    {
                      "location": "oss-cn-guizhou-a",
                      "name": gettext("互联网"),
                      "enable": 0,
                      "network":"internet"
                    },
                    {
                      "location": "oss-cn-guizhou-a-internal",
                      "name": gettext("政务外网"),
                      "enable": 0,
                      "network":"internet"
                    },
                    {
                      "location": "oss-cn-gzzwy-a-internal",
                      "name": gettext("政务外网"),
                      "enable": 0,
                      "network":"intranet"
                    },
                    {
                      "location": "oss-cn-hangzhou",
                      "name": gettext('杭州'),
                      "enable": 1
                    },
                    {
                        location: 'oss-cn-qingdao',
                        name: gettext('青岛'),
                        enable: 1
                    },
                    {
                        location: 'oss-cn-beijing',
                        name: gettext('北京'),
                        enable: 1
                    },
                    {
                        location: 'oss-cn-hongkong',
                        name: gettext('香港'),
                        enable: 1
                    },
                    {
                        location: 'oss-cn-shenzhen',
                        name: gettext('深圳'),
                        enable: 1
                    },
                    {
                        location: 'oss-cn-shanghai',
                        name: gettext('上海'),
                        enable: 1
                    },
                    {
                      location:'oss-ap-southeast-1',
                      name:gettext('新加坡'),
                      enable:1
                    },
                    {
                      location: 'oss-us-west-1',
                      name: gettext('美国'),
                      enable: 1
                    },
                    {
                      location: 'oss-tw-kaohsiung',
                      name: gettext('台湾高雄'),
                      enable: 0
                    },
                    {
                      location:"oss-cn-qdjbp-a",
                      name: "青岛-金融云",
                      enable: 1
                    },
                    {
                      location:"oss-cn-shenzhen-finance-1",
                      name: "深圳-金融云",
                      enable: 1
                    },
                    {
                      location:"oss-cn-hzjbp-b",
                      name: "杭州-金融云",
                      enable: 1
                    }
                ]
            };
        }
        return {
            isHideLogo:function (){
              return config.hideLogo
            },
            /**
             * 是否是定制客户端
             * @returns {boolean}
             */
            isCustomClient: function () {
                return config.source && config.source != '' && config.source != 'taiwan' && config.source != 'jinrongyun';
            },
            /**
             * 是否是贵州的定制客户端
             * @returns {boolean}
             */
            isGuiZhouClient: function () {
                return config.source == 'guizhou';
            },
            getConfig: function() {
              return config;
            },
            /**
             * 是否显示白名单设置
             * @returns {boolean}
             */
            showRefer: function () {
                return !!config.showrefer;
            },
            /**
             * 是否显示图片服务器设置
             * @returns {boolean}
             */
            showChannel: function () {
                return !!config.showchannel;
            },
            /**
             * 创建bucket是否不允许选择区域
             */
            isDisableLocationSelect: function () {
                return config.disable_location_select == 1;
            },
            getLocations: function () {
                return config.locations || [];
            },
            /**
             * 获取主机
             * @returns {*}
             */
            getHost: function () {
                return config.host;
            }
        };
    }])

/**
 * bucket区域
 */
    .factory('OSSRegion', ['OSSConfig','localStorageService', function (OSSConfig,localStorageService) {
        var locations = OSSConfig.getLocations();
        var currentLocation = OSS.invoke('getCurrentLocation');
        return {
            getRegionPerfix: function () {
                return "CLIENT_LOGIN_REGION"
            },
            list: function (_netType) {
                var params = {
                  enable: 1
                };
                if(_netType){
                  params.network = _netType
                }
                return _.where(locations, params);
            },
            /**
             * 判断当前location是否是当前登录区域允许的bucket
             */
            getEnableRegionByLocation: function (location) {
                var enableLocations = this.list();
                return _.find(enableLocations, function (item) {
                    return location.indexOf(item.location) === 0||
                           location.indexOf(item.location.replace('-a-internal', '')) === 0 ||
                           location.indexOf(item.location.replace('-a', '')) === 0 ||
                           location.indexOf(item.location.replace('-internal', '')) === 0 ||
                           location.indexOf(item.location.replace('-b-internal', '')) === 0 ||
                           location.indexOf(item.location.replace('-b', '')) === 0 ||
                           location.indexOf(item.location.replace('-finance', '')) === 0 ||
                            location.indexOf(item.location.replace('-finance-1', ''))
                });
            },
            getRegionByLocation: function (location) {
                var _region = _.find(locations, function (item) {
                    return location.indexOf(item.location.replace('-internal', '')) === 0;
                });

                if (currentLocation && !_region) {
                  _region = _.find(locations, function (item) {
                    return currentLocation.indexOf(item.location) === 0;
                  });
                }
                return _region
            },
            changeLocation: function (location) {
                //是否是政务外网环境下
                var isIntranetNet = localStorageService.get(this.getRegionPerfix())
                var isIntranet = this.isIntranet(currentLocation);
                if(isIntranetNet) {
                  var intranetLocations = [];
                  //登录的是政务外网下的域名
                  if(isIntranet && isIntranetNet === '1'){
                    intranetLocations = this.getIntranetLocationItem();
                  }
                  //登录的不是政务外网下的域名
                  else{
                    intranetLocations = [this.getInternetLocationItem()].concat([this.getIntranetInner(true)])
                  }
                  var _location = location;
                  angular.forEach(intranetLocations, function (item) {
                      if (item.location === location || item.location === location + '-internal' || item.location === location + '-a-internal') {
                          _location = item.location;
                      }
                  })
                  return _location;
                }
                if (location.indexOf('-internal') > 0) {
                    return location;
                }
                if (currentLocation && location + '-a' == currentLocation) {
                    return location + '-a';
                }
                if (currentLocation && location + '-internal' == currentLocation) {
                    return location + '-internal';
                }
                if (currentLocation && location + '-a-internal' == currentLocation) {
                    return location + '-a-internal';
                }
                if (currentLocation && location + '-b' == currentLocation) {
                  return location + '-b';
                }
                if (currentLocation && location + '-b-internal' == currentLocation) {
                  return location + '-b-internal';
                }
                if (currentLocation && location + '-finance' == currentLocation) {
                  return location + '-finance';
                }
                if (currentLocation && location + '-finance-1' == currentLocation) {
                  return location + '-finance-1';
                }
                return location;
            },
            //判断是内网
            isIntranet: function (location,network) {
                if (location){
                    var region = _.find(locations, function (item) {
                        return  item.enable === 1 && item.location === location;
                    });
                    if (region && region.network === 'intranet') {
                        return true;
                    }
                }else if(network && network === 'intranet'){
                    return true;
                }
                return false;
            },
            getIntranetLocationItem: function () {
                return _.filter(locations, function (item) {
                    return  item.enable === 1 && item.network === "intranet";
                });
            },
            getInternetLocationItem: function () {
                return _.find(locations, function (item) {
                    return  item.enable === 1 && item.network === "internet";
                });
            },
            getIntranetLocation: function (location) {
                return location.replace('-internal', '');
            },
            getIntranetInner: function (loadInner) {
                if (!!loadInner) {
                    return this.getIntranetLocationItem()[1]
                }else{
                    return this.getIntranetLocationItem()[0]
                }
            }
        };
    }])

/**
 * 抛错处理
 */
    .factory('OSSException', ['OSSConfig','gettext','gettextCatalog', function (OSSConfig,gettext,gettextCatalog) {
        var erroList = {
            getClientMessage:function(resError){
                if(resError.Code == 'AccessDenied' && resError.Message == 'Request has expired.'){
                    var serverTime = new Date(resError.ServerTime).getTime();
                    var clientTime = new Date(resError.Expires).getTime();
                    var expiresTime = parseInt(Math.abs(clientTime - serverTime) / 1000);
                    var d = parseInt(parseInt(expiresTime)/3600/24);
                    var h = parseInt((parseInt(expiresTime)/3600) % 24);
                    var m = parseInt((parseInt(expiresTime)/60) % 60);
                    var s = parseInt(parseInt(expiresTime) % 60)
                    var str_fast_day = gettextCatalog.getString(gettext('数据加载失败，当前您电脑的时间比服务器时间快{{d}}天{{h}}小时{{m}}分钟{{s}}秒,请调整您的电脑时间后重试。'),{d:d,h:h,m:m,s:s});
                    var str_flow_day = gettextCatalog.getString(gettext('数据加载失败，当前您电脑的时间比服务器时间慢{{d}}天{{h}}小时{{m}}分钟{{s}}秒,请调整您的电脑时间后重试。'),{d:d,h:h,m:m,s:s});
                    if(clientTime - serverTime > 0){
                      return str_fast_day
                    }else if(clientTime - serverTime < 0){
                      return str_flow_day
                    }else{
                      return;
                    }
                    return;
                }else if (erroList[resError.Code]) {
                    return erroList[resError.Code];
                }else{
                    return resError.Message;
                }
            },
            'AccessDenied': gettextCatalog.getString(gettext('拒绝访问')),
            'BucketAlreadyExists': gettextCatalog.getString(gettext('Bucket已经存在')),
            'BucketNotEmpty': gettextCatalog.getString(gettext('Bucket不为空')),
            'EntityTooLarge': gettextCatalog.getString(gettext('实体过大')),
            'EntityTooSmall': gettextCatalog.getString(gettext('实体过小')),
            'FileGroupTooLarge': gettextCatalog.getString(gettext('文件组过大')),
            'FilePartNotExist': gettextCatalog.getString(gettext('文件Part不存在')),
            'FilePartStale': gettextCatalog.getString(gettext('文件Part过时')),
            'InvalidArgument': gettextCatalog.getString(gettext('参数格式错误')),
            'InvalidAccessKeyId': gettextCatalog.getString(gettext('Access Key ID不存在')),
            'InvalidBucketName': gettextCatalog.getString(gettext('无效的Bucket名字')),
            'InvalidDigest': gettextCatalog.getString(gettext('无效的摘要')),
            'InvalidObjectName': gettextCatalog.getString(gettext('无效的Object名字')),
            'InvalidPart': gettextCatalog.getString(gettext('无效的Part')),
            'InvalidPartOrder': gettextCatalog.getString(gettext('无效的part顺序')),
            'InvalidTargetBucketForLogging': gettextCatalog.getString(gettext('Logging操作中有无效的目标bucket')),
            'InternalError': gettextCatalog.getString(gettext('OSS内部发生错误')),
            'MalformedXML': gettextCatalog.getString(gettext('XML格式非法')),
            'MethodNotAllowed': gettextCatalog.getString(gettext('不支持的方法')),
            'MissingArgument': gettextCatalog.getString(gettext('缺少参数')),
            'MissingContentLength': gettextCatalog.getString(gettext('缺少内容长度')),
            'NoSuchBucket': gettextCatalog.getString(gettext('Bucket不存在')),
            'NoSuchKey': gettextCatalog.getString(gettext('文件不存在')),
            'NoSuchUpload': gettextCatalog.getString(gettext('Multipart Upload ID不存在')),
            'NotImplemented': gettextCatalog.getString(gettext('无法处理的方法')),
            'PreconditionFailed': gettextCatalog.getString(gettext('预处理错误')),
            'RequestTimeTooSkewed': gettextCatalog.getString(gettext('发起请求的时间和服务器时间超出15分钟')),
            'RequestTimeout': gettextCatalog.getString(gettext('请求超时')),
            'SignatureDoesNotMatch': gettextCatalog.getString(gettext('签名错误')),
            'TooManyBuckets': gettextCatalog.getString(gettext('Bucket数目超过限制'))
        };
        return {
            getError: function (res, status) {
                var error = {
                    status: status,
                    code: '',
                    msg: ''
                };
                if (!res) {
                    var msg = '';
                    if (status == 403) {
                        msg = erroList['AccessDenied'];
                    } else {
                        msg = gettextCatalog.getString(gettext('网络请求错误'));
                        if (OSSConfig.isCustomClient()) {
                            msg += '<p class="text-muted">'+gettextCatalog.getString(gettext('（可能是你登录时选择的区域与当前的网络环境不匹配，请退出客户端后重新选择）'))+'</p>';
                        }
                    }
                    angular.extend(error, {
                        msg: msg
                    });
                } else {
                    var resError = res['Error'];
                    angular.extend(error, {
                        code: resError.Code || '',
                        msg: resError.Message || ''
                    });
                    var message = erroList.getClientMessage(resError);
                    angular.extend(error, {
                        msg: message
                    });
                }
                return error;
            },
            getClientErrorMsg: function (res) {
                return res.message;
            }
        };
    }])

/**
 * 剪切板
 */
    .factory('Clipboard', function () {
        var maxLen = 1,
            container = [];
        return {
            clear: function () {
                container = [];
            },
            len: function () {
                return container.length;
            },
            get: function () {
                var item = container.shift();
                OSS.log('Clipboard.get', item);
                return item;
            },
            add: function (data) {
                container.push(data);
                if (container.length > maxLen) {
                    container.shift();
                }
                OSS.log('Clipboard.add', data);
            }
        };
    })

/**
 * 显示传入路径的文件名
 */
    .filter('baseName', function () {
        return Util.String.baseName;
    })

/**
 * 判断传入的路径是否文件夹
 */
    .filter('isDir', function () {
        return function (path) {
            var lastStr = Util.String.lastChar(path);
            return lastStr === '/' || lastStr === '\\' ? 1 : 0;
        };
    })
    .filter('getLocationName', ['OSSRegion', function (OSSRegion) {
        return function (location) {
            if (!location) {
                return '';
            }
            ;
            var region = OSSRegion.getRegionByLocation(location);
            if (!region) {
                return '';
            }
            return region.name;
        };
    }])
    .directive('ngRightClick', ['$parse', function ($parse) {
        return function ($scope, $element, $attrs) {
            var fn = $parse($attrs.ngRightClick);
            $element.bind('contextmenu', function (event) {
                $scope.$apply(function () {
                    event.preventDefault();
                    fn($scope, {$event: event});
                });
            });
        };
    }])
/**
 * 滚到加载
 */
    .directive('scrollLoad', ['$rootScope', '$parse', function ($rootScope, $parse) {
        return {
            restrict: 'A',
            link: function ($scope, $element, attrs) {
                var triggerDistance = 0;
                var disableScroll = false;
                if (attrs.triggerDistance != null) {
                    $scope.$watch(attrs.triggerDistance, function (value) {
                        return triggerDistance = parseInt(value || 0, 10);
                    });
                }

                if (attrs.disableScroll != null) {
                    $scope.$watch(attrs.disableScroll, function (value) {
                        return disableScroll = !!value;
                    });
                }
                var direction = 'down';
                if (attrs.triggerDirection) {
                    direction = attrs.triggerDirection;
                }
                var startScrollTop = 0;
                var fn = $parse(attrs['scrollLoad']);
                $element.on('scroll.scrollLoad', function (event) {
                    var _self = jQuery(this),
                        realDistance = 0,
                        scrollH = 0,
                        scrollT = 0,
                        isScrollDown = false;

                    scrollH = jQuery.isWindow(this) ? document.body.scrollHeight : $element[0].scrollHeight;
                    scrollT = _self.scrollTop();
                    isScrollDown = scrollT > startScrollTop;
                    var clientHeight = jQuery.isWindow(this) ? document.documentElement.clientHeight || document.body.clientHeight : this.clientHeight;
                    realDistance = direction == 'down' ? (scrollH - scrollT - clientHeight) : scrollT;
                    if (realDistance <= triggerDistance && !disableScroll) {
                        if ((!isScrollDown && direction == 'up') || (isScrollDown && direction == 'down')) {
                            $scope.$apply(function () {
                                fn($scope, {$event: event});
                            })

                        }
                    }
                    startScrollTop = scrollT;
                });

                $scope.$on('$destroy', function () {
                    $element.off('scroll.scrollLoad');
                })
            }
        }
    }])

/**
 * 滚到指定的item
 */
    .directive('scrollToItem', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                attrs.$observe('scrollToItem', function (newVal) {
                    if(typeof newVal === 'undefiend') return;
                    $timeout(function () {
                        var index = newVal;
                        if (index < 0) return;
                        var $fileItem = element.find(attrs.itemSelector + ':eq(' + index + ')');
                        if (!$fileItem.size()) return;
                        var top = $fileItem.position().top;
                        var grep = top + $fileItem.height() - element.height();
                        if (top < 0) {
                            element.scrollTop(element.scrollTop() + top);
                        } else if (grep > 0) {
                            element.scrollTop(element.scrollTop() + grep);
                        }
                    })
                })

            }
        }
    }])

/**
 * 拖拽
 */
    .directive('onDrop', ['$parse', function ($parse) {
        return function (scope, element, attrs) {
            var fn = $parse(attrs.onDrop);
            element.on('drop', function (event) {
                scope.$apply(function () {
                    fn(scope, {$event: event});
                });
            });
        };
    }])

/**
 * 阻止默认的拖拽时间
 */
    .directive('preventDragDrop', [function () {
        return {
            restrict: 'A',
            link: function ($scope, $element) {
                $element.on('dragstart', function (event) {
                    var jTarget = jQuery(event.target);
                    if (!jTarget.attr('draggable') && !jTarget.parents('[draggable]').size()) {
                        event.preventDefault();
                    }
                })
                $element.on('dragover', function (event) {
                    event.preventDefault();
                });
                $element.on('dragenter', function (event) {
                    event.preventDefault();
                });
                $element.on('drop', function (event) {
                    event.preventDefault();
                });
            }
        }
    }])

/**
 *  input默认选中
 */
    .directive('autoSelect', [function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var isAutoSelect = false;
                attrs.$observe('autoSelect', function (isAuto) {
                    isAutoSelect = isAuto;
                });

                element.on('click.autoSelect', function () {
                    if (isAutoSelect) {
                        element.select();
                    }
                });

            }
        }
    }])

/**
 * bucket区域选择下拉框
 */
    .directive('locationSelect', ['$rootScope','OSSRegion','OSSConfig','$http','localStorageService', function ($rootScope,OSSRegion,OSSConfig,$http,localStorageService) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                selectLocation: '=',
                loginNetworktype: '=',
                disableSelect: '=',
                name: '@',
                placeHolder: '@',
                searchDisabled: '=',
                defaultLocation:'@'
            },
            templateUrl: 'views/location-select.html',
            link: function (scope) {
                if (!OSSConfig.isCustomClient()) {
                    localStorageService.remove(OSSRegion.getRegionPerfix());
                    scope.locations = OSSRegion.list();
                    if (!scope.placeHolder) {
                        scope.locations.selected = scope.locations[0];
                    }
                    scope.$watch('defaultLocation',function(newVal){
                        if(!newVal){
                            return;
                        }
                        scope.locations.selected = _.find(scope.locations,function(region){
                            return region.location.indexOf(newVal) == 0;
                        });
                    });
                }else{
                    scope.$watch('loginNetworktype',function(newVal){
                        if(!newVal){
                            return;
                        }
                        if (OSSRegion.isIntranet(null,newVal)) {
                            var region = OSSRegion.getIntranetInner(false);
                            var host = OSSConfig.getHost();
                            var requestUrl = 'http://'+region.location + '.' + host;
                            if(region.customhost && region.customhost.length){
                                requestUrl = 'http://'+region.customhost;
                            }
                            $http.get(requestUrl,{
                                timeout:3000
                            }).error(function(req,status){
                                //走不通
                                if(!req && !status){
                                    localStorageService.set(OSSRegion.getRegionPerfix(),'2');
                                    scope.locations = [OSSRegion.getInternetLocationItem()].concat([OSSRegion.getIntranetInner(true)])
                                }
                                //走的通
                                else{
                                    localStorageService.set(OSSRegion.getRegionPerfix(),'1');
                                    scope.locations = OSSRegion.getIntranetLocationItem()
                                }
                                //当前可以显示的bucket
                                $rootScope.$broadcast('unDisabledLocationSelect')
                                scope.locations.selected = _.find(scope.locations,function(region){
                                    return region.location.indexOf(scope.defaultLocation) == 0;
                                });
                            });
                        }else {
                            localStorageService.remove(OSSRegion.getRegionPerfix())
                            scope.locations = OSSRegion.list(newVal);
                            $rootScope.$broadcast('unDisabledLocationSelect')
                            scope.locations.selected = _.find(scope.locations,function(region){
                                return region.location.indexOf(scope.defaultLocation) == 0;
                            });
                        }
                    })
                }
                scope.$watch('locations.selected', function (val) {
                    scope.selectLocation = val;
                });
            }
        }
    }])
;

/**
 * 客户端的回调
 * @param name
 * @param params
 */
var ossClientCallback = function (name, param) {
  console.log('客户端的回调[ossClientCallback]', arguments);
  if (typeof name !== 'string') {
    name = String(name);
  }
  var rootScope = jQuery(document).scope();
  var JSONparam;
  if (param) {
    JSONparam = JSON.parse(param);
  }
  rootScope && rootScope.$broadcast(name, JSONparam);
};
//通知当前下载列表加载的数量
ossClientCallback.getUpdateLoadingCount = function(){
  return 'UpdateLoadingCount';
}