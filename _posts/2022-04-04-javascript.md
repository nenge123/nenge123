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

async function Fecth(ARG){
    let url = ARG.url,
        type= ARG.type||'arrayBuffer',
        fd,
        form,
        data={};
    if(ARG.get){
        url +=(/\?/.test(url)?'&':'?')+new URLSearchParams(ARG.get).toString()
    }
    ['headers','context','referrer','referrerPolicy','mode','credentials','redirect','integrity','cache'].forEach(val=>{
        if(ARG[val] != undefined)data[val] = ARG[val];
    });
    if(ARG.form||ARG.post){
        if(typeof ARG.form == 'string')form = this.$(ARG.form);
        else if(ARG.form instanceof HTMLElement) form = ARG.form;
        fd = new FormData(form || undefined);
        if(ARG.post)for(var i in ARG.post)fd.append(i,ARG.post[i]),delete ARG.post[i];
    }
    if(fd){
        data.method = 'POST';
        data.body = fd;
    }
    let headers = {},
        response = await fetch(new Request(url,data));
    for (const [key, value] of response.headers.entries()) {
        headers[key] = value;
    }
    if (response.status == 404) {
        return ARG.error&&ARG.error(response.statusText);
    }
    let downsize = Number(headers["content-length"]) || 0,
    havesize = 0;
    const reader = response.body.getReader();
    const stream = new ReadableStream({
        start(controller) {
            let push = async ()=>{
                const {done,value} = await reader.read();
                if(done){
                    controller.close();
                    push = null;
                }else{
                    havesize += value.length;
                    let statussize;
                    if(downsize)statussize = downtext+Math.floor(havesize / downsize * 100) + '%';
                    ARG.process && ARG.process(statussize,value.length, havesize);
                    //下载或者上传进度
                    controller.enqueue(value);
                    push();
                }
            };
            push();
        }
    });
    let contents = await (new Response(stream)[type]());
    ARG.success&&ARG.success(contents,headers);
    return contents;
}

```