var MySite = new (class{
    constructor(T){
        const LibStore = T.getTable('libjs');
        const assetsPath = F.dirname(T.JSpath);
        this.initHead();
    }
    initHead(){
        const navBtn = T.$('.menu-toggle');
        navBtn&&navBtn.on('click',function(e){
            e.preventDefault();
            this.classList.toggle('active');
        });
        this.init();
    }
    async init(){
    }
})(Nenge);