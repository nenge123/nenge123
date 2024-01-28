"use strict";
const CACHE_NAME = 'NENGE-NET';
const version = Date.parse('2023 09/23 19:40');
const CACHE_LIST = [];
const CACHE_SOURCE = {
    "/emulator/test":{

    },
    "/video/cmvod":{
        "mode":"sql",
        "url":"http://127.0.0.1"
    },
    "/video/online":{
        "mode":"sql",
        "url":"https://videos.nenge.net"
    },
    "/video/s1s":{
        "mode":"sql",
        "url":"https://videos.nenge.net"
    },
};
const ZIP_URL = "/assets/js/lib/zip.min.js?"+version;
importScripts(ZIP_URL);
Object.entries({
    install(event) {
        console.log('serviceWorker install');
        T.postMethod('pwa_install');
        return self.skipWaiting(); //跳过等待
    },
    activate(event) {
        console.log('serviceWorker activate');
        return event.waitUntil(T.checkList('pwa_activate').then(e => self.skipWaiting()));
    },
    fetch(event) {
        const request = event.request;
        let url = T.toPath(request);
        if(url.charAt(0)==='/'){
            if(request.method!='POST'){
                if(url=='/'||url==''||url=='/index.html'){
                    return event.respondWith(T.loaclCache(request,'/'));
                }else if(/\/assets\/.+?\.(js|css)\??/ig.test(url)){
                    return event.respondWith(T.loaclCache(request));
                }else if(/\/template\-.*\.html/ig.test(url)){
                    return event.respondWith(T.loaclCache(request));
                }else if(/zip\.min\.js$/.test(url)){
                    return event.respondWith(T.loaclCache(request))
                }else{
                    for(let reg in CACHE_SOURCE){
                        if(url.indexOf(reg)===0) return event.respondWith(T.sourceCache(request,reg));
                    }
                    if(!CACHE_LIST.length){
                        return event.respondWith(T.CheckCache(request));
                    }else if(CACHE_LIST.includes(url)){
                        return event.respondWith(T.loaclCache(request));
                    }
                }
            }
        }else if(!/nenge\.net/.test(url)&&/\.(jpg|gif|js|css|webp|png|m3u8|woff2|woff|svg|ttf|eot)$/ig.test(url)){
            return event.respondWith(T.otherCache(request));
        }
        return false;
    },
    async message(event) {
        let data = event.data;
        T.Client = event.source;
        if (T.isLocal) console.log(data);
        if (data && data.constructor === Object) {
            let id = data.workerId;
            if (T.action[id]) return T.action[id](data);
            else{
                switch(data.method){
                    case 'setcache':{
                        if(data.result){
                            await T.checkList();
                            let cache = await caches.open(CACHE_NAME);
                            await Promise.all(data.result.forEach(async v=>{
                                if(!CACHE_LIST.includes(v)){
                                    let response = await fetch(url).catch(v=>null);
                                    if(response){
                                        CACHE_LIST.push(T.toPath(response));
                                        cache.put(response.url,response);
                                    }
                                }
                            }));
                        }
                        data.result = CACHE_LIST;
                        T.postMessage(data);
                        break;
                    }
                    case 'resetcache':{
                        if(data.result){
                            let cache = caches.open(CACHE_NAME);
                            await Promise.all(data.result.map(async v=>{
                                if((await cache).match(v)){
                                    (await cache).delete(v);
                                    let index = CACHE_LIST.indexOf(v);
                                    if(v!==false){
                                        CACHE_LIST.splice(index,1);
                                    }
                                }
                            }));
                            data.result = CACHE_LIST;
                        }
                        T.postMessage(data);
                        break;
                    }
                    case 'unpack':{
                        if(!data.result){
                            data.result = false;
                            return T.postMessage(data);
                        }
                        data.result = await T.unzip(data.result,data.password,data.clientID);
                        T.postMessage(data);
                        break;
                    }
                    case 'cachesource':{
                        data.result = CACHE_SOURCE;
                        T.postMessage(data);
                        break;
                    }
                    case 'cachename':{
                        data.result = CACHE_NAME;
                        T.postMessage(data);
                        break;
                    }
                    case 'writecache':{
                        let cache = await caches.open(data.cachename||CACHE_NAME);
                        await Promise.all(Object.entries(data.result).map(
                            result=>cache.put(result[0],T.toResponse(result[1],result[0]))
                        ));
                        data.result = !0;
                        T.postMessage(data);
                        break;
                    }
                }
            }
            data = null;
        }else if(T.isLocal){
            console.log(data);
        }
    }
}).forEach(
    entry => self.addEventListener(entry[0], entry[1])
);

