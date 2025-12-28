export function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

export function getUI() {
  return {
    //tabs
    tabDraw: $("tabDraw"),
    tabCam: $("tabCam"),
    drawStage: $("drawStage"),
    camStage: $("camStage"),
    cameraDetails: $("cameraDetails"),

    //canvases
    wavePad: $("wavePad"),
    timePad: $("timePad"),
    beatPreview: $("beatPreview"),
    camView: $("camView"),

    //status _ buttons
    camStatus: $("camStatus"),
    camBtn: $("camBtn"),
    playBtn: $("playBtn"),
    sineWaveBtn: $("sineWaveBtn"),
    clearWaveBtn: $("clearWaveBtn"),
    clearTimeBtn: $("clearTimeBtn"),

    //camera scanning toggles
    scanWaveBtn: $("scanWaveBtn"),
    scanTimeBtn: $("scanTimeBtn"),
    scanBeatBtn: $("scanBeatBtn"),

    //domains list
    addDomainBtn: $("addDomainBtn"),
    delDomainBtn: $("delDomainBtn"),
    domainList: $("domainList"),

    //sliders
    gain: $("gain"),
    beatGain: $("beatGain"),
    smooth: $("smooth"),
    thresh: $("thresh"),
    fps: $("fps"),
    bpm: $("bpm"),
    fmin: $("fmin"),
    fmax: $("fmax"),
    quant: $("quant"),
    beatSteps: $("beatSteps"),
    dashRatio: $("dashRatio"),

    //labels
    gainVal: $("gainVal"),
    beatGainVal: $("beatGainVal"),
    smoothVal: $("smoothVal"),
    threshVal: $("threshVal"),
    fpsVal: $("fpsVal"),
    bpmVal: $("bpmVal"),
    fminVal: $("fminVal"),
    fmaxVal: $("fmaxVal"),
    quantVal: $("quantVal"),
    beatStepsVal: $("beatStepsVal"),
    dashRatioVal: $("dashRatioVal"),
  };
}
