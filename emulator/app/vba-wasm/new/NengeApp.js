let NengeApp = new class{
    CoreFile = "vbanext-wasm.7z";
    Core7z = "../extract7z.min.js";
    OnLine = document.domain.search(/localhost|127.0./g) !== -1;
    constructor(){
        this.AddJs(this.OnLine?'../localforage.js' :'//cdn.bootcdn.net/ajax/libs/localforage/1.9.0/localforage.min.js',
            ()=>{
                this.rooms = localforage.createInstance({'name': 'NengeNet','storeName': "VBA-ROOMS"}),
                this.srm = localforage.createInstance({'name': 'NengeNet','storeName': "VBA-SRM"}),
                this.state = localforage.createInstance({'name': 'NengeNet','storeName': "VBA-STATE"}),
                this.rooms.ready().then(()=>{
                    this.rooms.getItem(this.CoreFile).then(result=>{
                        if(!result){
                            fetch(this.CoreFile).then(data=>data.arrayBuffer()).then(resultData=>{
                                let worker = new Worker(this.Core7z),File = {};
                                worker.onmessage = result7z=>{
                                    if(result7z.data.data){
                                        File[result7z.data.file] = result7z.data.data;
                                    }else if(result7z.data.t==1){
                                        File.timestamp = new Date();
                                        this.rooms.setItem(this.CoreFile,File);
                                        this.installCore(File);
                                    }
                                };
                                worker.postMessage(new Uint8Array(resultData));
                            })
                        }else{
                            this.installCore(result);
                        }
                    })
                });
            }
        );
        this.adjustVKLayout();
        if(window.PointerEvent) {
            this.PointerEvent();
        }
    }
    installCore(File){
        let js = (new TextDecoder()).decode(File['retroarch.js']);
            //防止音乐自动播放
            js = js.replace(
                '_RWebAudioWrite(buf,size){',
                ' _RWebAudioWrite(buf,size){if(!RA.audio) return;'
                ).replace(
                    '_RWebAudioInit(latency){',
                    '_RWebAudioInit(latency){if(!Module.openMusic){Module.latency=latency;return Module["resumeMainLoop"]();}else{latency=latency||Module.latency;}'
                ).replace(
                    /addEventListener\("(\w+)", (\w+), false\);/g,
                    'addEventListener("$1", $2, {passive:false});'
                ).replace(
                    'eventHandler.useCapture)',
                    'eventHandler.useCapture||{passive:false})'
                ).replace(
                    'updateCanvasDimensions:function(canvas,wNative,hNative){',
                    'updateCanvasDimensions:function(canvas,wNative,hNative){if(1)return console.log(canvas);'
                ).replace(
                    'listener(canvas.width,canvas.height)',
                    'return ;listener(canvas.width,canvas.height)'
                ).replace(
                    'calculateMouseEvent:function(event){',
                    'calculateMouseEvent:function(event){return console.log("移除屏幕事件!");'
                ).replace(
                    '_emscripten_set_canvas_element_size(target,width,height){',
                    '_emscripten_set_canvas_element_size(target,width,height){return console.log(target,width,height);'
                );
        
        let EmulatorJS = Function('"use strict";let tempDouble,tempI64;'+js+';return EmulatorJS')(this),
            Module = {
            'TOTAL_MEMORY': 0x10000000,
            'noInitialRun': !0x0,
            'arguments': [],
            'preRun': [],
            'postRun': [],
            'canvas': document.querySelector('.gba-pic'),
            'print': e=>console.log(e),
            'printErr': e=>console.warn(e),
            'totalDependencies': 0,
            'monitorRunDependencies':e=>console.log("游戏开始"),
            'onRuntimeInitialized':e=>{
                Module['FS']['createFolder']('/', 'etc', !0x0, !0x0),
Module['FS']['mkdir']('/data'),
Module['FS']['mkdir']('/data/saves'),
//'undefined' != typeof IDBFS ? Module['FS']['mount'](IDBFS, {}, '/data/saves') : Module['FS']['mount'](Module['FS']['filesystems']['IDBFS'], {}, '/data/saves'),
Module['FS']['mkdir']('/shader'),
Module['FS']['syncfs'](!0x0, function (e) {}),
Module['FS']['createDataFile']('/etc', 'retroarch.cfg', 'savefile_directory = /data/saves\n'+
'video_vsync = true\n'+
'screenshot_directory = /\n'+
'video_shader = /shader/shader.glslp\n'+
'video_shader_enable = true\n'+
'video_font_enable = false\n'+
'video_scale = 1.0\n'+
'video_gpu_screenshot = false\n'+
'audio_latency = 96\n'+
'fastforward_ratio = 1.0\n'+
'video_smooth = false', !0x0, !0x0),
Module['FS']['createFolder']('/home/web_user', '.config', !0x0, !0x0),
Module['FS']['createFolder']('/home/web_user/.config', 'retroarch', !0x0, !0x0),
Module['FS']['createDataFile']('/home/web_user/.config/retroarch', 'retroarch-core-options.cfg', "", !0x0, !0x0);
                let simulate_input = Module['cwrap']('simulate_input', 'null', ['number', 'number', 'number']);
                this.sendKey = (key,bool)=>simulate_input(0,key,bool);
                fetch("../1.gba").then(v=>v.arrayBuffer()).then(v=>{
                    v=new Uint8Array(v);
                    console.log(v.length);
                    Module['FS']['createDataFile']('/', "1.gba", v, !0x0, !0x1);
                    Module['callMain'](['/1.gba', '2b35cacf70aef5cbb3f38c0bb20e488cc8ad0c350400499a3'] );
                
                });
            },
            //preMainLoop:e=>{//console.log("循环运行运行");},
            'wasmBinary':File['retroarch.wasm']
        };
        EmulatorJS(Module);
        console.log(EmulatorJS);
        window.Module = this.Module = Module;
        File = null;
    }
    AddJs(URL,cb){
        let elm = document.createElement('script');
        elm.src = URL;
        if(cb)elm.onload = cb;
        document.body.appendChild(elm);
    }
    KeyMap = {
        0: 'B',
        1: 'Y',
        2: 'SELECT',
        3: 'START',
        4: 'UP',
        5: 'DOWN',
        6: 'LEFT',
        7: 'RIGHT',
        8: 'A',
        9: 'X',
        10: 'L',
        11: 'R',
        12: 'L2',
        13: 'R2',
        14: 'L3',
        15: 'R3',
        19: 'L STICK UP',
        18: 'L STICK DOWN',
        17: 'L STICK LEFT',
        16: 'L STICK RIGHT',
        23: 'R STICK UP',
        22: 'R STICK DOWN',
        21: 'R STICK LEFT',
        20: 'R STICK RIGHT'
    }
    stopEvent(e){

                        e.preventDefault();
                        e.stopPropagation();
                        return false;
    }
    PointerEvent(){
        let CodeMap={};
        for(var i in this.KeyMap)CodeMap[this.KeyMap[i]] = i; 
        ['pointerover','pointerout','pointerdown','pointerup'].forEach(val=>
        document.addEventListener(val,(e)=>{
            let elm = e.target,k=elm.getAttribute('data-k');
            if(k){
                    let K = k.toUpperCase();
                    if(CodeMap[K]){
                        this.sendKey(CodeMap[K],e.type=="pointerover"||e.type=="pointerdown"?1:0);
                        return this.stopEvent(e);
                    }
            }

        },
        {passive:false}))
    }
    Q = str=>document.querySelector(str);
    adjustVKLayout() {
        let gbaMaxWidth = window.innerWidth,
            gbaMaxHeight = window.innerHeight - 20,
            isLandscape = gbaMaxWidth > gbaMaxHeight,
            baseSize = Math.min(Math.min(gbaMaxWidth, gbaMaxHeight) * 0.14, 50),
            fontSize = baseSize * 0.7,
            offTop = 0,
            offLeft = 0,
            Q = str => this.Q(str),
            QS = str => this.Q('.vk[data-k="' + str + '"]'),
            makeVKStyle = (top, left, w, h, fontSize) => {
                top = parseInt(top);
                return (top>=0?'top:':'bottom:') + Math.abs(top) + 'px;'+(left>=0?'left:':'right:') + Math.abs(left)+ 'px;width:' + w + 'px;height:' + h + 'px;' +
                    'font-size:' + fontSize + 'px;line-height:' + h + 'px;'
            };
        if (!isLandscape&&gbaMaxWidth<1000) {
            //offTop = Q('.gba-pic').offsetHeight + baseSize;
            //if ((offTop + baseSize * 7) > gbaMaxHeight) {
            //    offTop = 0;
            //}
        }else if(gbaMaxWidth>=1000){
            //offTop = (this.body.offsetHeight/2 - baseSize*4) || 0;

        }

        QS('l').style.cssText = makeVKStyle(baseSize * 1.5, 0, baseSize * 3, baseSize, fontSize);
        QS('r').style.cssText = makeVKStyle(baseSize * 1.5,-0.1, baseSize * 3, baseSize,fontSize);

        QS('turbo').style.cssText = makeVKStyle(baseSize * 0.5, 0, baseSize * 3, baseSize*0.5, fontSize);
        QS('menu').style.cssText = makeVKStyle(baseSize * 0.5, -0.1, baseSize * 3, baseSize*0.5,fontSize);

        QS('up').style.cssText = makeVKStyle(-baseSize*6.5, baseSize, baseSize, baseSize, fontSize);
        QS('ul').style.cssText = makeVKStyle(-baseSize*6.5, offLeft, baseSize, baseSize, fontSize);
        QS('ur').style.cssText = makeVKStyle(-baseSize*6.5, baseSize * 2, baseSize, baseSize, fontSize);
        QS('down').style.cssText = makeVKStyle(-baseSize*4.5, baseSize, baseSize, baseSize, fontSize);
        QS('dl').style.cssText = makeVKStyle(-baseSize*4.5, offLeft, baseSize, baseSize, fontSize);
        QS('dr').style.cssText = makeVKStyle(-baseSize*4.5, baseSize * 2, baseSize, baseSize, fontSize);
        QS('left').style.cssText = makeVKStyle(-baseSize*5.5, 0, baseSize, baseSize, fontSize);
        QS('right').style.cssText = makeVKStyle(-baseSize*5.5, baseSize * 2, baseSize, baseSize, fontSize);

        QS('a').style.cssText = makeVKStyle(-baseSize*6,-5, baseSize*1.3,baseSize*1.3, fontSize);
        QS('b').style.cssText = makeVKStyle(-baseSize*5.5,-baseSize*2, baseSize*1.3, baseSize*1.3,
            fontSize);

        QS('select').style.cssText = makeVKStyle(-60,baseSize ,baseSize * 3, baseSize * 0.5, fontSize);
        QS('start').style.cssText = makeVKStyle(-60,-baseSize, baseSize * 3, baseSize * 0.5, fontSize);


    }
}