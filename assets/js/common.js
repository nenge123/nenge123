/**
 * @author Nenge<m@nenge.net>
 * @copyright Nenge.net
 * @license GPL
 * @link https://nenge.net
 */
 (function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : ((global = typeof globalThis !== "undefined" ? globalThis : global || self), factory(global));
})(this, function (exports) {
    "use strict";
    const {
        Array,
        Object,
        String,
        Number,
        Blob,
        File,
        ArrayBuffer,
        Uint8Array,
        Function,
        Boolean,
        Promise,
        FormData,
        URL,
        URLSearchParams,
        TextDecoder,
        TextEncoder,
        document,
        RegExp,
        HTMLElement,
        customElements,
        parseInt,
        Date,
        CustomEvent,
        JSON,
        indexedDB,
        undefined,
        DOMParser,
        prompt,
        alert,
        fetch,
        Response,
        Headers,
        XMLHttpRequest,
        location,
        matchMedia,
        styleMedia,
        Node,
        NodeList,
        StyleSheet,
        console,
        EventTarget,
        Worker,
        Attr,
        Text,
        Document,
        Symbol,
        CSSStyleDeclaration,
        CSSConditionRule,
        NamedNodeMap,
        Event,
        KeyboardEvent,
        IDBCursorWithValue,
        Notification
    } = self;
    /**
     * 本地数据 库操作
     */
    class CustomStore {
        tables = [];
        Store = {};
        constructor(name, config) {
            config = config || {};
            Object.assign(this, {
                name,
                config,
            });
        }
        /**
         * 打开数据并返回对象
         * @param {*} upgrad 
         * @returns {Promise<IDBDatabase>}
         */
        open(upgrad) {
            const IDB = this;
            return I.Async(resolve => {
                const req = indexedDB.open(IDB.name, IDB.version);
                req.once("upgradeneeded", I.fn(upgrad)?upgrad:(e => {
                    const db = req.result;
                    I.toArr(IDB.config, (entry) => {
                        const [table, opt] = entry;
                        if (!db.objectStoreNames.contains(table)) {
                            const store = db.createObjectStore(table);
                            I.toArr(opt, opts => {
                                store.createIndex(opts[0], opts[0], opts[1] || {"unique": false });
                            });
                        }
                    });
                }));
                req.once('success', async () => {
                    const db = req.result;
                    IDB.tables = I.toArr(db.objectStoreNames);
                    IDB.version = db.version + 1;
                    if (I.toArr(IDB.config).filter(v=>!IDB.tables.includes(v[0]))[0]) {
                        db.close();
                        return resolve(IDB.open(upgrad));
                    }
                    IDB.Store = {};
                    return resolve(db);
                });
            });
        }
        table(table,options) {
            const IDB = this;
            if (!IDB.Store[table]) {
                if (!IDB.config[table]) {
                    IDB.config[table] = options || {};
                }
                IDB.Store[table] = new CustomTable(table, IDB);
            }
            return IDB.Store[table];
        }
        async remove() {
            const IDB = this;
            if (IDB.db) {
                (await IDB.db).close();
            }
            IDB.db = undefined;
            return indexedDB.deleteDatabase(IDB.name);
        }
        /**
         * 删除表
         * @param {*} table 
         */
        async delete(table) {
            const IDB = this;
            if (!IDB.db) {
                I.toArr(await indexedDB.databases(), entry => {
                    if (IDB.name === entry.name) IDB.version = entry.version + 1;
                });
            };
            IDB.db = IDB.open((e) => {
                let db = e.target.result;
                if (I.str(table)) {
                    table = [table];
                }
                I.toArr(table, (v) => {
                    db.objectStoreNames.contains(v) && db.deleteObjectStore(v);
                    if(IDB.config[v]){
                        delete IDB.config[v];
                        delete IDB.Store[v];
                    }
                });
            });
        }
    }
    /**
     * 本地数据 表操作
     */
    class CustomTable {
        maxsize = 0x6400000;
        part = "-part-";
        /**
         * 
         * @param {string} table 
         * @param {CustomStore} IDB
         */
        constructor(table, IDB) {
            const DB = this;
            I.defines(DB,{table,IDB},1);
        }
        /**
         * 返回可操作数据库对象
         * @param {Boolean|undefined} ReadMode 
         * @returns {Promise<<IDBObjectStore>}
         */
        async ObjectStore(ReadMode){
            const IDB = this.IDB;
            if(!IDB.db){
                IDB.db = IDB.open();
            }
            const transaction = await  (await IDB.db).transaction([this.table], ReadMode ? undefined : "readwrite");
            return  transaction.objectStore(this.table);
        }
        /**
         * 只读数据库对象
         * @returns {Promise<IDBObjectStore>}
         */
        read(){
            return this.ObjectStore(!0);
        }
        /**
         * 读写数据库对象
         * @returns {Promise<IDBObjectStore>}
         */
        write(){
            return this.ObjectStore();
        }
        /**
         * 读取操作
         * @param {string} method 方法名
         * @param  {...any} data 
         * @returns {Promise<IDBRequest>}
         */
        async readCall(method,...data){
            return I.tryA(await this.read(),method,data)
        }
        /**
         * 写入操作
         * @param {*} method 方法名
         * @param  {...any} data 
         * @returns {Promise<IDBRequest>}
         */
        async writeCall(method,...data){
            return I.tryA(await this.write(),method,data)
        }
        /**
         * 
         * @param {IDBRequest} request 
         * @param {*} fn 
         * @returns 返回操作结果
         */
        Result(request, fn) {
            return I.Async((resolve) => request.on('success', (e) => {
                const result = request.result;
                fn ? fn(resolve, result) : resolve(result);
            }));
        }
        getItem(name, version){
            return this.get(name, version);
        }
        setItem(name, data){
            return this.put(data, name);
        }
        async clear(){
            return this.Result(await this.writeCall('clear'))
        }
        async count(query){
            return this.Result(await this.readCall('count',query));
        }
        async all(query, count){
            return this.Result(await this.readCall('getAll',query, count));
        }
        async keys(query, count){
            return this.Result(await this.readCall('getAllKeys',query, count))
        }
        async key(range){
            return this.Result(await this.readCall('getKey',range))
        }
        load(request, name){
            return this.Result(request.get(name))
        }
        save(request, data, name) {
            return this.Result(request.put(data, name))
        }
        async cursor(query, direction){
            return this.getCursor(await this.readCall('openCursor',query, direction));
        }
        async keyCursor(query, direction){
            return this.getCursor(await this.readCall('openKeyCursor',query, direction));
        }
        index(keyPath){
            return {
                DB:this,
                keyPath,
                async read() {
                    const read = await this.DB.read();
                    return read.indexNames.contains(this.keyPath) ? read.index(this.keyPath) : read;
                },
                async method(method,...data){
                    return I.tryA(await this.read(),method,data)
                },
                async cursor(range, direction) {
                    return this.DB.getCursor(await this.method('openCursor',range, direction));
                },
                async keyCursor(range, direction) {
                    return this.DB.getCursor(await this.method('openKeyCursor',range, direction));
                },
                async getItem(key, version, bool) {
                    return this.DB.get(key, version, await this.read());
                },
                async get(key){
                    return this.DB.Result(await this.method('get',key));
                },
                async count(key){
                    return this.DB.Result(await this.method('count',key));
                },
                async key(key){
                    return this.DB.Result(await this.method('getKey',key));
                },
                async keys(query,count){
                    return this.DB.Result(await this.method('getAllKeys',query,count));
                },
                async all(query,count){
                    return this.DB.Result(await this.method('getAll',query,count));
                }
            }
        }
        /**
         * 
         * @param {IDBRequest} request 
         * @returns {Promise<any>}
         */
        getCursor(request) {
            const data = {};
            return this.Result(request, (resolve, result) => {
                if (result) {
                    data[result.primaryKey] = I.F(result,IDBCursorWithValue)?result.value:result.key;
                    result.continue();
                } else {
                    resolve(data);
                }
            });
        }
        async get(name, version,read) {
            const DB = this;
            read = read || await DB.read();
            if (I.str(name)) {
                let result = await DB.load(read, name);
                if(!result || version&&result.version&&result.version!=version){
                    return;
                }
                if(I.blob(result.contents)||I.buf(result.contents)){
                    const maxsize = DB.maxsize;
                    if(result.filesize>maxsize){
                        let startnum = result.contents.byteLength||result.contents.size;
                        const newcontents = [result.contents];
                        let indexkey = 1;
                        while(true){
                            let havenum = result.filesize-startnum;
                            if(havenum<=0)break;
                            let newresult = await DB.load(read, name+this.part+indexkey);
                            if(newresult){
                                newcontents.push(newresult.contents);
                            }
                            indexkey+=1;
                            startnum=havenum>=maxsize?startnum+maxsize:result.filesize;
                        }
                        result.contents = I.File(newcontents,result.filename,result.filesize);
                        if(result.type!=File.name){
                            result.contents = await I.toU8(result.contents);
                        }
                    }
                }
                return result;
            } else if (I.array(name)) {
                return I.toObj(I.Async(name.map(async (keyname) => [
                    keyname, await DB.load(read, keyname)
                ])));
            }
        }
        async put(data, name) {
            const write = await this.write();
            if (!name) {
                if(I.str(data)){
                    return;
                }else if(I.array(data)){
                    return I.Async(data.map(entry=>this.put(entry)));
                }else if(I.obj(data)){
                    let keyPath = write.indexNames;
                    if(data[keyPath]){
                        name = data[keyPath];
                    }else{
                        return I.Async(I.toArr(data,entry=>this.put(entry[1],entry[0])));
                    }
                }
            }
            if (I.blob(data.contents)||I.buf(data.contents)){
                const length = data.contents.byteLength||data.contents.size;
                const maxsize = this.maxsize;
                if(length>maxsize){
                    let startnum = 0;
                    let indexkey = 0;
                    const newdata = {};
                    for(let key in data){
                        if(key==='contents')continue;
                        newdata[key] = data[key];
                    }
                    while(true){
                        let havenum = length-startnum;
                        if(havenum<=0)break;
                        let endnum = havenum>=maxsize?startnum+maxsize:length;
                        let contents = data.contents.slice(startnum,endnum);
                        let part = indexkey==0?'':this.part+indexkey;
                        await this.save(write, Object.assign({contents}, newdata),name+part);
                        startnum=endnum;
                        indexkey+=1;
                    }
                    return;
                }
            }
            return this.save(write, data, name);
        }
        async putdata(name, data, ver, opt) {
            const result = Object.assign({
                contents: data,
                timestamp: new Date
            }, opt);
            if (ver)
                result.version = ver;

            return this.put(result, name);
        }
        async getdata(name, version) {
            const result = await this.get(name, version);
            return result&&result.contents||result;
        }
        async delete(name,bool) {
            const DB = this;
            const write = await DB.write();
            let list = await DB.Result(write.getAllKeys());
            return I.Async(list.map(n=>{
                if(name==n||I.array(name)&&name.includes(n)){
                    return DB.Result(write.delete(n));
                }else if(bool&&n.indexOf(name)===0){
                    return DB.Result(write.delete(n));
                }
            }));
        }
        async fetch(ARG){
            ARG = T.FetchARG(ARG)
            let key = ARG.key;
            let result = await this.get(key,ARG.version);
            if(result&&result.timestamp){
                if(T.onLine&&ARG.modified&&result.modified){
                    let headers = await T.FetchData({url:ARG.href,type:'head'});
                    if(headers&&headers['last-modified']!=result.modified){
                        result = null;
                    }
                }
                if(result!=null){
                    if(result.type==Document.name){
                        return T.docElm(result.contents);
                    }
                    return result.contents;
                }
            }
            let [contentBlob,headers] = await T.FetchFile(ARG);
            if(contentBlob){
                if(I.blob(contentBlob)){
                    const options = {
                        filesize:contentBlob.size,
                        filetype:contentBlob.type,
                        filename:key,
                        type:File.name,
                        mode:'fetch',
                        timestamp:new Date,
                    };
                    if(ARG.options)Object.assign(options,ARG.options);
                    if(ARG.version)options.version = ARG.version;
                    if(headers&&headers['last-modified'])options.modified = headers['last-modified'];
                    let type;
                    if(ARG.unpack){
                        contentBlob = await T.Decompress(contentBlob,(current, total, name)=>{
                            I.tryC(ARG,'progress',current, total, name,'unpack');
                        })||contentBlob;
                        if(ARG.libjs&&I.obj(contentBlob)){
                            let keyfile;
                            I.toArr(contentBlob,(entry,index)=>{
                                const filename = ARG.libjs+entry[0];
                                const filetype = T.getMime(entry[0]);
                                const datafile = I.File([entry[1]],filename,filetype);
                                this.put(Object.assign({contents:datafile},options,{filename,filesize:datafile.size}),filename);
                                if(filename===key){
                                    keyfile = datafile;
                                }
                            });
                            return keyfile||contentBlob;
                        }
                        type = I.buf(contentBlob)?Uint8Array.name:'unpack';
                    }else if(!ARG.type||ARG.type!='blob'){
                        contentBlob = await T.toFormatBlob(contentBlob,ARG.type,headers);
                        type = I.str(contentBlob)?String.name:I.obj(contentBlob)?'json':Uint8Array.name;
                        if(ARG.type=='html')type=Document.name;
                    }
                    if(type)options.type = type;
                    this.put(Object.assign({contents:contentBlob},options),key);
                    if(ARG.type=='html'&&I.str(contentBlob)){
                        return T.docElm(contentBlob);
                    }
                }else if(ARG.type=='head'){
                    this.put({
                        contents:contentBlob,
                        modified:contentBlob['last-modified'],
                        timestamp:new Date,
                    },key);
                }
                return contentBlob;
            }
            return null;
        }
        async ajax(ARG,bool){
            const DB = this;
            return I.Async(async back=>{
                ARG = T.FetchARG(ARG,{
                    async success(response,headers){
                        if(!response)return back({});
                        const data = {
                            mode:'ajax',
                            timestamp:new Date
                        };
                        let type;
                        if(headers){
                            data.headers = headers;
                            data.filetype = headers.type;
                            data.modified = headers['last-modified'];
                            if(I.F(response,Document)){
                                data.contents = response.documentElement.outerHTML;
                                type = Document.name;
                            }else{
                                data.contents = response;
                                type = I.obj(response)?'json':I.blob(response)?File.name:I.buf(response)?Uint8Array.name:String.name;
                            }
                        }else{
                            data.contents = response;
                            type = Headers.name;
                        }
                        if(type)data.type=type;
                        if(ARG.version)data.version=ARG.version;
                        await DB.put(data,key);
                        if(bool)return back(response);
                        if(data.type == Document.name)data.contents = response;
                        back(data);
                    },
                    error(response,headers){
                        back({});
                    }
                });
                let key = ARG.key||ARG.href;
                const result = await DB.get(key,ARG.version);
                if(result&&result.timestamp){
                    if(result.type==Document.name){
                        result.contents = T.docElm(result.contents);
                    }
                    if(bool)return back(result.contents);
                    return back(result);
                }
                T.ajax(ARG);
            });
        }
    }
    class CustomCSS {
        constructor(sheet,selectorText) {
            let T = exports.Nenge;
            this.sheet = sheet&&sheet.cssRules?sheet:T.$add('style',document.head).sheet;
            if(sheet&&!sheet.cssRules){
                this.selectorText = selectorText;
            }
        }
        selectorText = '';
        /**
         * 插入一条CSS规则
         * @param {String} ruletxt 
         * @param {number|undefined} index 
         * @returns {number}
         */
        insertRule(ruletxt,index) {
            //alert(this.selectorText+ruletxt);
            if(this.selectorText){
                //兼容IOS旧版浏览器处理
                const selector = this.selectorText;
                if(['&',':'].includes(ruletxt.charAt(0))){
                    ruletxt = ruletxt.charAt(0)=='&'?ruletxt.replace(/^&/,selector):selector+ruletxt;
                }else{
                    ruletxt = selector+' '+ruletxt;
                }
                ruletxt = ruletxt.replace(/&/g,selector);
            }
            return I.tryC(this.sheet,'insertRule',ruletxt,I.num(index)?index:this.ruleLast());
        }
        /**
         * 重置CSS规则内容,原则上不应该删除避免序列错误
         * @param {number} index 
         */
        delRule(index) {
            const nowRule = this.ruleItem(index);
            if (nowRule) {
                this.ruleStyle(nowRule).cssText = '';
                if(nowRule.cssRules){
                    while(!0){
                        if(!nowRule.cssRules.length)break;
                        nowRule.cssRules.deleteRule(0);
                    }
                }
            }
        }
        /**
         * 插入或者更新 一条CSS规则
         * @param {String} ruletxt 
         * @param {number|undefined} index
         * * @returns {number}
         */
        addRule(ruletxt, index) {
            const nowRule = I.num(index)&&this.ruleItem(index);
            if (nowRule) {
                this.sheet.deleteRule(index);
                return this.insertRule(ruletxt,index);
            }
            return this.insertRule(ruletxt);
        }
        /**
         * 查找指定位置规则
         * @param {number} index 规则位置
         * @returns {CSSStyleRule|null} 返回CSS规则
         */
        ruleItem(index) {
            if (!I.num(index)) return null;
            if(index<0)index = this.ruleLast()+index+1;
            return this.sheet.cssRules.item(index) || null;
        }
        /**
         * 查找指定位置规则的STYLE
         * @param {number|CSSStyleRule} index 规则位置
         * @returns {CSSStyleValue|null} 返回CSS规则
         */
        ruleStyle(nowRule){
            if(I.num(nowRule))nowRule = this.ruleItem(nowRule);
            if (nowRule) {
                return nowRule.ownerNode?nowRule.ownerNode.style:nowRule.style;
            }
        }
        /**
         * 获取规则中的 css对象列表
         * @param {number} index
         * @returns {JSON} 样式变量集合
         */
        getRule(index) {
            const nowRule = this.ruleItem(index);
            return nowRule ? this.ruleData(nowRule) : {};
        }
        /**
         * 
         * @param {CSSStyleRule|Number} nowRule 
         * @param {Boolean|undefined} bool 
         * @returns {JSON} 
         */
        ruleData(nowRule, bool) {
            if (I.num(nowRule)) nowRule = this.ruleItem(nowRule);
            if(nowRule){
                let style = this.ruleStyle(nowRule);
                let result = I.toObj(style) || {};
                let subRules = bool&& this.rulesData(nowRule) || [];
                if (subRules.length) {
                    result.cssRules = subRules;
                }
                return result;
            }
        }
        /**
         * 遍历所有规则
         * @param {CSSStyleRule|Number} nowRule 
         * @param {Boolean|undefined} bool 
         * @returns {Array<JSON>}
         */
        rulesData(nowRule) {
            if (I.num(nowRule)) nowRule = this.ruleItem(nowRule);
            else if (I.nil(nowRule)) nowRule = this.sheet;
            const result = [];
            const media = [];
            if(nowRule.cssRules){
                for (let newSheet of nowRule.cssRules) {
                    if (I.F(newSheet, CSSStyleRule)) {
                        result.push({
                            [newSheet.selectorText]: this.ruleData(newSheet, !0)
                        });
                    } else if (I.F(newSheet, CSSFontFaceRule)) {
                        media.push({ '@font-face': this.ruleData(newSheet) });
                    } else if(I.F(newSheet,CSSConditionRule)){
                        const name = I.O(newSheet).name.toLowerCase().slice(3,-4);
                        media.push({
                            ['@'+name+' '+newSheet.conditionText]: this.rulesData(newSheet)
                        });

                    } else {
                        console.log(newSheet);
                    }
                }
            }
            return result.concat(media);
        }
        /**
         * 获取当前最新行位置
         * @returns {Number}
         */
        ruleLast(){
            return this.sheet.cssRules.length;
        }
        /**
         * 增加CSS规则内容
         * @param {String} cssValue cssc值非规则
         * @param {number|undefined} index 
         * @returns {number}
         */
        pushCSS(cssValue, index) {
            const style = this.ruleStyle(index);
            if (style) {
                style.cssText += cssValue;
            }
        }
        /**
         * 覆盖CSS规则内容
         * @param {String} cssValue cssc值非规则
         * @param {number|undefined} index 
         */
        setCSS(cssValue, index) {
            const style = this.ruleStyle(index);
            if (style) {
                style.cssText = cssValue||'';
            }
        }
        /**
         * 读取style值
         * @param {Number} index 
         * @returns {String}
         */
        getCSS(index) {
            const style = this.ruleStyle(index);
            return style?style.cssText:'';
        }
        /**
         * 创建一个条件新CSS规则对象
         * 如果是次级用 & 替代上级对象.
         * @param {*} condition 
         * @returns {CustomCSS}
         */
        addMedia(condition){
            const newRule = this.addRule('@media '+condition+'{}');
            return this.NewRule(newRule);
        }
        /**
         * 次级新CSS规则对象
         * @param {*} index 
         * @returns 
         */
        NewRule(index){
            const nowRule = this.ruleItem(index);
            return nowRule ? new this.constructor(nowRule,nowRule.selectorText) : null;
        }
        /**
         * 设置或获取ELM的id
         * @param {HTMLElement} elm 
         * @returns {String}
         */
        ElmId(elm){
            if(I.F(this.sheet,CSSStyleRule)||this.selectorText)return this.ElmClass(elm);
            let id = elm.getAttribute('id');
            if(!id){
                //id = 'elm-'+ btoa(Date.now()+Math.random()).replace(/[^\w]/g,'');
                id = 'elm-'+T.getRandStr();
                elm.setAttribute('id',id);
            }
            return '#'+id;
        }
        /**
         * 添加class
         * @param {*} elm 
         * @param {*} bool 
         * @returns 
         */
        ElmGetClass(elm,bool){
            if(bool){
                for(let id of elm.classList){
                    if(/^elm\-\w{23,*}/.test(id)){
                        return id;
                    }
                }
            }
            //let id = 'elm-'+ btoa(Date.now()+Math.random()).replace(/[^\w]/g,'');
            let id = 'elm-'+T.getRandStr();
            I.addClass(elm,id);
            return id;
        }
        /**
         * 设置一个CLASS
         * @param {*} elm 
         * @returns 
         */
        ElmClass(elm){
            return '.'+this.ElmGetClass(elm,!0);
        }
        /**
         * 对一个元素设置css
         * @param {*} elm 
         * @param {*} css 
         * @param {*} index 
         * @returns 
         */
        Elm2Rule(elm,css,index,type){
            css = css||'';
            type = type||'';
            return this.addRule(this.ElmId(elm)+type+'{'+css+'}',index);
        }
        Elm2Icon(elm,data,iconFont,type){
            if(I.nil(type))type = this.fontSelete[0];
            else if(type===!0)return I.Mach(this.fontSelete,v=>this.Elm2Icon(elm,data,iconFont,v))[0];
            else if(I.array(type))return I.Mach(type,v=>this.Elm2Icon(elm,data,iconFont,v))[0];
            if(!iconFont)iconFont=this.iconFont;
            return this.Elm2Rule(elm,`content:"\\${data}";font-family:"${iconFont}";`,!1,type);
        }
        Elm2font(elm,data,iconFont,type){
            if(isNaN(data)&&!/^&#/.test(data))data = parseInt(data,16);
            if(I.num(data))data = '&#'+data+';';
            elm.innerHTML = data;
            return this.Elm2Rule(elm,`font-family:"${iconFont}";`,!1,type);
        }
        /**
         * 字体Map设置
         * @returns {FontFaceSet}
         */
        fonts = document.fonts;
        /**
         * @returns {string[]} 返回已加载字体列表
         */
        fontList() {
            return Array.from(this.fonts.keys(), fontFace => fontFace.family);
        }
        /**
         * 检测字体支持情况
         */
        fontMime = ['woff2', 'woff', 'svg', 'eot', 'truetype'].filter(v => CSS.supports('font-format(' + v + ')'));
        /**
         * 伪类
         */
        fontSelete = [':before',':after'];
        /**
         * 基础字体样式
         */
        fontCSS = "display: inline-block;font-style: normal;font-weight: normal;-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;";
        /**
         * 图标样式
         */
        iconFont = "web-icon";
        /**
         * @method 写入一个字体
         * @example addFont('ch-icon','font/ch-icon.woff2',{"style": "normal","weight":"normal"});
         * @param {string} name 
         * @param {string|ArrayBuffer|Blob} url 
         * @param {Type} options 
         */
        async addFont(url,name,options) {
            if(!name) name = this.iconFont;
            if(I.str(url)) url = "url(" + url + ")";
            const font = new FontFace(name, url, options || {"font-weight": "normal","font-style": "normal"});
            this.fonts.add(/blob:/.test(url)?font:await font.load());
        }
        /**
         * 为字体图标注册
         * @param {string} name 
         * @param {string} data "\exxxx" or "url(xx.svg)"
         * @param {string} iconFont "字体名"
         * @param {string} type "before" "after" ":marker"(ul->li序列list-style)
         */
        addIcon(name, data, iconFont,type) {
            if(!type)type = this.fontSelete[0];
            else if(type===!0)return I.Mach(this.fontSelete,v=>this.addIcon(name,data,iconFont,v))[0];
            else if(I.array(type))return I.Mach(type,v=>this.addIcon(name,data,iconFont,v))[0];
            if(!iconFont)iconFont=this.iconFont;
            const fontName = iconFont+'-'+name;
            T.fontsIcon[name] = fontName;
            this.addRule(`.${fontName+type}{${this.fontCSS}font-family:"${iconFont}";content:"${data}"}`);
            return fontName;
        }
        /**
         * 返回样式类名
         * @param {string} name 
         * @returns 
         */
        getIcon(name) {
            return T.fontsIcon[name];
        }
        /**
         * 监控CSS显示区域窗体变化
         * @param {*} query 
         * @param {*} fn 
         * @returns 
         */
        onMedia(query, fn) {
            if (matchMedia) {
                let m = matchMedia(query);
                m.on('change', (e) => fn(e.matches, e));
                fn(m.matches);
                return m;
            }
        }
    }
    class CustomPWA{
        constructor(T,file) {
            let SW = navigator.serviceWorker;
            if(SW){
                SW.register(file).then(e => {
                    if(e.installing){
                        this.connect(e.installing,'register');
                    }
                    const sw = e.installing || e.active;
                    sw.on('statechange', e => {
                        const sw2 = e.target;;
                        if(['redundant', 'activated'].includes(sw2.state)){
                            this.connect(sw2,'register');
                        }
                    });
                    T.CF('pwa_loader');
                });
                this.ready = (async ()=>{
                    let SW = navigator.serviceWorker;
                    if(I.await(SW.ready)){
                        SW.on('message',this._message);
                        SW.on('controllerchange', e =>this.connect(e.active,'register'));
                        await SW.ready;
                        return !0;
                    }
                    return !1;
                })();
                if(Notification&&Notification.permission!='granted')I.tryC(Notification,'requestPermission');
            }else{
                this.ok = I.Async(!1);
            }
        }
        async _message(event){
            let data = event.data;
            let source = event.source;
            if(T.isLocal)console.log(data);
            if (I.obj(data)) {
                let clientID = data.clientID;
                let method = data.method;
                if(clientID&&I.fn(T.action[clientID])){
                    await T.action[clientID](data,source);
                }else if(method&&I.fn(T.action[method])){
                    await T.action[method](data,source);
                }
                clientID = null;
                method = null;
                data = null;
            }
        }
        async connect(sw,state){
            sw = sw||(await this.registration).active;
            sw.postMessage({method: state||'connect'})
        }
        async clear() {
            let sws = await navigator.serviceWorker.getRegistrations();
            I.Each(sws, sw => sw.unregister());
        }
        async permission(name){
            let permission = await navigator.permissions.query({name}).catch(e=>null);
            return permission&&permission.state=='granted'?!0:!1;
        }
        async notice(title,options){
            if(!await this.permission('notifications')) return;
            (await this.registration).showNotification(title,options);
        }
        async sync(tag){
            if(!await this.permission('background-sync')) return this.postSync(tag);
            (await this.registration).sync.register(tag);
        }
        async postSync(tag){
            return T.postMessage({method:'sync',tag});
        }
        async periodicSync(tag,options,sw){
            if(!await this.permission('periodic-background-sync')) return;
            (await this.registration).periodicSync.register(tag,options);
        }
        async setPush(key){
            if(!await this.permission('push')) return;
            let sw = await this.registration;
            let state = await sw.pushManager.permissionState({
                userVisibleOnly:!0,
                applicationServerKey:key
            });
            console.log(state);
            if(state=='granted'){
                let sub = await sw.pushManager.getSubscription();
                if(!sub){
                    sub = await sw.pushManager.subscribe({
                        userVisibleOnly:!0,
                        applicationServerKey:key
                    });
    
                }
                console.log(sub);

            }
        }
        get registration(){
            return navigator.serviceWorker.ready;
        }
    }
    /**
     * 检查转换类
     */
    const I = {
        /**
         * 替换字符
         * @param {String} o 
         * @param {String|RegExp} exp
         * @param {String|Function} a 
         * @returns {String}
         */
        R(o, exp, a){
			return I.tryC(o,'replace',exp, I.nil(a)?'':a) ||'';
		},
        /**
         * 原型链判断
         * @param {Object} o 
         * @param {CLASS} a 
         * @returns {Boolean}
         */
        F(o, a){
			return o instanceof a
		},
        /**
         * 类判断
         * @param {Object} o 
         * @param {CLASS} a 
         * @returns {Boolean}
         */
        C(o, a){
			return !I.nil(o) && I.O(o) === a
		},
        /**
         * 原型类
         * @param {*} o 
         * @returns {CLASS}
         */
        O(o){
            return !I.nil(o) && o.constructor
        },
        /**
         * 对象原型
         * @param {Object} o 对象 
         * @returns {prototype}
         */
        P(o){
			return o.prototype
		},
        /**
         * 检查对象是否含有值
         * @param {*} o 
         * @param {*} a 
         * @returns 
         */
        I(o,a){
            return a in I.P(o);
        },
        /**
         * 遍历数组
         * @param {Array} o 
         * @param {Function} f 
         * @returns {Array}
         */
        Each(o, f){
			return I.fn(f)?o.forEach(f):o
		},
        /**
         * 遍历数组并且返回数据
         * @param {*} o 
         * @param {*} f 
         * @returns {Array}
         */
        Mach(o, f){
			return Array.from(o, f)
		},
        /**
         * HTML对象
         * @param {Object} o 
         * @returns {Boolean}
         */
        elm(o){
			return I.F(o, HTMLElement)
		},
        /**
         * 异步函数
         * @param {Object} o 
         * @returns {Boolean}
         */
        await(o){
			return I.F(o, Promise)
		},
        /**
         * Blob对象
         * @param {Object} o 
         * @returns {Boolean}
         */
        blob(o){
			return I.F(o, Blob)
		},
        /**
         * 文件
         * @param {Object} o 
         * @returns {Boolean}
         */
        file(o){
			return I.F(o, File)
		},
        /**
         * 函数
         * @param {Object} o 
         * @returns {Boolean}
         */
        fn(o){
			return I.F(o, Function)
		},
        func(o){
			return I.fn(o)
		},
        /**
         * 数组
         * @param {Object} o 
         * @returns {Boolean}
         */
        array(o){
			return Array.isArray(o)
		},
        /**
         * 普通对象集
         * @param {Object} o 
         * @returns {Boolean}
         */
        obj(o){
			return I.C(o, Object)
		},
        /**
         * 二进制
         * @param {Object} o 
         * @returns {Boolean}
         */
        buf(o){
			return I.C(o && o.buffer || o, ArrayBuffer)
		},
        /**
         * Uint8Array对象
         * @param {Object} o 
         * @returns {Boolean}
         */
        u8buf(o){
			return I.C(o, Uint8Array)
		},
        /**
         * 字符
         * @param {*} o 
         * @returns 
         */
        str(o){
			return I.C(o, String)
		},
        /**
         * 布尔值
         * @param {Object} o 
         * @returns {Boolean}
         */
        bool(o){
			return I.C(o, Boolean)
		},
        /**
         * 数字
         * @param {Object} o 
         * @returns {Boolean}
         */
        num(o){
			return I.C(o, Number)
		},
        int(o){
            return !I.null(o)&&!isNaN(o)
        },
        /**
         * null值
         * @param {Object} o 
         * @returns {Boolean}
         */
        null(o){
			return o === null
		},
        /**
         * 未定义值
         * @param {Object} o 
         * @returns {Boolean} 
         */
        none(o){
			return o === undefined
		},
        /**
         * 空值或者未定义
         * @param {Object} o 
         * @returns {Boolean}
         */
        nil(o){
			return I.null(o) || I.none(o)
		},
        /**
         * 转化为ArrayBuffer
         * @param {Blob} o 
         * @returns {ArrayBuffer|Promise}
         */
        toBuf(o){
			return o.arrayBuffer()
		},
        /**
         * blob转换Uint8Array
         * @param {Blob} o
         * @returns {Promise<Uint8Array>}
         */
        Blob2U8: async o => I.toU8(await I.toBuf(o)),
        /**
         * 转换为BLOB
         * @param {*} o 
         * @returns 
         */
        toBlob(o){
			return I.blob(o)?o:new Blob([o.buffer || o])
		},
        /**
         * {async}
         * 转化为Uint8Array
         * @param {ArrayBuffer|Blob} o
         * @returns {Uint8Array|Promise<Uint8Array>}
         */
        toU8(o){
			return I.u8buf(o) ? o : I.blob(o) ? I.Blob2U8(o) :new Uint8Array(o&&o.buffer||o)
		},
        /**
         * 打印字符
         * @param {any} o 
         * @param {number|null} a 参数
         * @returns {String}
         */
        toStr(o, a){
            if(I.array(o)) return o.join(a||'');
			return o?o.toString(a):'';
		},
        buf2str(o){
            return I.toArr(o,v=>I.toStr(v,16).padStart(2,'0'));
        },
        /**
         * 大写
         * @param {String} o 
         * @returns {String}
         */
        toUp(o){
            if(I.array(o))return I.toUp(I.toStr(o));
			return o && o.toUpperCase()
		},
        /**
         * 小写
         * @param {String} o 
         * @returns {String}
         */
        toLow(o){
            if(I.array(o))return I.toLow(I.toStr(o));
			return o && o.toLowerCase()
		},
        /**
         * 解码二进制
         * @param {Uint8Array} o 
         * @param {String} a 编码,默认utf8
         * @returns {String}
         */
        decode(o, a){
			return new TextDecoder(a).decode(o)
		},
        /**
         * 编码为二进制
         * @param {String} o 
         * @returns {Uint8Array}
         */
        encode(o){
			return new TextEncoder().encode(o)
		},
        toCp437(o){
            const CP437 = "\0☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\n";
            if(I.buf(o)){
                return I.toStr(I.toArr(o,v=>CP437.charAt(v)));
            }else if(I.str(o)){
                return I.toU8(I.toArr(o,v=>CP437.indexOf(v)));
            }
        },
        /**
         * 转换为十进制数字
         * @param {Number|String} o 
         * @param {undefined|Number} a 
         * @returns 
         */
        toInt(o, a){
			return parseInt(o, a)
		},
        /**
         * 返回一个异步对象Promise
         * @param {Function|Array<Function>} o 异步函数或异步函数组 
         * @param {Boolean} b 是否采用 allSettled
         * @returns {Promise<value>|Promise<Array<value>>}
         */
        Async(o, b){
			return I.array(o) ? b ? Promise.allSettled(o) : Promise.all(o) : I.fn(o) ? new Promise(o, b) : Promise.resolve(o)
		},
        /**
         * 获取HTML对象属性
         * @param {NamedNodeMap} o 
         * @returns {JSON}
         */
        getAttr(o){
			return I.EachItem(o.attributes || o, !1)
		},
        /**
         * 设置HTML属性
         * @param {NamedNodeMap} o 
         * @param {JSON} a 
         * @returns 
         */
        setAttr(o, a){
            I.toArr(a, x => o.setAttribute(...x));
            return o
        },
        setStyle(o,a,b){
            if(I.obj(a))return I.toArr(a,v=>I.setStyle(o,...v));
            I.tryC(o&&o.style||o,'setProperty',a,b);
        },
        addClass(o,...b){
            I.tryA(o&&o.classList,'add',b);
        },
        removeClass(o,...b){
            I.tryA(o&&o.classList,'remove',b);
        },
        setElm(o, a){   
            let c = I.O(o);
            I.toArr(a, x =>{
                if(I.str(x[1])&&!I.I(c,x[0])){
                    o.setAttribute(...x);
                }else if(I.fn(x[1])&&I.I(c,'on'+x[0])){
                    o.once(x[0],x[1]);
                }else o[x[0]]=x[1];
            });
            return o
        },
        /**
         * 尝试执行函数
         * @param {Object} o 执行对象
         * @param {Function|String} fn 函数名.函数对象
         * @param  {Arguments} a 参数
         * @returns {any} 函数执行结果
         */
        tryC(o, fn, ...a){
			return I.tryA(o, fn, a)
		},
        /**
         * 尝试执行函数
         * @param {Object} o 执行对象
         * @param {Function|String} fn 函数名.函数对象
         * @param  {Arguments} a 参数
         * @param  {Boolean} bool fn非函数时返回
         * @returns {any} 函数执行结果
         */
        tryA(o, fn, a,bool) {
            if (!I.nil(o)) {
                if (fn && I.str(fn)) fn = o[fn];
                return !I.fn(fn) ? bool?fn:undefined : fn.apply(o, a);
            }
        },
        /**
         * 遍历迭代
         * @param {*} o 
         * @returns 
         */
        ForOf(o, fn) {
            if(I.array(o)) return I.Mach(o,fn);
            const a = [];
            if(!o[Symbol.iterator]){
                if (I.F(o, Object)){
                    return I.Mach(Object.entries(o),fn);
                }
                return a;
            }
            let i = 0;
            for(const value of o){
                let result;
                if(I.fn(fn)){
                    result = fn(value);
                }else if(I.array(value)){
                    if(value[0] === i) {
                        result = value[1];
                    } else {
                        result = value;
                    }
                }else if(value){
                    if(I.str(value)&&o.getPropertyValue){
                        result = [value, o.getPropertyValue(value)];
                    }else if (I.F(value,Attr)) {
                        result = [value.name, value.value];
                    } else { 
                        result = value;
                    }
                }
                i+=1;
                a.push(result);
            }
            return a;
        },
        /**
         * 转换对象
         * @param {Object} o 
         * @param {Boolean} k 
         * @returns {Array<String>|Array<Array>|JSON}
         */
        EachItem(o, k) {
            const a = I.ForOf(o);
            return k === !1 ? Object.fromEntries(a.map((v, i) => I.array(v) && v.length == 2 ? v : [i, v])) : a;
        },
        /**
         * 设置对象属性
         * @param {*} o 
         * @param {*} p 
         * @param {*} attr 
         * @param {*} bool 
         * @param {*} rw 
         * @returns 
         */
        define(o, p, attr, bool, rw){
            return Object.defineProperty(o, p, (!bool || attr&& attr.value) ? attr : {
            get: I.fn(attr) ? attr : () => attr,
            configurable: rw == !0
            })
        },
        /**
         * 设置对象多个属性
         * @param {*} o 
         * @param {*} attr 
         * @param {*} bool 
         * @param {*} rw 
         * @returns 
         */
        defines(o, attr, bool, rw){
			return bool ? I.toArr(attr, (entry) => I.define(o, entry[0], entry[1], 1, rw)) : Object.defineProperties(o, attr)
		},
        /**
         * 判断数据值是否为空
         * @param {Array|String|JSON|Boolean} o 
         * @returns {Boolean}
         */
        empty(o) {
            if(I.nil(o) || I.str(o)&&!o || I.array(o)&&!o.length || I.obj(o)&&!I.ForOf(o).length){
                return !0;
            }
            return !1;
        },
        /**
         * 字符串变为JSON
         * @param {String} post 
         * @returns {JSON}
         */
        Json(post) {
            if (I.u8buf(post))
                post = I.decode(post);

            return I.str(post) ? new Function("return " + post)() : post;
        },
        /**
         * 转换JSON为字符串
         * @param {JSON} post 
         * @returns {String}
         */
        toJson(post){
			return JSON.stringify(I.Json(post))
		},
        /**
         * 创建一个文件
         * @param {Array<Blob|Uint8Array|String>} o 
         * @param {String} n 文件名
         * @param {String} type mime
         * @returns {File}
         */
        File(o, n, type){
            return new File(o, n, {
                type,
                lastModified: Date.now()
            });
        },
        /**
         * 处理POST数据
         * @param {FormData|HTMLFormElement|JSON} obj 
         * @returns {FormData}
         */
        toPost(obj) {
            const post = obj instanceof FormData ? obj : new FormData(obj instanceof HTMLFormElement ? obj : undefined);
            if (I.obj(obj)) I.toArr(obj, v => post.append(v[0], v[1]));
            return post;
        },
        /**
         * 合拼URL参数
         * @param {String} url 
         * @param  {Array<String>} arg 
         * @returns {String}
         */
        toGet(url, ...arg) {
            let [href, search] = url.split(/\?/);
            search = new URLSearchParams(search);
            I.Each(arg, v => {
                if (I.str(v)) v = new URLSearchParams(v);
                I.toArr(v, x => search.set(x[0], x[1]))
            });
            return href + (search.size ? '?' + I.toStr(search) : "");
        },
        /**
         * 转换对象为JSON
         * @param {Object} o 
         * @returns {JSON}
         */
        toObj(o) {
            return I.obj(o) ? o : I.EachItem(o, !1);
        },
        /**
         * 转换为数组
         * @param {Object} obj 
         * @param {Function|null} fn 回调函数
         * @returns {Array<value>}
         */
        toArr(o, fn) {
            if (!o) return [];
            o = I.array(o) ? o : I.obj(o) ? Object.entries(o) : I.num(o) || o.byteLength ? I.Mach(I.toU8(o.buffer || o)) : I.EachItem(o, !0);
            return I.Mach(o,fn);
        },
        GbByte(){
            let ranges = [
                [0xA1, 0xA9, 0xA1, 0xFE],
                [0xB0, 0xF7, 0xA1, 0xFE],
                [0x81, 0xA0, 0x40, 0xFE],
                [0xAA, 0xFE, 0x40, 0xA0],
                [0xA8, 0xA9, 0x40, 0xA0],
                [0xAA, 0xAF, 0xA1, 0xFE],
                [0xF8, 0xFE, 0xA1, 0xFE],
                [0xA1, 0xA7, 0x40, 0xA0],
            ];
            let codes = new Uint16Array(23940);
            let i = 0;
            for (let [b1Begin, b1End, b2Begin, b2End] of ranges) {
                for (let b2 = b2Begin; b2 <= b2End; b2++) {
                    if (b2 !== 0x7F) {
                        for (let b1 = b1Begin; b1 <= b1End; b1++) {
                            codes[i++] = b2 << 8 | b1;
                        }
                    }
                }
            }
            let table =  new Uint16Array(65536);
            let gbkstr = new TextDecoder('gbk').decode(codes.buffer);
            for (let i = 0; i < gbkstr.length; i++) {
                table[gbkstr.codePointAt(i)] = codes[i];
            }
            gbkstr = null;
            codes = null;
            return table;
        },
        toGB2312(str) {
            if(!this.gb2312){
                this.gb2312 = this.GbByte();
            }
            let buf = [];
            for (let i = 0; i < str.length; i++) {
                const code = str.charCodeAt(i);
                if (code < 0x80) {
                    buf.push(code);
                    continue;
                }
                const gbk = this.gb2312.at(code);
                if (gbk) {
                    buf.push(gbk,gbk >> 8);
                } else if (code === 8364) {
                    // 8364 == '€'.charCodeAt(0)
                    // Code Page 936 has a single-byte euro sign at 0x80
                    buf.push(0x80);
                } else {
                    buf.push(63);
                    if(buf<=0xFF){
                        //ISO-8859-1
                    }
                }
            }
            return new Uint8Array(buf);
        }
    };
    /**
     * 主对象
     */
    const T = new class NengeObj extends EventTarget {
        version = 2;
        DB_NAME = "NENGE.NET";
        DB_STORE_MAP = {
            libjs: {},
            myfile: {
                timestamp: false
            }
        }
        LibStore = "libjs";
        language = {};
        StoreList = {};
        libjsBlob = {};
        /**
         * 字体图标样式映射
         */
        fontsIcon = {};
        isLocal = /^(127|localhost)/.test(location.host);
        CLASS = {CustomStore, CustomTable,CustomCSS};
        /**
         * 获取一个indexedb操作对象
         * @param {*} table 
         * @param {*} options 
         * @param {*} dbName 
         * @param {*} opt 
         * @returns {CustomTable}
         */
        getTable(table,options, dbName, opt) {
            if (!table) return null;
            if(!I.str(table)) return table;
            if(!dbName){
                dbName = T.DB_NAME;
                opt = opt||T.DB_STORE_MAP;
            }
            if(!T.StoreList[dbName]){
                T.StoreList[dbName] = new CustomStore(dbName,opt);
            }
            return T.StoreList[dbName].table(table,options);
        }
        /**
         * 初始化请求参数
         * @param {*} ARG 
         * @returns 
         */
        FetchARG(ARG,options){
            ARG =  Object.assign({ url:location.href},I.str(ARG)?{url: ARG}:ARG,options);
            let key = this.getName(ARG.url.split('?')[0]) || 'index.html';
            if(ARG.key===!0)ARG.key = key;
            if(ARG.libjs){
                if(!ARG.libext)ARG.libext='js';
                let key = this.getName(ARG.url);
                let ext = T.getExt(key);
                if(ext=='zip'|| ARG.unpack&&ext!=ARG.libext){
                    if(!I.str(ARG.key)){
                        ARG.key = key.replace('.'+ext,'.'+ARG.libext);
                    }
                    ARG.unpack = !0;
                }
                if(!ARG.key)ARG.key = key;
                ARG.key = ARG.libjs+ARG.key;
                if(!ARG.version)ARG.version = this.version;
                ARG.type = 'blob';
            }else if(!ARG.key){
                ARG.key = ARG.url;
            }
            ARG.headers = Object.assign({ 'ajax-fetch': 'ajax' }, ARG.headers || {});
            if(ARG.json){
                ARG.post = I.obj(ARG.json)?I.toJson(ARG.json):ARG.json;
                ARG.headers['accept'] = T.getMime(I.obj(post)?'json':'*');
                delete ARG.json;
            }else if(ARG.post){
                ARG.post = I.toPost(ARG.post);
            }
            if(ARG.method!='head'&&ARG.post){
                ARG.method = 'post';
            }else{
                ARG.method = ARG.method||'get';
            }
            ARG.href = I.toGet(ARG.url,ARG.params);
            if(ARG.href.indexOf('http')===0&&!ARG.corss&&ARG.href.indexOf(location.origin)===-1){
                ARG.cross = false;
                ARG.headers = undefined;
            }
            return ARG;
        }
        async FetchFile(ARG){
            if(!ARG||!ARG.method)ARG = this.FetchARG(ARG);
            const response = await fetch(
                ARG.href,
                {
                    method:I.toUp(ARG.method),
                    body:ARG.post||undefined,
                    headers:ARG.headers,
                }
            ).catch(msg=>{
                I.tryC(ARG,'error',!0,msg);
            });
            if(response){
                const headers = this.FilterHeader(I.toObj(response.headers));
                const filename = headers['filename']|| this.getName(ARG.key);
                const filetype = headers['type'];
                if (response.status != 200) {
                    let result;
                    if (filetype == 'json') {
                        result = await response.json();
                    } else {
                        result = await response.text();
                    }
                    I.tryC(ARG,'error',result);
                }else{
                    if(ARG.type=='head'){
                        return [headers];
                    }else{
                        const reader = response.body.getReader();
                        const chunks = [];
                        const fullsize = headers['length'];
                        let chunkSize = 0;
                        while (true) {
                            const {done,value} = await reader.read();
                            if (done)break;
                            /* 下载进度*/
                            chunks.push(I.tryC(reader,ARG.reader,value,chunkSize,fullsize,headers)||value);
                            chunkSize+=value.byteLength;
                            I.tryC(ARG,'progress',chunkSize,fullsize,filename,'fetch');
                        }
                        return [I.File(chunks, filename, filetype),headers];
                    }

                }

            }
            return [null,null];
        }
        async toFormatBlob(contentBlob,type,headers){
            contentBlob = await I.toU8(contentBlob);
            if(type&&type!='u8'){
                contentBlob = I.decode(contentBlob, headers.charset);
            }
            if(type=='json'){
                contentBlob = I.Json(contentBlob);
            }
            return contentBlob;
        }
        async FetchData(ARG){
            if(!ARG||!ARG.method)ARG = this.FetchARG(ARG);
            let [response,headers] = await this.FetchFile(ARG);
            if(response){
                if(I.blob(response)){
                    if(ARG.unpack){
                        response = await T.Decompress(response,(current, total, name)=>{
                            I.tryC(ARG,'progress',current, total, name,'unpack');
                        },ARG.password||headers.password)||response;
                    }else if(!ARG.type||ARG.type!='blob'){
                        response = await T.toFormatBlob(response,ARG.type,headers);
                    }
                }
                I.tryC(ARG,'success',response,headers);
            }
            return response;
        }
        FilterHeader(headers) {
            I.toArr(headers, (entry) => {
                let content = decodeURI(entry[1]);
                if(!!I.num(content))content = parseFloat(content);
                else if(content.indexOf('GMT')!==-1)content = new Date(content);
                if (entry[0].indexOf('content')!==-1) {
                    headers[entry[0]] = content;
                    let name = I.R(entry[0], /content-/);
                    switch (name) {
                        case "disposition":
                            let attachName = content.match(/^attachment;\s*filename=[\"\']+?(.+)[\"\']+?$/i);
                            if (attachName && attachName[1]) {
                                headers.filename = decodeURI(attachName[1]);
                            }
                            break;
                        case "length":
                            headers.filesize = I.toInt(content) || 0;
                        case "password":
                            headers[name] = content;
                            break;
                        case "type":
                            content = I.toLow(content);
                            let v = content.split(/;/);
                            headers[name] = v[0].trim();
                            if (v[1])
                                headers.charset = I.toLow(v[1].split(/=/).pop().trim());

                            break;
                    }
                }else{
                    headers[entry[0]] = content;
                }
            });
            return headers;
        }
        async getLibFile(name,progress,version,libext){
            return await this.getTable(this.LibStore).fetch({url:name.indexOf('http')===0?name:this.libPath+name,libjs:'script-',version:version||this.version,progress,libext})
        }
        async getLibLink(name,progress,version,libext){
            if(!this.libjsBlob[name]){
                this.libjsBlob[name] = this.URL(await this.getLibFile(name,progress,version,libext));
            }
            return this.libjsBlob[name];
        }
        async addLib(name,progress,version,libext){
            if(!this.libjsBlob[name]){
                await this.addJS(
                    await this.getLibLink(name,progress,version,libext),
                    !0,
                    (libext||name).indexOf('.css')===-1?!1:!0
                );
            }
        }
        /**
         * 获取或者提交远程数据
         * @param {*} ARG 
         * @returns {Promise<XMLHttpRequest.response>}
         */
        ajax(ARG) {
            /**
             * @type {XMLHttpRequest}
             */
            const request = new XMLHttpRequest;
            const T = this;
            if(!ARG||!ARG.method)ARG = T.FetchARG(ARG);
            return I.Async(back => {
                const result = [];
                let filename = T.getName(ARG.url);
                request.on('readystatechange', e => {
                    switch (request.readyState) {
                        case request.UNSENT:
                            //0
                            I.tryA(request,ARG.success,result);
                            back(result[0]);
                            break;
                        case request.HEADERS_RECEIVED:
                            //2
                            const headerText = I.tryC(request, request.getAllResponseHeaders);
                            const headers = T.FilterHeader(
                                I.toObj(
                                    I.Mach(
                                        headerText.trim().split(/\n+/),
                                        line => {
                                            return I.Mach(line.split(/:\s+/), t => {
                                                return I.R(t.trim(), /^"(.+)"$/, '$1')
                                            })
                                        }
                                    )
                                ));
                            let type = ARG.type||headers['type'].split('/')[1].trim();
                            if(headers['filename']){
                                filename = headers['filename'];
                            }
                            if(type!='head'&&ARG.charset)type = 'u8';
                            result.push(headers);
                            switch (type) {
                                case 'u8':
                                case 'buf':
                                    request.responseType = 'arraybuffer';
                                    break;
                                case 'html':
                                    request.responseType = 'document';
                                    break;
                                case 'json':
                                case 'xml':
                                    request.responseType = type;
                                    break;
                                case 'file':
                                case 'blob':
                                case 'javascript':
                                    request.responseType = 'blob';
                                    break;
                                case 'svg':
                                case 'svg+xml':
                                case 'js':
                                case 'text':
                                    request.responseType = 'text';
                                    break;
                                default:
                                    request.responseType = /(text|javascript|ini)/.test(headers['type']) ? 'text' : 'blob';
                                    break;
                            }
                            break;
                        case request.DONE:
                            //4
                            let htype = result[0]&&result[0]['type']||T.getMime();
                            if(ARG.type!='head'){
                                let contents = request.response;
                                if (I.blob(contents)) {
                                    contents = I.File([contents],filename,contents.type||htype);
                                }
                                if (I.buf(contents)) {
                                    contents = I.toU8(contents);
                                    if(ARG.charset){
                                        contents = I.decode(contents,ARG.charset);
                                        const type = ARG.type||htype.split('/')[1].trim();
                                        if(type=='blob') contents = I.File([contents],filename,contents.type||htype);
                                        if(type=='buf'||type=='u8') contents = I.encode(contents);
                                        //if(type=='html') contents = T.docElm(contents);
                                    }
                                }
                                result.unshift(contents);
                                if(request.status!=200){
                                    I.tryA(request,ARG.error,result);
                                    return back(null);
                                }
                            }
                            I.tryA(request, ARG.success,result);
                            back(result[0]);
                            break;
                    }
                });
                request.on('progress', e => {
                    I.tryC(request, ARG.progress, !0, e.loaded, e.total, '');
                });
                request.upload.on('progress', e => {
                    I.tryC(request, ARG.progress, !1, e.loaded, e.total, '');
                });
                request.open(I.toUp(ARG.method),ARG.href);
                I.toArr(ARG.headers, (entry) => {
                    request.setRequestHeader(entry[0], entry[1]);
                });
                request.send(ARG.post);
            });
        }
        async ZipWorker(contents,progress,pwFn){
            if(!contents) return contents;
            let T = this;
            return await T.getMessage('unpack',contents,function(clientID,back){
                return async function(data){
                    if(!I.nil(data.result)){
                        back(data.result||null);
                        delete T.action[data.clientID];
                    }else if(data.state=='progress'){
                        progress&&progress(data.current, data.total,data.filename);
                    }else if(data.state=='password'){
                        let workerId = data.workerId;
                        let password = data.password;
                        if(I.buf(password)) password = I.decode(password,'gbk');
                        if(!password&&I.str(pwFn))password = pwFn;
                        else password = I.fn(pwFn) ? await pwFn(data.password):prompt('请输入密码', data.password);
                        if(!data.isUTF8&&password){
                            password = I.toGB2312(password);
                        }
                        T.postMessage({workerId,result:password||false});
                    }

                }
            });
        }
        async ZipCompress(contents,progress,password,pack,notips){
            if (I.nil(exports.zip)) {
                await T.addLib('zip.min.js');
            }
            if(I.bool(password)){
                pack = password; 
                password = undefined;
            }
            const zip = exports.zip;
            if(pack===true){
                const zipFileWriter = new zip.BlobWriter();
                const zipWriter = new zip.ZipWriter(zipFileWriter);
                let filename;
                const addFile = data=>{
                    if(!filename)filename=data.name;
                    return zipWriter.add(data.name, new zip.BlobReader(data), { onprogress: (current, total) =>progress&&progress(current, total,data.name,'pack'), password });
                }
                if(I.buf(contents))contents = I.File([contents],'unknow.data',T.getMime());
                if (I.blob(contents)) {
                    await addFile(contents);
                } else {
                    I.ForOf(contents,async itemdata=>{
                        if(I.array(itemdata)){
                            itemdata = I.File([itemdata[1]],itemdata[0],T.getMime(itemdata[0]));
                        }else if(I.buf(itemdata)){
                            itemdata = I.File([itemdata],'unknow.data',T.getMime());
                        }
                        await addFile(itemdata);

                    });
                }
                await zipWriter.close();
                return I.File([await zipFileWriter.getData()],filename+'.zip',T.getMime('zip'));
            }else{
                const pwText = 'Enter password.';
                const ReaderList = await new zip.ZipReader(new zip.BlobReader(I.blob(contents)?contents:I.toBlob(contents))).getEntries().catch(e=>null);
                let result;
                const getData = (entry)=>{
                    let rawPassword;
                    if(entry.encrypted){
                        if(password){
                            rawPassword = I.buf(password)?password:entry.filenameUTF8==false?I.toGB2312(password):I.encode(password);
                        }
                    }
                    return entry.getData(new zip.Uint8ArrayWriter(), {rawPassword, onprogress: (current, total) =>{progress&&progress(current, total,entry.filename,'unpack');}}).catch(async e=>{
                        let msg = e.message;
                        if(password===false || notips) return;
                        if(msg == zip.ERR_INVALID_PASSWORD||msg==zip.ERR_ENCRYPTED){
                            if(I.buf(password)) password = I.decode(password,'gbk');
                            password = prompt(pwText, password);
                            if(password){
                                return await getData(entry);
                            }else{
                                password = false;
                            }
                        }
                    });
                }
                if(ReaderList){
                    for await(let entry of ReaderList){
                        if(entry.directory)continue;
                        let data = await getData(entry);
                        if(data){
                            if(!result)result={};
                            result[entry.filename] = data;
                        }
                    }
                }
                return result;
            }
        }
        /**
         * 
         * @param {Uint8Array|Blob} contents 
         * @param {null|Function} progress 
         * @param {String|Uint8Array} password 
         * @param {Boolean} notips 
         * @returns 
         */
        async Decompress(contents,progress,password,notips){
            const pwText = 'Enter password.';
            let buf = contents.slice(0,6);
            if(I.blob(buf))buf = await I.toU8(buf);
            buf = I.toUp(I.buf2str(buf));
            if(/^504B0304/.test(buf))return T.ZipCompress(contents,progress,password,!1,notips);
            let ext = /^52617221/.test(buf)?'rar':/^377ABCAF271C/.test(buf)?'7z':undefined;
            if(!ext) return null;
            contents = await I.toU8(contents);
            const url = await T.getLibLink(/7z$/.test(ext) ?'extract7z.zip':'libunrar.min.zip', progress);
            if (!url) return null;
            return I.Async(complete => {
                let result,worker = new Worker(url);
                worker.on('message', e => {
                    if (I.obj(e.data)) {
                        const {
                            t,
                            data,
                            file,
                            total,
                            current,
                            name
                        } = e.data;
                        if (t == 1) {
                            complete(result);
                        } else if (t == 2) {
                            !result && (result = {});
                            return data && (result[file] = data);
                        } else if (t == 4) {
                            return (total > 0 && total >= current) && I.tryC(progress,progress,current, total, name || file);
                        } else if (t === -1) {
                            if(notips){
                                complete(null);
                            }else{
                                password = prompt(this.pwText, password || "");
                                if (!password) {
                                    complete(null);
                                } else {
                                    return worker.postMessage({
                                        password
                                    });
                                }
                            }
                        }
                        worker.terminate();
                    }
                });
                worker.on('error', e => {
                    complete(null);
                    worker.terminate();
                });
                worker.onmessageerror = e => worker.toEvent('error');
                worker.postMessage({
                    contents,
                    password
                });

            })
        }
        addJS(buf, cb, iscss) {
            return I.Async(back => {
                let url = !I.str(buf)?this.URL(buf,iscss?'css':'js'):buf;
                const data = {
                    crossorigin: "anonymous",
                    onload(e) {
                        back(I.fn(cb) && cb(e)||e);
                    },
                    onerror(e) {
                        back(I.fn(cb) && cb(e)||e);
                    }

                };
                if(iscss){
                    data.rel = StyleSheet.name;
                    data.href = url;
                }else{
                    data.src = url;
                }
                let elm = this.$add(iscss?'link':'script',iscss?document.head:document.body);
                for(let arr in data){
                    elm[arr]=data[arr];
                }
                //I.setElm(this.$add(iscss?'link':'script'),data);
            });

        }
        /**
         * 创建URL
         * @param {*} u8 
         * @param {*} type 
         * @returns 
         */
        URL(u8, type) {
            if (I.str(u8) && u8.length < 255 && /^(blob|http|\/{1,2}(?!\*)|\.\/|.+\/)[^\n]*?$/i.test(u8)) {
                return u8;
            }
            if(!type) type = I.blob(u8)?u8.type:'js';
            return URL.createObjectURL(I.blob(u8) ? u8 : new Blob([u8], {type:this.getMime(type)}));
        }
        /**
         * 释放URL资源
         * @param {*} url 
         * @returns 
         */
        reURL(url) {
            return URL.revokeObjectURL(url);
        }
        customElement(myelement,funs) {
            if(!customElements.get(myelement)){                
                /**
                 * 自定义HTML标签类绑定
                 */
                const CustomElement = class extends HTMLElement {
                    /* 警告 如果文档处于加载中,自定义元素实际上并不能读取子元素(innerHTML等) */
                    /*因此 如果仅仅操作属性(Attribute),可以比元素出现前提前定义.否则最好文档加载完毕再定义,并不会影响事件触发 */
                    constructor() {
                        super();
                        const callback = this.dataset.callinit;
                        this.tag_name = this.tagName.toLowerCase();
                        this.goFunc(callback||'Init');
                    }
                    goFunc(mode,...arg){
                        if(this[mode])return this[mode](...arg);
                        const action = this.tag_name.replace(/\-(\w)/,e=>e[1].toUpperCase());
                        console.log(action+mode);
                        I.tryA(this,T.action[action+mode],arg);
                    }
                    connectedCallback(...a) {
                        /*文档中出现时触发*/
                        const callback = this.dataset.callback;
                        this.goFunc(callback||'Connected',...a);
                    }
                    attributeChangedCallback(...a) {
                        /*attribute增加、删除或者修改某个属性时被调用。*/
                        const callback = this.dataset.callattr;
                        this.goFunc(callback||'AttrChange',...a);
                    }
                    disconnectedCallback(...a) {
                        /*custom element 文档 DOM 节点上移除时被调用*/
                        const callback = this.dataset.callremove;
                        this.goFunc(callback||'Disconnected',...a);
                    }
                }
                if(funs){
                    Object.assign(CustomElement.prototype,funs);
                }
                customElements.define(myelement,CustomElement);
            }
        }
        Err(msg) {
            return new Error(msg);
        }
        async download(name, buf, type) {
            let href;
            if (!buf && name) {
                buf = name;
                name = null;
            }
            if (/^(http|blob:|data:)/.test(buf)) {
                href = buf;
                if (!name && /^(http|blob:)/.test(buf))
                    name = this.getName(buf);

            } else if (buf) {
                if(I.file(buf))name=buf.name;
                href = this.URL(buf, type);

            }
            if (!name)name = 'explame.html';
            return I.Async(back=>{                
                const a = this.$ce('a');
                a.href = href;
                a.download = name;
                a.click();
                a.remove();
                back(!0);
            })
        }
        toSet(o) {
            o = o || new class extends EventTarget { };
            o.action = o.action || {};
            const {RF, CF, BF} = this;
            Object.assign(o,{RF,CF,BF});
            return o;
        }
        $(e, f) {
            return e ? (I.str(e) ? (f || document).querySelector(e) : I.fn(e) ? T.docload(e) : e) : undefined;
        }
        $$(e, f) {
            return (f || document).querySelectorAll(e) || [];
        }
        $ce(str){
            return document.createElement(str||'div');
        }
        $add(elm,d){
            if(!elm||I.str(elm))elm=this.$ce(elm);
            return (d||document.body).appendChild(elm);
        }
        docElm(str, mime) {
            return new DOMParser().parseFromString(str, mime || document.contentType).documentElement;
        }
        RF(action, data) {
            return I.tryA(this,this.action[action],data,!0);
        }
        CF(action, ...args) {
            return this.RF(action, args);
        }
        BF(action, o, ...a) {
            const R = this, A = R.action[action];
            return I.fn(A) ? I.tryA(o, A, a) : undefined;
        }
        async toZip(files, progress, password) {
            return T.ZipCompress(files,progress,password,!0);
        }
        /**
         * 上传文明
         * @param {*} fn 
         * @param {*} Accept 
         * @param {boolean} multiple
         */
        upload(fn, accept, multiple) {
            const input = this.$ce('input');
            I.setElm(input,{
                type: File.name,
                accept,
                multiple,
                change() {
                    this.remove();
                    I.tryC(this, fn, I.toArr(this.files));
                },
                cancel() {
                    this.remove();
                }

            }).click();
        }
        async postMessage(str,sw) {
            if(!sw){
                let workerCtrl = await T.SW.registration;
                sw = workerCtrl.active;
            }
            if(I.await(sw)) sw = await sw;
            sw&&sw.postMessage(str);
        }
        getRandStr(){
            return btoa(I.tryC(crypto,'randomUUID')||performance.now()+Math.random()).replace(/[^\w]/g,'');
        }
        toReplace(str, arg) {
            if (I.str(arg)) {
                str = I.R(str, /{value}/, arg);
            } else if (I.obj(arg)) {
                I.toArr(arg, v => str=I.R(str, new RegExp(v[0], "g"), v[1]));
            }
            return str;
        }
        getLang(name, arg) {
            if (!I.none(T.language[name])) name = T.language[name];

            return arg ? T.toReplace(name, arg) : name;
        }
        /**
         * 根据方法回调worker处理
         * @param {*} method 
         * @param {*} result 
         * @param {*} fn 
         * @returns 
         */
        getMessage(method,result,fn){
            let T = this;
            return I.Async(back=>{
                let clientID = T.getRandStr();
                T.action[clientID] = I.fn(fn)?fn(clientID,back):function(data){
                    back(data.result);
                    T.action[clientID] = null;
                    delete T.action[clientID];
                    delete data.result;
                    data = null;
                };
                T.postMessage({clientID,method,result});
            });
        }
        async getTemplate(name,data){
            let template = await this.getTable('libjs').ajax({url:'/template-'+name+'.html',type:'text'});
            I.toArr(data,entry=>{
                template = template.replace(new RegExp(entry[0],'g'),entry[1]);
            });
            template = template.replace(/\{[\w\-\_]+?\}/,'');
            return template;
        }
        /**
         * 获取目录
         * @param {*} url 
         * @returns 
         */
        getPath(url) {
            const p = '/';
            return url && I.toStr(url.split(p).slice(0, -1),p) + p
        }
        getName(str) {
            return I.str(str)?str.split('/').pop().split(/\?/)[0].split(/\#/)[0]:'';
        }
        dirname(path,num){
            if(!num)num=1;
            return I.toStr(this.getPath(path).split('/').slice(0,-1-num),'/')+'/';
        }
        getExt(name) {
            return I.toLow(this.getName(name).split(".").pop());
        }
        getKey(name) {
            return I.R(this.getName(name), /\.\w+$/);
        }
        exttype = {};
        setMime() {
            this.extlist = I.toObj(
                [].concat(...(
                    "text;css,scss,sass,xml,vml,style:css,htm:html|php,txt:plain,m3u8:plain,js:javascript\n" +
                    "image;jpg,jpeg,png,gif,webp,avif,apng,heic,svg:svg+xml\n" +
                    "font;woff,woff2,ttf,otf\n" +
                    "application;pdf,json,js:javascript,*:octet-stream,zip:zip|x-zip-compressed,rar:rar|x-rar-compressed,7z:7z|x-7z-compressed,wasm\n"+
                    "audio;ogg,wma,mp3,m4a:mp4\n"+
                    "video;mp4,mp2t").split(/\n/).map(a => {
                        a = a.split(/;/);
                        return [].concat(...a[1].split(/,/).map(c => {
                            c = c.split(/:/);
                            let e = c[1]&&c[1].split('|')||[c[0]];
                            let arr=[];
                            for(let i=0;;i++){
                                if(!e[i])break;
                                let d = a[0] + '/' +e[i];
                                this.exttype[d] = c[0];
                                arr.push([c[0],d])
                            }
                            return arr;
                        }))
                    })))
        }
        getMime(type) {
            if (!this.extlist) this.setMime();
            type = type && I.toLow(type) || "";
            if (this.exttype[type]) return type;
            if (/^\w+\/[\w\;]+$/.test(type)) return type;
            else if (!/^\w+$/.test(type)){
                type = this.getExt(type) || type.split('.').pop();
            }
            return this.extlist[type] || this.extlist['*'];
        }
        Mime(type){
            let T = this;
            if (!T.extlist) T.setMime();
            if(T.exttype[type]) return T.exttype[type];
            type = type&&type.split('/').pop().split(';')[0].split('+')[0].trim();
            if(type){
                if(type.indexOf('x-')!==false){
                    type = type.match(/x\-(\w+)/);
                    if(type[1]){
                        return type[1]
                    }  
                }else if(/^\w+$/.test(type)){
                    return type;
                }
            }
            return '';
        }
        action = {};
        docload(f) {
            if (document.readyState == 'complete') I.tryC(this,f);
            else {
                const func = e=>{
                    if(document.readyState=='complete'){
                        I.tryC(this,f);
                        document.un('readystatechange',func);
                    }
                };
                document.on('readystatechange',func);
            }
        }
        showWin(ARG){
            let wbox = T.$ce('dialog');
            wbox.setAttribute("aria-modal","true");
            if(ARG.id){
                wbox.setAttribute('id',ARG.id);
            }
            I.addClass(wbox,'wbox',ARG.type||'blue');
            if(ARG.class){
                I.addClass(wbox,...ARG.class);
            }
            if(ARG.time){
                if(I.str(ARG.time))I.setStyle(wbox,'--wb-time',ARG.time);
                I.addClass(wbox,'autoclose');
                wbox.on('animationend',function(){
                    I.removeClass(this,'autoclose');
                    this.toEvent('hide');
                })
            }
            ['title','content','foot'].forEach(v=>{
                let vdiv = T.$add(!1,wbox);
                I.addClass(vdiv,v);
                if(ARG[v]){
                    vdiv.innerHTML = ARG[v];
                }
                if(v=='title'){
                    let btn = T.$add('button',vdiv);
                    btn.innerHTML = '&#61453;';
                    I.addClass(btn,'close');
                    btn.on('click',function(e){
                        e.preventDefault();
                        this.parentNode.parentNode.toEvent('hide');
                    });
                }
                if(v=='foot'&&ARG.action){
                    I.toArr(ARG.action,entry=>{
                        let btn = T.$add('button',vdiv);
                        btn.innerHTML = entry.title;
                        I.addClass(btn,'action','w-btn');
                        if(entry.css)btn.style.cssText = entry.css;
                        btn.on('click',entry.click);
                    });
                }
            });
            if(!I.bool(ARG.lock)){
                if('showPopover' in HTMLElement.prototype){
                    wbox.popover = 'auto';
                    wbox.on('hide',function(){
                        this.hidePopover();
                        this.toEvent('close');
                    });
                    wbox.on('show',function(){
                        this.showPopover();
                    });
                    T.$add(wbox);
                    return wbox.toEvent('show');
                }
                if('showModal' in wbox){
                    wbox.on('hide',function(){
                        this.close('hide');
                        this.toEvent('close');
                    });
                    wbox.on('show',function(){
                        this.showModal();
                    });
                    T.$add(wbox);
                    return wbox.toEvent('show');
                }

            }
            let div = T.$ce();
            I.addClass(div,'w-mask');
            T.$add(wbox,div);
            T.$add(div);
            div.on('show',function(){
                this.hidden=!1;
            });
            div.on('hide',function(){
                this.hidden=!0;
                this.toEvent('close');
            });
            wbox.on('hide',function(){
                this.parentNode.toEvent('hide');
            });
            wbox.on('show',function(){
                this.parentNode.toEvent('show');
            });
            !ARG.lock&&div.on('click',function(e){
                if(e.target===this)this.toEvent('hide');
            });
            div.toEvent('show');
            return div;
        }
        constructor() {
            super();
            const T = this;
            Object.assign(exports, { T, I });
            I.defines(exports, {Nenge: T}, 1);
            Object.assign(EventTarget.prototype, {
                /**
                 * 绑定事件
                 * @param {*} evt 
                 * @param {*} fun 
                 * @param {*} opt 
                 * @returns 
                 */
                on(evt, fun, opt) {
                    return this.addEventListener(evt, fun, opt), this;
                },
                /**
                 * 解绑事件
                 * @param {*} evt 
                 * @param {*} fun 
                 * @param {*} opt 
                 * @returns 
                 */
                un(evt, fun, opt) {
                    return this.removeEventListener(evt, fun, opt), this;
                },
                /**
                 * 绑定一次事件
                 * @param {*} evt 
                 * @param {*} fun 
                 * @param {*} opt 
                 * @returns 
                 */
                once(evt, fun, opt) {
                    return this.on(evt, fun, Object.assign({
                        passive: !1,
                        once: !0,
                    }, opt === true ? { passive: !0 } : opt || {})), this;
                },
                /**
                 * 触发自定义事件
                 * @param {*} evt 
                 * @param {*} detail 
                 */
                toEvent(evt, detail) {
                    return this.dispatchEvent(typeof evt=='string'?new CustomEvent(evt, { detail }):evt), this;
                }
            });
            Object.assign(HTMLElement.prototype,{
                AddStyle(text,bool){
                    const css = T.css;
                    if(!I.num(this.RuleIndex)){
                        this.RuleIndex = css.Elm2Rule(this,text);
                    }else if(bool){
                        css.setCSS(text,this.RuleIndex);
                    }else if(text){
                        css.pushCSS(text,this.RuleIndex);
                    };
                    return this.RuleIndex;
                },
                SetCSS(text){
                    return this.AddStyle(text,!0),this;
                },
                RuleItem(){
                    return T.css.ruleItem(this.AddStyle());
                },
                GetRule(){
                    return T.css.getRule(this.RuleIndex);
                },
                GetCSS(){
                    return T.css.getCSS(this.RuleIndex);
                },
                NewRule(){
                    return T.css.NewRule(this.AddStyle());
                },
                AddMeida(media){
                    return this.NewRule().addMedia(media);
                },
                RemoveRule(){
                    if(I.num(this.RuleIndex))T.css.delRule(this.RuleIndex);
                    return this;
                }
            });
            let { language, onLine } = navigator;
            let { readyState, currentScript, characterSet } = document;
            let src = currentScript && currentScript.src.split(/\?/),
                JSpath = src && T.getPath(src[0]),
                langs = I.toLow(language).split("-");
            if (langs[0] == "zh") {
                if (langs[1] == "cn")
                    langs[1] = "hans";
                else if (langs[1] != "hk")
                    langs[1] = "hant";

            }
            Object.assign(T, {
                I,
                JSpath,
                libPath: JSpath + 'lib/',
                ROOT: T.dirname(JSpath,2),
                i18nName: I.toStr(langs,"-"),
                langName: language,
                onLine,
                readyState,
                isTouch:I.I(HTMLElement,'ontouchstart'),
                css:new CustomCSS()
            });
            if(currentScript){
                let dataAttr = currentScript.dataset;
                T.debug = dataAttr.debug;
                if(dataAttr.sw){
                    T.SW = new CustomPWA(T,'/sw.js');
                    Object.assign(T.action,{
                        pwa_loader(){
                            let foot = T.$('#footer');
                            if(foot){
                                let elm = T.$add('button',foot);
                                elm.innerHTML = 'PWA操作';
                                elm.on('click',async function(e){
                                    e.preventDefault();
                                    let pwa_tag = T.$('#pwa_tag');
                                    if(!pwa_tag){
                                        return T.showWin({
                                            id:'pwa_tag',
                                            class:['min'],
                                            title:'ServiceWorker管理',
                                            content:'缓存是指ServiceWorker中的caches缓存下来的web请求.<p>感觉数据被缓存,点击清空缓存!</p>',
                                            action:[
                                                {
                                                    title:'更新脚本',
                                                    click(){
                                                        T.SW.postSync('update');
                                                    }
                                                },
                                                {
                                                    title:'更新缓存',
                                                    click(){
                                                        T.SW.postSync('cache_check');
                                                    }
                                                },
                                                {
                                                    title:'清空缓存',
                                                    click(){
                                                        T.SW.postSync('cache_clear');
                                                    }
                                                },
                                                {
                                                    title:'卸载',
                                                    click(){
                                                        T.SW.postSync('unregister');
                                                    }
                                                },
                                                {
                                                    title:'刷新页面',
                                                    click(){
                                                        location.reload();
                                                    }
                                                }
                                            ],
                                            lock:!0,
                                            time:'5s',
                                        });
                                    }
                                    pwa_tag.toEvent('show');
                                });
                            }

                        },
                        notification_error(){
                            T.showWin({title:'警告',content:'通知权限被禁止',lock:!0,time:'3s'})
                        },
                        pwa_activate(){
                            T.showWin({
                                title:'提醒!',
                                content:'ServiceWorker 安装成功!',
                                action:[
                                    {
                                        title:'更新缓存(建议)',
                                        click(){
                                            T.SW.postSync('cache_check');
                                        }
                                    },
                                    {
                                        title:'清空缓存',
                                        click(){
                                            T.SW.postSync('cache_clear');
                                        }
                                    },
                                    {
                                        title:'刷新页面',
                                        click(){
                                            location.reload();
                                        }
                                    }
                                ],
                                lock:!0,
                                time:'3s',
                            });
                        },
                        pwa_cache_update(data){
                            T.showWin({title:'提醒',content:'本站缓存更新'+data.result+'个文件',time:'2s'})
                        },
                        pwa_cache_clear(){
                            T.showWin({title:'提醒',content:'Caches缓存已被清空!',lock:!0})
                        },
                        pwa_cache_delete(){
                            T.showWin({title:'提醒',content:'本站缓存已被清空!',time:'2s'})
                        },
                        pwa_update(){
                            T.showWin({title:'提醒',content:'脚本更新检测完毕!',lock:!0})
                        },
                        pwa_remove(){
                            T.showWin({title:'提醒',content:'已经替你卸载脚本,请关闭网站!',lock:!0}).on('close',function(){
                                location.href='about:blank';
                                window.close()
                            });
                        }
                    });
                }
                T.docload(async e=>{
                    const {router,fonts,version} = dataAttr;
                    T.version = version?parseInt(version):T.version;
                    const assetsPath = T.dirname(T.JSpath);
                    if(fonts){
                        I.toArr(new Set(fonts.split(',')),name=>T.getTable('libjs').fetch({url:assetsPath+name.split(':')[1],key:!0}).then(buf=>T.css.addFont(buf,name.split(':')[0])));
                    }
                    if(router){
                        await I.Async(I.toArr(new Set(router.split(',')),name=>name&&T.addJS(T.JSpath+'router/'+name+'.js?'+T.version,!0,!1)));
                    }
                    T.toEvent('ready');
                });
            }
        }
    };
    window.onerror = e=>alert(e);
});