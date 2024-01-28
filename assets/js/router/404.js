!(async function(){
    T.action['pwa_activate'] = function(){
        alert('ServiceWorker 安装成功');
        location.reload();
    }
})();