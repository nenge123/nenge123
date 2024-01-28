/*在callMain之前加入*/
Module.RA.context = new window["AudioContext"] || window["webkitAudioContext"];
/*ElmResume 为一个遮罩控件  例如 点击继续  */
ElmResume.addEventListener('click',e=>{
    Module.RA.resume(e=>{
      if(!Module.runing){
        Module.callMain(Module.arguments);
        Module.runing = !0;
      }else{
        Module.resumeMainLoop();
      }
    });
});
Module.RestAudio  = function(){
  if (M.RA.context.state != "running"){
    if(Module.runing) Module.pauseMainLoop();
    ElmResume.hidden = false;
  }else if(!Module.runing){
    Module.callMain(Module.arguments);
    Module.runing = !0;
  }
}
Module.RestAudio();
/*在核心处理JS[mgba_libretro.js]里面加入*/
Module.RA = RA;
function _RWebAudioStart() {
  Module.RestAudio();
  return true
}
function _RWebAudioInit(latency) {
    RA.numBuffers = latency * RA.context.sampleRate / (1e3 * RA.BUFFER_SIZE) | 0;
    if (RA.numBuffers < 2) RA.numBuffers = 2;
    for (var i = 0; i < RA.numBuffers; i++) {
        RA.buffers[i] = RA.context.createBuffer(2, RA.BUFFER_SIZE, RA.context.sampleRate);
        RA.buffers[i].endTime = 0
    }
    RA.nonblock = false;
    RA.startTime = 0;
    RA.context.createGain();
    window["setTimeout"](RA.setStartTime, 0);
    Module["pauseMainLoop"]();
    return 1
}