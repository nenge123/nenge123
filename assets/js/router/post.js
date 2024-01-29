var MyPost = new class{
    constructor(){
        this.init();
        this.creatTag();
    }
    async init(){
        await T.addLib('highlight.min.zip');
        await T.addLib('gradient-dark.css');
        hljs.highlightAll();
    }
    ce(str){
        return document.createElement(str);
    }
    append(a,b){
        if(I.str(b))b=this.ce(b);
        return (a||document).appendChild(b);
    }
    async creatTag(){
        const P = this;
        T.customElement('my-iframe',{
            Connected(){
                if(!this.innerHTML){
                    this.innerHTML = '点击查看第三方页面';
                }
                console.log(this.innerHTML.length);
                this.once('click',function(){
                    let iframe = P.ce('iframe');
                    I.setAttr(iframe,I.getAttr(this));
                    this.parentNode.insertBefore(iframe,this);
                    this.remove();
                })
            }
        });
        T.customElement('click-script',{
            async Connected(){
                const title = this.innerHTML;
                const elm   = this;
                let attr = I.getAttr(elm);
                let elmK = document.createDocumentFragment();
                I.toArr((attr.file||'').split(','),(src,i)=>{
                    let btn = P.append(elmK,'button');
                    btn.classList.add('btn');
                    let file = '/script/'+src,type = T.getExt(src),mime = type;
                    let title2;
                    let mimemap = {
                        js:'javascript'
                    }
                    if(title){
                        title2 = title;
                        btn.innerHTML = title;
                    }
                    else{
                        if(['css','scss'].includes(mime)){
                            title2 = '样式源代码';
                            btn.innerHTML = '查看样式';
                        }else{
                            title2 = '脚本源代码';
                            btn.innerHTML = '查看脚本源代码';
                        }
                    }
                    if(mimemap[mime])mime = mimemap[mime];
                    btn.on('click',function(){
                        T.FetchData({
                            url:file,
                            type:'text',
                            process:(a,b)=>this.innerHTML = T.GL('File Loading:')+(a*100/b).toFixed(0)+'%',
                            success:text=>{
                                let elmF = document.createDocumentFragment();
                                if(title2){
                                    P.append(elmF,'h6').innerHTML = title2;
                                }
                                if(text){
                                    let pre = P.append(elmF,'pre');
                                    let code = P.append(pre,'code');
                                    code.innerHTML = text;
                                    code.classList.add('language-'+mime);
                                    this.parentNode.insertBefore(elmF,this);
                                    hljs.highlightElement(code);
                                    if(attr.mode=='eval'){
                                        (new Function(text))();
                                    }
    
                                }
                                this.remove();
                            }
                        });
                    })

                });
                this.parentNode.insertBefore(elmK,this);
                this.remove();

            }
        });
        T.customElement('replay-comments');
        T.customElement('my-script');
        T.customElement('code-mermaid',{
            async Connected(){
                await P.loadMermaid();
                mermaid.init(null,this);
            }
        });
        I.toArr(T.$$('.language-mermaid'),elm=>{
            let elmK = document.createDocumentFragment();
            let btn = P.ce('button');
            btn.classList.add('btn-mermaid');
            btn.innerHTML = '点击查看关系图';
            let div = P.ce('div');
            div.innerHTML = elm.innerHTML;
            div.classList.add('div-mermaid');
            //div.hidden = !0;
            P.append(elmK,btn);
            P.append(elmK,div);
            elm.parentNode.parentNode.insertBefore(elmK,elm.parentNode);
            elm.parentNode.remove();
            btn.once('click',async function(){
                await P.loadMermaid();
                mermaid.init(null,this.nextElementSibling);
                this.remove();

            });
        });
    }
    async loadMermaid(){
        if(!this.mermaid){
            this.mermaid = I.Async(async back=>{
                if(T.isLocal) await T.addJS('https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js');
                else await T.addLib('mermaid.min.zip');
                mermaid.initialize({startOnLoad: true,theme: "forest",flowchart:{useMaxWidth: true,htmlLabels: true}});
                back(true);
            });
        }
        return this.mermaid;
    }
}