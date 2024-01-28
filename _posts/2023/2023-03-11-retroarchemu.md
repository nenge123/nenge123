---
layout: post
title: RetroArch WEB在线模拟器基本制作
date: 2023-03-11 11:28
category: RetroArch
tags: [wasm,retroarch]
summary: "RetraoArch是跨平台多功能怀旧游戏模拟器,集合多种开源模拟器解码核心,统一接口输入输出.在JavaScript es6支持C#,网页中运行RetroArch成为可能!"
---
- 目录
{:toc #toc}
核心下载地址:
- https://binbashbanana.github.io/
- https://buildbot.libretro.com/nightly/emscripten/

### 声明变量 ###
```javascript
var Module = new class{
    noInitialRun = true;//布尔值 true 不主动运行Module.callMain
    arguments = ["-v", "--menu"];//-v代表输出日志  --menu打开RetroArch系统,如果是路径则直接打开游戏rom,第三个值决定canvas,默认值#canvas
    preRun = [];
    postRun = [];
    totalDependencies = 0;
    canvas = document.querySelector('#canvas'); //设置canvas 兼容处理
    wasmBinary = Uint8Array; //设置wasm的数据值,如果不设置,js载入后会自动下载xxx.wasm,例如把核心打包下载节省带宽时就需要了
    print(text){} //控制台输出
    printErr(text){} //日志输出 注意这个函数this不一定是Module
    onRuntimeInitialized(){}//wasm加载完毕时运行
}
```

### 简单例子 ###  
> /js/mgba_libretro.js  
> /js/mgba_libretro.wasm  
> /1.gba  
> /index.html  

<click-script file="retroarchemu/index.html"></click-script>

### 按键处理 ###
> 可以创建事件触发  
```javascript
document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyX'}));
document.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyX'}));
```

### 数据本地化 ###  

> 由于无法确定是否有 **IDBFS** 因此最好自己参照写一个自定义的硬盘挂载  

```javascript
/*
        var MYDFS = new NengeDisk();
        MYDFS.SetModule(this);
        MYDFS.setMEMFS(FS.filesystems.MEMFS);
        let path = "/home/web_user/retroarch/userdata";
        FS.createPath('/',path, !0, !0);//创建一个目录
        await MYDFS.syncfs(FS.mount(MYDFS, {}, path).mount); //挂载一个MYDFS硬盘,确保已经同步完毕
 */
//在callMain之前挂载
```
<click-script file="retroarchemu/mydbfs.js,retroarchemu/idbfs.js" view="true"></click-script>


### 常见BUG处理 ###
- 声音,由于手机策略上问题,声音初始化必须有交互事件  
  <click-script file="retroarchemu/fix-audio.js"></click-script>
  