class pwa_script{
    constructor(jsondata){
        if(I.obj(jsondata))Object.assign(this,jsondata);

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
    getId(str){
        return document.getElementById(str);
    }
    creatElm(str){
        return document.createElement(str);
    }
    append(a,b){
        if(I.str(b))b=this.creatElm(b);
        return (a||document).appendChild(b);
    }
    addend(a,str){
        return this.append(a,this.creatElm(str));
    }
    sql_query = 'SELECT * FROM `data` ';
    sql_columns = ['id','title','type','url','url2','img'];
    sql_creat_table(db){
        db.run('CREATE TABLE `data` (`id` int primary key,`title` char,`type` char,`url` char,`url2` char,`img` char);');
        db.run('CREATE TABLE `type` (`name` char primary key,`num` int);');
    }
    sql_setValue(data){
        let values = [];
        for(let key of this.sql_columns){
            values.push(data[key]||'');
        }
        return values;
    }
    async init(result,cache){
        const TP = this;
        console.log(this,result);
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
                let btn = TP.addend(zipli,'button');
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
                if (dataitem[3]) {
                    let btn2 = TP.addend(zipli,'button');
                    btn2.innerHTML = '写入图片资源?';
                    btn2.dataset.source = url + '/' + dataitem[3];
                    btn2.once('click', async function () {
                        this.remove();
                        await TP.loadImage(this.dataset.source, cache);
                    });
                }
                return;
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
            if (dataitem[3]) {
                let btn2 = TP.addend(zipli,'button');
                btn2.innerHTML = '写入图片资源?';
                btn2.dataset.source = url + '/' + dataitem[3];
                btn2.once('click', async function () {
                    this.remove();
                    await TP.loadImage(this.dataset.source, cache);
                });
            }

        }
        db.close();
        TP.SQL._sqlite3_free();
        TP.SQL._free();
        let x = setResult('数据已同步,可以返回地址,亦可以进行本地导入:');
        x.classList.add('warn');
        let imgbtn2 = TP.addend(x,'button');
        imgbtn2.innerHTML = '上传网盘中图片资源';
        imgbtn2.on('click', async function () {
            T.upload(async files =>TP.readImge(files,(a,b)=>setResult(a,b)));
        });
        let imgbtn3 = TP.addend(x,'button');
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
                    db.run('INSERT INTO `data` VALUES ('+new Array(TP.sql_columns.length).fill('?').join(',')+');',TP.sql_setValue(itemdata));
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
        let result = TP.getId('pwa-result');
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
        let result = TP.getId('pwa-result');
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
    async index_page(template){
        const TP = this;
        let elm = TP.getId('page-result');
        let div = TP.addend(elm,'div');
        const params = new URLSearchParams(location.search);
        const limit = TP.limit;
        T.css.Elm2Rule(elm, 'padding:10px');
        let page = parseInt(params.get('page') || 1) || 1;
        let tag = params.get('tag');
        let search = params.get('search');
        let order = params.get('order');
        let u8 = await T.FetchData('sql.dat');
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
            navpage = TP.addend(div,'nav');
            let maxpage = Math.ceil(maxnum / limit);
            if(page>maxpage)page=maxpage;
            navpage.classList.add('nav-page');
            let maxlengh = 8;
            let url_params = new URLSearchParams();
            if (tag) {
                url_params.set('tag', tag);
                let sitenav = TP.getId('site-nav');
                if (sitenav) {
                    let a = TP.addend(sitenav,'a');
                    a.href = 'index.html?tag=' + tag;
                    a.innerHTML = tag;
                }
            }
            if (search) {
                url_params.set('search', search);
            }
            let a_i = TP.addend(navpage,'a');
            a_i.href = 'index.html?' + url_params.toString();
            a_i.innerHTML = '顶页';
            if (page - 1 > 0) {
                for (let i = page - 5; i <= page; i++) {
                    if (i < 1) continue;
                    let a = TP.addend(navpage,'a');
                    url_params.set('page', i);
                    a.href = 'index.html?' + url_params.toString();
                    a.innerHTML = i;
                    if (i == page) a.classList.add('active');
                    maxlengh -= 1;
                }
            }
            if (maxpage - page > 0) {
                for (let i = page + 1; i <= maxpage; i++) {
                    let a = TP.addend(navpage,'a');
                    url_params.set('page', i);
                    a.href = 'index.html?' + url_params.toString();
                    a.innerHTML = i;
                    maxlengh--;
                    if (maxlengh < 0) break;
                }
            }
            let a_x = TP.addend(navpage,'a');
            url_params.set('page', maxpage);
            a_x.href = 'index.html?' + url_params.toString();
            a_x.innerHTML = '尾页';
            let a_y = TP.addend(navpage,'button');
            a_y.classList.add('active');
            a_y.innerHTML = '共' + maxnum + '条,' + maxpage + '页';
            TP.append(div,navpage);

        }
        let datas = db.fetchArray(sql + ' limit ' + (page - 1) * limit + ',' + limit, sql_params);
        if (datas) {
            let ul = TP.addend(elm,'ul');
            ul.classList.add('sql-item-list');
            Object.entries(datas).forEach(v => {
                let li = TP.addend(ul,'li');
                let data = v[1];
                let id = data['id'];
                data['title'].replace(/[<>]/g, '');
                li.setAttribute('title', data['title']);
                let a = TP.addend(li,'a');
                a.href = 'player.html?id=' + id;
                let img = new Image();
                img.src = id + '.' + T.getExt(data['img']);
                img.once('error', function () {
                    this.src = data['img'];
                });
                TP.append(a,img);
                if (search) {
                    data['title'] = data['title'].replace(search, '<b>' + search + '</b>');
                }
                let p = TP.addend(a,'p');
                p.innerHTML = data['title'];
            });
            TP.append(div,ul);
            navpage&&TP.append(div,navpage.cloneNode(true));
        }else{
            TP.addend(div,'div').innerHTML = '当前页面没有数据,更换搜索关键字,或者返回上一页';
        }

        let tags = db.fetchArray('SELECT * FROM `type` order by `num` DESC');
        if (tags) {
            let h3 = TP.addend(div,'h3');
            h3.innerHTML = '标签云';
            let nav = TP.addend(elm,'nav');
            nav.classList.add('tag-list');
            Object.entries(tags).forEach(v => {
                let a = TP.addend(nav,'a');
                let data = v[1];
                a.href = 'index.html?tag=' + data['name'];
                a.innerHTML = data['name'] + '<b>(' + data['num'] + ')</b>';
            });
            TP.append(div,nav);
        }
        db.close();
        TP.SQL._sqlite3_free();
        TP.SQL._free();
        this.setSearch(search, tag);
        TP.getId('loading-page').remove();
    }
    async player_page(template){
        let TP = this;
        const params = new URLSearchParams(location.search);
        let id = parseInt(params.get('id'));
        if (!id) {
            location.href = 'index.html';
        }
        let u8 = await T.FetchData('sql.dat');
        if(!u8){
            template.setError('数据库不存在!');
            return;
        }
        await TP.loadSQL((a,b)=>template.setError('sql.js '+(a*100/b).toFixed(0)+'%'));
        const db = new TP.SQL.Database(u8);
        u8=null;
        const data = db.fetchFirst(TP.sql_query + ' where `id` = ?', [id]);
        if (!data) {
            template.setError('数据不存在!或者数据尚未导入!');
            return;
        }
        if(!data.url){
            data.url = TP.path + '/' + data['id'] + '.m3u8';
        }
        const title = data.title;
        let img = new Image();
        img.src = id + '.' + T.getExt(data['img']);
        img.once('error', function () {
            this.src = data['img'];
        });
        img.once('load', function () {
            T.css.addRule('.div-player>video{background-image:url(' + this.src + ');}');
        });
        let sitenav = TP.getId('site-nav');
        if (sitenav) {
            let a = TP.addend(sitenav,'a');
            a.href = '#';
            a.innerHTML = title;
        }
        const cache = await caches.open(TP.cachename);
        await I.Async(I.toArr(data.url.split(','),async url=>{
            let player = TP.creatElm('div');
            let video = TP.append(player,TP.creatElm('video'));
            let button = TP.append(player,TP.creatElm('button'));
            let playerinfo = TP.append(player,TP.creatElm('div'));
            player.classList.add('div-player');
            video.controls = !0;
            button.innerHTML = '&#61802;';
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
            button.setAttribute('data-url', data.url);
            button.once('click', async function () {
                if (this.disabled) return;
                this.disabled = !0;
                video.volume = 0.4;
                let nav = TP.addend(playerinfo,'nav');
                nav.classList.add('tag-list');
                let btn = TP.addend(nav,'button');
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
            TP.append(TP.getId('page_result'),player);
        }));
        let nav2 = TP.append(TP.getId('page_result'),'nav');
        nav2.classList.add('tag-list');
        data['type'].split(',').forEach(v => {
            let a = TP.addend(nav2,'a');
            a.innerHTML = v;
            a.href = 'index.html?tag=' + v;
        });
        this.setSearch();
        db.close();
        TP.SQL._sqlite3_free();
        TP.SQL._free();
        TP.getId('loading-page').remove();

    }
    setSearch(search, tag) {
        const TP = this;
        let sql_search = TP.getId('page-search');
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
            '导入图片':function(e){
                if(this.disabled)return;
                T.upload(async files=>{
                    this.disabled = !0;
                    await TP.readImge(files);
                    this.disabled = !1;
                });
            }
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
        let nav = TP.addend(playerinfo,'nav');
        nav.classList.add('tag-list');
        for (let i = 0; i < arr.length + 1; i++) {
            let a = TP.addend(nav,'a');
            if (i == 0) {
                a.href = eq == undefined ? '#' : 'player.html?id=' + data['id'];
            } else {
                a.href = eq != undefined && i == eq + 1 ? '#' : 'player.html?id=' + data['id'] + '&eq=' + (i - 1);
            }
            a.innerHTML = '线路:' + (i + 1);
        }
        return url;
    }
}