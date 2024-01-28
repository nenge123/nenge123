var MyPWA = new class{
    constructor(){
        this.setCache();
        this.setIDB();
        this.setStorage();
        T.SW.ready&&T.SW.ready.then(()=>this.initPWA());
    }
    setCache(){
        let cacheElm = document.getElementById('cachelist');
        self.caches&&self.caches.keys().then(list=> list.forEach(v=>{
            let li = document.createElement('li');
            li.appendChild(document.createElement('code')).innerHTML = v;
            let btn = li.appendChild(document.createElement('button'));
            btn.innerHTML = '删除';
            btn.once('pointerup',function(){
                this.parentNode.remove();
                caches.delete(v);
            });
            cacheElm.appendChild(li);
        }));
    }
    setIDB(){
        let dbElm = document.getElementById('indexlist');
        indexedDB&&indexedDB.databases().then(list=> list.forEach(v=>{
            let li = document.createElement('li');
            li.appendChild(document.createElement('code')).innerHTML = v.name;
            let btn = li.appendChild(document.createElement('button'));
            btn.innerHTML = '删除';
            btn.once('pointerup',function(){
                this.parentNode.remove();
                indexedDB.deleteDatabase(v.name);
            });
            dbElm.appendChild(li);
        }));
    }
    setStorage(){
        let store = I.tryC(navigator.storage,'estimate');
        I.await(store)&&store.then(function(data){
            let elm = document.getElementById('storeinfo');
            (elm.appendChild(document.createElement('div'))).innerHTML = '<div>容量上限:'+(data.quota/Math.pow(1024,2)).toFixed(0)+'MB</div>'+
                            '<div>已使用:'+(data.usage/Math.pow(1024,2)).toFixed(1)+'MB</div><div>caches不一定准确,他可能是包含整个浏览器缓存.而indexedDB才是本站占用!</div>'+
                            '<ul class="article">'+Object.entries(data.usageDetails).map(entry=>'<li><code>'+entry[0]+':</code><span>'+(entry[1]/Math.pow(1024,2)).toFixed(1)+'MB</span></li>').join('')+'</ul>';
    
        });

    }
    getResponse(name,data){
        return new Response(new Blob([data]),{status:200,headers:{"content-type":F.getMime(name),'content-length':data.size||data.byteLength||data.length}});
    }
    async initPWA(){
        document.getElementById('install-pwa').hidden = !1;
        if(location.search){
            if(!self.caches){
                document.getElementById('install-pwa').hidden = !0;
                alert('你的浏览器太落后了,请使用正版浏览,不要使用国内套壳浏览器(最小浏览器)');
            }else{
                let result = document.getElementById('pwa-result');
                let params = new URLSearchParams(location.search).get('back');
                let url = params.replace(location.origin,'');
                if(params){
                    document.getElementsByName('url')[0].value=url;
                }
                document.getElementsByName('install')[0].on('pointerdown',async function(e){
                    if(this.disabled)return;
                    this.disabled = !0;
                    let source = await T.getMessage('cachesource');
                    console.log(source,paths);
                    this.disabled = !1;
                });
                let zipElm = result.insertBefore(document.createElement('div'),result.children[0]);
                await T.addLib('zip.min.js',(a,b)=>{
                    zipElm.innerHTML = 'zip.min.js 下载 '+(a*100/b).toFixed(0)+'%';
                });
                zipElm.innerHTML = 'zip.min.js已加载 https://gildas-lormeau.github.io/zip.js/';
                let sqlElm = result.insertBefore(document.createElement('div'),result.children[0]);
                await T.addLib('sql.zip',(a,b)=>{sqlElm.innerHTML = 'SQL.js 下载 '+(a*100/b).toFixed(0)+'%';});
                //await T.addJS(T.libPath+ 'sql.js');
                const CACHE_SOURCE = await T.getMessage('cachesource');
                const CACHE_NAME = await T.getMessage('cachename');
                sqlElm.innerHTML = 'SQL.js已加载 https://github.com/sql-js/sql.js';
                let path;
                for(let reg in CACHE_SOURCE){
                    if(url.indexOf(reg)===0){
                        path = reg;
                        break;
                    }
                }
                if(!path) return;
                const CACHENAME = CACHE_NAME+path.split('/').splice(0,3).join('-').toUpperCase();
                result.insertBefore(document.createElement('div'),result.children[0]).innerHTML='正在加载配置';
                let paths = path.split('/');
                let sourceURL = CACHE_SOURCE[path].url;
                let jsondata = await T.FetchData({url:sourceURL+'/'+paths.at(-1)+'.json',type:'json',params:{t:Date.now()}});
                if(!jsondata){
                    result.insertBefore(document.createElement('div'),result.children[0]).innerHTML='加载配置失败!';
                    return;
                }
                Object.assign(jsondata,{
                    path:path,
                    cachename:CACHENAME,
                    url:sourceURL
                });
                const cache = await caches.open(CACHENAME);
                if(jsondata.script){
                    cache.put(path+'/script.js',this.getResponse('js',jsondata.script));
                    //await T.addJS(path+'/script.js');
                    if(T.isLocal)await T.addJS('/assets/js/router/template-pwa-script.js');
                    else await T.addJS(path+'/script.js');
                    jsondata.script = true;
                }
                cache.put(path+'/config.json',this.getResponse('json',JSON.stringify(jsondata)));
                if(I.obj(jsondata)){
                    if(self.TEMPLATE_INSTALL){
                        await self.TEMPLATE_INSTALL(jsondata);
                    }
                }
                document.getElementsByName('go')[0].hidden=!1;
                document.getElementsByName('go')[0].on('click',function(){
                    location.href = document.getElementsByName('url')[0].value;
                });
                
            }
        }else{
            document.getElementById('install-pwa').hidden = !0;
        }

    }
}