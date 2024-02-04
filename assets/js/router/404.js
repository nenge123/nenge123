!(async function(){
    T.action['pwa_activate'] = function(){
        alert('ServiceWorker 安装成功');
        setTimeout(()=>location.reload(),3000);
    }
})();