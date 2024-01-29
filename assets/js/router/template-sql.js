var MyTemplate = new class{
    constructor(){
        T.docload(e=>{
            let upbtn = document.getElementById('btn-update-cache');
            upbtn&&upbtn.on('pointerup',e=>{
                this.gotoPWA();
            });
            this.init();
        });
    }
    gotoPWA(){
        location.href = '/template-install-pwa.html?back='+encodeURIComponent(location.href.replace(location.origin,''));
    }
    async init(){
        //await T.addJS(T.libPath+ 'sql.js');
        const jsondata = await T.ajax({url:'config.json',type:'json'});
        if(!jsondata){
            return this.gotoPWA();
        }
        this.jsondata = jsondata;
        if(jsondata.mode=='sql'){
            await T.addLib('sql.zip');
            return this.RUN_SQL(jsondata);
        }
    }
    async RUN_SQL(jsondata){
        let path = jsondata.path;
        let url = jsondata.url;
        let limit = jsondata.limit;
        if(jsondata.script){
            if(T.isLocal)await T.addJS('/assets/js/router/template-pwa-script.js');
            else await T.addJS(path+'/script.js');
        }
        if(window.TEMPLATE_UPDATE_BUTTON){
            TEMPLATE_UPDATE_BUTTON(this);
        }
        switch(T.getName(location.href)){
            case '':
            case 'index.html':{
                return TEMPLATE_INDEX(jsondata);
            }
            case 'player.html':{
                return TEMPLATE_PLAYER(jsondata);
                break;
            }
        }
    }
    setUpdate(data){
        let button = document.getElementById('btn-update-cache');
        if(button){
            let pbtn = button.parentNode;
            I.toArr(data,entry=>{
                let elm = pbtn.appendChild(document.createElement('button'));
                elm.innerHTML = entry[0];
                elm.on('pointerup',e=>entry[1](e,this.jsondata));
            });
        }
    }
    setError(str){
        let loadelm = document.getElementById('loading-page');
        if(loadelm){
            loadelm.classList.add('active');
            loadelm.innerHTML = str;
            if(this.jsondata){
                I.toArr(this.jsondata.datasource,v=>{
                   loadelm.appendChild(document.createElement('div')).innerHTML = '数据资源:'+v;
                });
            }
        }

    }
    async downVideo(url,elmBtn){
        const list = [];
        if(!self.m3u8parser){            
            await T.addLib('m3u8-parser.zip',(a,b)=>elmBtn.innerHTML='m3u8-parser.zip'+(a*100/b).toFixed(0)+'%');
            await T.addLib('aes-decryptor.zip',(a,b)=>elmBtn.innerHTML='aes-decryptor.zip'+(a*100/b).toFixed(0)+'%');
        }
        this.readPath(url);
        if(!this.origin) return;
        let text = await T.FetchData({ url, type: 'text' });
        if(!text) return;
        let parser = new m3u8parser(text);
        elmBtn.innerHTML = '解析文件中';
        if (!parser.manifest.segments.length) {
            for(let item of parser.manifest.playlists){
                //if (item.attributes) Object.assign(ATTR, item.attributes);
                let nextParser = new m3u8parser(await T.FetchData({ url: this.getPath(item.uri), type: 'text' }));
                if (nextParser.manifest.segments.length) {
                    list.push(...nextParser.manifest.segments.map(v => {
                        v.uri = this.getPath(v.uri);
                        if (v.key && I.str(v.key.uri)) {
                            if (v.key.uri.charAt(0) == '/') {
                                v.key.href = this.getPath(v.key.uri);
                            }
                        }
                        return v;
                    }));
                }

            }
        }else{
            list.push(...parser.manifest.segments.map(v => {
                v.uri = this.getPath(v.uri);
                if (v.key && I.str(v.key.uri)) {
                    if (v.key.uri.charAt(0) == '/') {
                        v.key.href = this.getPath(v.key.uri);
                    }
                }
                return v;
            }));
        }
        let index = 0;
        let nowbuff;
        let keyData = {};
        let chunks = [];
        elmBtn.innerHTML = '解析完毕,进行下载';
        for(let frag of list){
            let databuf = await T.FetchData({ url: frag.uri});
            let buffer;
            if (frag.key) {
                if (frag.key.href) {
                    if (!keyData[frag.key.href]) {
                        let buf = await T.FetchData({ url: frag.key.href});
                        keyData[frag.key.href] = buf.buffer;
                    }
                    buffer = keyData[frag.key.href];
                }
                if (!nowbuff || nowbuff != buffer) {
                    index = 0;
                    nowbuff = buffer;
                }
                let aes = new AESDecryptor();
                aes.constructor();
                aes.expandKey(buffer);
                databuf = aes.decrypt(databuf.buffer, 0, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, index]).buffer, !0);
                aes.destroy();
                aes = null;
            }
            chunks.push(databuf);
            index++;
            elmBtn.innerHTML = index+'/'+list.length;
        }
        if(!index) return;
        elmBtn.innerHTML = '下载完毕,手机的朋友,请在文件处导出到<b>QQ影音</b>进行播放';
        T.download('download.ts',new Blob(chunks,{type:'video/mp2t'}),'m3u8');
    }
    readPath(url){
        let urlInfo = new URL(url);
        this.origin = urlInfo.origin;

    }
    getPath(str, bool) {
        if (str.charAt(0) == '/' && str.charAt(1) != '/') {
            str = this.origin+str;
        } else if (str.indexOf('http') === 0 && bool) {
            this.readPath(str);
        }
        return str;
    }
}