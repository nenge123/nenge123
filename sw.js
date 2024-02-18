"use strict";
const CACHE_NAME = 'NENGE-NET';
const version = Date.parse('2023 09/23 19:40');
const CACHE_LIST = [];
const CACHE_ORIGIN = location.origin;
const CACHE_SOURCE = {};
const ZIP_URL = "/assets/js/lib/zip.min.js?"+version;
const T = new class {
    async InitCache(request,url){
        await this.checkList('pwa_init');
        let regs = Object.keys(CACHE_SOURCE).sort();
        for(let reg of regs){
            if(url.indexOf(reg)===0) return this.SourceCache(request,reg);
        }
        if(CACHE_LIST.includes(url)){
            return this.LoaclCache(request);
        }
        return fetch(request);
    }
    async LoaclCache(request,url){
        if(!CACHE_LIST.length)await this.checkList();
        if(T.isLocal)return await fetch(request);
        let cache = await caches.open(CACHE_NAME);
        url = url?url:this.toLink(this.toPath(request));
        let response = await cache.match(url);
        /**
        * let savetime = cacheResult.headers.get('date');
        * savetime = savetime&&Date.parse(savetime);
        * savetime = savetime&&(Date.now() - savetime + 86400000)||0;
        * response.headers.get('last-modified');
        */
        if(!response){
            response = await fetch(request);
            cache.put(url,response.clone());
            CACHE_LIST.push(url);
        }
        return response||this.toStatus(404);
    }
    async CdnCache(request,NAME){
        let cache = await caches.open(CACHE_NAME+NAME);
        let response = await cache.match(request);
        if(!response){
            response = await fetch(request);
            cache.put(request,response.clone());
        }
        return response;
    }
    async SourceCache(request,reg){
        let cacheInfo = CACHE_SOURCE[reg];
        let url = this.toLink(this.toPath(request));
        let urls = url.split('/');
        const cache = await caches.open(CACHE_NAME+reg.split('/').splice(0,3).join('-').toUpperCase());
        let response = await cache.match(url);
        if(response) return response;
        let last = urls.pop();
        if(!last)last = 'index.html';
        if(cacheInfo.mode=='sql'){
            if(last.indexOf('.html')!==-1){
                return await this.LoaclCache('/template-sql-index.html');
            }
            return this.toStatus(404);
        }
        if(last=='' || /\.html$/.test(last)) return this.toLocation('/template-install-pwa.html?back='+encodeURIComponent(this.toPath(request)));
        return this.toStatus(404);
    }
    async unzip(data,source){
        let {result,password,clientID} = data;
        
        const ReaderList = await new zip.ZipReader(
            new zip.BlobReader(result instanceof Blob?result:new Blob([result]))
        ).getEntries().catch(e=>false);
        if(!ReaderList||!ReaderList.length) return false;
        let contents;
        if(!clientID)password = false;
        const getData = (entry)=>{
            let rawPassword;
            if(password){
                rawPassword = password instanceof Uint8Array?password:new TextEncoder().encode(password);
            }
            return entry.getData(new zip.Uint8ArrayWriter(), {rawPassword:entry.encrypted?rawPassword:undefined, onprogress: (current, total) =>clientID&&this.postMessage({clientID,current, total,filename:entry.filename,state:'progress'},source)}).catch(async e=>{
                let msg = e.message;
                if(password===false) return;
                if(msg == zip.ERR_INVALID_PASSWORD||msg==zip.ERR_ENCRYPTED){
                    password = await this.getMessage({clientID,state:'password',password,isUTF8:entry.filenameUTF8},source);
                    if(password){
                        return await getData(entry);
                    }else{
                        password = false;
                    }
                }
            });
        }
        if(ReaderList){
            for await(let entry of ReaderList){
                if(entry.directory)continue;
                let data = await getData(entry);
                if(data){
                    if(!contents)contents={};
                    contents[entry.filename] = data;
                }
            }
        }
        password = null;
        result = null;
        return contents||false;
    }
    async getMessage(ARG,source){
        const T = this;
        return new Promise(back=>{
            const workerId = T.getRandom();
            T.action[workerId] = function (data){
                if(data.workerId&&T.action[data.workerId]){
                    delete T.action[data.workerId];
                }
                back(data.result);
                data = null;
            };
            ARG.workerId = workerId;
            T.postMessage(ARG,source);
        });
    }
    getRandom(){
        return btoa(crypto&&crypto.randomUUID()||performance.now()+Math.random()).replace(/[^\w]/g,'');
    }
    async postMessage(str,source) {
        if(source instanceof Promise)source = await source;
        if(source&&source instanceof Client)return source.postMessage(str);
        let clients = await self.clients.matchAll();
        let p  = 0;
        if(clients.length){
            for(let client of clients){
                if(!client||!client.postMessage) break;
                p++;
                if(source){
                    client.postMessage(str);
                }else if(client.visibilityState=='visible'){
                    return client.postMessage(str);
                }
            }
            clients = null;
            str = null;
        }
        if(!p&&this.SW){
            this.SW.postMessage(str);
        }
    }
    async loadSource(){
        let response = await fetch('/source.json');
        if(response){
            Object.assign(CACHE_SOURCE,await response.json());
        }
    }
    async checkList(method){
        if(!CACHE_LIST.length){
            CACHE_LIST.push(this.toLink(ZIP_URL));
        }
        await this.loadSource();
        const cache = await caches.open(CACHE_NAME);
        const list = await cache.keys();
        list.forEach(v=>{
            let url = this.toPath(v);
            if(!CACHE_LIST.includes(url))CACHE_LIST.push(url);
        });
        if(method)this.postMethod(method,CACHE_LIST);
    }
    async postMethod(method,result,source) {
        return this.postMessage({ method,result},source||!0)
    }
    isLocal = /(127\.0\.0\.1|localhost)/.test(location.host);
    Client = undefined;
    toLocation(url){
        return this.toStatus(301,{location:url});
    }
    toStatus(status,headers,data){
        status = status||404;
        return new Response(data,{status,headers});
    }
    toPath(request){
        return (request.constructor===String?request:request.url).replace(CACHE_ORIGIN,'');
    }
    toLink(url){
        return url.split('?')[0];
    }
    mime = Object.fromEntries((
        [].concat(...(
            "text;css,scss,sass,xml,vml,style:css,htm:html|php,txt:plain,js:javascript\n" +
            "image;jpg,jpeg,png,gif,webp,avif,apng,heic,svg:svg+xml\n" +
            "font;woff,woff2,ttf,otf\n" +
            "application;pdf,json,js:javascript,*:octet-stream,zip:zip|x-zip-compressed,rar:rar|x-rar-compressed,7z:7z|x-7z-compressed,wasm\naudio;ogg,wma,mp3,m4a:mp4\nvideo;mp4,mp2t").split(/\n/).map(a => {
                a = a.split(/;/);
                return [].concat(...a[1].split(/,/).map(c => {
                    c = c.split(/:/);
                    let e = c[1]&&c[1].split('|')||[c[0]];
                    let arr=[];
                    for(let i=0;;i++){
                        if(!e[i])break;
                        let d = a[0] + '/' +e[i];
                        arr.push([c[0],d])
                    }
                    return arr;
                }))
            }))));
    toResponse(data,url,headers){
        if(data instanceof Response) return data;
        let type = data.type||url&this.mime[url.split('.').pop()]||this.mime['html'];
        let length = data.size||data.byteLength||0;
        headers = new Headers(headers);
        headers.set('content-length',length);
        headers.set('content-type',type);
        return this.toStatus(200,headers,data instanceof Blob?data:new Blob([data]));
        return new Response(data instanceof Blob?data:new Blob([data]),{headers});

    }
    get permission(){
        return Notification&&Notification.permission !='granted'||false;
    }
    showNotification(title,options){
        if(this.permission) return;
        return registration.showNotification(title,options);
    }
    async closeNotification(tag){
        if(this.permission) return;
        Array.from(await registration.getNotifications({tag}),notice=>notice.close());
    }
    action = {
        cache_check:async function(progress,source){
            let cache = await caches.open(CACHE_NAME);
            let size = 0;
            await Promise.all((await cache.keys()).map(async request=>{
                let modified = (await fetch(request.url+'?'+version,{method:'HEAD'})).headers.get('last-modified');
                let cachetime = (await cache.match(request)).headers.get('last-modified');
                if(modified!=cachetime){
                    size ++;
                    console.log(modified,cachetime,request.url);
                    await cache.put(request.url,(await fetch(request.url)).clone());
                }
                (progress instanceof Function)&&progress(request.url);
            }));
            if(!progress)return size;
            size&&T.postMethod('pwa_cache_update',size,source);
            
        },
        cache_update:async function(){
            await caches.delete(CACHE_NAME);
            T.postMethod('pwa_cache_delete');
        },
        cache_clear:async function(){
            let list = await caches.keys();
            list.map(v=>caches.delete(v));
            T.postMethod('pwa_cache_clear');
        },
        cache_cdn_update:async function(){
            let list = await caches.keys();
            list.map(v=>/CROSS/.test(v)&&caches.delete(v));
            T.postMethod('pwa_cache_cdn_clear');
        },
        unregister(){
            T.postMethod('pwa_remove'),
            registration.unregister();
        },
        update:function(){
            T.postMethod('pwa_update');
            return registration.update();
        }
    };
};
importScripts(ZIP_URL);
Object.entries({
    install(event) {
        console.log('serviceWorker install');
        T.postMethod('pwa_install');
        return self.skipWaiting(); //跳过等待
    },
    activate(event) {
        console.log('serviceWorker activate');
        T.postMethod('pwa_activate',!0,T.SW);
        return event.waitUntil(
            T.checkList('pwa_init',!0,T.SW).then(()=>{
                if(this.permission){
                    T.action['cache_check'](null,T.SW);
                }else{
                    self.dispatchEvent(new SyncEvent('sync',{tag:'register'}));
                }
                return self.skipWaiting();
            })
        );
    },
    fetch(event) {
        const request = event.request;
        let url = T.toPath(request);
        if(url.charAt(0)==='/'){
            url = T.toLink(url);
            if(request.method!='POST'){
                if(url.indexOf('/assets/')===0){
                    if(url.indexOf('zip.min.js')!=-1){
                        return event.respondWith(T.LoaclCache(request));
                    }
                    if(!T.isLocal){
                        if(url.lastIndexOf('.js')==url.length-3 || url.lastIndexOf('.css')==url.length-4){
                            return event.respondWith(T.LoaclCache(request));
                        }
                    }
                }
                if(!T.isLocal){                    
                    if(url=='/'||url==''||url=='/index.html'){
                        return event.respondWith(T.LoaclCache(request,'/'));
                    }
                    if(url.indexOf('/template-')===0){
                        /**
                         * 缓存模板
                         */
                        return event.respondWith(T.LoaclCache(request,url));
                    }
                }
                if(!Object.keys(CACHE_SOURCE).length){
                    return event.respondWith(T.InitCache(request,url));
                }
                let regs = Object.keys(CACHE_SOURCE).sort();
                for(let reg of regs){
                    if(url.indexOf(reg)===0) return event.respondWith(T.SourceCache(request,reg));
                }
                if(CACHE_LIST.includes(url)){
                    return event.respondWith(T.LoaclCache(request));
                }
            }
        }
        if(url.indexOf(location.host)===-1){
            if(url.indexOf('cdn')!==-1){
                return event.respondWith(T.CdnCache(request,'-CROSS-CDN'));
            }else if(/\.(jpg|gif|webp|png)$/ig.test(url)){
                return event.respondWith(T.CdnCache(request,'-CROSS-IMAGES'));
            }
        }
        return false;
    },
    async message(event) {
        let data = event.data;
        let source = event.source;
        if (data && data.constructor === Object) {
            let id = data.workerId;
            if (T.action[id]) return T.action[id](data,source);
            else{
                let method = data.method;
                let clientID = data.clientID;
                let result = data.result;
                delete data.method;
                delete data.clientID;
                delete data.result;
                switch(method){
                    case 'sync':{
                        if(data.tag){
                            if(this.permission){
                                T.action[tag];
                            }else{
                                self.dispatchEvent(new SyncEvent('sync',{tag:data.tag}));
                            }
                        }
                        break;
                    }
                    case 'register':{
                        T.SW = source;
                        break;
                    }
                    case 'setcache':{
                        if(result){
                            await T.checkList();
                            let cache = await caches.open(CACHE_NAME);
                            await Promise.all(result.forEach(async v=>{
                                if(!CACHE_LIST.includes(v)){
                                    let response = await fetch(url).catch(v=>null);
                                    if(response){
                                        CACHE_LIST.push(T.toPath(response));
                                        cache.put(response.url,response);
                                    }
                                }
                            }));
                        }
                        await T.postMessage({clientID,result:CACHE_LIST},source);
                        break;
                    }
                    case 'resetcache':{
                        if(result){
                            let cache = caches.open(CACHE_NAME);
                            await Promise.all(result.map(async v=>{
                                if((await cache).match(v)){
                                    (await cache).delete(v);
                                    let index = CACHE_LIST.indexOf(v);
                                    if(v!==false){
                                        CACHE_LIST.splice(index,1);
                                    }
                                }
                            }));
                        }
                        await T.postMessage({clientID,result:CACHE_LIST},source);
                        break;
                    }
                    case 'unpack':{
                        if(!result){
                            await T.postMessage({clientID,result:!1},source);
                        }else{
                            let password = data.password;
                            await T.postMessage({
                                clientID,
                                result:await T.unzip({result,password,clientID},source),
                            },source);
                            password = null;
                        }
                        break;
                    }
                    case 'cachesource':{
                        await T.postMessage({clientID,result:CACHE_SOURCE},source);
                        break;
                    }
                    case 'cachename':{
                        await T.postMessage({clientID,result:CACHE_NAME},source);
                        break;
                    }
                    case 'writecache':{
                        let cache = await caches.open(data.cachename||CACHE_NAME);
                        await Promise.all(Object.entries(result).map(
                            result=>cache.put(result[0],T.toResponse(result[1],result[0]))
                        ));
                        await T.postMessage({clientID,result:!0},source);
                        break;
                    }
                }
                result = null;
                clientID = null;
                method = null;
            }
            data = null;
        }else if (T.isLocal) console.log(data.method);
    },

    /**
     * 同步
     */
    async sync(event){
        let tag = event.tag;
        let source = event.source;
        console.log(tag);
        switch(tag){
            case 'register':{
                T.showNotification('喂,靓仔!',{
                    body:'能哥非常无耻的把ServiceWorker装系你台机度!',
                    /**
                     * 按钮选项
                     */
                    actions:[
                        {
                            action:'yes',
                            title:'我同意了!',
                        }
                    ],
                    lang:'zh-yue',
                    /**
                     * 震动
                     */
                    vibrate: [200, 100, 200, 100, 200],
                    tag
                });
                break;
            }
            case 'unregister':{
                await T.action[tag]();
                break;
            }
            case 'update':{
                await T.action[tag]();
                break;
            }
            case 'cache_update':{
                T.showNotification('网站缓存',{
                    body:CACHE_NAME+'悟空你真不要吗?',
                    actions:[
                        {
                            action:'ok',
                            title:'不要',
                        },
                        {
                            action:'no',
                            title:'算了',
                        }
                    ],
                    tag,
                });
                break;
            }
            case 'cache_clear':{
                T.showNotification('网站缓存',{
                    body:'要清空吗?',
                    actions:[
                        {
                            action:'ok',
                            title:'要要',
                        },
                        {
                            action:'no',
                            title:'算了',
                        }
                    ],
                    tag,
                });
                break;
            }
            case 'cache_check':{
                let size = await T.action[tag]();
                T.postMethod('pwa_cache_update',size||0,source);
                break;
            }
            case 'cache_cdn_update':{
                await T.action[tag]();
                break;
            }
            case 'load_source':{
                await T.loadSource();
                break;
            }
        }
    },
    /**
     * 周期同步
     * @param {*} event 
     */
    periodicsync(event){
        let tag = event.tag;
        let source = event.source;
        console.log(tag);

    },
    push(event){
        /**
         * await crypto.subtle.generateKey({
         *      name:'AES-GCM',
         *      length:128,
         *      hash:PushManager.supportedContentEncodings[0]
         * },true,['encrypt','decrypt'])
         * await crypto.subtle.generateKey({
                name:'ECDSA',
                namedCurve:'P-384'
            },true,['sign','verify'])
         */
        let message = event.data.text();
        console.log(message,event);
    },
    /**
     * 通知被点击事件 
     */
    async notificationclick(event){
        let notification = event.notification;
        let tag = notification.tag;
        let action = event.action;
        if(tag){
            if(action=='ok'){
                switch(tag){
                    case 'cache_update':{
                            await T.action[tag]();
                        break;
                    }
                    case 'cache_clear':{
                        await T.action[tag]();
                        break;
                    }
                }
            }
        }
    },
    notificationclose(event){
        let notification = event.notification;
        console.log('close',notification);
    }
}).forEach(
    entry => self.addEventListener(entry[0], entry[1])
);