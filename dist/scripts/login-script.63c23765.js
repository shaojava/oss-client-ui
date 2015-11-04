"use strict";!function(window){function isOSSClient(){var sync=navigator.userAgent.split(";")[0]||"";return"oss"==sync.toLowerCase()}function getCanonicalizedOssHeaders(headers){var tmp_headers={},canonicalized_oss_headers="";for(var k in headers)0===k.toLowerCase().indexOf("x-oss-",0)&&(tmp_headers[k.toLowerCase()]=headers[k]);if(tmp_headers!={}){var x_header_list=[];for(var k in tmp_headers)x_header_list.push(k);x_header_list.sort();for(var k in x_header_list)canonicalized_oss_headers+=x_header_list[k]+":"+tmp_headers[x_header_list[k]]+"\n"}return canonicalized_oss_headers}var accessId="",accessSecret="",OSSClient={getAccessID:function(){return JSON.stringify(accessId)},getSignature:function(param){var parseParam=JSON.parse(param),arr=[parseParam.verb,parseParam.content_md5,parseParam.content_type,parseParam.expires],canonicalizedOSSheaders="";parseParam.canonicalized_oss_headers&&(canonicalizedOSSheaders=getCanonicalizedOssHeaders(parseParam.canonicalized_oss_headers));var canonicalizedResource=parseParam.canonicalized_resource;return JSON.stringify(CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(arr.join("\n")+"\n"+canonicalizedOSSheaders+canonicalizedResource,accessSecret)))},changeHost:function(region){region=JSON.parse(region);var host=[region,region?".":"","aliyuncs.com"].join("");return JSON.stringify(host)},changeUpload:function(){},changeDownload:function(){},getUpload:function(){return JSON.stringify({download:0,upload:0,count:1,list:[{bucket:"121212121212",object:"PhpStorm-8.0.dmg",fullpath:"C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",offset:1e8,filesize:137181104,status:5,speed:1e4,errormsg:""},{bucket:"121212121212",object:"PhpStorm-8.0.dmg",fullpath:"C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",offset:0,filesize:137181104,status:5,speed:0,errormsg:""}]})},getDownload:function(){},configInfo:function(){JSON.stringify({source:"",disable_location_select:0,host:"aliyuncs.com",showrefer:!1,showchannel:!1,custom_server_host:"",locations:[{location:"oss-cn-guizhou-a",name:"互联网",enable:0,network:"internet"},{location:"oss-cn-guizhou-a-internal",name:"政务外网",enable:0,network:"internet"},{location:"oss-cn-gzzwy-a-internal",name:"政务外网",enable:0,network:"intranet"},{location:"oss-cn-hangzhou-a",name:"杭州",enable:1},{location:"oss-cn-qingdao-a",name:"青岛",enable:1},{location:"oss-cn-beijing-a",name:"北京",enable:1},{location:"oss-cn-hongkong-a",name:"香港",enable:1},{location:"oss-cn-shenzhen-a",name:"深圳",enable:1},{location:"oss-cn-shanghai",name:"上海",enable:1},{location:"oss-ap-southeast-1",name:"新加坡",enable:1},{location:"oss-us-west-1",name:"美国",enable:1}]});return JSON.stringify({source:"guizhou",disable_location_select:1,host:"aliyuncs.com",showrefer:!0,showchannel:!0,custom_server_host:"http://yunsanyun.api.com",locations:[{location:"oss-cn-guizhou",name:"互联网",enable:1,network:"internet"},{location:"oss-cn-guizhou-internal",name:"政务外网",enable:1,network:"internet"},{location:"oss-cn-gzzwy-a-internal",name:"政务外网",enable:1,network:"intranet"},{location:"oss-cn-hangzhou-a",name:"杭州",enable:0},{location:"oss-cn-qingdao-a",name:"青岛",enable:0},{location:"oss-cn-beijing-a",name:"北京",enable:0},{location:"oss-cn-hongkong-a",name:"香港",enable:0},{location:"oss-cn-shenzhen-a",name:"深圳",enable:0},{location:"oss-cn-shanghai",name:"上海",enable:0},{location:"oss-ap-southeast-1",name:"新加坡",enable:1},{location:"oss-us-west-1",name:"美国",enable:0}]})},getCurrentLocation:function(){return JSON.stringify("oss-cn-guizhou-a")}};isOSSClient()||(window.OSSClient=OSSClient)}(window),window.debug=!1;var debugInterfaces=[],OSS={invoke:function(name,param,callback,log){var _self=this;if("undefined"==typeof OSSClient)throw new Error("Can not find OSSClient");if("function"!=typeof OSSClient[name]&&debugInterfaces.indexOf(name)<0)throw new Error("Can not find interface "+name);var args=[];param&&args.push(JSON.stringify(param)),"function"==typeof callback&&args.push(function(re){log!==!1&&_self.log(name+":callback",re),re=re?"object"==typeof re?re:JSON.parse(re):"",callback(re)});var re="";return log!==!1&&this.log(name,args),args.length?1==args.length?re=OSSClient[name](args[0]):2==args.length&&(re=OSSClient[name](args[0],args[1])):re=debugInterfaces.indexOf(name)>=0?this[name]():OSSClient[name](),log!==!1&&this.log(name+":return",re),re=re?JSON.parse(re):""},log:function(name,info){window.debug&&console.log("%c"+name,"color:blue",info)},getUserAgent:function(){return navigator.userAgent.split(";")},getClientOS:function(){var os=this.getUserAgent()[2]||"";return os.toLowerCase()},isWindowsClient:function(){return"windows"==this.getClientOS()},isMacClient:function(){return"mac"==this.getClientOS()},isClientOS:function(){return this.isWindowsClient()||this.isMacClient()},isOSSClient:function(){var sync=this.getUserAgent()[0]||"";return"gk_sync"==sync.toLowerCase()}};angular.module("OSSCommon",["ui.select"]).config(["uiSelectConfig",function(uiSelectConfig){uiSelectConfig.theme="bootstrap"}]).factory("OSSI18N",[function(){var _lanArrs=[{name:"简体中文",lan:"zh_CN",key:1},{name:"繁体中文",lan:"zh_TW",key:3},{name:"English",lan:"en_US",key:2}];return{getLanLists:function(){return _lanArrs},getLanByKey:function(_key){return _.find(_lanArrs,function(item){return+item.key===+_key})},getCurrLan:function(){var _lan="zh_CN";OSSClient.gGetLanguage&&(_lan=OSS.invoke("gGetLanguage"));var currLan=_.find(_lanArrs,function(item){return+item.key===+_lan.type});return currLan&&currLan.lan||(currLan=_lanArrs[0]),currLan},setCurrLan:function(_lan){return OSSClient.gChangeLanguage?void OSS.invoke("gChangeLanguage",{type:_lan}):!1}}}]).factory("OSSDialog",[function(){var defaultParam={type:"normal",resize:0,width:490,height:420};return{exportAuthorization:function(){var UIPath=OSS.invoke("getUIPath");OSS.invoke("showWnd",angular.extend({},defaultParam,{url:UIPath+"/export-authorization.html"}))},customServerHost:function(){var UIPath=OSS.invoke("getUIPath");OSS.invoke("showWnd",angular.extend({},defaultParam,{url:UIPath+"/custom-domain.html"}))},setting:function(){var UIPath=OSS.invoke("getUIPath");OSS.invoke("showWnd",angular.extend({},defaultParam,{url:UIPath+"/setting.html"}))}}}]).factory("OSSConfig",["gettext",function(gettext){var config=OSS.invoke("configInfo");return config||(config={source:"",disable_location_select:0,host:"aliyuncs.com",locations:[{location:"oss-cn-guizhou-a",name:gettext("互联网"),enable:0,network:"internet"},{location:"oss-cn-guizhou-a-internal",name:gettext("政务外网"),enable:0,network:"internet"},{location:"oss-cn-gzzwy-a-internal",name:gettext("政务外网"),enable:0,network:"intranet"},{location:"oss-cn-hangzhou",name:gettext("杭州"),enable:1},{location:"oss-cn-qingdao",name:gettext("青岛"),enable:1},{location:"oss-cn-beijing",name:gettext("北京"),enable:1},{location:"oss-cn-hongkong",name:gettext("香港"),enable:1},{location:"oss-cn-shenzhen",name:gettext("深圳"),enable:1},{location:"oss-cn-shanghai",name:gettext("上海"),enable:1},{location:"oss-ap-southeast-1",name:gettext("新加坡"),enable:1},{location:"oss-us-west-1",name:gettext("美国"),enable:1}]}),{isCustomClient:function(){return config.source&&""!=config.source},isGuiZhouClient:function(){return"guizhou"==config.source},showRefer:function(){return!!config.showrefer},showChannel:function(){return!!config.showchannel},isDisableLocationSelect:function(){return 1==config.disable_location_select},getLocations:function(){return config.locations||[]},getHost:function(){return config.host}}}]).factory("OSSRegion",["OSSConfig","localStorageService",function(OSSConfig,localStorageService){var locations=OSSConfig.getLocations(),currentLocation=OSS.invoke("getCurrentLocation");return{getRegionPerfix:function(){return"CLIENT_LOGIN_REGION"},list:function(_netType){var params={enable:1};return _netType&&(params.network=_netType),_.where(locations,params)},getEnableRegionByLocation:function(location){var enableLocations=this.list();return _.find(enableLocations,function(item){return 0===location.indexOf(item.location)||0===location.indexOf(item.location.replace("-a-internal",""))||0===location.indexOf(item.location.replace("-a",""))||0===location.indexOf(item.location.replace("-internal",""))})},getRegionByLocation:function(location){return _.find(locations,function(item){return 0===location.indexOf(item.location.replace("-internal",""))})},changeLocation:function(location){var isIntranetNet=localStorageService.get(this.getRegionPerfix()),isIntranet=this.isIntranet(currentLocation);if(isIntranetNet){var intranetLocations=[];intranetLocations=isIntranet&&"1"===isIntranetNet?this.getIntranetLocationItem():[this.getInternetLocationItem()].concat([this.getIntranetInner(!0)]);var _location=location;return angular.forEach(intranetLocations,function(item){(item.location===location||item.location===location+"-internal"||item.location===location+"-a-internal")&&(_location=item.location)}),_location}return location.indexOf("-internal")>0?location:currentLocation&&location+"-a"==currentLocation?location+"-a":currentLocation&&location+"-internal"==currentLocation?location+"-internal":currentLocation&&location+"-a-internal"==currentLocation?location+"-a-internal":location},isIntranet:function(location,network){if(location){var region=_.find(locations,function(item){return 1===item.enable&&item.location===location});if(region&&"intranet"===region.network)return!0}else if(network&&"intranet"===network)return!0;return!1},getIntranetLocationItem:function(){return _.filter(locations,function(item){return 1===item.enable&&"intranet"===item.network})},getInternetLocationItem:function(){return _.find(locations,function(item){return 1===item.enable&&"internet"===item.network})},getIntranetLocation:function(location){return location.replace("-internal","")},getIntranetInner:function(loadInner){return loadInner?this.getIntranetLocationItem()[1]:this.getIntranetLocationItem()[0]}}}]).factory("OSSException",["OSSConfig","gettext","gettextCatalog",function(OSSConfig,gettext,gettextCatalog){var erroList={getClientMessage:function(resError){if("AccessDenied"==resError.Code&&"Request has expired."==resError.Message){var serverTime=new Date(resError.ServerTime).getTime(),clientTime=new Date(resError.Expires).getTime(),expiresTime=parseInt(Math.abs(clientTime-serverTime)/1e3),d=parseInt(parseInt(expiresTime)/3600/24),h=parseInt(parseInt(expiresTime)/3600%24),m=parseInt(parseInt(expiresTime)/60%60),s=parseInt(parseInt(expiresTime)%60),str_fast_day=gettextCatalog.getString(gettext("数据加载失败，当前您电脑的时间比服务器时间快{{d}}天{{h}}小时{{m}}分钟{{s}}秒,请调整您的电脑时间后重试。"),{d:d,h:h,m:m,s:s}),str_flow_day=gettextCatalog.getString(gettext("数据加载失败，当前您电脑的时间比服务器时间慢{{d}}天{{h}}小时{{m}}分钟{{s}}秒,请调整您的电脑时间后重试。"),{d:d,h:h,m:m,s:s});return clientTime-serverTime>0?str_fast_day:0>clientTime-serverTime?str_flow_day:void 0}return erroList[resError.Code]?erroList[resError.Code]:resError.Message},AccessDenied:gettextCatalog.getString(gettext("拒绝访问")),BucketAlreadyExists:gettextCatalog.getString(gettext("Bucket已经存在")),BucketNotEmpty:gettextCatalog.getString(gettext("Bucket不为空")),EntityTooLarge:gettextCatalog.getString(gettext("实体过大")),EntityTooSmall:gettextCatalog.getString(gettext("实体过小")),FileGroupTooLarge:gettextCatalog.getString(gettext("文件组过大")),FilePartNotExist:gettextCatalog.getString(gettext("文件Part不存在")),FilePartStale:gettextCatalog.getString(gettext("文件Part过时")),InvalidArgument:gettextCatalog.getString(gettext("参数格式错误")),InvalidAccessKeyId:gettextCatalog.getString(gettext("Access Key ID不存在")),InvalidBucketName:gettextCatalog.getString(gettext("无效的Bucket名字")),InvalidDigest:gettextCatalog.getString(gettext("无效的摘要")),InvalidObjectName:gettextCatalog.getString(gettext("无效的Object名字")),InvalidPart:gettextCatalog.getString(gettext("无效的Part")),InvalidPartOrder:gettextCatalog.getString(gettext("无效的part顺序")),InvalidTargetBucketForLogging:gettextCatalog.getString(gettext("Logging操作中有无效的目标bucket")),InternalError:gettextCatalog.getString(gettext("OSS内部发生错误")),MalformedXML:gettextCatalog.getString(gettext("XML格式非法")),MethodNotAllowed:gettextCatalog.getString(gettext("不支持的方法")),MissingArgument:gettextCatalog.getString(gettext("缺少参数")),MissingContentLength:gettextCatalog.getString(gettext("缺少内容长度")),NoSuchBucket:gettextCatalog.getString(gettext("Bucket不存在")),NoSuchKey:gettextCatalog.getString(gettext("文件不存在")),NoSuchUpload:gettextCatalog.getString(gettext("Multipart Upload ID不存在")),NotImplemented:gettextCatalog.getString(gettext("无法处理的方法")),PreconditionFailed:gettextCatalog.getString(gettext("预处理错误")),RequestTimeTooSkewed:gettextCatalog.getString(gettext("发起请求的时间和服务器时间超出15分钟")),RequestTimeout:gettextCatalog.getString(gettext("请求超时")),SignatureDoesNotMatch:gettextCatalog.getString(gettext("签名错误")),TooManyBuckets:gettextCatalog.getString(gettext("Bucket数目超过限制"))};return{getError:function(res,status){var error={status:status,code:"",msg:""};if(res){var resError=res.Error;angular.extend(error,{code:resError.Code||"",msg:resError.Message||""});var message=erroList.getClientMessage(resError);angular.extend(error,{msg:message})}else{var msg="";403==status?msg=erroList.AccessDenied:(msg=gettextCatalog.getString(gettext("网络请求错误")),OSSConfig.isCustomClient()&&(msg+='<p class="text-muted">'+gettextCatalog.getString(gettext("（可能是你登录时选择的区域与当前的网络环境不匹配，请退出客户端后重新选择）"))+"</p>")),angular.extend(error,{msg:msg})}return error},getClientErrorMsg:function(res){return res.message}}}]).factory("Clipboard",function(){var maxLen=1,container=[];return{clear:function(){container=[]},len:function(){return container.length},get:function(){var item=container.shift();return OSS.log("Clipboard.get",item),item},add:function(data){container.push(data),container.length>maxLen&&container.shift(),OSS.log("Clipboard.add",data)}}}).filter("baseName",function(){return Util.String.baseName}).filter("isDir",function(){return function(path){var lastStr=Util.String.lastChar(path);return"/"===lastStr||"\\"===lastStr?1:0}}).filter("getLocationName",["OSSRegion",function(OSSRegion){return function(location){if(!location)return"";var region=OSSRegion.getRegionByLocation(location);return region?region.name:""}}]).directive("ngRightClick",["$parse",function($parse){return function($scope,$element,$attrs){var fn=$parse($attrs.ngRightClick);$element.bind("contextmenu",function(event){$scope.$apply(function(){event.preventDefault(),fn($scope,{$event:event})})})}}]).directive("scrollLoad",["$rootScope","$parse",function($rootScope,$parse){return{restrict:"A",link:function($scope,$element,attrs){var triggerDistance=0,disableScroll=!1;null!=attrs.triggerDistance&&$scope.$watch(attrs.triggerDistance,function(value){return triggerDistance=parseInt(value||0,10)}),null!=attrs.disableScroll&&$scope.$watch(attrs.disableScroll,function(value){return disableScroll=!!value});var direction="down";attrs.triggerDirection&&(direction=attrs.triggerDirection);var startScrollTop=0,fn=$parse(attrs.scrollLoad);$element.on("scroll.scrollLoad",function(event){var _self=jQuery(this),realDistance=0,scrollH=0,scrollT=0,isScrollDown=!1;scrollH=jQuery.isWindow(this)?document.body.scrollHeight:$element[0].scrollHeight,scrollT=_self.scrollTop(),isScrollDown=scrollT>startScrollTop;var clientHeight=jQuery.isWindow(this)?document.documentElement.clientHeight||document.body.clientHeight:this.clientHeight;realDistance="down"==direction?scrollH-scrollT-clientHeight:scrollT,triggerDistance>=realDistance&&!disableScroll&&(!isScrollDown&&"up"==direction||isScrollDown&&"down"==direction)&&$scope.$apply(function(){fn($scope,{$event:event})}),startScrollTop=scrollT}),$scope.$on("$destroy",function(){$element.off("scroll.scrollLoad")})}}}]).directive("scrollToItem",["$timeout",function($timeout){return{restrict:"A",link:function(scope,element,attrs){attrs.$observe("scrollToItem",function(newVal){"undefiend"!=typeof newVal&&$timeout(function(){var index=newVal;if(!(0>index)){var $fileItem=element.find(attrs.itemSelector+":eq("+index+")");if($fileItem.size()){var top=$fileItem.position().top,grep=top+$fileItem.height()-element.height();0>top?element.scrollTop(element.scrollTop()+top):grep>0&&element.scrollTop(element.scrollTop()+grep)}}})})}}}]).directive("onDrop",["$parse",function($parse){return function(scope,element,attrs){var fn=$parse(attrs.onDrop);element.on("drop",function(event){scope.$apply(function(){fn(scope,{$event:event})})})}}]).directive("preventDragDrop",[function(){return{restrict:"A",link:function($scope,$element){$element.on("dragstart",function(event){var jTarget=jQuery(event.target);jTarget.attr("draggable")||jTarget.parents("[draggable]").size()||event.preventDefault()}),$element.on("dragover",function(event){event.preventDefault()}),$element.on("dragenter",function(event){event.preventDefault()}),$element.on("drop",function(event){event.preventDefault()})}}}]).directive("autoSelect",[function(){return{restrict:"A",link:function(scope,element,attrs){var isAutoSelect=!1;attrs.$observe("autoSelect",function(isAuto){isAutoSelect=isAuto}),element.on("click.autoSelect",function(){isAutoSelect&&element.select()})}}}]).directive("locationSelect",["$rootScope","OSSRegion","OSSConfig","$http","localStorageService",function($rootScope,OSSRegion,OSSConfig,$http,localStorageService){return{restrict:"E",replace:!0,scope:{selectLocation:"=",loginNetworktype:"=",disableSelect:"=",name:"@",placeHolder:"@",searchDisabled:"=",defaultLocation:"@"},templateUrl:"views/location-select.html",link:function(scope){OSSConfig.isCustomClient()?scope.$watch("loginNetworktype",function(newVal){if(newVal)if(OSSRegion.isIntranet(null,newVal)){var region=OSSRegion.getIntranetInner(!1),host=OSSConfig.getHost(),requestUrl="http://"+region.location+"."+host;region.customhost&&region.customhost.length&&(requestUrl="http://"+region.customhost),$http.get(requestUrl,{timeout:3e3}).error(function(req,status){req||status?(localStorageService.set(OSSRegion.getRegionPerfix(),"1"),scope.locations=OSSRegion.getIntranetLocationItem()):(localStorageService.set(OSSRegion.getRegionPerfix(),"2"),scope.locations=[OSSRegion.getInternetLocationItem()].concat([OSSRegion.getIntranetInner(!0)])),$rootScope.$broadcast("unDisabledLocationSelect"),scope.locations.selected=_.find(scope.locations,function(region){return 0==region.location.indexOf(scope.defaultLocation)})})}else localStorageService.remove(OSSRegion.getRegionPerfix()),scope.locations=OSSRegion.list(newVal),$rootScope.$broadcast("unDisabledLocationSelect"),scope.locations.selected=_.find(scope.locations,function(region){return 0==region.location.indexOf(scope.defaultLocation)})}):(localStorageService.remove(OSSRegion.getRegionPerfix()),scope.locations=OSSRegion.list(),scope.placeHolder||(scope.locations.selected=scope.locations[0]),scope.$watch("defaultLocation",function(newVal){newVal&&(scope.locations.selected=_.find(scope.locations,function(region){return 0==region.location.indexOf(newVal)}))})),scope.$watch("locations.selected",function(val){scope.selectLocation=val})}}}]);var ossClientCallback=function(name,param){console.log("客户端的回调[ossClientCallback]",arguments),"string"!=typeof name&&(name=String(name));var JSONparam,rootScope=jQuery(document).scope();param&&(JSONparam=JSON.parse(param)),rootScope&&rootScope.$broadcast(name,JSONparam)};ossClientCallback.getUpdateLoadingCount=function(){return"UpdateLoadingCount"},angular.module("OSSLogin",["ngCookies","ngResource","ngRoute","ngSanitize","ngTouch","ui.bootstrap","angularSpinner","OSSCommon","LocalStorageModule","gettext"]).run(function(gettextCatalog,OSSI18N){gettextCatalog.currentLanguage=OSSI18N.getCurrLan().lan,gettextCatalog.debug=!0}).config([function(){}]).controller("MainCtrl",["$scope","localStorageService","usSpinnerService","$http","OSSException","OSSRegion","OSSConfig","$timeout","gettext","gettextCatalog","OSSI18N",function($scope,localStorageService,usSpinnerService,$http,OSSException,OSSRegion,OSSConfig,$timeout,gettext,gettextCatalog,OSSI18N){$scope.isCustomClient=OSSConfig.isCustomClient(),$scope.lanLists=angular.copy(OSSI18N.getLanLists()),$scope.lanLists.selected=OSSI18N.getCurrLan(),$scope.selectLan=function($item){gettextCatalog.setCurrentLanguage($item.lan),OSSI18N.setCurrLan($item.key)};var loginToLanchpad=function(){OSS.invoke("showLaunchpad"),OSS.invoke("closeWnd")};$scope.step=location.hash?location.hash.replace(/^#/,""):"loginById",$scope.getSectionClass=function(sectionId){return{current:sectionId==$scope.step,"custom-client":$scope.isCustomClient}},$scope.customHost=OSS.invoke("getCurrentHost"),$scope.customDomain=function(host){OSS.invoke("setServerLocation",{location:host},function(res){res.error?alert(OSSException.getClientErrorMsg(res)):($scope.customHost=host,alert(gettextCatalog.getString(gettext("设置成功"))))})},$scope.deviceCode=OSS.invoke("getDeviceEncoding"),$scope.regionSelectTip=gettextCatalog.getString(gettext("选择区域")),$scope.login=function(accessKeyId,accessKeySecret,isCloudHost,region){console.info("login oss argument:",arguments);var location=void 0;if(!accessKeyId||!accessKeyId.length)return void alert(gettextCatalog.getString(gettext("请输入 Access Key ID")));if(!accessKeySecret||!accessKeySecret.length)return void alert(gettextCatalog.getString(gettext("请输入 Access Key Secret")));if(region&&region.location&&(location=region.location),!$scope.isCustomClient&&isCloudHost){if(!location)return void alert(gettextCatalog.getString(gettext("请选择区域")));location+="-internal"}if($scope.isCustomClient||isCloudHost||(location=null),OSSConfig.isCustomClient()){if(!location)return void alert(gettextCatalog.getString(gettext("请选择区域")));var customHost=region.customhost;customHost&&customHost.length&&OSS.invoke("setServerLocation",{location:customHost})}var param={keyid:accessKeyId,keysecret:accessKeySecret};location&&angular.extend(param,{location:location}),$scope.loging=!0,OSS.invoke("loginByKey",param,function(res){$scope.loging=!1,$scope.$apply(function(){res.error?alert(OSSException.getClientErrorMsg(res)):$scope.step="setPassword"})})},$scope.setPassword=function(password,rePassword){return password&&password.length?password.length<6?void alert(gettextCatalog.getString(gettext("密码长度最少6位"))):rePassword&&rePassword.length?password!==rePassword?void alert(gettextCatalog.getString(gettext("两次输入的密码不一致"))):($scope.setting=!0,void OSS.invoke("setPassword",{password:password},function(res){$scope.$apply(function(){$scope.setting=!1,res.error?alert(OSSException.getClientErrorMsg(res)):loginToLanchpad()})})):void alert(gettextCatalog.getString(gettext("请确认安全密码"))):void alert(gettextCatalog.getString(gettext("请输入安全密码")))},$scope.skipSetPassword=function(){loginToLanchpad()},$scope.copy=function(deviceCode){OSS.invoke("setClipboardData",deviceCode),alert(gettextCatalog.getString(gettext("复制成功")))},$scope["import"]=function(isCloudHost,location){$scope.loging=!0,OSS.invoke("loginByFile",{ishost:isCloudHost?1:0,location:location},function(res){$timeout(function(){$scope.loging=!1,res.error?5!=res.error&&alert(OSSException.getClientErrorMsg(res)):$scope.step="setPassword"})})};var allowErrorCount=5,loginErrorCount=localStorageService.get("login-error-count")?parseInt(localStorageService.get("login-error-count")):0;$scope.loginByPassword=function(password){return password&&password.length?($scope.loging=!0,void OSS.invoke("loginPassword",{password:password},function(res){$scope.$apply(function(){if($scope.loging=!1,res.error)if(loginErrorCount++,localStorageService.set("login-error-count",loginErrorCount),loginErrorCount>allowErrorCount){var str=gettextCatalog.getString(gettext("你连续密码输入错误已超过{{allowErrorCount}}次,请重新使用Access Key ID 和 Access Key Secret登录"),{allowErrorCount:allowErrorCount});alert(str),OSS.invoke("clearPassword"),$scope.step="loginById"}else alert(OSSException.getClientErrorMsg(res));else loginErrorCount=0,localStorageService.set("login-error-count",loginErrorCount),loginToLanchpad()})})):void alert(gettextCatalog.getString(gettext("请输入安全密码")))},$scope.clearPassword=function(){confirm(gettextCatalog.getString(gettext("确定要清除安全密码？")))&&(OSS.invoke("clearPassword"),$scope.step="loginById")};var checkCurrentLocation=function(callback){var region=OSSRegion.getIntranetInner(!0),host=OSSConfig.getHost(),requestUrl="http://"+region.location+"."+host;region.customhost&&region.customhost.length&&(requestUrl="http://"+region.customhost),$http.get(requestUrl,{timeout:3e3}).error(function(req,status){req||status?($scope.netWorkType=region.network,callback(region.location)):(region=OSSRegion.getInternetLocationItem(),$scope.netWorkType=region.network,callback(region.location))})};$scope.checkingLocation=!1,$scope.predictionLocation="",$scope.netWorkType=null,OSSConfig.isCustomClient()&&($scope.checkingLocation=!0,usSpinnerService.spin("checking-locaiton-spinner"),checkCurrentLocation(function(predictionLocation){$scope.defaultLocation=predictionLocation})),$scope.$on("unDisabledLocationSelect",function(){$scope.checkingLocation=!1,usSpinnerService.stop("checking-locaiton-spinner")})}]),angular.module("gettext").run(["gettextCatalog",function(gettextCatalog){gettextCatalog.setStrings("zh_CN",{"(最少6位)":"(最少6位)",",你可以按【{{isWindowClient?'Ctrl+C':'⌘ + C'}}】复制以下名称创建：":",你可以按【{{isWindowClient?'Ctrl+C':'⌘ + C'}}】复制以下名称创建：","/秒":"/秒","1. 只能包含字母，数字，中文，下划线（_）和短横线（-）,小数点（.）":"1. 只能包含字母，数字，中文，下划线（_）和短横线（-）,小数点（.）","2. 只能以字母、数字或者中文开头":"2. 只能以字母、数字或者中文开头","3. 文件夹的长度限制在1-254之间":"3. 文件夹的长度限制在1-254之间","4. Object总长度必须在1-1023之间":"4. Object总长度必须在1-1023之间","Access Key ID不存在":"Access Key ID不存在","Bucket下载":"Bucket下载","Bucket不为空":"Bucket不为空","Bucket不存在":"Bucket不存在","Bucket名称：":"Bucket名称：","Bucket已经存在":"Bucket已经存在","Bucket数目超过限制":"Bucket数目超过限制","Bucket的名称不能为空":"Bucket的名称不能为空","Bucket的名称格式错误":"Bucket的名称格式错误","Content-Type是必填字段":"Content-Type是必填字段","HTTP属性值格式错误":"HTTP属性值格式错误","Logging操作中有无效的目标bucket":"Logging操作中有无效的目标bucket","Multipart Upload ID不存在":"Multipart Upload ID不存在","OSS-当前选择区域：":"OSS-当前选择区域：","OSS内部发生错误":"OSS内部发生错误","Refer设置":"Refer设置","Refer设置：":"Refer设置：","Style设置：":"Style设置：","XML格式非法":"XML格式非法","·只能包含小写字母、数字和横线":"·只能包含小写字母、数字和横线","·必须以小写字母和数字开头和结尾":"·必须以小写字母和数字开头和结尾","·长度限制在3-63之间":"·长度限制在3-63之间","上传":"上传","上传加速是一项增值服务，可以在复杂的网络环境下为您提供稳定高速的上传速度，立即":"上传加速是一项增值服务，可以在复杂的网络环境下为您提供稳定高速的上传速度，立即","上传时间":"上传时间","上传设置":"上传设置","上传速度：":"上传速度：","上传队列":"上传队列","上海":"上海","下载":"下载","下载当前目录":"下载当前目录","下载设置":"下载设置","下载速度：":"下载速度：","下载队列":"下载队列","不允许为空":"不允许为空","不再提示":"不再提示","不同区域的Bucket之间不能复制":"不同区域的Bucket之间不能复制","不支持的方法":"不支持的方法","两次输入的密码不一致":"两次输入的密码不一致","个文件，请稍候...":"个文件，请稍候...","中搜索":"中搜索","互联网":"互联网","你确定要取消所有上传？":"你确定要取消所有上传？","你确定要取消所有下载？":"你确定要取消所有下载？","你确定要取消这{{fileLen}}个文件的上传？":"你确定要取消这{{fileLen}}个文件的上传？","你确定要取消这{{fileLen}}文件的下载？":"你确定要取消这{{fileLen}}文件的下载？","你确定要取消这个文件的上传？":"你确定要取消这个文件的上传？","你确定要取消这个文件的下载？":"你确定要取消这个文件的下载？","你连续密码输入错误已超过{{allowErrorCount}}次,请重新使用Access Key ID 和 Access Key Secret登录":"你连续密码输入错误已超过{{allowErrorCount}}次,请重新使用Access Key ID 和 Access Key Secret登录","保&nbsp;&nbsp;&nbsp;&nbsp;存":"保&nbsp;&nbsp;&nbsp;&nbsp;存","信息":"信息","停止加速":"停止加速","允许为空":"允许为空","全部取消":"全部取消","全部开始":"全部开始","全部暂停":"全部暂停","公共读":"公共读","公共读写":"公共读写","关闭":"关闭","再输一次":"再输一次","分":"分","创建时间":"创建时间","删除":"删除","删除Bucket":"删除Bucket","刷新":"刷新","前进":"前进","前进到 {{path}}":"前进到 {{path}}","剩余加速时长:":"剩余加速时长:","加载中...":"加载中...","加速服务":"加速服务","北京":"北京","匹配正则:":"匹配正则:","单任务线程数必须是大于{{min}}小于等于{{max}}的整数":"单任务线程数必须是大于{{min}}小于等于{{max}}的整数","单任务线程数：":"单任务线程数：","参数格式错误":"参数格式错误","发起请求的时间和服务器时间超出15分钟":"发起请求的时间和服务器时间超出15分钟","取消":"取消","同时任务数必须是大于{{min}}小于等于{{max}}的整数":"同时任务数必须是大于{{min}}小于等于{{max}}的整数","同时任务数：":"同时任务数：","名&nbsp;&nbsp;&nbsp;&nbsp;称：":"名&nbsp;&nbsp;&nbsp;&nbsp;称：","回调地址:":"回调地址:","回调设置":"回调设置",'回调设置功能是当前bucket的文件或文件夹上传完成后，若文件或文件夹名称匹配到正则的规则，则去调设置的回调地址，注意回调地址是以"PUT"方法进行请求的！':'回调设置功能是当前bucket的文件或文件夹上传完成后，若文件或文件夹名称匹配到正则的规则，则去调设置的回调地址，注意回调地址是以"PUT"方法进行请求的！',"图片服务器设置":"图片服务器设置","图片设置":"图片设置","在":"在","地址：":"地址：","复制":"复制","复制成功":"复制成功","复制机器码":"复制机器码","大于{{dateLen}}天":"大于{{dateLen}}天","大小":"大小","存储区域：":"存储区域：","安全密码":"安全密码","完成":"完成","实体过大":"实体过大","实体过小":"实体过小","密码长度最少6位":"密码长度最少6位","导入授权":"导入授权","导出成功":"导出成功","导出授权":"导出授权","小技巧：使用Shift和Ctrl键(Mac下Command键)可以实现多选操作。":"小技巧：使用Shift和Ctrl键(Mac下Command键)可以实现多选操作。","属性内容":"属性内容","属性名称":"属性名称","属性名称只能包含英文、数子、横线、下划线、斜杠、点、英文分号、英文逗号、英文冒号、英文双引号和等号":"属性名称只能包含英文、数子、横线、下划线、斜杠、点、英文分号、英文逗号、英文冒号、英文双引号和等号","属性名称只能包含英文、数子或横线":"属性名称只能包含英文、数子或横线","属性名称格式错误":"属性名称格式错误","属性管理":"属性管理","已复制到剪切板":"已复制到剪切板","已存在相同名称的Bucket":"已存在相同名称的Bucket","已存在相同名称的文件夹":"已存在相同名称的文件夹","开启":"开启","开始":"开始","开始加速":"开始加速","当前加载队列已超出客户端下载能力，请使用OSS提供的API下载。":"当前加载队列已超出客户端下载能力，请使用OSS提供的API下载。","当前状态:":"当前状态:","成功":"成功","所属地区：":"所属地区：","打开日志文件夹":"打开日志文件夹","拒绝访问":"拒绝访问","按钮，开始创建你的Bucket":"按钮，开始创建你的Bucket","政务外网":"政务外网","数据加载失败，当前您电脑的时间比服务器时间快{{d}}天{{h}}小时{{m}}分钟{{s}}秒,请调整您的电脑时间后重试。":"数据加载失败，当前您电脑的时间比服务器时间快{{d}}天{{h}}小时{{m}}分钟{{s}}秒,请调整您的电脑时间后重试。","数据加载失败，当前您电脑的时间比服务器时间慢{{d}}天{{h}}小时{{m}}分钟{{s}}秒,请调整您的电脑时间后重试。":"数据加载失败，当前您电脑的时间比服务器时间慢{{d}}天{{h}}小时{{m}}分钟{{s}}秒,请调整您的电脑时间后重试。","数据请求失败，如果你自定义了服务器地址，请检查是否正常。":"数据请求失败，如果你自定义了服务器地址，请检查是否正常。","文件Part不存在":"文件Part不存在","文件Part过时":"文件Part过时","文件{{fileName}}设置http头的错误信息:":"文件{{fileName}}设置http头的错误信息:","文件不存在":"文件不存在","文件名":"文件名","文件名：":"文件名：","文件夹名称格式错误":"文件夹名称格式错误","文件组过大":"文件组过大","新加坡":"新加坡","新建":"新建","新建Bucket":"新建Bucket","新建文件夹":"新建文件夹","无效的Bucket名字":"无效的Bucket名字","无效的Object名字":"无效的Object名字","无效的Part":"无效的Part","无效的part顺序":"无效的part顺序","无效的摘要":"无效的摘要","无法处理的方法":"无法处理的方法","无法访问该Bucket":"无法访问该Bucket","时":"时","是否只允许通过 Style 来访问图像处理接口":"是否只允许通过 Style 来访问图像处理接口","暂停":"暂停","本机是ECS云主机":"本机是ECS云主机","机器码":"机器码","杭州":"杭州","欢迎使用OSS客户端":"欢迎使用OSS客户端","正在加载下载列表，当前已加载了":"正在加载下载列表，当前已加载了","没有上传":"没有上传","没有下载":"没有下载","没有数据":"没有数据","没有文件":"没有文件","没有日志":"没有日志","没有碎片":"没有碎片","注：多个refer以换行分隔，支持通配符(*,?)":"注：多个refer以换行分隔，支持通配符(*,?)","注：如果下载队列已加载完成,则删除已加载列表选项无效":"注：如果下载队列已加载完成,则删除已加载列表选项无效","深圳":"深圳","添加输入框":"添加输入框","清空已完成":"清空已完成","清除安全密码":"清除安全密码","点击左侧栏的":"点击左侧栏的","状&nbsp;&nbsp;&nbsp;&nbsp;态：":"状&nbsp;&nbsp;&nbsp;&nbsp;态：","登&nbsp;&nbsp;&nbsp;&nbsp;录":"登&nbsp;&nbsp;&nbsp;&nbsp;录","的属性":"的属性","确定":"确定","确定要下载整个Bucket吗？":"确定要下载整个Bucket吗？","确定要删除Bucket “{{bucketName}}“吗？删除后数据将无法恢复":"确定要删除Bucket “{{bucketName}}“吗？删除后数据将无法恢复","确定要删除选择的碎片？":"确定要删除选择的碎片？","确定要删除？":"确定要删除？","确定要清除安全密码？":"确定要清除安全密码？","确认":"确认","确认设置":"确认设置","碎片管理":"碎片管理","碎片详细":"碎片详细","禁止访问原图：":"禁止访问原图：","私有":"私有","秒":"秒","移除":"移除","空Refer：":"空Refer：","等待上传":"等待上传","等待下载":"等待下载","签名错误":"签名错误","粘贴":"粘贴","终止操作":"终止操作","编号":"编号","缺少内容长度":"缺少内容长度","缺少参数":"缺少参数","网络请求错误":"网络请求错误","美国":"美国","自定义属性":"自定义属性","自定义服务器地址":"自定义服务器地址","自定义服务地址设置后只有设置了登录密码才能一直保存，否则下次登录时将自动清空。":"自定义服务地址设置后只有设置了登录密码才能一直保存，否则下次登录时将自动清空。","获取":"获取","获取Object的地址":"获取Object的地址","获取地址":"获取地址","警告":"警告","设置":"设置","设置HTTP头":"设置HTTP头","设置HTTP头属性":"设置HTTP头属性","设置一个安全密码，下次打开客户端时只需要输入这个安全密码就能使用客户端":"设置一个安全密码，下次打开客户端时只需要输入这个安全密码就能使用客户端","设置成功":"设置成功","设置的值必须是正整数":"设置的值必须是正整数","详细":"详细","语言设置":"语言设置","语言设置：":"语言设置：","请求超时":"请求超时","请确认":"请确认","请确认安全密码":"请确认安全密码","请输入 Access Key ID":"请输入 Access Key ID","请输入 Access Key Secret":"请输入 Access Key Secret","请输入Access Key 和Access Secret确认":"请输入Access Key 和Access Secret确认","请输入加速卡号":"请输入加速卡号","请输入大于0的整数":"请输入大于0的整数","请输入安全密码":"请输入安全密码","请输入服务器地址":"请输入服务器地址","请输入要授权的机器码":"请输入要授权的机器码","请输入要设置的refer":"请输入要设置的refer","请输入链接的有效期：":"请输入链接的有效期：","请选择区域":"请选择区域","读写权限：":"读写权限：","购买":"购买","跳过设置":"跳过设置","输入您设置的安全密码即可快速登录管理器":"输入您设置的安全密码即可快速登录管理器","返&nbsp;&nbsp;&nbsp;&nbsp;回":"返&nbsp;&nbsp;&nbsp;&nbsp;回","返回":"返回","返回到 {{path}}":"返回到 {{path}}","还未创建Bucket":"还未创建Bucket","进&nbsp;&nbsp;&nbsp;&nbsp;入":"进&nbsp;&nbsp;&nbsp;&nbsp;入","选择区域":"选择区域","选择文件并导入":"选择文件并导入","选择语言":"选择语言","重连次数:":"重连次数:","错误":"错误","错误日志":"错误日志","错误：":"错误：","限制数字范围：":"限制数字范围：","青岛":"青岛","预处理错误":"预处理错误","香港":"香港","（可能是你登录时选择的区域与当前的网络环境不匹配，请退出客户端后重新选择）":"（可能是你登录时选择的区域与当前的网络环境不匹配，请退出客户端后重新选择）"}),gettextCatalog.setStrings("zh_TW",{"(最少6位)":"(最少6位)",",你可以按【{{isWindowClient?'Ctrl+C':'⌘ + C'}}】复制以下名称创建：":",你可以按【{{isWindowClient?'Ctrl+C':'⌘ + C'}}】複製以下名稱建立：","/秒":"/秒","1. 只能包含字母，数字，中文，下划线（_）和短横线（-）,小数点（.）":"1. 只能包含字母，數字，中文，底線( _ ) 和破折號( - ) ,小數點 ( . )","2. 只能以字母、数字或者中文开头":"2. 只能以字母、數字或者中文開頭","3. 文件夹的长度限制在1-254之间":"3. 文件夾的長度限制在1-254之間","4. Object总长度必须在1-1023之间":"4. Object總長度必須在1-1023之間","Access Key ID不存在":"Access Key ID不存在",
"Bucket下载":"Bucket下載","Bucket不为空":"Bucket不為空","Bucket不存在":"Bucket不存在","Bucket名称：":"Bucket名稱：","Bucket已经存在":"Bucket已經存在","Bucket数目超过限制":"Bucket數目超過限制","Bucket的名称不能为空":"Bucket的名稱不能為空","Bucket的名称格式错误":"Bucket的名稱格式錯誤","Content-Type是必填字段":"Content-Type是必填欄位","HTTP属性值格式错误":"HTTP屬性值格式錯誤","Logging操作中有无效的目标bucket":"Logging操作中有無效的目的bucket","Multipart Upload ID不存在":"Multipart Upload ID不存在","OSS-当前选择区域：":"OSS-目前選擇區域：","OSS内部发生错误":"OSS內部發生錯誤","Refer设置":"Refer設置","Refer设置：":"Refer設置：","Style设置：":"Style設置：","XML格式非法":"XML格式非法","·只能包含小写字母、数字和横线":".只能包含小寫字母、數字和橫線","·必须以小写字母和数字开头和结尾":".必須以小寫字母和數字開頭和結尾","·长度限制在3-63之间":".長度限制在3-63之間","上传":"上傳","上传加速是一项增值服务，可以在复杂的网络环境下为您提供稳定高速的上传速度，立即":"上傳加速是一項加值服務，可以在複雜的網路環境下為您提供穩定高速的上傳速度，立即","上传时间":"上傳時間","上传设置":"上傳設置","上传速度：":"上傳速度：","上传队列":"上傳佇列","上海":"上海","下载":"下載","下载当前目录":"下載目前目錄","下载设置":"下載設置","下载速度：":"下載速度：","下载队列":"下載佇列","不允许为空":"不允許為空","不再提示":"不再提示","不同区域的Bucket之间不能复制":"不同區域的Bucket之間不能複製","不支持的方法":"不支持的方法","两次输入的密码不一致":"兩次輸入的密碼不一致","个文件，请稍候...":"個文件，請稍候...","中搜索":"中搜索","互联网":"網際網路","你确定要取消所有上传？":"你確定要取消所有上傳？","你确定要取消所有下载？":"你確定要取消所有下載？","你确定要取消这{{fileLen}}个文件的上传？":"你確定要取消這{{fileLen}}個文件的上傳？","你确定要取消这{{fileLen}}文件的下载？":"你確定要取消這{{fileLen}}文件的下載？","你确定要取消这个文件的上传？":"你確定要取消這個文件的上傳？","你确定要取消这个文件的下载？":"你確定要取消這個文件的下載？","你连续密码输入错误已超过{{allowErrorCount}}次,请重新使用Access Key ID 和 Access Key Secret登录":"你連續密碼輸入錯誤已超過{{allowErrorCount}}次，請重新使用Access Key ID 和 Access Key Secret登錄","保&nbsp;&nbsp;&nbsp;&nbsp;存":"保&nbsp;&nbsp;&nbsp;&nbsp;存","信息":"訊息","停止加速":"停止加速","允许为空":"允許為空","全部取消":"全部取消","全部开始":"全部開始","全部暂停":"全部暫停","公共读":"公開讀","公共读写":"公開讀寫","关闭":"關閉","再输一次":"再輸入一次","分":"分","创建时间":"建立時間","删除":"刪除","删除Bucket":"刪除Bucket","刷新":"刷新","前进":"前進","前进到 {{path}}":"前進到 {{path}}","剩余加速时长:":"剩餘加速時間:","加载中...":"載入中...","加速服务":"加速服務","北京":"北京","匹配正则:":"符合正規表示式:","单任务线程数必须是大于{{min}}小于等于{{max}}的整数":"單行程執行緒數必須大於{{min}}小於等於{{max}}的整數","单任务线程数：":"單行程執行緒數：","参数格式错误":"參數格式錯誤","发起请求的时间和服务器时间超出15分钟":"發起請求的時間和服務器時間超出15分鐘","取消":"取消","同时任务数必须是大于{{min}}小于等于{{max}}的整数":"並行行程數必須是大於{{min}}小於等於{{max}}的整數","同时任务数：":"並行行程數：","名&nbsp;&nbsp;&nbsp;&nbsp;称：":"名&nbsp;&nbsp;&nbsp;&nbsp;稱：","回调地址:":"重導位址：","回调设置":"重導設置",'回调设置功能是当前bucket的文件或文件夹上传完成后，若文件或文件夹名称匹配到正则的规则，则去调设置的回调地址，注意回调地址是以"PUT"方法进行请求的！':'重導設置功能是目前bucket的文件或文件夾上傳完成後，若文件或文件夾名稱符合正則表示式，則會調用設置的重導位址，注意重導位址是以"PUT"方式進行請求的！',"图片服务器设置":"圖片服務器設置","图片设置":"圖片設置","在":"在","地址：":"地址：","复制":"複製","复制成功":"複製成功","复制机器码":"複製機器碼","大于{{dateLen}}天":"大於{{dateLen}}天","大小":"大小","存储区域：":"儲存區域：","安全密码":"安全密碼","完成":"完成","实体过大":"實體過大","实体过小":"實體過小","密码长度最少6位":"密碼長度最少6位","导入授权":"匯入授權","导出成功":"匯出成功","导出授权":"匯出授權","小技巧：使用Shift和Ctrl键(Mac下Command键)可以实现多选操作。":"小技巧：使用Shift和Ctrl鍵(Mac下Command鍵)可以作多重選取操作。","属性内容":"屬性內容","属性名称":"屬性名稱","属性名称只能包含英文、数子、横线、下划线、斜杠、点、英文分号、英文逗号、英文冒号、英文双引号和等号":'屬性名稱只能包含英文、數字、橫線(-)、底線(_)、斜線(/)、點(.)、分號(;)、逗號(,)、冒號(:)、雙引號(")和等號(=)',"属性名称只能包含英文、数子或横线":"屬性名稱只能包含英文、數字或橫線(-)","属性名称格式错误":"屬性名稱格式錯誤","属性管理":"屬性管理","已复制到剪切板":"已複製到剪貼簿","已存在相同名称的Bucket":"已存在相同名稱的Bucket","已存在相同名称的文件夹":"已存在相同名稱的文件夾","开启":"開啟","开始":"開始","开始加速":"開始加速","当前加载队列已超出客户端下载能力，请使用OSS提供的API下载。":"目前載入佇列已超出用戶端下載能力，請使用OSS提供的API下載。","当前状态:":"目前狀態:","成功":"成功","所属地区：":"所屬地區：","打开日志文件夹":"打開日誌文件夾","拒绝访问":"拒絕訪問","按钮，开始创建你的Bucket":"按鈕，開始建立你的Bucket","政务外网":"政務外網","数据加载失败，当前您电脑的时间比服务器时间快{{d}}天{{h}}小时{{m}}分钟{{s}}秒,请调整您的电脑时间后重试。":"資料載入失敗，目前您電腦的時間比服務器時間快{{d}}天{{h}}小時{{m}}分鐘{{s}}秒，請調整您的電腦時間後重試。","数据加载失败，当前您电脑的时间比服务器时间慢{{d}}天{{h}}小时{{m}}分钟{{s}}秒,请调整您的电脑时间后重试。":"資料載入失敗，目前您電腦的時間比服務器時間慢{{d}}天{{h}}小時{{m}}分鐘{{s}}秒，請調整您的電腦時間後重試。","数据请求失败，如果你自定义了服务器地址，请检查是否正常。":"資料請求失敗，如果你自定義了服務器位址，請檢查是否正常。","文件Part不存在":"文件Part不存在","文件Part过时":"文件Part逾時","文件{{fileName}}设置http头的错误信息:":"文件{{fileName}}設置http頭的錯誤訊息:","文件不存在":"文件不存在","文件名":"文件名","文件名：":"文件名：","文件夹名称格式错误":"文件夾名稱格式錯誤","文件组过大":"文件組過大","新加坡":"新加坡","新建":"新建","新建Bucket":"新建Bucket","新建文件夹":"新建文件夾","无效的Bucket名字":"無效的Bucket名字","无效的Object名字":"無效的Object名字","无效的Part":"無效的Part","无效的part顺序":"無效的part順序","无效的摘要":"無效的摘要","无法处理的方法":"無法處理的方法","无法访问该Bucket":"無法訪問該Bucket","时":"時","是否只允许通过 Style 来访问图像处理接口":"是否只允許通過 Style 來訪問圖片處理介面","暂停":"暫停","本机是ECS云主机":"本機是ECS雲主機","机器码":"機器碼","杭州":"杭州","欢迎使用OSS客户端":"歡迎使用OSS用戶端","正在加载下载列表，当前已加载了":"正在載入下載列表，目前已載入了","没有上传":"沒有上傳","没有下载":"沒有下載","没有数据":"沒有資料","没有文件":"沒有文件","没有日志":"沒有日誌","没有碎片":"沒有碎片","注：多个refer以换行分隔，支持通配符(*,?)":"註：多個refer以換行分隔，支持通用符號(*,?)","注：如果下载队列已加载完成,则删除已加载列表选项无效":"註：如果下載佇列已加載完成,則刪除已載入列表選項無效","深圳":"深圳","添加输入框":"增加輸入框","清空已完成":"清空已完成","清除安全密码":"清除安全密碼","点击左侧栏的":"點擊左側欄的","状&nbsp;&nbsp;&nbsp;&nbsp;态：":"狀&nbsp;&nbsp;&nbsp;&nbsp;態：","登&nbsp;&nbsp;&nbsp;&nbsp;录":"登&nbsp;&nbsp;&nbsp;&nbsp;錄","的属性":"的屬性","确定":"確定","确定要下载整个Bucket吗？":"確定要下載整個Bucket嗎？","确定要删除Bucket “{{bucketName}}“吗？删除后数据将无法恢复":"確定要刪除Bucket “{{bucketName}}“嗎？刪除後數據將無法恢復","确定要删除选择的碎片？":"確定要刪除選擇的碎片？","确定要删除？":"確定要刪除？","确定要清除安全密码？":"確定要清除安全密碼？","确认":"確認","确认设置":"確認設置","碎片管理":"碎片管理","碎片详细":"碎片詳細","禁止访问原图：":"禁止訪問原圖：","私有":"私有","秒":"秒","移除":"移除","空Refer：":"空Refer：","等待上传":"等待上傳","等待下载":"等待下載","签名错误":"簽名錯誤","粘贴":"黏貼","终止操作":"終止操作","编号":"編號","缺少内容长度":"缺少內容長度","缺少参数":"缺少參數","网络请求错误":"網路請求錯誤","美国":"美國","自定义属性":"自定義屬性","自定义服务器地址":"自定義服務器位址","自定义服务地址设置后只有设置了登录密码才能一直保存，否则下次登录时将自动清空。":"自定義服務位址設置後只有設置了登錄密碼才能一直保存，否則下次登錄時將自動清空。","获取":"獲取","获取Object的地址":"獲取Object的位址","获取地址":"獲取位址","警告":"警告","设置":"設置","设置HTTP头":"設置HTTP頭","设置HTTP头属性":"設置HTTP頭屬性","设置一个安全密码，下次打开客户端时只需要输入这个安全密码就能使用客户端":"設置一個安全密碼，下次打開用戶端時只需輸入這個安全密碼就能使用用戶端","设置成功":"設置成功","设置的值必须是正整数":"設置的值必須是正整數","详细":"詳細","语言设置":"語言設置","语言设置：":"語言設置：","请求超时":"請求逾時","请确认":"請確認","请确认安全密码":"請確認安全密碼","请输入 Access Key ID":"請輸入 Access Key ID","请输入 Access Key Secret":"請輸入 Access Key Secret","请输入Access Key 和Access Secret确认":"請輸入Access Key 和Access Secret確認","请输入加速卡号":"請輸入加速卡號","请输入大于0的整数":"請輸入大於0的整數","请输入安全密码":"請輸入安全密碼","请输入服务器地址":"請輸入服務器位址","请输入要授权的机器码":"請輸入要授權的機器碼","请输入要设置的refer":"請輸入要設置的refer","请输入链接的有效期：":"請輸入鏈接的有效期：","请选择区域":"請選擇區域","读写权限：":"讀寫權限：","购买":"購買","跳过设置":"跳過設置","输入您设置的安全密码即可快速登录管理器":"輸入您設置的安全密碼即可快速登錄管理器","返&nbsp;&nbsp;&nbsp;&nbsp;回":"返&nbsp;&nbsp;&nbsp;&nbsp;回","返回":"返回","返回到 {{path}}":"返回到 {{path}}","还未创建Bucket":"還未建立Bucket","进&nbsp;&nbsp;&nbsp;&nbsp;入":"進&nbsp;&nbsp;&nbsp;&nbsp;入","选择区域":"選擇區域","选择文件并导入":"選擇文件並匯入","选择语言":"選擇語言","重连次数:":"重連次數","错误":"錯誤","错误日志":"錯誤日誌","错误：":"錯誤：","限制数字范围：":"限制數字範圍：","青岛":"青島","预处理错误":"預處理錯誤","香港":"香港","（可能是你登录时选择的区域与当前的网络环境不匹配，请退出客户端后重新选择）":"（可能是你登錄時選擇的區域與目前的網路環境不匹配，请退出用戶端後重新選擇）"})}]);