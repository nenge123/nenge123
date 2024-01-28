(function(){    
    var test = document.createElement('div'),
        on = (o,...a)=>o && Reflect.apply(addEventListener, o, a),
        css = [
            '#test{position:fixed;width:100px;height:100px;z-index:999;top:600px;background-color:#000;border:1px solid red;animation-name:rote-udd325110;animation-duration:10s;animation-timing-function:linear;animation-iteration-count:1}',
            '@keyframes rote-udd325110{from{top:0%}to{top:600px}}'
        ];
        test.id = "test";
        if(document.adoptedStyleSheets){
            let cssRule = new CSSStyleSheet({ media: "all" });
            css.forEach(v=>cssRule.insertRule(v));
            document.adoptedStyleSheets.push(cssRule);
        }else{
            //ios unsupport adoptedStyleSheets
            let x = document.body.appendChild(document.createElement('style'));
            x.innerHTML = css.join('');
        }
        document.body.appendChild(test);
    var _Animation = test.getAnimations()[0];
    ['animationstart','animationiteration','animationcancel','animationend'].forEach(v=>on(test,v,e=>console.log(e.type)));
    //no action output: animationend event;
    //if animation-iteration-count:infinite; no action output: animationiteration event;
    _Animation&&_Animation.ready.then(
        A=>{
            ["cancel","finish","remove"].forEach(v=>on(A,v,e=>console.log(e.type)));//if count!=infinite no action output: finish event;
            on(test,'click',e=>A[A.playState == "running" ? "pause":"play"]());//nothing ouptut
            //when animationend click will animationstart
        }
    );
})();