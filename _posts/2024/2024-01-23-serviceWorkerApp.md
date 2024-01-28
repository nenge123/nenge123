---
layout: post
title: Service Worker页面应用实践之SQLite
date: 2024-01-23 10:26
category: ServiceWorker
tags: [pwa]
summary: 
---
- 目录
{:toc #toc}

### 前言 ###
&emsp;&emsp;由于缓存储存在本地,所以读取非常的快,尽管非常的快但是它是异步的,`Service Worker`实现假同步.非常适合一些资料,私人影院网站使用.即便断开网络亦可以使用!本次应用使用SQLite制作一个在线m3u8影院.

### 架设准备 ###
- zip.min.js 本地解压,减少传输延迟,加密验证
- sql.js 用于执行SQL查询操作
- 404.html 默认页面 初始化准备
- hls.js 播放m3u8视频js库
- sw.js ServiceWorker脚本
- common.js 客户端脚本
- template-index.html 首页模板
- template-player.html 媒体播放 页面模板

### ServiceWorker脚本sw.js ###
> 推荐把zip.js放进`Service Worker`,首行放入,这样前台也可以通过`postMessage`解压提取数据.  
如何通信参考 [Service Worker那些坑](serviceWorkerState.html)  
此方法还有一个作用---加密,解压数据需要输入密码.确保不被陌生人使用!   

```javascript
importScripts('/zip.min.js');
```
-   #### ServiceWorker配置页面 ####
    ```javascript
    function toLocation(url){
        return this.toStatus(301,{'location':url});
    }
    function toStatus(status,headers){
        return new Response(undefined,{status:status|404,headers});
    }
    async function readCache(request,url){
        /** 自动更新缓存 */
        const cache = await caches.open(CACHE_NAME);
        let cacheResult = await cache.match(url);
        let cachetime;
        if(cacheResult){
            if(!url||!navigator.onLine){
                /**
                 * 离线非本地缓存
                 * 跨域缓存直接返回而不检测缓存
                 */
                return cacheResult;
            }
            cachetime = cacheResult.headers.get(' ');
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
        /** 意外则返回空白404 */
        return toStatus(404);
    }
    self.addEventListener('fetch',function(event){
        const request = event.request;
        const url = request.url.replace(location.origin,'').split('?')[0];
        if(url.charAt(0)=='h'){
            /** 非本站地址跳过 
             * Service Worker是可以保存跨越资源
             * 但是跨越资源不能使用缓存检测(检测header:last-modified的文件最后修改时间决定是否更新)
             */
            return event.respondWith(readCache(request));
        }
        let last = url.split('/').pop();
        if(last==='player.html'){
            return event.respondWith(readCache('/template-player.html','/template-player.html'));
            //return event.respondWith(fetch('/template-player.html'));
        }else if(last==='index.html'||!last){
            return event.respondWith(readCache('/template-index.html','/template-index.html'));
            //return event.respondWith(fetch('/template-index.html'));
        }else if(last==='common.js'){
            /**
             * 此文件用于检测更新,确保缓存中最新版本
             */
            return event.respondWith(readCache('/common.js','/common.js'));
            //return event.respondWith(fetch('/common.js'));
        }else if(/\d*\.html/.test(last)){
            return event.respondWith(toLocation('/player.html?id='+last.match(/(\d+)/)[1]));
        }else{
            event.respondWith(async function(){
                const cache = await caches.open(CACHE_NAME);
                /** 这里用url因为有时候JQ使用xxx?xxx导致worker不匹配  */
                const respond = await cache.match(url);
                if(respond){
                    return respond;
                }
                /** 意外则返回空白404 */
                return toStatus(404);
            });
        }
    });
    ```

### 客户端模板common.js ###
> 客户端我们可以先弄一个loading界面迷惑用户.  
由于我的SQL.js修改过,具体可以下载 [sql.zip](/assets/js/lib/sql.zip)  
但是要修改sql.js `wasmBinary:await Nenge.I.toU8(await Store.getdata(Nenge.LibPad+'sql.wasm'))`   
例如你在激活worker时保存了SQL.js到缓存,则改为 `new Uint8Array(await (await caches.match('/sql.wasm')).arrayBuffer())`

```javascript

function getResponse(type, data) {
    return new Response(new Blob([data]), {
        status: 200,
        headers: {
            'content-type': type
            'content-length': data.size || data.byteLength || data.length
        }
    });
}
!(async function(){
    let re = await fetch('/sql.dat');
    if(!re||re.status==404){
        /**
         * 跳转未安装数据初始化页面
         * 注意!404 不能忽略,因为worker接管后,所有地址并非不存在,而是变成空白404;
         */
    }
    const db = await openSQL(new Uint8Array(re.arrayBuffer()));
    const params = new URLSearchParams(location.search);
    let sql = 'select * from data ';
    let page = params.get('page')?parseInt(params.get('page'))||1:1;
    /**
     * 这里我用了 index.html?page=11,当然这些地址不是绝对,
     * 你可以调整 Service Worker 的匹配规则,实现所谓的伪静态!
     * 如 index-1.html 或者 /index/1/ 反正地址是虚假的,需要注意地址要使用斜杠开头,避免地址不是绝对地址.
     */ 
    let maxnum = db.fetchResult(sql.replace('*', 'count(*)'));
    let limit = 30;
    /**
     * 这里你还可以储存专门表检查更新,然后更新的数据缓存到本地
     * cache.put('/sql.dat',getResponse('application/octet-stream',db.export()))
     * 
     */ 
    let datas = db.fetchArray(sql + ' limit ' + (page - 1) * limit + ',' + limit);
    /**
     * 处理数据,并关闭数据库. 
     */
    db.close();
    SQL._sqlite3_free();
    SQL._free();
})();
```

### 404页面 ###

```html
<script>
    navigator.serviceWorker.register('/sw.js').then(sw=>{
        alert('ServiceWorker 安装成功');
        location.reload();
    });
</script>
```