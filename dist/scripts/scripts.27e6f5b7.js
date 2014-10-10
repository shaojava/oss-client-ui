"use strict";!function(window){function isOSSClient(){var sync=navigator.userAgent.split(";")[0]||"";return"gk_sync"==sync.toLowerCase()}function getCanonicalizedOssHeaders(headers){var tmp_headers={},canonicalized_oss_headers="";for(var k in headers)0===k.toLowerCase().indexOf("x-oss-",0)&&(tmp_headers[k.toLowerCase()]=headers[k]);if(tmp_headers!={}){var x_header_list=[];for(var k in tmp_headers)x_header_list.push(k);x_header_list.sort();for(var k in x_header_list)canonicalized_oss_headers+=x_header_list[k]+":"+tmp_headers[x_header_list[k]]+"\n"}return canonicalized_oss_headers}var accessId="fmVEoAkpUByBS1cs",accessSecret="HWsJ79uEwsrh7PB6ASGpyrdZkwJWdR",OSSClient={getAccessID:function(){return JSON.stringify(accessId)},getSignature:function(param){var parseParam=JSON.parse(param),arr=[parseParam.verb,parseParam.content_md5,parseParam.content_type,parseParam.expires],canonicalizedOSSheaders="";parseParam.canonicalized_oss_headers&&(canonicalizedOSSheaders=getCanonicalizedOssHeaders(parseParam.canonicalized_oss_headers));var canonicalizedResource=parseParam.canonicalized_resource;return JSON.stringify(CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(arr.join("\n")+"\n"+canonicalizedOSSheaders+canonicalizedResource,accessSecret)))},getUpload:function(){return JSON.stringify({download:0,upload:0,count:1,list:[{bucket:"121212121212",object:"PhpStorm-8.0.dmg",fullpath:"C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",offset:1e8,filesize:137181104,status:5,speed:1e4,errormsg:""},{bucket:"121212121212",object:"PhpStorm-8.0.dmg",fullpath:"C:\\Users\\george\\Desktop\\PhpStorm-8.0.dmg",offset:0,filesize:137181104,status:5,speed:0,errormsg:""}]})},getDownload:function(){}};isOSSClient()||(window.OSSClient=OSSClient)}(window),window.debug=!0;var OSS={invoke:function(name,param,callback,log){if(log!==!1&&this.log(name,arguments),"undefined"==typeof OSSClient)throw new Error("Can not find OSSClient");if("function"!=typeof OSSClient[name])throw new Error("Can not find interface "+name);var args=[JSON.stringify(param)];"function"==typeof callback&&args.push(function(re){re=re?JSON.parse(re):"",log!==!1&&this.log(name+":callback",re),callback(re)});var re=OSSClient[name].apply(this,args);return log!==!1&&this.log(name+":return",re),re=re?JSON.parse(re):""},log:function(name,info){window.debug&&console.log("%c"+name,"color:blue",info)},getUserAgent:function(){return navigator.userAgent.split(";")},getClientOS:function(){var os=this.getUserAgent()[2]||"";return os.toLowerCase()},isWindowsClient:function(){return"windows"==this.getClientOS()},isMacClient:function(){return"mac"==this.getClientOS()},isClientOS:function(){return this.isWindowsClient()||this.isMacClient()},isOSSClient:function(){var sync=this.getUserAgent()[0]||"";return"gk_sync"==sync.toLowerCase()}};angular.module("OSSCommon",[]).factory("Clipboard",function(){var maxLen=1,container=[];return{clear:function(){container=[]},len:function(){return container.length},get:function(){var item=container.shift();return OSS.log("Clipboard.get",item),item},add:function(data){container.push(data),container.length>maxLen&&container.shift(),OSS.log("Clipboard.add",data)}}}).directive("scrollLoad",["$rootScope","$parse",function($rootScope,$parse){return{restrict:"A",link:function($scope,$element,attrs){var triggerDistance=0,disableScroll=!1;null!=attrs.triggerDistance&&$scope.$watch(attrs.triggerDistance,function(value){return triggerDistance=parseInt(value||0,10)}),null!=attrs.disableScroll&&$scope.$watch(attrs.disableScroll,function(value){return disableScroll=!!value});var direction="down";attrs.triggerDirection&&(direction=attrs.triggerDirection);var startScrollTop=0,fn=$parse(attrs.scrollLoad);$element.on("scroll.scrollLoad",function(event){var _self=jQuery(this),realDistance=0,scrollH=0,scrollT=0,isScrollDown=!1;scrollH=jQuery.isWindow(this)?document.body.scrollHeight:$element[0].scrollHeight,scrollT=_self.scrollTop(),isScrollDown=scrollT>startScrollTop;var clientHeight=jQuery.isWindow(this)?document.documentElement.clientHeight||document.body.clientHeight:this.clientHeight;realDistance="down"==direction?scrollH-scrollT-clientHeight:scrollT,triggerDistance>=realDistance&&!disableScroll&&(!isScrollDown&&"up"==direction||isScrollDown&&"down"==direction)&&$scope.$apply(function(){fn($scope,{$event:event})}),startScrollTop=scrollT}),$scope.$on("$destroy",function(){$element.off("scroll.scrollLoad")})}}}]),angular.module("ossClientUiApp",["ngAnimate","ngCookies","ngResource","ngRoute","ngSanitize","ngTouch","ui.bootstrap","angularSpinner","OSSCommon"]).config(["$routeProvider","$httpProvider",function($routeProvider,$httpProvider){$routeProvider.when("/:bucket?/file/?:object*?",{templateUrl:"views/filelist.html",controller:"FileListCtrl",resolve:{buckets:function(Bucket){return Bucket.list()}}}).when("/:bucket/upload/?",{templateUrl:"views/uploadlist.html",controller:"UploadListCtrl",resolve:{buckets:function(Bucket){return Bucket.list()}}}).otherwise({redirectTo:"/"}),$httpProvider.defaults.transformResponse.unshift(function(response,header){return"application/xml"==header("content-type")?$.xml2json(response):response})}]),angular.module("ossClientUiApp").controller("MainCtrl",["$scope","OSSApi","OSSModal","Bucket","Bread","OSSLocationHistory","$rootScope","$filter",function($scope,OSSApi,OSSModal,Bucket,Bread,OSSLocationHistory){$scope.buckets=[],Bucket.list().then(function(buckets){$scope.buckets=angular.isArray(buckets)?buckets:[buckets]}),$scope.showAddBucketModal=function(){OSSModal.addBucket().result.then(function(param){"add"==param.act&&$scope.buckets.push(param.bucket)})},$scope.editBucket=function(bucket){OSSModal.addBucket(bucket).result.then(function(param){"del"==param.act&&Util.Array.removeByValue($scope.buckets,param.bucket)})},$scope.breads=[],$scope.backward=function(){OSSLocationHistory.backward()},$scope.forward=function(){OSSLocationHistory.forward()},$scope.$on("$routeChangeSuccess",function(event,current,prev){if(prev&&prev.params){var oldBucket=Bucket.getBucket(prev.params.bucket);oldBucket&&Bucket.unselected(oldBucket)}if(current&&current.params){var pathArr=current.$$route.originalPath.split("/"),currentBucket=Bucket.getBucket(current.params.bucket);currentBucket&&Bucket.select(currentBucket),$scope.breads=Bread.getBreads(currentBucket.Name,current.params.object,pathArr[2]),$scope.historyCanForward=OSSLocationHistory.canForward(),$scope.historyCanBackward=OSSLocationHistory.canBackward()}})}]).controller("TransQueueCtrl",["$scope","$interval","OSSQueueMenu","OSSUploadQueue","OSSDownloadQueue",function($scope,$interval,OSSQueueMenu,OSSUploadQueue,OSSDownloadQueue){$scope.uploadSpeed=0,$scope.downloadSpeed=0,$scope.uploadCount=0,$scope.downloadCount=0,$scope.selectedUploadItems=[],$scope.selectedDownloadItems=[],$scope.uploadQueueMenus=OSSQueueMenu.getUploadMenu(),$scope.downloadQueueMenus=OSSQueueMenu.getDownloadMenu(),$scope.onUploadItemSelect=function($event,item){item.selected?item.selected=!1:(_.each(_.where($scope.uploadList,{selected:!0}),function(item){item.selected=!1}),item.selected=!0),$scope.selectedUploadItems=_.where($scope.uploadList,{selected:!0})},$scope.onDownloadItemSelect=function($event,item){item.selected?item.selected=!1:(_.each(_.where($scope.downloadList,{selected:!0}),function(item){item.selected=!1}),item.selected=!0),$scope.selectedDownloadItems=_.where($scope.downloadList,{selected:!0})},$scope.$on("removeQueue",function(event,type,items){OSS.log("removeQueue",arguments),"upload"===type?angular.forEach(items,function(item){OSSUploadQueue.remove(item)}):angular.forEach(items,function(item){OSSDownloadQueue.remove(item)})}),$scope.uploadList=OSSUploadQueue.init(),OSSUploadQueue.refresh(),$scope.downloadList=OSSDownloadQueue.init(),OSSDownloadQueue.refresh()}]).controller("FileListCtrl",["$scope","$routeParams","OSSApi","buckets","$rootScope","OSSObject","OSSMenu","Bucket",function($scope,$routeParams,OSSApi,buckets,$rootScope,OSSObject,OSSMenu,Bucket){var bucketName=$routeParams.bucket?$routeParams.bucket:buckets&&buckets.length?buckets[0].Name:"",keyword=$routeParams.keyword||"",prefix="",delimiter="/",isSearch=!1,loadFileCount=20,lastLoadMaker="",isAllFileLoaded=!1;$scope.bucket=Bucket.getBucket(bucketName),$scope.objectPrefix=$routeParams.object?$routeParams.object:"",OSSObject.setCurrentObject({path:$scope.objectPrefix,dir:1}),keyword.length?(prefix=keyword,isSearch=!0):(prefix=$scope.objectPrefix,isSearch=!1),$scope.files=[];var loadFile=function(){$scope.loadingFile||($scope.loadingFile=!0,OSSObject.list($scope.bucket,prefix,delimiter,lastLoadMaker,loadFileCount).then(function(res){$scope.loadingFile=!1,$scope.files=$scope.files.concat(res.files),lastLoadMaker=res.marker,isAllFileLoaded=res.allLoaded},function(){$scope.loadingFile=!1}))};loadFile(),$scope.openFile=function(file,isDir){OSSObject.open($scope.bucket,file.path,isDir)},$scope.loadMoreFile=function(){isAllFileLoaded||loadFile()},$scope.selectedFiles=[],$scope.handleClick=function(file){var index=$scope.selectedFiles.indexOf(file);index>=0?$scope.selectedFiles.splice(index,1):($scope.selectedFiles=[],$scope.selectedFiles.push(file))},$scope.topMenuList=OSSMenu.getAllMenu(),$scope.contextMenu=[]}]).controller("UploadListCtrl",["$scope","$routeParams","OSSUploadPart","Bucket","OSSUploadMenu",function($scope,$routeParams,OSSUploadPart,Bucket,OSSUploadMenu){$scope.loading=!1;var isAllLoaded=!1,lastKeyMaker="",lastUploadMaker="",loadCount=100,bucketName=$routeParams.bucket,loadUploads=function(){$scope.loading||($scope.loading=!0,OSSUploadPart.list(Bucket.getBucket(bucketName),"","",lastKeyMaker,loadCount,lastUploadMaker).then(function(res){console.log("res",res),$scope.loading=!1,$scope.uploads=$scope.uploads.concat(res.uploads),lastKeyMaker=res.keyMaker,lastUploadMaker=res.uploadIdMaker,isAllLoaded=res.allLoaded},function(){$scope.loadingFile=!1}))};$scope.uploads=[],$scope.loadMoreUpload=function(){isAllLoaded||loadUploads()},$scope.selectedUploads=[],loadUploads(),$scope.handleClick=function(upload){upload.selected=!upload.selected},$scope.topMenuList=OSSUploadMenu.getAllMenu(),$scope.$watch("uploads",function(){$scope.selectedUploads=_.where($scope.uploads,{selected:!0})},!0),$scope.$on("removeUpload",function(event,uploads){angular.isArray(uploads)||(uploads=[uploads]),angular.forEach(uploads,function(upload){var index=_.indexOf($scope.uploads,upload);index>=0&&$scope.uploads.splice(index,1)})})}]),angular.module("ossClientUiApp").factory("OSSQueueItem",function(){return{isUploading:function(item){return 1==item.status},isWaiting:function(item){return 2==item.status},isPause:function(item){return 3==item.status},isDone:function(item){return 4==item.status},isError:function(item){return 5==item.status}}}).factory("OSSUploadQueue",function($interval){return{items:[],uploadCount:0,uploadSpeed:0,downloadSpeed:0,init:function(){var res=OSS.invoke("getUpload");return this.items=res.list,this.uploadCount=res.count,this.uploadSpeed=res.upload,this.downloadSpeed=res.download,this.items},add:function(item){this.items.push(item)},get:function(bucket,object){return _.findWhere(this.items,{bucket:bucket,object:object})},remove:function(item){var index=_.indexOf(this.items,item);index>-1&&this.items.splice(index,1)},update:function(item,param){angular.extend(item,param)},refresh:function(){var _self=this;$interval(function(){var res=OSS.invoke("getUpload",void 0,void 0,!1);angular.forEach(res.list,function(val){var existItem=_self.get(val.bucket,val.object);existItem?_self.update(existItem,val):_self.add(val)}),_self.uploadCount=res.count,_self.uploadSpeed=res.upload,_self.downloadSpeed=res.download},1e3)}}}).factory("OSSDownloadQueue",function($interval){return{items:[],uploadCount:0,uploadSpeed:0,downloadSpeed:0,init:function(){var res=OSS.invoke("getDownload");return this.items=res.list,this.uploadCount=res.count,this.uploadSpeed=res.upload,this.downloadSpeed=res.download,this.items},add:function(item){this.items.push(item)},get:function(fullpath){return _.findWhere(this.items,{fullpath:fullpath})},remove:function(item){var index=_.indexOf(this.items,item);index>-1&&this.items.splice(index,1)},update:function(item,param){angular.extend(item,param)},refresh:function(){var _self=this;$interval(function(){var res=OSS.invoke("getDownload",void 0,void 0,!1);angular.forEach(res.list,function(val){var existItem=_self.get(val.fullpath);existItem?_self.update(existItem,val):_self.add(val)}),_self.uploadCount=res.count,_self.uploadSpeed=res.upload,_self.downloadSpeed=res.download},1e3)}}}).factory("OSSQueueMenu",["$rootScope","OSSQueueItem",function($rootScope,OSSQueueItem){var checkArgValid=function(selectedItems){return angular.isArray(selectedItems)&&selectedItems.length?!0:!1},prepareUpladParam=function(selectedItems){var param={all:0,list:[]};return angular.forEach(selectedItems,function(item){param.list.push({bucket:item.bucket,object:item.object})}),param},prepareDownloadParam=function(selectedItems){var param={all:0,list:[]};return angular.forEach(selectedItems,function(item){param.list.push({fullpath:item.fullpath})}),param},uploadMenu=[{name:"start",text:"开始",execute:function(selectedItems){checkArgValid(selectedItems)&&OSS.invoke("startUpload",prepareUpladParam(selectedItems))},getState:function(selectedItems){var len=selectedItems.length;if(!len)return-1;for(var hasUnValidItem=!1,i=0;i<selectedItems.length;i++){var item=selectedItems[i];OSSQueueItem.isPause(item)||(hasUnValidItem=!0)}return hasUnValidItem?-1:1}},{name:"pause",text:"暂停",execute:function(selectedItems){checkArgValid(selectedItems)&&OSS.invoke("stopUpload",prepareUpladParam(selectedItems))},getState:function(selectedItems){var len=selectedItems.length;if(!len)return 0;for(var hasUnValidItem=!1,i=0;i<selectedItems.length;i++){var item=selectedItems[i];(OSSQueueItem.isPause(item)||OSSQueueItem.isError(item)||OSSQueueItem.isDone(item))&&(hasUnValidItem=!0)}return hasUnValidItem?0:1}},{name:"remove",text:"取消",execute:function(selectedItems){checkArgValid(selectedItems)&&(OSS.invoke("deleteUpload",prepareUpladParam(selectedItems)),$rootScope.$broadcast("removeQueue","upload",selectedItems))},getState:function(selectedItems){var len=selectedItems.length;return len?1:0}}],downloadMenu=[{name:"start",text:"开始",execute:function(selectedItems){checkArgValid(selectedItems)&&OSS.invoke("startDownload",prepareDownloadParam(selectedItems))},getState:function(selectedItems){var len=selectedItems.length;if(!len)return-1;for(var hasUnValidItem=!1,i=0;i<selectedItems.length;i++){var item=selectedItems[i];OSSQueueItem.isPause(item)||(hasUnValidItem=!0)}return hasUnValidItem?-1:1}},{name:"pause",text:"暂停",execute:function(selectedItems){checkArgValid(selectedItems)&&OSS.invoke("stopDownload",prepareDownloadParam(selectedItems))},getState:function(selectedItems){var len=selectedItems.length;if(!len)return 0;for(var hasUnValidItem=!1,i=0;i<selectedItems.length;i++){var item=selectedItems[i];(OSSQueueItem.isPause(item)||OSSQueueItem.isError(item)||OSSQueueItem.isDone(item))&&(hasUnValidItem=!0)}return hasUnValidItem?0:1}},{name:"remove",text:"取消",execute:function(selectedItems){checkArgValid(selectedItems)&&(OSS.invoke("deleteDownload",prepareDownloadParam(selectedItems)),$rootScope.$broadcast("removeQueue","download",selectedItems))},getState:function(selectedItems){var len=selectedItems.length;return len?1:0}}];return{getUploadMenu:function(){return uploadMenu},getDownloadMenu:function(){return downloadMenu}}}]).factory("OSSMenu",["Clipboard","OSSModal",function(Clipboard,OSSModal){var allMenu=[{name:"upload",text:"上传",getState:function(){return 1},execute:function(bucket,currentObject){OSS.invoke("selectFileDlg",{path:"",disable_root:1},function(res){res&&res.list&&res.list.length&&OSS.invoke("addFile",{location:bucket.Location,bucket:bucket.Name,prefix:currentObject,list:res.list},function(){})})}},{name:"create",text:"新建文件夹",getState:function(){return 1},execute:function(){}},{name:"download",text:"下载",getState:function(selectedFiles){var len=selectedFiles.length;return len?1:0},execute:function(bucket,currentObject,selectedFiles){var list=_.map(selectedFiles,function(val){return{location:bucket.Location,bucket:bucket.Name,object:val.path,filesize:val.size}});OSS.invoke("saveFile",{list:list},function(){})}},{name:"copy",text:"复制",getState:function(selectedFiles){var len=selectedFiles.length;return len?1:0},execute:function(bucket,currentObject,selectedFiles){var data=JSON.stringify({ac:"copy",bucket:bucket,objects:selectedFiles});Clipboard.add(data)}},{name:"paste",text:"粘贴",getState:function(){return Clipboard.len()?1:-1},execute:function(bucket,currentObject,selectedFiles){var clipData=Clipboard.get();if(clipData&&(clipData=JSON.parse(clipData),"copy"==clipData.ac)){var targetBucket=clipData.bucket,list=clipData.objects.map(function(object){return{object:object.path,filesize:object.filesize}});OSS.invoke("copyObject",{dstbucket:bucket.Name,dstobject:1==selectedFiles.length&&selectedFiles[0].dir?selectedFiles[0].path:currentObject,dstlocation:bucket.Location,bucket:targetBucket.Name,location:targetBucket.Location,list:list},function(){})}}},{name:"del",text:"删除",getState:function(selectedFiles){var len=selectedFiles.length;return len?1:0},execute:function(bucket,currentObject,selectedFiles){var list=_.map(selectedFiles,function(object){return{object:object.path}});OSS.invoke("deleteObject",{bucket:bucket.Name,location:bucket.Location,list:list},function(){})}},{name:"get_uri",text:"获取地址",getState:function(selectedFiles){var len=selectedFiles.length;return!len||len>1?0:selectedFiles[0].dir?0:1},execute:function(bucket,currentObject,selectedFiles){OSSModal.getObjectURI(bucket,selectedFiles[0])}},{name:"set_header",text:"设置HTTP头",getState:function(selectedFiles){var len=selectedFiles.length;return!len||len>1?0:selectedFiles[0].dir?0:1},execute:function(bucket,currentObject,selectedFiles){OSSModal.setObjectHttpHeader(bucket,selectedFiles[0])}}];return{getAllMenu:function(){return allMenu}}}]).factory("OSSUploadMenu",["Bucket","OSSApi","$rootScope","OSSModal",function(Bucket,OSSApi,$rootScope,OSSModal){var allMenu=[{name:"remove",text:"删除",getState:function(selectedUploads){var len=selectedUploads.length;return len?1:0},execute:function(selectedUploads){angular.forEach(selectedUploads,function(upload){OSSApi.deleteUpload(Bucket.getCurrentBucket(),upload).success(function(){$rootScope.$broadcast("removeUpload",upload)}).error(function(){})})}},{name:"detail",text:"详细",getState:function(selectedUploads){var len=selectedUploads.length;return!len||len>1?0:1},execute:function(selectedUploads){OSSModal.uploadDetail(Bucket.getCurrentBucket(),selectedUploads[0])}}];return{getAllMenu:function(){return allMenu}}}]).factory("OSSLocationHistory",["$location","$rootScope",function($location,$rootScope){var current,update=!0,history=[],maxLen=100;return $rootScope.$on("$locationChangeSuccess",function(){var url=$location.url(),l=history.length;update&&(current>=0&&l>current+1&&history.splice(current+1),history[history.length-1]!=url&&(history.push(url),history.length>maxLen&&history.splice(0,1)),current=history.length-1),update=!0}),{reset:function(){history=[],current=0,update=!0},go:function(isForward){(isForward&&this.canForward()||!isForward&&this.canBackward())&&(update=!1,$location.url(history[isForward?++current:--current]))},forward:function(){this.go(!0)},backward:function(){this.go()},canForward:function(){return current<history.length-1},canBackward:function(){return current>0}}}]).factory("OSSObject",["$location","$filter","OSSApi","$q",function($location,$filter,OSSApi,$q){var fileSorts={SORT_SPEC:["doc","docx","xls","xlsx","ppt","pptx","pdf","ai","cdr","psd","dmg","iso","md","ipa","apk","gknote"],SORT_MOVIE:["mp4","mkv","rm","rmvb","avi","3gp","flv","wmv","asf","mpeg","mpg","mov","ts","m4v"],SORT_MUSIC:["mp3","wma","wav","flac","ape","ogg","aac","m4a"],SORT_IMAGE:["jpg","png","jpeg","gif","psd","bmp","ai","cdr"],SORT_DOCUMENT:["doc","docx","xls","xlsx","ppt","pptx","pdf","odt","rtf","ods","csv","odp","txt","gknote"],SORT_CODE:["js","c","cpp","h","cs","vb","vbs","java","sql","ruby","php","asp","aspx","html","htm","py","jsp","pl","rb","m","css","go","xml","erl","lua","md"],SORT_ZIP:["rar","zip","7z","cab","tar","gz","iso"],SORT_EXE:["exe","bat","com"]},currentObject={};return{getCurrentObject:function(){return currentObject},setCurrentObject:function(object){currentObject=object},list:function(bucket,prefix,delimiter,lastLoadMaker,loadFileCount){var _self=this,defer=$q.defer();return OSSApi.getObjects(bucket,prefix,delimiter,lastLoadMaker,loadFileCount).success(function(res){OSS.log("list:res",res);var contents=res.ListBucketResult.Contents;contents=contents?angular.isArray(contents)?contents:[contents]:[];var commonPrefixes=res.ListBucketResult.CommonPrefixes;commonPrefixes=commonPrefixes?angular.isArray(commonPrefixes)?commonPrefixes:[commonPrefixes]:[];var files=[];angular.forEach($.merge(contents,commonPrefixes),function(file){file.Key!==prefix&&file.Prefix!==prefix&&files.push(_self.format(file))}),defer.resolve({files:files,marker:res.ListBucketResult.NextMarker,allLoaded:"false"===res.ListBucketResult.IsTruncated})}).error(function(){}),defer.promise},format:function(object){var path=object.Key||object.Prefix,isDir="/"===Util.String.lastChar(path)?1:0,filename=isDir?$filter("getPrefixName")(path,1):$filter("baseName")(path);return{path:path,dir:isDir,filename:filename,lastModified:object.LastModified||"",size:object.Size?parseInt(object.Size):0}},open:function(bucket,path,isDir){isDir&&$location.path("/"+bucket.Name+"/file/"+path)},getIconSuffix:function(dir,filename){var suffix="",sorts=fileSorts;if(1==dir)suffix="folder";else{var ext=Util.String.getExt(filename);suffix=jQuery.inArray(ext,sorts.SORT_SPEC)>-1?ext:jQuery.inArray(ext,sorts.SORT_MOVIE)>-1?"video":jQuery.inArray(ext,sorts.SORT_MUSIC)>-1?"music":jQuery.inArray(ext,sorts.SORT_IMAGE)>-1?"image":jQuery.inArray(ext,sorts.SORT_DOCUMENT)>-1?"document":jQuery.inArray(ext,sorts.SORT_ZIP)>-1?"compress":jQuery.inArray(ext,sorts.SORT_EXE)>-1?"execute":"other"}return suffix},getIcon:function(dir,name){return"icon-"+this.getIconSuffix(dir,name)},getURI:function(bucket,objectPath){return"http://"+bucket.Name+bucket.Location+"aliyuncs.com/"+objectPath}}}]).factory("OSSLocation",function(){return{getUrl:function(bucketName,prefix,filter){var url="";return filter=angular.isUndefined(filter)?"file":filter,prefix=angular.isUndefined(prefix)?"":prefix,url+="/"+bucketName,filter&&(url+="/"+filter),prefix&&(url+="/"+prefix),url}}}).factory("Bread",["OSSLocation",function(OSSLocation){var getFilterName=function(filter){var filterName="";switch(filter){case"upload":filterName="碎片管理"}return filterName};return{getBreads:function(bucketName,path,filter){var breads=[{name:bucketName,url:OSSLocation.getUrl(bucketName)}];if("file"!=filter&&breads.push({name:getFilterName(filter),url:OSSLocation.getUrl(bucketName,"",filter)}),path&&path.length){path=Util.String.rtrim(Util.String.ltrim(path,"/"),"/");for(var paths=path.split("/"),i=0;i<paths.length;i++){for(var bread={name:paths[i]},fullpath="",j=0;i>=j;j++)fullpath+=paths[j]+"/";bread.url=OSSLocation.getUrl(bucketName,fullpath),breads.push(bread)}}return breads}}}]).factory("RequestXML",function(){return{getXMLHeader:function(){return'<?xml version="1.0" encoding="UTF-8"?>'},getCreateBucketXML:function(region){return[this.getXMLHeader(),"<CreateBucketConfiguration >","<LocationConstraint >",region,"</LocationConstraint >","</CreateBucketConfiguration >"].join("")}}}).factory("Bucket",["OSSApi","$q",function(OSSApi,$q){var listPromise,buckets=null,deferred=$q.defer();return{list:function(){return listPromise?listPromise:(OSSApi.getBuckets().success(function(res){var resBuckets=res.ListAllMyBucketsResult.Buckets.Bucket;buckets=angular.isArray(resBuckets)?resBuckets:[resBuckets],deferred.resolve(buckets)}).error(function(){deferred.reject()}),listPromise=deferred.promise)},getRegions:function(){return{"oss-cn-hangzhou-a":"杭州","oss-cn-qingdao-a":"青岛","oss-cn-beijing-a":"北京","oss-cn-hongkong-a":"香港","oss-cn-shenzhen-a":"深圳"}},getAcls:function(){return{"public-read-write":"公共读写","public-read":"公共读","private":"私有"}},getBucket:function(buckeName){return _.findWhere(buckets,{Name:buckeName})},select:function(bucket){bucket.selected=!0},unselected:function(bucket){bucket.selected=!1},getCurrentBucket:function(){return _.findWhere(buckets,{selected:!0})}}}]).factory("OSSApi",["$http","RequestXML",function($http,RequestXML){var OSSAccessKeyId=OSS.invoke("getAccessID"),getExpires=function(expires){return expires=angular.isUndefined(expires)?60:expires,parseInt((new Date).getTime()/1e3)+expires},getRequestUrl=function(bucket,region,expires,signature,canonicalizedResource,extraParam){var host="http://"+(bucket?bucket+".":"")+(region?region+".":"")+"aliyuncs.com";canonicalizedResource=canonicalizedResource.replace(new RegExp("^/"+bucket),"");var requestUrl=host+canonicalizedResource;return requestUrl+=(requestUrl.indexOf("?")>=0?"&":"?")+$.param({OSSAccessKeyId:OSSAccessKeyId,Expires:expires,Signature:signature}),requestUrl+=extraParam?"&"+$.param(extraParam):""},getCanonicalizedResource=function(bucketName,objectName,subResources){var subResourcesStr=subResources?Util.param(subResources):"";return"/"+(bucketName?bucketName+"/":"")+(objectName?objectName:"")+(subResourcesStr?"?"+subResourcesStr:"")};return{getBuckets:function(){var expires=getExpires(),canonicalizedResource=getCanonicalizedResource(),signature=OSS.invoke("getSignature",{verb:"GET",expires:expires,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl("oss","",expires,signature,canonicalizedResource);return $http.get(requestUrl)},createBucket:function(bucketName,region,acl){var expires=getExpires(),canonicalizedOSSheaders={"x-oss-acl":acl},canonicalizedResource=getCanonicalizedResource(bucketName),contentType="application/xml",signature=OSS.invoke("getSignature",{verb:"PUT",content_type:contentType,expires:expires,canonicalized_oss_headers:canonicalizedOSSheaders,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl(bucketName,region,expires,signature,canonicalizedResource),headers=angular.extend({},canonicalizedOSSheaders,{"Content-Type":contentType});return $http.put(requestUrl,RequestXML.getCreateBucketXML(region),{headers:headers})},getBucketAcl:function(bucket){var expires=getExpires(),canonicalizedResource=getCanonicalizedResource(bucket.Name,"",{acl:""}),signature=OSS.invoke("getSignature",{verb:"GET",expires:expires,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl(bucket.Name,bucket.Location,expires,signature,canonicalizedResource);return $http.get(requestUrl)},editBucket:function(bucket,acl){var expires=getExpires(),canonicalizedOSSheaders={"x-oss-acl":acl},canonicalizedResource=getCanonicalizedResource(bucket.Name,""),contentType="application/xml",signature=OSS.invoke("getSignature",{verb:"PUT",content_type:contentType,expires:expires,canonicalized_oss_headers:canonicalizedOSSheaders,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl(bucket.Name,bucket.Location,expires,signature,canonicalizedResource),headers=angular.extend({},canonicalizedOSSheaders,{"Content-Type":contentType});return $http.put(requestUrl,"",{headers:headers})},delBucket:function(bucket){var expires=getExpires(),canonicalizedResource=getCanonicalizedResource(bucket.Name,""),signature=OSS.invoke("getSignature",{verb:"DELETE",expires:expires,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl(bucket.Name,bucket.Location,expires,signature,canonicalizedResource);return $http.delete(requestUrl)},getObjects:function(bucket,prefix,delimiter,marker,maxKeys){var param={prefix:prefix};$.extend(param,{delimiter:delimiter,marker:marker,"max-keys":maxKeys});var expires=getExpires(),canonicalizedResource=getCanonicalizedResource(bucket.Name,""),signature=OSS.invoke("getSignature",{verb:"GET",expires:expires,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl(bucket.Name,bucket.Location,expires,signature,canonicalizedResource,param);return $http.get(requestUrl)},getObjectMeta:function(bucket,object){var expires=getExpires(),canonicalizedResource=getCanonicalizedResource(bucket.Name,object),signature=OSS.invoke("getSignature",{verb:"HEAD",expires:expires,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl(bucket.Name,bucket.Location,expires,signature,canonicalizedResource);return $http.head(requestUrl)},putObject:function(bucket,objectPath,headers,canonicalizedOSSheaders){var expires=getExpires(),canonicalizedResource=getCanonicalizedResource(bucket.Name,objectPath),signature=OSS.invoke("getSignature",{verb:"PUT",content_type:headers["Content-Type"],expires:expires,canonicalized_oss_headers:canonicalizedOSSheaders,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl(bucket.Name,bucket.Location,expires,signature,canonicalizedResource);return $http.put(requestUrl,"",{headers:angular.extend({},headers,canonicalizedOSSheaders)})},listUploads:function(bucket,prefix,delimiter,keyMarker,maxUploads,uploadIdMaker){var param={prefix:prefix};$.extend(param,{delimiter:delimiter,"key-marker":keyMarker,"upload-id-marker":uploadIdMaker,"max-uploads":maxUploads});var expires=getExpires(),canonicalizedResource=getCanonicalizedResource(bucket.Name,"",{uploads:void 0}),signature=OSS.invoke("getSignature",{verb:"GET",expires:expires,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl(bucket.Name,bucket.Location,expires,signature,canonicalizedResource,param);return $http.get(requestUrl)},deleteUpload:function(bucket,upload){var expires=getExpires(),canonicalizedResource=getCanonicalizedResource(bucket.Name,upload.path,{uploadId:upload.id}),signature=OSS.invoke("getSignature",{verb:"DELETE",expires:expires,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl(bucket.Name,bucket.Location,expires,signature,canonicalizedResource);return $http.delete(requestUrl)},listUploadPart:function(bucket,upload,partNumberMaker,maxParts){var param={"part-number-marker":partNumberMaker,"max-parts":maxParts},expires=getExpires(),canonicalizedResource=getCanonicalizedResource(bucket.Name,upload.path,{uploadId:upload.id}),signature=OSS.invoke("getSignature",{verb:"GET",expires:expires,canonicalized_resource:canonicalizedResource}),requestUrl=getRequestUrl(bucket.Name,bucket.Location,expires,signature,canonicalizedResource,param);return $http.get(requestUrl)}}}]).factory("OSSUploadPart",["OSSApi","$filter","$q",function(OSSApi,$filter,$q){return{list:function(bucket,prefix,delimiter,lastKeyMaker,loadFileCount,lastUploadMaker){var _self=this,defer=$q.defer();return OSSApi.listUploads(bucket,prefix,delimiter,lastKeyMaker,loadFileCount,lastUploadMaker).success(function(res){OSS.log("listUploads:res",res);var result=res.ListMultipartUploadsResult,contents=result.Upload;contents=contents?angular.isArray(contents)?contents:[contents]:[];var commonPrefixes=result.CommonPrefixes;commonPrefixes=commonPrefixes?angular.isArray(commonPrefixes)?commonPrefixes:[commonPrefixes]:[];var files=[];angular.forEach($.merge(contents,commonPrefixes),function(file){file.Key!==prefix&&file.Prefix!==prefix&&files.push(_self.format(file))}),defer.resolve({uploads:files,keyMaker:result.NextKeyMarker,uploadIdMaker:result.NextUploadIdMarker,allLoaded:"false"===result.IsTruncated})}).error(function(){}),defer.promise},format:function(upload){var path=upload.Key||upload.Prefix,isDir="/"===Util.String.lastChar(path)?1:0,filename=isDir?$filter("getPrefixName")(path,1):$filter("baseName")(path);return{path:path,dir:isDir,filename:filename,id:upload.UploadId,initTime:upload.Initiated}}}}]).factory("OSSModal",["$modal","Bucket","OSSApi","OSSObject",function($modal,Bucket,OSSApi,OSSObject){var defaultOption={backdrop:"static"};return{addBucket:function(bucket){var option={templateUrl:"views/add_bucket_modal.html",windowClass:"add_bucket_modal",controller:function($scope,$modalInstance){$scope.loading=!1,$scope.bucket=bucket;
var acls=[],regions=[];angular.forEach(Bucket.getAcls(),function(val,key){acls.push({name:val,value:key})}),$scope.acls=acls,bucket||($scope.acl=$scope.acls[0]),angular.forEach(Bucket.getRegions(),function(val,key){regions.push({name:val,value:key})}),$scope.regions=regions,$scope.region=bucket?Util.Array.getObjectByKeyValue($scope.regions,"value",bucket.Location):$scope.regions[0],$scope.bucket?($scope.loading=!0,OSSApi.getBucketAcl(bucket).success(function(res){$scope.loading=!1,$scope.acl=Util.Array.getObjectByKeyValue($scope.acls,"value",res.AccessControlPolicy.AccessControlList.Grant)})):$scope.loading=!0,$scope.cancel=function(){$modalInstance.dismiss("cancel")},$scope.createBucket=function(bucketName,region,acl){OSSApi.createBucket(bucketName,region.value,acl.value).success(function(){$modalInstance.close({act:"add",bucket:{Name:bucketName,Location:region.value,Acl:acl.value}})})},$scope.editBucket=function(acl){OSSApi.editBucket(bucket,acl.value).success(function(){angular.extend(bucket,{Acl:acl.value}),$modalInstance.close({act:"edit",bucket:bucket})})},$scope.delBucket=function(){OSSApi.delBucket(bucket).success(function(){$modalInstance.close({act:"del",bucket:bucket})})}}};return option=angular.extend({},defaultOption,option),$modal.open(option)},setObjectHttpHeader:function(bucket,object){var option={templateUrl:"views/set_http_header_modal.html",windowClass:"set_http_header_modal",controller:function($scope,$modalInstance){$scope.object=object,$scope.headers=[],angular.forEach("Content-Type Content-Disposition Content-Language Cache-Control Expires".split(" "),function(val){$scope.headers.push({name:val,text:val})}),$scope.customHeaders=[{nameModel:"",contentModel:""}],OSSApi.getObjectMeta(bucket,object.path).success(function(data,status,getHeader){console.log("getHeader",getHeader()),angular.forEach($scope.headers,function(header){header.model=getHeader(header.name)}),angular.forEach(getHeader(),function(val,key){0===key.indexOf("x-oss-meta-")&&$scope.customHeaders.push({nameModel:key.replace(/^x-oss-meta-/,""),contentModel:val})})}).error(function(){}),$scope.setHttpHeader=function(headers,customHeaders){var ossHeaders={},canonicalizedOSSheaders={};angular.forEach(headers,function(val){val.model&&(ossHeaders[val.name]=val.model)}),angular.forEach(customHeaders,function(val){val.nameModel&&(canonicalizedOSSheaders["x-oss-meta-"+val.nameModel.toLowerCase()]=val.contentModel||"")}),OSSApi.putObject(bucket,object.path,ossHeaders,canonicalizedOSSheaders).success(function(){$modalInstance.close()})},$scope.addCustomHeader=function(){$scope.customHeaders.push({nameModel:"",contentModel:""})},$scope.removeCustomHeader=function(header){var index=_.indexOf($scope.customHeaders,header);console.log("index",index),index>-1&&$scope.customHeaders.splice(index,1)},$scope.cancel=function(){$modalInstance.dismiss("cancel")}}};return option=angular.extend({},defaultOption,option),$modal.open(option)},getObjectURI:function(bucket,object){var option={templateUrl:"views/get_object_uri_modal.html",windowClass:"get_object_uri_modal",controller:function($scope,$modalInstance){$scope.filename=Util.String.baseName(object.path),$scope.uri=OSSObject.getURI(bucket,object.path),$scope.cancel=function(){$modalInstance.dismiss("cancel")}}};return option=angular.extend({},defaultOption,option),$modal.open(option)},uploadDetail:function(bucket,upload){var option={templateUrl:"views/upload_detail_modal.html",windowClass:"upload_detail_modal",controller:function($scope,$modalInstance){$scope.loading=!1,$scope.parts=[];var size=50,lastMaker="",allLoaded=!1,loadPart=function(){$scope.loading||($scope.loading=!0,OSSApi.listUploadPart(bucket,upload,lastMaker,size).success(function(res){$scope.loading=!1;var result=res.ListPartsResult;lastMaker=result.NextPartNumberMarker,allLoaded="false"===result.IsTruncated;var parts=angular.isArray(result.Part)?result.Part:[result.Part];$scope.parts=$scope.parts.concat(parts)}).error(function(){$scope.loading=!1}))};loadPart(),$scope.loadMore=function(){console.log(124),allLoaded||loadPart()},$scope.cancel=function(){$modalInstance.dismiss("cancel")}}};return option=angular.extend({},defaultOption,option),$modal.open(option)}}}]),angular.module("ossClientUiApp").filter("bitSize",function(){return Util.Number.bitSize}).filter("formatTime",["$filter",function($filter){return function(dateStr){return $filter("date")(Date.parse(dateStr),"yyyy-MM-dd HH:mm:ss")}}]).filter("getPrefixName",function(){return function(prefix,removeLastSlash){removeLastSlash=angular.isUndefined(removeLastSlash)?0:removeLastSlash;var arr=prefix.split("/");return arr[arr.length-2]+(removeLastSlash?"":"/")}}).filter("getRemainTime",function($filter){return function(speed,filesize,offset){if(!speed)return"--:--:--";var time=(filesize-offset)/speed*1e3;return time?$filter("date")(time,"00:mm:ss"):"--:--:--"}}).filter("getQueueState",function($filter){return function(type,status,speed,filesize,offset,errormsg){var state="";switch(status){case 1:state=$filter("getRemainTime")(speed,filesize,offset);break;case 2:state="等待"+("upload"==type?"上传":"下载");break;case 3:state="暂停";break;case 4:state="完成";break;case 5:state="错误："+errormsg}return state}}).filter("baseName",function(){return Util.String.baseName}),angular.module("ossClientUiApp").directive("smartSearch",["$location","$rootScope","$filter","OSSObject","Bucket",function($location,$rootScope,$filter,OSSObject,Bucket){return{restrict:"A",require:"ngModel",link:function(scope,element,attrs,ngModel){var bread=element.parent().next();element.on("keydown",function(e){var keyword=e.keyCode;13==keyword&&scope.$apply(function(){$location.search({keyword:ngModel.$modelValue,scope:""})})});var $breadList=bread.find(".bread-list"),$searchWrapper=element.parent(),showSearch=function(){if(!element.next(".search-scope").size()){var currentObj=OSSObject.getCurrentObject(),currentBucket=Bucket.getCurrentBucket(),searchScopeName=currentObj.path?$filter("getPrefixName")(currentObj.path,1):currentBucket.Name,$removeIcon=$('<a href="javascript:;" class="fa fa-remove fa-lg"></a>'),$searchScope=$('<div class="search-scope"> 在 <span>'+searchScopeName+"</span> 中搜索</div>");element.next(".fa").hide(),element.after($searchScope).after($removeIcon),element.css({"padding-left":$searchScope.outerWidth(!0)+6}),$breadList.hide(),$removeIcon.on("click",function(){hideSearch()}),element.focus()}},hideSearch=function(){$searchWrapper.find(".search-scope").remove(),$searchWrapper.find(".fa-remove").remove(),$breadList.show(),element.next(".fa").show()};element.on("mousedown",function(){showSearch()}),element.next(".fa").on("click",function(){showSearch()})}}}]).directive("queueItem",[function(){return{templateUrl:"views/queue-item.html",restrict:"E",replace:!0,scope:{type:"@",item:"=data",onSelect:"&"},link:function(scope){scope.clickItem=function($event){scope.onSelect({$event:$event})}}}}]).directive("menu",[function(){return{template:'<button class="btn btn-default" ng-class="menu-{{name}}" ng-disabled="state==0" ng-show="state>-1" ng-transclude></button>',restrict:"E",replace:!0,transclude:!0,scope:{text:"@",name:"@",state:"=",shortcut:"@",execute:"&"},link:function(scope,element){element.click(function(event){console.log("event",event),scope.execute({$event:event})})}}}]).directive("fileIcon",["OSSObject",function(OSSObject){return{template:'<i class="file-icon-{{size}} {{icon}}"></i>',restrict:"E",replace:!0,scope:{dir:"@",filename:"@",size:"@"},link:function(scope){scope.icon=OSSObject.getIcon(scope.dir,scope.filename)}}}]);