const T = new class {
    async CheckCache(request,url){
        await T.checkList();
        if(CACHE_LIST.includes(url)){
            return this.loaclCache(request);
        }
        return fetch(request);
    }
    async loaclCache(request,url){
        return await this.readCache(await caches.open(CACHE_NAME),request,url?url:true);
    }
    async otherCache(request){
        return await this.readCache(await caches.open('OTHER-SITE-DATA'),request);
    }
    /**
     * 获取缓存 或者更新缓存
     * @param {*} cache 
     * @param {*} request 
     * @param {*} url 本地缓存地址
     * @returns 
     */
    async readCache(cache,request,url){
        if(cache instanceof Promise) cache = await cache;
        if(url===true){
            url = this.toLink(this.toPath(request));
        }
        let cacheResult = await cache.match(url||request);
        let cachetime;
        if(cacheResult){
            if(!url||!navigator.onLine){
                /**
                 * 离线非本地缓存
                 * 跨域缓存直接返回而不检测缓存
                 */
                return cacheResult;
            }
            cachetime = cacheResult.headers.get('last-modified');
        }
        let response = await fetch(request).catch(e=>null);
        /** 跨域缓存不能操作headers */
        if(url&&response){
            let fetchtime = response.headers.get('last-modified');
            if(fetchtime&&fetchtime==cachetime){
                /** 缓存未变化终止下载 */
                response.body.cancel();
                return cacheResult;
            }else{
                /**本地缓存数据 */
                cache.put(url,response.clone());
                return response;

            }
        }else if(response){
            /** 缓存数据 */
            cache.put(request,response.clone());
            return response;
        }
        if(cacheResult) return cacheResult;
        /** 意外则返回404 */
        return this.toStatus(404);
    }
    async sourceCache(request,reg){
        let cacheInfo = CACHE_SOURCE[reg];
        let url = this.toLink(this.toPath(request));
        let urls = url.split('/');
        const cache = await caches.open(CACHE_NAME+reg.split('/').splice(0,3).join('-').toUpperCase());
        let response = await cache.match(url);
        if(response) return response;
        let last = urls.pop();
        if(cacheInfo.mode=='sql'){
            if(last==='player.html'){
                return await T.loaclCache('/template-sql-player.html');
            }else if(last==='index.html'||!last){
                return await T.loaclCache('/template-sql-index.html');
            }else if(/\d*\.html/.test(last)){
                return this.toLocation('player.html?id='+last.match(/(\d+)/)[1]);
            }else{
                return this.toStatus(404);
            }
        }
        if(last=='' || /\.html$/.test(last)) return this.toLocation('/template-install-pwa.html?back='+encodeURIComponent(this.toPath(request)));
        return fetch(request);
    }
    async unzip(contents,password,clientID){        
        const ReaderList = await new zip.ZipReader(new Blob([contents])).getEntries().catch(e=>false);
        if(!ReaderList||!ReaderList.length) return false;
        let result;
        if(!clientID)password = false;
        const getData = (entry)=>{
            return entry.getData(new zip.Uint8ArrayWriter(), {password:entry.encrypted&&password!==false?password:undefined, onprogress: (current, total) =>clientID&&T.postMessage({clientID,current, total,filename:entry.filename,state:'progress'})}).catch(async e=>{
                let msg = e.message;
                if(password===false) return;
                if(msg == zip.ERR_INVALID_PASSWORD||msg==zip.ERR_ENCRYPTED){
                    password = await T.getMessage({clientID,state:'password',password});
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
                    if(!result)result={};
                    result[entry.filename] = data;
                }
            }
        }
        return result||false;
    }
    async getMessage(ARG){
        let id = T.getRandom();
        ARG.workerId = id;
        return new Promise(back=>{
            T.action[id] = (data)=>{
                back(data.result);
                delete T.action[id];
            };
            T.postMessage(ARG);
        });
    }
    getRandom(){
        return btoa(crypto&&crypto.randomUUID()||performance.now()+Math.random()).replace(/[^\w]/g,'');
    }
    postMessage(str,bool) {
        if(bool)return clients.matchAll().then(client=>client.postMessage(str));
        this.getClient().then(client => client && client.postMessage(str));
    }
    isVisible(client) {
        return client.visibilityState == 'visible';
    }
    async getClient() {
        let { Client, isVisible } = this;
        if (Client && isVisible(Client)) {
            return Client;
        }
        let clients = await self.clients.matchAll();
        return clients.filter(v => isVisible(v))[0] || Client || clients[0];
    }
    async updateCaches(method, result,hash) {
        hash = hash===undefined ? '?'+new Date:hash;
        let cachelist = result || CACHE_LIST;
        if (cachelist && Array.isArray(cachelist) && cachelist.length) {
            let myCACHE = await caches.open(CACHE_NAME);
            await Promise.all(cachelist.map(async v => {
                if (this.isLocal) console.log(v);
                let re = await fetch(v);
                CACHE_LIST.push(this.toPath(re));
                myCACHE.put(re.url, re);
            }));
        }
        this.postMethod(method);
    }
    async checkList(method){
        if(!CACHE_LIST.length){
            CACHE_LIST.push(this.toLink(ZIP_URL));
        }
        const cache = await caches.open(CACHE_NAME);
        const list = await cache.keys();
        list.forEach(v=>{
            let url = this.toPath(v);
            if(!CACHE_LIST.includes(url))CACHE_LIST.push(url);
        });
        if(method)this.postMethod(method);
    }
    postMethod(method) {
        return this.postMessage({ method })
    }
    isLocal = /(127\.0\.0\.1|localhost)/.test(location.host);
    action = {
    };
    Client = undefined;
    toLocation(url){
        return this.toStatus(301,{'location':url});
    }
    toStatus(status,headers){
        return new Response(undefined,{status:status|404,headers});
    }
    toPath(request){
        return (request.constructor===String?request:request.url).replace(location.origin,'');
    }
    toLink(url){
        return url.split('?')[0];
    }
    mime = Object.fromEntries((
        [].concat(...(
            "text;css,scss,sass,xml,vml,style:css,htm:html|php,txt:plain,js:javascript\n" +
            "image;jpg,jpeg,png,gif,webp,avif,apng,heic,svg:svg+xml\n" +
            "font;woff,woff2,ttf,otf\n" +
            "application;pdf,json,js:javascript,*:octet-stream,zip:zip|x-zip-compressed,rar:rar|x-rar-compressed,7z:7z|x-7z-compressed,wasm\naudio;ogg,wma,mp3,m4a:mp4\nvideo;mp4").split(/\n/).map(a => {
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
        let type = data.type||url&&T.mime[url.split('.').pop()]||T.mime['html'];
        let length = data.size||data.byteLength||0;
        headers = new Headers(headers);
        headers.set('content-length',length);
        headers.set('content-type',type);
        return new Response(data instanceof Blob?data:new Blob([data]),{headers});

    }
};