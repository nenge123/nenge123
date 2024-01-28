---
layout: post
title: 常用JS代码
date: 2022-04-04 19:03 +0800
category: note
author: Nenge123
tags: [javascript]
summary: 一些JavaScript笔记
---


## IOS浏览器 手势放大问题

```javascript
let stopEvent = e =>{e.preventDefault(),e.stopPropagation()};
    document.addEventListener('gesturestart',event=>stopEvent(event),{'passive': false});
    document.addEventListener('gesturechange',event=>stopEvent(event),{'passive': false});
    document.addEventListener('gestureend',event=>stopEvent(event),{'passive': false});
```

## 网页非激活状态（手机很重要）

```javascript
document.addEventListener('visibilitychange',e=>{
    if (document.visibilityState === 'visible'){
    }else if(document.visibilityState === 'hidden'){
        
    }
});
```
## 网页加载完毕

```javascript
    document.readyState =='loading';//载入中
    document.readyState =='interactive';//内容载入完毕 准备渲染
    document.readyState =='complete';//完成渲染
    window.addEventListener('DOMContentLoaded',()=>{
        //document.readyState =='interactive';
    });
```

## GET/POST
> 处理表单数据
 
```javascript
    let post = new FormData(elm||{a:1});
    //location.href 127.0.0.1/?k=7
    let get =   new URLSearchParams(location.search)+'&' + new URLSearchParams({a:1})+'&'+new URLSearchParams('a=2&b=1');
    //'k=7&a=1&a=2&b=1'

    //ajax
    let request = new XMLHttpRequest();
    request.addEventListener('progress',e=>console((100*e.loaded/e.total).toFixed(0)+'%'));//下载进度
    request.upload.addEventListener('progress',e=>console((100*e.loaded/e.total).toFixed(0)+'%'));//上传进度
    request.open('post',location.pathname+'?'+get);
    reques.send(post);

    //fetch
    let request = async fetch(location.pathname+'?'+get,{
        method:"POST",
        body:post
    });
    let headers = {};
    request.headers.forEach((v,k)=>headers[k]=v);
    console.log(headers); //head 头
    //request.body.cancel(); 停止下载
    let maxLength = headers['content-length'] || 0, havesize = 0;
    let newRequest = await (new Response(new ReadableStream({
        //挟持下载进程
        async start(ctrler) {
            while (!status.done) {
                let speedsize = 0,
                    statustext = '';
                if (status.value) {
                    speedsize = status.value.length;
                    havesize += speedsize;
                    ctrler.enqueue(status.value);
                    //把下载Uint8Array数据放进容器
                }
                if (maxLength && havesize < maxLength) statustext = (100*havesize/maxLength).toFixed(0)+'%';
                else statustext  = (havesize / 1024).toFixed(1) + 'KB';
                console.log(statustext);//下载进度
                status = await reader.read();
            }
            ctrler.close();//关闭控制器,停止读取 并且返回Promise fulfilled,即对newRequest赋值
        }
    })));
    console.log(await newRequest.text());



```