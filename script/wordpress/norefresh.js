var NengeNet = new class NengeApp {
    //用于解释HTML字符
    _DOM = new DOMParser();
    _FetchStateID = 0;
    _FetchStateData = {};
    _q = d => document.querySelector(d);
    _qAll = d => document.querySelectorAll(d);
    //要替换的页面内容的ID / class
    _content = '#content';
    constructor() {
        //监听后退事件 可不用
        window.addEventListener('popstate', (e) => {
            if (!this._FetchStateID) return;
            for (let index in this._FetchStateData) {
                const data = this._FetchStateData[index];
                console.log(history.state);
                if (data.url == location.href) {
                    document.title = data.title;
                    this._q(this._content).innerHTML = data.page;
                    this._FetchStateID = data.state;
                    this.AddBind();
                    return;
                }

            }
            location.reload();
        }, false);
        this.AddBind();
    }
    AddBind() {
        //对连接进行事件绑定 并且数据处理
        if (!this._FetchStateData[this._FetchStateID]) this._FetchStateData[this._FetchStateID] = {
            'state': this._FetchStateID++,
            'page': this._q(this._content).innerHTML,
            'title': document.title,
            'url': location.href
        };
        this._qAll('#page a').forEach(
            elm => {
                if (elm.onclick) return;
                if (elm.target == '_blank') return;
                if (!elm.href) return;
                let myURL = new URL(elm.href);
                if (myURL.host == location.host && this.Fetch_CheckURL(myURL.pathname)) {
                    elm.onclick = event => {
                        if (elm.href) {
                            event.preventDefault();
                            event.stopPropagation();
                            fetch(elm.href).then(v => v.text()).then(text => {
                                let html = this.parseHTML(text), page = html.querySelector(this._content);
                                if (page) {
                                    this._q(this._content).innerHTML = page.innerHTML;
                                    document.title = html.title;
                                    html = null, page = null;
                                    window.history.pushState({ 'pageid': this._FetchStateID }, document.title, elm.href);
                                    this.AddBind();
                                    let Timer = setInterval(() => {
                                        let Y = window.scrollY, _Y = Y * .5;
                                        if (Y <= 0) return clearInterval(Timer);
                                        window.scrollTo(0, _Y < 10 ? 0 : _Y);
                                    }, 50)
                                } else {
                                    alert('页面打开失败');
                                }
                            });
                        }
                    }
                }
            }
        );
    }
    Fetch_CheckURL(path) {
        //过滤地址
        var re = [
            /^\/index\.php$/,
            /^\/$/,
            /\/\d+\//,
            /\/date\/\d+\/\d+\//,
            /\/category\/[^\/]+?\//

        ];
        for (var i = 0; i < re.length; i++) {
            if (re[i].test(path)) return true;
        }
        return false;
    }
    parseHTML(text) {//把字符解释成HTML
        return this._DOM.parseFromString(text, "text/html");
    }
}