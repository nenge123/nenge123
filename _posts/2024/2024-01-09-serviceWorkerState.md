---
layout: post
title: Service Worker那些缓存坑
date: 2024-01-09 08:57
category: ServiceWorker
author: Nenge123
tags: [pwa]
summary: 
---
### 前言 ###
`ServiceWorker`总会存在意想不到的问题.例如增加缓存,制造虚拟地址等,内容不更新等等.因此我们要赋予客户端控制权.

### 脚本状态变化 ###
当修改`CACHE_LIST`时,在关闭浏览器之前,发生的变化不会失去.当我重新打开时,`CACHE_LIST`值被还原到安装状态.
原因是因为`ServiceWorker`安装时,也就是脚本初始化的状态.发生交互时的交互状态是临时的.当重启浏览器时会回归初始化状态.当脚本内容发生变化时,`ServiceWorker`会触发重新安装,也就是重置初始化状态.但是苹果的手机浏览器会缓存`ServiceWorker`脚本,导致脚本不会立即更新.这就导致更新不同步.

```javascript
"use strict";
const CACHE_NAME = 'NENGE.NET';
const version = Date.parse('2023 09/23 19:40');
const CACHE_LIST = [];
importScripts("/assets/js/lib/zip.min.js?"+version);
Object.entries({
    install(event) {
        console.log('serviceWorker install');
        return self.skipWaiting();
    },
    activate(event) {
        console.log('serviceWorker activate');
        return event.waitUntil(checkList().then(e => self.skipWaiting()));
    },
    async fetch(event) {
        let request = event.request;
        let url = request.url.replace(location.origin,'');
        //把完整url替换成短地址.
        if(!CACHE_LIST.length){
            //缓存未初始化
            return event.respondWith(CheckCache(request));
        }
        if(CACHE_LIST.includes(url)){
            //记录中的缓存 直接返回
            return event.respondWith(loadCache(request));
        }
        return false;
    },
    async message(event) {
        let data = event.data;
        //event.source;
        console.log(data);
    }
}).forEach(
    entry => self.addEventListener(entry[0], entry[1])
);

async function CheckCache(request){
    await checkList();
    let cache = await caches.open(CACHE_NAME);
    let response = await cache.match(request);
    if(response) return response;
    return fetch(request);
}
async function checkList(){
    const cache = await caches.open(CACHE_NAME);
    const list = await cache.keys();
    if(!CACHE_LIST.length){
        //添加一个默认值
        CACHE_LIST.push("/assets/js/lib/zip.min.js?"+version);
    }
    list.forEach(v=>{
        let url = v.url.replace(location.origin,'');
        if(/zip\.min\.js/.test(url)&&url.indexOf(version)===false){
            cache.delete(v);
        }else if(!CACHE_LIST.includes(url))CACHE_LIST.push(url);
    });
}
async function loadCache(request){
    let DB = await caches.open(CACHE_NAME);
    let response = await DB.match(request);
    if(!response){
        response = await fetch(request);
        DB.put(request, response.clone());
    }
    return response;
}
```

### 引入交互 ###
为了确保消息不重叠,客户端发送的消息含有`clientID`作为回调函数标记,而`ServiceWorker`请求客户端交互含有`workerId`作为回调函数.
客户端可以随时控制缓存更新,并不需要每次更新时,需要重新安装`ServiceWorker`!

```javascript
    //事件处理 self.addEventListener('message',message);
    async function message(event) {
        let data = event.data;
        Client = event.source; //此处记录了客户端的通信对象
        console.log(data);
        if (!data && data.constructor !== Object) return;
        let id = data.workerId;
        if (action[id]) return action[id](data);
        else{
            switch(data.method){
                //要求work缓存链接
                case 'setcache':{
                    if(data.result){
                        let cache = await caches.open(CACHE_NAME);
                        await Promise.all(data.result.forEach(async v=>{
                            if(!CACHE_LIST.includes(v)){
                                CACHE_LIST.push(url);
                                cache.put(url,await fetch(url));
                            }
                        }));
                    }
                    data.result = CACHE_LIST;
                    postMessage(data);
                    break;
                }
               //要求work删除缓存
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
                    postMessage(data);
                    break;
                }
                //让serviceWorker解压一个zip
                case 'unpack':{
                    if(!data.result){
                        data.result = null;
                        return postMessage(data);
                    }
                    data.result = await unzip(data.result,data.password,data.clientID);
                    postMessage(data);
                    break;
                }
            }
        }
    }
```

### 交互处理函数 ###
`ServiceWorker`函数处理
```javascript
    //zip.js 解压函数
    async function unzip(contents,password,clientID){        
        const ReaderList = await new zip.ZipReader(new zip.BlobReader(new Blob([contents]))).getEntries().catch(e=>null);
        if(!ReaderList||!ReaderList.length) return null;
        let result;
        if(!clientID)password = false;
        const getData = (entry)=>{
            return entry.getData(new zip.Uint8ArrayWriter(), {password:entry.encrypted&&password!==false?password:undefined, onprogress: (current, total) =>clientID&&postMessage({clientID,current, total,filename:entry.filename,state:'progress'})}).catch(async e=>{
                let msg = e.message;
                //当且设置false 跳过加密文件
                if(password===false) return;
                if(msg == zip.ERR_INVALID_PASSWORD||msg==zip.ERR_ENCRYPTED){
                    password = await getMessage({clientID,state:'password',password});
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
        return result||null;
    }
    let Client;
    //记录回调函数
    const action = {};
    //交互 对客户端发送消息并且等待消息返回
    async function getMessage(ARG){
        let id = getRandom();
        ARG.workerId = id;
        return new Promise(back=>{
            action[id] = (data)=>{
                back(data.result);
                delete action[id];
            };
            postMessage(ARG);
        });
    }
    //生成一个唯一ID
    function getRandom(){
        return crypto&&crypto.randomUUID()||Date.now()+Math.random();
    }
    //发送客户端消息
    function postMessage(str,bool) {
        if(bool)return clients.matchAll().then(client=>client.postMessage(str));
        getClient().then(client => client && client.postMessage(str));
    }
    //确保当前通信客户端对象正处于浏览中
    function isVisible(client) {
        return client.visibilityState == 'visible';
    }
    //遍历可用客户端通信接口
    async function getClient() {
        let { Client, isVisible } = self;
        if (Client && isVisible(Client)) {
            return Client;
        }
        let clients = await self.clients.matchAll();
        return clients.filter(v => isVisible(v))[0] || Client || clients[0];
    }
```

### 客户端 ###
发送一个解压请求`await ZipWorker(u8array);`

```javascript
        const action = {};
        async postMessage(str,sw) {
            if(!sw){
                //确保 serviceWorker对象激活中
                sw = navigator.serviceWorker.ready;
                if(sw instanceof Promise){
                    sw = (await sw).active;
                }else if(self.sw){
                    sw = self.sw;
                }
            }
            sw&&sw.postMessage(str);
        }
        async function ZipWorker(contents,progress,pwFn){
            let clientID = Date.now()+Math.random();
            if(!contents) return contents;
            return new Promise(back=>{
                action[clientID] = async function(data){
                    if(data.result !== undefined){
                        back(data.result);
                        delete action[clientID];
                    }else if(data.state=='progress'){
                        progress&&progress(data.current, data.total,data.filename);
                    }else if(data.state=='password'){
                        let password = pwFn? await pwFn(data.password):prompt('请输入密码', data.password);
                        data.result = password;
                        postMessage(data);
                    }
                }
                postMessage({
                    clientID,
                    method:'unpack',
                    result:contents
                })

            });
        }
```