import { getUI } from "./ui/dom.js";
import { initTabs } from "./ui/tabs.js";
import { updateLabels } from "./ui/labels.js";

import { initDrawPads } from "./draw/drawPads.js";
import { buildWaveTable } from "./draw/waveTable.js";
import { buildTimeBuffer } from "./draw/timeBuffer.js";
import { createBeatPreview } from "./draw/beatPreview.js";

import { createAudioEngine } from "./audio/engine.js";

import { createCamera } from "./camera/camera.js";
import { createDomainsStore } from "./camera/domains.js";
import { initDomainsUI } from "./camera/domainsUI.js";
import { createDomainsOverlay } from "./camera/domainsOverlay.js";
import { createMainLoop } from "./camera/mainLoop.js";
import { createScanner, classifyBeatFromHitArray } from "./camera/scan.js"; // classify exported too

(async function main() {
  const ui = getUI();
  initTabs(ui);

  updateLabels(ui);

  const beatPreview = createBeatPreview(ui.beatPreview);

  const audioEngine = createAudioEngine(ui);


  const pads = initDrawPads(ui, {
    onWaveChanged: () => pushWaveFromDraw(),
    onTimeChanged: () => pushTimeFromDraw(),
  });


  pads.makeSineWave();
  pads.initDefaultTime();

  
  const domainsStore = createDomainsStore();
  const camera = createCamera(ui);

  const overlay = createDomainsOverlay(ui, camera, domainsStore);
  const domainsUI = initDomainsUI(ui, domainsStore, overlay.drawCamUI);

  
  const imgProc = camera.createImageProc();

  
  const scanner = createScanner(
    ui,
    audioEngine,
    pads,
    domainsStore,
    overlay,
    imgProc,
    beatPreview
  );

 
  const loop = createMainLoop(ui, domainsStore, overlay.drawCamUI, scanner);


  function pushWaveFromDraw() {
    if (!audioEngine.isReady()) return;
    const { waveDrawn, W, H } = pads.getWaveState();
    const table = buildWaveTable({ waveDrawn, W, H, smooth: +ui.smooth.value });
    if (!table) return;
    audioEngine.postWaves([{ id: "manual-wavepad", wave: table }]);
  }

  function pushTimeFromDraw() {
    if (!audioEngine.isReady()) return;
    const { timeLine, TW, TH } = pads.getTimeState();
    const buf = buildTimeBuffer({ timeLine, TW, TH, quantSteps: +ui.quant.value });
    audioEngine.postTime(buf);
  }


  ui.playBtn.addEventListener("click", async () => {
    await audioEngine.togglePlay();
    
    audioEngine.setParams();
    pushWaveFromDraw();
    pushTimeFromDraw();
  });

  ui.sineWaveBtn.addEventListener("click", () => pads.makeSineWave());
  ui.clearWaveBtn.addEventListener("click", () => pads.clearWave());
  ui.clearTimeBtn.addEventListener("click", () => pads.clearTime());

 
  const relabel = () => updateLabels(ui);

  ui.gain.addEventListener("input", () => { relabel(); audioEngine.setMasterGain(+ui.gain.value); });
  ui.beatGain.addEventListener("input", () => { relabel(); audioEngine.setParams(); });
  ui.bpm.addEventListener("input", () => { relabel(); audioEngine.setParams(); });
  ui.fmin.addEventListener("input", () => { relabel(); audioEngine.setParams(); });
  ui.fmax.addEventListener("input", () => { relabel(); audioEngine.setParams(); });

  ui.smooth.addEventListener("input", () => { relabel(); pushWaveFromDraw(); });
  ui.quant.addEventListener("input", () => { relabel(); pushTimeFromDraw(); });

  ui.thresh.addEventListener("input", relabel);
  ui.fps.addEventListener("input", relabel);

  ui.beatSteps.addEventListener("input", () => {
    relabel();
    audioEngine.setParams();
    beatPreview.setLength(+ui.beatSteps.value);
  });

  ui.dashRatio.addEventListener("input", relabel);

  
  ui.scanWaveBtn.addEventListener("click", () => {
    domainsStore.getFlags().scanWave = !domainsStore.getFlags().scanWave;
    ui.scanWaveBtn.textContent = domainsStore.getFlags().scanWave ? "Scan Wave ON" : "Scan Wave OFF";
  });
  ui.scanTimeBtn.addEventListener("click", () => {
    domainsStore.getFlags().scanTime = !domainsStore.getFlags().scanTime;
    ui.scanTimeBtn.textContent = domainsStore.getFlags().scanTime ? "Scan Time ON" : "Scan Time OFF";
  });
  ui.scanBeatBtn.addEventListener("click", () => {
    domainsStore.getFlags().scanBeat = !domainsStore.getFlags().scanBeat;
    ui.scanBeatBtn.textContent = domainsStore.getFlags().scanBeat ? "Scan Beat ON" : "Scan Beat OFF";
  });

 
  ui.camBtn.addEventListener("click", async () => {
    try {
      if (camera.isRunning()) {
        loop.stop();
        camera.stop();
        domainsStore.clearRuntime();
        overlay.drawCamUI();
        return;
      }

      const stream = await camera.start();
      domainsStore.setRuntime({ stream, video: camera.video });
      loop.start();
    } catch (err) {
      ui.camStatus.textContent = "Camera error: " + err.message;
      console.error(err);
    }
  });


  
  overlay.drawCamUI();
})();
