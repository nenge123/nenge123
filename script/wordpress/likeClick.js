NengeNet = new class NengeApp{
    //localForage  http://localforage.docschina.org/
    DB = localForage.createInstance({'name': NengeNet,'storeName': "IndexPage"});
    constructor() {
        this.DB.keys().then(db_list => {
            this.DB_Ready();
        });
    }
    DB_Ready(){
        let N = this;
        /*创建一个自定义HTML元素映射 */
        N.createElement('like-click',function(type,element){
            let tagName = element.tagName.toLowerCase(),
                id = element.getAttribute('data-id'),
                once = element.getAttribute('data-once')&&true,
                func = (id)=>{
                    let data = N.CustomElemtData[tagName]||{};
                    if(data[id]){
                      //发现本地记录,HTML为点赞状态
                        element.querySelector('.like-words')&&(element.querySelector('.like-words').innerHTML='取消赞');
                        element.classList.add('active');
                    }else if(once){
                        console.log('运行一次');
                        N._Click_like(element)
                    }
                };
            if(!once)element.onclick = ()=>{N._Click_like(element);};
            if(N.CustomElemtData[tagName]){
                if(id){
                    func(id);
                }
                return ;
            }
            N.DB.getItem(tagName,(err,data)=>{
                N.CustomElemtData[tagName] = data;
                if(id){
                    func(id);
                }
            });
        });
    }
    _Click_like(elm) {
        let tagName = elm.tagName.toLowerCase(),
            dataId = elm.getAttribute('data-id'),
            dataArr = dataId.split('-'),
            dataNum = parseInt(dataArr[1]),
            dataKey = ['post','post_view','comment_zan','comment_cai'].includes(dataArr[0])&&dataArr[0],
            tagData = this.CustomElemtData[tagName]||{},
            isData = tagData[dataId];
            if(elm.getAttribute('data-lock'))return ;
            elm.setAttribute('data-lock',1);
        if (dataNum&&dataKey) {
            let setData = {
                    'action': tagName.replace('-','_'),
                    'id': dataNum,
                    'key': (isData==true ? 'remove':'add')+'_'+dataKey
                },
                bodyData = new FormData();
            for (var i in setData) {bodyData.append(i, setData[i]);}
            fetch(new Request('/wp-admin/admin-ajax.php', {
                'method': "POST",
                'body': bodyData
            })).then(response => response.json()).then(v => {
                let elmTxt = elm.querySelector('.like-words'),
                    elmc = elm.querySelector('.likes_count');
                if(v.result==true){
                    elm.classList.add('active');
                    elmc&&(elmc.innerHTML = v.num);
                    elmTxt&&(elmTxt.innerHTML='取消赞');
                    // 这里可以记录一个时间,这样可以设置多久后又能点赞~
                    tagData[dataId] = true;
                    this.DB.setItem(tagName,tagData,function(){});
                }else if(!isNaN(v.num)){
                    elm.classList.remove('active');
                    elmc&&(elmc.innerHTML = v.num);
                    elmTxt&&(elmTxt.innerHTML='赞一个');
                    // 取消点赞就删掉记录
                    tagData[dataId] = false;
                    this.DB.setItem(tagName,tagData,function(){});
                }
                elm.removeAttribute('data-lock');
            }).catch(e=>{
                elm.removeAttribute('data-lock');
            });
        }

    }
    CustomElemtData = {};
    createElement(myelement, func,func2) {
        let N = this;
        class MyElement extends HTMLElement {
            CALLFUNC = func;
            CLOSEFUNC = func2;
            connectedCallback() {
              //一旦初始化后就会立即运行
                if(this.getAttribute('data-install'))return;
                this.setAttribute('data-install',true);
                this.CALLFUNC('connect', this);
            }
            disconnectedCallback() {
                this.CLOSEFUNC&&this.CLOSEFUNC('remove', this);
            }
        }
        window.customElements.define(myelement, MyElement);
    }
}