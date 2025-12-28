import { createImageProc } from "./imageProc.js";

export function createCamera(ui) {
  const camCtx = ui.camView.getContext("2d");

  const video = document.createElement("video");
  video.playsInline = true;
  video.muted = true;

  let stream = null;

  function isRunning() { return !!stream; }

  async function start() {
    if (stream) return stream;

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();

    ui.camStatus.textContent = "Camera: running";
    ui.camBtn.textContent = "Stop Camera";
    return stream;
  }

  function stop() {
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    ui.camStatus.textContent = "Camera: stopped";
    ui.camBtn.textContent = "Start Camera";
  }

  return { camCtx, video, start, stop, isRunning, getStream: () => stream, createImageProc: () => createImageProc(ui, video) };
}
