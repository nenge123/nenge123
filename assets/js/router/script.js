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
    execMime = [
        ['png', /^89504E470D0A1A0A/],
        ["gif", /^47494638(3761|3961)/],
        ["jpg", /^FFD8FFE000104A464946/],
        ["webp", /^52494646\w{8}57454250/],
        ["pdf", /^255044462D312E/],
        ["bmp", /^424D\w{4}0{8}/]
    ];
})(Nenge);