---
layout: post
title: HTML CSS动画笔记
date: 2023-03-05 06:50
category: note
author: Nenge123
tags: [css3,transition,animation]
summary: CSS3动画是个强大的功能,对比以前的`setTimeout`更丝滑.无需使用JQuery,利用事件监听,可以准确的在动画结束时执行后续动作.
---
- 目录
{:toc #toc}

HTML CSS动画接口主要有两个,先做个基础了解

### 事件 ###
- #### transition事件 ####  
    **常见的悬浮操作:**     `run(新)->start->cancel->run(旧)->start->end`  
    **事件驱动:**           `run->start->end`  
    ```mermaid
    sequenceDiagram
        原始状态->>过渡过程:    run
        过渡过程->>最后状态:    start
        过渡过程->>最后状态:    end
        原始状态->>过渡过程:    cancel <br>1.display:none<br>2.transition-property属性变化
    ```
- #### animation事件 ####   
    **悬停间隔短循环播放:**     `start->iteration->start->iteration....->cancel`  
    **悬停时间短于动画播放**    `start->cancel`  
    **循环一次的完整事件**      `start->end`  
    ```mermaid
    sequenceDiagram
        动画开始->>动画结束:    start
        动画结束->>最后状态:    end         <br>终止动画,停止后续
        动画开始->>动画结束:    cancel      <br>意外终止,停止后续,常见悬停
        动画结束->>最后状态:    iteration   <br>动画循环下一个start
    ```

### 基本样式 ###  
- #### transition样式 ####
    > transition:transition-property(属性)  transition-duration(持续时间) | transition-timing-function(速率变化函数) | transition-delay(延时执行)  
    多个属性变化逗号隔开.  
    `transition: margin-right 4s ease-in-out 1s;` margin-right变化需要4s延迟1s执行.  
    `transition: margin-right 4s, color 1s;` margin-right变化需要4s,颜色1s完成变化.  

    <my-iframe class="interactive is-default-height" height="200" src="https://interactive-examples.mdn.mozilla.net/pages/css/transition.html" title="MDN Web Docs Interactive Example" loading="lazy"></my-iframe> 

- #### animation样式 ####
    <my-iframe class="interactive is-default-height" height="200" src="https://interactive-examples.mdn.mozilla.net/pages/css/animation.html" title="MDN Web Docs Interactive Example" loading="lazy"></my-iframe>

- #### animation js API控制动画 ####  

    ```javascript
        function animateScroll(size){
            let eH = document.documentElement,
                st = eH.scrollTop,sh = eH.scrollHeight-window.innerHeight,sy=st+size>=sh?sh-st:size;;
            let keyframes = [
                    { transform: "translateY("+(0-sy)+"px)" },//from
                    { transform: "translateY("+sy+"px)" },//to
            ];
            let options = {
                    //delay 延迟开始动画多少ms 默认值0
                    //endDelay 动画结束后延时多少ms
                    easing:"ease-out",//速率 linear,ease-in
                    duration: 300,//动画所需ms
                    iterations: 1,//循环次数
            };
            document.documentElement.scrollTo(0,st+sy);
            let _Animation = document.body.animate(keyframes,options);
            ["cancel","finish","remove"].forEach(v=>_Animation.addEventListener(v,e=>console.log(e.type)));
            //let _Animation = new Animation(new KeyframeEffect(document.body,keyframes, options));
            _Animation.addEventListener('finish',e=>{ });
            //_Animation.play();
            //_Animation.cancel();
            //_Animation.pause();
            //_Animation.finish();
        }
        animateScroll(500); //向下滚动500px

    ```

### 后记 ###  
如果子容器在发生动画事件,主容器监听也会触发的.好比点击子元素会冒泡到document.body.避免这种情况,用**this==event.target**判断是否当前对象.  
**这些事件可用实现动画之间套娃**,比起使用`setTimeout()`好用多了.例如A碰到B时,B才打C,**是不是有点人机检测内味?**  
```javascript
    let on = (o,...a)=>o && Reflect.apply(addEventListener, o, a),
        $ = s=>document.querySelector(s);
    var A,B,C;
    on($(A),'animationend',e=>{
        let A=e.target,size = A.getBoundingClientRect();
        let B = document.elementFromPoint(size.x,size.y);
        if(B){
            A.classList.remove('active');
            A.hidden = true;
            //A消失了
            B.classList.add('active');
            //抓到B了 给B上眼药
        }
        else console.log('打跑A抓不到B');
    });
    on($(B),'animationend',e=>{
        let A=e.target,size = A.getBoundingClientRect();
        let B = document.elementFromPoint(size.x,size.y);
        if(B==$(C)){
            A.classList.remove('active');
            A.hidden = true;
            //B消失了
            B.classList.add('active');
            //抓到C了
            console.log('恭喜你拳打A,脚踢B,一巴打在C身上');
        }else console.log('功亏一篑!');
    });
```
### animation事件例子1 ###  
<click-script file="htmlAnimation/animation.js" mode="eval"></click-script>
### animation事件例子2 滚动顶部 ###  
<click-script file="htmlAnimation/scrollTop.js" mode="eval"></click-script>

### transition交互例子 ###  
> 简单结构实现bootstrap菜单效果,transition实践自适应导航菜单  

- #### 交互脚本html ####  

    ```html
    <button id="nav-btn">
        <span id="nav-icon"></span>
    </button>
    <nav id="nav-body">
        <div class="nav-item"><a class="nav-item-a" href="/">首页</a></div>
        <div class="nav-item"><a class="nav-item-a" href="/emulator/helppage/">手机模拟器下载</a></div>
        <div class="nav-item"><a class="nav-item-a" href="/emulator/app/emujs/">模拟器讨论</a></div>
        <div class="nav-item"><a class="nav-item-a" href="Jekyll.html">Jekyll安装</a></div>
    </nav>
    ```

- #### 交互脚本javascript ####  

    ```javascript
    !(function(){
        let on = (o,...a)=>o && Reflect.apply(addEventListener, o, a),
            $ = s=>document.querySelector(s),
            setStyle = (a,b)=>Object.entries(b).forEach(v=>a.style[(v[1]===false?'remove':'set')+'Property'](v[0],v[1]));
        on(
            //绑定按钮事件
            $('#nav-btn'),
            'click',
            function(){
                let nb = $('#nav-body');
                setStyle(nb,{'--nav-height':nb.scrollHeight+'px'});
                //设置#nav-body原始高度,否则动画不知到高度
                // --nav-height 把高度存进CSS变量中调用,避免直接用height覆盖属性
                this.classList.toggle('active');
            }
        );
    })();
    ```
    <click-script file="htmlAnimation/transition.scss,htmlAnimation/transition.css"></click-script>