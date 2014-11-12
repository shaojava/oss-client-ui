"use strict";!function(window){function isOSSClient(){var sync=navigator.userAgent.split(";")[0]||"";return"gk_sync"==sync.toLowerCase()}function getCanonicalizedOssHeaders(headers){var tmp_headers={},canonicalized_oss_headers="";for(var k in headers)0===k.toLowerCase().indexOf("x-oss-",0)&&(tmp_headers[k.toLowerCase()]=headers[k]);if(tmp_headers!={}){var x_header_list=[];for(var k in tmp_headers)x_header_list.push(k);x_header_list.sort();for(var k in x_header_list)canonicalized_oss_headers+=x_header_list[k]+":"+tmp_headers[x_header_list[k]]+"\n"}return canonicalized_oss_headers}var accessId="fmVEoAkpUByBS1cs",accessSecret="HWsJ79uEwsrh7PB6ASGpyrdZkwJWdR",OSSClient={getAccessID:function(){return JSON.stringify(accessId)},getSignature:function(param){var parseParam=JSON.parse(param),arr=[parseParam.verb,parseParam.content_md5,parseParam.content_type,parseParam.expires],canonicalizedOSSheaders="";parseParam.canonicalized_oss_headers&&(canonicalizedOSSheaders=getCanonicalizedOssHeaders(parseParam.canonicalized_oss_headers));var canonicalizedResource=parseParam.canonicalized_resource;return JSON.stringify(CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(arr.join("\n")+"\n"+canonicalizedOSSheaders+canonicalizedResource,accessSecret)))},changeHost:function(region){region=JSON.parse(region);var host=[region,region?".":"","aliyuncs.com"].join("");return JSON.stringify(host)},changeUpload:function(){},changeDownload:function(){},getUpload:function(){return JSON.stringify({download:0,upload:0,count:1,list:[{bucket:"121212121212",object:"PhpStorm-8.0.dmg",fullpath:"C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",offset:1e8,filesize:137181104,status:5,speed:1e4,errormsg:""},{bucket:"121212121212",object:"PhpStorm-8.0.dmg",fullpath:"C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",offset:0,filesize:137181104,status:5,speed:0,errormsg:""}]})},getDownload:function(){},configInfo:function(){JSON.stringify({source:"",disable_location_select:0,host:"aliyuncs.com",locations:[{location:"oss-cn-guizhou-a",name:"互联网",enable:0},{location:"oss-cn-gzzwy-a",name:"政务外网",enable:0},{location:"oss-cn-hangzhou-a",name:"杭州",enable:1},{location:"oss-cn-qingdao-a",name:"青岛",enable:1},{location:"oss-cn-beijing-a",name:"北京",enable:1},{location:"oss-cn-hongkong-a",name:"香港",enable:1},{location:"oss-cn-shenzhen-a",name:"深圳",enable:1}]});return JSON.stringify({source:"guizhou",disable_location_select:1,host:"aliyuncs.com",locations:[{location:"oss-cn-guizhou-a",name:"互联网",enable:1},{location:"oss-cn-gzzwy-a",name:"政务外网",enable:1},{location:"oss-cn-hangzhou-a",name:"杭州",enable:0},{location:"oss-cn-qingdao-a",name:"青岛",enable:0},{location:"oss-cn-beijing-a",name:"北京",enable:0},{location:"oss-cn-hongkong-a",name:"香港",enable:0},{location:"oss-cn-shenzhen-a",name:"深圳",enable:0}]})},getCurrentLocation:function(){return JSON.stringify("oss-cn-guizhou-a")}};isOSSClient()||(window.OSSClient=OSSClient)}(window),window.debug=!0;var debugInterfaces=[],OSS={invoke:function(name,param,callback,log){var _self=this;if("undefined"==typeof OSSClient)throw new Error("Can not find OSSClient");if("function"!=typeof OSSClient[name]&&debugInterfaces.indexOf(name)<0)throw new Error("Can not find interface "+name);var args=[];param&&args.push(JSON.stringify(param)),"function"==typeof callback&&args.push(function(re){log!==!1&&_self.log(name+":callback",re),re=re?"object"==typeof re?re:JSON.parse(re):"",callback(re)});var re="";return log!==!1&&this.log(name,args),args.length?1==args.length?re=OSSClient[name](args[0]):2==args.length&&(re=OSSClient[name](args[0],args[1])):re=debugInterfaces.indexOf(name)>=0?this[name]():OSSClient[name](),log!==!1&&this.log(name+":return",re),re=re?JSON.parse(re):""},log:function(name,info){window.debug&&console.log("%c"+name,"color:blue",info)},getUserAgent:function(){return navigator.userAgent.split(";")},getClientOS:function(){var os=this.getUserAgent()[2]||"";return os.toLowerCase()},isWindowsClient:function(){return"windows"==this.getClientOS()},isMacClient:function(){return"mac"==this.getClientOS()},isClientOS:function(){return this.isWindowsClient()||this.isMacClient()},isOSSClient:function(){var sync=this.getUserAgent()[0]||"";return"gk_sync"==sync.toLowerCase()}};angular.module("OSSCommon",["ui.select"]).config(["uiSelectConfig",function(uiSelectConfig){uiSelectConfig.theme="bootstrap"}]).factory("OSSDialog",[function(){var defaultParam={type:"normal",resize:0,width:490,height:420};return{exportAuthorization:function(){var UIPath=OSS.invoke("getUIPath");OSS.invoke("showWnd",angular.extend({},defaultParam,{url:UIPath+"/export-authorization.html"}))},customServerHost:function(){var UIPath=OSS.invoke("getUIPath");OSS.invoke("showWnd",angular.extend({},defaultParam,{url:UIPath+"/custom-domain.html"}))},setting:function(){var UIPath=OSS.invoke("getUIPath");OSS.invoke("showWnd",angular.extend({},defaultParam,{url:UIPath+"/setting.html"}))}}}]).factory("OSSConfig",[function(){var config=OSS.invoke("configInfo");return config||(config={source:"",disable_location_select:0,host:"aliyuncs.com",locations:[{location:"oss-cn-guizhou-a",name:"互联网",enable:0},{location:"oss-cn-gzzwy-a-internal",name:"政务外网",enable:0},{location:"oss-cn-hangzhou",name:"杭州",enable:1},{location:"oss-cn-qingdao",name:"青岛",enable:1},{location:"oss-cn-beijing",name:"北京",enable:1},{location:"oss-cn-hongkong",name:"香港",enable:1},{location:"oss-cn-shenzhen",name:"深圳",enable:1}]}),{isCustomClient:function(){return""!=config.source},isGuiZhouClient:function(){return"guizhou"==config.source},isDisableLocationSelect:function(){return 1==config.disable_location_select},getLocations:function(){return config.locations||[]},getHost:function(){return config.host}}}]).factory("OSSRegion",["OSSConfig",function(OSSConfig){var locations=OSSConfig.getLocations(),currentLocation=OSS.invoke("getCurrentLocation");return{list:function(){return _.where(locations,{enable:1})},getRegionByLocation:function(location){return _.find(locations,function(item){return 0===location.indexOf(item.location.replace("-internal",""))})},changeLocation:function(location){return location.indexOf("-internal")>0?location:currentLocation&&location+"-internal"==currentLocation?location+"-internal":location}}}]).factory("OSSException",["OSSConfig",function(OSSConfig){var erroList={AccessDenied:"拒绝访问",BucketAlreadyExists:"Bucket已经存在",BucketNotEmpty:"Bucket不为空",EntityTooLarge:"实体过大",EntityTooSmall:"实体过小",FileGroupTooLarge:"文件组过大",FilePartNotExist:"文件Part不存在",FilePartStale:"文件Part过时",InvalidArgument:"参数格式错误",InvalidAccessKeyId:"Access Key ID不存在",InvalidBucketName:"无效的Bucket名字",InvalidDigest:"无效的摘要",InvalidObjectName:"无效的Object名字",InvalidPart:"无效的Part",InvalidPartOrder:"无效的part顺序",InvalidTargetBucketForLogging:"Logging操作中有无效的目标bucket",InternalError:"OSS内部发生错误",MalformedXML:"XML格式非法",MethodNotAllowed:"不支持的方法",MissingArgument:"缺少参数",MissingContentLength:"缺少内容长度",NoSuchBucket:"Bucket不存在",NoSuchKey:"文件不存在",NoSuchUpload:"Multipart Upload ID不存在",NotImplemented:"无法处理的方法",PreconditionFailed:"预处理错误",RequestTimeTooSkewed:"发起请求的时间和服务器时间超出15分钟",RequestTimeout:"请求超时",SignatureDoesNotMatch:"签名错误",TooManyBuckets:"Bucket数目超过限制"};return{getError:function(res,status){console.log("getError",arguments);var error={status:status,code:"",msg:""};if(res){var resError=res.Error;angular.extend(error,{code:resError.Code||"",msg:resError.Message||""});var message=resError.Message;erroList[resError.Code]&&(message=erroList[resError.Code]),angular.extend(error,{msg:message})}else{var msg="网络请求超时";OSSConfig.isGuiZhouClient()&&(msg+='<p class="text-muted">（可能是你登录时选择的区域与当前的网络环境不匹配，请退出客户端后重新选择）</p>'),angular.extend(error,{msg:msg})}return error},getClientErrorMsg:function(res){return res.message}}}]).factory("Clipboard",function(){var maxLen=1,container=[];return{clear:function(){container=[]},len:function(){return container.length},get:function(){var item=container.shift();return OSS.log("Clipboard.get",item),item},add:function(data){container.push(data),container.length>maxLen&&container.shift(),OSS.log("Clipboard.add",data)}}}).filter("baseName",function(){return Util.String.baseName}).filter("isDir",function(){return function(path){var lastStr=Util.String.lastChar(path);return"/"===lastStr||"\\"===lastStr?1:0}}).directive("scrollLoad",["$rootScope","$parse",function($rootScope,$parse){return{restrict:"A",link:function($scope,$element,attrs){var triggerDistance=0,disableScroll=!1;null!=attrs.triggerDistance&&$scope.$watch(attrs.triggerDistance,function(value){return triggerDistance=parseInt(value||0,10)}),null!=attrs.disableScroll&&$scope.$watch(attrs.disableScroll,function(value){return disableScroll=!!value});var direction="down";attrs.triggerDirection&&(direction=attrs.triggerDirection);var startScrollTop=0,fn=$parse(attrs.scrollLoad);$element.on("scroll.scrollLoad",function(event){var _self=jQuery(this),realDistance=0,scrollH=0,scrollT=0,isScrollDown=!1;scrollH=jQuery.isWindow(this)?document.body.scrollHeight:$element[0].scrollHeight,scrollT=_self.scrollTop(),isScrollDown=scrollT>startScrollTop;var clientHeight=jQuery.isWindow(this)?document.documentElement.clientHeight||document.body.clientHeight:this.clientHeight;realDistance="down"==direction?scrollH-scrollT-clientHeight:scrollT,triggerDistance>=realDistance&&!disableScroll&&(!isScrollDown&&"up"==direction||isScrollDown&&"down"==direction)&&$scope.$apply(function(){fn($scope,{$event:event})}),startScrollTop=scrollT}),$scope.$on("$destroy",function(){$element.off("scroll.scrollLoad")})}}}]).directive("scrollToItem",["$timeout",function($timeout){return{restrict:"A",link:function(scope,element,attrs){attrs.$observe("scrollToItem",function(newVal){$timeout(function(){var index=newVal;if(!(0>index)){var $fileItem=element.find(attrs.itemSelector+":eq("+index+")");if($fileItem.size()){var top=$fileItem.position().top,grep=top+$fileItem.height()-element.height();0>top?element.scrollTop(element.scrollTop()+top):grep>0&&element.scrollTop(element.scrollTop()+grep)}}})})}}}]).directive("onDrop",["$parse",function($parse){return function(scope,element,attrs){var fn=$parse(attrs.onDrop);element.on("drop",function(event){scope.$apply(function(){fn(scope,{$event:event})})})}}]).directive("preventDragDrop",[function(){return{restrict:"A",link:function($scope,$element){$element.on("dragstart",function(event){var jTarget=jQuery(event.target);jTarget.attr("draggable")||jTarget.parents("[draggable]").size()||event.preventDefault()}),$element.on("dragover",function(event){event.preventDefault()}),$element.on("dragenter",function(event){event.preventDefault()}),$element.on("drop",function(event){event.preventDefault()})}}}]).directive("autoSelect",[function(){return{restrict:"A",link:function(scope,element,attrs){var isAutoSelect=!1;attrs.$observe("autoSelect",function(isAuto){isAutoSelect=isAuto}),element.on("click.autoSelect",function(){isAutoSelect&&element.select()})}}}]).directive("locationSelect",["OSSRegion",function(OSSRegion){return{restrict:"E",replace:!0,scope:{selectLocation:"=",disableSelect:"=",name:"@",placeHolder:"@",searchDisabled:"="},templateUrl:"views/location-select.html",link:function(scope){scope.locations=OSSRegion.list(),scope.$watch("locations.selected",function(val){scope.selectLocation=val}),scope.placeHolder||(scope.locations.selected=scope.locations[0])}}}]),angular.module("CustomDomain",["ngCookies","ngResource","ngRoute","ngSanitize","ngTouch","ui.bootstrap","angularSpinner","OSSCommon"]).controller("MainCtrl",["$scope","OSSException",function($scope,OSSException){$scope.customDomain=function(host){return host&&host.length?void OSS.invoke("setServerLocation",{location:host},function(res){alert(res.error?OSSException.getClientErrorMsg(res):"设置成功")}):void alert("请输入服务器地址")},$scope.cancel=function(){OSS.invoke("closeWnd")}}]);