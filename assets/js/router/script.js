var MySite = new (class{
    constructor(T){
        this.initHead();
    }
    initHead(){
        const navBtn = T.$('.menu-toggle');
        navBtn&&navBtn.on('pointerup',function(e){
            e.preventDefault();
            this.classList.toggle('active');
        });
        this.init();
    }
    async init(){
        T.action['pwa_headers'] = function(e){
            console.log(e.result);
        };
    }
})(Nenge);