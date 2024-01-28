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
        await T.addLib('sql.zip');
        const jsondata = await T.ajax({url:'config.json',type:'json'});
        if(!jsondata){
            return this.gotoPWA();
        }
        this.jsondata = jsondata;
        if(jsondata.mode=='sql'){
            return this.RUN_SQL(jsondata);
        }
    }
    async RUN_SQL(jsondata){
        let path = jsondata.path;
        let url = jsondata.url;
        let limit = jsondata.limit;
        if(jsondata.script){
            //if(T.isLocal)await T.addJS('/assets/js/router/template-pwa-script.js');
            //else 
            if(!T.isLocal)await T.addJS('/assets/js/router/template-pwa-script.js');
            else await T.addJS(path+'/script.js');
            //(new Function(jsondata.script))();
        }
        if(window.TEMPLATE_UPDATE_BUTTON){
            TEMPLATE_UPDATE_BUTTON(this);
        }
        switch(F.getName(location.href)){
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
};