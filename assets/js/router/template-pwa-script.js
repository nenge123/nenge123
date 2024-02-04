!(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self), factory(global));
})(this, function (exports) {
    function getResponse(name, data) {
        return new Response(new Blob([data]), {
            status: 200,
            headers: {
                'content-type': T.getMime(name),
                'content-length': data.size || data.byteLength || data.length
            }
        });
    }
    function creatElm(str){
        return document.createElement(str);
    }
    function append(a,b){
        return (a||document).appendChild(b);
    };
    function addend(a,str){
        return append(a,creatElm(str));
    };
    function getId(str){
        return document.getElementById(str);
    }
    Object.assign(exports, {
        SQL_str_query: 'SELECT * FROM `data` ',
        async TEMPLATE_INDEX(jsondata) {
            let elm = getId('page-result');
            let div = addend(elm,'div');
            const params = new URLSearchParams(location.search);
            const limit = jsondata.limit;
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
            const db = await openSQL(u8);
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
            sql = this.SQL_str_query + sql;
            let maxnum = db.fetchResult(sql.replace('*', 'count(*)'), sql_params);
            let navpage;
            if(maxnum){
                navpage = addend(div,'nav');
                let maxpage = Math.ceil(maxnum / limit);
                if(page>maxpage)page=maxpage;
                navpage.classList.add('nav-page');
                let maxlengh = 8;
                let url_params = new URLSearchParams();
                if (tag) {
                    url_params.set('tag', tag);
                    let sitenav = getId('site-nav');
                    if (sitenav) {
                        let a = addend(sitenav,'a');
                        a.href = 'index.html?tag=' + tag;
                        a.innerHTML = tag;
                    }
                }
                if (search) {
                    url_params.set('search', search);
                }
                let a_i = addend(navpage,'a');
                a_i.href = 'index.html?' + url_params.toString();
                a_i.innerHTML = '首页';
                if (page - 1 > 0) {
                    for (let i = page - 5; i <= page; i++) {
                        if (i < 1) continue;
                        let a = addend(navpage,'a');
                        url_params.set('page', i);
                        a.href = 'index.html?' + url_params.toString();
                        a.innerHTML = i;
                        if (i == page) a.classList.add('active');
                        maxlengh -= 1;
                    }
                }
                if (maxpage - page > 0) {
                    for (let i = page + 1; i <= maxpage; i++) {
                        let a = addend(navpage,'a');
                        url_params.set('page', i);
                        a.href = 'index.html?' + url_params.toString();
                        a.innerHTML = i;
                        maxlengh--;
                        if (maxlengh < 0) break;
                    }
                }
                let a_x = addend(navpage,'a');
                url_params.set('page', maxpage);
                a_x.href = 'index.html?' + url_params.toString();
                a_x.innerHTML = '尾页';
                let a_y = addend(navpage,'button');
                a_y.classList.add('active');
                a_y.innerHTML = '共' + maxnum + '条,' + maxpage + '页';
                append(div,navpage);

            }
            let datas = db.fetchArray(sql + ' limit ' + (page - 1) * limit + ',' + limit, sql_params);
            if (datas) {
                let ul = addend(elm,'ul');
                ul.classList.add('sql-item-list');
                Object.entries(datas).forEach(v => {
                    let li = addend(ul,'li');
                    let data = v[1];
                    let id = data['id'];
                    data['title'].replace(/[<>]/g, '');
                    li.setAttribute('title', data['title']);
                    let a = addend(li,'a');
                    a.href = 'player.html?id=' + id;
                    let img = new Image();
                    img.src = id + '.' + T.getExt(data['img']);
                    img.once('error', function () {
                        this.src = data['img'];
                    });
                    append(a,img);
                    if (search) {
                        data['title'] = data['title'].replace(search, '<b>' + search + '</b>');
                    }
                    let p = addend(a,'p');
                    p.innerHTML = data['title'];
                });
                append(div,ul);
                navpage&&append(div,navpage.cloneNode(true));
            }else{
                addend(div,'div').innerHTML = '当前页面没有数据,更换搜索关键字,或者返回上一页';
            }

            let tags = db.fetchArray('SELECT * FROM `type` order by `num` DESC');
            if (tags) {
                let h3 = addend(div,'h3');
                h3.innerHTML = '标签云';
                let nav = addend(elm,'nav');
                nav.classList.add('tag-list');
                Object.entries(tags).forEach(v => {
                    let a = addend(nav,'a');
                    let data = v[1];
                    a.href = 'index.html?tag=' + data['name'];
                    a.innerHTML = data['name'] + '<b>(' + data['num'] + ')</b>';
                });
                append(div,nav);
            }
            db.close();
            SQL._sqlite3_free();
            SQL._free();
            this.TEMPLATE_SEARCH(search, tag);
            getId('loading-page').remove();
        },
        async TEMPLATE_PLAYER(jsondata) {
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
            const db = await openSQL(u8);
            u8=null;
            const data = db.fetchFirst(TP.SQL_str_query + ' where `id` = ?', [id]);
            if (!data) {
                getId('div-player').remove();
                template.setError('数据不存在!或者数据尚未导入!');
                return;
            }
            let img = new Image();
            img.src = id + '.' + T.getExt(data['img']);
            img.once('error', function () {
                this.src = data['img'];
            });
            img.once('load', function () {
                T.css.addRule('#div-player>video{background-image:url(' + this.src + ');}');
            });
            let sitenav = getId('site-nav');
            if (sitenav) {
                let a = addend(sitenav,'a');
                a.href = '#';
                a.innerHTML = data['title'];
            }
            let video = document.querySelector('#div-player video');
            let player = document.querySelector('#div-player');
            let playerinfo = getId('player-info');
            let url = jsondata.path + '/' + data['id'] + '.m3u8';
            const cache = await caches.open(jsondata.cachename);
            let response = await cache.match(url);
            if (!response) {
                url = data['url'] || data['url2'];
                response = await fetch(data['url']).catch(e => null);
                if (response) {
                    response.body.cancel();
                } else {
                    player.hidden = !0;
                    playerinfo.innerHTML = '发生未知错误,无法为你播放!';
                    return;
                }
            } else {
                const arr = ['g.cdata.cc', 'strangetop.com', 'ovoxyz.com', 'c.9pvc.cc', 'b2.9pvc.cc', 'xuzx.xy', 'cdata2.xyz'];
                let eq = params.get('eq');
                if (eq != undefined) {
                    eq = parseInt(eq);
                    let re = arr[eq];
                    if (re) {
                        let text = await response.text();
                        text = text.replace(/7.cdata.cc/g, re);
                        url = URL.createObjectURL(new Blob([text], {
                            type: 'text/plain'
                        }));
                    }
                } else {
                    url = URL.createObjectURL(await response.blob());
                }
                let nav = addend(playerinfo,'nav');
                nav.classList.add('tag-list');
                for (let i = 0; i < arr.length + 1; i++) {
                    let a = addend(nav,'a');
                    if (i == 0) {
                        a.href = eq == undefined ? '#' : 'player.html?id=' + data['id'];
                    } else {
                        a.href = eq != undefined && i == eq + 1 ? '#' : 'player.html?id=' + data['id'] + '&eq=' + (i - 1);
                    }
                    a.innerHTML = '线路:' + (i + 1);
                }
            }
            let button = document.querySelector('#div-player button');
            button.setAttribute('data-url', url);
            button.once('click', async function () {
                if (this.disabled) return;
                this.disabled = !0;
                video.volume = 0.4;
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = this.getAttribute('data-url');
                    video.addEventListener('canplay', function () {
                      video.play();
                    });
                    let nav = addend(playerinfo,'nav');
                    nav.classList.add('tag-list');
                    let btn = addend(nav,'button');
                    btn.innerHTML = '下载视频';
                    btn.on('pointerdown',async  function (event) {
                        if (this.disabled) return;
                        this.disabled = !0;
                        event.stopPropagation();
                        event.preventDefault();
                        MyTemplate.downVideo(video.src,this);
                    });
                }else{
                    if (!self.Hls) {
                        await T.addLib('hls.light.min.zip', (a, b) => {
                            button.innerHTML = '播放组件加载进度:' + a + '/' + b;
                        });
                    }
                    if(exports.Hls.isSupported()){
                        const hls = new self.Hls();
                        hls.loadSource(this.getAttribute('data-url'));
                        hls.attachMedia(video);
                        hls.on(Hls.Events.MANIFEST_LOADED,function(){
                            let nav = addend(playerinfo,'nav');
                            nav.classList.add('tag-list');
                            let btn = addend(nav,'button');
                            btn.innerHTML = '下载视频';
                            btn.on('pointerdown', function (event) {
                                if (this.disabled) return;
                                event.stopPropagation();
                                event.preventDefault();
                                this.disabled = !0;
                                hls.download(title + '.ts', (a, b) => {
                                    this.innerHTML = a + '/' + b;
                                });
                            });
        
                        });
                        video.play();
                    }
                }
                player.classList.add('active');
                video.play();
            });
            let nav2 = addend(playerinfo,'nav');
            nav2.classList.add('tag-list');
            data['type'].split(',').forEach(v => {
                let a = addend(nav2,'a');
                a.innerHTML = v;
                a.href = 'index.html?tag=' + v;
            });
            this.TEMPLATE_SEARCH('');
            db.close();
            SQL._sqlite3_free();
            SQL._free();
            getId('loading-page').remove();
            getId('div-player').hidden = !1;
        },
        async TEMPLATE_INSTALL(jsondata, cache) {
            const TP = this;
            let result = getId('pwa-result');
            const setResult = (str, elm) => {
                if (!elm){
                    elm = result.insertBefore(creatElm('div'), result.children[0]);
                    elm.classList.add('wbox');
                }
                elm.innerHTML = str;
                return elm;
            };
            let path = jsondata.path;
            setResult('正在加载数据库');
            let sqlbuff = await T.FetchData(path + '/sql.dat');
            const db = await openSQL(sqlbuff);
            if (!sqlbuff) {
                setResult('初始化数据库');
                TP.TEMPLATE_CREAT_TABLE(db);
            } else {
                setResult('找到数据库');
            }
            sqlbuff = null;
            let maxID = db.fetchResult('SELECT max(`id`) FROM `data`') || 0;
            let maxSize = db.fetchResult('SELECT count(*) FROM `data`') || 0;
            setResult('当前数据记录:' + maxSize + '条');
            setResult('当前数据lastid:' + maxID);
            if (!cache) cache = await caches.open(jsondata.cachename);
            setResult('配置文件中含有数据:' + jsondata.data.map(v => v[2] + '<b>(' + v[0] + '-' + v[1] + ')</b>').join(','));
            await Promise.all(jsondata.data.map(async dataitem => {
                let zipli = setResult('读取' + dataitem[2]);
                if (maxID >= dataitem[1]) {
                    setResult(dataitem[2] + '可能已加载', zipli);
                    let btn = addend(zipli,'button');
                    btn.innerHTML = '重新写入';
                    btn.dataset.source = jsondata.url + '/' + dataitem[2];
                    btn.on('pointerup', async function () {
                        if (this.disabled) return;
                        this.disabled = !0;
                        const cache = await caches.open(jsondata.cachename);
                        let u8 = await T.FetchData(path + '/sql.dat');
                        const db = await openSQL(u8);
                        if (!u8) {
                            TP.TEMPLATE_CREAT_TABLE(db);
                        }
                        u8 = null;
                        await TP.TEMPLATE_INSTALL_DATA(this.dataset.source, db, cache, jsondata, (a, b, c, d) => {
                            if (b || c) {
                                this.innerHTML = c + '--' + d + ':' + (a * 100 / b).toFixed(0) + '%';
                            } else {
                                this.innerHTML = '写入:' + a;
                            }
                        });
                        db.close();
                        SQL._sqlite3_free();
                        SQL._free();
                    });
                    if (dataitem[3]) {
                        let btn2 = addend(zipli,'button');
                        btn2.innerHTML = '写入图片资源?';
                        btn2.dataset.source = jsondata.url + '/' + dataitem[3];
                        btn2.once('click', async function () {
                            this.remove();
                            await TP.TEMPLATE_LOAD_IMAGE(this.dataset.source, jsondata, cache);
                        });
                    }
                    return;
                }
                let waitText = dataitem.join('/');
                setResult(waitText + '读取中', zipli);
                await TP.TEMPLATE_INSTALL_DATA(jsondata.url + '/' + dataitem[2], db, cache, jsondata, (a, b, c, d) => {
                    if (b || c) {
                        zipli.innerHTML = waitText + ' ' + c + '--' + d + ':' + (a * 100 / b).toFixed(0) + '%';
                    } else {
                        zipli.innerHTML = waitText + '写入:' + a;
                    }
                }).catch(e => console.log(e));
                setResult(waitText + ' 记录完成', zipli);
                if (dataitem[3]) {
                    let btn2 = addend(zipli,'button');
                    btn2.innerHTML = '写入图片资源?';
                    btn2.dataset.source = jsondata.url + '/' + dataitem[3];
                    btn2.once('click', async function () {
                        this.remove();
                        await TP.TEMPLATE_LOAD_IMAGE(this.dataset.source, jsondata, cache);
                    });
                }
            }));
            db.close();
            SQL._sqlite3_free();
            SQL._free();
            let x = setResult('数据已同步,可以返回地址,亦可以进行本地导入:');
            x.classList.add('warn');
            let imgbtn2 = addend(x,'button');
            imgbtn2.innerHTML = '上传网盘中图片资源';
            imgbtn2.on('click', async function () {
                T.upload(async files =>TP.TEMPLATE_READ_IMAGE(files,jsondata,(a,b)=>setResult(a,b)));
            });
            let imgbtn3 = addend(x,'button');
            imgbtn3.innerHTML = '上传网盘中数据资源';
            imgbtn3.on('click', async function () {
                T.upload(async files =>TP.TEMPLATE_READ_DATA(files,jsondata,(a,b)=>setResult(a,b)));
            });
            if (jsondata.datasource) {
                jsondata.datasource.forEach(v => setResult('网盘中数据资源:' + v).classList.add('success'));
            }
        },
        async TEMPLATE_READ_DATA(files,jsondata,progress){
            const TP = this;
            const path = jsondata.path;
            const cache = await caches.open(jsondata.cachename);
            let u8 = await T.FetchData(path + '/sql.dat');
            const db = await openSQL(u8);
            if (!u8) {
                TP.TEMPLATE_CREAT_TABLE(db);
            }
            u8 = null;
            await Promise.all(I.toArr(files, async file => {
                let elm = progress&&progress(file.name + '解压中');
                return await TP.TEMPLATE_LOAD_DATA(await T.Decompress(file, (a, b, c) => {
                    progress&&progress(file.name + '解压进度' + (a * 100 / b).toFixed(0) + '%', elm);
                }, 'IAM18'), db, cache, jsondata, (a, b, c) => {
                    if(elm)elm.innerHTML = a;
                });
            }));
            db.close();
            SQL._sqlite3_free();
            SQL._free();
        },
        async TEMPLATE_READ_IMAGE(files,jsondata,progress){
            const TP = this;
            const path = jsondata.path;
            const cache = await caches.open(jsondata.cachename);
            return await Promise.all(I.toArr(files,async file => {
                let elm = progress&&progress(file.name + '解压中');
                return await TP.TEMPLATE_SAVE_IMAGE(T.Decompress(file, (a, b, c) => {
                    progress&&progress(file.name + '解压进度' + (a * 100 / b).toFixed(0) + '%', elm);
                }), jsondata);
            }));
        },
        async TEMPLATE_SAVE_IMAGE(data, jsondata, cache) {
            const TP = this;
            if (!cache) cache = await caches.open(jsondata.cachename);
            let path = jsondata.path;
            let result = getId('pwa-result');
            let elm = result&&result.insertBefore(creatElm('div'), result.children[0]);
            let num = 0;
            I.toArr(data, entry => {
                cache.put(path + '/' + entry[0], getResponse(...entry));
                if(elm)elm.innerHTML = T.getName(entry[0]) + '写入 ' + entry[0];
                num++;
            });
            if(elm)elm.innerHTML = '图片写入完成!共写入' + num + '条图片数据!';
        },
        async TEMPLATE_LOAD_IMAGE(url, jsondata, cache) {
            const TP = this;
            let result = getId('pwa-result');
            let elm = result.insertBefore(creatElm('div'), result.children[0]);
            return this.TEMPLATE_SAVE_IMAGE(await T.FetchData({
                url,
                unpack: !0,
                progress(a, b, c, d) {
                    elm.innerHTML = T.getName(url) + ' ' + d + (a * 100 / b).toFixed(0) + '%';
                },
                error() {
                    alert('地址可能不存在,无法写入')
                }
            }), jsondata, cache);
        },
        async TEMPLATE_INSTALL_DATA(url, db, cache, jsondata, progress, password) {
            const TP = this;
            let path = jsondata.path;
            this.TEMPLATE_LOAD_DATA(await T.FetchData({
                url,
                unpack: !0,
                password: password || 'IAM18',
                progress
            }), db, cache, jsondata, progress);
        },
        async TEMPLATE_LOAD_DATA(data, db, cache, jsondata, progress) {
            const TP = this;
            let path = jsondata.path;
            if (!cache) cache = await caches.open(jsondata.cachename);
            I.toArr(data, entry => {
                if (entry[0] == 'data.json') {
                    let sqldata = JSON.parse(I.decode(entry[1]));
                    I.toArr(sqldata, sqlitem => {
                        const itemdata = sqlitem[1];
                        let id = itemdata['id'];
                        progress && progress('记录 ' + id);
                        if (db.fetchFirst(TP.SQL_str_query + 'where `id` = ?', [id])) {
                            db.run('DELETE FROM `data` where `id` = ?', [id]);
                        }
                        db.run('INSERT INTO `data` VALUES (?,?,?,?,?,?,?);', Object.values(itemdata));
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
                    cache.put(path + '/sql.dat', getResponse('sql.dat', db.export()));
                } else {
                    progress && progress(entry[0]);
                    cache.put(path + '/' + entry[0], getResponse(...entry));
                }
            });
        },
        TEMPLATE_SEARCH(search, tag) {
            let sql_search = getId('page-search');
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
        },
        TEMPLATE_CREAT_TABLE(db){
            db.run('CREATE TABLE `data` (`id` int primary key,`title` char,`type` char,`url` char,`url2` char,`img` char,`source` char);');
            db.run('CREATE TABLE `type` (`name` char primary key,`num` int);');
        },
        TEMPLATE_UPDATE_BUTTON(template){
            let TP = this;
            template.setUpdate({
                '导入数据':function(e,jsondata){
                    if(this.disabled)return;
                    T.upload(async files=>{
                        this.disabled = !0;
                        let elm = T.$('#page-result');
                        let div;
                        if(elm){
                            div = elm.insertBefore(document.createElement('div'),elm.children[0]);
                        }
                        await TP.TEMPLATE_READ_DATA(files,jsondata,text=>{
                            div&&(div.innerHTML=text);
                        });
                        this.disabled = !1;
                        div.innerHTML = '写入完成,点击刷新';
                        div.once('click',function(){location.reload();});
                    });
                },
                '导入图片':function(e,jsondata){
                    if(this.disabled)return;
                    T.upload(async files=>{
                        this.disabled = !0;
                        await TP.TEMPLATE_READ_IMAGE(files,jsondata);
                        this.disabled = !1;
                    });
                }
            });
        }
    });
});