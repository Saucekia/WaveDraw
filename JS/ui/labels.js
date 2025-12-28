export function updateLabels(ui) {
  ui.gainVal.textContent = Number(ui.gain.value).toFixed(3);
  ui.beatGainVal.textContent = Number(ui.beatGain.value).toFixed(3);
  ui.smoothVal.textContent = Number(ui.smooth.value).toFixed(2);
  ui.threshVal.textContent = Number(ui.thresh.value).toFixed(0);
  ui.fpsVal.textContent = Number(ui.fps.value).toFixed(0);
  ui.bpmVal.textContent = Number(ui.bpm.value).toFixed(0);
  ui.fminVal.textContent = Number(ui.fmin.value).toFixed(0);
  ui.fmaxVal.textContent = Number(ui.fmax.value).toFixed(0);
  ui.quantVal.textContent = (+ui.quant.value === 0) ? "Off" : String(+ui.quant.value);
  ui.beatStepsVal.textContent = String(+ui.beatSteps.value);
  ui.dashRatioVal.textContent = Number(ui.dashRatio.value).toFixed(2);
}
