(function(){
    function scrollToTop(pos){
        let docbody = document.body,dochtml = document.documentElement;
        let top2 = dochtml.scrollTop;      
        let keyframes = [
            { 'marginTop': (0-top2)+'px' },//from
            { 'marginTop': 0+"px" },//to
        ];
        let options = {
                //delay 延迟开始动画多少ms 默认值0
                //endDelay 动画结束后延时多少ms
                easing:"ease-out",//速率 linear,ease-in
                duration: 800,//动画所需ms
                iterations: 1,//循环次数
        };
        //docbody.style.setProperty('margin-top',(0-top2)+'px');
        dochtml.scrollTop=pos;
        let _Animation = docbody.animate(keyframes,options);
        _Animation.addEventListener('finish',e=>{
            //docbody.style.removeProperty('margin-top');
        });
    }
    scrollToTop(100);
})();