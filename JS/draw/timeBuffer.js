import { TABLE_SIZE } from "./waveTable.js";

export function buildTimeBuffer({ timeLine, TW, TH, quantSteps }) {
  const steps = +quantSteps;
  const buf = new Float32Array(TABLE_SIZE);
  buf.fill(-1);

  if (steps > 0) {
    for (let s = 0; s < steps; s++) {
      const x = Math.round((s / steps) * (TW - 1));
      const y = timeLine[x];
      const val = (y === null) ? -1 : (1 - (y / (TH - 1)));
      const start = Math.floor((s / steps) * TABLE_SIZE);
      const end = Math.floor(((s + 1) / steps) * TABLE_SIZE);
      for (let i = start; i < end; i++) buf[i] = val;
    }
    return buf;
  }

  for (let i = 0; i < TABLE_SIZE; i++) {
    const x = i * (TW - 1) / (TABLE_SIZE - 1);
    const x0 = Math.floor(x), x1 = Math.min(TW - 1, x0 + 1);
    const t = x - x0;
    const y0 = timeLine[x0], y1 = timeLine[x1];

    if (y0 === null && y1 === null) { buf[i] = -1; continue; }
    const yy = (y0 === null) ? y1 : (y1 === null) ? y0 : (y0 * (1 - t) + y1 * t);
    buf[i] = 1 - (yy / (TH - 1));
  }
  return buf;
}
