export function createImageProc(ui, video) {
  const proc = document.createElement("canvas");
  const procCtx = proc.getContext("2d", { willReadFrequently: true });

  function extractColHits(videoRect, targetW, targetH) {
    proc.width = targetW;
    proc.height = targetH;

    procCtx.drawImage(
      video,
      videoRect.x, videoRect.y, videoRect.w, videoRect.h,
      0, 0, targetW, targetH
    );

    const img = procCtx.getImageData(0, 0, targetW, targetH);
    const d = img.data;
    const threshold = +ui.thresh.value;

    const hit = new Uint8Array(targetW);
    for (let x = 0; x < targetW; x++) {
      let bestGray = 255;
      for (let y = 0; y < targetH; y++) {
        const idx = (y * targetW + x) * 4;
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        const gray = (r * 0.299 + g * 0.587 + b * 0.114) | 0;
        if (gray < bestGray) bestGray = gray;
      }
      hit[x] = (bestGray <= threshold) ? 1 : 0;
    }
    return hit;
  }

  function extractLineY(videoRect, targetW, targetH) {
    proc.width = targetW;
    proc.height = targetH;

    procCtx.drawImage(
      video,
      videoRect.x, videoRect.y, videoRect.w, videoRect.h,
      0, 0, targetW, targetH
    );

    const img = procCtx.getImageData(0, 0, targetW, targetH);
    const d = img.data;
    const threshold = +ui.thresh.value;

    const colY = new Array(targetW).fill(null);
    for (let x = 0; x < targetW; x++) {
      let bestY = 0, bestGray = 255;
      for (let y = 0; y < targetH; y++) {
        const idx = (y * targetW + x) * 4;
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        const gray = (r * 0.299 + g * 0.587 + b * 0.114) | 0;
        if (gray < bestGray) { bestGray = gray; bestY = y; }
      }
      if (bestGray <= threshold) colY[x] = bestY;
    }
    return { colY, h: targetH };
  }

  return { extractColHits, extractLineY };
}
