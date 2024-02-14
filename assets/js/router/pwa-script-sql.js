class template_script{
    constructor(jsondata,template){
        if(I.obj(jsondata))Object.assign(this,jsondata);
        if(template)this.template = template;
    }
    async loadSQL(progress){
        if(!this.SQL){
            await T.addLib('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js',progress,'1.10.2');
            await initSqlJs({
                wasmBinary:await T.getTable('libjs').fetch({
                    url:'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.wasm',
                    key:!0,
                    version:'1.10.2',
                    progress,
                })
            });
            let SQL = await initSqlJsPromise;
            SQL.wasmBinary = null;
            delete SQL.wasmBinary;
            Object.assign(SQL.Database.prototype,{
                fetchArray(sql,params){
                    let result = this.exec(sql,params);
                    if(result[0]){
                        let data = [];
                        for(let value of result[0].values){
                            data.push(Object.fromEntries(value.map((v,k)=>[result[0].columns[k],v])))
                        }
                        return data;
                    }
                },
                fetchFirst(sql,params){
                    let result = this.fetchArray(sql,params);
                    if(result&&result[0]){
                        return result[0];
                    }
                },
                fetchColumns(index,sql,params){
                    let result = Object.values(this.fetchFirst(sql,params)||[]);
                    if(result.length){
                        return result[index||0];
                    }
                },
                fetchResult(sql,params){
                    return this.fetchColumns(0,sql,params);
                }
            });
            this.SQL = SQL;
        }
        return this.SQL;
    }
    getResponse(name, data) {
        return new Response(new Blob([data]), {
            status: 200,
            headers: {
                'content-type': T.getMime(name),
                'content-length': data.size || data.byteLength || data.length
            }
        });
    }
    getParams(){
        let str = location.pathname.replace(this.path+'/','').split('?')[0].split('#')[0].split('.')[0];
        if(str.charAt(str.length-1)=='/'){
            str = str.slice(0,-1);
        }
        let params = new URLSearchParams(location.search);
        let index = 0;
        if(str.indexOf('/')!==-1){
            for(let value of str.split('/')){
                params.set(index,value);
                index++;
            }
        }else if(str.indexOf('-')!==-1){
            for(let value of T.getKey(str).split('-')){
                params.set(index,value);
                index++;
            }
        }
        if(params.get(0)){
            params.set('router',params.get(0));
        }else{
            params.set('router','index');
        }
        if(I.int(params.get(1))){
            params.set('id',params.get(1));
        }
        return params;
    }
    creatElm(str){
        return document.createElement(str);
    }
    append(a,b,bool){
        if(I.str(b))b=this.creatElm(b);
        if(bool)return (a||document).insertBefore(b,(a||document).children[0])
        return (a||document).appendChild(b);
    }
    sql_query = 'SELECT * FROM `data` ';
    sql_columns = ['id','title','type','url','img'];
    sql_creat_table(db){
        db.run('CREATE TABLE `data` (`id` int primary key,`title` char,`type` char,`url` char,`img` char);');
        db.run('CREATE TABLE `type` (`name` char primary key,`num` int);');
    }
    sql_setValue(data){
        let values = [];
        for(let key of this.sql_columns){
            values.push(data[key]||'');
        }
        return values;
    }
    sql_getInsertTxt(){
        let str1=[],str2=[];
        for(let key of this.sql_columns){
            str1.push('`'+key+'`');
            str2.push('?');
        }
        return 'INSERT INTO `data` ('+str1.join(',')+') VALUES ('+str2.join(',')+');'
    }
    async init(cache){
        const TP = this;
        const result = TP.template.elm_content;
        const setResult = (str, elm) => {
            if (!elm){
                elm = result.insertBefore(this.creatElm('div'), result.children[0]);
                elm.classList.add('wbox');
            }
            elm.innerHTML = str;
            return elm;
        };
        let sqlElm = setResult('加载SQL.JS');
        await this.loadSQL((a,b)=>{setResult('SQL.js 下载 '+(a*100/b).toFixed(0)+'%',sqlElm);});
        setResult('SQL.js已加载 https://github.com/sql-js/sql.js',sqlElm);
        const {path,cachename,data,url,datasource} = this;
        setResult('正在加载数据库');
        let sqlbuff = await T.FetchData(path + '/sql.dat');
        const db = new TP.SQL.Database(sqlbuff);
        if (!sqlbuff) {
            setResult('初始化数据库');
            TP.sql_creat_table(db);
        } else {
            setResult('找到数据库');
        }
        sqlbuff = null;
        let maxID = db.fetchResult('SELECT max(`id`) FROM `data`') || 0;
        let maxSize = db.fetchResult('SELECT count(*) FROM `data`') || 0;
        setResult('当前数据记录:' + maxSize + '条');
        setResult('当前数据lastid:' + maxID);
        setResult('配置文件中含有数据:' + data.map(v => v[2] + '<b>(' + v[0] + '-' + v[1] + ')</b>').join(','));
        if (datasource) {
            datasource.forEach(v => setResult('网盘中数据资源:' + v).classList.add('success'));
        }
        if (!cache) cache = await caches.open(cachename);
        for(const dataitem of data){
            let zipli = setResult('读取' + dataitem[2]);
            if (maxID >= dataitem[1]) {
                setResult(dataitem[2] + '可能已加载', zipli);
                let btn = TP.append(zipli,'button');
                btn.innerHTML = '重新写入';
                btn.dataset.source = url + '/' + dataitem[2];
                btn.on('pointerup', async function () {
                    if (this.disabled) return;
                    this.disabled = !0;
                    const cache = await caches.open(cachename);
                    let u8 = await T.FetchData(path + '/sql.dat');
                    const db = new TP.SQL.Database(u8);
                    if (!u8) {
                        TP.sql_creat_table(db);
                    }
                    u8 = null;
                    await TP.installData(this.dataset.source, db, cache, (a, b, c, d) => {
                        if (b || c) {
                            this.innerHTML = c + '--' + d + ':' + (a * 100 / b).toFixed(0) + '%';
                        } else {
                            this.innerHTML = '写入:' + a;
                        }
                    });
                    db.close();
                    TP.SQL._sqlite3_free();
                    TP.SQL._free();
                });
                /*
                if (dataitem[3]) {
                    let btn2 = TP.append(zipli,'button');
                    btn2.innerHTML = '写入图片资源?';
                    btn2.dataset.source = url + '/' + dataitem[3];
                    btn2.once('click', async function () {
                        this.remove();
                        await TP.loadImage(this.dataset.source, cache);
                    });
                }
                */
                continue;
            }
            let waitText = dataitem.join('/');
            setResult(waitText + '读取中', zipli);
            await TP.installData(url + '/' + dataitem[2], db, cache, (a, b, c, d) => {
                if (b || c) {
                    zipli.innerHTML = waitText + ' ' + c + '--' + d + ':' + (a * 100 / b).toFixed(0) + '%';
                } else {
                    zipli.innerHTML = waitText + '写入:' + a;
                }
            }).catch(e => console.log(e));
            setResult(waitText + ' 记录完成', zipli);
            /*
            if (dataitem[3]) {
                let btn2 = TP.append(zipli,'button');
                btn2.innerHTML = '写入图片资源?';
                btn2.dataset.source = url + '/' + dataitem[3];
                btn2.once('click', async function () {
                    this.remove();
                    await TP.loadImage(this.dataset.source, cache);
                });
            }
            */

        }
        db.close();
        TP.SQL._sqlite3_free();
        TP.SQL._free();
        console.log(555);
        let x = setResult('数据已同步,可以返回地址,亦可以进行本地导入:');
        x.classList.add('warn');
        /*
        let imgbtn2 = TP.append(x,'button');
        imgbtn2.innerHTML = '上传网盘中图片资源';
        imgbtn2.on('click', async function () {
            T.upload(async files =>TP.readImge(files,(a,b)=>setResult(a,b)));
        });
        */
        let imgbtn3 = TP.append(x,'button');
        imgbtn3.innerHTML = '上传网盘中数据资源';
        imgbtn3.on('click', async function () {
            T.upload(async files =>TP.readData(files,(a,b)=>setResult(a,b)));
        });
    }
    async installData(url, db, cache, progress, password) {
        const TP = this;
        let path = TP.path;
        this.loadData(await T.FetchData({
            url,
            unpack: !0,
            password: password || 'IAM18',
            progress
        }), db, cache, progress);
    }
    async loadData(data, db, cache, progress) {
        const TP = this;
        let path = TP.path;
        if (!cache) cache = await caches.open(TP.cachename);
        const sqlstr = TP.sql_getInsertTxt();
        I.toArr(data, entry => {
            if (/\.json$/.test(entry[0])) {
                let sqldata = JSON.parse(I.decode(entry[1]));
                I.toArr(sqldata, sqlitem => {
                    const itemdata = sqlitem[1];
                    let id = itemdata['id'];
                    I.fn(progress)&& progress('记录 ' + id);
                    if (db.fetchFirst(TP.sql_query + 'where `id` = ?', [id])) {
                        db.run('DELETE FROM `data` where `id` = ?', [id]);
                    }
                    db.run(sqlstr,TP.sql_setValue(itemdata));
                    if (itemdata['type']) {
                        itemdata['type'].split(',').forEach(v2 => {
                            if (v2) {
                                if (db.fetchResult('SELECT * FROM `type` where `name`= ? ', [v2])) {
                                    db.run('update `type` set `num` = `num`+1 where `name` = ?', [v2]);
                                } else {
                                    db.run('INSERT INTO `type` VALUES (?,?);', [v2, 1]);
                                }
                            }
                        });
                    }
                });
                cache.put(path + '/sql.dat', TP.getResponse('sql.dat', db.export()));
            } else {
                I.fn(progress) && progress(entry[0]);
                cache.put(path + '/' + entry[0], TP.getResponse(...entry));
            }
        });
    }
    async loadImage(url, cache) {
        const TP = this;
        const template = TP.template;
        let result = template.elm_content;
        let elm = result.insertBefore(TP.creatElm('div'), result.children[0]);
        return this.saveImage(await T.FetchData({
            url,
            unpack: !0,
            progress(a, b, c, d) {
                elm.innerHTML = T.getName(url) + ' ' + d + (a * 100 / b).toFixed(0) + '%';
            },
            error() {
                alert('地址可能不存在,无法写入')
            }
        }), cache);
    }
    async saveImage(data, cache) {
        const TP = this;
        if (!cache) cache = await caches.open(TP.cachename);
        let path = TP.path;
        const template = TP.template;
        let result = template.elm_content;
        let elm = result&&result.insertBefore(TP.creatElm('div'), result.children[0]);
        let num = 0;
        I.toArr(data, entry => {
            cache.put(path + '/' + entry[0], TP.getResponse(...entry));
            if(elm)elm.innerHTML = T.getName(entry[0]) + '写入 ' + entry[0];
            num++;
        });
        if(elm)elm.innerHTML = '图片写入完成!共写入' + num + '条图片数据!';
    }
    async readImge(files,progress){
        const TP = this;
        const path = TP.path;
        const cache = await caches.open(TP.cachename);
        return await Promise.all(I.toArr(files,async file => {
            let elm = I.fn(progress)&&progress(file.name + '解压中');
            return await TP.saveImage(T.Decompress(file, (a, b, c) => {
                I.fn(progress)&&progress(file.name + '解压进度' + (a * 100 / b).toFixed(0) + '%', elm);
            },'IAM18',!0));
        }));
    }
    async readData(files,progress){
        const TP = this;
        const path = TP.path;
        const cache = await caches.open(TP.cachename);
        let u8 = await T.FetchData(path + '/sql.dat');
        const db = new TP.SQL.Database(u8);
        if (!u8) {
            TP.sql_creat_table(db);
        }
        u8 = null;
        await Promise.all(I.toArr(files, async file => {
            let elm = I.fn(progress)&&progress(file.name + '解压中');
            return await TP.loadData(
                await T.Decompress(file, (a, b, c) => {
                    elm&&(elm.innerHTML= c+' ' + (a * 100 / b).toFixed(0) + '%', elm);
                }, 'IAM18',!0),
                db,
                cache,
                TP,
                (a, b, c) => {
                    if(elm)elm.innerHTML = a;
                });
        }));
        db.close();
        TP.SQL._sqlite3_free();
        TP.SQL._free();
    }
    async template_index(){
        const TP = this;
        const template = TP.template;
        let elm = template.elm_content;
        let div = TP.append(elm,'div');
        const params = TP.getParams();
        const limit = TP.limit;
        T.css.Elm2Rule(elm, 'padding:10px');
        let page = parseInt(params.get('id') || 1);
        if(!page)page = 1;
        let tag = params.get('tag');
        let search = params.get('search');
        let order = params.get('order');
        let u8 = await T.FetchData(TP.path+'/sql.dat');
        if(!u8){
            template.setError('数据库不存在!');
            return;
        }
        await TP.loadSQL((a,b)=>template.setError('sql.js '+(a*100/b).toFixed(0)+'%'));
        const db = new TP.SQL.Database(u8);
        u8=null;
        let sql = [];
        let sql_params = [];
        if (tag) {
            sql.push('`type` like ? ');
            sql_params.push('%' + tag + '%');
        }
        if (search) {
            sql.push('`title` like ? ');
            sql_params.push('%' + search.trim().replace(/s*/g, '%') + '%');
        }
        if (sql.length) {
            sql = ' where ' + sql.join(' and ');
        }
        sql += ' order by `id` ' + (order && order == 'asc' ? 'ASC' : 'DESC');
        sql = TP.sql_query + sql;
        let maxnum = db.fetchResult(sql.replace('*', 'count(*)'), sql_params);
        let navpage;
        if(maxnum){
            navpage = TP.append(div,'nav');
            let maxpage = Math.ceil(maxnum / limit);
            if(page>maxpage)page=maxpage;
            navpage.classList.add('nav-page');
            let url_params = new URLSearchParams();
            if (tag) {
                url_params.set('tag', tag);
                let sitenav = template.elm_nav;
                if (sitenav) {
                    let a = TP.append(sitenav,'a');
                    a.href = TP.path+'/index.html?tag=' + tag;
                    a.innerHTML = tag;
                }
            }
            if (search) {
                url_params.set('search', search);
            }
            
            let page_index = TP.append(navpage,'a');
            page_index.href = TP.path+'/index.html?' + url_params.toString();
            page_index.innerHTML = '顶页';
            if(page<=1)page_index.classList.add('active');
            let maxlengh = 8;
            let leftpage = document.createDocumentFragment();
            let RightPage = document.createDocumentFragment();
            for(let i=0;i<=8;i++){
                if(i==0||page+i<maxpage){
                    if(page+i==maxpage||page+i==1){
                        continue;
                    }
                    let a = TP.append(RightPage,'a');
                    a.href = TP.path+'/index-'+(page+i)+'.html?' + url_params.toString();
                    a.innerHTML = page+i;
                    if(i==0)a.classList.add('active');
                    maxlengh--;
                }
                if (maxlengh < 0) break;
                if(i>0&&page-i>1){
                    let a = TP.append(leftpage,'a',!0);
                    a.href = TP.path+'/index-'+(page-i)+'.html?' + url_params.toString();
                    a.innerHTML = page-i;
                    maxlengh--;
                }
                if (maxlengh < 0) break;
            }
            TP.append(navpage,leftpage);
            TP.append(navpage,RightPage);
            let page_end = TP.append(navpage,'a');
            page_end.href = TP.path+'/index-'+maxpage+'.html?' + url_params.toString();
            page_end.innerHTML = '尾页';
            if (page>=maxpage) page_end.classList.add('active');
            let page_count = TP.append(navpage,'button');
            page_count.classList.add('active');
            page_count.innerHTML = '共' + maxnum + '条,' + maxpage + '页';
            TP.append(div,navpage);

        }
        let datas = db.fetchArray(sql + ' limit ' + (page - 1) * limit + ',' + limit, sql_params);
        if (datas) {
            let ul = TP.append(elm,'ul');
            ul.classList.add('sql-item-list');
            Object.entries(datas).forEach(v => {
                let li = TP.append(ul,'li');
                let data = v[1];
                let id = data['id'];
                data['title'].replace(/[<>]/g, '');
                li.setAttribute('title', data['title']);
                let a = TP.append(li,'a');
                a.href = TP.path+'/player-'+id+'.html';
                let img = new Image();
                img.src = data.img;
                /*
                img.src = id + '.' + T.getExt(data['img']);
                img.once('error', function () {
                    this.src = data['img'];
                });
                */
                TP.append(a,img);
                if (search) {
                    data['title'] = data['title'].replace(search, '<b>' + search + '</b>');
                }
                let p = TP.append(a,'p');
                p.innerHTML = data['title'];
            });
            TP.append(div,ul);
            navpage&&TP.append(div,navpage.cloneNode(true));
        }else{
            TP.append(div,'div').innerHTML = '当前页面没有数据,更换搜索关键字,或者返回上一页';
        }

        let tags = db.fetchArray('SELECT * FROM `type` order by `num` DESC');
        if (tags) {
            let h3 = TP.append(div,'h3');
            h3.innerHTML = '标签云';
            let nav = TP.append(elm,'nav');
            nav.classList.add('tag-list');
            Object.entries(tags).forEach(v => {
                let a = TP.append(nav,'a');
                let data = v[1];
                a.href = TP.path+'/index.html?tag=' + data['name'];
                a.innerHTML = data['name'] + '<b>(' + data['num'] + ')</b>';
            });
            TP.append(div,nav);
        }
        db.close();
        TP.SQL._sqlite3_free();
        TP.SQL._free();
        this.setSearch(search, tag);
        template.elm_loading.remove();
    }
    async template_player(){
        let TP = this;
        const template = TP.template;
        const params = TP.getParams();
        let id = parseInt(params.get('id'));
        if (!id) {
            location.href = 'index.html';
        }
        let u8 = await T.FetchData(TP.path+'/sql.dat');
        if(!u8){
            template.setError('数据库不存在!');
            return;
        }
        await TP.loadSQL((a,b)=>template.setError('sql.js '+(a*100/b).toFixed(0)+'%'));
        const db = new TP.SQL.Database(u8);
        u8=null;
        const data = db.fetchFirst(TP.sql_query + ' where `id` = ?', [id]);
        if (!data) {
            template.setError('数据不存在!或者数据尚未导入!5秒后返回主页!');
            setTimeout(()=>location.href=TP.path+'/index.html',5000);
            return;
        }
        if(!data.url){
            data.url = TP.path + '/' + data['id'] + '.m3u8';
        }
        const title = data.title;
        let img = new Image();
        img.src=data['img'];;
        /*
        img.src = id + '.' + T.getExt(data['img']);
        img.once('error', function () {
            this.src = data['img'];
        });
        */
        img.once('load', function () {
            T.css.addRule('.div-player>video{background-image:url(' + this.src + ');}');
        });
        let sitenav = template.elm_nav;
        if (sitenav) {
            let a = TP.append(sitenav,'a');
            a.href = '#';
            a.innerHTML = title;
        }
        const cache = await caches.open(TP.cachename);
        await I.Async(I.toArr(data.url.split(','),async (url,keyindex)=>{
            let player = TP.creatElm('div');
            TP.append(player,'h2').innerHTML = '第'+(keyindex+1)+'集';
            let video = TP.append(player,'video');
            let button = TP.append(player,'button');
            let playerinfo = TP.append(player,'div');
            player.classList.add('div-player');
            video.controls = !0;
            button.innerHTML = '&#61802;';
            if(url.indexOf(TP.path)!==-1){
                let response = await cache.match(url);
                if (!response) {
                    response = await fetch(data['url'],{method:'HEAD'}).catch(e => null);
                    if (!response) {
                        player.innerHTML = '发生未知错误,无法为你播放!';
                        return;
                    }
                } else {
                    let text = await response.text();
                    if(text.indexOf('7.cdata.cc')!==-1){
                        data.url = await TP.replaceURL(text,playerinfo,params,data)||data.url;
                    }
                }
            }
            button.setAttribute('data-url', data.url);
            button.once('click', async function () {
                if (this.disabled) return;
                this.disabled = !0;
                video.volume = 0.4;
                TP.append(playerinfo,'h3').innerHTML = '更多操作';
                let nav = TP.append(playerinfo,'nav');
                nav.classList.add('tag-list');
                let btn = TP.append(nav,'button');
                btn.innerHTML = '下载视频';
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = this.getAttribute('data-url');
                    video.addEventListener('canplay', function () {
                    video.play();
                    });
                    btn.on('pointerdown',async  function (event) {
                        if (this.disabled) return;
                        this.disabled = !0;
                        event.stopPropagation();
                        event.preventDefault();
                        template.downVideo(video.src,this);
                    });
                }else{
                    if (!self.Hls) {
                        await T.addLib('https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.4/hls.min.js', (a, b) => {
                            button.innerHTML = '播放组件加载进度:' + a + '/' + b;
                        },'1.5.4');
                    }
                    if(Hls.isSupported()){
                        const hls = new self.Hls();
                        player.hls = hls;
                        hls.loadSource(this.getAttribute('data-url'));
                        hls.attachMedia(video);
                        btn.on('pointerdown', async function (event) {
                            event.stopPropagation();
                            event.preventDefault();
                            if(!hls.bufferController.details)return ;
                            let fragments = hls.bufferController.details.fragments;
                            if(!fragments.length) return;
                            if (this.disabled) return;
                            this.disabled = !0;
                            let BTN = this;
                            let response = new Response(new ReadableStream({
                                async start(ctrler) {
                                    let index=0;
                                    for await(let frag of fragments) {
                                        let baseurl = frag.baseurl;
                                        let relurl = frag.relurl;
                                        if(relurl.charAt(0)=='/'){
                                            relurl = new URL(baseurl).origin+relurl;
                                        }else{
                                            relurl = baseurl.split('/').slice(0,-1).join('/')+'/'+relurl;
                                        }
                                        let buf = await T.FetchData(relurl);
                                        if (frag.levelkeys) {
                                            let info = await hls.streamController.keyLoader.load(frag);
                                            let keyData = info.keyInfo.decryptdata;
                                            buf = I.toU8(await hls.streamController.decrypter.decrypt(buf, keyData.key.buffer,keyData.iv.buffer));
                                        }
                                        ctrler.enqueue(buf);
                                        index++;
                                        BTN.innerHTML = index+'/'+fragments.length;
                                    }
                                    ctrler.close();
                                }
                            }));
                            response&&response.blob().then(async blob=> {
                                let a = document.createElement('a');
                                a.href = URL.createObjectURL(blob);
                                a.download = title+'.ts';
                                a.click();
                                a.remove();
                            });
                        });
                        video.play();
                    }
                }
                video.play();
                this.remove();
            });
            TP.append(template.elm_content,player);
        }));
        TP.append(template.elm_content,'h3').innerHTML = '标签';
        let nav2 = TP.append(template.elm_content,'nav');
        nav2.classList.add('tag-list');
        data['type'].split(',').forEach(v => {
            let a = TP.append(nav2,'a');
            a.innerHTML = v;
            a.href = 'index.html?tag=' + v;
        });
        this.setSearch();
        db.close();
        TP.SQL._sqlite3_free();
        TP.SQL._free();
        template.elm_loading.remove();

    }
    setSearch(search, tag) {
        const TP = this;
        let sql_search = this.template.elm_search;
        if (sql_search) {
            let sql_search_input = sql_search.querySelector('input');
            let sql_search_btn = sql_search.querySelector('button');
            if (search) {
                sql_search_input.value = decodeURIComponent(search);
            }
            sql_search_input.on('change', function () {
                sql_search_btn.click();
            });
            sql_search_btn.on('click', function () {
                if (!sql_search_input.value) {
                    location.href = 'index.html?' + (new URLSearchParams({
                        tag: tag || ''
                    })).toString();
                    return;
                }
                location.href = 'index.html?' + (new URLSearchParams({
                    search: sql_search_input.value,
                    tag: tag || ''
                })).toString();
            });
        }
    }
    getAaction(template){
        let TP = this;
        template.setUpdate({
            '导入数据':function(e){
                if(this.disabled)return;
                T.upload(async files=>{
                    this.disabled = !0;
                    let elm = T.$('#page-result');
                    let div;
                    if(elm){
                        div = elm.insertBefore(document.createElement('div'),elm.children[0]);
                    }
                    await TP.readData(files,text=>{
                        div&&(div.innerHTML=text);
                        return div;
                    });
                    this.disabled = !1;
                    div.innerHTML = '写入完成,点击刷新';
                    div.once('click',function(){location.reload();});
                });
            },
            /*
            '导入图片':function(e){
                if(this.disabled)return;
                T.upload(async files=>{
                    this.disabled = !0;
                    await TP.readImge(files);
                    this.disabled = !1;
                });
            }
            */
        });
    }
    async replaceURL(text,playerinfo,params,data){
        const TP = this;
        let url;
        const arr = ['g.cdata.cc', 'strangetop.com', 'ovoxyz.com', 'c.9pvc.cc', 'b2.9pvc.cc', 'xuzx.xy', 'cdata2.xyz'];
        let eq = params.get('eq');
        if (eq != undefined) {
            eq = parseInt(eq);
            let re = arr[eq];
            if (re) {
                text = text.replace(/7.cdata.cc/g, re);
                url = URL.createObjectURL(new Blob([text], {
                    type: 'text/plain'
                }));
            }
        }
        let nav = TP.append(playerinfo,'nav');
        nav.classList.add('tag-list');
        for (let i = 0; i < arr.length + 1; i++) {
            let a = TP.append(nav,'a');
            if (i == 0) {
                a.href = eq == undefined ? '#' : TP.path+'/player-'+data['id']+'.html';
            } else {
                a.href = eq != undefined && i == eq + 1 ? '#' : TP.path+'/player-'+data['id']+'.html?eq=' + (i - 1);
            }
            a.innerHTML = '线路:' + (i + 1);
        }
        return url;
    }
}