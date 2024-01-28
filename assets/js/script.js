const T=Nenge,I=T.I,F=T.F;
!(async function(T){
    let F=T.F,I=T.I;
    let docbody = document.body,dochtml = document.documentElement;
   /*https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css*/
   //alert(CSS.supports('font-format("truetype")'));
   //T.addJS('https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',null,!0);
   /*
   T.FetchItem({
        url:'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',
        store:T.LibStore,
        version:22,
        type:'text',
        Filter(text){
            return text.replace(/@font-face\s?\{[\s\S]+?\}/g,'');
        },
        async success(text){
            console.log('add font-icons css');
            let mime = ["woff2","woff","truetype"].filter(v=>CSS.supports('font-format('+v+')'))[0];
            if(!mime)mime="woff2";
            let fontFamily = '"FontAwesome"';
            T.addJS(`:root{--fontFamily-icons:${fontFamily};}@font-face{font-family:${fontFamily};font-weight: normal;font-style: normal;src:url(${await F.getLibjs('https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/fonts/fontawesome-webfont.'+(mime=='truetype'?'ttf':mime))}) format("${mime}");}`+text,null,!0);
        }
    }).catch(e=>alert(e));
    */
    T.script = {};
    I.assign(T.action,{
        TAG_REPLAY_COMMENTS:async (elm,status)=>{
            T.CF('creatDivbutton',elm,'click to load comments',function(){
                this.remove();
                T.addJS('https://cdn-city.livere.com/js/embed.dist.js');
            });
        },
        TAG_RUN_SCRIPT:async (elm,status)=>{
            if(T.$('#page-article')&&status == 'connect'){
                let script = I.elmdata(elm)['script'];
                console.log(elm,script);
                script&&T.addJS('/script/'+script);
                elm.remove();
            }
        },
        TAG_CLICK_SCRIPT:async (elm)=>{
            let script = I.Attr(elm,'file');
            let sourcetitle = (I.Attr(elm,'sourcetitle')||'').split('||');
                if(script){
                    T.SP(script,(src,i)=>{
                        let file = '/script/'+src,type = F.getExt(src),mime = type,
                            elmDiv = T.$append(elm,T.$ct('div',!1,'click-files-btn'));
                            var mimemap = {
                                js:'javascript'
                            }
                            if(mimemap[mime])mime = mimemap[mime];
                        if(type=='js'&&!I.Attr(elm,'view')){
                            T.once(T.$append(elmDiv,T.$ct('button',I.Attr(elm,'title')||T.GL('run '+mime))),'click',function(){this.remove();T.addJS(file+'?'+T.time)});
                        }
                        T.once(T.$append(elmDiv,T.$ct('button',sourcetitle[i]||(T.GL(`view ${mime} source`)+':'+F.getname(src)))),'click',function(){
                            let title = sourcetitle[i]||(F.getname(src)+T.GL(`${mime} source`));
                            T.FetchItem({
                                url:file,
                                type:'text',
                                process:e=>this.innerHTML = T.GL('File Loading:')+e,
                                success:text=>T.FetchItem({
                                    url:'https://api.github.com/markdown',
                                    json:{text:`### ${title} ###\n\`\`\`${mime}\n${text}\n\`\`\``},
                                    type:'text',
                                    process:e=>this.innerHTML = T.GL('GFM Format:')+e,
                                    success:html=>{T.$append(elmDiv,T.$ct('div',html)),this.remove();},
                                    error:e=>{T.$append(elmDiv,T.$ct('div',`<h3>${title}</h3><div class="language-${mime} highlighter-rouge"><div class="highlight"><pre class="rouge-pre"><code>${text.replace(/</g,'&lt;')}</code></pre></div></div>`)),this.remove()}
                                })
                            })
                        });
                    });
                }else{
                    elm.remove();
                }
        },
        TAG_MY_SCRIPT:async (elm)=>{
                let script = I.Attr(elm,'script');
                if(script){
                    if(elm.classList.contains('active')) return;
                    if(!T.script[script])T.script[script] = {};
                    if(T.script[script]['call'])T.script[script]['call'](elm);
                    if(!T.script[script]['wait'])T.script[script]['wait'] = T.addJS(T.JSpath+'script/'+script+'.js');
                    T.script[script]['wait'].then(e=>T.script[script]['call'](elm));
                }else{
                     elm.remove();
                }
        },
        TAG_MY_IFRAME:async (elm)=>{
            T.CF('creatDivbutton',elm,'click to view hide content',function(){
                this.remove();
                T.$append(elm,T.$ct('iframe',null,null,I.Attr(elm)));
            });
        },
        TAG_CODE_MERMAID(elm){
            let elmcontent = T.$ct('div',elm.innerHTML,'div-click-content',{hidden:true});
            elm.innerHTML = '';
            T.$append(elm,elmcontent);
            let elmload = T.$append(elm,T.$ct('div',T.GL('view mermaid'),'div-click-open'));
            elm.classList.add('active');
            T.once(elmload,'click',e=>{
                if(!window.mermaid) window.mermaid = T.loadLibjs('https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js',e=>elmload.innerHTML=T.GL("loading mermaid")+e);
                let func = ()=>{
                    var mermaid = window.mermaid;
                    elmload.remove();
                    if(!mermaid.sequenceConfig)mermaid.initialize({startOnLoad: true,theme: "forest",flowchart:{useMaxWidth: true,htmlLabels: true}});
                    elmcontent.hidden = false;
                    mermaid.init(null,elmcontent);
                };
                I.await(window.mermaid)?window.mermaid.then(func):func();
            });
        },
        creatDivbutton(elm,text,func){
            T.once(T.$append(elm,T.$ct('div',T.GL(I.Attr(elm,'title')||text),'div-click-open')),'click',func);
        },
        creatAnimation(elm,keyframes,options){
            options = options ||{};
            I.toArr({
                delay:-1,// 延迟开始动画多少ms 默认值0
                //endDelay 动画结束后延时多少ms
                easing:"ease-in-out",//速率 linear,ease-in
                duration: 500,//动画所需ms
                iterations: 1,//循环次数
            },entry=>{
                if(options[entry[0]] == undefined){
                    options[entry[0]] = entry[1];
                }
            })
            return elm.animate(keyframes,options);
        },
        titleAnimation(elm){
            return T.CF('creatAnimation',elm,[
                {
                    //'transition': 'all .1s',
                    'backgroundColor':'var(--article-title-bg)',
                    'transform': 'translateX(10px)'
                },
                {
                    'backgroundColor':'var(--article-title-bg-mute)',
                    //'transition': 'all .1s',
                    'transform': 'translateX(-10px)'
                }
            ],
            {
                delay:200,
                duration: 100,//动画所需ms
                iterations: 4,//循环次数);
            });
        },
        scrollTo(pos,callback){
            if(I.elm(pos))pos = dochtml.scrollTop+pos.getBoundingClientRect().y-50;
            T.$('#nav-btn').classList.remove('active');
            let maxTop = dochtml.offsetHeight - window.innerHeight;
            if(pos>maxTop)pos = maxTop;
            if(pos==dochtml.scrollTop) return;
            let keyframes = [
                //transform: translateY(10px)
                { 'transform': 'translateY(0px)' },//from
                { 'transform': 'translateY('+(dochtml.scrollTop-pos)+"px)" },//tof
            ];
            let _Animation = T.CF('creatAnimation',docbody,keyframes);
            T.once(_Animation,'finish',e=>{
                dochtml.scrollTop=pos;
                callback&&callback(e);T.CF('getScrollSize');
            });
        },
        getScrollSize(){
            //用CSS3代替scroll判断
            let size = dochtml.getBoundingClientRect(),
                docMain = T.$('#main-body'),
                docMainy = docMain&&docMain.getBoundingClientRect().y,
                Y = dochtml.scrollTop;
            
            I.setStyle(
                docbody,
                {
                    '--scroll-height':size.height+'px',
                    '--scroll-top':0-size.y+'px',
                    '--scroll-top2':size.y+'px',
                    '--scroll-innerheight':window.innerHeight+'px',
                    '--scroll-bottom':window.innerHeight-size.y+'px',
                    '--scroll-y':0-size.y>200?window.innerHeight-size.y+'px':false,
                    '--scroll-main-y':(docMainy>Y?docMainy:Y)+'px'
                }
            );
        },
        tocNav(o){
            let elm = T.$('#toc-nav');
            elm&&elm.classList[o||'toggle']('active');
        },
        showScroll(){
            if(T.$('#toc-nav')){
                T.on('#toc-nav-btn','click',e=>{
                    T.$('#toc-nav-ul').hidden = false;
                    if(T.$('#toc-nav').classList.toggle('active')){
                        T.$('#toc-nav-ul').focus();
                    };
                    T.stopEvent(e);
                });
                T.on('#toc-nav-ul','click',e=>{
                    T.$('#toc-nav').classList.remove('active');
                    T.stopEvent(e);
                    let elm = e.target;
                        let href = (I.Attr(elm,'href')||'').split('#')[1];
                        if(!href) return;
                        if(href=='buttom')return T.CF('scrollTo',dochtml.scrollHeight);
                        if(href=='top')return T.CF('scrollTo',0);
                        let id = '[id="'+href+'"]';
                        let elmH = T.$(id);
                        T.CF('hideSider','remove');
                        if(elmH){
                            T.CF(
                                'scrollTo',
                                elmH,
                                e=>T.CF('titleAnimation',elmH)
                            );
                        }else{
                            T.CF('scrollTo',0);
                        }
                    T.once('#toc-nav','animationend',e=>{
                    });

                });
                if(T.$('#page-article')){
                    if(T.$('#markdown-toc')){
                        T.docload(e=>T.$append(T.$('#toc-nav-ul'),T.$('#markdown-toc')));
                    }else if(!T.$('my-script[script="catalogue"]')){
                        I.toArr(I.toArr(T.$$('.e-content [id]')).filter(elm=>/^H/.test(elm.tagName)),elm=>{
                            T.$append(T.$('#toc-nav-ul'),T.$ct('a',elm.textContent,'toc-nav-li',{
                                href:'#'+I.Attr(elm,'id')
                            }));
                        });
                    }
                }
            }
            T.on(T.$('#nav-btn'),'click',function(){
                if(!this.style.cssText)I.setStyle(T.$('#nav-body'),{'--nav-height':T.$('#nav-body').scrollHeight+'px'});
                this.classList.toggle('active');
            });
            T.on(window,'scroll',e=>T.CF('getScrollSize'));
            T.CF('getScrollSize');
            return ;
            let navList,objelm;
            //确保文档已经完成加载
            //绑定菜单按钮事件
            if(T.$('#page-home')){
                objelm = T.$('#page-home');
                navList = [];
            }else if(T.$('#page-article')){
                objelm = T.$('#page-article');
                if(T.$('my-script[script=catalogue]'))navList = [];
                else navList = I.toArr(T.$$('article [id]')).filter(elm=>/^H/.test(elm.tagName));
                navList.unshift('top','buttom');
            }
            if(navList){
                let siderRight = T.$('#right-sider');
                if(!siderRight) siderRight = T.$append(objelm,T.$ct('div',null,null,{id:"right-sider"}));
                let elmul = T.$append(siderRight,T.$ct('div',null,'toc-nav-ul'));
                I.toArr(navList,(elm,index)=>{
                    let id = I.str(elm)?elm:I.Attr(elm,'id'),
                        text = I.str(elm)?T.GL(elm):elm.textContent.trim();
                    if(!id){
                        id = 'home-id-'+index;
                        I.Attr(elm,'id',id);
                    }
                    I.Attr(T.on(T.$append(elmul,T.$ct(I.str(elm)?'button':'a',text,'toc-nav-li')),'click',function(e){
                        let href = I.Attr(this,'href').split('#')[1];
                        if(href=='buttom')return T.CF('scrollTo',dochtml.scrollHeight);
                        if(href=='top')return T.CF('scrollTo',0);
                        let id = '[id="'+href+'"]';
                        let elmH = T.$(id);
                        T.CF('hideSider','remove');
                        if(elmH){
                            T.CF(
                                'scrollTo',
                                elmH,
                                e=>T.CF('titleAnimation',T.$('#page-home')?elmH.parentNode:elmH)
                            );
                        }else{
                            T.CF('scrollTo',0);
                        }
                        T.stopProp(e);
                    }),'href','#'+id);
                });
                T.on(T.$append(T.$('#nav-container'),T.$ct('button',T.GL('catalog'),null,{id:'nav-bar'})),'click',e=>{
                    //dochtml.scrollTop = 0;
                    T.$('#nav-btn').classList.remove('active');
                    T.CF('hideSider');
                    T.stopEvent(e);
                });
            }
        }
    });
    await T.FetchItem({
        url:T.JSpath+'i18n/'+T.i18nName+'.json',
        store:T.LibStore,
        key:T.i18nName,
        type:'json',
        success(json){
            console.log('add lang');
            T.lang = json;
        },
        version:2
    });
    //加载评论
    T.customElement('my-iframe');
    T.customElement('click-script');
    T.customElement('run-script');
    T.customElement('replay-comments');
    T.customElement('code-mermaid');
    T.customElement('my-script');
    T.CF('showScroll');
    T.docload(async ()=>{
        //绑定主页事件
        I.toArr(T.$$('#page-home .post-content'),elm=>T.once(elm,'click',function(){
            I.setStyle(this,{'--post-height':this.scrollHeight+'px'});
            this.classList.add('active');
        }));
    });
    /*
    T.loadLibjs(T.JSpath+'codemirror.min.css');
    T.loadLibjs(T.JSpath+'codemirror.min.js').then(v=>{
        I.toArr(T.$$("code[class*='language-']"),elm=>{
            let newelm = elm.parentNode.replaceChild(T.$ct('textarea',elm.textContent,null,I.Attr(elm)),elm);
            //window.CodeMirror.fromTextArea(newelm);
        });

    });
    */
})(T);