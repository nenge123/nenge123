var MyPWA = new class{
    constructor(){
        this.setCache();
        this.setIDB();
        this.setStorage();
        T.SW&&T.SW.ready.then(()=>this.initPWA());
    }
    get elm_content(){
        return T.$('#page-result');
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
    async initPWA(){
        document.getElementById('install-pwa').hidden = !1;
        if(location.search){
            if(!self.caches){
                document.getElementById('install-pwa').hidden = !0;
                alert('你的浏览器太落后了,请使用正版浏览,不要使用国内套壳浏览器(最小浏览器)');
            }else{
                let result = this.elm_content;
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
                /*
                let zipElm = result.insertBefore(document.createElement('div'),result.children[0]);
                await T.addLib('zip.min.js',(a,b)=>{
                    zipElm.innerHTML = 'zip.min.js 下载 '+(a*100/b).toFixed(0)+'%';
                });
                zipElm.innerHTML = 'zip.min.js已加载 https://gildas-lormeau.github.io/zip.js/';
                let sqlElm = result.insertBefore(document.createElement('div'),result.children[0]);
                await T.addLib('sql.zip',(a,b)=>{sqlElm.innerHTML = 'SQL.js 下载 '+(a*100/b).toFixed(0)+'%';});
                //await T.addJS(T.libPath+ 'sql.js');
                sqlElm.innerHTML = 'SQL.js已加载 https://github.com/sql-js/sql.js';
                */
                const CACHE_SOURCE = await T.getMessage('cachesource');
                const CACHE_NAME = await T.getMessage('cachename');
                let path;
                for(let reg in CACHE_SOURCE){
                    if(url.indexOf(reg)===0){
                        path = reg;
                        break;
                    }
                }
                if(!path) return;
                let mode = CACHE_SOURCE[path].mode;
                switch(mode){
                    case 'sql':{
                        await T.addJS('/assets/js/router/pwa-script-'+mode+'.js');
                        break;
                    }
                }
                const cachename = CACHE_NAME+path.split('/').splice(0,3).join('-').toUpperCase();
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
                    cachename:cachename,
                    url:sourceURL
                });
                const cache = await caches.open(cachename);
                await cache.put(path+'/config.json',new Response(new Blob([JSON.stringify(jsondata)],{type:T.getMime('json')+';charset=utf-8'})));
                await new template_script(jsondata,this).init(cache);
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