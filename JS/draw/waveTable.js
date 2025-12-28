export const TABLE_SIZE = 2048;

export function buildWaveTable({ waveDrawn, W, H, smooth }) {
  const ys = waveDrawn.slice();
  let first = ys.findIndex(v => v !== null);
  if (first === -1) return null;

  let last = ys.length - 1 - [...ys].reverse().findIndex(v => v !== null);

  for (let i = 0; i < first; i++) ys[i] = ys[first];
  for (let i = last + 1; i < ys.length; i++) ys[i] = ys[last];

  //interpolate gaps
  let i = 0;
  while (i < ys.length) {
    if (ys[i] !== null) { i++; continue; }
    let j = i;
    while (j < ys.length && ys[j] === null) j++;
    const y0 = ys[i - 1], y1 = ys[j];
    const gap = j - (i - 1);
    for (let k = i; k < j; k++) {
      const t = (k - (i - 1)) / gap;
      ys[k] = Math.round(y0 + t * (y1 - y0));
    }
    i = j;
  }

  const out = new Float32Array(TABLE_SIZE);
  for (let n = 0; n < TABLE_SIZE; n++) {
    const x = n * (W - 1) / (TABLE_SIZE - 1);
    const x0 = Math.floor(x), x1 = Math.min(W - 1, x0 + 1);
    const t = x - x0;
    const y = ys[x0] * (1 - t) + ys[x1] * t;
    out[n] = 1 - (y / (H - 1)) * 2;
  }

  //smoothing
  const a = smooth;
  if (a > 0) {
    let prev = out[0];
    for (let n = 1; n < out.length; n++) {
      prev = a * prev + (1 - a) * out[n];
      out[n] = prev;
    }
  }

  //normalize&remove DC
  let mean = 0;
  for (let n = 0; n < out.length; n++) mean += out[n];
  mean /= out.length;

  let maxAbs = 0;
  for (let n = 0; n < out.length; n++) {
    out[n] -= mean;
    maxAbs = Math.max(maxAbs, Math.abs(out[n]));
  }
  if (maxAbs > 1e-6) {
    const g = 1 / maxAbs;
    for (let n = 0; n < out.length; n++) out[n] *= g;
  }

  //crossfade
  const fade = 32;
  for (let k = 0; k < fade; k++) {
    const t = k / (fade - 1);
    out[k] = out[k] * t + out[out.length - fade + k] * (1 - t);
  }
  out[out.length - 1] = out[0];

  return out;
}
