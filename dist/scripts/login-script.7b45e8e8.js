"use strict";!function(window){function isOSSClient(){var sync=navigator.userAgent.split(";")[0]||"";return"oss"==sync.toLowerCase()}function getCanonicalizedOssHeaders(headers){var tmp_headers={},canonicalized_oss_headers="";for(var k in headers)0===k.toLowerCase().indexOf("x-oss-",0)&&(tmp_headers[k.toLowerCase()]=headers[k]);if(tmp_headers!={}){var x_header_list=[];for(var k in tmp_headers)x_header_list.push(k);x_header_list.sort();for(var k in x_header_list)canonicalized_oss_headers+=x_header_list[k]+":"+tmp_headers[x_header_list[k]]+"\n"}return canonicalized_oss_headers}var accessId="",accessSecret="",OSSClient={getAccessID:function(){return JSON.stringify(accessId)},getSignature:function(param){var parseParam=JSON.parse(param),arr=[parseParam.verb,parseParam.content_md5,parseParam.content_type,parseParam.expires],canonicalizedOSSheaders="";parseParam.canonicalized_oss_headers&&(canonicalizedOSSheaders=getCanonicalizedOssHeaders(parseParam.canonicalized_oss_headers));var canonicalizedResource=parseParam.canonicalized_resource;return JSON.stringify(CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(arr.join("\n")+"\n"+canonicalizedOSSheaders+canonicalizedResource,accessSecret)))},changeHost:function(region){region=JSON.parse(region);var host=[region,region?".":"","aliyuncs.com"].join("");return JSON.stringify(host)},changeUpload:function(){},changeDownload:function(){},getUpload:function(){return JSON.stringify({download:0,upload:0,count:1,list:[{bucket:"121212121212",object:"PhpStorm-8.0.dmg",fullpath:"C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",offset:1e8,filesize:137181104,status:5,speed:1e4,errormsg:""},{bucket:"121212121212",object:"PhpStorm-8.0.dmg",fullpath:"C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",offset:0,filesize:137181104,status:5,speed:0,errormsg:""}]})},getDownload:function(){},configInfo:function(){JSON.stringify({source:"",disable_location_select:0,host:"aliyuncs.com",locations:[{location:"oss-cn-guizhou-a",name:"互联网",enable:0},{location:"oss-cn-gzzwy-a",name:"政务外网",enable:0},{location:"oss-cn-hangzhou-a",name:"杭州",enable:1},{location:"oss-cn-qingdao-a",name:"青岛",enable:1},{location:"oss-cn-beijing-a",name:"北京",enable:1},{location:"oss-cn-hongkong-a",name:"香港",enable:1},{location:"oss-cn-shenzhen-a",name:"深圳",enable:1}]});return JSON.stringify({source:"guizhou",disable_location_select:1,host:"aliyuncs.com",locations:[{location:"oss-cn-guizhou-a",name:"互联网",enable:1},{location:"oss-cn-gzzwy-a",name:"政务外网",enable:1},{location:"oss-cn-hangzhou-a",name:"杭州",enable:0},{location:"oss-cn-qingdao-a",name:"青岛",enable:0},{location:"oss-cn-beijing-a",name:"北京",enable:0},{location:"oss-cn-hongkong-a",name:"香港",enable:0},{location:"oss-cn-shenzhen-a",name:"深圳",enable:0}]})},getCurrentLocation:function(){return JSON.stringify("oss-cn-guizhou-a")}};isOSSClient()||(window.OSSClient=OSSClient)}(window),window.debug=!1;var debugInterfaces=[],OSS={invoke:function(name,param,callback,log){var _self=this;if("undefined"==typeof OSSClient)throw new Error("Can not find OSSClient");if("function"!=typeof OSSClient[name]&&debugInterfaces.indexOf(name)<0)throw new Error("Can not find interface "+name);var args=[];param&&args.push(JSON.stringify(param)),"function"==typeof callback&&args.push(function(re){log!==!1&&_self.log(name+":callback",re),re=re?"object"==typeof re?re:JSON.parse(re):"",callback(re)});var re="";return log!==!1&&this.log(name,args),args.length?1==args.length?re=OSSClient[name](args[0]):2==args.length&&(re=OSSClient[name](args[0],args[1])):re=debugInterfaces.indexOf(name)>=0?this[name]():OSSClient[name](),log!==!1&&this.log(name+":return",re),re=re?JSON.parse(re):""},log:function(name,info){window.debug&&console.log("%c"+name,"color:blue",info)},getUserAgent:function(){return navigator.userAgent.split(";")},getClientOS:function(){var os=this.getUserAgent()[2]||"";return os.toLowerCase()},isWindowsClient:function(){return"windows"==this.getClientOS()},isMacClient:function(){return"mac"==this.getClientOS()},isClientOS:function(){return this.isWindowsClient()||this.isMacClient()},isOSSClient:function(){var sync=this.getUserAgent()[0]||"";return"gk_sync"==sync.toLowerCase()}};angular.module("OSSCommon",["ui.select"]).config(["uiSelectConfig",function(uiSelectConfig){uiSelectConfig.theme="bootstrap"}]).factory("OSSDialog",[function(){var defaultParam={type:"normal",resize:0,width:490,height:420};return{exportAuthorization:function(){var UIPath=OSS.invoke("getUIPath");OSS.invoke("showWnd",angular.extend({},defaultParam,{url:UIPath+"/export-authorization.html"}))},customServerHost:function(){var UIPath=OSS.invoke("getUIPath");OSS.invoke("showWnd",angular.extend({},defaultParam,{url:UIPath+"/custom-domain.html"}))},setting:function(){var UIPath=OSS.invoke("getUIPath");OSS.invoke("showWnd",angular.extend({},defaultParam,{url:UIPath+"/setting.html"}))}}}]).factory("OSSConfig",[function(){var config=OSS.invoke("configInfo");return config||(config={source:"",disable_location_select:0,host:"aliyuncs.com",showrefer:!0,showchannel:!0,locations:[{location:"oss-cn-guizhou-a",name:"互联网",enable:0,network:"internet"},{location:"oss-cn-guizhou-a-internal",name:"政务外网",enable:0,network:"internet"},{location:"oss-cn-gzzwy-a-internal",name:"政务外网",enable:0,network:"intranet"},{location:"oss-cn-hangzhou",name:"杭州",enable:1},{location:"oss-cn-qingdao",name:"青岛",enable:1},{location:"oss-cn-beijing",name:"北京",enable:1},{location:"oss-cn-hongkong",name:"香港",enable:1},{location:"oss-cn-shenzhen",name:"深圳",enable:1}]}),{isCustomClient:function(){return""!=config.source},isGuiZhouClient:function(){return"guizhou"==config.source},showRefer:function(){return!!config.showrefer},showChannel:function(){return!!config.showchannel},isDisableLocationSelect:function(){return 1==config.disable_location_select},getLocations:function(){return config.locations||[]},getHost:function(){return config.host}}}]).factory("OSSRegion",["OSSConfig",function(OSSConfig){var locations=OSSConfig.getLocations(),currentLocation=OSS.invoke("getCurrentLocation");return{list:function(_netType){var params={enable:1};return _netType&&(params.network=_netType),_.where(locations,params)},getEnableRegionByLocation:function(location){var enableLocations=this.list();return _.find(enableLocations,function(item){return 0===location.indexOf(item.location)||0===location.indexOf(item.location.replace("-a-internal",""))||0===location.indexOf(item.location.replace("-a",""))||0===location.indexOf(item.location.replace("-internal",""))})},getRegionByLocation:function(location){return _.find(locations,function(item){return 0===location.indexOf(item.location.replace("-internal",""))})},changeLocation:function(location){return location.indexOf("-internal")>0?location:currentLocation&&location+"-a"==currentLocation?location+"-a":currentLocation&&location+"-internal"==currentLocation?location+"-internal":currentLocation&&location+"-a-internal"==currentLocation?location+"-a-internal":location}}}]).factory("OSSException",["OSSConfig",function(OSSConfig){var erroList={getClientMessage:function(resError){if("AccessDenied"==resError.Code&&"Request has expired."==resError.Message){var serverTime=new Date(resError.ServerTime).getTime(),clientTime=new Date(resError.Expires).getTime(),expiresTime=parseInt(Math.abs(clientTime-serverTime)/1e3),d=parseInt(parseInt(expiresTime)/3600/24),h=parseInt(parseInt(expiresTime)/3600%24),m=parseInt(parseInt(expiresTime)/60%60),s=parseInt(parseInt(expiresTime)%60),str="操作失败，当前客户端时间比服务器时间";if(clientTime-serverTime>0)str+="快";else{if(!(0>clientTime-serverTime))return;str+="慢"}return d>0&&(str+=d+"天"),h>0&&(str+=h+"小时"),m>0&&(str+=m+"分钟"),s>0&&(str+=s+"秒"),str}return erroList[resError.Code]?erroList[resError.Code]:resError.Message},AccessDenied:"拒绝访问",BucketAlreadyExists:"Bucket已经存在",BucketNotEmpty:"Bucket不为空",EntityTooLarge:"实体过大",EntityTooSmall:"实体过小",FileGroupTooLarge:"文件组过大",FilePartNotExist:"文件Part不存在",FilePartStale:"文件Part过时",InvalidArgument:"参数格式错误",InvalidAccessKeyId:"Access Key ID不存在",InvalidBucketName:"无效的Bucket名字",InvalidDigest:"无效的摘要",InvalidObjectName:"无效的Object名字",InvalidPart:"无效的Part",InvalidPartOrder:"无效的part顺序",InvalidTargetBucketForLogging:"Logging操作中有无效的目标bucket",InternalError:"OSS内部发生错误",MalformedXML:"XML格式非法",MethodNotAllowed:"不支持的方法",MissingArgument:"缺少参数",MissingContentLength:"缺少内容长度",NoSuchBucket:"Bucket不存在",NoSuchKey:"文件不存在",NoSuchUpload:"Multipart Upload ID不存在",NotImplemented:"无法处理的方法",PreconditionFailed:"预处理错误",RequestTimeTooSkewed:"发起请求的时间和服务器时间超出15分钟",RequestTimeout:"请求超时",SignatureDoesNotMatch:"签名错误",TooManyBuckets:"Bucket数目超过限制"};return{getError:function(res,status){var error={status:status,code:"",msg:""};if(res){var resError=res.Error;angular.extend(error,{code:resError.Code||"",msg:resError.Message||""});var message=erroList.getClientMessage(resError);angular.extend(error,{msg:message})}else{var msg="";403==status?msg=erroList.AccessDenied:(msg="网络请求错误",OSSConfig.isGuiZhouClient()&&(msg+='<p class="text-muted">（可能是你登录时选择的区域与当前的网络环境不匹配，请退出客户端后重新选择）</p>')),angular.extend(error,{msg:msg})}return error},getClientErrorMsg:function(res){return res.message}}}]).factory("Clipboard",function(){var maxLen=1,container=[];return{clear:function(){container=[]},len:function(){return container.length},get:function(){var item=container.shift();return OSS.log("Clipboard.get",item),item},add:function(data){container.push(data),container.length>maxLen&&container.shift(),OSS.log("Clipboard.add",data)}}}).filter("baseName",function(){return Util.String.baseName}).filter("isDir",function(){return function(path){var lastStr=Util.String.lastChar(path);return"/"===lastStr||"\\"===lastStr?1:0}}).filter("getLocationName",["OSSRegion",function(OSSRegion){return function(location){if(!location)return"";var region=OSSRegion.getRegionByLocation(location);return region?region.name:""}}]).directive("ngRightClick",["$parse",function($parse){return function($scope,$element,$attrs){var fn=$parse($attrs.ngRightClick);$element.bind("contextmenu",function(event){$scope.$apply(function(){event.preventDefault(),fn($scope,{$event:event})})})}}]).directive("scrollLoad",["$rootScope","$parse",function($rootScope,$parse){return{restrict:"A",link:function($scope,$element,attrs){var triggerDistance=0,disableScroll=!1;null!=attrs.triggerDistance&&$scope.$watch(attrs.triggerDistance,function(value){return triggerDistance=parseInt(value||0,10)}),null!=attrs.disableScroll&&$scope.$watch(attrs.disableScroll,function(value){return disableScroll=!!value});var direction="down";attrs.triggerDirection&&(direction=attrs.triggerDirection);var startScrollTop=0,fn=$parse(attrs.scrollLoad);$element.on("scroll.scrollLoad",function(event){var _self=jQuery(this),realDistance=0,scrollH=0,scrollT=0,isScrollDown=!1;scrollH=jQuery.isWindow(this)?document.body.scrollHeight:$element[0].scrollHeight,scrollT=_self.scrollTop(),isScrollDown=scrollT>startScrollTop;var clientHeight=jQuery.isWindow(this)?document.documentElement.clientHeight||document.body.clientHeight:this.clientHeight;realDistance="down"==direction?scrollH-scrollT-clientHeight:scrollT,triggerDistance>=realDistance&&!disableScroll&&(!isScrollDown&&"up"==direction||isScrollDown&&"down"==direction)&&$scope.$apply(function(){fn($scope,{$event:event})}),startScrollTop=scrollT}),$scope.$on("$destroy",function(){$element.off("scroll.scrollLoad")})}}}]).directive("scrollToItem",["$timeout",function($timeout){return{restrict:"A",link:function(scope,element,attrs){attrs.$observe("scrollToItem",function(newVal){"undefiend"!=typeof newVal&&$timeout(function(){var index=newVal;if(!(0>index)){var $fileItem=element.find(attrs.itemSelector+":eq("+index+")");if($fileItem.size()){var top=$fileItem.position().top,grep=top+$fileItem.height()-element.height();0>top?element.scrollTop(element.scrollTop()+top):grep>0&&element.scrollTop(element.scrollTop()+grep)}}})})}}}]).directive("onDrop",["$parse",function($parse){return function(scope,element,attrs){var fn=$parse(attrs.onDrop);element.on("drop",function(event){scope.$apply(function(){fn(scope,{$event:event})})})}}]).directive("preventDragDrop",[function(){return{restrict:"A",link:function($scope,$element){$element.on("dragstart",function(event){var jTarget=jQuery(event.target);jTarget.attr("draggable")||jTarget.parents("[draggable]").size()||event.preventDefault()}),$element.on("dragover",function(event){event.preventDefault()}),$element.on("dragenter",function(event){event.preventDefault()}),$element.on("drop",function(event){event.preventDefault()})}}}]).directive("autoSelect",[function(){return{restrict:"A",link:function(scope,element,attrs){var isAutoSelect=!1;attrs.$observe("autoSelect",function(isAuto){isAutoSelect=isAuto}),element.on("click.autoSelect",function(){isAutoSelect&&element.select()})}}}]).directive("locationSelect",["OSSRegion","OSSConfig",function(OSSRegion){return{restrict:"E",replace:!0,scope:{selectLocation:"=",loginNetworktype:"=",disableSelect:"=",name:"@",placeHolder:"@",searchDisabled:"=",defaultLocation:"@"},templateUrl:"views/location-select.html",link:function(scope){scope.locations=OSSRegion.list(),scope.$watch("locations.selected",function(val){scope.selectLocation=val}),scope.placeHolder||(scope.locations.selected=scope.locations[0]),scope.$watch("loginNetworktype",function(newVal){newVal&&(scope.locations=OSSRegion.list(newVal),scope.placeHolder||(scope.locations.selected=scope.locations[0]))}),scope.$watch("defaultLocation",function(newVal){newVal&&(scope.locations.selected=_.find(scope.locations,function(region){return 0==region.location.indexOf(newVal)}))})}}}]);var ossClientCallback=function(name,param){console.log("客户端的回调[ossClientCallback]",arguments),"string"!=typeof name&&(name=String(name));var JSONparam,rootScope=jQuery(document).scope();param&&(JSONparam=JSON.parse(param)),rootScope&&rootScope.$broadcast(name,JSONparam)};ossClientCallback.getUpdateLoadingCount=function(){return"UpdateLoadingCount"},angular.module("OSSLogin",["ngCookies","ngResource","ngRoute","ngSanitize","ngTouch","ui.bootstrap","angularSpinner","OSSCommon","LocalStorageModule"]).config([function(){}]).controller("MainCtrl",["$scope","localStorageService","usSpinnerService","$http","OSSException","OSSRegion","OSSConfig","$timeout",function($scope,localStorageService,usSpinnerService,$http,OSSException,OSSRegion,OSSConfig,$timeout){$scope.isCustomClient=OSSConfig.isCustomClient();var loginToLanchpad=function(){OSS.invoke("showLaunchpad"),OSS.invoke("closeWnd")};$scope.step=location.hash?location.hash.replace(/^#/,""):"loginById",$scope.getSectionClass=function(sectionId){return{current:sectionId==$scope.step,"custom-client":$scope.isCustomClient}},$scope.deviceCode=OSS.invoke("getDeviceEncoding"),$scope.regionSelectTip="选择区域",$scope.login=function(accessKeyId,accessKeySecret,isCloudHost,location){if(!accessKeyId||!accessKeyId.length)return void alert("请输入 Access Key ID");if(!accessKeySecret||!accessKeySecret.length)return void alert("请输入 Access Key Secret");if(!$scope.isCustomClient&&isCloudHost){if(!location)return void alert("请选择区域");location+="-internal"}if($scope.isCustomClient||isCloudHost||(location=null),OSSConfig.isGuiZhouClient()&&!location)return void alert("请选择区域");var param={keyid:accessKeyId,keysecret:accessKeySecret};location&&angular.extend(param,{location:location}),$scope.loging=!0,OSS.invoke("loginByKey",param,function(res){$scope.loging=!1,$scope.$apply(function(){res.error?alert(OSSException.getClientErrorMsg(res)):$scope.step="setPassword"})})},$scope.setPassword=function(password,rePassword){return password&&password.length?password.length<6?void alert("密码长度最少6位"):rePassword&&rePassword.length?password!==rePassword?void alert("两次输入的密码不一致"):($scope.setting=!0,void OSS.invoke("setPassword",{password:password},function(res){$scope.$apply(function(){$scope.setting=!1,res.error?alert(OSSException.getClientErrorMsg(res)):loginToLanchpad()})})):void alert("请确认安全密码"):void alert("请输入安全密码")},$scope.skipSetPassword=function(){loginToLanchpad()},$scope.copy=function(deviceCode){OSS.invoke("setClipboardData",deviceCode),alert("复制成功")},$scope.import=function(isCloudHost,location){$scope.loging=!0,OSS.invoke("loginByFile",{ishost:isCloudHost?1:0,location:location},function(res){$timeout(function(){$scope.loging=!1,res.error?5!=res.error&&alert(OSSException.getClientErrorMsg(res)):$scope.step="setPassword"})})};var allowErrorCount=5,loginErrorCount=localStorageService.get("login-error-count")?parseInt(localStorageService.get("login-error-count")):0;$scope.loginByPassword=function(password){return password&&password.length?($scope.loging=!0,void OSS.invoke("loginPassword",{password:password},function(res){$scope.$apply(function(){$scope.loging=!1,res.error?(loginErrorCount++,localStorageService.set("login-error-count",loginErrorCount),loginErrorCount>allowErrorCount?(alert("你连续密码输入错误已超过"+allowErrorCount+"次,请重新使用Access Key ID 和 Access Key Secret登录"),OSS.invoke("clearPassword"),$scope.step="loginById"):alert(OSSException.getClientErrorMsg(res))):(loginErrorCount=0,localStorageService.set("login-error-count",loginErrorCount),loginToLanchpad())})})):void alert("请输入安全密码")},$scope.clearPassword=function(){confirm("确定要清除安全密码？")&&(OSS.invoke("clearPassword"),$scope.step="loginById")};var checkCurrentLocation=function(callback){var region=OSSRegion.getRegionByLocation("oss-cn-gzzwy-a"),host=OSSConfig.getHost(),requestUrl="http://"+region.location+"."+host;$http.get(requestUrl,{timeout:3e3}).error(function(req,status){req||status?($scope.netWorkType="intranet",callback("oss-cn-gzzwy-a")):($scope.netWorkType="internet",callback("oss-cn-guizhou-a"))})};$scope.checkingLocation=!1,$scope.predictionLocation="",$scope.netWorkType=null,OSSConfig.isGuiZhouClient()&&($scope.checkingLocation=!0,usSpinnerService.spin("checking-locaiton-spinner"),checkCurrentLocation(function(predictionLocation){$scope.checkingLocation=!1,usSpinnerService.stop("checking-locaiton-spinner"),$scope.defaultLocation=predictionLocation}))}]);