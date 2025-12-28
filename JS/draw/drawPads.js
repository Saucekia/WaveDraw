import { clamp } from "../utils/clamp.js";

export function initDrawPads(ui, { onWaveChanged, onTimeChanged }) {
  // Wave
  const wCtx = ui.wavePad.getContext("2d");
  const W = ui.wavePad.width, H = ui.wavePad.height;
  let waveDrawn = new Array(W).fill(null);
  let waveIsDown = false;
  const lastWave = { v: null };

  // Time
  const tCtx = ui.timePad.getContext("2d");
  const TW = ui.timePad.width, TH = ui.timePad.height;
  let timeLine = new Array(TW).fill(null);
  let timeIsDown = false;
  const lastTime = { v: null };

  function setStrokePoint(canvas, e, width, height) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (height / rect.height));
    return { x: clamp(x, 0, width - 1), y: clamp(y, 0, height - 1) };
  }

  function drawStrokeIntoArray(arr, lastRef, x, y) {
    arr[x] = y;
    if (lastRef.v) {
      const { lx, ly } = lastRef.v;
      const dx = x - lx;
      const steps = Math.abs(dx);
      if (steps > 1) {
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          const ix = Math.round(lx + t * (x - lx));
          const iy = Math.round(ly + t * (y - ly));
          arr[ix] = iy;
        }
      }
    }
    lastRef.v = { lx: x, ly: y };
  }

  function drawWaveUI() {
    wCtx.clearRect(0, 0, W, H);
    wCtx.fillStyle = "#fff"; wCtx.fillRect(0, 0, W, H);
    wCtx.strokeStyle = "#e5e5e5"; wCtx.lineWidth = 1;
    wCtx.beginPath(); wCtx.moveTo(0, H / 2); wCtx.lineTo(W, H / 2); wCtx.stroke();

    wCtx.strokeStyle = "#111"; wCtx.lineWidth = 2;
    wCtx.beginPath();
    let started = false;
    for (let x = 0; x < W; x++) {
      const y = waveDrawn[x];
      if (y === null) { started = false; continue; }
      if (!started) { wCtx.moveTo(x, y); started = true; }
      else wCtx.lineTo(x, y);
    }
    wCtx.stroke();
    wCtx.strokeStyle = "#bbb"; wCtx.lineWidth = 1;
    wCtx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }

  function drawTimeUI(playheadX = null) {
    tCtx.clearRect(0, 0, TW, TH);
    tCtx.fillStyle = "#fff"; tCtx.fillRect(0, 0, TW, TH);

    tCtx.strokeStyle = "#eee"; tCtx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      tCtx.beginPath();
      tCtx.moveTo(0, (TH * i) / 4); tCtx.lineTo(TW, (TH * i) / 4);
      tCtx.stroke();
    }
    tCtx.beginPath(); tCtx.moveTo(0, TH / 2); tCtx.lineTo(TW, TH / 2); tCtx.stroke();

    tCtx.strokeStyle = "#111"; tCtx.lineWidth = 2;
    tCtx.beginPath();
    let started = false;
    for (let x = 0; x < TW; x++) {
      const y = timeLine[x];
      if (y === null) { started = false; continue; }
      if (!started) { tCtx.moveTo(x, y); started = true; }
      else tCtx.lineTo(x, y);
    }
    tCtx.stroke();

    if (playheadX !== null) {
      tCtx.strokeStyle = "#0a0"; tCtx.lineWidth = 2;
      tCtx.beginPath(); tCtx.moveTo(playheadX + 0.5, 0); tCtx.lineTo(playheadX + 0.5, TH); tCtx.stroke();
    }

    tCtx.strokeStyle = "#bbb"; tCtx.lineWidth = 1;
    tCtx.strokeRect(0.5, 0.5, TW - 1, TH - 1);
  }

  // Events: wave
  ui.wavePad.addEventListener("pointerdown", (e) => {
    waveIsDown = true;
    ui.wavePad.setPointerCapture(e.pointerId);
    lastWave.v = null;
    const p = setStrokePoint(ui.wavePad, e, W, H);
    drawStrokeIntoArray(waveDrawn, lastWave, p.x, p.y);
    drawWaveUI();
    onWaveChanged();
  });

  ui.wavePad.addEventListener("pointermove", (e) => {
    if (!waveIsDown) return;
    const p = setStrokePoint(ui.wavePad, e, W, H);
    drawStrokeIntoArray(waveDrawn, lastWave, p.x, p.y);
    drawWaveUI();
    onWaveChanged();
  });

  ui.wavePad.addEventListener("pointerup", () => { waveIsDown = false; lastWave.v = null; });

  // Events: time
  ui.timePad.addEventListener("pointerdown", (e) => {
    timeIsDown = true;
    ui.timePad.setPointerCapture(e.pointerId);
    lastTime.v = null;
    const p = setStrokePoint(ui.timePad, e, TW, TH);
    drawStrokeIntoArray(timeLine, lastTime, p.x, p.y);
    drawTimeUI();
    onTimeChanged();
  });

  ui.timePad.addEventListener("pointermove", (e) => {
    if (!timeIsDown) return;
    const p = setStrokePoint(ui.timePad, e, TW, TH);
    drawStrokeIntoArray(timeLine, lastTime, p.x, p.y);
    drawTimeUI();
    onTimeChanged();
  });

  ui.timePad.addEventListener("pointerup", () => { timeIsDown = false; lastTime.v = null; });

  function makeSineWave() {
    waveDrawn.fill(null);
    for (let x = 0; x < W; x++) {
      const t = x / (W - 1);
      const s = Math.sin(t * Math.PI * 2);
      const y = (1 - (s * 0.9 + 1) / 2) * (H - 1);
      waveDrawn[x] = Math.round(y);
    }
    drawWaveUI();
    onWaveChanged();
  }

  function initDefaultTime() {
    timeLine.fill(null);
    for (let x = 0; x < TW; x++) {
      const t = x / (TW - 1);
      const y = Math.round((1 - t) * (TH - 1));
      timeLine[x] = y;
    }
    drawTimeUI();
    onTimeChanged();
  }

  function clearWave() {
    waveDrawn.fill(null);
    drawWaveUI();
    onWaveChanged();
  }

  function clearTime() {
    timeLine.fill(null);
    drawTimeUI();
    onTimeChanged();
  }

  function setWaveFromArray(mapped) {
    waveDrawn = mapped;
    drawWaveUI();
  }

  return {
    getWaveState: () => ({ waveDrawn, W, H }),
    getTimeState: () => ({ timeLine, TW, TH }),
    setWaveFromArray,
    drawTimeUI,
    drawWaveUI,
    makeSineWave,
    initDefaultTime,
    clearWave,
    clearTime,
  };
}
