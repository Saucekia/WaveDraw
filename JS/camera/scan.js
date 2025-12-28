import { buildWaveTable } from "../draw/waveTable.js";
import { buildTimeBuffer } from "../draw/timeBuffer.js";

export function classifyBeatFromHitArray(hit, stepsPerBar, dashRatio) {
  const N = stepsPerBar;
  const out = new Int8Array(N);
  const w = hit.length;
  const stepW = w / N;
  const dashThresh = dashRatio * stepW;

  for (let s = 0; s < N; s++) {
    const x0 = Math.floor(s * stepW);
    const x1 = Math.floor((s + 1) * stepW);

    let maxRun = 0, run = 0;
    for (let x = x0; x < x1; x++) {
      if (hit[x]) { run++; maxRun = Math.max(maxRun, run); }
      else run = 0;
    }

    if (maxRun === 0) out[s] = 0;
    else if (maxRun >= dashThresh) out[s] = 2;
    else out[s] = 1;
  }
  return out;
}

export function createScanner(ui, audioEngine, pads, domainsStore, camMapper, imgProc, beatPreview) {
  function scanWavesAll() {
    const { stream, videoReady } = domainsStore.getRuntime();
    if (!domainsStore.getFlags().scanWave || !stream || !videoReady()) return;
    if (!audioEngine.isReady()) return;

    const waveDomains = domainsStore.getDomains().filter(d => d.role === "wave");
    if (!waveDomains.length) return;

    const { W, H } = pads.getWaveState();
    const smooth = +ui.smooth.value;

    const wavesPayload = [];
    for (const d of waveDomains) {
      const vr = camMapper.domainCanvasToVideoRect(d.rect);
      if (!vr) continue;

      const { colY, h } = imgProc.extractLineY(vr, W, 240);
      const mapped = new Array(W).fill(null);
      for (let x = 0; x < W; x++) {
        const y = colY[x];
        if (y === null) continue;
        mapped[x] = Math.round((y / (h - 1)) * (H - 1));
      }

      const table = buildWaveTable({ waveDrawn: mapped, W, H, smooth });
      if (table) wavesPayload.push({ id: d.id, wave: table });

      const sel = domainsStore.getSelected();
      if (sel && sel.id === d.id) pads.setWaveFromArray(mapped);
    }

    if (wavesPayload.length) audioEngine.postWaves(wavesPayload);
  }

  function scanTimeOne() {
    const { stream, videoReady } = domainsStore.getRuntime();
    if (!domainsStore.getFlags().scanTime || !stream || !videoReady()) return;

    const timeDomains = domainsStore.getDomains().filter(d => d.role === "time");
    if (!timeDomains.length) return;

    const sel = domainsStore.getSelected();
    const d = (sel && sel.role === "time") ? sel : timeDomains[timeDomains.length - 1];

    const vr = camMapper.domainCanvasToVideoRect(d.rect);
    if (!vr) return;

    const { TW, TH } = pads.getTimeState();
    const { colY, h } = imgProc.extractLineY(vr, TW, 200);

    const mapped = new Array(TW).fill(null);
    for (let x = 0; x < TW; x++) {
      const y = colY[x];
      if (y === null) continue;
      mapped[x] = Math.round((y / (h - 1)) * (TH - 1));
    }

    pads.getTimeState().timeLine = mapped; 
  }

  function scanBeatsAll() {
    const { stream, videoReady } = domainsStore.getRuntime();
    if (!domainsStore.getFlags().scanBeat || !stream || !videoReady()) return;
    if (!audioEngine.isReady()) return;

    const beatDomains = domainsStore.getDomains().filter(d => d.role === "beat");
    if (!beatDomains.length) return;

    const steps = +ui.beatSteps.value;
    const dashRatio = +ui.dashRatio.value;

    const beatsPayload = [];
    for (const d of beatDomains) {
      const vr = camMapper.domainCanvasToVideoRect(d.rect);
      if (!vr) continue;

      const hit = imgProc.extractColHits(vr, 640, 60);
      const pattern = classifyBeatFromHitArray(hit, steps, dashRatio);
      beatsPayload.push({ id: d.id, beat: pattern });

      const sel = domainsStore.getSelected();
      if (sel && sel.id === d.id) beatPreview.setPattern(pattern);
    }

    if (beatsPayload.length) audioEngine.postBeats(beatsPayload);

    const sel = domainsStore.getSelected();
    if (!sel || sel.role !== "beat") {
      if (beatsPayload[0]) beatPreview.setPattern(beatsPayload[0].beat);
    }
  }

  function scanAllRoles() {
    scanWavesAll();
    scanTimeOne();
    scanBeatsAll();
  }

  return { scanAllRoles };
}
