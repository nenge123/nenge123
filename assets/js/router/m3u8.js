!(function(){
    let T = this;
    let {I,F} = T;
    let view = document.getElementsByName('view')[0];
    let downts = document.getElementsByName('downts')[0];
    const url = 'http://'+location.host.replace(':88','').replace(':4000','')+'/xiunobbs4/upload/cmvodurl/1/1.m3u8';
    document.getElementsByName('name')[0].value = url;
    T.css.addRule('#result div{margin:10px auto;margin: 10px auto;border: 1px dashed;padding: 10px 5px;}');
    view.on('pointerdown',async function(event){
        event.stopPropagation();
        event.preventDefault();
        if(this.disabled) return;
        if(!self.Hls){
            this.disabled = !0;
            await T.addLib('hls.light.min.zip');
            this.disabled = !1;
        }
        let url = document.getElementsByName('name')[0].value;
        if(this.disabled||!url ||!/m3u8$/.test(url))return;
        viewTS(url,this);
    });
    downts.on('pointerdown',async function(event){
        event.stopPropagation();
        event.preventDefault();
        let url = document.getElementsByName('name')[0].value;
        if(this.disabled||!url ||!/m3u8$/.test(url))return;
        new downTS(url,this);
    });
}).call(Nenge);
class downTS{
    constructor(url,elm){
        this.download(url,elm).catch(e=>alert(e));
    }
    async download(url,downts){
        const t = this;
        let ctrler;
        const list = [];
        const ATTR = {};
        if(!self.m3u8parser){            
            await T.addLib('m3u8-parser.zip');
            await T.addLib('aes-decryptor.zip');
        }
        this.readPath(url);
        if(!this.origin) return;
        let text = await T.ajax({ url, type: 'text' });
        if(!text) return;
        let parser = new m3u8parser(text);
        if (!parser.manifest.segments.length) {
            const data2 = parser.manifest.playlists;
            for(let item of parser.manifest.playlists){
                //if (item.attributes) Object.assign(ATTR, item.attributes);
                let nextParser = new m3u8parser(await T.ajax({ url: this.getPath(item.uri), type: 'text' }));
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
        let result = document.getElementById('result');
        let div =  result.insertBefore(document.createElement('div'),result.children[0]);
        div.innerHTML = '<p>'+url+'</p><p class="states">0/'+list.length+'</p>';
        let states = div.querySelector('.states');
        downts&&(downts.disabled = !0);
        let chunks = [];
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
            states.innerHTML = index+'/'+list.length;

        }
        downts&&(downts.disabled = !1);
        if(!index) return;
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
function viewTS(url,elm){
    let result = document.getElementById('result');
    let div =  result.insertBefore(document.createElement('div'),result.children[0]);
    let video = div.appendChild(document.createElement('video'));
    let btn = div.appendChild(document.createElement('button'));
    btn.innerHTML = '下载视频';
    video.controls = !0;
    var hls = new self.Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    video.hls = hls;
    btn.on('pointerdown',function(event){
        if(this.disabled) return;
        event.stopPropagation();
        event.preventDefault();
        this.disabled=!0;
        hls.download(null,(a,b)=>{
            //progress
            this.innerHTML = a+'/'+b;
        });
    });

}