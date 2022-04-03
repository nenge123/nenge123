---
layout: post
title: "常用JS代码"
date: 2022-04-04 19:03 +0800
category: javascript
---


## IOS浏览器烦人的 手势放大问题

```javascript
let stopEvent = (e,bool)=>{if(!bool)e.preventDefault();e.stopPropagation();return false;};
    this.on(document,'gesturestart',event=>stopEvent(event),{'passive': false});
    this.on(document,'gesturechange',event=>stopEvent(event),{'passive': false});
    this.on(document,'gestureend',event=>stopEvent(event),{'passive': false});
```

## 网页非激活状态（手机很重要）

```javascript
this.on(document,'visibilitychange',e=>{
    if (document.visibilityState === 'visible'){

    }else if(document.visibilityState === 'hidden'){
        
    }
});
```
## 网页加载完毕

```javascript
    document.readyState =='loading';
    document.readyState =='interactive';
    document.readyState =='complete';
    window.addEventListener('DOMContentLoaded',()=>{
        //document.readyState =='interactive';
    });
```

## fetch GET/POST

```javascript
    let url = '',
        urldata = {},// GET "q=URLUtils.searchParams&topic=api"
        method = 'GET',
        paramData = method=="GET" ? new URLSearchParams(typeof urldata == 'String' ?urldata&&urldata:null): new FormData();
    /*
        var paramsString = "q=URLUtils.searchParams&topic=api";
        var searchParams = new URLSearchParams(paramsString);
    */
    if(urldata&&typeof urldata == 'Object'){
        for(let k in urldata){
            let v = urldata[k];
            if(v instanceof Uint8Array){
                v = new File([v.buffer], 'my.png',{type: "image/png"});
            }
            paramData.append(k,v);
        }
    }
    if(method == 'GET'){
        paramData = '?'+paramData.toString();
    }else {
        //upload file
        paramData.append("image",
            new File(
                [new ArrayBuffer()], //arrayBuffer
                'my.png',
                {type: "image/png"}
            )
        );
    }
    let request = new Request(
        url+(method=="GET"?paramData:''),
        method=="POST" ? 
            {
                'method': method,
                //'headers': {
                //    'Content-Type': 'multipart/formdata'
                //},
                'body': paramData
            }
            :
            {
                //'headers':{
                //    'Content-Type':'application/x-www-form-urlencoded'
                //}
            }
    );
    let type= 'arrayBuffer',
        headers = {},
        response = await fetch(request);
    for (const [key, value] of response.headers.entries()) {
        headers[key] = value;

    }
    if (response.status == 404) {
        error&&error(response.statusText);
    }
    const reader = response.body.getReader();
    const stream = new ReadableStream({
        start(controller) {
            let push = e => {
                reader.read().then(({done,value}) => {
                    if (done) {
                        controller.close();
                        push = null;
                        return;
                    }
                    havesize += value.length;
                    let statussize = '0%';
                    if(headers['Content-Length'])statussize = Math.floor(havesize / Number(headers['Content-Length']) * 100) + '%';
                    process &&process(statussize, value.length, havesize);
                    //下载或者上传进度
                    controller.enqueue(value);
                    push();
                });
            }
            push();
        }
    });
    let contents = await (new Response(stream)[type]());

```

## fetch post

```javascript

```