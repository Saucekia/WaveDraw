export const WORKLET_PROCESSOR_NAME = "draw-time-osc";

export function getWorkletCode() {
  
  return `
  class DrawTimeOsc extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        { name: 'bpm', defaultValue: 120, minValue: 20, maxValue: 400 },
        { name: 'fmin', defaultValue: 110, minValue: 0, maxValue: 20000 },
        { name: 'fmax', defaultValue: 880, minValue: 0, maxValue: 20000 },
        { name: 'beatGain', defaultValue: 0.35, minValue: 0, maxValue: 1 },
        { name: 'beatSteps', defaultValue: 16, minValue: 1, maxValue: 64 },
      ];
    }
    constructor() {
      super();
      this.time = new Float32Array(2048);
      this.time.fill(-1);
      this.waveVoices = [];
      this.wavePhase = 0;

      this.beatLanes = [];
      this.drumEnvs = new Float32Array(0);
      this.drumTonePhases = new Float32Array(0);
      this.drumDecays = new Float32Array(0);

      this.barPhase = 0;
      this.lastStep = -1;

      this.port.onmessage = (e) => {
        if (!e.data) return;
        if (e.data.type === 'time' && e.data.time) {
          this.time = new Float32Array(e.data.time);
        }
        if (e.data.type === 'waves' && e.data.waves) {
          this.waveVoices = e.data.waves.map(w => new Float32Array(w.wave));
        }
        if (e.data.type === 'beats' && e.data.beats) {
          this.beatLanes = e.data.beats.map(b => new Int8Array(b.beat));
          this.drumEnvs = new Float32Array(this.beatLanes.length);
          this.drumTonePhases = new Float32Array(this.beatLanes.length);
          this.drumDecays = new Float32Array(this.beatLanes.length);
          for (let i = 0; i < this.beatLanes.length; i++) this.drumDecays[i] = 0.012;
        }
      };
    }
    _noise() { return (Math.random() * 2 - 1); }

    process(inputs, outputs, params) {
      const out = outputs[0][0];
      const sr = sampleRate;

      const bpmArr = params.bpm;
      const fminArr = params.fmin;
      const fmaxArr = params.fmax;
      const beatGainArr = params.beatGain;
      const beatStepsArr = params.beatSteps;

      const timeN = this.time.length;

      for (let i = 0; i < out.length; i++) {
        const bpm = bpmArr.length > 1 ? bpmArr[i] : bpmArr[0];
        const fmin = fminArr.length > 1 ? fminArr[i] : fminArr[0];
        const fmax = fmaxArr.length > 1 ? fmaxArr[i] : fmaxArr[0];
        const beatGain = beatGainArr.length > 1 ? beatGainArr[i] : beatGainArr[0];
        const beatSteps = Math.max(1, Math.floor(beatStepsArr.length > 1 ? beatStepsArr[i] : beatStepsArr[0]));

        const barsPerSecond = (bpm / 60) / 4;
        this.barPhase += barsPerSecond / sr;
        this.barPhase -= Math.floor(this.barPhase);

        const stepIdx = Math.floor(this.barPhase * beatSteps);
        if (stepIdx !== this.lastStep) {
          this.lastStep = stepIdx;
          for (let l = 0; l < this.beatLanes.length; l++) {
            const lane = this.beatLanes[l];
            const v = stepIdx < lane.length ? lane[stepIdx] : 0;
            if (v === 1) { this.drumEnvs[l] = 1.0; this.drumDecays[l] = 0.012; }
            if (v === 2) { this.drumEnvs[l] = 1.0; this.drumDecays[l] = 0.030; }
          }
        }

        const tIdx = this.barPhase * (timeN - 1);
        const t0 = tIdx | 0;
        const t1 = (t0 + 1) % timeN;
        const tt = tIdx - t0;
        const timeVal = this.time[t0] * (1 - tt) + this.time[t1] * tt;

        let sig = 0;

        if (timeVal >= 0 && this.waveVoices.length) {
          const u = Math.max(0, Math.min(1, timeVal));
          const f = fmin * Math.pow((fmax / Math.max(1e-6, fmin)), u);

          this.wavePhase += f / sr;
          this.wavePhase -= Math.floor(this.wavePhase);

          const N = 2048;
          const wIdx = this.wavePhase * (N - 1);
          const w0 = wIdx | 0;
          const w1 = (w0 + 1) % N;
          const wt = wIdx - w0;

          const inv = 1 / this.waveVoices.length;
          for (let v = 0; v < this.waveVoices.length; v++) {
            const w = this.waveVoices[v];
            sig += (w[w0] * (1 - wt) + w[w1] * wt) * inv;
          }
        }

        let drumSum = 0;
        for (let l = 0; l < this.drumEnvs.length; l++) {
          let env = this.drumEnvs[l];
          if (env > 1e-4) {
            env *= (1.0 - this.drumDecays[l]);
            this.drumEnvs[l] = env;

            const base = 140 + 45 * l;
            const f = base + 160 * env;
            this.drumTonePhases[l] += f / sr;
            this.drumTonePhases[l] -= Math.floor(this.drumTonePhases[l]);

            const tone = Math.sin(this.drumTonePhases[l] * Math.PI * 2);
            const noise = this._noise();
            drumSum += (0.7 * noise + 0.6 * tone) * env;
          }
        }
        if (this.drumEnvs.length) drumSum *= (1 / this.drumEnvs.length);
        sig += drumSum * beatGain;

        out[i] = sig;
      }
      return true;
    }
  }
  registerProcessor('${WORKLET_PROCESSOR_NAME}', DrawTimeOsc);
  `;
}
