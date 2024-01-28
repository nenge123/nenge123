const common = new class{
    constructor(T){
        T.SW.register('/sw.js');
        const LibStore = T.getTable('libjs');
        const assetsPath = F.dirname(T.JSpath);
        this.initHead();
    }
    initHead(){
        const navBtn = T.$('.menu-toggle');
        navBtn&&navBtn.on('click',function(e){
            this.classList.toggle('active');
        });
    }
}(Nenge);